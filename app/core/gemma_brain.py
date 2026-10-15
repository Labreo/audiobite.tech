"""
Dual-Brain Gemma 4 / Gemma 2 Engine for AudioBite.tech / StemNote Studio.
Provides 100% genuine, open-weight model inference at $0.00 cost (zero credit card required):
1. Primary Cloud Route: Google AI Studio Free Tier (gemma-4-26b-a4b-it / gemma-4-31b-it) via OpenAI-compatible endpoint
2. Secondary Cloud Route: OpenRouter Free Tier (google/gemma-4-31b-it:free)
3. Local Offline Route: Local Ollama (gemma4:e2b / gemma2:2b) at $0.00 cost
Passes model output through app.core.guardrails to guarantee zero hallucinated timestamps,
zero drifted numbers, and zero leaked directives.
"""

import time
import json
import re
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.core.guardrails import apply_guardrails
from app.core.sentry_tracing import calculate_cost, AgentTracer


STUDIO_SYSTEM_PROMPT = """You are StemNote AI, an expert acoustic study companion and music practice assistant.
You specialize in converting YouTube Music track telemetry and TabPFN acoustic predictions into actionable study and practice cheat sheets.
Rules:
1. Never hallucinate timestamps beyond the given track duration. Every timestamp must be within 00:00 to the track duration.
2. Accurately reflect TabPFN's predicted focus probability and vocal stem attenuation advice in your summary.
3. Do not include raw stage directions like [calm] or [pause].
4. Output valid JSON matching this schema:
{
  "key_signature": "C Major",
  "optimal_stem_mix": "Reduce vocal stem by 70% to optimize coding focus",
  "summary_notes": "A concise 2-3 sentence analysis of how this track impacts deep work...",
  "practice_markers": [
    {"timestamp": "00:15", "chords": "Verse I / Intro", "notes": "Gentle acoustic opening, low distraction"},
    {"timestamp": "01:20", "chords": "Chorus / Hook", "notes": "Dense vocal frequency; strip vocal here"}
  ]
}
"""


