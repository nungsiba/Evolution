/* ═══════════════════════════════════════════════════════
   MULTIPLAYER  — Real-time Co-op  (v1)

   Scope, stated plainly: players in the same room see each
   other live — position, HP, level — over a Supabase
   Realtime channel (broadcast + presence), and start their
   run together. Each client still simulates its OWN enemies,
   pellets and waves locally — there is no authoritative game
   server arbitrating a single shared world. That would need
   a always-on server process, which is a separate, much
   bigger build. This gives true "fight alongside a friend in
   real time" — you see them, they see you, both of you are
   in danger together — without needing to stand up a game
   server.
═══════════════════════════════════════════════════════ */
const Multiplayer = {
  room: null,        // { code, hostUid }
  channel: null,
  scene: null,        // active GameScene, set by attachScene()
  players: {},         // uid -> { username }

  init() {
    document.getElementById('btn-open-coop').addEventListener('click', () => this._openLobby());
    document.getElementById('coop-close-btn').addEventListener('click', () => this._closeLobby());
    document.getElementById('btn-coop-create').addEventListener('click', () => this.createRoom());
    document.getElementById('btn-coop-join').addEventListener('click', () => {
      const code = document.getElementById('coop-join-code').value.trim().toUpperCase();
      if (code) this.joinRoom(code);
    });
    document.getElementById('btn-coop-leave').addEventListener('click', () => this.leaveRoom());
    document.getElementById('btn-coop-start').addEventListener('click', () => this._startTogether());
  },

  _openLobby() {
    if (!Auth.session) {
      // Co-op needs an account (a room has to belong to somebody) —
      // everything else in the game works without one. Send the player
      // to log in/sign up, then automatically reopen this lobby.
      Auth.openAuthOverlay('coop');
      return;
    }
    document.getElementById('coop-overlay').classList.remove('hidden');
  },
  _closeLobby() { document.getElementById('coop-overlay').classList.add('hidden'); },

  async createRoom() {
    const session = Auth.session;
    const err = document.getElementById('coop-error');
    err.textContent = '';
    const { data, error } = await sb.rpc('create_room', { p_uid: session.uid, p_token: session.token, p_username: session.username });
    if (error) { err.textContent = 'Could not create room. Try again.'; return; }
    await this._joinChannel(data[0].code, session.uid, true);
  },

  async joinRoom(code) {
    const session = Auth.session;
    const err = document.getElementById('coop-error');
    err.textContent = '';
    const { data, error } = await sb.rpc('join_room', { p_code: code, p_uid: session.uid, p_token: session.token, p_username: session.username });
    if (error) {
      err.textContent = error.message.includes('ROOM_NOT_FOUND') ? 'No room with that code.'
        : error.message.includes('ROOM_FULL') ? 'That room is full.'
        : 'Could not join room.';
      return;
    }
    await this._joinChannel(data[0].code, session.uid, data[0].host_uid === session.uid);
  },

  async _joinChannel(code, uid, isHost) {
    this.room = { code, isHost };
    this.players = { [uid]: { username: Auth.session.username } };

    this.channel = sb.channel(`room:${code}`, { config: { presence: { key: String(uid) } } });

    this.channel
      .on('broadcast', { event: 'state' }, ({ payload }) => this._onRemoteState(payload))
      .on('broadcast', { event: 'start' }, () => this._onStartReceived())
      .on('presence', { event: 'sync' } , () => this._onPresenceSync())
      .on('presence', { event: 'leave' }, ({ key }) => { this.scene?.removeRemoteGhost(key); delete this.players[key]; this._renderPlayerList(); });

    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel.track({ username: Auth.session.username, uid });
        this._showRoomUI(code, isHost);
      }
    });
  },

  _onPresenceSync() {
    const state = this.channel.presenceState();
    this.players = {};
    for (const key in state) {
      const meta = state[key][0];
      this.players[key] = { username: meta.username };
    }
    this._renderPlayerList();
  },

  _renderPlayerList() {
    const list = document.getElementById('coop-player-list');
    if (!list) return;
    list.innerHTML = Object.entries(this.players)
      .map(([uid, p]) => `<div class="coop-player-row">⬡ ${p.username}${Number(uid) === Auth.session.uid ? ' (you)' : ''}</div>`)
      .join('');
  },

  _showRoomUI(code, isHost) {
    document.getElementById('coop-lobby-panel').classList.add('hidden');
    document.getElementById('coop-room-panel').classList.remove('hidden');
    document.getElementById('coop-room-code').textContent = code;
    document.getElementById('btn-coop-start').classList.toggle('hidden', !isHost);
    this._renderPlayerList();
  },

  broadcastState(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast', event: 'state',
      payload: { uid: Auth.session.uid, name: Auth.session.username, ...data }
    });
  },

  _onRemoteState(payload) {
    if (!this.scene || payload.uid === Auth.session.uid) return;
    this.scene.upsertRemoteGhost(payload.uid, payload.name, payload.x, payload.y, payload.hp, payload.maxHp, payload.skin);
  },

  _startTogether() {
    this.channel?.send({ type: 'broadcast', event: 'start', payload: {} });
    this._onStartReceived();
  },

  _onStartReceived() {
    this._closeLobby();
    document.getElementById('coop-room-panel').classList.add('hidden');
    document.getElementById('coop-lobby-panel').classList.remove('hidden');
    startGame();
  },

  attachScene(scene) { this.scene = scene; },
  detachScene() { this.scene = null; },

  notifyRunEnded() {
    // Local run ended (death) — remote allies keep playing their own run;
    // we simply stop broadcasting our ghost position.
    this.scene = null;
  },

  async leaveRoom() {
    if (!this.room) return;
    try { await sb.rpc('leave_room', { p_code: this.room.code, p_uid: Auth.session.uid }); } catch(_) {}
    this.channel?.unsubscribe();
    this.channel = null;
    this.room = null;
    this.players = {};
    document.getElementById('coop-room-panel').classList.add('hidden');
    document.getElementById('coop-lobby-panel').classList.remove('hidden');
    document.getElementById('coop-error').textContent = '';
  },
};
window._multiplayer = Multiplayer;
