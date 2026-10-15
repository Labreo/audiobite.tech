"""
Unit tests for Stamped Parchment Practice Card PDF Exporter (app.core.pdf_exporter).
Validates:
1. Generation of valid PDF binaries (%PDF magic bytes)
2. Handling of track metadata, key signatures, and practice markers
3. Robustness against empty marker lists or edge case inputs
4. Rendering of certified guardrail stamps and anomaly warnings
"""

import pytest
from app.core.pdf_exporter import generate_practice_cheat_sheet_pdf


def test_generate_pdf_returns_valid_pdf_magic_bytes():
    pdf_bytes = generate_practice_cheat_sheet_pdf(
        track_title="Resonance Echoes",
        artist_name="Nils Frahm",
        duration_str="04:24",
        bpm=86,
        key_signature="D Minor",
        focus_score=92.4,
        vocal_presence_ratio=0.15,
        optimal_stem_mix="Attenuate vocals by 12dB",
        summary_notes="Deep focus study track with gentle Rhodes and acoustic decay.",
        practice_markers=[
            {"timestamp_formatted": "00:45", "section_label": "Theme Introduction", "musical_cue": "Rhodes enters softly"},
            {"timestamp_formatted": "02:15", "section_label": "Chord Progression", "musical_cue": "Bass swell Dm to Bb"}
        ],
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_empty_markers_succeeds():
    pdf_bytes = generate_practice_cheat_sheet_pdf(
        track_title="Ambient Drone Solo",
        artist_name="Brian Eno",
        duration_str="06:30",
        bpm=60,
        key_signature="C Major",
        focus_score=97.8,
        vocal_presence_ratio=0.0,
        optimal_stem_mix="Zero vocal presence detected. Preserve master.",
        summary_notes="Static harmonic wash ideal for intense reading.",
        practice_markers=[],
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_multiple_markers_succeeds():
    markers = [
        {"timestamp_formatted": f"0{i}:15", "section_label": f"Movement {i}", "musical_cue": f"Cadence shift in key {i}"}
        for i in range(1, 6)
    ]
    pdf_bytes = generate_practice_cheat_sheet_pdf(
        track_title="Symphonic Focus Suite",
        artist_name="Max Richter",
        duration_str="08:12",
        bpm=72,
        key_signature="A Minor",
        focus_score=88.5,
        vocal_presence_ratio=0.05,
        optimal_stem_mix="Preserve acoustic strings",
        summary_notes="Multi-movement neoclassical suite with staggered rhythmic detents.",
        practice_markers=markers,
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_guardrail_anomalies_renders():
    pdf_bytes = generate_practice_cheat_sheet_pdf(
        track_title="Overtime Hallucination",
        artist_name="Gemma Test Bed",
        duration_str="03:00",
        bpm=120,
        key_signature="G Major",
        focus_score=64.0,
        vocal_presence_ratio=0.85,
        optimal_stem_mix="Mute vocal stem to recover focus",
        summary_notes="Vocals induce high cognitive friction. Strip completely.",
        practice_markers=[
            {"timestamp_formatted": "03:00", "section_label": "Clamped Loop Point", "musical_cue": "End of playable audio"}
        ],
        guardrail_status={
            "passed": False,
            "anomalies_detected": ["Clamped hallucinated timestamp 04:12 to 03:00", "Corrected numeric drift 72.0% -> 64.0%"]
        }
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_with_unicode_and_special_chars():
    pdf_bytes = generate_practice_cheat_sheet_pdf(
        track_title="Café & L'Après-Midi — Écho",
        artist_name="Sébastien Tellier",
        duration_str="03:45",
        bpm=95,
        key_signature="F# Minor",
        focus_score=78.2,
        vocal_presence_ratio=0.35,
        optimal_stem_mix="Attenuate vocal lead by 6dB",
        summary_notes="French downtempo electronic with lush analog synthesizers.",
        practice_markers=[
            {"timestamp_formatted": "01:20", "section_label": "Refrain", "musical_cue": "Vocoder & analog filter sweep"}
        ],
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")


def test_generate_pdf_extreme_focus_scores():
    # Test 0.0% and 100.0% edge cases
    pdf_low = generate_practice_cheat_sheet_pdf(
        track_title="Chaotic Noise",
        artist_name="Merzbow",
        duration_str="01:30",
        bpm=180,
        key_signature="Atonal",
        focus_score=0.0,
        vocal_presence_ratio=1.0,
        optimal_stem_mix="Total acoustic redesign needed",
        summary_notes="Extremely high cognitive disruption.",
        practice_markers=[],
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert pdf_low.startswith(b"%PDF-")

    pdf_high = generate_practice_cheat_sheet_pdf(
        track_title="Pure Alpha Waves",
        artist_name="Binaural Lab",
        duration_str="15:00",
        bpm=50,
        key_signature="B Minor",
        focus_score=100.0,
        vocal_presence_ratio=0.0,
        optimal_stem_mix="Zero adjustment required",
        summary_notes="Optimal acoustic steady state for deep problem solving.",
        practice_markers=[],
        guardrail_status={"passed": True, "anomalies_detected": []}
    )
    assert pdf_high.startswith(b"%PDF-")
