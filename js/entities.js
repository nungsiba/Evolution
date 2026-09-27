class SpatialGrid {
  constructor(cellSize=120) { this.cellSize=cellSize; this.cells=new Map(); }
  _key(x,y){ return `${Math.floor(x/this.cellSize)}_${Math.floor(y/this.cellSize)}`; }
  insert(obj){ const k=this._key(obj.x,obj.y); if(!this.cells.has(k)) this.cells.set(k,[]); this.cells.get(k).push(obj); }
  query(x,y,radius){ const out=[],cells=Math.ceil(radius/this.cellSize)+1,cx=Math.floor(x/this.cellSize),cy=Math.floor(y/this.cellSize); for(let dx=-cells;dx<=cells;dx++) for(let dy=-cells;dy<=cells;dy++){ const k=`${cx+dx}_${cy+dy}`; if(this.cells.has(k)) out.push(...this.cells.get(k)); } return out; }
  clear(){ this.cells.clear(); }
}

/* ═══════════════════════════════════════════════════════
   PLAYER CLASS
═══════════════════════════════════════════════════════ */
class Player {
  constructor(scene, skinSystem) {
    this.scene      = scene;
    this.skinSystem = skinSystem;

    this.stats = {
      speed:          200,
      slashRange:     120,
      projectiles:    0,
      attackCd:       600,
      maxHp:          5,
      pickupRange:    60,
      splitShot:      false,
      orbs:           0,
      regenInterval:  99999,
      lifeStealKills: 99999,
    };

    this.hp           = this.stats.maxHp;
    this.attackTimer  = 0;
    // Apply season skin bonuses at run start
    this._applySeasonBonuses();
    this.invTimer     = 0;
    this.trail        = [];
    this._regenTimer  = 0;
    this._killsToHeal = 0;

    // Graphics
    this.gfx      = scene.add.graphics().setDepth(5);
    this.trailGfx = scene.add.graphics().setDepth(4);
    this.orbGfx   = scene.add.graphics().setDepth(6);
    this.slashGfx = scene.add.graphics().setDepth(7);

    // Legendary emitter — always created, only active on legendary skins
    this.legendaryEmitter = new LegendaryTrailEmitter(scene);

    this.x = scene.scale.width  / 2;
    this.y = scene.scale.height / 2;

    this._slashFade = 0;
    this._slashData = null;
    this._dmgCarry  = 0; // fractional damage-bonus accumulator (see BUGFIX in _attemptAttack)
  }

  update(delta, targetX, targetY, enemies) {
    const dt  = delta / 1000;
    const skin = this.skinSystem.getEquipped();

    // Movement
    const dx=targetX-this.x, dy=targetY-this.y, dist=Math.hypot(dx,dy);
    if (dist > 4) { const spd=this.stats.speed*dt, move=Math.min(spd,dist); this.x+=(dx/dist)*move; this.y+=(dy/dist)*move; }

    // Trail
    this.trail.unshift({ x:this.x, y:this.y });
    if (this.trail.length > 26) this.trail.pop();

    // Legendary particle emission (only when moved)
    if (dist > 4 && ['flame','electric','void','nova','orbit','dragon'].includes(skin.type)) {
      this.legendaryEmitter.emit(skin, this.x, this.y);
    }

    // Attack
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) { this._attemptAttack(enemies); this.attackTimer = this.stats.attackCd; }

    // Invincibility
    if (this.invTimer > 0) this.invTimer -= delta;

    // Passive Regen
    if (this.stats.regenInterval < 99999) {
      this._regenTimer -= delta;
      if (this._regenTimer <= 0) {
        this._regenTimer = this.stats.regenInterval;
        if (this.hp < this.stats.maxHp) { this.hp++; this.scene._updateHUD(); this._spawnHealFX(); }
      }
    }

    // Update legendary emitter
    this.legendaryEmitter.update(delta);

