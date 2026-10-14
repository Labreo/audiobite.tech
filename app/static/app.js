/**
 * AudioBite.tech / StemNote Studio - Interactive Tactile Controller
 * Implements:
 * 1. Procedural HapticAudio Web Audio Synthesizer (Zero MP3s)
 * 2. 3D Spatial Grab & Tilt Physics on Workbench Cutouts
 * 3. Real-Time TabPFN-v2 Vocal-Stem Attenuator Simulation
 * 4. Lenis Inertial Smooth Scrolling
 * 5. Stamped Parchment PDF Generation & Buy Me a Coffee Funnel
 */

// ------------------------------------------------------------------------------
// STAGE 5: PROCEDURAL HAPTIC AUDIO (WEB AUDIO API)
// ------------------------------------------------------------------------------
class HapticAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastDetentRatio = 0.5;
  }

  init() {
    if (!this.ctx && this.enabled) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Mechanical switch click
  playClick(pitch = 180, duration = 0.04) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // AudioContext policy fallback
    }
  }

  // Linear attenuator detent tick
  playDetent(valueRatio = 0.5) {
    if (Math.abs(valueRatio - this.lastDetentRatio) >= 0.04) {
      this.lastDetentRatio = valueRatio;
      this.playClick(140 + Math.round(valueRatio * 220), 0.025);
    }
  }
}

const haptics = new HapticAudio();

// ------------------------------------------------------------------------------
// STAGE 6: LENIS SMOOTH SCROLL (WITH GRACEFUL FALLBACK)
// ------------------------------------------------------------------------------
function initSmoothScroll() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// ------------------------------------------------------------------------------
// STAGE 4: PHYSICAL 3D CUTOUT GRAB & INERTIA PHYSICS
// ------------------------------------------------------------------------------
function initCutoutPhysics() {
  const cutouts = document.querySelectorAll('.cutout');

  cutouts.forEach((cutout) => {
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;

    cutout.addEventListener('pointerdown', (e) => {
      // Unlock Web Audio context on first direct gesture
      haptics.init();
      haptics.playClick(240, 0.035);

      isDragging = true;
      cutout.classList.add('is-grabbed');
      cutout.setPointerCapture(e.pointerId);

      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
    });

    cutout.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      // Calculate tilt based on pointer velocity
      const tiltX = Math.max(-18, Math.min(18, -e.movementY * 1.8));
      const tiltY = Math.max(-18, Math.min(18, e.movementX * 1.8));

      cutout.style.setProperty('--shift-x', `${currentX}px`);
      cutout.style.setProperty('--shift-y', `${currentY}px`);
      cutout.style.setProperty('--tilt-x', `${tiltX}deg`);
      cutout.style.setProperty('--tilt-y', `${tiltY}deg`);
    });

    const releaseGrab = (e) => {
      if (!isDragging) return;
      isDragging = false;
      cutout.classList.remove('is-grabbed');
      haptics.playClick(95, 0.06); // Warm desk release thud

      // Smoothly relax tilt back to neutral
      cutout.style.setProperty('--tilt-x', '0deg');
      cutout.style.setProperty('--tilt-y', '0deg');
    };

    cutout.addEventListener('pointerup', releaseGrab);
    cutout.addEventListener('pointercancel', releaseGrab);
  });
}

// ------------------------------------------------------------------------------
// SAMPLE YTM EXTENSION TRACK PRESETS
// ------------------------------------------------------------------------------
const TRACK_PRESETS = {
  "resonance": {
    title: "Resonance",
    artist: "HOME",
    duration_sec: 212,
    bpm: 85,
    vocal_presence_ratio: 0.05,
    spectral_centroid_hz: 2340.5,
    dynamic_range_db: 8.1,
    hour_of_day: 14,
    is_lyrics_heavy: 0,
    prior_artist_skips: 0
  },
  "weightless": {
    title: "Weightless",
    artist: "Marconi Union",
    duration_sec: 485,
    bpm: 60,
    vocal_presence_ratio: 0.02,
    spectral_centroid_hz: 1120.5,
    dynamic_range_db: 6.2,
    hour_of_day: 9,
    is_lyrics_heavy: 0,
    prior_artist_skips: 0
  },
  "blinding_lights": {
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration_sec: 200,
    bpm: 171,
    vocal_presence_ratio: 0.87,
    spectral_centroid_hz: 3620.0,
    dynamic_range_db: 14.5,
    hour_of_day: 12,
    is_lyrics_heavy: 1,
    prior_artist_skips: 2
  },
  "gymnopedie": {
    title: "Gymnopedie No. 1",
    artist: "Erik Satie",
    duration_sec: 203,
    bpm: 66,
    vocal_presence_ratio: 0.00,
    spectral_centroid_hz: 1180.2,
    dynamic_range_db: 6.5,
    hour_of_day: 8,
    is_lyrics_heavy: 0,
    prior_artist_skips: 0
  }
};

