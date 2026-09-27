/* ═══════════════════════════════════════════════════════
   SAVE SYSTEM  — v1
   Replaces the old localStorage-only SaveSystem. Keeps the
   exact same public API (getShards, addShards, spendShards,
   getUnlocked, unlockSkin, getEquipped, equipSkin) so every
   other system (SkinSystem, TaskManager, SeasonManager...)
   keeps working unmodified. Local cache = instant reads/UI;
   Supabase = source of truth, synced in the background.
   rankId / currentStars fields removed with the rank system.
═══════════════════════════════════════════════════════ */
const SaveSystem = {
  KEY: 'KANGLEIPUNG_V1_DATA',
  _saveTimer: null,

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const existing = raw ? JSON.parse(raw) : {};
      return {
        soulShards:    existing.soulShards    ?? 0,
        unlockedSkins: Array.isArray(existing.unlockedSkins) && existing.unlockedSkins.length
          ? existing.unlockedSkins
          : ['default'],
        equippedSkin:  existing.equippedSkin  ?? 'default',
        level:         existing.level         ?? 1,
        xp:            existing.xp            ?? 0,
      };
    } catch {
      return { soulShards: 0, unlockedSkins: ['default'], equippedSkin: 'default', level: 1, xp: 0 };
    }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); }
    catch(e) { console.warn('[SaveSystem] Local write failed:', e); }
    this._queueCloudSync(data);
  },

  /* Debounced push to Supabase so rapid shard/skin changes
     don't spam the network — fires ~900ms after the last change. */
  _queueCloudSync(data) {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._pushToCloud(data), 900);
  },

  async _pushToCloud(data) {
    const session = window._auth?.session;
    if (!session) return; // not logged in yet (or offline) — local cache still holds the data
    try {
      const { error } = await sb.rpc('save_player_data', {
        p_uid: session.uid,
        p_token: session.token,
        p_shards: data.soulShards,
        p_level: data.level,
        p_xp: data.xp,
        p_data: { unlockedSkins: data.unlockedSkins, equippedSkin: data.equippedSkin }
      });
      if (error) console.warn('[SaveSystem] Cloud sync failed:', error.message);
    } catch (e) {
      console.warn('[SaveSystem] Cloud sync error:', e);
    }
  },

  /* Called once by auth.js right after login/signup/resume —
     overwrites the local cache with the server's copy of truth. */
  hydrateFromServer(serverRow) {
    const d = {
      soulShards: serverRow.shards ?? 0,
      unlockedSkins: serverRow.save_data?.unlockedSkins?.length ? serverRow.save_data.unlockedSkins : ['default'],
      equippedSkin: serverRow.save_data?.equippedSkin ?? 'default',
      level: serverRow.level ?? 1,
      xp: serverRow.xp ?? 0,
    };
    localStorage.setItem(this.KEY, JSON.stringify(d));
  },

  getShards()   { return this.load().soulShards || 0; },
  addShards(n)  { const d=this.load(); d.soulShards=(d.soulShards||0)+n; this.save(d); return d.soulShards; },
  spendShards(n){ const d=this.load(); if((d.soulShards||0)<n) return false; d.soulShards-=n; this.save(d); return true; },

  getUnlocked() { return this.load().unlockedSkins || ['default']; },
  unlockSkin(id){
    const d=this.load();
    if(!Array.isArray(d.unlockedSkins)) d.unlockedSkins=['default'];
    if(!d.unlockedSkins.includes(id)) d.unlockedSkins.push(id);
    this.save(d);
  },
  getEquipped() { return this.load().equippedSkin || 'default'; },
  equipSkin(id) { const d=this.load(); d.equippedSkin=id; this.save(d); },
};
