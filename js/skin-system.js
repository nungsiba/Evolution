class SkinSystem {
  constructor() {
    this.catalogue      = SKIN_CATALOGUE;
    this._previewCanvas = document.getElementById('preview-canvas');
    this._previewCtx    = this._previewCanvas.getContext('2d');
    this._previewAF     = null;
    this._previewSkinId = null;
    this._previewTrail  = [];
    this._previewAge    = 0;
    this._previewParticles = [];
    this._selectedId    = null;
    this._currentTab    = 'all';

    this._resizePreviewCanvas();
    window.addEventListener('resize', () => this._resizePreviewCanvas());
  }

  _resizePreviewCanvas() {
    const wrap = this._previewCanvas.parentElement;
    const w    = wrap.clientWidth;
    this._previewCanvas.width  = w;
    this._previewCanvas.height = w;
  }

  /* ── Resolve skin data by id ── */
  getSkin(id) {
    return this.catalogue.find(s => s.id === id) || this.catalogue[0];
  }
  getEquipped() {
    return this.getSkin(SaveSystem.getEquipped());
  }

  /* ══════════════════════════════════════════════════
     SHOP UI BUILDER
  ══════════════════════════════════════════════════ */
  openShop() {
    this._updateShopBalance();
    this._buildGrid(this._currentTab);
    document.getElementById('shop-overlay').classList.remove('hidden');
    this._startPreviewLoop();
    if (this._selectedId) this._selectSkin(this._selectedId);
    else this._selectSkin(SaveSystem.getEquipped());
  }

  closeShop() {
    document.getElementById('shop-overlay').classList.add('hidden');
    this._stopPreviewLoop();
  }

  _updateShopBalance() {
    document.getElementById('shop-shard-val').textContent = SaveSystem.getShards();
  }

  _buildGrid(tab) {
    this._currentTab = tab;
    const grid     = document.getElementById('shop-grid');
    const unlocked = SaveSystem.getUnlocked();
    const equipped = SaveSystem.getEquipped();
    const shards   = SaveSystem.getShards();

    grid.innerHTML = '';

    // BUGFIX: the 'ad' tab used to filter by `tier === 'ad'`, but no skin
    // actually has that tier — ad-unlockable skins are flagged `adOnly:
    // true` on a normal tier (e.g. legendary). The tab was always empty.
    const filtered = tab === 'all'
      ? this.catalogue
      : tab === 'ad'
        ? this.catalogue.filter(s => s.adOnly === true)
        : this.catalogue.filter(s => s.tier === tab);

    // In "all" tab, group by tier with headers
    if (tab === 'all') {
      const tierOrder = ['basic', 'premium', 'legendary', 'elite'];
      const tierLabels = {
        basic:     '⬡ Basic · 220 Shards',
        premium:   '✦ Premium · 450 Shards',
        legendary: '★ Legendary · 670 Shards',
        elite:     '⚡ Elite · 1,300 Shards',
      };
      tierOrder.forEach(tier => {
        const group = filtered.filter(s => s.tier === tier);
        if (group.length === 0) return;
        // Section header
        const hdr = document.createElement('div');
        hdr.className = 'grid-tier-header';
        hdr.innerHTML = `${tierLabels[tier]} <span class="tier-count">${group.length} skins</span>`;
        grid.appendChild(hdr);
        group.forEach(skin => this._appendSkinCard(grid, skin, unlocked, equipped, shards));
      });
      // Achievement-only and Ad-only at bottom
      const special = filtered.filter(s => !tierOrder.includes(s.tier));
      if (special.length) {
        const hdr = document.createElement('div');
        hdr.className = 'grid-tier-header';
        hdr.innerHTML = `🎬 Special Unlocks`;
        grid.appendChild(hdr);
        special.forEach(skin => this._appendSkinCard(grid, skin, unlocked, equipped, shards));
      }
    } else {
      filtered.forEach(skin => this._appendSkinCard(grid, skin, unlocked, equipped, shards));
    }

    // Update tab counts
    this._updateTabCounts();
  }

  _updateTabCounts() {
    const tiers = ['basic','premium','legendary','elite'];
    tiers.forEach(t => {
      const tab = document.querySelector(`.shop-tab[data-tab="${t}"]`);
      if (!tab) return;
      const count = this.catalogue.filter(s => s.tier === t).length;
      let badge = tab.querySelector('.tab-count');
      if (!badge) { badge = document.createElement('span'); badge.className = 'tab-count'; tab.appendChild(badge); }
      badge.textContent = `(${count})`;
    });
  }

  _appendSkinCard(grid, skin, unlocked, equipped, shards) {
    const isOwned    = unlocked.includes(skin.id);
    const isEquipped = skin.id === equipped;
    const canAfford  = shards >= skin.price;
    const isElite    = skin.tier === 'elite';

    const card = document.createElement('div');
    card.className = 'skin-card' +
      (isElite ? ' tier-elite-card' : '') +
      (this._selectedId === skin.id ? ' selected' : '') +
      (isEquipped ? ' equipped' : '');
    card.dataset.skinId = skin.id;

    // Mini canvas preview
    const miniCanvas = document.createElement('canvas');
    miniCanvas.className = 'skin-mini-canvas';
    miniCanvas.width  = 150;
    miniCanvas.height = 80;
    this._renderMiniPreview(miniCanvas, skin);
    card.appendChild(miniCanvas);

    // Badge
    if (isEquipped) {
      const badge = document.createElement('div');
      badge.className = 'skin-equipped-badge';
      badge.textContent = 'EQUIPPED';
      card.appendChild(badge);
    } else if (isOwned) {
      const badge = document.createElement('div');
      badge.className = 'skin-owned-badge';
      badge.textContent = 'OWNED';
      card.appendChild(badge);
    } else if (isElite) {
      const badge = document.createElement('div');
      badge.className = 'skin-elite-badge';
      badge.textContent = '⚡ ELITE';
      card.appendChild(badge);
    }

    // Name
    const nameEl = document.createElement('span');
    nameEl.className = 'skin-card-name';
    nameEl.textContent = skin.name;
    card.appendChild(nameEl);

    // Tier label
    const tierEl = document.createElement('span');
    tierEl.className = `skin-card-tier tier-${skin.tier}`;
    tierEl.textContent = skin.tier === 'elite' ? '⚡ ELITE' : skin.tier.toUpperCase();
    card.appendChild(tierEl);

    // Action button
    const btn = document.createElement('button');
    btn.className = 'skin-action-btn ';
    if (isEquipped) {
      btn.className += 'btn-equipped';
      btn.textContent = '✓ Equipped';
      btn.disabled = true;
    } else if (isOwned) {
      btn.className += 'btn-equip';
      btn.textContent = 'Equip';
      btn.addEventListener('click', e => { e.stopPropagation(); this._equip(skin.id); });
    } else if (skin.adOnly) {
      btn.className += 'btn-ad';
      btn.textContent = '🎬 Watch Ad';
      btn.addEventListener('click', e => { e.stopPropagation(); this._buyWithAd(skin.id); });
    } else {
      btn.className += isElite ? 'btn-elite-buy' : 'btn-buy';
      btn.textContent = `⬡ ${skin.price}`;
      btn.disabled = !canAfford;
      btn.addEventListener('click', e => { e.stopPropagation(); this._buy(skin.id); });
    }
    card.appendChild(btn);

    card.addEventListener('click', () => this._selectSkin(skin.id));
    grid.appendChild(card);
  }

  _selectSkin(id) {
    this._selectedId = id;
    const skin = this.getSkin(id);
    const unlocked = SaveSystem.getUnlocked();
    const equipped  = SaveSystem.getEquipped();
    const isOwned   = unlocked.includes(id);
    const isEquipped = id === equipped;
    const shards    = SaveSystem.getShards();

    // Update card selection state
    document.querySelectorAll('.skin-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.skinId === id);
    });

    // Preview panel info
    document.getElementById('preview-skin-name').textContent = skin.name;
    const tierEl = document.getElementById('preview-skin-tier');
    tierEl.textContent = skin.tier.toUpperCase();
    tierEl.className = `tier-${skin.tier}`;
    document.getElementById('preview-skin-desc').textContent = skin.desc;

    const priceEl  = document.getElementById('preview-skin-price');
    const actionEl = document.getElementById('preview-action-btn');

    if (isEquipped) {
      priceEl.style.display = 'none';
      actionEl.style.display = 'block';
      actionEl.textContent   = '✓ Currently Equipped';
      actionEl.className     = 'skin-action-btn btn-equipped';
      actionEl.disabled      = true;
      actionEl.onclick       = null;
    } else if (isOwned) {
      priceEl.style.display = 'none';
      actionEl.style.display = 'block';
      actionEl.textContent   = 'Equip Skin';
      actionEl.className     = 'skin-action-btn btn-equip';
      actionEl.disabled      = false;
      actionEl.onclick       = () => this._equip(id);
    } else if (skin.adOnly) {
      priceEl.style.display  = 'none';
      actionEl.style.display = 'block';
      actionEl.textContent   = '🎬 Watch Ad to Unlock';
      actionEl.className     = 'skin-action-btn btn-ad';
      actionEl.disabled      = false;
      actionEl.onclick       = () => this._buyWithAd(id);
    } else if (skin.tier === 'elite') {
      priceEl.style.display  = 'block';
      priceEl.textContent    = `⬡ ${skin.price} Soul Shards · Also earnable via Season Pass`;
      actionEl.style.display = 'block';
      actionEl.textContent   = shards >= skin.price ? `⚡ Buy Elite ⬡ ${skin.price}` : `Need ⬡ ${skin.price - shards} more`;
      actionEl.className     = 'skin-action-btn btn-elite-buy';
      actionEl.disabled      = shards < skin.price;
      actionEl.onclick       = () => this._buy(id);
    } else {
      priceEl.style.display  = 'block';
      priceEl.textContent    = `⬡ ${skin.price} Soul Shards`;
      actionEl.style.display = 'block';
      actionEl.textContent   = shards >= skin.price ? `Buy for ⬡ ${skin.price}` : `Need ⬡ ${skin.price - shards} more`;
      actionEl.className     = 'skin-action-btn btn-buy';
      actionEl.disabled      = shards < skin.price;
      actionEl.onclick       = () => this._buy(id);
    }

    // Kick off preview animation for this skin
    this._previewSkinId = id;
    this._previewTrail  = [];
    this._previewParticles = [];

    // Show bonus stats if the skin has them
    const bonusPanel = document.getElementById('preview-bonus-stats');
    const bonusLines = document.getElementById('preview-bonus-lines');
    if (bonusPanel && bonusLines) {
      if (skin.bonuses || skin.bonusLabel) {
        bonusPanel.classList.add('visible');
        bonusLines.innerHTML = '';
        const label = skin.bonusLabel || this._formatBonuses(skin.bonuses);
        label.split('·').forEach(part => {
          const line = document.createElement('div');
          line.className = 'bonus-stat-line';
          line.textContent = '▸ ' + part.trim();
          bonusLines.appendChild(line);
        });
      } else {
        bonusPanel.classList.remove('visible');
      }
    }
  }

  _formatBonuses(b) {
    if (!b) return '';
    const parts = [];
    if (b.damageBonus) parts.push(`+${Math.round((b.damageBonus-1)*100)}% Damage`);
    if (b.speedBonus)  parts.push(`+${Math.round((b.speedBonus-1)*100)}% Movement Speed`);
    if (b.dashBonus)   parts.push(`+${Math.round((b.dashBonus-1)*100)}% Dash Speed`);
    if (b.shardGain)   parts.push(`+${Math.round((b.shardGain-1)*100)}% Soul Shards`);
    return parts.join(' · ');
  }

  _buy(id) {
    const skin = this.getSkin(id);
    if (SaveSystem.getUnlocked().includes(id)) { this._toast('Already owned!'); return; }
    if (!SaveSystem.spendShards(skin.price)) { this._toast('Not enough Soul Shards!'); return; }
    SaveSystem.unlockSkin(id);
    this._toast(`Unlocked: ${skin.name}!`);
    window._sfx?.play('purchase');
    this._updateShopBalance();
    updateMenuShards();
    this._buildGrid(this._currentTab);
    this._selectSkin(id);
  }

  _equip(id) {
    SaveSystem.equipSkin(id);
    const skin = this.getSkin(id);
    this._toast(`Equipped: ${skin.name}!`);
    // Primary equip feel: bassy dash woosh for impact, followed by crystalline chime
    window._sfx?.play('dash');
    setTimeout(() => window._sfx?.play('equip'), 160);
    // Full-screen equip flash in the skin's own glow colour
    this._doEquipFlash(skin.glowColor || '#00f5ff');
    this._buildGrid(this._currentTab);
    this._selectSkin(id);
  }

  _doEquipFlash(color) {
    // Full-screen radial flash overlay
    const el = document.createElement('div');
    el.className = 'equip-flash-overlay';
    // Radial gradient so the flash feels like an energy burst from center
    el.style.background = [
      `radial-gradient(ellipse at center,`,
      `${color}66 0%,`,
      `${color}22 35%,`,
      `${color}08 60%,`,
      `transparent 80%)`,
    ].join(' ');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);

    // Secondary: horizontal sweep line across the preview canvas
    const ctx = this._previewCtx;
    if (ctx) {
      const W = this._previewCanvas.width, H = this._previewCanvas.height;
      ctx.save();
      // Bright horizontal line sweep at canvas center
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, color + 'cc');
      grad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.3, W, H * 0.4);
      ctx.restore();
    }
  }

  _buyWithAd(id) {
    this._toast('Loading ad…');
    CrazyGames.SDK.ad.requestAd('rewarded', {
      adRewarded: () => {
        SaveSystem.unlockSkin(id);
        this._toast(`🎬 Ad watched! ${this.getSkin(id).name} unlocked!`);
        this._buildGrid(this._currentTab);
        this._selectSkin(id);
      },
      adFinished: () => {}
    });
  }

  _toast(msg) {
    const t = document.getElementById('shop-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  /* ══════════════════════════════════════════════════
     MINI CARD PREVIEW  (static snapshot)
  ══════════════════════════════════════════════════ */
  _renderMiniPreview(canvas, skin) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W * 0.55, cy = H * 0.5;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    // Draw a static trail snapshot
    const trailLen = 10;
    for (let i = trailLen; i >= 0; i--) {
      const t  = i / trailLen;
      const tx = cx - i * 11;
      const ty = cy + Math.sin(i * 0.6) * 8;
      const alpha = (1 - t) * 0.7;
      const r = 8 * (1 - t * 0.5);
      this._drawTrailDot(ctx, skin, tx, ty, alpha, r, t, trailLen, i);
    }

    // Player body
    this._drawPlayerBody(ctx, skin, cx, cy, 8, false);
  }

  /* ══════════════════════════════════════════════════
     LIVE PREVIEW LOOP  (animated canvas)
  ══════════════════════════════════════════════════ */
  _startPreviewLoop() {
    this._stopPreviewLoop();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      this._tickPreview(dt);
      this._previewAF = requestAnimationFrame(loop);
    };
    this._previewAF = requestAnimationFrame(loop);
  }

  _stopPreviewLoop() {
    if (this._previewAF) { cancelAnimationFrame(this._previewAF); this._previewAF = null; }
  }

  _tickPreview(dt) {
    const canvas = this._previewCanvas;
    const ctx    = this._previewCtx;
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;

    this._previewAge += dt;
    const t  = this._previewAge;
    const cx = W / 2 + Math.cos(t * 1.1) * W * 0.28;
    const cy = H / 2 + Math.sin(t * 0.7) * H * 0.22;

    // Background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(3,0,10,0.92)';
    ctx.fillRect(0, 0, W, H);

    if (!this._previewSkinId) return;
    const skin = this.getSkin(this._previewSkinId);

    // Trail
    this._previewTrail.unshift({ x: cx, y: cy });
    if (this._previewTrail.length > 28) this._previewTrail.pop();

    const trailLen = this._previewTrail.length;
    for (let i = trailLen - 1; i >= 0; i--) {
      const p     = this._previewTrail[i];
      const frac  = i / trailLen;
      const alpha = (1 - frac) * 0.75;
      const r     = 11 * (1 - frac * 0.55);
      this._drawTrailDot(ctx, skin, p.x, p.y, alpha, r, frac, trailLen, i);
    }

    // Legendary particles
    this._tickLegendaryParticles(ctx, skin, cx, cy, dt);

    // Player body
    const inv = false;
    this._drawPlayerBody(ctx, skin, cx, cy, 12, inv);
  }

  /* Draw a single trail dot, logic differs by skin type */
  _drawTrailDot(ctx, skin, x, y, alpha, r, frac, total, idx) {
    // Map new types to base renderers
    const effectiveType = {
      pulse:  'gradient',
      orbit:  'void',
      nova:   'flame',
      dragon: 'flame',
    }[skin.type] || skin.type;

    switch (effectiveType) {
      case 'solid': {
        const c = skin.colors[0];
        const hex = '#' + c.toString(16).padStart(6,'0');
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI*2);
        const grd = ctx.createRadialGradient(x,y,0,x,y,r*1.6);
        grd.addColorStop(0, hex); grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd; ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = hex; ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'gradient': {
        // Pulse skins oscillate their blend factor using previewAge
        const pulseOffset = skin.type === 'pulse'
          ? 0.5 + 0.5 * Math.sin((this._previewAge || 0) * 3.5 + idx * 0.3)
          : frac;
        const t     = pulseOffset;
        const c1    = skin.colors[0], c2 = skin.colors[skin.colors.length > 1 ? 1 : 0];
        const r1    = (c1>>16)&0xff, g1=(c1>>8)&0xff, b1=c1&0xff;
        const r2    = (c2>>16)&0xff, g2=(c2>>8)&0xff, b2=c2&0xff;
        const ri    = Math.round(r1*(1-t)+r2*t);
        const gi    = Math.round(g1*(1-t)+g2*t);
        const bi    = Math.round(b1*(1-t)+b2*t);
        const hex   = `rgb(${ri},${gi},${bi})`;
        ctx.globalAlpha = alpha * 0.45;
        const grd   = ctx.createRadialGradient(x,y,0,x,y,r*1.7);
        grd.addColorStop(0, hex); grd.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(x,y,r*1.7,0,Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = hex; ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      default:
        // Legendary/particle skins: faint ghost trail; particles handled in _tickLegendaryParticles
        ctx.globalAlpha = alpha * 0.2;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.globalAlpha = 1;
    }
  }

  _tickLegendaryParticles(ctx, skin, cx, cy, dt) {
    // All particle-emitting types
    const particleTypes = ['flame','electric','void','nova','orbit','dragon'];
    if (!particleTypes.includes(skin.type)) return;

    // Resolve effective behavior
    const isFlame    = skin.type === 'flame' || skin.type === 'nova' || skin.type === 'dragon';
    const isElectric = skin.type === 'electric';
    const isOrbit    = skin.type === 'void' || skin.type === 'orbit';

    // Spawn
    const spawnCount = isElectric ? 1 : (skin.type === 'orbit' ? 0 : 2); // orbit uses fixed orbs
    for (let i = 0; i < spawnCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = isOrbit ? 20 + Math.random()*30 : 40 + Math.random()*80;
      const p   = {
        x: cx + (Math.random()-0.5)*12,
        y: cy + (Math.random()-0.5)*12,
        vx: Math.cos(ang)*spd,
        vy: Math.sin(ang)*spd,
        life: 1.0,
        decay: isElectric ? 0.04 : 0.025 + Math.random()*0.02,
        size: isOrbit ? 3+Math.random()*4 : 2+Math.random()*4,
        rot: Math.random()*Math.PI*2,
        rotSpd: (Math.random()-0.5)*8,
        color: skin.colors[Math.floor(Math.random()*skin.colors.length)]
      };
      if (isFlame)    { p.vy -= 60 + Math.random()*40; }
      if (skin.type === 'nova') { p.vx *= 1.6; p.vy *= 1.6; p.decay = 0.018; } // outward burst
      if (isElectric) { p.vx *= 3; p.vy *= 3; p.decay = 0.12; }
      this._previewParticles.push(p);
    }

    // Orbiting skins: draw fixed rotating orbs (orbit/void)
    if (skin.type === 'orbit') {
      const t   = this._previewAge;
      const orbs = 6;
      const orbitR = 30;
      for (let i = 0; i < orbs; i++) {
        const ang = t * 2.2 + (i / orbs) * Math.PI * 2;
        const ox  = cx + Math.cos(ang) * orbitR;
        const oy  = cy + Math.sin(ang) * orbitR;
        const col = skin.colors[i % skin.colors.length];
        const hex = '#' + col.toString(16).padStart(6,'0');
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, Math.PI*2);
        ctx.fillStyle = hex;
        ctx.shadowColor = hex; ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // Cap particles for performance
    if (this._previewParticles.length > 100) {
      this._previewParticles.splice(0, this._previewParticles.length - 100);
    }

    // Update + draw
    for (let i = this._previewParticles.length - 1; i >= 0; i--) {
      const p = this._previewParticles[i];
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.life -= p.decay;
      if (skin.type === 'flame') p.vy -= 30 * dt;
      if (skin.type === 'void')  p.rot += p.rotSpd * dt;
      if (p.life <= 0) { this._previewParticles.splice(i, 1); continue; }

      const hex = '#' + p.color.toString(16).padStart(6,'0');
      ctx.globalAlpha = p.life * 0.9;

      if (skin.type === 'void') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = hex;
        ctx.shadowColor = hex; ctx.shadowBlur = 6;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      } else if (skin.type === 'electric') {
        ctx.strokeStyle = hex;
        ctx.lineWidth   = p.size * 0.6;
        ctx.shadowColor = hex; ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx*0.03, p.y + p.vy*0.03);
        ctx.stroke();
      } else {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size*1.5);
        grd.addColorStop(0, hex); grd.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*1.5, 0, Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur  = 0;
    }
  }

  /* Draw the player silhouette with the skin's body glow */
  _drawPlayerBody(ctx, skin, x, y, r, flicker) {
    if (flicker) return;
    const glow = skin.bodyGlow || '#00f5ff';
    // Outer aura
    const aura = ctx.createRadialGradient(x,y,0,x,y,r*3);
    aura.addColorStop(0, glow + '44');
    aura.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(x,y,r*3,0,Math.PI*2);
    ctx.fillStyle = aura; ctx.fill();
    // Inner glow ring
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(x,y,r*1.8,0,Math.PI*2);
    const innerGrd = ctx.createRadialGradient(x,y,0,x,y,r*1.8);
    innerGrd.addColorStop(0, glow+'88'); innerGrd.addColorStop(1,'transparent');
    ctx.fillStyle = innerGrd; ctx.fill();
    ctx.globalAlpha = 1;
    // Core white dot
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
}

/* ═══════════════════════════════════════════════════════
   GAME-SIDE LEGENDARY PARTICLE EMITTER
   Attached to Player, runs in Phaser (Graphics objects)
   Pooled & capped for 60fps performance
═══════════════════════════════════════════════════════ */