let activeTrack = TRACK_PRESETS["resonance"];
let latestGeneratedPdfBase64 = "";

// ------------------------------------------------------------------------------
// REAL-TIME TABPFN VOCAL ATTENUATOR CONTROLLER
// ------------------------------------------------------------------------------
let faderDebounceTimer = null;

async function updateFaderPrediction(vocalRatio) {
  try {
    const payload = {
      ...activeTrack,
      vocal_presence_ratio: vocalRatio
    };

    const res = await fetch("/api/predict-focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      applyTelemetryDisplay(data);
    }
  } catch (err) {
    console.warn("Prediction update notice:", err);
  }
}

function applyTelemetryDisplay(data) {
  const scoreNum = document.getElementById("score-num");
  const skipNum = document.getElementById("skip-num");
  const meterFill = document.getElementById("focus-meter-fill");
  const skipFill = document.getElementById("skip-meter-fill");
  const deltaText = document.getElementById("score-delta-text");

  const focusVal = data.focus_probability_pct;
  const skipVal = data.skip_risk_pct;

  if (scoreNum) scoreNum.textContent = focusVal.toFixed(1);
  if (skipNum) skipNum.textContent = `${skipVal.toFixed(1)}%`;
  if (meterFill) meterFill.style.width = `${focusVal}%`;
  if (skipFill) skipFill.style.width = `${skipVal}%`;

  if (deltaText && data.stem_stripped_focus_pct) {
    const diff = (data.stem_stripped_focus_pct - focusVal).toFixed(1);
    if (diff > 0) {
      deltaText.innerHTML = `Strip vocal to boost focus by <strong>+${diff}%</strong> (to ${data.stem_stripped_focus_pct}%)`;
    } else {
      deltaText.innerHTML = `Vocal stem already optimized for deep work.`;
    }
  }

  // Deflect VU meter needle based on focus calibration
  const vuNeedle = document.getElementById("vu-needle");
  if (vuNeedle) {
    // Map focus 0-100% to needle angle (-45deg to +45deg)
    const angle = (focusVal / 100) * 90 - 45;
    vuNeedle.setAttribute("transform", `rotate(${angle.toFixed(1)} 160 190)`);
  }
}

