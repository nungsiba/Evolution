const GameEvents = {
  _listeners: {},
  on(event, fn)  { (this._listeners[event] = this._listeners[event] || []).push(fn); },
  off(event, fn) { if (this._listeners[event]) this._listeners[event] = this._listeners[event].filter(f => f !== fn); },
  emit(event, payload) { (this._listeners[event] || []).forEach(fn => fn(payload)); },
};

/* ═══════════════════════════════════════════════════════
   TASK DATA — TASKS catalogue
   category: 'mission' | 'achievement' | 'daily'
   rewardType: 'shards' | 'skin'
   trackEvent: the GameEvents key this task listens to
═══════════════════════════════════════════════════════ */
