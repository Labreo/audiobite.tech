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


def test_predict_focus_zero_vocal_presence():
    payload = {
        "track_duration_sec": 240,
        "bpm": 80,
        "vocal_presence_ratio": 0.0,
        "spectral_centroid_hz": 1600.0,
        "energy_decay": 0.85,
        "groove_syncopation": 0.20,
        "user_familiarity_count": 8,
        "circadian_hour": 10
    }
    res = client.post("/api/predict-focus", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["focus_probability_pct"] >= 70.0
    assert data["vocal_presence_evaluated"] == 0.0


def test_predict_focus_maximum_vocal_presence():
    payload = {
        "track_duration_sec": 240,
        "bpm": 130,
        "vocal_presence_ratio": 1.0,
        "spectral_centroid_hz": 3200.0,
        "energy_decay": 0.40,
        "groove_syncopation": 0.65,
        "user_familiarity_count": 1,
        "circadian_hour": 15
    }
    res = client.post("/api/predict-focus", json=payload)
    assert res.status_code == 200
    data = res.json()
    # High vocals should yield lower focus than stem stripped
    assert data["stem_stripped_focus_pct"] > data["focus_probability_pct"]


def test_predict_focus_invalid_payload_returns_422():
    # Pass string instead of int for duration
    bad_payload = {
        "track_duration_sec": "not_a_number",
        "bpm": 90
    }
    res = client.post("/api/predict-focus", json=bad_payload)
    assert res.status_code == 422


def test_telemetry_feedback_with_bug_report_rating():
    payload = {
        "trace_id": "trace-edge-test-999",
        "feedback_text": "Loop marker is 5 seconds late on bridge",
        "rating": "bug_reported"
    }
    res = client.post("/api/telemetry/feedback", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "recorded"
    assert data["rating"] == "bug_reported"


def test_youtube_metadata_endpoint():
    res = client.post("/api/youtube-metadata", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["youtube_id"] == "dQw4w9WgXcQ"
    assert "candidate_windows" in data
    assert len(data["candidate_windows"]) > 0
    assert "deep_link_url" in data


def test_youtube_metadata_invalid_url():
    res = client.post("/api/youtube-metadata", json={"url": "not_a_valid_youtube_link"})
    assert res.status_code == 400


def test_extract_audiobites_endpoint():
    payload = {
        "title": "Huberman Audio Protocol",
        "total_duration_sec": 180,
        "source_url": "https://youtu.be/dQw4w9WgXcQ",
        "youtube_id": "dQw4w9WgXcQ",
        "transcript_text": "The key to focus is managing dopamine baselines. If you constantly spike dopamine, your motivation drops. Take a ten minute walk outside every morning without sunglasses."
    }
    res = client.post("/api/extract-audiobites", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "title" in data
    assert "bites" in data
    assert len(data["bites"]) >= 1
    assert "guardrail_status" in data
    assert "tabpfn_telemetry" in data


def test_stamp_citation_endpoint():
    payload = {
        "title": "Huberman Audio Protocol",
        "source_url": "https://youtu.be/dQw4w9WgXcQ",
        "curator_note": "Key morning motivation protocols.",
        "bites": [
            {
                "start_sec": 12,
                "end_sec": 42,
                "start_mmss": "00:12",
                "end_mmss": "00:42",
                "duration_sec": 30,
                "verbatim_quote": "Take a ten minute walk outside every morning without sunglasses.",
                "key_takeaway": "Morning photon exposure anchors circadian clock.",
                "signal_score_pct": 92.4,
                "loop_recommendation": "Loop 00:12-00:42 for daily reminder.",
                "deep_link_url": "https://youtu.be/dQw4w9WgXcQ?t=12"
            }
        ]
    }
    res = client.post("/api/stamp-citation", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "stamped"
    assert "pdf_base64" in data
    assert len(data["pdf_base64"]) > 500


