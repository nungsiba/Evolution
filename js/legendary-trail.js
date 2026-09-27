class LegendaryTrailEmitter {
  constructor(scene) {
    this.scene    = scene;
    this.gfx      = scene.add.graphics().setDepth(3);
    this.particles = [];    // {x,y,vx,vy,life,decay,size,color,rot,rotSpd}
    this.MAX      = 100;
  }

  emit(skin, px, py) {
    const particleTypes = ['flame','electric','void','nova','orbit','dragon'];
    if (!particleTypes.includes(skin.type)) return;

    const isFlame    = skin.type === 'flame' || skin.type === 'nova' || skin.type === 'dragon';
    const isElectric = skin.type === 'electric';
    const isOrbit    = skin.type === 'void' || skin.type === 'orbit';

    const count = isElectric ? 1 : 2;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.MAX) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = isOrbit ? 20 + Math.random()*30 : 40 + Math.random() * 80;
      const p   = {
        x: px + (Math.random()-0.5)*10,
        y: py + (Math.random()-0.5)*10,
        vx: Math.cos(ang)*spd,
        vy: Math.sin(ang)*spd,
        life: 1.0,
        decay: isElectric ? 0.15 : 0.03 + Math.random()*0.02,
        size: isOrbit ? 3+Math.random()*4 : 2+Math.random()*3,
        color: skin.colors[Math.floor(Math.random()*skin.colors.length)],
        rot: Math.random()*Math.PI*2,
        rotSpd: (Math.random()-0.5)*6,
        type: isOrbit ? 'void' : (isFlame ? 'flame' : 'electric')
      };
      if (isFlame)    p.vy -= 70 + Math.random()*40;
      if (skin.type === 'nova') { p.vx *= 1.5; p.vy *= 1.5; p.decay = 0.025; }
      if (isElectric) { p.vx *= 4; p.vy *= 4; }
      this.particles.push(p);
    }
  }

  update(delta) {
    const dt = delta / 1000;
    const g  = this.gfx;
    g.clear();

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.life -= p.decay;
      if (p.type === 'flame') p.vy -= 35 * dt;
      if (p.type === 'void')  p.rot += p.rotSpd * dt;
      if (p.life <= 0) { this.particles.splice(i,1); continue; }

      const alpha = p.life * 0.9;
      if (p.type === 'void') {
        // Draw rotated square via fillPoints
        const s = p.size;
        const cos = Math.cos(p.rot), sin = Math.sin(p.rot);
        const pts = [[-s,-s],[s,-s],[s,s],[-s,s]].map(([rx,ry]) => ({
          x: p.x + rx*cos - ry*sin,
          y: p.y + rx*sin + ry*cos
        }));
        g.fillStyle(p.color, alpha);
        g.fillPoints(pts, true);
      } else if (p.type === 'electric') {
        g.lineStyle(p.size * 0.7, p.color, alpha);
        g.strokeLineShape(new Phaser.Geom.Line(
          p.x, p.y, p.x + p.vx*0.04, p.y + p.vy*0.04
        ));
      } else {
        // Flame: outer glow + core
        g.fillStyle(p.color, alpha * 0.25);
        g.fillCircle(p.x, p.y, p.size * 2.2);
        g.fillStyle(p.color, alpha);
        g.fillCircle(p.x, p.y, p.size);
      }
    }
  }

  destroy() { this.gfx.destroy(); }
}

/* ═══════════════════════════════════════════════════════
   UPGRADE CATALOGUE
═══════════════════════════════════════════════════════ */
