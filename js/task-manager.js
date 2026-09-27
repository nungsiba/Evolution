class TaskManager {
  constructor() {
    this.SAVE_KEY   = 'soulReaper_tasks_v1';
    this.DATE_KEY   = 'soulReaper_taskDate';
    this._toastQueue= [];
    this._toastBusy = false;
    this._filter    = 'all';
    this._nodmgTimer   = 0;
    this._nodmgActive  = false;

    this.tasks = this._loadTasks();
    this._checkDailyReset();
    this._registerListeners();

    const _initDOM = () => {
      this._buildBoard();
      this._wireFilterTabs();
      this._wireBoardClose();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _initDOM);
    } else {
      _initDOM();
    }
  }

  /* ── Persistence ──────────────────────────────── */
  _loadTasks() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(this.SAVE_KEY)) || {}; } catch {}
    return TASKS_TEMPLATE.map(t => ({
      ...t,
      current:   saved[t.id]?.current   ?? 0,
      isClaimed: saved[t.id]?.isClaimed ?? false,
    }));
  }

  _saveTasks() {
    const out = {};
    this.tasks.forEach(t => { out[t.id] = { current: t.current, isClaimed: t.isClaimed }; });
    try { localStorage.setItem(this.SAVE_KEY, JSON.stringify(out)); } catch {}
  }

  /* ── Daily reset logic ────────────────────────── */
  _todayString() { return new Date().toISOString().slice(0, 10); }

  _checkDailyReset() {
    const saved = localStorage.getItem(this.DATE_KEY);
    const today = this._todayString();
    if (saved !== today) {
      this.tasks.forEach(t => {
        if (t.isDaily) { t.current = 0; t.isClaimed = false; }
      });
      localStorage.setItem(this.DATE_KEY, today);
      this._saveTasks();
    }
  }

  /* ── Event Listeners ─────────────────────────── */
  _registerListeners() {
    // Per-event handler map: event → list of task ids that care about it
    const map = {};
    this.tasks.forEach(t => {
      (map[t.trackEvent] = map[t.trackEvent] || []).push(t.id);
    });

    Object.entries(map).forEach(([event, ids]) => {
      GameEvents.on(event, (payload) => {
        ids.forEach(id => this._handleEvent(id, payload));
      });
    });

    // Special: TIME_SURVIVED_NODMG needs per-frame ticking from GameScene
    // GameScene will emit this event with {dt} every frame when running
    // Reset on damage
    GameEvents.on('PLAYER_DAMAGED', () => {
      this._nodmgTimer  = 0;
      this._nodmgActive = true; // still tracking, but resets count
    });

    GameEvents.on('RUN_STARTED', () => {
      this._nodmgTimer  = 0;
      this._nodmgActive = true;
    });

    GameEvents.on('RUN_ENDED', () => {
      this._nodmgActive = false;
      // Fire RUN_COMPLETED
      GameEvents.emit('RUN_COMPLETED', {});
    });
  }

  _handleEvent(taskId, payload) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || task.isClaimed || task.current >= task.goal) return;

    const inc = task.increment(payload || {});
    if (!inc || inc <= 0) return;

    task.current = Math.min(task.goal, task.current + inc);
    this._saveTasks();
    this._refreshRow(task);

    if (task.current >= task.goal) {
      this._onTaskComplete(task);
    }
  }

  /* ── Completion callback ─────────────────────── */
  _onTaskComplete(task) {
    this._queueToast(task);
    this._refreshRow(task);
    window._sfx?.play('missionDone');
  }

  /* ── Claim reward ────────────────────────────── */
  claimTask(taskId, doubled = false) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || task.isClaimed || task.current < task.goal) return;

    const value = doubled ? task.rewardValue * 2 : task.rewardValue;

    if (task.rewardType === 'shards') {
      const total = SaveSystem.addShards(value);
      updateMenuShards();
      // Fire balance event so Rich Reaper can detect it
      GameEvents.emit('SHARD_BALANCE_UPDATED', { balance: total });
      this._showCentralMessage(`+${value} ⬡ Soul Shards!`, '#ffd700');
    } else if (task.rewardType === 'skin') {
      SaveSystem.unlockSkin(task.rewardValue);
      // Also add it to skin catalogue as golden_tail if not present
      this._showCentralMessage(`Skin unlocked: ${task.rewardValue}!`, '#00f5ff');
    }

    task.isClaimed = true;
    this._saveTasks();
    this._refreshRow(task);
  }

  /* ── Public: tick no-damage timer (called from GameScene.update) ── */
  tickNoDamageTimer(dt) {
    if (!this._nodmgActive) return;
    this._nodmgTimer += dt;
    GameEvents.emit('TIME_SURVIVED_NODMG', { dt });
  }

  /* ── Toast notification queue ────────────────── */
  _queueToast(task) {
    this._toastQueue.push(task);
    if (!this._toastBusy) this._showNextToast();
  }

  _showNextToast() {
    if (this._toastQueue.length === 0) { this._toastBusy = false; return; }
    this._toastBusy = true;
    const task = this._toastQueue.shift();
    this._renderToast(task);
  }

  _renderToast(task) {
    const stack = document.getElementById('task-toast-stack');
    const el    = document.createElement('div');
    el.className = 'task-toast';
    el.dataset.taskId = task.id;

    const rewardTxt = task.rewardType === 'shards'
      ? `⬡ ${task.rewardValue} Soul Shards`
      : `🎨 Skin: ${task.rewardValue}`;

    const isDaily  = !!task.isDaily;
    const adDouble = !!task.adDoubleReward;

    el.innerHTML = `
      <div class="task-toast-header">
        <span class="task-toast-badge">${task.icon}</span>
        <span class="task-toast-label">Task Complete!</span>
        <span class="task-toast-shing">✦ SHING ✦</span>
      </div>
      <div class="task-toast-body">
        <div class="task-toast-title">${task.title}</div>
        <div class="task-toast-reward">${rewardTxt}</div>
      </div>
      <div class="task-toast-footer">
        <button class="task-claim-btn" id="toast-claim-${task.id}">Claim Reward</button>
  
      </div>
    `;

    stack.appendChild(el);

    // Wire claim button
    el.querySelector(`#toast-claim-${task.id}`)?.addEventListener('click', () => {
      this.claimTask(task.id, false);
      this._dismissToast(el);
    });

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.classList.add('slide-in'); });
    });

    // Auto-dismiss after 12 s if not claimed
    const autoDismiss = setTimeout(() => this._dismissToast(el), 12000);
    el._autoDismiss   = autoDismiss;
  }

  _dismissToast(el) {
    clearTimeout(el._autoDismiss);
    el.classList.remove('slide-in');
    el.classList.add('slide-out');
    setTimeout(() => {
      el.remove();
      this._showNextToast();
    }, 500);
  }

  /* ── Task Board UI ───────────────────────────── */
  openBoard() {
    this._checkDailyReset();
    this._buildBoard();
    document.getElementById('tasks-overlay').classList.remove('hidden');
  }

  closeBoard() {
    document.getElementById('tasks-overlay').classList.add('hidden');
  }

  _buildBoard() {
    const list = document.getElementById('tasks-list');
    if (!list) return;
    list.innerHTML = '';

    const filtered = this._filter === 'all'
      ? this.tasks
      : this.tasks.filter(t => t.category === this._filter);

    // Sort: completable unclaimed first, then in-progress, then claimed
    const sorted = [...filtered].sort((a, b) => {
      const scoreA = a.isClaimed ? 2 : a.current >= a.goal ? 0 : 1;
      const scoreB = b.isClaimed ? 2 : b.current >= b.goal ? 0 : 1;
      return scoreA - scoreB;
    });

    sorted.forEach(task => {
      const row = this._buildRow(task);
      list.appendChild(row);
    });
  }

  _buildRow(task) {
    const pct     = Math.min(100, (task.current / task.goal) * 100);
    const done    = task.current >= task.goal;
    const claimed = task.isClaimed;

    const isFloat  = typeof task.current === 'number' && !Number.isInteger(task.current);
    const curDisp  = isFloat ? task.current.toFixed(0) : task.current;

    const rewardTxt = task.rewardType === 'shards'
      ? `⬡ ${task.rewardValue}`
      : `🎨 Skin`;

    const row = document.createElement('div');
    row.className = `task-row cat-${task.category}${done ? ' completed' : ''}${claimed ? ' claimed' : ''}`;
    row.dataset.taskId = task.id;

    const dailyBadge = task.isDaily
      ? `<span class="daily-reset-badge">Resets Daily</span>`
      : '';

    let btnClass = 'locked', btnLabel = '';
    if (claimed)     { btnClass = 'done';  btnLabel = '✓ Claimed'; }
    else if (done)   { btnClass = 'ready'; btnLabel = 'Claim'; }

    row.innerHTML = `
      <div class="task-row-icon">${task.icon}</div>
      <div class="task-row-name">${task.title}</div>
      <div class="task-row-reward">${rewardTxt}</div>
      <div class="task-row-desc">${task.desc}</div>
      ${dailyBadge}
      <div class="task-row-progress-wrap">
        <div class="task-row-bar-track">
          <div class="task-row-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="task-row-count">${curDisp} / ${task.goal}</div>
        <button class="task-row-claim-btn ${btnClass}">${btnLabel}</button>
      </div>
    `;

    // Claim button logic
    if (done && !claimed) {
      const btn = row.querySelector('.task-row-claim-btn');
      btn.addEventListener('click', () => {
        if (task.adDoubleReward) {
          // Offer ad double for daily bounty
          this._promptAdDouble(task.id, btn);
        } else {
          this.claimTask(task.id, false);
          this._refreshRow(task);
        }
      });
    }

    return row;
  }

  _promptAdDouble(taskId, triggerEl) {
    // Simple inline ad-offer: replace button text briefly
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    const wrap = triggerEl.closest('.task-row-progress-wrap');
    wrap.innerHTML = `
      <div style="flex:1;font-size:11px;color:#aaa;letter-spacing:1px;">
        Claim ⬡${task.rewardValue} or watch ad for ⬡${task.rewardValue * 2}
      </div>
      <button class="task-row-claim-btn ready" id="board-claim-${taskId}">Claim</button>
      <button class="task-row-claim-btn ready" id="board-ad-${taskId}"
        style="border-color:#ff88cc;color:#ff88cc;">🎬 ×2</button>
    `;
    document.getElementById(`board-claim-${taskId}`)?.addEventListener('click', () => {
      this.claimTask(taskId, false); this._refreshRow(task);
    });
    document.getElementById(`board-ad-${taskId}`)?.addEventListener('click', () => {
      CrazyGames.SDK.ad.requestAd('rewarded', {
        adRewarded: () => { this.claimTask(taskId, true); this._refreshRow(task); },
        adFinished: () => {},
      });
    });
  }

  _refreshRow(task) {
    const existing = document.querySelector(`.task-row[data-task-id="${task.id}"]`);
    if (!existing) return;
    const newRow = this._buildRow(task);
    existing.replaceWith(newRow);
  }

  _wireFilterTabs() {
    document.querySelectorAll('.tasks-filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tasks-filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._filter = tab.dataset.filter;
        this._buildBoard();
      });
    });
  }

  _wireBoardClose() {
    document.getElementById('tasks-close-btn')?.addEventListener('click', () => this.closeBoard());
  }

  /* ── Central floating message ─────────────────── */
  _showCentralMessage(text, color = '#ffd700') {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed', top: '45%', left: '50%',
      transform: 'translate(-50%,-50%) scale(0.8)',
      fontFamily: "'Cinzel', serif", fontSize: '22px',
      letterSpacing: '4px', color,
      textShadow: `0 0 20px ${color}`,
      zIndex: '9999', pointerEvents: 'none',
      transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
      opacity: '0',
    });
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-80%) scale(1)';
      });
    });
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 600);
    }, 1800);
  }
}

/* ═══════════════════════════════════════════════════════
   SKIN CATALOGUE  — v3 Expanded Vestiary
   tier:  'basic' | 'premium' | 'legendary' | 'elite' | 'ad'
   type:  'solid' | 'gradient' | 'flame' | 'electric' | 'void'
          'pulse' | 'orbit' | 'nova' | 'dragon'
   All new types fall through to existing renderers:
     pulse  → gradient  (animated pulsing gradient, same shader)
     orbit  → void      (spawns orbiting cube particles)
     nova   → flame     (outward burst particles, same flame path)
     dragon → flame     (warm ember palette, same flame path)
═══════════════════════════════════════════════════════ */
