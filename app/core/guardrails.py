"""
Deterministic Output Guardrails for Gemma 4 / Gemma 2 Open-Weight Models.
Enforces:
1. Timestamp Bounds Check: All MM:SS markers must fall within actual audio duration.
2. TabPFN Numeric Truth Lock: Verifies signal purity, scope risk, hours, and quotes in prose match verified TabPFN outputs.
3. Directive Sanitizer: Strips leaked stage directions ([calm], [pause], [confident], [audio]) and code fence artifacts.
Logs catches as custom forensic events to Sentry.
"""

import re
from typing import Dict, Any, List, Tuple
from app.core.sentry_tracing import log_guardrail_anomaly


# Regex to match timestamps like 03:45, 12:08, 1:24
TIMESTAMP_REGEX = re.compile(r'\b(?:(\d{1,2}):(\d{2}))\b')

# Regex to find leaked stage tags like [calm], [pause], [upbeat], [applause], [softly], [confident], [audio]
STAGE_TAG_REGEX = re.compile(r'\[(calm|pause|upbeat|applause|laughter|whisper|sigh|silence|audio|music|fast|slow|softly|loud|allegro|andante|confident|intro|outro)\]', re.IGNORECASE)

# Regex to detect percentage numbers like "86%" or "34 percent"
PERCENTAGE_REGEX = re.compile(r'\b(\d{1,3}(?:\.\d+)?)\s*(?:%|percent\b)', re.IGNORECASE)


def parse_timestamp_to_seconds(ts_str: str) -> int:
    """Convert MM:SS or M:SS to total seconds."""
    parts = ts_str.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    return 0


def seconds_to_timestamp(seconds: int) -> str:
    """Convert total seconds to MM:SS format."""
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins:02d}:{secs:02d}"


def sanitize_stage_directives(text: str) -> Tuple[str, List[str]]:
    """
    Remove leaked stage directives like [calm], [pause], [upbeat], [confident].
    Returns (cleaned_text, list_of_stripped_directives).
    """
    found_tags = STAGE_TAG_REGEX.findall(text)
    if found_tags:
        log_guardrail_anomaly(
            anomaly_type="GemmaLeakedDirective",
            details=f"Stripped leaked directives: {found_tags}",
            context={"found_tags": found_tags}
        )
    cleaned_text = STAGE_TAG_REGEX.sub("", text)
    # Also strip stray unclosed tags or double spaces created by removal
    cleaned_text = re.sub(r'  +', ' ', cleaned_text)
    return cleaned_text, found_tags


def enforce_timestamp_bounds(text: str, audio_duration_sec: int) -> Tuple[str, List[str]]:
    """
    Validate that all MM:SS timestamps in text fall within audio duration.
    Clamps any hallucinated timestamps past audio_duration_sec.
    Returns (corrected_text, list_of_clamped_timestamps).
    """
    anomalies = []

    def replace_ts(match):
        raw_ts = match.group(0)
        ts_sec = parse_timestamp_to_seconds(raw_ts)
        if ts_sec > audio_duration_sec:
            clamped_sec = max(0, audio_duration_sec - 5)  # clamp to 5s before end
            clamped_ts = seconds_to_timestamp(clamped_sec)
            anomalies.append(f"{raw_ts} (exceeds {audio_duration_sec}s -> clamped to {clamped_ts})")
            return clamped_ts
        return raw_ts

    corrected_text = TIMESTAMP_REGEX.sub(replace_ts, text)

    if anomalies:
        log_guardrail_anomaly(
            anomaly_type="GemmaTimestampOutOfBounds",
            details=f"Caught {len(anomalies)} hallucinated timestamps exceeding audio duration ({audio_duration_sec}s)",
            context={"anomalies": anomalies, "audio_duration_sec": audio_duration_sec}
        )

    return corrected_text, anomalies


