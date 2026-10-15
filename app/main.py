"""
FastAPI entrypoint for AudioBite.tech / StemNote Studio.
Exposes:
- /api/health (Health check for Render & Docker)
- /api/backtest (TabPFN-v2 88-session evaluation metrics)
- /api/predict-focus (Real-time vocal fader simulation)
- /api/generate-sheet (Dual-Brain Gemma + TabPFN + Guardrails + Sentry Tracing)
- /api/export-pdf (Stamped Parchment Practice Card PDF generator)
- /api/telemetry/feedback (Sentry trace-linked feedback)
- /api/telemetry/checkout-intent (Tracks Pro $4.99 checkout clicks)
"""

import os
import base64
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.core.sentry_tracing import init_sentry, AgentTracer, report_user_feedback
from app.core.tabpfn_engine import tabpfn_engine
from app.core.gemma_brain import gemma_brain
from app.core.pdf_exporter import generate_practice_cheat_sheet_pdf


# Initialize Sentry
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up TabPFN model on startup
    try:
        tabpfn_engine.fit()
        print("✓ TabPFN engine fitted and ready.")
    except Exception as e:
        print(f"⚠️ TabPFN startup warning: {e}")
    yield


app = FastAPI(
    title="AudioBite.tech AI Studio Companion",
    description="Championship Editorial-Tactile Audio Focus & Practice Studio",
    version="0.1.0",
    lifespan=lifespan
)

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


# Pydantic Request Models
class PredictFocusRequest(BaseModel):
    track_duration_sec: int = 240
    bpm: int = 90
    vocal_presence_ratio: float = 0.50
    spectral_centroid_hz: float = 2000.0
    dynamic_range_db: float = 9.0
    hour_of_day: int = 14
    is_lyrics_heavy: int = 0
    prior_artist_skips: int = 0
    mini_mode_active: int = 1


class GenerateSheetRequest(BaseModel):
    track_title: str = "Resonance"
    artist_name: str = "HOME"
    track_duration_sec: int = 212
    bpm: int = 85
    vocal_presence_ratio: float = 0.05
    spectral_centroid_hz: float = 2340.5
    dynamic_range_db: float = 8.1
    hour_of_day: int = 14
    is_lyrics_heavy: int = 0
    prior_artist_skips: int = 0
    mini_mode_active: int = 1


class TelemetryFeedbackRequest(BaseModel):
    trace_id: str
    feedback_text: str
    rating: str = "helpful"  # 'helpful', 'inaccurate', 'bug_reported'


class CheckoutIntentRequest(BaseModel):
    action: str = "click_buy_pro"
    referrer: Optional[str] = None


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": "AudioBite.tech Studio Companion",
        "runtime_mode": settings.ai_runtime_mode,
        "custom_domain": settings.custom_tech_domain,
        "tabpfn_fitted": tabpfn_engine.is_fitted
    }


@app.get("/api/backtest")
def get_backtest_metrics():
    """Returns the 'Checked Before Trusted' 88-session evaluation metrics."""
    try:
        if not tabpfn_engine.backtest_results:
            results = tabpfn_engine.run_backtest()
        else:
            results = tabpfn_engine.backtest_results
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict-focus")
def predict_focus(req: PredictFocusRequest):
    """Real-time vocal fader endpoint called as the user drags the analog slider."""
    try:
        res = tabpfn_engine.predict_focus(req.model_dump(), vocal_override=req.vocal_presence_ratio)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-sheet")
async def generate_sheet(req: GenerateSheetRequest):
    """
    End-to-end pipeline:
    1. Runs TabPFN focus prediction
    2. Runs Gemma 4 / Gemma 2 with Sentry Agent Tracing
    3. Runs Deterministic Guardrails (timestamps + numeric truth)
    4. Generates Stamped Parchment PDF binary
    """
    with AgentTracer(operation_name="gen_ai.invoke_agent", description=f"Sheet Generation: {req.track_title}") as tracer:
        # Step 1: TabPFN Tabular Prediction
        tab_res = tabpfn_engine.predict_focus(req.model_dump(), vocal_override=req.vocal_presence_ratio)
        base_focus = tab_res["focus_probability_pct"]
        stripped_focus = tab_res["stem_stripped_focus_pct"]

        tracer.record_tabpfn_span(
            rows_evaluated=88,
            focus_prob=base_focus,
            stripped_prob=stripped_focus,
            latency_ms=tab_res["latency_ms"]
        )

        # Step 2: Gemma Inference + Guardrail Execution
        gemma_res = await gemma_brain.generate_sheet_content(
            track_title=req.track_title,
            artist_name=req.artist_name,
            duration_sec=req.track_duration_sec,
            bpm=req.bpm,
            vocal_presence_ratio=req.vocal_presence_ratio,
            tabpfn_focus_pct=base_focus,
            tabpfn_stripped_pct=stripped_focus,
            tracer=tracer
        )

        content = gemma_res["content"]
        guardrail_status = gemma_res["guardrail_status"]

        # Step 3: Format duration string MM:SS
        mins = req.track_duration_sec // 60
        secs = req.track_duration_sec % 60
        dur_str = f"{mins:02d}:{secs:02d}"

        # Step 4: Generate Stamped Parchment PDF
        try:
            pdf_bytes = generate_practice_cheat_sheet_pdf(
                track_title=req.track_title,
                artist_name=req.artist_name,
                duration_str=dur_str,
                bpm=req.bpm,
                key_signature=content.get("key_signature", "D Minor"),
                focus_score=base_focus,
                vocal_presence_ratio=req.vocal_presence_ratio,
                optimal_stem_mix=content.get("optimal_stem_mix", "Attenuate vocal stem"),
                summary_notes=content.get("summary_notes", ""),
                practice_markers=content.get("practice_markers", []),
                guardrail_status=guardrail_status
            )
            pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        except Exception as e:
            print(f"⚠️ PDF generation notice: {e}")
            pdf_base64 = ""

        trace_id = tracer.transaction.trace_id if tracer.transaction else "local-trace"

        return {
            "track": {
                "title": req.track_title,
                "artist": req.artist_name,
                "duration": dur_str,
                "bpm": req.bpm
            },
            "tabpfn_metrics": tab_res,
            "sheet_content": content,
            "guardrail_status": guardrail_status,
            "telemetry": gemma_res["telemetry"],
            "trace_id": trace_id,
            "pdf_base64": pdf_base64,
            "checkout_url": settings.checkout_or_waitlist_url
        }


@app.post("/api/telemetry/feedback")
def submit_feedback(req: TelemetryFeedbackRequest):
    """Link user feedback to Sentry trace ID."""
    report_user_feedback(req.trace_id, req.feedback_text, req.rating)
    return {"status": "recorded", "trace_id": req.trace_id, "rating": req.rating}


@app.post("/api/telemetry/checkout-intent")
def record_checkout_intent(req: CheckoutIntentRequest):
    """Track $4.99 Pro unlock clicks."""
    print(f"💰 [Checkout Intent Telemetry] Action: {req.action}, Referrer: {req.referrer}")
    return {
        "status": "intent_recorded",
        "checkout_url": settings.checkout_or_waitlist_url
    }


# Mount Static Files and Serve HTML
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
