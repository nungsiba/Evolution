class SoundManager {
  constructor() {
    this._ctx      = null;   // AudioContext — lazy-init on first play
    this._muted    = this._loadMuted();
    this._bgGain   = null;
    this._bgNodes  = [];
    this._bgStarted= false;

    // Rate-limit slash so rapid attacks don't pile up
    this._lastSlash = 0;
    this._slashCooldown = 90; // ms

    this._updateMuteBtn();
  }

  /* ── Public API ────────────────────────────────── */
  play(name) {
    if (this._muted) return;
    this._ensureCtx();
    switch(name) {
      case 'slash':       this._slash();       break;
      case 'collect':     this._collect();     break;
      case 'dash':        this._dash();        break;
      case 'levelup':     this._levelup();     break;
      case 'uiBlip':      this._uiBlip();      break;
      case 'uiClick':     this._uiClick();     break;
      case 'purchase':    this._purchase();    break;
      case 'missionDone': this._missionDone(); break;
      case 'equip':       this._equip_sfx();   break;
    }
  }

  toggleMute() {
    this._muted = !this._muted;
    this._saveMuted();
    this._updateMuteBtn();
    if (this._bgGain) {
      this._bgGain.gain.setTargetAtTime(
        this._muted ? 0 : 0.30, this._ctx.currentTime, 0.1
      );
    }
    // Play a blip on unmute so user gets feedback
    if (!this._muted) { this._ensureCtx(); this._uiBlip(); }
  }

  startBGMusic() {
    if (this._bgStarted) return;
    this._bgStarted = true;
    if (this._muted) return;
    this._ensureCtx();
    this._startDrone();
  }

  stopBGMusic() {
    this._bgNodes.forEach(n => { try { n.stop(); } catch(_){} });
    this._bgNodes = [];
    this._bgStarted = false;
  }

  /* ── AudioContext bootstrap ───────────────────── */
  _ensureCtx() {
    if (this._ctx) {
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return;
    }
    // Reuse Phaser's context if available, else create our own
    try {
      const g = window.game;
      if (g && g.sound && g.sound.context) {
        this._ctx = g.sound.context;
      }
    } catch(_) {}
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
  }

  /* ── Mute persistence ─────────────────────────── */
  _loadMuted()  { try { return localStorage.getItem('soulReaper_muted') === '1'; } catch { return false; } }
  _saveMuted()  { try { localStorage.setItem('soulReaper_muted', this._muted ? '1' : '0'); } catch {} }
  _updateMuteBtn() {
    const btn = document.getElementById('mute-btn');
    if (!btn) return;
    btn.textContent = this._muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', this._muted);
    btn.title = this._muted ? 'Unmute Audio' : 'Mute Audio';
  }

  /* ─────────────────────────────────────────────────
     SOUND SYNTHESIS HELPERS
  ──────────────────────────────────────────────── */
  _master(vol = 0.35) {
    const g = this._ctx.createGain();
    g.gain.value = vol;
    g.connect(this._ctx.destination);
    return g;
  }

  _osc(type, freq, start, dur, startVol, endVol, dest) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    env.gain.setValueAtTime(startVol, start);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), start + dur);
    osc.connect(env); env.connect(dest);
    osc.start(start); osc.stop(start + dur + 0.01);
    return osc;
  }

  /* ── 1. Slash ─ filtered noise burst + metal ping ── */
  _slash() {
    const now = Date.now();
    if (now - this._lastSlash < this._slashCooldown) return;
    this._lastSlash = now;
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.28);

    // Noise burst
    const bufLen = ctx.sampleRate * 0.12;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random()*2-1);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 3200; bpf.Q.value = 1.8;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.8, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);

    src.connect(bpf); bpf.connect(env); env.connect(master);
    src.start(t); src.stop(t + 0.12);

    // Metallic ping (triangle at 1800 Hz decaying fast)
    this._osc('triangle', 1800, t, 0.10, 0.5, 0.0001, master);
    this._osc('sine',      900, t, 0.06, 0.2, 0.0001, master);
  }

  /* ── 2. Soul collect ─ sparkle sweep ─────────── */
  _collect() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.22);

    // Two-note chirp sweep
    const freqs = [880, 1760, 2640];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f * 0.85, t + i * 0.035);
      osc.frequency.linearRampToValueAtTime(f * 1.15, t + i * 0.035 + 0.06);
      env.gain.setValueAtTime(0.0001, t + i * 0.035);
      env.gain.linearRampToValueAtTime(0.4, t + i * 0.035 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.035 + 0.12);
      osc.connect(env); env.connect(master);
      osc.start(t + i * 0.035); osc.stop(t + i * 0.035 + 0.14);
    });
  }

  /* ── 3. Dash ─ bassy woosh + teleport shimmer ── */
  _dash() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.35);

    // Pitched noise whoosh (falling)
    const bufLen = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random()*2-1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(800, t);
    lpf.frequency.exponentialRampToValueAtTime(80, t + 0.22);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.7, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    src.connect(lpf); lpf.connect(env); env.connect(master);
    src.start(t); src.stop(t + 0.26);

    // Sub thump
    this._osc('sine', 80, t, 0.18, 0.6, 0.0001, master);
    // Shimmer (high triangle sweep)
    this._osc('triangle', 1200, t + 0.02, 0.12, 0.3, 0.0001, master);
  }

  /* ── 4. Level up ─ anime power-up arpeggio ───── */
  _levelup() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.42);

    // C major arpeggio: C4 E4 G4 C5 E5 + stagger + vibrato
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const dt = t + i * 0.07;
      const osc = ctx.createOscillator();
      const vib = ctx.createOscillator();
      const vibGain = ctx.createGain();
      const env = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, dt);
      vib.type = 'sine'; vib.frequency.value = 6;
      vibGain.gain.value = f * 0.018;
      vib.connect(vibGain); vibGain.connect(osc.frequency);

      env.gain.setValueAtTime(0.0001, dt);
      env.gain.linearRampToValueAtTime(0.5, dt + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, dt + 0.45);

      osc.connect(env); env.connect(master);
      vib.start(dt); osc.start(dt);
      vib.stop(dt + 0.5); osc.stop(dt + 0.5);
    });

    // Shiny high chime
    this._osc('triangle', 2093, t + 0.35, 0.3, 0.35, 0.0001, master);
  }

  /* ── 5. UI Blip ─ tiny clean click ─────────── */
  _uiBlip() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.18);
    this._osc('square', 880, t, 0.04, 0.3, 0.0001, master);
    this._osc('sine', 1320, t, 0.04, 0.15, 0.0001, master);
  }

  /* ── 6. UI Click ─ deeper confirm click ─────── */
  _uiClick() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.22);
    this._osc('sine', 440, t, 0.07, 0.55, 0.0001, master);
    this._osc('triangle', 660, t, 0.06, 0.25, 0.0001, master);
  }

  /* ── 7. Purchase ─ reward chime shimmer ─────── */
  _purchase() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.38);
    // Major 3rd + octave
    [[523.25, 0], [659.25, 0.04], [784.00, 0.08], [1046.5, 0.14]].forEach(([f, dt]) => {
      this._osc('sine', f, t + dt, 0.4, 0.5, 0.0001, master);
    });
    // Sparkle noise flash
    const bufLen = ctx.sampleRate * 0.08;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random()*2-1);
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 6000;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.25, t + 0.14);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    nSrc.connect(hpf); hpf.connect(nEnv); nEnv.connect(master);
    nSrc.start(t + 0.14); nSrc.stop(t + 0.24);
  }

  /* ── 8. Mission Done ─ triumphant fanfare ───── */
  _missionDone() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.40);
    // Stacked power fifths: C4 G4 C5 G5
    [[261.63,0],[392.00,0],[523.25,0.05],[784.00,0.05]].forEach(([f,dt])=>{
      this._osc('sawtooth', f, t+dt, 0.55, 0.45, 0.0001, master);
    });
    // Rising tail
    [[1046.5,0.2],[1318.5,0.28],[1567.98,0.36]].forEach(([f,dt])=>{
      this._osc('triangle', f, t+dt, 0.22, 0.35, 0.0001, master);
    });
    // Chorus shimmer
    const chorus = ctx.createGain(); chorus.gain.value = 1;
    const dly    = ctx.createDelay(0.05); dly.delayTime.value = 0.022;
    const feed   = ctx.createGain(); feed.gain.value = 0.22;
    master.connect(dly); dly.connect(feed); feed.connect(chorus); chorus.connect(ctx.destination);
  }

  /* ── 9. Equip ─ crystalline resonant chime ───── */
  _equip_sfx() {
    const ctx = this._ctx, t = ctx.currentTime;
    const master = this._master(0.38);
    // Ascending crystal tones: pentatonic rise
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => {
      const dt = t + i * 0.055;
      this._osc('triangle', f,     dt, 0.30, 0.45, 0.0001, master);
      this._osc('sine',     f * 2, dt, 0.12, 0.18, 0.0001, master);
    });
    // Shimmer tail — high-frequency sparkle noise
    const bufLen = ctx.sampleRate * 0.14;
    const buf  = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const nSrc = ctx.createBufferSource(); nSrc.buffer = buf;
    const hpf  = ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 7200;
    const nEnv = ctx.createGain();
    nEnv.gain.setValueAtTime(0.18, t + 0.20);
    nEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    nSrc.connect(hpf); hpf.connect(nEnv); nEnv.connect(master);
    nSrc.start(t + 0.20); nSrc.stop(t + 0.35);
    // Sub resonance — deep sine thump
    this._osc('sine', 110, t, 0.18, 0.55, 0.0001, master);
  }

  /* ── BG Music ─ procedural dark synthwave drone ─ */
  _startDrone() {
    const ctx = this._ctx, t = ctx.currentTime;

    this._bgGain = ctx.createGain();
    this._bgGain.gain.value = this._muted ? 0 : 0.30;
    this._bgGain.connect(ctx.destination);

    // Pad: low sub oscillator bed
    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.value = 55; // A1

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 280; lpf.Q.value = 1.4;

    // Slow LFO for filter sweep (gives "breathing" effect)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(lpf.frequency);

    // Chorus-style delay for thickness
    const dly = ctx.createDelay(0.05); dly.delayTime.value = 0.032;
    const dlyGain = ctx.createGain(); dlyGain.gain.value = 0.28;
    const dlyFeed = ctx.createGain(); dlyFeed.gain.value = 0.18;

    sub.connect(lpf); lpf.connect(this._bgGain);
    lpf.connect(dly); dly.connect(dlyGain); dlyGain.connect(this._bgGain);
    dly.connect(dlyFeed); dlyFeed.connect(dly);

    // Slow arpeggio melody (Am pentatonic: A1 C2 E2 G2 — cycle every 4s)
    // Implemented as a timed series of setValueAtTime calls over 16s loop
    const arpFreqs = [55, 65.41, 82.41, 98.00, 110, 130.81, 98.00, 82.41];
    const arpOsc   = ctx.createOscillator();
    arpOsc.type    = 'triangle';
    arpOsc.frequency.value = 55;
    const arpEnv   = ctx.createGain(); arpEnv.gain.value = 0.18;
    const arpLpf   = ctx.createBiquadFilter();
    arpLpf.type = 'lowpass'; arpLpf.frequency.value = 420;

    for (let cycle = 0; cycle < 32; cycle++) {
      const base = t + cycle * (arpFreqs.length * 0.5);
      arpFreqs.forEach((f, i) => {
        const at = base + i * 0.5;
        arpOsc.frequency.setValueAtTime(f, at);
        arpEnv.gain.setValueAtTime(0.18, at);
        arpEnv.gain.setValueAtTime(0.04, at + 0.42);
      });
    }
    arpOsc.connect(arpLpf); arpLpf.connect(arpEnv); arpEnv.connect(this._bgGain);

    // Subtle high-hat noise pulse every 0.5s
    this._scheduleHiHats(ctx, t, this._bgGain);

    sub.start(t); lfo.start(t); arpOsc.start(t);
    this._bgNodes.push(sub, lfo, arpOsc);

    // Loop BG every 16 s (restart drone for seamless loop)
    this._bgLoopTimer = setTimeout(() => {
      if (!this._muted && this._bgStarted) {
        this._bgNodes.forEach(n => { try { n.stop(); } catch(_){} });
        this._bgNodes = [];
        this._bgGain = null;
        this._startDrone();
      }
    }, 16000);
  }

  _scheduleHiHats(ctx, startTime, dest) {
    const interval = 0.25; // 16th notes at ~60bpm
    for (let i = 0; i < 64; i++) {
      const at  = startTime + i * interval;
      const vel = (i % 4 === 0) ? 0.12 : 0.045;
      // Schedule noise burst
      const bufLen = Math.floor(ctx.sampleRate * 0.03);
      const buf  = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) data[j] = Math.random()*2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 8000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(vel, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.025);
      src.connect(hpf); hpf.connect(env); env.connect(dest);
      src.start(at); src.stop(at + 0.03);
    }
  }
}

/* ═══════════════════════════════════════════════════════
   GAME EVENT BUS
   Thin publish/subscribe hub — decouples game logic from
   the TaskManager so neither needs a direct reference.
═══════════════════════════════════════════════════════ */
