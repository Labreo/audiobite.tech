"""
Unit tests for Dual-Brain Gemma Engine (app.core.gemma_brain).
Validates:
1. Brain initialization and mode configuration
2. Content structure (key signature, stem mix, summary, practice markers)
3. Guardrail integration (timestamps clamped, numbers verified)
4. Telemetry and cost accounting ($0.00 in local mode vs per-token cloud calculation)
"""

import pytest
import asyncio
from app.core.gemma_brain import GemmaBrain
from app.core.sentry_tracing import calculate_cost


@pytest.fixture
def brain():
    return GemmaBrain()


def test_calculate_cost_local_vs_cloud():
    # Local mode is always free ($0.00)
    assert calculate_cost(1000, 200, mode="local") == 0.0
    # Cloud mode computes exact cost
    cloud_cost = calculate_cost(1_000_000, 1_000_000, mode="cloud")
    assert cloud_cost == 0.68  # 0.18 + 0.50


@pytest.mark.asyncio
async def test_gemma_generate_sheet_structure(brain):
    res = await brain.generate_sheet_content(
        track_title="Test Resonance",
        artist_name="HOME",
        duration_sec=210,
        bpm=85,
        vocal_presence_ratio=0.05,
        tabpfn_focus_pct=92.0,
        tabpfn_stripped_pct=95.0
    )
    assert "content" in res
    assert "telemetry" in res
    assert "guardrail_status" in res

    content = res["content"]
    assert "key_signature" in content
    assert "optimal_stem_mix" in content
    assert "summary_notes" in content
    assert "practice_markers" in content

    # All practice markers must have valid timestamps <= duration_sec (210s)
    for marker in content["practice_markers"]:
        assert "timestamp" in marker
        ts_parts = marker["timestamp"].split(":")
        secs = int(ts_parts[0]) * 60 + int(ts_parts[1])
        assert secs <= 210


@pytest.mark.asyncio
async def test_gemma_telemetry_fields(brain):
    res = await brain.generate_sheet_content(
        track_title="Weightless",
        artist_name="Marconi Union",
        duration_sec=485,
        bpm=60,
        vocal_presence_ratio=0.02,
        tabpfn_focus_pct=96.5,
        tabpfn_stripped_pct=98.0
    )
    telemetry = res["telemetry"]
    assert "system" in telemetry
    assert "model" in telemetry
    assert "ttft_ms" in telemetry
    assert "cost_usd" in telemetry
    assert telemetry["ttft_ms"] >= 0.0
