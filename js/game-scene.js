/* ═══════════════════════════════════════════════════════
   GAME SCENE
   Rank Mode / RankManager removed — endless CLASSIC survival
   is now the only mode. Real-time co-op hooks added: local
   player position/state is broadcast each tick, and remote
   players are drawn as ghost sprites (see js/multiplayer.js).
═══════════════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor(){super({key:'GameScene'});}

  create(){
    CrazyGames.SDK.game.sdkGameLoadingStop();
    CrazyGames.SDK.game.gameplayStart();
    this.W=this.scale.width; this.H=this.scale.height;
    this.enemies=[]; this.pellets=[]; this.projectiles=[];
    this.spatialGrid=new SpatialGrid(130);
    this.killCount=0; this.runShards=0; this.upgradesTaken=0;
    this.level=1; this.xp=0; this.xpNeeded=8;
    this.waveTimer=0; this.waveInterval=2200;
    this.running=true; this.paused=false;
    this._lastEmittedLevel = 0; // BUGFIX: LEVEL_REACHED used to fire every frame

    this.starGfx=this.add.graphics().setDepth(0); this._drawStars();
    this.vigGfx =this.add.graphics().setDepth(1);  this._drawVignette();

    this.player=new Player(this, window._skinSystem);

    this.pointer={x:this.W/2,y:this.H/2};
    this.input.on('pointermove',p=>{this.pointer.x=p.x;this.pointer.y=p.y;});
    this.input.on('pointerdown',p=>{this.pointer.x=p.x;this.pointer.y=p.y;});
    this._updateHUD();
    GameEvents.emit('RUN_STARTED', {});
    this._nodmgSinceDmg = true;
    window._sfx?.startBGMusic();

    // ── Co-op multiplayer: remote player ghosts ─────────
    this.remoteGhosts = {}; // uid -> {gfx, label, targetX, targetY, x, y, name}
    window._multiplayer?.attachScene(this);
    this._netTickAccum = 0;
  }

  update(time,delta){
    if(!this.running||this.paused)return;
    this.spatialGrid.clear();
    for(const e of this.enemies) if(e.alive) this.spatialGrid.insert(e);
    this.player.update(delta,this.pointer.x,this.pointer.y,this.enemies);
    for(let i=this.enemies.length-1;i>=0;i--){
      const e=this.enemies[i];
      if(!e.alive){this.enemies.splice(i,1);continue;}
      e.update(delta,this.player.x,this.player.y);
      if(Math.hypot(e.x-this.player.x,e.y-this.player.y)<18) this.player.takeDamage(1);
    }
    // Boss update
    if (this.boss && this.boss.alive) {
      this.boss.update(delta, this.player.x, this.player.y);
      if (Math.hypot(this.boss.x - this.player.x, this.boss.y - this.player.y) < 28) {
        this.player.takeDamage(1);
      }
    }
    for(let i=this.projectiles.length-1;i>=0;i--){
      const p=this.projectiles[i];
      if(!p.alive){this.projectiles.splice(i,1);continue;}
      p.update(delta,this.enemies);
      // Projectiles also hit boss
      if (this.boss && this.boss.alive && p.alive) {
        if (Math.hypot(this.boss.x-p.x, this.boss.y-p.y) < 32) {
          this.boss.takeDamage(1, this);
          p._kill();
        }
      }
    }
    for(let i=this.pellets.length-1;i>=0;i--){
      const p=this.pellets[i];
      if(!p.alive){
        p.destroy();this.pellets.splice(i,1);
        window._sfx?.play('collect');
        this._grantXP(1);
        window._seasonManager?.onSoulsAbsorbed(1);
        continue;
      }
      p.update(delta,this.player.x,this.player.y,this.player.stats.pickupRange);
    }
    if (!this.bossActive) {
      this.waveTimer-=delta;
      if(this.waveTimer<=0){this._spawnWave();this.waveTimer=Math.max(600,this.waveInterval-this.level*60);}
    }
    // Task ticks
    if(window._taskManager) window._taskManager.tickNoDamageTimer(delta/1000);

    // BUGFIX: only emit LEVEL_REACHED when the level actually changes,
    // not every single frame.
    if (this.level !== this._lastEmittedLevel) {
      this._lastEmittedLevel = this.level;
      GameEvents.emit('LEVEL_REACHED', { level: this.level });
    }

    // ── Co-op: broadcast local state + smooth remote ghosts ──
    this._netTickAccum += delta;
    if (this._netTickAccum >= 80) { // ~12.5Hz broadcast rate
      this._netTickAccum = 0;
      window._multiplayer?.broadcastState({
        x: this.player.x, y: this.player.y,
        hp: this.player.hp, maxHp: this.player.stats.maxHp,
        level: this.level, kills: this.killCount,
        skin: SaveSystem.getEquipped()
      });
    }
    this._updateRemoteGhosts(delta);
  }

  /* ── Co-op ghost rendering ────────────────────────────
     Remote players are drawn using their OWN equipped skin's
     colors/glow (looked up from the shared SKIN_CATALOGUE by
     the id they broadcast), so you see what your friend is
     actually wearing — not a generic marker. They don't
     collide with enemies (visual only) so a dropped connection
     can never desync your own run. */
  upsertRemoteGhost(uid, name, x, y, hp, maxHp, skinId) {
    let g = this.remoteGhosts[uid];
    const skin = window._skinSystem?.getSkin(skinId) || { colors: [0x00f5ff], glowColor: '#00f5ff', name: 'Soul White' };
    const primary = skin.colors?.[0] ?? 0x00f5ff;
    const glowHex = Phaser.Display.Color.HexStringToColor(skin.glowColor || '#00f5ff').color;
    if (!g) {
      const gfx = this.add.graphics().setDepth(5);
      const label = this.add.text(x, y - 26, name || `Reaper ${uid}`, {
        fontFamily: 'Rajdhani', fontSize: '12px', color: skin.glowColor || '#00f5ff'
      }).setOrigin(0.5).setDepth(6);
      g = this.remoteGhosts[uid] = { gfx, label, x, y, targetX: x, targetY: y, hp, maxHp, name };
    }
    g.targetX = x; g.targetY = y; g.hp = hp; g.maxHp = maxHp;
    g.color = primary; g.glow = glowHex; g.skinName = skin.name;
    g.label.setColor(skin.glowColor || '#00f5ff');
  }

  removeRemoteGhost(uid) {
    const g = this.remoteGhosts[uid];
    if (!g) return;
    g.gfx.destroy(); g.label.destroy();
    delete this.remoteGhosts[uid];
  }

  _updateRemoteGhosts(delta) {
    for (const uid in this.remoteGhosts) {
      const g = this.remoteGhosts[uid];
      // Smooth lerp toward last broadcast position
      g.x += (g.targetX - g.x) * Math.min(1, delta / 120);
      g.y += (g.targetY - g.y) * Math.min(1, delta / 120);
      const color = g.color ?? 0x00f5ff, glow = g.glow ?? 0x00f5ff;
      g.gfx.clear();
      g.gfx.lineStyle(2, glow, 0.9);
      g.gfx.strokeCircle(g.x, g.y, 14);
      g.gfx.fillStyle(color, 0.35);
      g.gfx.fillCircle(g.x, g.y, 14);
      g.gfx.fillStyle(glow, 0.12);
      g.gfx.fillCircle(g.x, g.y, 20); // soft glow halo, matches their skin's glow color
      g.label.setPosition(g.x, g.y - 26);
    }
  }

  _spawnWave(){
    const count=2+Math.floor(this.level*1.2);
    for(let i=0;i<count;i++){
      const{x,y}=this._randEdge();
      const tier=Math.random()<0.2+this.level*0.04?(Math.random()<0.4?3:2):1;
      const enemy = new Enemy(this,x,y,tier);
      this.enemies.push(enemy);
    }
  }
  _randEdge(){
    const side=Math.floor(Math.random()*4);
    if(side===0) return{x:Math.random()*this.W,y:-20};
    if(side===1) return{x:Math.random()*this.W,y:this.H+20};
    if(side===2) return{x:-20,y:Math.random()*this.H};
    return{x:this.W+20,y:Math.random()*this.H};
  }

  spawnProjectile(x,y,target,count,split,dmg=1){
    const angleBase=Math.atan2(target.y-y,target.x-x),spread=0.25;
    for(let i=0;i<count;i++){
      const off=count>1?(i/(count-1)-0.5)*spread*2:0;
      const ang=angleBase+off;
      this.projectiles.push(new Projectile(this,x,y,x+Math.cos(ang)*200,y+Math.sin(ang)*200,dmg));
    }
  }

  onEnemyDeath(enemy){
    this.killCount++;
    const _shardMult = this.player?.stats?._shardMultiplier || 1;
    this.runShards += Math.ceil(enemy.tier * _shardMult);
    // Task events
    GameEvents.emit('ENEMY_KILLED', {});
    if (enemy.tier >= 3) GameEvents.emit('ELITE_KILLED', {});
    document.getElementById('kill-counter').textContent=`☠ ${this.killCount}`;
    spawnDeathParticles(this,enemy.x,enemy.y,enemy.tier>=3?0xff2244:0xffaa00);
    for(let i=0;i<enemy.tier;i++) this.pellets.push(new SoulPellet(this,enemy.x,enemy.y));
    const ls=this.player.stats.lifeStealKills;
    if(ls<99999){
      this.player._killsToHeal++;
      if(this.player._killsToHeal>=ls){
        this.player._killsToHeal=0;
        if(this.player.hp<this.player.stats.maxHp){this.player.hp++;this._updateHUD();this.player._spawnHealFX();}
      }
    }
  }

  _grantXP(amt){
    this.xp+=amt;
    if(this.xp>=this.xpNeeded){
      this.xp-=this.xpNeeded;
      this.xpNeeded=Math.floor(this.xpNeeded*1.35+4);
      this.level++;
      this._triggerLevelUp();
    }
    this._updateHUD();
  }

  _triggerLevelUp(){
    this.paused=true;
    document.getElementById('level-label').textContent=`LVL ${this.level}`;
    window._sfx?.play('levelup');
    this._showLevelUpCards();
  }

  _showLevelUpCards(){
    const overlay=document.getElementById('levelup-overlay');
    const container=document.getElementById('upgrade-cards');
    container.innerHTML='';
    randomUpgrades(3).forEach(upg=>{
      const card=document.createElement('div');
      card.className='upgrade-card';
      card.innerHTML=`<span class="upgrade-icon">${upg.icon}</span><span class="upgrade-name">${upg.name}</span><p class="upgrade-desc">${upg.desc}</p><span class="upgrade-rarity rarity-${upg.rarity}">${upg.rarity.toUpperCase()}</span>`;
      card.addEventListener('click',()=>{
        upg.apply(this.player.stats,this.player);
        this.upgradesTaken++;
        overlay.classList.add('hidden');
        this.paused=false;
        this._updateHUD();
        GameEvents.emit('UPGRADES_COLLECTED', { count: this.upgradesTaken });
      });
      container.appendChild(card);
    });
    overlay.classList.remove('hidden');
  }

  triggerGameOver(){
    this.running=false;
    CrazyGames.SDK.game.gameplayStop();
    GameEvents.emit('RUN_ENDED', {});
    window._sfx?.stopBGMusic();
    document.getElementById('boss-hp-bar-wrap')?.classList.add('hidden');
    if(this.boss && this.boss.alive){ this.boss.destroy(); this.boss=null; }

    const total=SaveSystem.addShards(this.runShards);
    GameEvents.emit('SHARD_BALANCE_UPDATED', { balance: total });
    document.getElementById('soul-shards-display').textContent=`⬡ ${total}`;
    document.getElementById('go-kills').textContent   =this.killCount;
    document.getElementById('go-level').textContent   =this.level;
    document.getElementById('go-shards').textContent  =this.runShards;
    document.getElementById('go-upgrades').textContent=this.upgradesTaken;
    document.getElementById('gameover-overlay').classList.remove('hidden');
    document.getElementById('hud').style.opacity='0.3';

    window._multiplayer?.notifyRunEnded();
  }

  _updateHUD(){
    const pct=Math.min(100,(this.xp/this.xpNeeded)*100);
    document.getElementById('xp-bar').style.width=pct+'%';
    document.getElementById('level-label').textContent=`LVL ${this.level}`;
    document.getElementById('soul-shards-display').textContent=`⬡ ${this.runShards}`;
    if(this.player){
      const hp=Math.max(0,this.player.hp),maxHp=this.player.stats.maxHp,hpPct=(hp/maxHp)*100;
      const fill=document.getElementById('hp-bar-fill'),label=document.getElementById('hp-label');
      fill.style.width=hpPct+'%';
      label.textContent=`\u2665 ${hp}/${maxHp}`;
      fill.classList.toggle('low',hpPct<=30);
    }
  }

  _drawStars(){
    const g=this.starGfx;g.clear();
    for(let i=0;i<220;i++){const x=Math.random()*this.W,y=Math.random()*this.H,r=Math.random()*1.4,a=0.1+Math.random()*0.5;g.fillStyle(0xffffff,a);g.fillCircle(x,y,r);}
  }
  _drawVignette(){
    const g=this.vigGfx,cx=this.W/2,cy=this.H/2,r=Math.max(this.W,this.H)*0.75;
    for(let i=0;i<8;i++){const t=i/8;g.fillStyle(0x000000,0.09*(1-t));g.fillCircle(cx,cy,r*(1-t*0.35));}
  }

  _showFloatingText(text, color='#ffd700', duration=1600) {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:'fixed', top:'38%', left:'50%',
      transform:'translate(-50%,-50%) scale(0.8)',
      fontFamily:"'Cinzel',serif", fontSize:'18px',
      letterSpacing:'3px', color, textShadow:`0 0 20px ${color}`,
      zIndex:'9999', pointerEvents:'none',
      transition:'all 0.5s cubic-bezier(0.22,1,0.36,1)', opacity:'0',
    });
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => {
      el.style.opacity = '1'; el.style.transform = 'translate(-50%,-80%) scale(1)';
    });});
    setTimeout(() => { el.style.opacity='0'; setTimeout(() => el.remove(), 500); }, duration);
  }

  shutdown(){
    this.enemies.forEach(e=>e.destroy());
    this.pellets.forEach(p=>p.destroy());
    this.projectiles.forEach(p=>p._kill?.());
    if(this.player)this.player.destroy();
    if(this.boss)this.boss.destroy();
    for (const uid in this.remoteGhosts) this.removeRemoteGhost(uid);
    document.getElementById('boss-hp-bar-wrap')?.classList.add('hidden');
    window._multiplayer?.detachScene();
  }
}

/* ═══════════════════════════════════════════════════════
   BOOT + WIRING (globals)
═══════════════════════════════════════════════════════ */
CrazyGames.SDK.game.sdkGameLoadingStart();

window._skinSystem  = new SkinSystem();
window._taskManager = new TaskManager();
window._sfx = new SoundManager();
window._seasonManager = new SeasonManager();
