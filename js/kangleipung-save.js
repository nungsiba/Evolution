const KangleipungSaveSystem = {
  SEASON_KEY: 'KANGLEIPUNG_V2_SEASON',

  _defaults() {
    return {
      S1_XP:            0,      // total season XP earned
      S1_LEVEL:         1,      // current season level (1-20)
      S1_TOKENS:        0,      // spare season tokens (future use)
      S1_UNLOCKED_SKINS: [],    // season-exclusive skins unlocked
      S1_SPIN_DATE:     '',     // YYYY-MM-DD of last spin reset
      S1_SPINS_TODAY:   0,      // spins used today
      S1_TOTAL_SPINS:   0,      // lifetime spin counter
      S1_SOULS_BANK:    0,      // accumulated souls toward next XP tick
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.SEASON_KEY);
      return raw ? { ...this._defaults(), ...JSON.parse(raw) } : this._defaults();
    } catch { return this._defaults(); }
  },

  save(data) {
    try { localStorage.setItem(this.SEASON_KEY, JSON.stringify(data)); }
    catch(e) { console.warn('[KangSave] Failed:', e); }
  },

  _today() { return new Date().toISOString().slice(0, 10); },

  /* XP & Level */
  XP_PER_LEVEL: 1000,
  MAX_LEVEL: 20,

  addXP(amount) {
    const d = this.load();
    d.S1_XP += amount;
    // Level up loop
    while (d.S1_LEVEL < this.MAX_LEVEL &&
           d.S1_XP >= d.S1_LEVEL * this.XP_PER_LEVEL) {
      d.S1_XP -= d.S1_LEVEL * this.XP_PER_LEVEL;
      d.S1_LEVEL++;
      // Solar Eclipse is the Season Pass Level 20 Elite Reward
      if (d.S1_LEVEL >= this.MAX_LEVEL) {
        if (!d.S1_UNLOCKED_SKINS.includes('solar_eclipse')) {
          d.S1_UNLOCKED_SKINS.push('solar_eclipse');
          SaveSystem.unlockSkin('solar_eclipse');
          setTimeout(() => window._seasonManager?._onPassEliteUnlocked(), 500);
        }
      }
    }
    this.save(d);
    return d;
  },

  /* Souls → XP conversion (100 XP per 1000 souls absorbed) */
  SOULS_PER_XP_TICK: 1000,
  XP_PER_TICK: 100,

  absorbSouls(count) {
    const d = this.load();
    d.S1_SOULS_BANK = (d.S1_SOULS_BANK || 0) + count;
    let gained = 0;
    while (d.S1_SOULS_BANK >= this.SOULS_PER_XP_TICK && d.S1_LEVEL < this.MAX_LEVEL) {
      d.S1_SOULS_BANK -= this.SOULS_PER_XP_TICK;
      gained += this.XP_PER_TICK;
    }
    this.save(d);
    if (gained > 0) this.addXP(gained);
    return gained;
  },

  /* Spins */
  checkDailySpinReset() {
    const d = this.load();
    if (d.S1_SPIN_DATE !== this._today()) {
      d.S1_SPIN_DATE   = this._today();
      d.S1_SPINS_TODAY = 0;
      this.save(d);
    }
  },

  recordSpin() {
    const d = this.load();
    d.S1_SPINS_TODAY++;
    d.S1_TOTAL_SPINS++;
    this.save(d);
    return d;
  },

  unlockSeasonSkin(id) {
    const d = this.load();
    if (!d.S1_UNLOCKED_SKINS.includes(id)) {
      d.S1_UNLOCKED_SKINS.push(id);
      this.save(d);
      SaveSystem.unlockSkin(id); // mirror into base system so equip works
    }
  },

  hasSkin(id) { return this.load().S1_UNLOCKED_SKINS.includes(id); },

  getLevel()   { return this.load().S1_LEVEL; },
  getXP()      { return this.load().S1_XP; },
  getXPNeeded(){ return this.load().S1_LEVEL * this.XP_PER_LEVEL; },
  getSpins()   { return this.load().S1_SPINS_TODAY; },
};

/* ═══════════════════════════════════════════════════════
   SEASON SKIN CATALOGUE ADDITIONS
   These two skins are added to the main SKIN_CATALOGUE
   after it is defined (via push), so the shop can also
   display them once unlocked.
═══════════════════════════════════════════════════════ */
