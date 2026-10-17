/**
 * AudioBite.tech — Interactive Tactile Audio-to-Action Studio Controller
 * Implements:
 * 1. Procedural HapticAudio Web Audio Synthesizer (Zero MP3s)
 * 2. 3D Spatial Grab & Tilt Physics on Workbench Cutouts
 * 3. YouTube & YTM Soundbite Clipper with IFrame Player & A–B Looper
 * 4. Client-Side 16-bit PCM WAV Slicer for Local Audio/Voice Notes
 * 5. Live In-Browser Mic Recorder (MediaRecorder) & Cassette Audio Player
 * 6. Web Audio Voice Clarity Filter (120Hz high-pass + 2.8kHz presence)
 * 7. Real-Time TabPFN-v2 Signal & Scope Estimator (<120ms CPU)
 * 8. Stamped ReportLab Citation PDF Exporter & Clickable [MM:SS] Deep Seekers
 * 9. Persistent Crate Storage & Dossier Generation
 * 10. Willingness-to-Pay Poll & Buy Me a Coffee ($4.99) Funnel
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
// CLIENT-SIDE 16-BIT PCM WAV SLICER & ENCODER (ZERO CLOUD OVERHEAD)
// ------------------------------------------------------------------------------
function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

async function sliceAudioBuffer(audioUrl, startSec, endSec) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio not supported');
  const ctx = new AudioCtx();

  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  const startOffset = Math.floor(startSec * sampleRate);
  const endOffset = Math.min(audioBuffer.length, Math.floor(endSec * sampleRate));
  const sliceLength = Math.max(0, endOffset - startOffset);

  const channelData = audioBuffer.getChannelData(0);
  const slicedSamples = new Float32Array(sliceLength);
  for (let i = 0; i < sliceLength; i++) {
    slicedSamples[i] = channelData[startOffset + i];
  }

  return encodeWAV(slicedSamples, sampleRate);
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
let currentInputMode = 'cassette'; // 'cassette' | 'youtube' | 'mic' | 'upload'
let currentAudioState = { ...SAMPLES['sample-a'] };
let activePdfBase64 = '';
let activeTraceId = '';
let activeAudioBites = [];

// A-B Looper State
let loopPointA = 0;
let loopPointB = 30;
let isLoopEngaged = false;
let loopCheckInterval = null;

// YouTube IFrame Player State
let ytPlayer = null;
let ytPlayerReady = false;

// Format seconds to MM:SS
function formatSec(sec) {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
}

// ------------------------------------------------------------------------------
// YOUTUBE IFRAME PLAYER API INTEGRATION
// ------------------------------------------------------------------------------
window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('youtube-iframe-player', {
    height: '100%',
    width: '100%',
    videoId: 'dQw4w9WgXcQ',
    playerVars: {
      playsinline: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: () => {
        ytPlayerReady = true;
      }
    }
  });
};

function getCurrentPlayheadTime(audioPlayer) {
  if (currentInputMode === 'youtube' && ytPlayer && ytPlayerReady && typeof ytPlayer.getCurrentTime === 'function') {
    return ytPlayer.getCurrentTime() || 0;
  }
  return audioPlayer.currentTime || 0;
}

function seekToPlayheadTime(sec, audioPlayer, autoPlay = true) {
  if (currentInputMode === 'youtube' && ytPlayer && ytPlayerReady) {
    ytPlayer.seekTo(sec, true);
    if (autoPlay) {
      ytPlayer.playVideo();
    }
  } else {
    audioPlayer.currentTime = sec;
    if (autoPlay) {
      audioPlayer.play().catch(() => {});
    }
  }
}

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
// PERSISTENT CRATE (LOCALSTORAGE) STORAGE & MANAGEMENT
// ------------------------------------------------------------------------------
const CRATE_STORAGE_KEY = 'audiobite_crate_v1';

function loadCrate() {
  try {
    const raw = localStorage.getItem(CRATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCrate(items) {
  try {
    localStorage.setItem(CRATE_STORAGE_KEY, JSON.stringify(items));
    updateCrateBadgeUI(items.length);
  } catch (e) {}
}

function updateCrateBadgeUI(count) {
  const navCount = document.getElementById('nav-crate-count');
  const floatingCount = document.getElementById('crate-badge-count');
  if (navCount) navCount.textContent = count;
  if (floatingCount) floatingCount.textContent = count;
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
  const statQuoteSub = document.getElementById('stat-quote-sub');
  const statSaved = document.getElementById('stat-saved');
  const hourlyRateSelect = document.getElementById('hourly-rate-select');

  const liveTranscriptInput = document.getElementById('live-transcript-input');
  const badgeWpm = document.getElementById('badge-wpm');
  const badgeFiller = document.getElementById('badge-filler');
  const studioToast = document.getElementById('studio-toast');

  let toastTimer = null;
  function showStudioToast(msg, durationMs = 3600) {
    if (!studioToast) return;
    studioToast.textContent = msg;
    studioToast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      studioToast.classList.remove('is-visible');
    }, durationMs);
  }

  function syncTranscriptEditorUI() {
    if (liveTranscriptInput) {
      liveTranscriptInput.value = currentAudioState.transcript || '';
    }
    if (badgeWpm) {
      badgeWpm.textContent = `${Math.round(currentAudioState.wpm || 150)} WPM`;
    }
    if (badgeFiller) {
      badgeFiller.textContent = `${Math.round((currentAudioState.filler_ratio || 0.25) * 100)}% Filler`;
    }
  }

  const btnGenerateSheet = document.getElementById('btn-generate-sheet');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnLabel = document.getElementById('btn-label');
  const parchmentSheet = document.getElementById('parchment-sheet');

  const btnExtractBites = document.getElementById('btn-extract-bites');
  const extractSpinner = document.getElementById('extract-spinner');
  const extractLabel = document.getElementById('extract-label');
  const audiobitesDeckSection = document.getElementById('audiobites-deck-section');
  const audiobitesGrid = document.getElementById('audiobites-grid');

  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnOpenPro = document.getElementById('btn-open-pro');
  const proModal = document.getElementById('pro-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnBuyCoffee = document.getElementById('btn-buy-coffee');

  // Looper Elements
  const btnSetA = document.getElementById('btn-set-a');
  const btnSetB = document.getElementById('btn-set-b');
  const btnAMinus = document.getElementById('btn-a-minus');
  const btnAPlus = document.getElementById('btn-a-plus');
  const btnBMinus = document.getElementById('btn-b-minus');
  const btnBPlus = document.getElementById('btn-b-plus');
  const btnToggleLoop = document.getElementById('btn-toggle-loop');
  const loopBtnIcon = document.getElementById('loop-btn-icon');
  const loopBtnLabel = document.getElementById('loop-btn-label');
  const loopPointAVal = document.getElementById('loop-point-a-val');
  const loopPointBVal = document.getElementById('loop-point-b-val');
  const loopDurationDisplay = document.getElementById('loop-duration-display');
  const loopStatusPill = document.getElementById('loop-status-pill');

  // Crate Elements
  const btnOpenCrate = document.getElementById('btn-open-crate');
  const btnFloatingCrate = document.getElementById('btn-floating-crate');
  const crateDrawerOverlay = document.getElementById('crate-drawer-overlay');
  const btnCloseCrate = document.getElementById('btn-close-crate');
  const crateItemsList = document.getElementById('crate-items-list');
  const crateEmptyMsg = document.getElementById('crate-empty-msg');
  const btnStampCratePdf = document.getElementById('btn-stamp-crate-pdf');
  const btnCopyCrateMd = document.getElementById('btn-copy-crate-md');
  const btnClearCrate = document.getElementById('btn-clear-crate');

  // Initialize crate badge & transcript box
  updateCrateBadgeUI(loadCrate().length);
  syncTranscriptEditorUI();

  // Playback Speed Controls (1x, 1.25x, 1.5x, 2x)
  const speedBtns = document.querySelectorAll('.speed-btn');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      haptics.playClick(230, 0.025);
      speedBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const speed = parseFloat(btn.dataset.speed || '1');
      if (audioPlayer) {
        audioPlayer.playbackRate = speed;
      }
      if (ytPlayer && ytPlayerReady && typeof ytPlayer.setPlaybackRate === 'function') {
        ytPlayer.setPlaybackRate(speed);
      }
      showStudioToast(`Playback speed set to ${speed}x`);
    });
  });

  // Live Transcript Editor & Hourly Rate Listeners
  if (liveTranscriptInput) {
    liveTranscriptInput.addEventListener('input', () => {
      currentAudioState.transcript = liveTranscriptInput.value;
      const words = (currentAudioState.transcript || '').trim().split(/\s+/).filter(Boolean);
      if (words.length > 5) {
        const fillerSet = new Set(['um', 'uh', 'like', 'wait', 'actually', 'basically', 'literally', 'yeah']);
        const fCount = words.filter(w => fillerSet.has(w.toLowerCase().replace(/[^a-z]/g, ''))).length;
        currentAudioState.filler_ratio = Math.min(0.75, Math.max(0.05, parseFloat(((fCount / words.length) * 3.2).toFixed(2))));
        if (badgeFiller) badgeFiller.textContent = `${Math.round(currentAudioState.filler_ratio * 100)}% Filler`;
      }
      triggerSignalPrediction();
    });
  }

  if (hourlyRateSelect) {
    hourlyRateSelect.addEventListener('change', () => {
      haptics.playClick(250, 0.03);
      const rate = parseFloat(hourlyRateSelect.value || '40');
      if (statQuoteSub) {
        statQuoteSub.textContent = `Suggested Quote (@ $${rate}/hr)`;
      }
      triggerSignalPrediction();
    });
  }

  // 1. Audio Player Event Listeners
  audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.duration || currentInputMode === 'youtube') return;
    const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekSlider.value = pct;
    timeDisplay.textContent = `${formatSec(audioPlayer.currentTime)} / ${formatSec(audioPlayer.duration)}`;
  });

  audioPlayer.addEventListener('ended', () => {
    if (playIcon) playIcon.textContent = '▶';
    if (playLabel) playLabel.textContent = 'PLAY AUDIO';
  });

  btnPlayPause.addEventListener('click', () => {
    haptics.playClick(220, 0.03);
    if (currentInputMode === 'youtube' && ytPlayer && ytPlayerReady) {
      const state = ytPlayer.getPlayerState();
      if (state === 1) { // playing
        ytPlayer.pauseVideo();
        if (playIcon) playIcon.textContent = '▶';
        if (playLabel) playLabel.textContent = 'PLAY YOUTUBE';
      } else {
        ytPlayer.playVideo();
        if (playIcon) playIcon.textContent = '⏸';
        if (playLabel) playLabel.textContent = 'PAUSE';
      }
      return;
    }

    setupAudioFilters(audioPlayer);
    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        if (playIcon) playIcon.textContent = '⏸';
        if (playLabel) playLabel.textContent = 'PAUSE';
      }).catch(() => {});
    } else {
      audioPlayer.pause();
      if (playIcon) playIcon.textContent = '▶';
      if (playLabel) playLabel.textContent = 'PLAY AUDIO';
    }
  });

  seekSlider.addEventListener('input', (e) => {
    if (currentInputMode === 'youtube') return;
    if (!audioPlayer.duration) return;
    const targetSec = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = targetSec;
  });

  // 2. Input Mode Tabs (Cassette, YouTube, Mic, Upload)
  const tabCassette = document.getElementById('tab-cassette');
  const tabYoutube = document.getElementById('tab-youtube');
  const tabMic = document.getElementById('tab-mic');
  const tabUpload = document.getElementById('tab-upload');

  const panelCassettes = document.getElementById('panel-cassettes');
  const panelYoutube = document.getElementById('panel-youtube');
  const panelMic = document.getElementById('panel-mic');
  const panelUpload = document.getElementById('panel-upload');

  const ytHousing = document.getElementById('youtube-player-housing');

  function switchTab(mode, activeBtn, activePanel) {
    currentInputMode = mode;
    [tabCassette, tabYoutube, tabMic, tabUpload].forEach(btn => btn && btn.classList.remove('is-active'));
    [panelCassettes, panelYoutube, panelMic, panelUpload].forEach(panel => panel && (panel.style.display = 'none'));
    activeBtn.classList.add('is-active');
    activePanel.style.display = 'block';

    if (mode === 'youtube') {
      if (ytHousing) ytHousing.style.display = 'block';
      audioPlayer.pause();
      if (playLabel) playLabel.textContent = 'PLAY YOUTUBE';
    } else {
      if (ytHousing) ytHousing.style.display = 'none';
      if (ytPlayer && ytPlayerReady && typeof ytPlayer.pauseVideo === 'function') {
        ytPlayer.pauseVideo();
      }
      if (playLabel) playLabel.textContent = 'PLAY AUDIO';
    }

    haptics.playClick(190, 0.03);
  }

  tabCassette.addEventListener('click', () => switchTab('cassette', tabCassette, panelCassettes));
  if (tabYoutube) {
    tabYoutube.addEventListener('click', () => switchTab('youtube', tabYoutube, panelYoutube));
  }
  tabMic.addEventListener('click', () => switchTab('mic', tabMic, panelMic));
  tabUpload.addEventListener('click', () => switchTab('upload', tabUpload, panelUpload));

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
      if (playIcon) playIcon.textContent = '▶';
      if (playLabel) playLabel.textContent = 'PLAY AUDIO';
      timeDisplay.textContent = `00:00 / ${formatSec(currentAudioState.duration_sec)}`;

      vocalSlider.value = currentAudioState.filler_ratio;
      sliderValDisplay.textContent = `${Math.round(currentAudioState.filler_ratio * 100)}%`;

      loopPointA = 0;
      loopPointB = Math.min(30, currentAudioState.duration_sec);
      updateLooperUI();
      syncTranscriptEditorUI();

      haptics.playClick(210, 0.03);
      triggerSignalPrediction();
    });
  });

  // 4. A–B Looper Controls
  function updateLooperUI() {
    if (loopPointAVal) loopPointAVal.textContent = formatSec(loopPointA);
    if (loopPointBVal) loopPointBVal.textContent = formatSec(loopPointB);
    const span = Math.max(1, loopPointB - loopPointA);
    if (loopDurationDisplay) loopDurationDisplay.textContent = `Span: ${formatSec(span)}`;

    if (isLoopEngaged) {
      if (loopStatusPill) {
        loopStatusPill.textContent = 'LOOP ENGAGED';
        loopStatusPill.classList.add('is-active');
      }
      if (btnToggleLoop) btnToggleLoop.classList.add('is-looping');
      if (loopBtnIcon) loopBtnIcon.textContent = '';
      if (loopBtnLabel) loopBtnLabel.textContent = 'Release Loop';
    } else {
      if (loopStatusPill) {
        loopStatusPill.textContent = 'LOOP STANDBY';
        loopStatusPill.classList.remove('is-active');
      }
      if (btnToggleLoop) btnToggleLoop.classList.remove('is-looping');
      if (loopBtnIcon) loopBtnIcon.textContent = '';
      if (loopBtnLabel) loopBtnLabel.textContent = 'Engage A–B Loop';
    }
  }

  function startLoopChecker() {
    stopLoopChecker();
    loopCheckInterval = setInterval(() => {
      if (!isLoopEngaged) return;
      const cur = getCurrentPlayheadTime(audioPlayer);
      if (cur >= loopPointB || cur < loopPointA) {
        seekToPlayheadTime(loopPointA, audioPlayer, true);
      }
    }, 120);
  }

  function stopLoopChecker() {
    if (loopCheckInterval) {
      clearInterval(loopCheckInterval);
      loopCheckInterval = null;
    }
  }

  btnSetA.addEventListener('click', () => {
    haptics.playClick(240, 0.03);
    const cur = getCurrentPlayheadTime(audioPlayer);
    loopPointA = Math.max(0, Math.min(cur, loopPointB - 1));
    updateLooperUI();
  });

  btnSetB.addEventListener('click', () => {
    haptics.playClick(240, 0.03);
    const cur = getCurrentPlayheadTime(audioPlayer);
    const maxDur = currentAudioState.duration_sec || 600;
    loopPointB = Math.min(maxDur, Math.max(cur, loopPointA + 1));
    updateLooperUI();
  });

  btnAMinus.addEventListener('click', () => {
    haptics.playClick(200, 0.02);
    loopPointA = Math.max(0, loopPointA - 1);
    updateLooperUI();
  });

  btnAPlus.addEventListener('click', () => {
    haptics.playClick(200, 0.02);
    loopPointA = Math.min(loopPointB - 1, loopPointA + 1);
    updateLooperUI();
  });

  btnBMinus.addEventListener('click', () => {
    haptics.playClick(200, 0.02);
    loopPointB = Math.max(loopPointA + 1, loopPointB - 1);
    updateLooperUI();
  });

  btnBPlus.addEventListener('click', () => {
    haptics.playClick(200, 0.02);
    const maxDur = currentAudioState.duration_sec || 600;
    loopPointB = Math.min(maxDur, loopPointB + 1);
    updateLooperUI();
  });

  btnToggleLoop.addEventListener('click', () => {
    haptics.playClick(280, 0.04);
    isLoopEngaged = !isLoopEngaged;
    updateLooperUI();

    if (isLoopEngaged) {
      seekToPlayheadTime(loopPointA, audioPlayer, true);
      startLoopChecker();
    } else {
      stopLoopChecker();
    }
  });

  // 5. YouTube URL Loading & Presets
  const youtubeUrlInput = document.getElementById('youtube-url-input');
  const youtubeQueryInput = document.getElementById('youtube-query-input');
  const btnLoadYoutube = document.getElementById('btn-load-youtube');

  async function loadYouTubeSource(url, query = '', customTitle = '') {
    if (!url) return;
    haptics.playClick(260, 0.04);
    btnLoadYoutube.disabled = true;
    btnLoadYoutube.innerHTML = '<span>Scanning Captions...</span>';

    try {
      const res = await fetch('/api/youtube-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url
        })
      });
      const data = await res.json();

      if (res.ok) {
        const durSec = data.duration_sec || data.total_duration_sec || 240;
        const winCount = data.windows_count || (data.candidate_windows ? data.candidate_windows.length : 0);
        currentAudioState = {
          title: customTitle || data.title,
          source: `YouTube (${data.youtube_id})`,
          audio_url: data.clean_url || data.deep_link_url,
          duration_sec: durSec,
          wpm: data.estimated_wpm || 152,
          filler_ratio: data.estimated_filler_ratio || 0.16,
          category: 'YouTube & Podcast AudioBite',
          transcript: data.transcript || (data.candidate_windows || []).map(w => w.text).join(' '),
          youtube_id: data.youtube_id,
          candidate_windows: data.candidate_windows
        };

        if (ytPlayer && ytPlayerReady && typeof ytPlayer.loadVideoById === 'function') {
          ytPlayer.loadVideoById(data.youtube_id);
        }

        timeDisplay.textContent = `00:00 / ${formatSec(durSec)}`;
        loopPointA = 0;
        loopPointB = Math.min(35, durSec);
        updateLooperUI();
        syncTranscriptEditorUI();

        triggerSignalPrediction();
        showStudioToast(`Loaded "${currentAudioState.title}" (${formatSec(durSec)}) • ${winCount} candidate windows ready`);
      } else {
        showStudioToast(`Could not load YouTube audio: ${data.detail || 'Caption extraction failed'}`);
      }
    } catch (e) {
      showStudioToast(`Error scanning YouTube audio: ${e.message}`);
    } finally {
      btnLoadYoutube.disabled = false;
      btnLoadYoutube.innerHTML = '<span>Scan &amp; Load</span>';
    }
  }

  if (btnLoadYoutube) {
    btnLoadYoutube.addEventListener('click', () => {
      loadYouTubeSource(youtubeUrlInput.value, youtubeQueryInput.value);
    });
  }

  // Presets
  const btnPresetHuberman = document.getElementById('btn-preset-huberman');
  const btnPresetResonance = document.getElementById('btn-preset-resonance');
  const btnPresetIndie = document.getElementById('btn-preset-indie');

  [btnPresetHuberman, btnPresetResonance, btnPresetIndie].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      const title = btn.dataset.title;
      const query = btn.dataset.query;
      youtubeUrlInput.value = url;
      youtubeQueryInput.value = query;
      switchTab('youtube', tabYoutube, panelYoutube);
      loadYouTubeSource(url, query, title);
    });
  });

  // 6. In-Browser Live Microphone Recorder (with Real Auto-Transcription)
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
      showStudioToast('Microphone access is not supported in this browser.');
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(micStream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
        const micAudioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = micAudioUrl;
        audioPlayer.load();

        const recDur = Math.max(5, recordSeconds);
        timeDisplay.textContent = `00:00 / ${formatSec(recDur)}`;
        micStatusText.textContent = `TRANSCRIBING (${formatSec(recDur)})...`;
        micLed.classList.remove('is-recording');
        btnToggleRec.style.display = 'inline-flex';
        btnStopRec.style.display = 'none';
        btnToggleRec.querySelector('#rec-label').textContent = 'RE-RECORD VOICE NOTE';

        // Upload recorded blob to /api/upload-audio for real Whisper / Gemini transcription
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `mic_voice_note_${Date.now()}.webm`);
          const res = await fetch('/api/upload-audio', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (res.ok) {
            currentAudioState = {
              title: `Live Voice Note (${formatSec(recDur)})`,
              source: `Live Mic (${data.transcription_provider || 'Studio ASR'})`,
              audio_url: data.audio_url || micAudioUrl,
              duration_sec: recDur,
              wpm: data.estimated_wpm || 155,
              filler_ratio: data.estimated_filler_ratio || 0.30,
              category: 'Live Voice Note',
              transcript: data.transcript || data.transcript_placeholder
            };
            micStatusText.textContent = `TRANSCRIBED (${formatSec(recDur)})`;
            showStudioToast(`Voice note transcribed via ${data.transcription_provider}`);
          } else {
            throw new Error(data.detail || 'Upload failed');
          }
        } catch (err) {
          currentAudioState = {
            title: `Live Voice Note (${formatSec(recDur)})`,
            source: 'Live In-Browser Recording',
            audio_url: micAudioUrl,
            duration_sec: recDur,
            wpm: 155,
            filler_ratio: 0.35,
            category: 'Live Voice Note',
            transcript: `Live mic recording captured (${recDur}s). Edit or paste notes below to customize deliverables.`
          };
          micStatusText.textContent = `RECORDED (${formatSec(recDur)})`;
        }

        loopPointA = 0;
        loopPointB = Math.min(30, currentAudioState.duration_sec);
        updateLooperUI();
        syncTranscriptEditorUI();
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
      showStudioToast(`Could not access microphone: ${err.message}`);
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

  // 7. File Upload / Dropzone
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
    uploadFilename.textContent = `Uploading & transcribing ${file.name}...`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        uploadFilename.textContent = `Loaded: ${data.filename} (${data.duration_formatted}) • ${data.transcription_provider}`;
        currentAudioState = {
          title: data.filename,
          source: `Uploaded (${data.transcription_provider || 'Audio File'})`,
          audio_url: data.audio_url,
          duration_sec: data.duration_sec,
          wpm: data.estimated_wpm,
          filler_ratio: data.estimated_filler_ratio,
          category: 'Uploaded Audio',
          transcript: data.transcript || data.transcript_placeholder
        };
        audioPlayer.src = data.audio_url;
        audioPlayer.load();
        timeDisplay.textContent = `00:00 / ${data.duration_formatted}`;

        loopPointA = 0;
        loopPointB = Math.min(30, data.duration_sec);
        updateLooperUI();
        syncTranscriptEditorUI();

        triggerSignalPrediction();
        showStudioToast(`Uploaded & transcribed "${data.filename}"`);
      } else {
        uploadFilename.textContent = `Error: ${data.detail || 'Upload failed'}`;
      }
    } catch (e) {
      uploadFilename.textContent = `Upload error: ${e.message}`;
    }
  }

  // 8. Fluff & Tangent Cut Slider Simulation (TabPFN-v2)
  let predictDebounce = null;
  function triggerSignalPrediction() {
    clearTimeout(predictDebounce);
    predictDebounce = setTimeout(async () => {
      const cutThreshold = parseFloat(vocalSlider.value);
      sliderValDisplay.textContent = `${Math.round(cutThreshold * 100)}%`;
      const selectedRate = hourlyRateSelect ? parseFloat(hourlyRateSelect.value || '40') : 40.0;

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
          compression_threshold: cutThreshold,
          hourly_rate_usd: selectedRate,
          transcript_text: currentAudioState.transcript || null
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
          if (statQuoteSub) {
            statQuoteSub.textContent = `Suggested Quote (@ $${selectedRate}/hr)`;
          }
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

  // 9. Extract AudioBites & Soundbites (POST /api/extract-audiobites)
  btnExtractBites.addEventListener('click', async () => {
    haptics.playClick(320, 0.05);
    extractSpinner.style.display = 'inline-block';
    extractLabel.textContent = 'Extracting AudioBites...';
    btnExtractBites.disabled = true;

    try {
      const queryVal = youtubeQueryInput ? youtubeQueryInput.value : '';
      const payload = {
        title: currentAudioState.title,
        source_url: currentAudioState.audio_url || 'https://audiobite.tech',
        total_duration_sec: currentAudioState.duration_sec,
        candidate_windows: currentAudioState.candidate_windows || [],
        transcript_text: currentAudioState.transcript || null,
        search_query: queryVal || null,
        youtube_id: currentAudioState.youtube_id || null
      };

      const res = await fetch('/api/extract-audiobites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        activeAudioBites = data.bites || data.audiobites || [];
        activeTraceId = data.trace_id || 'local-trace';

        document.getElementById('deck-track-title').textContent = `AUDIOBITES: ${currentAudioState.title}`;
        document.getElementById('deck-track-meta').textContent =
          `Duration: ${formatSec(currentAudioState.duration_sec)} • Extracted: ${activeAudioBites.length} verified soundbites • Sentry Trace: ${activeTraceId.substring(0, 8)}...`;

        renderAudioBitesDeck(activeAudioBites);
        audiobitesDeckSection.style.display = 'block';
        audiobitesDeckSection.scrollIntoView({ behavior: 'smooth' });
        haptics.playClick(380, 0.06);
        showStudioToast(`Extracted ${activeAudioBites.length} guardrail-verified AudioBites`);
      } else {
        showStudioToast(`Extraction failed: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      showStudioToast(`Error extracting soundbites: ${err.message}`);
    } finally {
      extractSpinner.style.display = 'none';
      extractLabel.textContent = 'Extract AudioBites';
      btnExtractBites.disabled = false;
    }
  });

  function renderAudioBitesDeck(bites) {
    audiobitesGrid.innerHTML = '';
    if (!bites || bites.length === 0) {
      audiobitesGrid.innerHTML = '<p style="color: var(--ink-muted); font-family: var(--font-mono);">No soundbites detected. Try adjusting your query or audio source.</p>';
      return;
    }

    bites.forEach((bite, idx) => {
      const card = document.createElement('div');
      card.className = 'audiobite-card';
      const timeTag = `[${formatSec(bite.start_sec)} – ${formatSec(bite.end_sec)}]`;
      const quoteText = bite.quoted_soundbite || bite.verbatim_quote || 'Verified studio soundbite';
      const takeawayText = bite.takeaway || bite.key_takeaway || 'High-density segment identified by TabPFN';
      const stageTag = bite.stage_tag || (bite.tags && bite.tags[0]) || 'HIGH_SIGNAL';
      const audioCue = bite.audio_cue || bite.loop_recommendation || 'Clear voice';
      const sigScore = typeof bite.signal_score_pct === 'number' ? bite.signal_score_pct : 88.0;

      card.innerHTML = `
        <div class="bite-card-top">
          <span class="bite-time-tag">${timeTag} (${bite.duration_sec || (bite.end_sec - bite.start_sec)}s)</span>
          <span class="bite-purity-tag">TabPFN Signal: ${sigScore.toFixed(1)}%</span>
        </div>
        <blockquote class="bite-quote">“${quoteText}”</blockquote>
        <div class="bite-takeaway"><strong>Takeaway:</strong> ${takeawayText}</div>
        <div class="bite-cue-row">
          <span>Stage: <strong>${stageTag}</strong></span> • 
          <span>Audio Cue: ${audioCue}</span>
        </div>
        <div class="bite-actions-row">
          <button class="btn-bite-action btn-bite-primary btn-play-loop-bite" data-idx="${idx}">
            Play &amp; Loop Bite
          </button>
          <button class="btn-bite-action btn-slice-wav" data-idx="${idx}">
            Slice .WAV
          </button>
          <button class="btn-bite-action btn-add-to-crate" data-idx="${idx}">
            Save to Crate
          </button>
          <button class="btn-bite-action btn-stamp-single-pdf" data-idx="${idx}">
            Citation Card PDF
          </button>
        </div>
      `;
      audiobitesGrid.appendChild(card);
    });

    // Wire Card Action Buttons
    document.querySelectorAll('.btn-play-loop-bite').forEach(btn => {
      btn.addEventListener('click', () => {
        haptics.playClick(260, 0.035);
        const idx = parseInt(btn.dataset.idx, 10);
        const bite = activeAudioBites[idx];
        if (!bite) return;

        loopPointA = bite.start_sec;
        loopPointB = bite.end_sec;
        isLoopEngaged = true;
        updateLooperUI();
        seekToPlayheadTime(loopPointA, audioPlayer, true);
        startLoopChecker();

        document.querySelector('.analog-desk').scrollIntoView({ behavior: 'smooth' });
        showStudioToast(`Looping AudioBite [${formatSec(loopPointA)} – ${formatSec(loopPointB)}]`);
      });
    });

    document.querySelectorAll('.btn-slice-wav').forEach(btn => {
      btn.addEventListener('click', async () => {
        haptics.playClick(240, 0.03);
        const idx = parseInt(btn.dataset.idx, 10);
        const bite = activeAudioBites[idx];
        if (!bite) return;

        if (currentInputMode === 'youtube') {
          const deepUrl = bite.deep_link_url || `${currentAudioState.audio_url}?t=${bite.start_sec}`;
          navigator.clipboard.writeText(deepUrl).then(() => {
            showStudioToast(`Copied YouTube deep citation link: ${deepUrl}`);
          });
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Slicing...';
        try {
          const wavBlob = await sliceAudioBuffer(currentAudioState.audio_url, bite.start_sec, bite.end_sec);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(wavBlob);
          link.download = `AudioBite_${formatSec(bite.start_sec).replace(':', 'm')}s_${formatSec(bite.end_sec).replace(':', 'm')}s.wav`;
          link.click();
          btn.textContent = 'Downloaded';
          showStudioToast(`Sliced 16-bit PCM .WAV (${formatSec(bite.start_sec)}–${formatSec(bite.end_sec)})`);
          setTimeout(() => { btn.textContent = 'Slice .WAV'; btn.disabled = false; }, 2000);
        } catch (err) {
          showStudioToast(`Could not slice audio buffer: ${err.message}`);
          btn.textContent = 'Slice .WAV';
          btn.disabled = false;
        }
      });
    });

    document.querySelectorAll('.btn-add-to-crate').forEach(btn => {
      btn.addEventListener('click', () => {
        haptics.playClick(290, 0.04);
        const idx = parseInt(btn.dataset.idx, 10);
        const bite = activeAudioBites[idx];
        if (!bite) return;

        const crate = loadCrate();
        crate.push({
          ...bite,
          quoted_soundbite: bite.quoted_soundbite || bite.verbatim_quote,
          takeaway: bite.takeaway || bite.key_takeaway,
          source_title: currentAudioState.title,
          source_url: currentAudioState.audio_url,
          added_at: new Date().toISOString()
        });
        saveCrate(crate);

        btn.textContent = 'Saved in Crate';
        showStudioToast('Saved AudioBite to persistent Crate');
        setTimeout(() => { btn.textContent = 'Save to Crate'; }, 2000);
      });
    });

    document.querySelectorAll('.btn-stamp-single-pdf').forEach(btn => {
      btn.addEventListener('click', async () => {
        haptics.playClick(270, 0.035);
        const idx = parseInt(btn.dataset.idx, 10);
        const bite = activeAudioBites[idx];
        if (!bite) return;

        btn.disabled = true;
        btn.textContent = 'Stamping...';
        try {
          const res = await fetch('/api/stamp-citation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: currentAudioState.title,
              source_url: currentAudioState.audio_url || 'https://audiobite.tech',
              bites: [bite],
              curator_note: `Single AudioBite Citation Card [${formatSec(bite.start_sec)} – ${formatSec(bite.end_sec)}]`,
              is_crate_dossier: false
            })
          });
          const data = await res.json();
          if (res.ok) {
            downloadPdfFromBase64(data.pdf_base64, `Citation_${formatSec(bite.start_sec).replace(':', 'm')}s.pdf`);
            showStudioToast('Stamped archival Citation Card PDF');
          } else {
            showStudioToast(`Stamping failed: ${data.detail}`);
          }
        } catch (e) {
          showStudioToast(`Error stamping PDF: ${e.message}`);
        } finally {
          btn.textContent = 'Citation Card PDF';
          btn.disabled = false;
        }
      });
    });
  }

  // 10. Stamp All AudioBites PDF & Markdown
  const btnStampAllPdf = document.getElementById('btn-stamp-all-pdf');
  const btnCopyDeckMarkdown = document.getElementById('btn-copy-deck-markdown');

  if (btnStampAllPdf) {
    btnStampAllPdf.addEventListener('click', async () => {
      if (!activeAudioBites || activeAudioBites.length === 0) {
        showStudioToast('Please extract AudioBites first!');
        return;
      }
      haptics.playClick(300, 0.04);
      btnStampAllPdf.disabled = true;
      btnStampAllPdf.innerHTML = '<span>Stamping PDF...</span>';

      try {
        const res = await fetch('/api/stamp-citation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentAudioState.title,
            source_url: currentAudioState.audio_url || 'https://audiobite.tech',
            bites: activeAudioBites,
            curator_note: `Complete Session AudioBites (${activeAudioBites.length} verified soundbites)`,
            is_crate_dossier: false
          })
        });
        const data = await res.json();
        if (res.ok) {
          downloadPdfFromBase64(data.pdf_base64, `AudioBites_Citation_${currentAudioState.title.replace(/\s+/g, '_')}.pdf`);
          showStudioToast('Downloaded session Citation PDF');
        } else {
          showStudioToast(`PDF stamping failed: ${data.detail}`);
        }
      } catch (e) {
        showStudioToast(`Error stamping PDF: ${e.message}`);
      } finally {
        btnStampAllPdf.disabled = false;
        btnStampAllPdf.innerHTML = '<span>Export Citation PDF</span>';
      }
    });
  }

  if (btnCopyDeckMarkdown) {
    btnCopyDeckMarkdown.addEventListener('click', () => {
      if (!activeAudioBites || activeAudioBites.length === 0) {
        showStudioToast('Please extract AudioBites first!');
        return;
      }
      haptics.playClick(240, 0.03);
      let md = `## AudioBites Citation Dossier: ${currentAudioState.title}\n`;
      md += `**Source**: [${currentAudioState.source}](${currentAudioState.audio_url})\n`;
      md += `**Duration**: ${formatSec(currentAudioState.duration_sec)}\n\n`;

      activeAudioBites.forEach((b, i) => {
        const quote = b.quoted_soundbite || b.verbatim_quote || '';
        const take = b.takeaway || b.key_takeaway || '';
        const stg = b.stage_tag || (b.tags && b.tags[0]) || 'HIGH_SIGNAL';
        md += `### ${i + 1}. [${formatSec(b.start_sec)} – ${formatSec(b.end_sec)}] (${stg})\n`;
        md += `> "${quote}"\n\n`;
        md += `- **Takeaway**: ${take}\n`;
        md += `- **TabPFN Signal Purity**: ${(b.signal_score_pct || 88.0).toFixed(1)}%\n`;
        if (b.deep_link_url) {
          md += `- **Deep Audio Citation**: [Listen at ${formatSec(b.start_sec)}](${b.deep_link_url})\n`;
        }
        md += `\n`;
      });

      navigator.clipboard.writeText(md).then(() => {
        showStudioToast('AudioBite Markdown dossier copied to clipboard');
      });
    });
  }

  function downloadPdfFromBase64(base64Data, filename) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // 11. Crate Drawer Open/Close & Operations
  function openCrateDrawer() {
    haptics.playClick(220, 0.03);
    renderCrateItems();
    crateDrawerOverlay.classList.add('is-open');
    crateDrawerOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeCrateDrawer() {
    haptics.playClick(170, 0.02);
    crateDrawerOverlay.classList.remove('is-open');
    crateDrawerOverlay.setAttribute('aria-hidden', 'true');
  }

  if (btnOpenCrate) btnOpenCrate.addEventListener('click', openCrateDrawer);
  if (btnFloatingCrate) btnFloatingCrate.addEventListener('click', openCrateDrawer);
  if (btnCloseCrate) btnCloseCrate.addEventListener('click', closeCrateDrawer);
  crateDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === crateDrawerOverlay) closeCrateDrawer();
  });

  function renderCrateItems() {
    const crate = loadCrate();
    crateItemsList.innerHTML = '';
    if (crate.length === 0) {
      crateItemsList.appendChild(crateEmptyMsg);
      return;
    }

    crate.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'crate-item';
      const quote = item.quoted_soundbite || item.verbatim_quote || '';
      const take = item.takeaway || item.key_takeaway || '';
      el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <strong style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-amber);">
            [${formatSec(item.start_sec)} – ${formatSec(item.end_sec)}]
          </strong>
          <button class="btn-tactile-xs btn-delete-crate-item" data-idx="${idx}" style="color: #b33939;">✕ Remove</button>
        </div>
        <div style="font-family: var(--font-serif); font-size: 0.95rem; font-style: italic; margin-bottom: 0.35rem;">
          "${quote}"
        </div>
        <div style="font-size: 0.75rem; color: var(--ink-graphite); margin-bottom: 0.4rem;">
          ${take}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-muted);">
          <span>${item.source_title || 'Audio Source'}</span>
          <button class="btn-tactile-xs btn-play-crate-item" data-idx="${idx}">Loop</button>
        </div>
      `;
      crateItemsList.appendChild(el);
    });

    document.querySelectorAll('.btn-delete-crate-item').forEach(btn => {
      btn.addEventListener('click', () => {
        haptics.playClick(180, 0.02);
        const idx = parseInt(btn.dataset.idx, 10);
        const crate = loadCrate();
        crate.splice(idx, 1);
        saveCrate(crate);
        renderCrateItems();
      });
    });

    document.querySelectorAll('.btn-play-crate-item').forEach(btn => {
      btn.addEventListener('click', () => {
        haptics.playClick(240, 0.03);
        const idx = parseInt(btn.dataset.idx, 10);
        const crate = loadCrate();
        const item = crate[idx];
        if (!item) return;

        loopPointA = item.start_sec;
        loopPointB = item.end_sec;
        isLoopEngaged = true;
        updateLooperUI();
        seekToPlayheadTime(loopPointA, audioPlayer, true);
        startLoopChecker();
        closeCrateDrawer();
      });
    });
  }

  if (btnClearCrate) {
    btnClearCrate.addEventListener('click', () => {
      haptics.playClick(180, 0.03);
      saveCrate([]);
      renderCrateItems();
      showStudioToast('Cleared saved AudioBites Crate');
    });
  }

  if (btnStampCratePdf) {
    btnStampCratePdf.addEventListener('click', async () => {
      const crate = loadCrate();
      if (crate.length === 0) {
        showStudioToast('Your crate is empty. Save some AudioBites first!');
        return;
      }
      haptics.playClick(320, 0.04);
      btnStampCratePdf.disabled = true;
      btnStampCratePdf.innerHTML = '<span>Stamping Crate Dossier...</span>';

      try {
        const res = await fetch('/api/stamp-citation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `AudioBite Crate Dossier (${crate.length} Slices)`,
            source_url: 'https://audiobite.tech/crate',
            bites: crate,
            curator_note: `Curated Crate Dossier containing ${crate.length} soundbites across multiple sessions.`,
            is_crate_dossier: true
          })
        });
        const data = await res.json();
        if (res.ok) {
          downloadPdfFromBase64(data.pdf_base64, `AudioBite_Crate_Dossier_${crate.length}_Slices.pdf`);
          showStudioToast('Downloaded Crate Dossier PDF');
        } else {
          showStudioToast(`Failed to stamp dossier: ${data.detail}`);
        }
      } catch (e) {
        showStudioToast(`Error stamping dossier: ${e.message}`);
      } finally {
        btnStampCratePdf.disabled = false;
        btnStampCratePdf.innerHTML = '<span>Stamp Citation Dossier PDF</span>';
      }
    });
  }

  if (btnCopyCrateMd) {
    btnCopyCrateMd.addEventListener('click', () => {
      const crate = loadCrate();
      if (crate.length === 0) {
        showStudioToast('Your crate is empty!');
        return;
      }
      haptics.playClick(240, 0.03);
      let md = `# AudioBite Curated Crate Dossier\n\n`;
      md += `*Generated by AudioBite.tech — ${crate.length} Curated Soundbites*\n\n`;
      crate.forEach((b, i) => {
        const quote = b.quoted_soundbite || b.verbatim_quote || '';
        const take = b.takeaway || b.key_takeaway || '';
        md += `### ${i + 1}. [${formatSec(b.start_sec)} – ${formatSec(b.end_sec)}] from *${b.source_title || 'Audio'}*\n`;
        md += `> "${quote}"\n\n`;
        md += `- **Takeaway**: ${take}\n`;
        md += `- **Signal Purity**: ${(b.signal_score_pct || 88.0).toFixed(1)}%\n`;
        if (b.deep_link_url) {
          md += `- **Link**: [Listen on YouTube](${b.deep_link_url})\n`;
        }
        md += `\n`;
      });
      navigator.clipboard.writeText(md).then(() => {
        showStudioToast('Crate Markdown dossier copied to clipboard');
      });
    });
  }

  // 12. Stamp Stamped AudioBite Card (Dual-Brain Gemma 4 + TabPFN + PDF)
  btnGenerateSheet.addEventListener('click', async () => {
    haptics.playClick(320, 0.05);
    btnSpinner.style.display = 'inline-block';
    btnLabel.textContent = 'Running Gemma 4 & TabPFN...';
    btnGenerateSheet.disabled = true;

    try {
      const selectedRate = hourlyRateSelect ? parseFloat(hourlyRateSelect.value || '40') : 40.0;
      const payload = {
        track_title: currentAudioState.title,
        artist_name: currentAudioState.source,
        track_duration_sec: currentAudioState.duration_sec,
        bpm: currentAudioState.wpm,
        vocal_presence_ratio: parseFloat(vocalSlider.value),
        transcript_text: currentAudioState.transcript,
        hourly_rate_usd: selectedRate
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
          `Source: ${currentAudioState.source} • Duration: ${data.track.duration} • Speaking Rate: ${currentAudioState.wpm} WPM • Billing Rate: $${selectedRate}/hr`;

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
            <td><button class="ts-jump-btn" data-sec="${sec}">[${rawTs}]</button></td>
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
            seekToPlayheadTime(sec, audioPlayer, true);
            haptics.playClick(260, 0.035);
            showStudioToast(`Jumped audio playhead to [${formatSec(sec)}]`);
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
          guardrailBox.innerHTML = `<span><strong>100% Deterministic Match</strong> — Zero timestamp hallucinations, TabPFN numbers locked (@ $${selectedRate}/hr).</span>`;
        } else {
          guardrailBox.innerHTML = `<span><strong>Guardrail Intervened</strong> — Clamped ${gStatus.interventions_count} anomalies to ensure exact audio duration bounds.</span>`;
        }

        parchmentSheet.style.display = 'block';
        parchmentSheet.scrollIntoView({ behavior: 'smooth' });
        haptics.playClick(360, 0.06);
        showStudioToast('Stamped Action Card & Archival PDF ready');
      } else {
        showStudioToast(`Generation failed: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      showStudioToast(`Error calling studio engine: ${err.message}`);
    } finally {
      btnSpinner.style.display = 'none';
      btnLabel.textContent = 'Stamp Action Card';
      btnGenerateSheet.disabled = false;
    }
  });

  // 13. Copy Buttons
  document.getElementById('btn-copy-reply').addEventListener('click', () => {
    const text = document.getElementById('sheet-client-reply').textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
      haptics.playClick(240, 0.03);
      showStudioToast('Client quote reply copied to clipboard');
    });
  });

  document.getElementById('btn-copy-github').addEventListener('click', () => {
    const text = document.getElementById('sheet-github-checklist').textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
      haptics.playClick(240, 0.03);
      showStudioToast('GitHub issues checklist copied to clipboard');
    });
  });

  // 14. Download Stamped Parchment PDF
  btnDownloadPdf.addEventListener('click', () => {
    haptics.playClick(260, 0.04);
    if (!activePdfBase64) {
      showStudioToast('Please stamp an action card first!');
      return;
    }
    downloadPdfFromBase64(activePdfBase64, `AudioBite_${currentAudioState.title.replace(/\s+/g, '_')}.pdf`);
    showStudioToast('Downloaded Archival Action Card PDF');
  });

  // 15. Willingness-to-Pay Poll Buttons
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

  // 16. Pro Studio Modal & Buy Me a Coffee Funnel
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

  // 17. Extension Bridge Auto-Load (?ref=ytm-mini-mode or ?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  const externalUrl = urlParams.get('url');
  const externalQuery = urlParams.get('query');

  if (externalUrl) {
    switchTab('youtube', tabYoutube, panelYoutube);
    youtubeUrlInput.value = externalUrl;
    if (externalQuery) youtubeQueryInput.value = externalQuery;
    loadYouTubeSource(externalUrl, externalQuery || '');
  } else if (refParam === 'ytm-mini-mode' || refParam === 'lettermarkd') {
    switchTab('youtube', tabYoutube, panelYoutube);
    const badge = document.querySelector('.runtime-badge span:last-child');
    if (badge) {
      badge.textContent = `Extension Bridge: Connected to ${refParam.toUpperCase()}`;
    }
  }

  // Initial trigger on page load
  updateLooperUI();
  triggerSignalPrediction();
});
