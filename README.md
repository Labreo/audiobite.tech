# 🎙️ AudioBite.tech — The Tactile Voice-Note & Audio-to-Action Studio

> **Hacktoberfest 2026 Week 2 ("Side Hustle") Submission**  
> *Built with Open-Weight Models (`TabPFN-v2` + `Gemma 4`), Web Audio Voice Clarity DSP, and an Analog Mastering Desk UI.*

[![CI](https://github.com/Labreo/audiobite.tech/actions/workflows/ci.yml/badge.svg)](https://github.com/Labreo/audiobite.tech/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TabPFN](https://img.shields.io/badge/TabPFN-v2%20Calibrated-orange)](https://github.com/automl/TabPFN)
[![Gemma](https://img.shields.io/badge/Model-Gemma%204%20%2F%20Gemma%202-purple)](https://ai.google.dev/gemma)
[![Sentry](https://img.shields.io/badge/Observability-Sentry%20Tracing-362D59)](https://sentry.io)
[![Domain](https://img.shields.io/badge/Domain-audiobite.tech-brightgreen)](https://audiobite.tech)

---

## 💡 The Problem: The Voice-Note Chaos Tax

**440+ people** use my two free YouTube Music browser extensions ([YTM Mini Mode](https://chromewebstore.google.com/detail/ytm-mini-mode/gjhkejjhphkplfdnhflhckfcfhkbfjkl) and [YTM Block](https://chromewebstore.google.com/detail/ytm-block/ocofcglkjbfpfdpjdfchhhjppplkffcl)).

Whenever freelance developers, engineering students, and power users reached out, they struggled with the same daily tax:
1. **People hate typing long messages on mobile**, so clients, teammates, and peers send rambling 2-to-5-minute WhatsApp/Telegram voice notes, voice memos, or unstructured audio brain-dumps.
2. **Listening is a tax**: You have to listen through 4 minutes of dead air, "ums", and off-topic tangents just to locate the 30 seconds of actionable scope.
3. **Existing tools fail**: Enterprise meeting software costs $15–$30/month, is bloated for corporate Zoom calls, and outputs raw walls of unedited text without estimating engineering hours or scope risk.

**AudioBite.tech** transforms rambling audio into timestamp-locked **AudioBites**, **engineering scope quotes**, and **stamped PDF action sheets**.

- 🌐 **Target Domain**: [audiobite.tech](https://audiobite.tech)
- 🐙 **Source Code**: [GitHub - Labreo/audiobite.tech](https://github.com/Labreo/audiobite.tech)
- ☕ **Side-Hustle Monetization**: [Buy Me a Coffee — $4.99 Studio Supporter](https://www.buymeacoffee.com/kakeroth)

---

## 🔬 Dual-Brain Architecture: TabPFN v2 + Gemma 4

1. **Numbers Brain (`TabPFN-v2`)**: Evaluated on **88 real logged voice-note and client sessions** (`data/audiobite_sessions_logged.csv`). Analyzes speaking tempo, tangent ratios, action verbs, and blocker uncertainties to predict:
   - **Signal Purity %** (substance vs fluff)
   - **Scope Creep / Ambiguity Risk %**
   - **Action Hours & Suggested Dollar Quote** (@ $40/hr)
2. **Words Brain (`Gemma 4 31B`)**: Distills the audio into:
   - The **30-Second Executive AudioBite**
   - **Timestamp-Locked Action Items with Clickable `[MM:SS]` Audio Jump Links**
   - Ready-to-send **Client Scope Confirmation Reply** and **GitHub Issues Checklist**
3. **Deterministic Guardrails (`app/core/guardrails.py`)**: Catches LLM failure modes (hallucinated timestamps exceeding audio duration, drifted hours/quotes contradicting TabPFN truth) and logs forensic traces directly to **Sentry**.
4. **Zero-Burn Unit Economics ($0.00/month)**: In-container TabPFN runs on standard CPU cores; cloud inference uses Google AI Studio Free Tier ($0.00) with local offline Ollama mode (`gemma4:e2b`). Every $4.99 supporter pass is 100% pure profit from day one.

---

## 🎛️ 3 Zero-Friction Input Modes

- **🎙️ Live In-Browser Mic**: Click the brass REC toggle to record 15–60s voice notes with live waveform telemetry and Web Audio DSP.
- **📂 File Drop / Transcript**: Upload WhatsApp `.ogg`/`.mp3`/`.wav` voice notes or paste raw text.
- **📼 3 Built-in Real Audio Cassettes (1-Click Judge Demo)**:
  - *Sample A*: 2-Minute Chaotic Client WhatsApp Voice Note (telephone bandpass & compression noise).
  - *Sample B*: Distributed Systems Lecture Clip (reverberant lecture hall acoustics).
  - *Sample C*: Studio Podcast Soundbite (crisp dynamic hook).

---

## 📊 "Checked Before Trusted" TabPFN-v2 Backtest

Tested out-of-fold across **88 real voice-note sessions**:

| Model Architecture | Brier Score (Lower is Better) | ROC-AUC | Accuracy | Forensic Finding |
| :--- | :---: | :---: | :---: | :--- |
| **👑 TabPFN-v2 (Prior Labs)** | **0.0172** | **0.9899** | **98.9%** | Discovers non-linear tangent interactions |
| **Logistic Regression Baseline** | 0.0621 | 0.9419 | 92.0% | Underfits on speaker topic shifts |
| **Naive Duration Baseline** | 0.2095 | 0.7412 | 78.4% | Fails on dense, high-signal short audio |

*Reproduce the backtest with:*
```bash
python -m app.core.tabpfn_engine --backtest
```

---

## 🎨 Editorial-Tactile UI Architecture

Built under strict analog hardware laws:
- **Zero Pure Black/White**: Uses warm alabaster (`#f4efe9`), deep charcoal (`#111312`), and warm tinted shadows (`#24262226`).
- **6-Frame Live Film Grain**: Procedural texture (`/static/textures/live-grain.png`).
- **3D Spatial Hardware Cutouts**: Perspective tilt inertia (`perspective(53rem)`) on tape block, tuning fork, and VU meter.
- **Web Audio DSP Filter**: 120Hz high-pass rumble cut + 2.8kHz presence boost engages as you drag the brass Fluff Cutter fader.
- **Procedural Haptic Audio**: Low-latency mechanical switch clicks and rotary detents synthesized in real time via Web Audio API.

---

## 🚀 Quickstart Guide

### 1. Clone & Set Up Virtual Environment
```bash
git clone https://github.com/Labreo/audiobite.tech.git
cd audiobite.tech

uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Run the Studio Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** to experience the analog studio.

### 3. Run the Full 47-Test Suite
```bash
pytest -v
```

---

## 🏆 Prize Categories Qualified

1. **Best Use of Render ($200)**: Production multi-stage `Dockerfile` and declarative `render.yaml` Blueprint deployed on Render's Free Web Service with automated health checks.
2. **Best Use of TabPFN ($200)**: Real `TabPFNClassifier` inference on 88 logged voice-note sessions + interactive real-time Fluff Cutter simulation on pure CPU.
3. **Best Use of Gemma ($200)**: Genuine open-weight Gemma 4 (`gemma-4-31b-it` / `gemma-4-26b-a4b-it`) across Google AI Studio zero-burn cloud inference and offline local Ollama (`gemma4:e2b`).
4. **Best Use of Sentry ($100)**: End-to-end Agent Tracing (`gen_ai.invoke_agent`, `ai.tabular.tabpfn`, `gen_ai.chat`) with live DSN and deterministic guardrail anomaly issue reporting.
5. **Best Use of a .tech Domain ($100)**: Primary registered production domain `audiobite.tech` with automated SSL and DNS routing.

---

## 📜 License
MIT License. Copyright (c) 2026 Labreo.
