# 🎛️ AudioBite.tech — Editorial-Tactile Audio Focus & Practice Studio

> **Hacktoberfest 2026 Week 2 ("Side Hustle") Submission**  
> *Built with Open-Weight Models (`TabPFN-v2` + `Gemma 4`) and an Analog Mastering Desk UI.*

[![CI](https://github.com/Labreo/audiobite.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/Labreo/audiobite.tech/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TabPFN](https://img.shields.io/badge/TabPFN-v2%20Calibrated-orange)](https://github.com/automl/TabPFN)
[![Gemma](https://img.shields.io/badge/Model-Gemma%204%20%2F%20Gemma%202-purple)](https://ai.google.dev/gemma)
[![Sentry](https://img.shields.io/badge/Observability-Sentry%20Tracing-362D59)](https://sentry.io)

---

## 💡 The Problem & The $4.99 Side Hustle Thesis

**440+ people** use my two free YouTube Music browser extensions ([YTM Mini Mode](https://chromewebstore.google.com/detail/ytm-mini-mode/gjhkejjhphkplfdnhflhckfcfhkbfjkl) and [YTM Block](https://chromewebstore.google.com/detail/ytm-block/ocofcglkjbfpfdpjdfchhhjppplkffcl)) every week during deep study and coding sessions. I have maintained them for months across Chrome and Firefox and made **$0.00**.

Instead of ruining the free extensions with ads or subscriptions, I built the tactile **$4.99 Pro Companion Studio** listeners kept asking for:
1. **Numbers Brain (`TabPFN-v2`)**: Evaluated on **88 real logged YouTube Music study sessions**. Predicts deep-work focus retention and skip probability. Users drag a physical **Linear Vocal-Stem Attenuator**: attenuating vocal presence (e.g. `0.78 → 0.08`) jumps focus probability in real-time (e.g. from `34%` to `86%`) with mechanical Web Audio detents.
2. **Words Brain (`Gemma 4`)**: Converts acoustic metrics and track duration into a downloadable **Stamped Parchment Practice & Focus Card (PDF)** with chord progression markers, practice loops, and study takeaways.
3. **Deterministic Guardrails (`guardrails.py`)**: Catches Gemma's failure modes (hallucinated timestamps exceeding track duration, leaked `[calm]` tags, or drifted numbers contradicting TabPFN) and logs forensic traces to Sentry.
4. **Dual-Brain Unit Economics**: `$0.00018/sheet` in cloud mode (DigitalOcean Serverless) for instant zero-friction web trials, alongside a **100% free, offline Local Mode** via local `Ollama` (`gemma2:2b`).

---

## 🔬 "Checked Before Trusted" TabPFN-v2 Backtest

Before trusting model predictions on user focus, we performed an out-of-fold chronological backtest of **TabPFN-v2** against a naive tempo rule and Logistic Regression across all **88 real listening sessions** (`data/ytm_sessions_logged.csv`):

| Model Architecture | Brier Score (Lower is Better) | ROC-AUC | Accuracy | Forensic Finding |
| :--- | :---: | :---: | :---: | :--- |
| **👑 TabPFN-v2 (Prior Labs)** | **0.0172** | **0.9899** | **98.9%** | Catches mid-range vocal transients that naive rules miss |
| **Logistic Regression Baseline** | 0.0621 | 0.9714 | 93.3% | Linear underfitting on harmonic spectral centroids |
| **Naive BPM Rule (<95 BPM)** | 0.2095 | 0.7090 | 70.8% | Misses high-tempo ambient study tracks |

*Reproduce the backtest with:*
```bash
python -m app.core.tabpfn_engine --backtest
```

---

## 🎨 Editorial-Tactile UI Architecture

Inspired by **1970s Braun / Nagra analog mastering desks** and warm parchment index-card presses:
- **Strict Hex Ban**: Zero `#000000` pitch black or `#ffffff` digital white. Styled with warm alabaster (`#f4efe9`), deep charcoal (`#111312`), and warm tinted shadows (`--shadow-warm-sm: #24262226`).
- **Analog Live Film Grain**: 6-frame jitter monochrome texture (`/static/textures/live-grain.png`).
- **3D Spatial Hardware Cutouts**: Vintage analog VU calibration meter, brass 440Hz tuning fork, and tape splice block with `perspective(53rem)` tilt inertia and grab physics.
- **Procedural Haptic Audio**: Low-latency mechanical switch clicks and rotary detents synthesized in real time via the Web Audio API (`HapticAudio`).
- **Typographic Staging**: Masked character stagger and a morphing `&` reel slot that cycles live studio telemetry.

---

## 🚀 Quickstart Guide

### 1. Clone & Set Up Virtual Environment
```bash
git clone https://github.com/Labreo/audiobite.tech.git
cd audiobite.tech

# Using uv (fastest)
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Generate Tactile Assets
```bash
python scripts/generate_tactile_assets.py
```

### 3. Run the Studio Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** to experience the analog workbench.

### 4. Run the Full Test Suite
```bash
pytest -v
```

---

## 🏆 Prize Categories Qualified

1. **Best Use of a .tech Domain ($100)**: Deployed to `audiobite.tech` with automated SSL.
2. **Best Use of TabPFN ($200)**: Real tabular inference on 88 sessions + interactive real-time vocal fader simulation.
3. **Best Use of Sentry Agent Tracing ($100)**: Hierarchical `gen_ai.invoke_agent` transactions with child spans for `ai.tabular.tabpfn` and `gen_ai.chat` + forensic guardrail warning issues.
4. **Best Use of Render ($200)**: Production multi-stage `Dockerfile` and declarative `render.yaml` Blueprint.
5. **Best Use of DigitalOcean ($200)**: Serverless inference cloud brain alongside 1-click Docker deployment.
6. **Best Use of Gemma ($200)**: Dual-Brain Gemma architecture (Cloud DO Gemma + local Ollama Gemma).

---

## 📜 License
MIT License. Copyright (c) 2026 Labreo.
