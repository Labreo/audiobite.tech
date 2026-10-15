/**
 * AudioBite.tech — Interactive Tactile Audio-to-Action Studio Controller
 * Implements:
 * 1. Procedural HapticAudio Web Audio Synthesizer (Zero MP3s)
 * 2. 3D Spatial Grab & Tilt Physics on Workbench Cutouts
 * 3. Live In-Browser Mic Recorder (MediaRecorder) & Cassette Audio Player
 * 4. Web Audio Voice Clarity Filter (120Hz high-pass + 2.8kHz presence)
 * 5. Real-Time TabPFN-v2 Signal & Scope Estimator (<120ms CPU)
 * 6. Clickable [MM:SS] Audio Proof Seekers & Stamped Parchment PDF Exporter
 * 7. Willingness-to-Pay Poll & Buy Me a Coffee ($4.99) Funnel
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
      haptics.init();
      haptics.playClick(240, 0.035);
      isDragging = true;
      cutout.classList.add('is-grabbed');
      cutout.setPointerCapture(e.pointerId);

      const rect = cutout.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
    });

    cutout.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      const tiltX = Math.max(-18, Math.min(18, (e.movementY || 0) * 2.2));
      const tiltY = Math.max(-18, Math.min(18, -(e.movementX || 0) * 2.2));

      cutout.style.left = `${currentX}px`;
      cutout.style.top = `${currentY}px`;
      cutout.style.transform = `perspective(53rem) translate3d(0, -6px, 18px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
    });

    const release = () => {
      if (!isDragging) return;
      isDragging = false;
      cutout.classList.remove('is-grabbed');
      cutout.style.transform = 'perspective(53rem) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1)';
      haptics.playClick(170, 0.03);
    };

    cutout.addEventListener('pointerup', release);
    cutout.addEventListener('pointercancel', release);
  });
}

// ------------------------------------------------------------------------------
// STATE & PRE-LOADED AUDIO SAMPLES
// ------------------------------------------------------------------------------
const SAMPLES = {
  'sample-a': {
    title: '2-Min Chaotic Client WhatsApp Voice Note',
    source: 'Fintech Client WhatsApp',
    audio_url: '/static/audio/sample_a_client.wav',
    duration_sec: 120,
    wpm: 165,
    filler_ratio: 0.58,
    category: 'Client Scope / B2B',
    transcript: "Hey man, hope you're doing well! So listen, um, I was looking at the staging build... and uh, wait, the checkout modal, right? We really need UPI QR code tabs right beside the card form. Like, yesterday. Oh, and also, um, my co-founder noticed dark mode doesn't stay saved when you refresh. Can we fix that too? Wait, actually no, don't touch the navigation bar yet, but the user profile database migration needs to be backward compatible so existing accounts don't break on Friday. So yeah, super quick tweaks, should only take you like 30 minutes, right? Let me know!"
  },
  'sample-b': {
    title: 'Distributed Systems: Raft Consensus Lecture',
    source: 'Prof. Kamath GEC Lecture Clip',
    audio_url: '/static/audio/sample_b_lecture.wav',
    duration_sec: 150,
    wpm: 132,
    filler_ratio: 0.15,
    category: 'Student / Exam Revision',
    transcript: "Now moving to section four: Raft consensus algorithm. Notice that in Raft, leader election relies on randomized heartbeat timers between 150 to 300 milliseconds to avoid split-vote deadlocks. When a candidate node requests votes, it must have an up-to-date log term compared to the voter. Remember this for Friday's test: safety property states that once a log entry is committed by a majority of servers, that entry will be present in the logs of all leaders for all future terms."
  },
  'sample-c': {
    title: 'The Zero-Burn AI Stack & Indie Margins',
    source: 'Indie Hacker Podcast Segment',
    audio_url: '/static/audio/sample_c_podcast.wav',
    duration_sec: 90,
    wpm: 175,
    filler_ratio: 0.18,
    category: 'Creator / Soundbite Hook',
    transcript: "Here's the mistake every indie dev makes in 2026: they pay 3 cents per API call to closed-source LLMs for a 5-dollar lifetime SaaS app. That immediately kills your unit margins. If you instead run TabPFN on CPU in your container and route words to Google AI Studio's free Gemma tier, your marginal cost is zero dollars. Every single dollar from users becomes pure profit."
  }
};

let currentSampleId = 'sample-a';
let currentAudioState = { ...SAMPLES['sample-a'] };
let activePdfBase64 = '';
let activeTraceId = '';

// ------------------------------------------------------------------------------
// WEB AUDIO VOICE CLARITY FILTER ON HTML5 PLAYER
// ------------------------------------------------------------------------------
let audioNodeConnected = false;
let highPassFilter = null;
let presenceFilter = null;

function setupAudioFilters(audioEl) {
  if (audioNodeConnected) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const source = ctx.createMediaElementSource(audioEl);

    // 120Hz High-Pass Rumble Filter
    highPassFilter = ctx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.setValueAtTime(120, ctx.currentTime);

    // 2.8kHz Presence Peaking Filter
    presenceFilter = ctx.createBiquadFilter();
    presenceFilter.type = 'peaking';
    presenceFilter.frequency.setValueAtTime(2800, ctx.currentTime);
    presenceFilter.gain.setValueAtTime(3.5, ctx.currentTime);

    source.connect(highPassFilter);
    highPassFilter.connect(presenceFilter);
    presenceFilter.connect(ctx.destination);
    audioNodeConnected = true;
  } catch (err) {
    // MediaElement source policy fallback
  }
}

// ------------------------------------------------------------------------------
// APP CONTROLLER INITIALIZATION
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initCutoutPhysics();

  const audioPlayer = document.getElementById('main-audio-player');
  const btnPlayPause = document.getElementById('btn-play-pause');
  const playIcon = document.getElementById('play-icon');
  const playLabel = document.getElementById('play-label');
  const seekSlider = document.getElementById('audio-seek-slider');
  const timeDisplay = document.getElementById('player-time-display');

  const vocalSlider = document.getElementById('vocal-slider');
  const sliderValDisplay = document.getElementById('slider-val-display');

  const scoreNum = document.getElementById('score-num');
  const scoreDeltaText = document.getElementById('score-delta-text');
  const focusMeterFill = document.getElementById('focus-meter-fill');
  const skipMeterFill = document.getElementById('skip-meter-fill');
  const focusBarVal = document.getElementById('focus-bar-val');
  const skipNum = document.getElementById('skip-num');

  const statHours = document.getElementById('stat-hours');
  const statQuote = document.getElementById('stat-quote');
  const statSaved = document.getElementById('stat-saved');

  const btnGenerateSheet = document.getElementById('btn-generate-sheet');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnLabel = document.getElementById('btn-label');
  const parchmentSheet = document.getElementById('parchment-sheet');

  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnOpenPro = document.getElementById('btn-open-pro');
  const proModal = document.getElementById('pro-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnBuyCoffee = document.getElementById('btn-buy-coffee');

  // Format seconds to MM:SS
  function formatSec(sec) {
    const s = Math.floor(sec || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  }

  // 1. Audio Player Event Listeners
  audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.duration) return;
    const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekSlider.value = pct;
    timeDisplay.textContent = `${formatSec(audioPlayer.currentTime)} / ${formatSec(audioPlayer.duration)}`;
  });

  audioPlayer.addEventListener('ended', () => {
    playIcon.textContent = '▶';
    playLabel.textContent = 'PLAY AUDIO';
  });

  btnPlayPause.addEventListener('click', () => {
    haptics.playClick(220, 0.03);
    setupAudioFilters(audioPlayer);
    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        playIcon.textContent = '⏸';
        playLabel.textContent = 'PAUSE';
      }).catch(() => {});
    } else {
      audioPlayer.pause();
      playIcon.textContent = '▶';
      playLabel.textContent = 'PLAY AUDIO';
    }
  });

  seekSlider.addEventListener('input', (e) => {
    if (!audioPlayer.duration) return;
    const targetSec = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = targetSec;
  });

  // 2. Input Mode Tabs (Cassette, Mic, Upload)
  const tabCassette = document.getElementById('tab-cassette');
  const tabMic = document.getElementById('tab-mic');
  const tabUpload = document.getElementById('tab-upload');
  const panelCassettes = document.getElementById('panel-cassettes');
  const panelMic = document.getElementById('panel-mic');
  const panelUpload = document.getElementById('panel-upload');

  function switchTab(activeBtn, activePanel) {
    [tabCassette, tabMic, tabUpload].forEach(btn => btn.classList.remove('is-active'));
    [panelCassettes, panelMic, panelUpload].forEach(panel => panel.style.display = 'none');
    activeBtn.classList.add('is-active');
    activePanel.style.display = 'block';
    haptics.playClick(190, 0.03);
  }

  tabCassette.addEventListener('click', () => switchTab(tabCassette, panelCassettes));
  tabMic.addEventListener('click', () => switchTab(tabMic, panelMic));
  tabUpload.addEventListener('click', () => switchTab(tabUpload, panelUpload));

  // 3. Pre-loaded Cassette Buttons
  const cassetteCards = document.querySelectorAll('.cassette-card');
  cassetteCards.forEach(card => {
    card.addEventListener('click', () => {
      cassetteCards.forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      const sampleKey = card.dataset.sample;
      currentSampleId = sampleKey;
      currentAudioState = { ...SAMPLES[sampleKey] };

      audioPlayer.src = currentAudioState.audio_url;
      audioPlayer.load();
      playIcon.textContent = '▶';
      playLabel.textContent = 'PLAY AUDIO';
      timeDisplay.textContent = `00:00 / ${formatSec(currentAudioState.duration_sec)}`;

      vocalSlider.value = currentAudioState.filler_ratio;
      sliderValDisplay.textContent = `${Math.round(currentAudioState.filler_ratio * 100)}%`;

      haptics.playClick(210, 0.03);
      triggerSignalPrediction();
    });
  });

  // 4. In-Browser Live Microphone Recorder
  let mediaRecorder = null;
  let micStream = null;
  let recordedChunks = [];
  let recordTimerInterval = null;
  let recordSeconds = 0;

  const btnToggleRec = document.getElementById('btn-toggle-rec');
  const btnStopRec = document.getElementById('btn-stop-rec');
  const micLed = document.getElementById('mic-led');
  const micStatusText = document.getElementById('mic-status-text');
  const micTimer = document.getElementById('mic-timer');

  btnToggleRec.addEventListener('click', async () => {
    haptics.playClick(280, 0.04);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone access is not supported in this browser.');
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(micStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        const micAudioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = micAudioUrl;
        audioPlayer.load();

        currentAudioState = {
          title: `Live Voice Note (${formatSec(recordSeconds)})`,
          source: 'Live In-Browser Recording',
          audio_url: micAudioUrl,
          duration_sec: Math.max(10, recordSeconds),
          wpm: 155,
          filler_ratio: 0.35,
          category: 'Live Voice Note',
          transcript: `Live mic recording captured in browser (${recordSeconds} seconds). AudioBite distillation ready.`
        };

        timeDisplay.textContent = `00:00 / ${formatSec(recordSeconds)}`;
        micStatusText.textContent = `RECORDED (${formatSec(recordSeconds)})`;
        micLed.classList.remove('is-recording');
        btnToggleRec.style.display = 'inline-flex';
        btnStopRec.style.display = 'none';
        btnToggleRec.querySelector('#rec-label').textContent = 'RE-RECORD VOICE NOTE';

        triggerSignalPrediction();
      };

      mediaRecorder.start();
      recordSeconds = 0;
      micTimer.textContent = '00:00';
      micLed.classList.add('is-recording');
      micStatusText.textContent = 'RECORDING (SPEAK NOW)';
      btnToggleRec.style.display = 'none';
      btnStopRec.style.display = 'inline-flex';

      recordTimerInterval = setInterval(() => {
        recordSeconds++;
        micTimer.textContent = formatSec(recordSeconds);
        if (recordSeconds >= 180) {
          mediaRecorder.stop();
          clearInterval(recordTimerInterval);
        }
      }, 1000);

    } catch (err) {
      alert(`Could not access microphone: ${err.message}`);
    }
  });

  btnStopRec.addEventListener('click', () => {
    haptics.playClick(180, 0.03);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(recordTimerInterval);
      if (micStream) micStream.getTracks().forEach(t => t.stop());
    }
  });

  // 5. File Upload / Dropzone
  const uploadDropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadFilename = document.getElementById('upload-filename');

  uploadDropzone.addEventListener('click', () => fileInput.click());
  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'var(--accent-amber)';
  });
  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.style.borderColor = 'var(--accent-brass)';
  });
  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'var(--accent-brass)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  });

  async function handleFileUpload(file) {
    haptics.playClick(240, 0.035);
    uploadFilename.textContent = `Uploading ${file.name}...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        uploadFilename.textContent = `✓ Loaded: ${data.filename} (${data.duration_formatted})`;
        currentAudioState = {
          title: data.filename,
          source: 'Uploaded Audio File',
          audio_url: data.audio_url,
          duration_sec: data.duration_sec,
          wpm: data.estimated_wpm,
          filler_ratio: data.estimated_filler_ratio,
          category: 'Uploaded Audio',
          transcript: data.transcript_placeholder
        };
        audioPlayer.src = data.audio_url;
        audioPlayer.load();
        timeDisplay.textContent = `00:00 / ${data.duration_formatted}`;
        triggerSignalPrediction();
      } else {
        uploadFilename.textContent = `Error: ${data.detail || 'Upload failed'}`;
      }
    } catch (e) {
      uploadFilename.textContent = `Upload error: ${e.message}`;
    }
  }

  // 6. Fluff & Tangent Cut Slider Simulation (TabPFN-v2)
  let predictDebounce = null;
  function triggerSignalPrediction() {
    clearTimeout(predictDebounce);
    predictDebounce = setTimeout(async () => {
      const cutThreshold = parseFloat(vocalSlider.value);
      sliderValDisplay.textContent = `${Math.round(cutThreshold * 100)}%`;

      // Update Web Audio Highpass/Presence if active
      if (highPassFilter && presenceFilter) {
        const hpFreq = 80 + cutThreshold * 160;
        highPassFilter.frequency.setValueAtTime(hpFreq, highPassFilter.context.currentTime);
        presenceFilter.gain.setValueAtTime(2.0 + cutThreshold * 4.0, presenceFilter.context.currentTime);
      }

      try {
        const payload = {
          audio_duration_sec: currentAudioState.duration_sec,
          wpm_speaking_rate: currentAudioState.wpm,
          filler_tangent_ratio: currentAudioState.filler_ratio,
          compression_threshold: cutThreshold
        };
        const res = await fetch('/api/predict-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          const purity = data.signal_purity_pct;
          const compressed = data.compressed_purity_pct;
          const risk = data.scope_risk_pct;

          scoreNum.textContent = compressed.toFixed(1);
          focusBarVal.textContent = `${compressed.toFixed(1)}%`;
          focusMeterFill.style.width = `${Math.min(100, compressed)}%`;

          skipNum.textContent = `${risk.toFixed(1)}%`;
          skipMeterFill.style.width = `${Math.min(100, risk)}%`;

          statHours.textContent = `${data.action_hours_estimated} hrs`;
          statQuote.textContent = `$${data.suggested_quote_usd.toFixed(0)}`;
          statSaved.textContent = `${data.time_saved_min} min`;

          if (cutThreshold > 0.3) {
            scoreDeltaText.innerHTML = `Fluff cut active: elevated signal from <strong>${purity.toFixed(1)}%</strong> to <strong>${compressed.toFixed(1)}%</strong>.`;
          } else {
            scoreDeltaText.textContent = `Raw audio input: ${purity.toFixed(1)}% signal clarity.`;
          }
        }
      } catch (e) {
        // Fallback UI update
      }
    }, 40);
  }

  vocalSlider.addEventListener('input', () => {
    haptics.playDetent(parseFloat(vocalSlider.value) / 0.80);
    triggerSignalPrediction();
  });

  // 7. Stamp Stamped AudioBite Card (Dual-Brain Gemma 4 + TabPFN + PDF)
  btnGenerateSheet.addEventListener('click', async () => {
    haptics.playClick(320, 0.05);
    btnSpinner.style.display = 'inline-block';
    btnLabel.textContent = 'Running Gemma 4 & TabPFN...';
    btnGenerateSheet.disabled = true;

    try {
      const payload = {
        track_title: currentAudioState.title,
        artist_name: currentAudioState.source,
        track_duration_sec: currentAudioState.duration_sec,
        bpm: currentAudioState.wpm,
        vocal_presence_ratio: parseFloat(vocalSlider.value),
        transcript_text: currentAudioState.transcript
      };

      const res = await fetch('/api/generate-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        const content = data.sheet_content;
        activePdfBase64 = data.pdf_base64;
        activeTraceId = data.trace_id;

        document.getElementById('sheet-track-title').textContent = currentAudioState.title;
        document.getElementById('sheet-track-meta').textContent =
          `Source: ${currentAudioState.source} • Duration: ${data.track.duration} • Speaking Rate: ${currentAudioState.wpm} WPM`;

        // Render 30-Second Executive AudioBite
        const bulletsContainer = document.getElementById('sheet-executive-bullets');
        bulletsContainer.innerHTML = '';
        const bullets = content.executive_summary || [content.summary_notes];
        bullets.forEach(b => {
          const p = document.createElement('p');
          p.textContent = `• ${b}`;
          bulletsContainer.appendChild(p);
        });

        // Render Timestamp-Locked Action Items
        const tableBody = document.getElementById('harmonic-table-body');
        tableBody.innerHTML = '';
        const items = content.action_items || content.practice_markers || [];

        items.forEach(item => {
          const row = document.createElement('tr');
          const rawTs = item.timestamp || '00:00';
          const parts = rawTs.split(':');
          const sec = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 0;
          const priority = item.priority || item.chords || 'P1';

          row.innerHTML = `
            <td><button class="ts-jump-btn" data-sec="${sec}">▶ [${rawTs}]</button></td>
            <td>${item.task || item.notes || 'Deliverable'}</td>
            <td>${item.assignee_role || 'Engineer'}</td>
            <td><span class="${priority === 'P0' ? 'badge-p0' : 'badge-p1'}">${priority}</span></td>
          `;
          tableBody.appendChild(row);
        });

        // Wire Clickable Timestamp Audio Jump
        document.querySelectorAll('.ts-jump-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const sec = parseFloat(btn.dataset.sec || 0);
            audioPlayer.currentTime = sec;
            audioPlayer.play().then(() => {
              playIcon.textContent = '⏸';
              playLabel.textContent = 'PAUSE';
            }).catch(() => {});
            haptics.playClick(260, 0.035);
          });
        });

        // Render Client Reply & GitHub Checklist
        if (content.client_quote_reply) {
          document.getElementById('sheet-client-reply').textContent = content.client_quote_reply;
        }
        if (content.github_issues_checklist) {
          document.getElementById('sheet-github-checklist').textContent = content.github_issues_checklist;
        }

        // Guardrail status
        const guardrailBox = document.getElementById('guardrail-audit-status');
        const gStatus = data.guardrail_status;
        if (gStatus && gStatus.passed_clean) {
          guardrailBox.innerHTML = `<span>🛡️ <strong>100% Deterministic Match</strong> — Zero timestamp hallucinations, TabPFN numbers locked.</span>`;
        } else {
          guardrailBox.innerHTML = `<span>⚠️ <strong>Guardrail Intervened</strong> — Clamped ${gStatus.interventions_count} anomalies to ensure exact audio duration bounds.</span>`;
        }

        parchmentSheet.style.display = 'block';
        parchmentSheet.scrollIntoView({ behavior: 'smooth' });
        haptics.playClick(360, 0.06);
      } else {
        alert(`Generation failed: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error calling studio engine: ${err.message}`);
    } finally {
      btnSpinner.style.display = 'none';
      btnLabel.textContent = 'Stamp AudioBite Action Card';
      btnGenerateSheet.disabled = false;
    }
  });

  // 8. Copy Buttons
  document.getElementById('btn-copy-reply').addEventListener('click', () => {
    const text = document.getElementById('sheet-client-reply').textContent;
    navigator.clipboard.writeText(text).then(() => {
      haptics.playClick(240, 0.03);
      alert('✓ Client reply copied to clipboard!');
    });
  });

  document.getElementById('btn-copy-github').addEventListener('click', () => {
    const text = document.getElementById('sheet-github-checklist').textContent;
    navigator.clipboard.writeText(text).then(() => {
      haptics.playClick(240, 0.03);
      alert('✓ GitHub checklist copied to clipboard!');
    });
  });

  // 9. Download Stamped Parchment PDF
  btnDownloadPdf.addEventListener('click', () => {
    haptics.playClick(260, 0.04);
    if (!activePdfBase64) {
      alert('Please stamp an AudioBite card first!');
      return;
    }
    const byteCharacters = atob(activePdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AudioBite_${currentAudioState.title.replace(/\s+/g, '_')}.pdf`;
    link.click();
  });

  // 10. Willingness-to-Pay Poll Buttons
  const pollBtns = document.querySelectorAll('.poll-btn');
  const pollStatus = document.getElementById('poll-feedback-status');

  pollBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      haptics.playClick(280, 0.035);
      const pollChoice = btn.dataset.poll;
      btn.style.borderColor = 'var(--accent-amber)';
      btn.style.background = '#fbf5ee';

      try {
        await fetch('/api/telemetry/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trace_id: activeTraceId || 'local-demo',
            feedback_text: `User Poll Vote: ${pollChoice}`,
            rating: pollChoice
          })
        });
        pollStatus.style.display = 'block';
      } catch (e) {
        pollStatus.style.display = 'block';
      }
    });
  });

  // 11. Pro Studio Modal & Buy Me a Coffee Funnel
  btnOpenPro.addEventListener('click', () => {
    haptics.playClick(200, 0.03);
    proModal.classList.add('is-open');
    fetch('/api/telemetry/checkout-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view_pro_modal', referrer: 'nav_header' })
    }).catch(() => {});
  });

  modalCloseBtn.addEventListener('click', () => {
    haptics.playClick(150, 0.02);
    proModal.classList.remove('is-open');
  });

  btnBuyCoffee.addEventListener('click', () => {
    haptics.playClick(300, 0.04);
    fetch('/api/telemetry/checkout-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click_buy_coffee', referrer: 'pro_modal' })
    }).catch(() => {});
    window.open('https://www.buymeacoffee.com/kakeroth', '_blank');
  });

  // Initial trigger on page load
  triggerSignalPrediction();
});
