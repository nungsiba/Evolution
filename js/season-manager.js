class SeasonManager {
  constructor() {
    this._spinning   = false;
    this._wheelAngle = 0;
    this._wheelAF    = null;
    this._domReady   = false;

    // Wheel segments: prizes on the wheel
    this._segments = [
      { label: '50⬡',       color: '#1a0a3a', text: '#c084fc' },
      { label: '100⬡',      color: '#0a1a2a', text: '#00ffff' },
      { label: '☀ SKIN!',   color: '#2a0a00', text: '#ff8c00' },
      { label: '200⬡',      color: '#1a0a3a', text: '#c084fc' },
      { label: '75⬡',       color: '#0a1a0a', text: '#00ff88' },
      { label: '150⬡',      color: '#0a1a2a', text: '#00ffff' },
      { label: 'TRY AGAIN', color: '#100a1a', text: '#556' },
      { label: '500⬡',      color: '#1a1a0a', text: '#ffd700' },
    ];

    KangleipungSaveSystem.checkDailySpinReset();

    // Defer DOM-dependent init until document is ready
    const _seasonDOMInit = () => {
      this._domReady = true;
      this._drawWheel(this._wheelAngle);
      this._updatePassUI();
      this._wireButtons();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _seasonDOMInit);
    } else {
      _seasonDOMInit();
    }

    // Listen for soul absorption → season XP
    GameEvents.on('ENEMY_KILLED', (p) => {
      // Each enemy kill counts as 1 soul; tier handled by onEnemyDeath
    });
  }

  /* ── Public: called when a soul pellet is collected ── */
  onSoulsAbsorbed(count) {
    KangleipungSaveSystem.absorbSouls(count);
    this._updatePassUI();
  }

  /* ── Wire UI buttons ──────────────────────────────── */
  _wireButtons() {
    document.getElementById('btn-spin-shards')?.addEventListener('click', () => {
      if (this._spinning) return;
      const cost = 500;
      if (!SaveSystem.spendShards(cost)) {
        this._showResult('Not enough Soul Shards! Need ⬡500.', false);
        return;
      }
      updateMenuShards();
      this._doSpin(false);
    });

    document.getElementById('season-close-btn')?.addEventListener('click', () => this.close());
  }

  /* ── Open / Close ─────────────────────────────────── */
  open() {
    KangleipungSaveSystem.checkDailySpinReset();
    this._updatePassUI();
    this._updateSpinUI();
    document.getElementById('season-shard-val').textContent = SaveSystem.getShards();
    document.getElementById('season-overlay').classList.remove('hidden');
    this._drawWheel(this._wheelAngle);
  }

  close() {
    document.getElementById('season-overlay').classList.add('hidden');
  }

  /* ── Wheel rendering (Canvas 2D) ──────────────────── */
  _drawWheel(angle) {
    const canvas = document.getElementById('spin-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 100, cy = 100, r = 96;
    const segs = this._segments;
    const arc = (Math.PI * 2) / segs.length;

    ctx.clearRect(0, 0, 200, 200);

    segs.forEach((seg, i) => {
      const start = angle + i * arc;
      const end   = start + arc;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = 'rgba(0,255,255,0.15)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = seg.text;
      ctx.font = seg.label.includes('SKIN') ? 'bold 11px Cinzel, serif' : '11px Rajdhani, sans-serif';
      ctx.fillText(seg.label, r - 10, 4);
      ctx.restore();
    });

    // Center cap
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    grad.addColorStop(0, '#1a0033');
    grad.addColorStop(1, '#08001a');
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Center glyph
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.font = '14px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬡', cx, cy + 5);
  }

  /* ── Spin animation ───────────────────────────────── */
  _doSpin(isFree) {
    if (this._spinning) return;
    this._spinning = true;
    const data = KangleipungSaveSystem.recordSpin();
    this._updateSpinUI();

    // Determine prize FIRST (then animate to land on it)
    const won = Math.random() < 0.015; // 1.5% skin chance
    let prizeSegIdx;
    let shardPrize = 0;

    if (won) {
      prizeSegIdx = this._segments.findIndex(s => s.label.includes('SKIN'));
    } else {
      // Pick a shard segment randomly
      const shardSegs = this._segments
        .map((s, i) => ({ i, s }))
        .filter(x => !x.s.label.includes('SKIN') && !x.s.label.includes('TRY'));
      const pick = shardSegs[Math.floor(Math.random() * shardSegs.length)];
      prizeSegIdx = pick ? pick.i : 0;
      // Parse shards from label
      const match = this._segments[prizeSegIdx]?.label.match(/(\d+)/);
      shardPrize = match ? parseInt(match[1]) : 50;
    }

    const arc    = (Math.PI * 2) / this._segments.length;
    // Target angle: pointer is at top (−π/2), so we aim the center of prize segment there
    const targetSegAngle = -(prizeSegIdx * arc + arc / 2);
    const extraSpins = (4 + Math.floor(Math.random() * 4)) * Math.PI * 2;
    const targetTotal = extraSpins + targetSegAngle;

    const duration  = 3200; // ms
    const startTime = performance.now();
    const startAngle = this._wheelAngle;

    const ease = (t) => t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now) => {
      const elapsed = now - startTime;
      const t       = Math.min(elapsed / duration, 1);
      this._wheelAngle = startAngle + targetTotal * ease(t);
      this._drawWheel(this._wheelAngle);

      if (t < 1) {
        this._wheelAF = requestAnimationFrame(animate);
      } else {
        this._spinning = false;
        this._onSpinResult(won, shardPrize);
      }
    };

    // Hide result while spinning
    const msg = document.getElementById('spin-result-msg');
    if (msg) { msg.textContent = ''; msg.className = 'spin-result-msg'; }

    this._wheelAF = requestAnimationFrame(animate);
    window._sfx?.play('dash'); // woosh SFX on spin
  }

  _onSpinResult(won, shards) {
    const msg = document.getElementById('spin-result-msg');

    if (won) {
      if (KangleipungSaveSystem.hasSkin('solar_eclipse')) {
        // Already owned — give shards instead
        const bonus = 1000;
        SaveSystem.addShards(bonus);
        updateMenuShards();
        msg.textContent = `☀ Solar Eclipse already owned! +${bonus}⬡ bonus!`;
        msg.className   = 'spin-result-msg visible win';
      } else {
        KangleipungSaveSystem.unlockSeasonSkin('solar_eclipse');
        msg.textContent = '🌑 ☀ SOLAR ECLIPSE UNLOCKED! Congratulations!';
        msg.className   = 'spin-result-msg visible win';
        window._sfx?.play('missionDone');
        this._celebrateUnlock();
      }
    } else if (shards > 0) {
      SaveSystem.addShards(shards);
      updateMenuShards();
      document.getElementById('season-shard-val').textContent = SaveSystem.getShards();
      msg.textContent = `+${shards} Soul Shards earned!`;
      msg.className   = 'spin-result-msg visible';
      window._sfx?.play('collect');
    } else {
      msg.textContent = 'Better luck next spin!';
      msg.className   = 'spin-result-msg visible';
    }

    this._updateSpinUI();
  }

  /* ── Elite unlock celebration ─────────────────────── */
  _celebrateUnlock() {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      fontFamily: "'Cinzel', serif",
    });
    overlay.innerHTML = `
      <div style="font-size:52px;margin-bottom:16px;filter:drop-shadow(0 0 30px #ff8c00);">🌑☀🌑</div>
      <div style="font-size:28px;letter-spacing:6px;color:#ff8c00;text-shadow:0 0 30px #ff8c00;margin-bottom:8px;">SOLAR ECLIPSE</div>
      <div style="font-size:13px;letter-spacing:4px;color:rgba(255,255,255,0.6);margin-bottom:32px;">SKIN UNLOCKED</div>
      <div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-bottom:24px;">+12% Damage · +15% Soul Shard Gain</div>
      <button onclick="this.parentElement.remove()" style="font-family:'Cinzel',serif;font-size:13px;letter-spacing:3px;padding:12px 36px;border:1px solid #ff8c00;color:#ff8c00;background:transparent;border-radius:4px;cursor:pointer;">CLAIM & EQUIP</button>
    `;
    overlay.querySelector('button').addEventListener('click', () => {
      SaveSystem.equipSkin('solar_eclipse');
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  _onEliteUnlocked() {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
      fontFamily: "'Cinzel', serif",
    });
    overlay.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px;filter:drop-shadow(0 0 30px #8a2be2);">🌑</div>
      <div style="font-size:24px;letter-spacing:5px;color:#c084fc;text-shadow:0 0 25px #8a2be2;margin-bottom:8px;">SHADOW REAPER</div>
      <div style="font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.5);margin-bottom:24px;">ELITE SEASON PASS REWARD — LEVEL 20</div>
      <div style="font-size:11px;letter-spacing:2px;color:rgba(0,255,255,0.65);margin-bottom:28px;">+15% Dash Speed · +10% Soul Shard Gain</div>
      <button onclick="this.parentElement.remove()" style="font-family:'Cinzel',serif;font-size:13px;letter-spacing:3px;padding:12px 36px;border:1px solid #8a2be2;color:#c084fc;background:transparent;border-radius:4px;cursor:pointer;">CLAIM REWARD</button>
    `;
    overlay.querySelector('button').addEventListener('click', () => {
      SaveSystem.equipSkin('shadow_reaper');
      overlay.remove();
    });
    document.body.appendChild(overlay);
    window._sfx?.play('missionDone');
  }

  /* ── UI refresh helpers ────────────────────────────── */
  _updateSpinUI() {
    const count = KangleipungSaveSystem.getSpins();
    const el    = document.getElementById('spin-count-display');
    if (el) el.textContent = count;

    const shardBtn = document.getElementById('btn-spin-shards');
    if (shardBtn) {
      const owned = KangleipungSaveSystem.hasSkin('solar_eclipse');
      shardBtn.disabled = this._spinning;
      shardBtn.textContent = owned ? '⬡ 500 · Spin (Shard Bonus)' : '⬡ 500 · Spirit Spin';
    }

    const msg = document.getElementById('spin-result-msg');
    if (msg && KangleipungSaveSystem.hasSkin('solar_eclipse') && !msg.textContent) {
      msg.textContent = '☀ Solar Eclipse Owned!';
      msg.className   = 'spin-result-msg visible';
    }
  }

  _updatePassUI() {
    const d      = KangleipungSaveSystem.load();
    const level  = d.S1_LEVEL;
    const xp     = d.S1_XP;
    const needed = level < 20 ? level * KangleipungSaveSystem.XP_PER_LEVEL : 0;
    const pct    = needed > 0 ? Math.min(100, (xp / needed) * 100) : 100;

    // Text labels
    const levelNum = document.getElementById('pass-level-num');
    const xpCur    = document.getElementById('pass-xp-current');
    const xpNeed   = document.getElementById('pass-xp-needed');
    const xpFill   = document.getElementById('pass-xp-bar-fill');
    const rwStatus = document.getElementById('pass-reward-status');

    if (levelNum) levelNum.textContent = level;
    if (xpCur)    xpCur.textContent   = xp;
    if (xpNeed)   xpNeed.textContent  = needed > 0 ? needed : '—';
    if (xpFill)   xpFill.style.width  = pct + '%';
    if (rwStatus) {
      if (d.S1_UNLOCKED_SKINS.includes('solar_eclipse')) {
        rwStatus.textContent       = '☀ UNLOCKED';
        rwStatus.style.color       = '#ff8c00';
        rwStatus.style.borderColor = 'rgba(255,140,0,0.4)';
        rwStatus.style.background  = 'rgba(255,140,0,0.08)';
        rwStatus.style.textShadow  = '0 0 8px rgba(255,140,0,0.6)';
      } else {
        rwStatus.textContent       = `🔒 LEVEL 20 (${level}/20)`;
        rwStatus.style.color       = '';
        rwStatus.style.borderColor = '';
        rwStatus.style.background  = '';
        rwStatus.style.textShadow  = '';
      }
    }

    // Build pip bars
    const row = document.getElementById('pass-levels-row');
    if (row) {
      row.innerHTML = '';
      for (let i = 1; i <= 20; i++) {
        const pip  = document.createElement('div');
        pip.className = 'pass-level-pip';
        const bar  = document.createElement('div');
        bar.className = 'pass-pip-bar' +
          (i < level ? ' filled' : '') +
          (i === level ? ' current' : '') +
          (i === 20 ? ' elite' : '');
        if (i === 20 && d.S1_UNLOCKED_SKINS.includes('solar_eclipse')) {
          bar.classList.add('filled');
        }
        const num = document.createElement('div');
        num.className = 'pass-pip-num' + (i === 20 ? ' elite-num' : '');
        num.textContent = i === 20 ? '☀' : (i % 5 === 0 ? i : '');
        pip.appendChild(bar);
        pip.appendChild(num);
        row.appendChild(pip);
      }
    }
  }

  /* ── Season Pass Level 20: Solar Eclipse unlock celebration ── */
  _onPassEliteUnlocked() {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.90)', backdropFilter: 'blur(14px)',
      fontFamily: "'Cinzel', serif",
    });
    overlay.innerHTML = `
      <div style="font-size:58px;margin-bottom:18px;
        filter:drop-shadow(0 0 30px #ff8c00) drop-shadow(0 0 60px rgba(255,140,0,0.4));">☀</div>
      <div style="font-size:10px;letter-spacing:6px;color:rgba(255,255,255,0.35);
        margin-bottom:8px;text-transform:uppercase;">Season Pass · Level 20 Achieved</div>
      <div style="font-size:32px;letter-spacing:6px;font-weight:900;
        color:#ff8c00;text-shadow:0 0 30px #ff8c00, 0 0 60px rgba(255,140,0,0.4);
        margin-bottom:8px;">SOLAR ECLIPSE</div>
      <div style="font-size:12px;letter-spacing:3px;color:rgba(255,255,255,0.5);
        margin-bottom:10px;">⚡ ELITE SEASON SKIN UNLOCKED</div>
      <div style="font-size:11px;letter-spacing:2px;margin-bottom:32px;
        color:rgba(255,215,0,0.8);text-shadow:0 0 8px rgba(255,215,0,0.4);">
        +12% Damage&nbsp;&nbsp;·&nbsp;&nbsp;+8% Movement Speed&nbsp;&nbsp;·&nbsp;&nbsp;+15% Soul Shard Gain
      </div>
      <button id="pass-claim-btn" style="font-family:'Cinzel',serif;font-size:13px;
        letter-spacing:3px;padding:13px 40px;border:1px solid #ff8c00;
        color:#ff8c00;background:transparent;border-radius:4px;cursor:pointer;
        transition:all 0.2s;">☀ EQUIP SOLAR ECLIPSE</button>
    `;
    const btn = overlay.querySelector('#pass-claim-btn');
    btn.addEventListener('mouseenter', () => {
      btn.style.background  = 'rgba(255,140,0,0.12)';
      btn.style.boxShadow   = '0 0 20px rgba(255,140,0,0.45)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background  = 'transparent';
      btn.style.boxShadow   = '';
    });
    btn.addEventListener('click', () => {
      SaveSystem.equipSkin('solar_eclipse');
      window._sfx?.play('equip');
      overlay.remove();
    });
    document.body.appendChild(overlay);
    window._sfx?.play('missionDone');
  }
}   // ── end SeasonManager ──────────────────────────────

/* ═══════════════════════════════════════════════════════
   SOUND MANAGER
   All synthesis done via Web Audio API — zero file deps.
   Phaser is used only for its audio context bootstrap;
   we grab the same AudioContext it creates so there are
   no duplicate contexts competing for resources.

   Sound palette:
     slash        — metal swish  (filtered noise + pitch)
     collect      — high sparkle  (sine sweep up)
     dash         — bassy woosh   (detuned sawtooth + LPF sweep)
     levelup      — anime power-up (major arpeggio + chorus)
     uiBlip       — clean blip    (square click)
     uiClick      — deeper click  (sine transient)
     purchase     — reward chime  (major 3rd + shimmer)
     missionDone  — triumphant fanfare (stacked fifths)
     bgMusic      — procedural dark-synthwave drone (oscillator loop)
═══════════════════════════════════════════════════════ */
