"""
Integration tests for FastAPI endpoints (app.main).
Validates:
1. Health check endpoint (/api/health)
2. Backtest evaluation endpoint (/api/backtest)
3. Real-time vocal fader prediction (/api/predict-focus)
4. End-to-end sheet and PDF generation (/api/generate-sheet)
5. Telemetry feedback & checkout intent (/api/telemetry/feedback & /api/telemetry/checkout-intent)
6. Static index.html root serving
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "runtime_mode" in data
    assert "custom_domain" in data
    assert data["custom_domain"] == "audiobite.tech"


def test_backtest_endpoint():
    res = client.get("/api/backtest")
    assert res.status_code == 200
    data = res.json()
    assert "comparison" in data
    assert "ci_coverage_80pct" in data
    assert len(data["comparison"]) == 3


def test_predict_focus_endpoint():
    payload = {
        "track_duration_sec": 212,
        "bpm": 85,
        "vocal_presence_ratio": 0.05,
        "spectral_centroid_hz": 2340.5,
        "dynamic_range_db": 8.1,
        "hour_of_day": 14,
        "is_lyrics_heavy": 0,
        "prior_artist_skips": 0,
        "mini_mode_active": 1
    }
    res = client.post("/api/predict-focus", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "focus_probability_pct" in data
    assert "skip_risk_pct" in data
    assert "stem_stripped_focus_pct" in data
    assert data["focus_probability_pct"] >= 0.0


def test_generate_sheet_endpoint():
    payload = {
        "track_title": "Resonance",
        "artist_name": "HOME",
        "track_duration_sec": 212,
        "bpm": 85,
        "vocal_presence_ratio": 0.05,
        "spectral_centroid_hz": 2340.5,
        "dynamic_range_db": 8.1,
        "hour_of_day": 14,
        "is_lyrics_heavy": 0,
        "prior_artist_skips": 0,
        "mini_mode_active": 1
    }
    res = client.post("/api/generate-sheet", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "track" in data
    assert "tabpfn_metrics" in data
    assert "sheet_content" in data
    assert "guardrail_status" in data
    assert "pdf_base64" in data
    assert len(data["pdf_base64"]) > 500  # Valid ReportLab PDF binary
    assert "buymeacoffee.com/kakeroth" in data["checkout_url"]


def test_telemetry_feedback_endpoint():
    payload = {
        "trace_id": "test-trace-123",
        "feedback_text": "Needle animation and fader detents felt realistic.",
        "rating": "helpful"
    }
    res = client.post("/api/telemetry/feedback", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "recorded"


def test_checkout_intent_endpoint():
    payload = {
        "action": "click_buy_pro",
        "referrer": "test_suite"
    }
    res = client.post("/api/telemetry/checkout-intent", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "intent_recorded"
    assert "buymeacoffee.com/kakeroth" in data["checkout_url"]


def test_root_serves_html():
    res = client.get("/")
    assert res.status_code == 200
    assert "AUDIOBITE" in res.text
    assert "TabPFN" in res.text
    assert "portfolio-grain" in res.text