    this._draw(skin);
  }

  _attemptAttack(enemies) {
    let nearest=null, nearDist=Infinity;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d=Math.hypot(e.x-this.x, e.y-this.y);
      if (d<this.stats.slashRange && d<nearDist) { nearest=e; nearDist=d; }
    }
    if (!nearest) return;
    this._slashData = { tx:nearest.x, ty:nearest.y };
    this._slashFade = 1.0;
    window._sfx?.play('slash');
    // BUGFIX: this used to be Math.max(1, Math.floor(this.stats._dmgMult||1)) —
    // flooring a multiplier like 1.12 always equals 1, so "+12% Damage" skin
    // bonuses did literally nothing. Now the fractional remainder carries
    // over hit-to-hit, so the bonus has a real effect on average damage.
    this._dmgCarry += (this.stats._dmgMult || 1);
    const dmg = Math.max(1, Math.floor(this._dmgCarry));
    this._dmgCarry -= dmg;
    if (this.stats.projectiles > 0) {
      this.scene.spawnProjectile(this.x, this.y, nearest, this.stats.projectiles, this.stats.splitShot, dmg);
    } else {
      nearest.takeDamage(dmg, this.scene);
    }
  }

  takeDamage(amt) {
    if (this.invTimer > 0) return;
    this.hp -= amt;
    this.invTimer = 900;
    this.scene._updateHUD();
    GameEvents.emit('PLAYER_DAMAGED', {});
    if (this.hp <= 0) this.scene.triggerGameOver();
  }

  _draw(skin) {
    const particleTypes = ['flame','electric','void','nova','orbit','dragon'];
    const isLegendary = particleTypes.includes(skin.type);
    // Pulse maps to gradient for trail rendering
    const isGradient = skin.type === 'gradient' || skin.type === 'pulse'
                    || skin.type === 'spectral_rift'; // future-proof

    // Trail
    const g = this.trailGfx;
    g.clear();
    if (!isLegendary) {
      for (let i=0; i<this.trail.length; i++) {
        const p     = this.trail[i];
        const frac  = i / this.trail.length;
        const alpha = (1 - frac) * 0.55;
        const r     = 12 * (1 - frac * 0.55);

        if (skin.type === 'gradient' || skin.type === 'pulse') {
          const c1=skin.colors[0], c2=skin.colors[1]||skin.colors[0];
          const ri=Math.round(((c1>>16)&0xff)*(1-frac)+((c2>>16)&0xff)*frac);
          const gi=Math.round(((c1>>8)&0xff)*(1-frac)+((c2>>8)&0xff)*frac);
          const bi=Math.round((c1&0xff)*(1-frac)+(c2&0xff)*frac);
          const col=(ri<<16)|(gi<<8)|bi;
          g.fillStyle(col, alpha * 0.35); g.fillCircle(p.x, p.y, r*1.8);
          g.fillStyle(col, alpha);       g.fillCircle(p.x, p.y, r);
        } else {
          const col = skin.colors[0];
          g.fillStyle(col, alpha * 0.35); g.fillCircle(p.x, p.y, r*1.8);
          g.fillStyle(col, alpha);       g.fillCircle(p.x, p.y, r);
        }
      }
    }

    // Slash arc
    const sg = this.slashGfx;
    sg.clear();
    if (this._slashData && this._slashFade > 0) {
      const { tx, ty } = this._slashData;
      const slashCol = skin.colors[0];
      sg.lineStyle(2, slashCol, this._slashFade * 0.9);
      sg.strokeLineShape(new Phaser.Geom.Line(this.x, this.y, tx, ty));
      sg.fillStyle(slashCol, this._slashFade * 0.6);
      sg.fillCircle(tx, ty, 6 * this._slashFade);
      this._slashFade -= 0.08;
    }

    // Player body
    const pg = this.gfx;
    pg.clear();
    const inv = (this.invTimer > 0 && Math.floor(this.invTimer/60) % 2 === 0);
    if (!inv) {
      const glowCol = skin.colors[0];
      pg.fillStyle(glowCol, 0.10); pg.fillCircle(this.x, this.y, 32);
      pg.fillStyle(glowCol, 0.20); pg.fillCircle(this.x, this.y, 20);
      pg.fillStyle(0xffffff, 1.0); pg.fillCircle(this.x, this.y, 10);
      pg.lineStyle(1, glowCol, 0.10);
      pg.strokeCircle(this.x, this.y, this.stats.slashRange);
    }

    // Orbiting spirits
    const og = this.orbGfx;
    og.clear();
    const t = this.scene.time.now / 1000;
    const orbCol = skin.colors[skin.colors.length-1];
    for (let i=0; i<this.stats.orbs; i++) {
      const angle = t*2.5 + (i/this.stats.orbs)*Math.PI*2;
      const ox = this.x + Math.cos(angle)*42;
      const oy = this.y + Math.sin(angle)*42;
      og.fillStyle(orbCol, 0.85); og.fillCircle(ox, oy, 5);
      og.fillStyle(0xffffff, 0.5); og.fillCircle(ox, oy, 2.5);
    }
  }

  _spawnHealFX() {
    const scene=this.scene, px=this.x, py=this.y;
    const g=scene.add.graphics().setDepth(9);
    const ps=[];
    for(let i=0;i<10;i++){
      const ang=Math.random()*Math.PI*2, spd=30+Math.random()*70;
      ps.push({x:px,y:py,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-40,a:1.0,r:2+Math.random()*3});
    }
    const txt=scene.add.text(px,py-18,'+1 HP',{fontFamily:'Rajdhani,sans-serif',fontSize:'14px',color:'#00ff88',stroke:'#003322',strokeThickness:3}).setDepth(10).setOrigin(0.5);
    scene.tweens.add({targets:txt,y:py-52,alpha:0,duration:900,ease:'Cubic.Out',onComplete:()=>txt.destroy()});
    const timer=scene.time.addEvent({delay:16,repeat:25,callback:()=>{
      g.clear(); let any=false;
      for(const p of ps){
        p.x+=p.vx*0.016;p.y+=p.vy*0.016;p.vy-=20*0.016;p.a-=0.038;
        if(p.a>0){any=true;g.fillStyle(0x00ff88,p.a);g.fillCircle(p.x,p.y,p.r);}
      }
      if(!any){timer.remove();g.destroy();}
    }});
  }

  /* Inject all active elite/season skin bonuses into stats at run-start.
     Covers: dashBonus → speed, damageBonus → stored for damage calc,
             speedBonus → speed, shardGain → shard multiplier.        */
  _applySeasonBonuses() {
    const equipped = window._skinSystem?.getEquipped?.();
    if (!equipped?.bonuses) return;
    const b = equipped.bonuses;

    // Dash speed bonus (multiplicative on movement speed)
    if (b.dashBonus)   this.stats.speed      *= b.dashBonus;
    // General movement speed bonus (multiplicative)
    if (b.speedBonus)  this.stats.speed      *= b.speedBonus;
    // Damage bonus — stored on stats so attack logic can read it
    if (b.damageBonus) this.stats._dmgMult    = (this.stats._dmgMult || 1) * b.damageBonus;
    // Shard gain multiplier — used by onEnemyDeath
    if (b.shardGain)   this.stats._shardMultiplier = (this.stats._shardMultiplier || 1) * b.shardGain;
    // Attack cooldown reduction tied to haste bonuses (future-proofing)
    if (b.hasteBonus)  this.stats.attackCd   *= (1 / b.hasteBonus);
  }

  destroy() {
    this.gfx.destroy(); this.trailGfx.destroy();
    this.orbGfx.destroy(); this.slashGfx.destroy();
    this.legendaryEmitter.destroy();
  }
}