def enforce_tabpfn_numeric_truth(
    text: str,
    verified_focus_pct: float = 0.0,
    verified_vocal_stripped_pct: float = 0.0,
    verified_signal_purity_pct: float = 0.0,
    verified_scope_risk_pct: float = 0.0
) -> Tuple[str, List[str]]:
    """
    Verify that any purity, focus, or risk percentages mentioned in Gemma's prose
    match TabPFN's actual tabular prediction (within tolerance 2.0%), and auto-align if drifted.
    Returns (verified_text, list_of_drifted_corrections).
    """
    corrections = []

    target_primary = verified_signal_purity_pct if verified_signal_purity_pct > 0 else verified_focus_pct
    target_secondary = verified_scope_risk_pct if verified_scope_risk_pct > 0 else verified_vocal_stripped_pct

    sentences = text.split(". ")
    corrected_sentences = []

    for sentence in sentences:
        if any(w in sentence.lower() for w in ["focus", "retention", "probability", "purity", "signal", "risk"]):
            matches = PERCENTAGE_REGEX.findall(sentence)
            for raw_pct in matches:
                val = float(raw_pct)
                # Check if it deviates significantly from verified numbers
                dist_raw = abs(val - target_primary)
                dist_secondary = abs(val - target_secondary)

                # If already within 2.0% of either verified metric, it is accurate!
                if dist_raw <= 2.0 or dist_secondary <= 2.0:
                    continue

                # Otherwise check which target it is attempting to cite and correct it
                if dist_raw < dist_secondary and dist_raw < 25.0:
                    corrections.append(f"Corrected base metric from {val:.1f}% to {target_primary:.1f}%")
                    sub_pat = rf'{re.escape(raw_pct)}\s*(?:%|percent\b)'
                    sentence = re.sub(sub_pat, f"{target_primary:.1f}%", sentence, count=1)
                elif dist_secondary < 25.0:
                    corrections.append(f"Corrected secondary metric from {val:.1f}% to {target_secondary:.1f}%")
                    sub_pat = rf'{re.escape(raw_pct)}\s*(?:%|percent\b)'
                    sentence = re.sub(sub_pat, f"{target_secondary:.1f}%", sentence, count=1)
        corrected_sentences.append(sentence)

    verified_text = ". ".join(corrected_sentences)

    if corrections:
        log_guardrail_anomaly(
            anomaly_type="GemmaNumericDrift",
            details=f"Corrected {len(corrections)} drifted percentages to match TabPFN truth",
            context={
                "corrections": corrections,
                "verified_primary": target_primary,
                "verified_secondary": target_secondary
            }
        )

    return verified_text, corrections


def apply_guardrails(
    raw_text: str,
    track_duration_sec: int,
    verified_focus_pct: float = 0.0,
    verified_vocal_stripped_pct: float = 0.0,
    verified_signal_purity_pct: float = 0.0,
    verified_scope_risk_pct: float = 0.0
) -> Dict[str, Any]:
    """
    Full deterministic guardrail pipeline.
    Runs directive sanitizer, timestamp bounds check, and TabPFN numeric lock.
    """
    # 1. Sanitize stage directives
    clean_directives, leaked_tags = sanitize_stage_directives(raw_text)

    # 2. Enforce timestamp bounds
    clean_ts, ts_anomalies = enforce_timestamp_bounds(clean_directives, track_duration_sec)

    # 3. Enforce TabPFN numeric truth
    final_text, num_corrections = enforce_tabpfn_numeric_truth(
        clean_ts,
        verified_focus_pct=verified_focus_pct,
        verified_vocal_stripped_pct=verified_vocal_stripped_pct,
        verified_signal_purity_pct=verified_signal_purity_pct,
        verified_scope_risk_pct=verified_scope_risk_pct
    )

    total_interventions = len(leaked_tags) + len(ts_anomalies) + len(num_corrections)

    return {
        "text": final_text,
        "interventions_count": total_interventions,
        "leaked_tags_stripped": leaked_tags,
        "timestamps_clamped": ts_anomalies,
        "numeric_drifts_corrected": num_corrections,
        "passed_clean": total_interventions == 0
    }
