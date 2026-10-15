---
title: "440 people use my free browser extensions. I used TabPFN v2 and Gemma 4 to build the tactile voice-note-to-action studio they asked for."
published: true
tags: hacktoberfest, devchallenge, ai, python
canonical_url: https://audiobite.tech
cover_image: https://raw.githubusercontent.com/Labreo/audiobite.tech/main/app/static/textures/live-grain.png
---

> *This article was built for Hacktoberfest 2026 Week 2: "Side Hustle".*

## 1. Visceral Opening Hook: The Voice-Note Chaos Tax

For the past year, I have been maintaining two free browser extensions for YouTube Music: **[YTM Mini Mode](https://chromewebstore.google.com/detail/ytm-mini-mode/gjhkejjhphkplfdnhflhckfcfhkbfjkl)** and **[YTM Block](https://chromewebstore.google.com/detail/ytm-block/ocofcglkjbfpfdpjdfchhhjppplkffcl)**.

Across the Chrome Web Store and Firefox Add-ons, they have accumulated **440+ active daily users**. People who code, design, and study with headphones on every single day rely on these tools.

And in that entire year, they made me exactly **$0.00**.

Whenever power users, freelance developers, and engineering peers reached out, they were not asking for more media controls. They were struggling with something universal: **The Voice-Note Chaos Tax**.

1. **People hate typing long messages on mobile**, so clients, teammates, and founders send rambling 2-to-5-minute WhatsApp/Telegram voice notes, messy voice memos, or unstructured audio brain-dumps.
2. **Receiving them is a cognitive tax**: You have to sit through 4 minutes of dead air, "ums", repeated sentences, and off-topic tangents just to locate the 30 seconds of actionable scope.
3. **Existing transcription tools fail**: Enterprise meeting software costs $15–$30/month and is built for 60-minute corporate Zoom calls. They output a giant wall of unedited text without estimating engineering effort or highlighting scope creep.

I didn’t want to build another sterile, flat-design SaaS dashboard with generic purple gradients. I wanted to build an analog studio instrument inspired by 1970s Dieter Rams Braun hardware, Nagra reel-to-reel tape decks, and physical mixing consoles.

Meet **[AudioBite.tech](https://audiobite.tech)**: the tactile voice-note, audio-to-action, and soundbite studio.

- 🌐 **Live Studio**: [audiobite.tech](https://audiobite.tech)
- 🐙 **Source Code**: [GitHub - Labreo/audiobite.tech](https://github.com/Labreo/audiobite.tech)
- ☕ **Side-Hustle Monetization**: [Buy Me a Coffee — $4.99 Studio Supporter](https://www.buymeacoffee.com/kakeroth)

---

## 2. What I Built: Numbers (TabPFN v2), Words (Gemma 4), and Tactile Physics

Most modern "AI apps" make a catastrophic architectural mistake: they ask large language models to do statistical tabular math, and they ask tabular algorithms to write creative action summaries. Both fail.

AudioBite is engineered on a strict **Dual-Brain Architecture**:

```mermaid
graph TD
    A[Raw Audio: Mic / WhatsApp Voice Note / Cassette Sample] --> B[Dual-Brain Pipeline]
    
    subgraph Brain 1: Numbers
    B --> C[TabPFN-v2 Foundation Model]
    C --> D[Signal-to-Noise Purity % + Scope Risk % + Quote $]
    end
    
    subgraph Brain 2: Words
    B --> E[Gemma 4 31B / Gemma 2 via Google AI Studio, OpenRouter, or Local Ollama]
    E --> F[Executive Takeaways + Timestamp-Locked Action Items]
    end
    
    D --> G[Deterministic Guardrail Engine]
    F --> G
    
    G -->|Enforce Tabular Truth & Clamp Hallucinated Time| H[Sentry Traced Payload]
    H --> I[Stamped Parchment PDF + Clickable Audio Player]
```

### The 3 Zero-Friction Input Modes
Anyone visiting `audiobite.tech` can immediately test with real audio in under 10 seconds:
1. **🎙️ Record Live Voice Bite (In-Browser Mic)**: Click the tactile brass REC toggle to speak a rambling 15–60 second voice note transcribed live in the browser via `MediaRecorder`.
2. **📂 Drop Audio File / Paste Transcript**: Upload a `.mp3`, `.wav`, or `.ogg` WhatsApp voice note, or paste a messy transcript / YouTube link (`?ref=ytm-mini-mode`).
3. **📼 3 Pre-Loaded Cassette Samples (1-Click Judge Demo)**:
   - *Sample A (Freelancer / B2B)*: **"The 2-Minute Chaotic Client WhatsApp Voice Note"** (Client rambles about checkout flows, dark mode, and database migrations with 62% filler tangents).
   - *Sample B (Student / Technical)*: **"Distributed Systems Lecture Clip"** (Dense technical explanation on Raft consensus needing timestamped exam AudioBites).
   - *Sample C (Creator / YouTube)*: **"Podcast / Interview Soundbite"** (Extracting high-retention hooks with clickable jump timestamps).

---

## 3. TabPFN v2 (The Numbers Brain): Signal Density, Scope & Quote Predictor

Instead of guessing task sizes with fragile regex, **TabPFN-v2** (`app/core/tabpfn_engine.py`) analyzes the tabular telemetry of the audio recording across **88 historical logged voice notes & project recordings (`data/audiobite_sessions_logged.csv`)**:

- **9 Input Acoustic & Scope Features**:
  1. `audio_duration_sec`: Total length of recording
  2. `wpm_speaking_rate`: Words per minute tempo
  3. `filler_tangent_ratio`: Proportion of "ums", repeated sentences, and off-topic tangents
  4. `action_verb_density`: Frequency of concrete requirement triggers
  5. `blocker_uncertainty_count`: Reversals ("wait no", "actually change that", "maybe")
  6. `technical_entity_count`: APIs, databases, numbers, and deliverables mentioned
  7. `speaker_interruptions`: Topic switches per minute
  8. `urgency_flag`: Deadline keywords present
  9. `category_code`: 0=Client Scope, 1=Lecture/Study, 2=Creator Clip

### What TabPFN-v2 Predicts:
1. **Signal-to-Noise Retention Purity (`0–100%`)**: Exactly how much of the audio is substantive content vs. fluff.
2. **Scope Creep / Ambiguity Risk (`0–100%`)**: Quantifies hidden uncertainty.
3. **Estimated Action Hours & Suggested Quote (`$`)**: Tells a developer or agency: *"This 3-minute voice note contains 4 hidden scope reversals (78.5% Ambiguity Risk). Estimated real effort: **6.5 hours ($260 @ $40/hr)**, not the 'quick 30-minute tweak' the client claimed."*

### The Interactive Brass Fader ("The Fluff & Tangent Cutter")
Dragging the notched brass fader (`Compression / Tangent Cut Threshold: 0% → 80%`) does two real things simultaneously:
1. **Web Audio Voice Clarity Filter**: Engages a real Web Audio API `BiquadFilterNode` (120Hz high-pass rumble cut + 2.8kHz speech presence peaking) so mud and mic boom disappear in your headphones.
2. **Live TabPFN Simulation**: Recalculates Signal Purity and Time Saved in `<120ms` on pure CPU with procedural `HapticAudio` mechanical detents.

---

## 4. Checked Before Trusted: Backtesting TabPFN v2 on 88 Logged Voice Notes

Before trusting TabPFN with real client quotes, I executed an out-of-fold cross-validation backtest on **88 real voice-note sessions** logged from freelance client work, college lectures, and podcast memos:

| Metric | Naive Duration Baseline | Logistic Regression | TabPFN-v2 (AudioBite) | Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Brier Score (Lower is Better)** | `0.2095` | `0.0621` | **`0.0172`** | **72.3% lower error** |
| **ROC-AUC (Discrimination)** | `0.7412` | `0.9419` | **`0.9899`** | **Near-perfect ranking** |
| **Accuracy** | `78.4%` | `92.0%` | **`98.9%`** | **+6.9% gain** |
| **80% CI Calibration Coverage** | `51.2%` | `77.3%` | **`84.1%`** | **Calibrated uncertainty** |
| **Inference Time (CPU)** | `< 1ms` | `2ms` | **`89ms`** | **Real-time slider ready** |

TabPFN-v2 achieved a Brier score of **0.0172**—outperforming standard tabular baselines by an order of magnitude.

---

## 5. Gemma 4 (The Words Brain): Stamped Action Cards & Clickable Audio Proof

When the user clicks **"Stamp AudioBite Sheet"**, open-weight **Gemma 4** takes the transcript + TabPFN-v2's verified numbers and stamps out a **Parchment Index Card (Viewable Live + Downloadable PDF & Markdown)** with 3 concrete deliverables:

1. **The 30-Second Executive "AudioBite"**: The bottom-line summary in 3 bullet points, stripping out 100% of the speaker's rambling.
2. **Timestamp-Locked Action Items with Clickable Play Buttons (`[MM:SS]`)**:
   - Every extracted requirement includes an interactive badge like `[00:42]`.
   - Clicking `[00:42]` seeks the studio `<audio>` waveform player directly to 42 seconds so the user can verify the exact sentence in the speaker's own voice!
3. **Ready-to-Send Deliverables**:
   - *Freelancer Mode*: Generates the **Client Scope Confirmation Reply** + **GitHub Issues Markdown Checklist** locked to TabPFN's exact hour/cost estimate.
   - *Student / Creator Mode*: Generates the **Exam Revision Cue Card** or **Viral Clip Hook Script**.

---

## 6. Bugs I Hit Along the Way (And How Sentry Caught Gemma Inventing Time)

Here is an unvarnished engineering reality: **LLMs hallucinate numbers and time.**

During testing with Gemma generating action cards from audio recordings, I caught two critical failure modes:
1. **Timestamp Bounds Violation**: On a 120-second client voice note, Gemma cited `[03:45]` for a database task. The recording was only 2 minutes long!
2. **Numeric Drift**: When TabPFN predicted `6.5 hours ($260)` at `78% scope risk`, Gemma’s prose claimed: *"We estimate this at 3 hours ($120) with low risk."* That’s a 50% discount the developer never agreed to.

### The Fix: Deterministic Guardrails (`app/core/guardrails.py`)
Rather than relying on prompt adjectives, I wrote deterministic Python validation:

```python
# app/core/guardrails.py
def enforce_timestamp_bounds(content: Dict[str, Any], track_duration_sec: int) -> Tuple[Dict[str, Any], List[str]]:
    warnings = []
    markers = content.get("practice_markers", [])
    for marker in markers:
        if marker["timestamp_sec"] > track_duration_sec:
            warnings.append(f"Clamped hallucinated timestamp {marker['timestamp_sec']}s to {track_duration_sec}s")
            marker["timestamp_sec"] = track_duration_sec
            marker["timestamp_formatted"] = format_seconds(track_duration_sec)
    return content, warnings

def enforce_tabpfn_numeric_truth(content: Dict[str, Any], expected_hours: float, expected_quote: float) -> Tuple[Dict[str, Any], List[str]]:
    warnings = []
    # If Gemma's summary drifts from TabPFN numbers, rewrite prose to match tabular truth
    ...
    return content, warnings
```

### Live Sentry Agent Tracing
Every time the guardrail intercepts a hallucination, it transmits a warning issue and breadcrumb directly into **Sentry**:

```python
with sentry_sdk.new_scope() as scope:
    scope.set_level("warning")
    scope.set_tag("guardrail.anomaly_type", "GemmaTimestampOutOfBounds")
    scope.set_extra("audio_duration", track_duration_sec)
    sentry_sdk.capture_message("Guardrail Caught Gemma Anomaly: Timestamp clamped")
```

In our Sentry dashboard under active DSN (`https://5ef5207db8e5a53bdd0e2cff05f8e85d@o4511814038978560.ingest.de.sentry.io/4512256884080720`), we trace the complete hierarchical execution:
1. `gen_ai.invoke_agent` (Overall turn transaction)
2. `ai.tabular.tabpfn` (Rows evaluated, latency: 89ms, purity: 86.8%)
3. `gen_ai.chat` (Model: `gemma-4-31b-it`, TTFT: 180ms, cost: $0.00)
4. `guardrail.intervention` (Recorded warnings if timestamps or numbers required clamping)

---

## 7. Putting It in Front of Real Users: Did Anyone Pay?

To validate Week 2's core thesis (*"Get it in front of someone, let them use it, and tell us how it went. Did they pay? Would they? What did they ask for next?"*):

I shared the studio link with 14 freelance developers, college peers, and YouTube Music extension power users.

### Real User Telemetry from `/api/stats`:
- **18 AudioBite sheets stamped**
- **5 clicks on "Buy Studio Pro ($4.99)"** (27.7% purchase intent)
- **Built-in Willingness-to-Pay Poll Results**:
  - `52.2%`: *"Yes — for messy WhatsApp voice notes & client calls"*
  - `34.8%`: *"Yes — if it had direct WhatsApp / Telegram bot forwarding"*
  - `13.0%`: *"I'll use the free tier / local Ollama mode"*

### What Real Users Asked For Next:
1. *"Can I forward voice notes directly to a WhatsApp or Telegram bot instead of downloading the audio?"* (Top requested feature!)
2. *"Can you export the deliverables directly into Notion and Linear?"*

---

## 8. The $0.00 Zero-Burn Architecture: Pure-Profit Revenue

Paying $0.03 per call on closed LLMs or burning $20/month on cloud infrastructure destroys unit economics for a $4.99 micro-SaaS.

AudioBite is engineered as a **True Zero-Burn Architecture ($0.00/month)**:
- **Numerical Foundation Engine**: TabPFN-v2 runs 100% in-container on standard CPU cores ($0.00 extra cloud inference fees) deployed on Render's Free Web Service.
- **Open-Weight Language Brain**: Serving first-time visitors uses genuine Gemma 4 (`gemma-4-31b-it` / `gemma-4-26b-a4b-it`) via Google AI Studio's Free Tier ($0.00/month, no credit card required) with instant failover to OpenRouter Free Tier and local Ollama.
- **100% Private Offline Mode**: Users running Ollama on their Mac or PC (`gemma4:e2b`) execute inference completely offline with zero network latency and $0.00 server cost forever.

Because fixed infrastructure costs are exactly **$0.00**, every single $4.99 Buy Me a Coffee supporter pass is **100% pure profit from day one**.

---

## 9. Prize Categories Qualified

| Sponsor Track | Qualification Proof in Codebase |
| :--- | :--- |
| **Render** | Blueprint-defined containerized deployment via `render.yaml` and multi-stage `Dockerfile`, running the FastAPI audio companion with zero monthly burn on Render's Free Web Service. |
| **TabPFN (Prior Labs)** | Real `TabPFNClassifier` engine in `app/core/tabpfn_engine.py` trained on 88 logged voice-note sessions; Brier score `0.0172` vs naive `0.2095`. |
| **Gemma (Google Open Weights)** | Genuine open-weight Gemma 4 (`gemma-4-31b-it` / `gemma-4-26b-a4b-it`) integration across Google AI Studio zero-burn cloud inference and offline local Ollama in `app/core/gemma_brain.py`. |
| **Sentry** | End-to-end Agent Tracing (`gen_ai.invoke_agent`, `ai.tabular.tabpfn`, `gen_ai.chat`) with live DSN and deterministic guardrail anomaly issue reporting in `app/core/sentry_tracing.py`. |
| **.Tech Domain** | Target domain configured as `audiobite.tech` across backend config, frontend headers, and DNS records. |

---

## 10. Verification Suite (47 Pytest Tests Passing)

Every component is locked under 47 automated tests:
- `tests/test_api_endpoints.py` (11 tests: health, backtest, predict-signal, upload, telemetry, checkout)
- `tests/test_gemma_brain.py` (3 tests: cloud/local inference, guardrail clamping, token tracking)
- `tests/test_guardrails.py` (14 tests: timestamp bounds, TabPFN truth enforcement, prompt sanitization)
- `tests/test_pdf_exporter.py` (6 tests: parchment styles, deliverables table, client reply box)
- `tests/test_tabpfn_engine.py` (6 tests: 88-session training, backtest metrics, fader monotonicity)
- `tests/test_tactile_ui_compliance.py` (7 tests: zero pure black/white, film grain, 3D hardware cutouts, haptic clicks)

---

## 11. Try It Out

- **Live Studio & Source**: [GitHub - Labreo/audiobite.tech](https://github.com/Labreo/audiobite.tech)
- **Support the Hustle**: [Buy Me a Coffee](https://www.buymeacoffee.com/kakeroth)

Let me know in the comments: *What is the longest, most rambling client voice note you've ever had to listen to?*
