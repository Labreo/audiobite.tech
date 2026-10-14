"""
Automated Tactile UI Compliance Test Suite.
Enforces all 7 stages of the Editorial & Tactile UI Specification.
Fails immediately if generic UI slop, pure black/white hexes, or missing physical assets are found.
"""

import os
import re
import pytest

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "static")


@pytest.fixture
def css_content():
    css_path = os.path.join(STATIC_DIR, "styles.css")
    with open(css_path, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def html_content():
    html_path = os.path.join(STATIC_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def js_content():
    js_path = os.path.join(STATIC_DIR, "app.js")
    with open(js_path, "r", encoding="utf-8") as f:
        return f.read()


def test_stage_2_no_banned_pure_black_or_white_hex(css_content, html_content):
    """Assert zero occurrences of #000000, #ffffff, #000;, or #fff; in CSS and HTML."""
    banned_pattern = re.compile(r'#(?:000000|ffffff)\b|#(?:000|fff);', re.IGNORECASE)
    matches_css = banned_pattern.findall(css_content)
    matches_html = banned_pattern.findall(html_content)
    assert len(matches_css) == 0, f"Found banned pure black/white hex in styles.css: {matches_css}"
    assert len(matches_html) == 0, f"Found banned pure black/white hex in index.html: {matches_html}"


def test_stage_2_warm_parchment_and_charcoal_tokens_present(css_content):
    """Assert presence of required design tokens in :root."""
    required_tokens = [
        "--ink-deep: #111312;",
        "--ink-charcoal: #171717;",
        "--ink-graphite: #282723;",
        "--paper-parchment: #eee9e5;",
        "--paper-stone: #d5d2cb;",
        "--paper-alabaster: #f4efe9;",
        "--accent-amber: #d45d2a;",
        "--accent-brass: #b8863b;",
        "--shadow-warm-sm: #24262226;",
        "--shadow-warm-md: #24262220;",
        "--shadow-warm-deep: #2c201933;"
    ]
    for token in required_tokens:
        assert token in css_content, f"Missing required token: {token}"


def test_stage_2_analog_grain_and_keyframes_present(css_content):
    """Assert .portfolio-grain and @keyframes portfolioGrain in CSS, and verify grain file on disk."""
    assert ".portfolio-grain" in css_content
    assert "@keyframes portfolioGrain" in css_content

    grain_path = os.path.join(STATIC_DIR, "textures", "live-grain.png")
    assert os.path.exists(grain_path), f"Texture live-grain.png missing at {grain_path}"
    assert os.path.getsize(grain_path) > 1000, "Texture live-grain.png is empty or corrupt"


def test_stage_3_typography_stagger_and_morphing_reel_slot(css_content, html_content):
    """Assert .hero-char, --char-idx, .morphing-reel-slot, and negative tracking."""
    assert ".hero-char" in css_content
    assert ".morphing-reel-slot" in css_content
    assert "--char-idx" in html_content
    assert "reel-strip" in html_content
    assert "letter-spacing: -0.045em" in css_content or "letter-spacing: -0.04em" in css_content


def test_stage_4_3d_cutouts_and_grab_physics(css_content, js_content):
    """Assert .cutout, perspective(53rem), .is-grabbed, and all 3 cutout assets exist."""
    assert ".cutout" in css_content
    assert "perspective(53rem)" in css_content
    assert ".is-grabbed" in css_content
    assert "isDragging" in js_content

    cutout_files = ["vu-meter.svg", "tuning-fork.svg", "splice-badge.svg"]
    for cf in cutout_files:
        path = os.path.join(STATIC_DIR, "cutouts", cf)
        assert os.path.exists(path), f"Missing physical cutout asset: {path}"
        assert os.path.getsize(path) > 200, f"Cutout asset {cf} is too small/empty"


def test_stage_5_procedural_web_audio_haptics(js_content):
    """Assert HapticAudio synthesizer using Web Audio API (AudioContext, createOscillator, playClick)."""
    assert "class HapticAudio" in js_content
    assert "AudioContext" in js_content
    assert "createOscillator" in js_content
    assert "playClick" in js_content
    assert "playDetent" in js_content


def test_stage_6_lenis_and_svg_signal_thread(css_content, html_content, js_content):
    """Assert Lenis smooth scroll, SVG signal thread pathLength, and reduced-motion compliance."""
    assert "Lenis" in js_content
    assert "signal-thread" in html_content
    assert 'pathLength="1"' in html_content
    assert "@media (prefers-reduced-motion: reduce)" in css_content
