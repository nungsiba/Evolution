/* ═══════════════════════════════════════════════════════
   AUTH SYSTEM  — v1
   Offline-first: the game is fully playable from the raw
   file with NO login — SaveSystem already caches everything
   to localStorage and simply skips the cloud sync when there
   is no session. Login is optional and only required to (a)
   sync progress across devices or (b) play real-time co-op,
   since a room needs an account to attach to.

   Accounts are created from Phone + Username + Password.
   Supabase (signup_player RPC) generates a custom numeric
   UID for every player (starts at 100000000, increments).
   A session token is cached in localStorage so returning
   players skip the login screen automatically next time.
═══════════════════════════════════════════════════════ */
const Auth = {
  SESSION_KEY: 'KANGLEIPUNG_V1_SESSION',
  session: null,        // { uid, username, token } — null while playing as guest
  pendingAction: null,  // e.g. 'coop' — what to do right after a successful login

  init() {
    document.getElementById('auth-signup-btn').addEventListener('click', () => this._doSignup());
    document.getElementById('auth-login-btn').addEventListener('click', () => this._doLogin());
    document.getElementById('auth-show-login').addEventListener('click', () => this._switchTab('login'));
    document.getElementById('auth-show-signup').addEventListener('click', () => this._switchTab('signup'));
    document.getElementById('auth-logout-btn').addEventListener('click', () => this.logout());
    document.getElementById('menu-login-btn').addEventListener('click', () => this.openAuthOverlay());
    document.getElementById('auth-close-btn').addEventListener('click', () => this.closeAuthOverlay());

    // Show "Guest" state immediately — the menu is already usable.
    this._refreshAccountUI();
    // Then quietly check for a previous login in the background.
    this._tryResume();
  },

  _switchTab(which) {
    document.getElementById('auth-signup-panel').classList.toggle('hidden', which !== 'signup');
    document.getElementById('auth-login-panel').classList.toggle('hidden', which !== 'login');
    document.getElementById('auth-error').textContent = '';
  },

  openAuthOverlay(pendingAction = null) {
    this.pendingAction = pendingAction;
    document.getElementById('auth-error').textContent = '';
    document.getElementById('auth-overlay').classList.remove('hidden');
  },

  closeAuthOverlay() {
    this.pendingAction = null;
    document.getElementById('auth-overlay').classList.add('hidden');
  },

  /* Silent background check — if a saved session is still valid,
     restore it; otherwise just stay in guest mode. Either way the
     menu is already usable the moment the page loads. */
  async _tryResume() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return;
    try {
      const cached = JSON.parse(raw);
      const { data, error } = await sb.rpc('resume_session', { p_uid: cached.uid, p_token: cached.token });
      if (error || !data || !data[0]) { localStorage.removeItem(this.SESSION_KEY); return; }
      const row = data[0];
      this.session = { uid: row.uid, username: row.username, token: cached.token };
      SaveSystem.hydrateFromServer(row);
      this._refreshAccountUI();
    } catch {
      /* stay guest — offline is always a safe fallback */
    }
  },

  async _doSignup() {
    const phone = document.getElementById('auth-signup-phone').value.trim();
    const username = document.getElementById('auth-signup-username').value.trim();
    const password = document.getElementById('auth-signup-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';

    if (!phone || !username || !password) { errEl.textContent = 'Fill in every field.'; return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

    const guestSave = SaveSystem.load(); // whatever was earned while offline, before this account existed

    const { data, error } = await sb.rpc('signup_player', { p_phone: phone, p_username: username, p_password: password });
    if (error) { errEl.textContent = this._friendlyError(error.message); return; }
    const row = data[0];
    this.session = { uid: row.uid, username: row.username, token: row.token };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session));

    // Brand-new account has nothing on the server yet — keep everything earned as a guest.
    SaveSystem.save(guestSave);
    this._afterAuthSuccess();
  },

  async _doLogin() {
    const identifier = document.getElementById('auth-login-identifier').value.trim();
    const password = document.getElementById('auth-login-password').value;
    const errEl = document.getElementById('auth-error');
    errEl.textContent = '';

    if (!identifier || !password) { errEl.textContent = 'Enter your phone/username and password.'; return; }

    // BUGFIX: SaveSystem.load() always returns a string (defaults to
    // 'default'), so `guestSave.equippedSkin || row...` was ALWAYS truthy
    // and would silently overwrite the account's real equipped skin with
    // 'default' the moment someone logged in on a fresh device/browser.
    // Only trust the local skin choice when this device actually had a
    // prior guest save; otherwise defer to the server's record.
    const hadLocalSave = localStorage.getItem(SaveSystem.KEY) !== null;

    const guestSave = SaveSystem.load(); // progress made offline before logging into this existing account

    const { data, error } = await sb.rpc('login_player', { p_identifier: identifier, p_password: password });
    if (error) { errEl.textContent = this._friendlyError(error.message); return; }
    const row = data[0];
    this.session = { uid: row.uid, username: row.username, token: row.token };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.session));

    // Merge: never lose progress either side made. Shards/level/xp take
    // the higher value, unlocked skins are the union of both. Equipped
    // skin: prefer the local choice only if this device actually had a
    // guest save; a brand-new device defers to the account's own record.
    const merged = {
      soulShards: Math.max(guestSave.soulShards || 0, row.shards || 0),
      unlockedSkins: Array.from(new Set([...(guestSave.unlockedSkins||['default']), ...((row.save_data?.unlockedSkins)||['default'])])),
      equippedSkin: hadLocalSave ? guestSave.equippedSkin : (row.save_data?.equippedSkin || 'default'),
      level: Math.max(guestSave.level || 1, row.level || 1),
      xp: Math.max(guestSave.xp || 0, row.xp || 0),
    };
    SaveSystem.save(merged);
    this._afterAuthSuccess();
  },

  logout() {
    window._multiplayer?.leaveRoom();
    this.session = null;
    localStorage.removeItem(this.SESSION_KEY);
    // Local progress stays on this device and keeps working fully offline.
    this._refreshAccountUI();
  },

  _friendlyError(msg) {
    const map = {
      PHONE_TAKEN: 'That phone number is already registered.',
      USERNAME_TAKEN: 'That username is taken — pick another.',
      INVALID_PHONE: 'Enter a valid phone number.',
      INVALID_USERNAME: 'Username must be at least 3 characters.',
      INVALID_PASSWORD: 'Password must be at least 6 characters.',
      INVALID_CREDENTIALS: 'Incorrect phone/username or password.',
      SESSION_EXPIRED: 'Your session expired — please log in again.',
    };
    for (const key in map) if (msg.includes(key)) return map[key];
    return 'Something went wrong. Please try again.';
  },

  _afterAuthSuccess() {
    this.closeAuthOverlay();
    this._refreshAccountUI();
    if (this.pendingAction === 'coop') {
      this.pendingAction = null;
      window._multiplayer?._openLobby();
    }
  },

  _refreshAccountUI() {
    updateMenuShards();
    const statusEl  = document.getElementById('menu-account-status');
    const loginBtn  = document.getElementById('menu-login-btn');
    const logoutBtn = document.getElementById('auth-logout-btn');
    if (this.session) {
      statusEl.textContent = `⬡ ${this.session.username} · UID ${this.session.uid}`;
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
    } else {
      statusEl.textContent = 'Playing as Guest (offline)';
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
    }
  },
};
window._auth = Auth;
