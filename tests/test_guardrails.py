"""
Unit tests for Deterministic Guardrails (app.core.guardrails).
Validates:
1. Timestamp bounds clamping when Gemma hallucinates markers past track duration
2. Leaked stage directive stripping ([calm], [pause], [upbeat])
3. TabPFN numeric truth locking when model output percentages drift
4. Full apply_guardrails pipeline execution
"""

import pytest
from app.core.guardrails import (
    parse_timestamp_to_seconds,
    seconds_to_timestamp,
    sanitize_stage_directives,
    enforce_timestamp_bounds,
    enforce_tabpfn_numeric_truth,
    apply_guardrails
)


def test_parse_and_format_timestamps():
    assert parse_timestamp_to_seconds("03:45") == 225
    assert parse_timestamp_to_seconds("00:10") == 10
    assert parse_timestamp_to_seconds("01:00") == 60
    assert seconds_to_timestamp(225) == "03:45"
    assert seconds_to_timestamp(10) == "00:10"


def test_sanitize_stage_directives_strips_tags():
    raw = "Here is the practice chord [calm] with a steady groove [pause] for deep focus."
    cleaned, tags = sanitize_stage_directives(raw)
    assert "[calm]" not in cleaned
    assert "[pause]" not in cleaned
    assert tags == ["calm", "pause"]
    assert "practice chord with a steady groove for deep focus" in cleaned


def test_sanitize_stage_directives_leaves_clean_text_intact():
    clean_text = "Standard harmonic analysis with clean notation."
    result, tags = sanitize_stage_directives(clean_text)
    assert result == clean_text
    assert len(tags) == 0


def test_enforce_timestamp_bounds_clamps_hallucinated_time():
    # 200 second track (03:20)
    duration = 200
    hallucinated = "The bridge occurs at 05:30 with a return at 01:15."
    corrected, anomalies = enforce_timestamp_bounds(hallucinated, duration)
    assert "05:30" not in corrected
    assert "03:15" in corrected  # clamped to duration - 5s
    assert "01:15" in corrected  # within bounds, untouched
    assert len(anomalies) == 1


def test_enforce_timestamp_bounds_passes_valid_times():
    duration = 300
    text = "Intro at 00:12, verse at 01:45, solo at 03:50."
    corrected, anomalies = enforce_timestamp_bounds(text, duration)
    assert corrected == text
    assert len(anomalies) == 0


def test_enforce_tabpfn_numeric_truth_corrects_drift():
    # TabPFN predicted 34.0% base and 86.0% stripped
    text = "This track delivers approximately 42.0% focus retention, but stripping vocals boosts it to 78.0% probability."
    corrected, corrections = enforce_tabpfn_numeric_truth(
        text,
        verified_focus_pct=34.0,
        verified_vocal_stripped_pct=86.0
    )
    assert "34.0%" in corrected
    assert "86.0%" in corrected
    assert len(corrections) == 2


def test_enforce_tabpfn_numeric_truth_keeps_accurate_numbers():
    text = "TabPFN predicted 86.0% focus retention with clean stems."
    corrected, corrections = enforce_tabpfn_numeric_truth(
        text,
        verified_focus_pct=34.0,
        verified_vocal_stripped_pct=86.0
    )
    assert corrected == text
    assert len(corrections) == 0


def test_full_guardrail_pipeline_clean_case():
    text = "Intro at 01:10 with 85.0% focus retention."
    res = apply_guardrails(
        raw_text=text,
        track_duration_sec=240,
        verified_focus_pct=85.0,
        verified_vocal_stripped_pct=92.0
    )
    assert res["passed_clean"] is True
    assert res["interventions_count"] == 0
    assert res["text"] == text


def test_full_guardrail_pipeline_multiple_anomalies_caught():
    bad_text = "Practice [upbeat] at 07:15 with 45.0% focus retention."
    res = apply_guardrails(
        raw_text=bad_text,
        track_duration_sec=180,  # 3 min track
        verified_focus_pct=85.0,
        verified_vocal_stripped_pct=92.0
    )
    assert res["passed_clean"] is False
    assert res["interventions_count"] >= 2
    assert "[upbeat]" not in res["text"]
    assert "07:15" not in res["text"]


def test_guardrail_empty_input_returns_safe_dict():
    res = apply_guardrails(
        raw_text="",
        track_duration_sec=200,
        verified_focus_pct=80.0,
        verified_vocal_stripped_pct=90.0
    )
    assert res["passed_clean"] is True
    assert res["text"] == ""
    assert res["interventions_count"] == 0


def test_guardrail_exact_boundary_timestamp():
    # 240 seconds = exactly 04:00
    valid_text = "Loop at 04:00 mark."
    res_valid = apply_guardrails(
        raw_text=valid_text,
        track_duration_sec=240,
        verified_focus_pct=80.0,
        verified_vocal_stripped_pct=90.0
    )
    assert "04:00" in res_valid["text"]
    assert res_valid["interventions_count"] == 0

    # 04:01 is 241s on 240s track -> must be clamped to 5s before end (03:55)
    invalid_text = "Loop at 04:01 mark."
    res_clamped = apply_guardrails(
        raw_text=invalid_text,
        track_duration_sec=240,
        verified_focus_pct=80.0,
        verified_vocal_stripped_pct=90.0
    )
    assert "04:01" not in res_clamped["text"]
    assert "03:55" in res_clamped["text"]
    assert res_clamped["passed_clean"] is False


def test_guardrail_handles_subminute_track():
    # Track is only 45 seconds long -> clamp to 40s (00:40)
    bad_text = "Solo enters at 01:10 and ends at 01:25."
    res = apply_guardrails(
        raw_text=bad_text,
        track_duration_sec=45,
        verified_focus_pct=75.0,
        verified_vocal_stripped_pct=85.0
    )
    assert res["passed_clean"] is False
    assert "01:10" not in res["text"]
    assert "00:40" in res["text"]


def test_guardrail_handles_multiple_stage_directives():
    dirty_text = "This [softly] acoustic passage has (whisper) dynamic decay [Allegro]."
    res = apply_guardrails(
        raw_text=dirty_text,
        track_duration_sec=300,
        verified_focus_pct=75.0,
        verified_vocal_stripped_pct=85.0
    )
    assert "[softly]" not in res["text"]
    assert "[Allegro]" not in res["text"]
    assert "acoustic passage" in res["text"]


def test_guardrail_preserves_unrelated_numbers():
    # Frequencies and BPM must not be touched or corrupted
    text = "Tuned to 440Hz at 120 BPM with 1970s hardware saturation. Focus score is 82.0%."
    res = apply_guardrails(
        raw_text=text,
        track_duration_sec=240,
        verified_focus_pct=82.0,
        verified_vocal_stripped_pct=90.0
    )
    assert "440Hz" in res["text"] or "440" in res["text"]
    assert "120 BPM" in res["text"] or "120" in res["text"]
    assert "1970s" in res["text"]
    assert res["passed_clean"] is True