/* ═══════════════════════════════════════════════════════
   ENEMY CLASS
═══════════════════════════════════════════════════════ */
class Enemy {
  constructor(scene,x,y,tier=1){
    this.scene=scene;this.x=x;this.y=y;this.tier=tier;
    this.hp=tier;this.maxHp=tier;this.speed=55+tier*15+Math.random()*20;
    this.alive=true;this.gfx=scene.add.graphics().setDepth(3);this._flashTimer=0;
  }
  update(delta,playerX,playerY){
    if(!this.alive)return;
    const dt=delta/1000,dx=playerX-this.x,dy=playerY-this.y,d=Math.hypot(dx,dy);
    if(d>2){this.x+=(dx/d)*this.speed*dt;this.y+=(dy/d)*this.speed*dt;}
    if(this._flashTimer>0)this._flashTimer-=delta;
    this._draw();
  }
  takeDamage(amt,scene){this.hp-=amt;this._flashTimer=120;if(this.hp<=0)this.die();}
  die(){this.alive=false;this.scene.onEnemyDeath(this);this.gfx.destroy();}
  _draw(){
    const g=this.gfx;g.clear();
    const flash=this._flashTimer>0;
    const col=this.tier>=3?0xff2244:this.tier===2?0xffaa00:0xff2244;
    g.fillStyle(col,flash?0.6:0.18);g.fillCircle(this.x,this.y,22);
    g.fillStyle(col,flash?1.0:0.75);g.fillCircle(this.x,this.y,11);
    g.fillStyle(0x000000,0.9);g.fillCircle(this.x,this.y,5);
    if(this.maxHp>1){
      const bw=26,bh=3,bx=this.x-bw/2,by=this.y+15;
      g.fillStyle(0x333333,0.7);g.fillRect(bx,by,bw,bh);
      g.fillStyle(col,1.0);g.fillRect(bx,by,bw*(this.hp/this.maxHp),bh);
    }
  }
  destroy(){this.gfx.destroy();}
}

