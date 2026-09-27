/* ═══════════════════════════════════════════════════════
   MAIN — Boot + Wiring  (v1)
═══════════════════════════════════════════════════════ */
const config={
  type:Phaser.AUTO, parent:'game-container', backgroundColor:'#000000',
  width:window.innerWidth, height:window.innerHeight, scene:[GameScene],
  fps:{target:60,forceSetTimeOut:false},
  render:{antialias:true,pixelArt:false},
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}
};
let game=null;
window.game = null; // mirrored for multiplayer.js / console debugging

function startGame(){
  document.getElementById('menu-overlay').classList.add('hidden');
  document.getElementById('hud').style.opacity='1';
  if(game){game.destroy(true);}
  game=new Phaser.Game(config);
  window.game = game;
}

function updateMenuShards(){
  const s=SaveSystem.getShards();
  document.getElementById('menu-shard-val').textContent=s;
  document.getElementById('soul-shards-display').textContent=`⬡ ${s}`;
  const seasonVal = document.getElementById('season-shard-val');
  if (seasonVal) seasonVal.textContent = s;
  const shopVal = document.getElementById('shop-shard-val');
  if (shopVal) shopVal.textContent = s;
}

// ── Boot sequence: offline-first. Menu is usable immediately; auth
// only ever runs in the background (session resume) or on-demand
// (Log In button / co-op gate) — it never blocks first paint. ──
Auth.init();
Multiplayer.init();
document.getElementById('menu-overlay').classList.remove('hidden');

document.querySelectorAll('.menu-btn, .season-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => window._sfx?.play('uiBlip'));
  btn.addEventListener('click',      () => window._sfx?.play('uiClick'));
});
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-open-season').addEventListener('click', () => {
  window._seasonManager.open();
});
document.getElementById('btn-open-tasks').addEventListener('click', () => {
  window._taskManager.openBoard();
});
document.getElementById('btn-open-shop').addEventListener('click', () => {
  window._skinSystem.openShop();
});

// Shop tabs
document.querySelectorAll('.shop-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    window._skinSystem._buildGrid(tab.dataset.tab);
  });
});

// Shop close
document.getElementById('shop-close-btn').addEventListener('click', () => {
  window._skinSystem.closeShop();
  updateMenuShards();
});

// Game-over buttons
document.getElementById('btn-restart').addEventListener('click', ()=>{
  document.getElementById('gameover-overlay').classList.add('hidden');
  startGame(); updateMenuShards();
});
document.getElementById('btn-menu').addEventListener('click', ()=>{
  document.getElementById('gameover-overlay').classList.add('hidden');
  if(game){game.destroy(true);game=null;window.game=null;}
  document.getElementById('menu-overlay').classList.remove('hidden');
  document.getElementById('hud').style.opacity='1';
  document.getElementById('kill-counter').textContent='☠ 0';
  updateMenuShards();
});

window.addEventListener('resize', ()=>{ if(game) game.scale.resize(window.innerWidth,window.innerHeight); });

// Mute toggle button
document.getElementById('mute-btn').addEventListener('click', () => {
  window._sfx?.toggleMute();
});

/* ═══════════════════════════════════════════════════════
   PREVIEW PANEL RESIZER
   Drag the handle between grid and preview to resize.
   Width is persisted to localStorage.
═══════════════════════════════════════════════════════ */
(function initPreviewResizer() {
  const STORE_KEY  = 'soulReaper_previewW';
  const MIN_W      = 180;
  const MAX_W      = 520;

  const resizer    = document.getElementById('preview-resizer');
  const panel      = document.getElementById('shop-preview-panel');

  const saved = parseInt(localStorage.getItem(STORE_KEY), 10);
  if (saved && saved >= MIN_W && saved <= MAX_W) {
    panel.style.width = saved + 'px';
  }

  let startX   = 0;
  let startW   = 0;
  let dragging = false;

  function onMouseDown(e) {
    e.preventDefault();
    dragging = true;
    startX   = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    startW   = panel.offsetWidth;
    resizer.classList.add('dragging');
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? startX;
    const delta = startX - clientX;
    const newW  = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
    panel.style.width = newW + 'px';
    window._skinSystem?._resizePreviewCanvas();
  }

  function onMouseUp() {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    try { localStorage.setItem(STORE_KEY, panel.offsetWidth); } catch(_) {}
  }

  resizer.addEventListener('mousedown',  onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);

  resizer.addEventListener('touchstart',  onMouseDown, { passive: false });
  document.addEventListener('touchmove',  onMouseMove, { passive: false });
  document.addEventListener('touchend',   onMouseUp);
})();