// ------------------------------------------------------------------------------
// RUN END-TO-END GENERATION (DUAL-BRAIN GEMMA + TABPFN + PDF)
// ------------------------------------------------------------------------------
async function generateParchmentSheet() {
  haptics.playClick(210, 0.05);

  const btn = document.getElementById("btn-generate-sheet");
  const spinner = document.getElementById("btn-spinner");
  const btnLabel = document.getElementById("btn-label");

  if (btn) btn.disabled = true;
  if (spinner) spinner.style.display = "inline-block";
  if (btnLabel) btnLabel.textContent = "Synthesizing with Gemma 4 & TabPFN...";

  const slider = document.getElementById("vocal-slider");
  const vocalRatio = slider ? parseFloat(slider.value) : activeTrack.vocal_presence_ratio;

  try {
    const payload = {
      track_title: activeTrack.title,
      artist_name: activeTrack.artist,
      track_duration_sec: activeTrack.duration_sec,
      bpm: activeTrack.bpm,
      vocal_presence_ratio: vocalRatio,
      spectral_centroid_hz: activeTrack.spectral_centroid_hz,
      dynamic_range_db: activeTrack.dynamic_range_db,
      hour_of_day: activeTrack.hour_of_day,
      is_lyrics_heavy: activeTrack.is_lyrics_heavy,
      prior_artist_skips: activeTrack.prior_artist_skips
    };

    const res = await fetch("/api/generate-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    renderParchmentSheet(data);
  } catch (err) {
    alert("Generation notice: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (btnLabel) btnLabel.textContent = "Stamp Stamped Parchment Index Card";
  }
}

function renderParchmentSheet(data) {
  const wrapper = document.getElementById("parchment-sheet");
  if (!wrapper) return;

  const titleEl = document.getElementById("sheet-track-title");
  const metaEl = document.getElementById("sheet-track-meta");
  const advisoryEl = document.getElementById("sheet-advisory");
  const notesEl = document.getElementById("sheet-notes");
  const tableBody = document.getElementById("harmonic-table-body");
  const auditEl = document.getElementById("guardrail-audit-status");

  if (titleEl) titleEl.textContent = data.track.title;
  if (metaEl) metaEl.textContent = `Artist: ${data.track.artist} • Duration: ${data.track.duration} • BPM: ${data.track.bpm} • Key: ${data.sheet_content.key_signature || 'D Minor'}`;
  if (advisoryEl) advisoryEl.textContent = data.sheet_content.optimal_stem_mix || "Attenuate vocal stem to minimize cognitive friction.";
  if (notesEl) notesEl.textContent = data.sheet_content.summary_notes || "";

  if (tableBody) {
    tableBody.innerHTML = "";
    (data.sheet_content.practice_markers || []).forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${m.timestamp || '00:00'}</strong></td>
        <td>${m.chords || 'Harmonic Section'}</td>
        <td>${m.notes || 'Focus Anchor'}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  if (auditEl) {
    const passed = data.guardrail_status.passed_clean;
    auditEl.innerHTML = passed
      ? `<span>🛡️ <strong>100% Deterministic Match</strong> — Zero timestamp hallucinations, TabPFN numbers locked</span>`
      : `<span>🛡️ <strong>${data.guardrail_status.interventions_count} Guardrail Corrections Made</strong> — Timestamp & number drift auto-corrected</span>`;
  }

  latestGeneratedPdfBase64 = data.pdf_base64 || "";
  wrapper.classList.add("is-active");

  // Smoothly scroll to the generated card
  wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  haptics.playClick(280, 0.08);
}

function downloadParchmentPdf() {
  haptics.playClick(200, 0.04);
  if (!latestGeneratedPdfBase64) {
    alert("Please generate a practice card first.");
    return;
  }
  const link = document.createElement("a");
  link.href = "data:application/pdf;base64," + latestGeneratedPdfBase64;
  link.download = `AudioBite_Parchment_Card_${activeTrack.title.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ------------------------------------------------------------------------------
// MODAL & TELEMETRY CONTROLS ($4.99 PRO BUY ME A COFFEE FUNNEL)
// ------------------------------------------------------------------------------
function openProModal() {
  haptics.playClick(220, 0.04);
  const modal = document.getElementById("pro-modal");
  if (modal) modal.classList.add("is-open");
}

function closeProModal() {
  haptics.playClick(160, 0.03);
  const modal = document.getElementById("pro-modal");
  if (modal) modal.classList.remove("is-open");
}

function proceedToCheckout() {
  haptics.playClick(260, 0.05);
  // Send telemetry event to backend
  fetch("/api/telemetry/checkout-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "click_buy_me_a_coffee_pro", referrer: "audiobite_tactile_modal" })
  });

  window.open("https://www.buymeacoffee.com/kakeroth", "_blank");
}

// ------------------------------------------------------------------------------
// INITIALIZE ON DOM CONTENT LOADED
// ------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  initCutoutPhysics();

  // Track Selector Pills
  const pills = document.querySelectorAll(".track-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      haptics.playClick(190, 0.03);
      pills.forEach((p) => p.classList.remove("is-active"));
      pill.classList.add("is-active");

      const key = pill.dataset.track;
      if (TRACK_PRESETS[key]) {
        activeTrack = TRACK_PRESETS[key];
        const slider = document.getElementById("vocal-slider");
        if (slider) {
          slider.value = activeTrack.vocal_presence_ratio;
          const disp = document.getElementById("slider-val-display");
          if (disp) disp.textContent = activeTrack.vocal_presence_ratio.toFixed(2);
        }
        updateFaderPrediction(activeTrack.vocal_presence_ratio);
      }
    });
  });

  // Vocal Attenuator Slider
  const slider = document.getElementById("vocal-slider");
  const sliderDisplay = document.getElementById("slider-val-display");

  if (slider) {
    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (sliderDisplay) sliderDisplay.textContent = val.toFixed(2);
      haptics.playDetent(val);

      clearTimeout(faderDebounceTimer);
      faderDebounceTimer = setTimeout(() => {
        updateFaderPrediction(val);
      }, 80);
    });
  }

  // Sheet Generation Button
  const genBtn = document.getElementById("btn-generate-sheet");
  if (genBtn) {
    genBtn.addEventListener("click", generateParchmentSheet);
  }

  // PDF Download Button
  const dlBtn = document.getElementById("btn-download-pdf");
  if (dlBtn) {
    dlBtn.addEventListener("click", downloadParchmentPdf);
  }

  // Pro Modal Buttons
  const openProBtn = document.getElementById("btn-open-pro");
  if (openProBtn) openProBtn.addEventListener("click", openProModal);

  const closeProBtn = document.getElementById("modal-close-btn");
  if (closeProBtn) closeProBtn.addEventListener("click", closeProModal);

  const buyBtn = document.getElementById("btn-buy-coffee");
  if (buyBtn) buyBtn.addEventListener("click", proceedToCheckout);

  // Initial Telemetry Run
  updateFaderPrediction(activeTrack.vocal_presence_ratio);
});