/* ═══════════════════════════════════════════════════════
   PROJECTILE CLASS
═══════════════════════════════════════════════════════ */
class Projectile {
  constructor(scene,x,y,tx,ty,dmg=1){
    this.scene=scene;this.x=x;this.y=y;this.dmg=dmg;
    const ang=Math.atan2(ty-y,tx-x);
    this.vx=Math.cos(ang)*380;this.vy=Math.sin(ang)*380;
    this.alive=true;this.age=0;this.maxAge=1400;
    this.gfx=scene.add.graphics().setDepth(6);
  }
  update(delta,enemies){
    if(!this.alive)return;
    const dt=delta/1000;this.x+=this.vx*dt;this.y+=this.vy*dt;this.age+=delta;
    if(this.age>this.maxAge||this._oob()){this._kill();return;}
    for(const e of enemies){
      if(!e.alive)continue;
      if(Math.hypot(e.x-this.x,e.y-this.y)<16){e.takeDamage(this.dmg,this.scene);this._kill();return;}
    }
    this._draw();
  }
  _oob(){const s=this.scene.scale;return this.x<-30||this.x>s.width+30||this.y<-30||this.y>s.height+30;}
  _kill(){this.alive=false;this.gfx.destroy();}
  _draw(){
    const g=this.gfx;g.clear();
    g.fillStyle(0xbf00ff,0.25);g.fillCircle(this.x,this.y,9);
    g.fillStyle(0xbf00ff,0.9);g.fillCircle(this.x,this.y,5);
    g.fillStyle(0xffffff,0.7);g.fillCircle(this.x,this.y,2.5);
  }
}

/* ═══════════════════════════════════════════════════════
   SOUL PELLET
═══════════════════════════════════════════════════════ */
class SoulPellet {
  constructor(scene,x,y){
    this.scene=scene;this.x=x+(Math.random()-0.5)*24;this.y=y+(Math.random()-0.5)*24;
    this.alive=true;this.gfx=scene.add.graphics().setDepth(2);
    this._phase=Math.random()*Math.PI*2;this._age=0;
  }
  update(delta,playerX,playerY,pickupRange){
    if(!this.alive)return;
    this._age+=delta;
    const d=Math.hypot(playerX-this.x,playerY-this.y);
    if(d<pickupRange){
      this.x+=(playerX-this.x)/d*8;this.y+=(playerY-this.y)/d*8;
      if(d<14){this.alive=false;return;}
    }
    this._draw();
  }
  _draw(){
    const g=this.gfx,bob=Math.sin((this._age/400)+this._phase)*2;
    g.clear();
    g.fillStyle(0x00ff88,0.18);g.fillCircle(this.x,this.y+bob,10);
    g.fillStyle(0x00ff88,0.80);g.fillCircle(this.x,this.y+bob,5);
    g.fillStyle(0xffffff,0.5);g.fillCircle(this.x,this.y+bob-1,2);
  }
  destroy(){if(this.gfx)this.gfx.destroy();}
}

/* ═══════════════════════════════════════════════════════
   DEATH PARTICLES
═══════════════════════════════════════════════════════ */