class GemmaBrain:
    def __init__(self):
        self.mode = settings.ai_runtime_mode
        self.gemini_key = settings.gemini_api_key
        self.gemma_cloud_endpoint = settings.gemma_cloud_endpoint
        self.gemma_cloud_model = settings.gemma_cloud_model

        self.openrouter_key = settings.openrouter_api_key
        self.openrouter_endpoint = settings.openrouter_endpoint
        self.openrouter_model = settings.openrouter_model

        self.ollama_url = settings.ollama_base_url
        self.ollama_model = settings.ollama_model_id

    async def generate_sheet_content(
        self,
        track_title: str,
        artist_name: str,
        duration_sec: int,
        bpm: int,
        vocal_presence_ratio: float,
        tabpfn_focus_pct: float,
        tabpfn_stripped_pct: float,
        tracer: Optional[AgentTracer] = None
    ) -> Dict[str, Any]:
        """
        Query Gemma 4 (Google AI Studio Free Tier, OpenRouter Free Tier, or Local Ollama)
        and enforce deterministic guardrails on output.
        """
        user_prompt = f"""Analyze this track for deep-work focus and instrumental practice:
- Track: {track_title} by {artist_name}
- Duration: {duration_sec} seconds (do NOT generate timestamps greater than this!)
- Tempo: {bpm} BPM
- Vocal Presence Ratio: {vocal_presence_ratio:.2f}
- TabPFN Predicted Base Focus Retention: {tabpfn_focus_pct:.1f}%
- TabPFN Predicted Vocal-Stripped Focus Retention: {tabpfn_stripped_pct:.1f}%

Return ONLY a valid JSON object matching this structure:
{{
  "key_signature": "D Minor",
  "optimal_stem_mix": "Attenuate vocal stem",
  "summary_notes": "Concise 2-sentence note...",
  "practice_markers": [
    {{"timestamp": "00:45", "chords": "Verse", "notes": "Gentle acoustic entry"}}
  ]
}}"""

        t0 = time.perf_counter()
        raw_text = ""
        input_tokens = len(user_prompt.split()) + 180
        output_tokens = 0
        system_type = "gemma_cloud"
        model_id = self.gemma_cloud_model
        errors = []

        # Route 1: Google AI Studio Free Tier (Gemma 4 MoE / Gemma 4 31B - $0.00, No Credit Card)
        if self.gemini_key:
            models_to_try = [self.gemma_cloud_model, "gemma-4-31b-it"]
            # Deduplicate while preserving order
            seen = set()
            models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

            for candidate_model in models_to_try:
                try:
                    headers = {
                        "Authorization": f"Bearer {self.gemini_key}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "model": candidate_model,
                        "messages": [
                            {"role": "user", "content": f"{STUDIO_SYSTEM_PROMPT}\n\n{user_prompt}"}
                        ],
                        "temperature": 0.2,
                        "max_tokens": 2400
                    }
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        resp = await client.post(
                            f"{self.gemma_cloud_endpoint}/chat/completions",
                            headers=headers,
                            json=payload
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            raw_text = data["choices"][0]["message"]["content"]
                            system_type = "google_ai_studio_gemma4"
                            model_id = candidate_model
                            usage = data.get("usage", {})
                            input_tokens = usage.get("prompt_tokens", input_tokens)
                            output_tokens = usage.get("completion_tokens", len(raw_text.split()))
                            break
                        else:
                            errors.append(f"Google AI Studio ({candidate_model}) error {resp.status_code}: {resp.text[:120]}")
                except Exception as e:
                    errors.append(f"Google AI Studio ({candidate_model}) exception: {repr(e)}")

        # Route 2: OpenRouter Free Tier (Gemma 4 31B Free - $0.00, No Credit Card)
        if not raw_text and self.openrouter_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://audiobite.tech",
                    "X-Title": "AudioBite Studio Companion"
                }
                payload = {
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "user", "content": f"{STUDIO_SYSTEM_PROMPT}\n\n{user_prompt}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 2400
                }
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(
                        f"{self.openrouter_endpoint}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_text = data["choices"][0]["message"]["content"]
                        system_type = "openrouter_gemma4_free"
                        model_id = self.openrouter_model
                        usage = data.get("usage", {})
                        input_tokens = usage.get("prompt_tokens", input_tokens)
                        output_tokens = usage.get("completion_tokens", len(raw_text.split()))
                    else:
                        errors.append(f"OpenRouter error {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                errors.append(f"OpenRouter exception: {e}")

        # Route 3: Local Offline Ollama Mode ($0.00)
        if not raw_text:
            try:
                payload = {
                    "model": self.ollama_model,
                    "messages": [
                        {"role": "system", "content": STUDIO_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 800}
                }
                async with httpx.AsyncClient(timeout=45.0) as client:
                    resp = await client.post(f"{self.ollama_url}/api/chat", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_text = data.get("message", {}).get("content", "")
                        system_type = "ollama_local_gemma"
                        model_id = self.ollama_model
                        output_tokens = len(raw_text.split())
                    else:
                        errors.append(f"Ollama error {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                errors.append(f"Ollama exception: {e}")

        if not raw_text:
            raise RuntimeError(
                f"Gemma 4 inference failed across all free open-weight routes. Errors: {'; '.join(errors)}"
            )

        # Strip internal thought tags from Gemma 4 reasoning output
        cleaned_text = re.sub(r'<thought>[\s\S]*?</thought>', '', raw_text).strip()
        cleaned_text = re.sub(r'```(?:json)?', '', cleaned_text)
        cleaned_text = re.sub(r'```', '', cleaned_text).strip()

        # Extract JSON substring between the first '{' and the last '}'
        first_brace = cleaned_text.find('{')
        last_brace = cleaned_text.rfind('}')
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_str = cleaned_text[first_brace:last_brace + 1].strip()
        else:
            json_str = cleaned_text

        ttft_ms = round((time.perf_counter() - t0) * 1000, 2)
        cost_usd = 0.0  # Open-weight free tiers are $0.00

        if tracer:
            tracer.record_gemma_span(
                system_type=system_type,
                model_id=model_id,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                ttft_ms=ttft_ms,
                cost_usd=cost_usd
            )

        # Parse JSON from model response
        try:
            parsed = json.loads(json_str)
        except Exception as err:
            raise ValueError(f"Could not parse valid JSON from Gemma response ({err}): {json_str[:250]}")

        # Apply deterministic guardrails to summary notes and timestamps
        notes_guardrail = apply_guardrails(
            raw_text=parsed.get("summary_notes", ""),
            track_duration_sec=duration_sec,
            verified_focus_pct=tabpfn_focus_pct,
            verified_vocal_stripped_pct=tabpfn_stripped_pct
        )
        parsed["summary_notes"] = notes_guardrail["text"]

        # Validate each practice marker's timestamp against track_duration_sec
        corrected_markers = []
        for marker in parsed.get("practice_markers", []):
            raw_ts = marker.get("timestamp", "00:00")
            ts_guardrail = apply_guardrails(
                raw_text=raw_ts,
                track_duration_sec=duration_sec,
                verified_focus_pct=tabpfn_focus_pct,
                verified_vocal_stripped_pct=tabpfn_stripped_pct
            )
            marker["timestamp"] = ts_guardrail["text"]
            corrected_markers.append(marker)
        parsed["practice_markers"] = corrected_markers

        return {
            "content": parsed,
            "telemetry": {
                "system": system_type,
                "model": model_id,
                "ttft_ms": ttft_ms,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cost_usd": cost_usd
            },
            "guardrail_status": notes_guardrail
        }


gemma_brain = GemmaBrain()
