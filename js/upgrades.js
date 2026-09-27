const UPGRADES = [
  { id:'speed',      icon:'💨', name:'Wraith Step',      desc:'+15% movement speed',                  rarity:'common', apply:(s,p)=>s.speed       *=1.15 },
  { id:'range',      icon:'⚔️',  name:'Soul Blade',       desc:'+40 slash radius',                     rarity:'common', apply:(s,p)=>s.slashRange  +=40   },
  { id:'projectile', icon:'🔮', name:'Phantom Shot',     desc:'+1 auto-fire projectile',               rarity:'rare',   apply:(s,p)=>s.projectiles +=1   },
  { id:'cooldown',   icon:'⚡',  name:"Reaper's Haste",   desc:'-20% attack cooldown',                 rarity:'rare',   apply:(s,p)=>s.attackCd    *=0.80 },
  { id:'health',     icon:'❤️',  name:"Death's Vigour",   desc:'+1 max HP & heal to full',             rarity:'common', apply:(s,p)=>{ s.maxHp+=1; p.hp=s.maxHp; } },
  { id:'pelletmag',  icon:'🧲', name:'Soul Magnet',      desc:'+30 pellet pickup radius',              rarity:'common', apply:(s,p)=>s.pickupRange +=30  },
  { id:'multishot',  icon:'💫', name:'Void Burst',       desc:'Shots split into 3 on impact',          rarity:'epic',   apply:(s,p)=>s.splitShot    =true },
  { id:'orb',        icon:'🌀', name:'Sentinel Orb',     desc:'+1 orbiting spirit',                    rarity:'epic',   apply:(s,p)=>s.orbs        +=1   },
  { id:'lifesteal',  icon:'🩸', name:'Soul Drain',       desc:'Restore 1 HP every 5 kills',            rarity:'rare',   apply:(s,p)=>s.lifeStealKills=(s.lifeStealKills||99)-4 },
  { id:'regen',      icon:'✨', name:'Undying Aura',     desc:'Passively regenerate 1 HP every 8 sec', rarity:'epic',   apply:(s,p)=>s.regenInterval=Math.max(2000,(s.regenInterval||99999)-6000) },
  { id:'healinstant',icon:'💊', name:'Soul Mend',        desc:'Instantly restore 2 HP right now',      rarity:'common', apply:(s,p)=>{ p.hp=Math.min(s.maxHp, p.hp+2); } },
];

function randomUpgrades(count=3) {
  const pool=[...UPGRADES], out=[];
  while(out.length<count && pool.length>0) { const i=Math.floor(Math.random()*pool.length); out.push(pool.splice(i,1)[0]); }
  return out;
}

/* ═══════════════════════════════════════════════════════
   SPATIAL GRID
═══════════════════════════════════════════════════════ */
