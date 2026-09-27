# Kangleipung Evolution — Version 1

Multi-file rebuild of Soul Reaper 2, with the rank system removed, real-time
co-op multiplayer added, and a Supabase-backed login system.

## How to run
Open `index.html` in a browser (or serve the folder — some browsers block
local `fetch`/module behavior on `file://`, so `python3 -m http.server` in
this folder and visiting `http://localhost:8000` is the safest option).

## File structure
- `index.html` — page shell, all overlays (login, menu, shop, tasks, season, co-op lobby)
- `css/style.css` — all styling
- `js/` — one file per system:
  - `supabase-client.js` — Supabase project connection
  - `auth.js` — phone + username + password signup/login, session auto-resume
  - `multiplayer.js` — real-time co-op (room create/join, live player ghosts)
  - `save-system.js` — Supabase-backed save/shards/skins, with local cache
  - `game-scene.js` — the core Phaser scene (rank mode removed)
  - `entities.js` — Player/Enemy/Projectile/SoulPellet/SpatialGrid
  - `skin-system.js` / `skin-catalogue.js` — the shop (unchanged, as requested)
  - `task-manager.js` / `tasks-data.js` — Soul Contracts (unchanged)
  - `season-manager.js` / `season-skins.js` / `kangleipung-save.js` — Season Pass + Spin (unchanged)
  - `sound-manager.js` — audio (unchanged)
  - `main.js` — boot wiring

## What changed
- **Removed**: RankManager, the Bronze→Mythic tier badge system, rank-mode
  boss fights, the mode selector, and (on a follow-up pass) a shop skin
  whose name/flavor text ("Bronze & Gold", "climbing the rank ladder")
  was a naming leftover from the old tiers — renamed to "Amber & Gold"
  with new flavor text. The game is now one continuous survival mode with
  no rank system, badges, or rank-themed content anywhere in the code.
- **Fixed a real bug**: `LEVEL_REACHED` was being emitted every single
  frame instead of once per level-up.
- **Added**: phone+username+password accounts with a custom numeric UID
  (starts at `100000000`, one higher per new player), backed by a new
  Supabase project ("Kangleipung Evolution").
- **Added**: real-time co-op — create/join a 5-character room code, see
  teammates live on-screen wearing their actual equipped skin
  (position/HP/level synced), start together.
- **Offline-first**: opening `index.html` with no internet plays the full
  game immediately as a Guest — no login screen, no blocking gate.
  Progress saves to the browser's local storage exactly as before. An
  account is only needed to (a) sync progress across devices or
  (b) create/join a co-op room, since a room has to belong to somebody.
  Clicking "Co-op Multiplayer" while a Guest opens the login/signup form
  automatically, then returns straight to the co-op lobby afterward.
  Logging in while you already have guest progress merges it into the
  account (keeps the higher shard/level total and the union of unlocked
  skins) rather than overwriting it.
- **Rebranded**: footer now reads "KANGLEIPUNG EVOLUTION · VERSION 1 · BY
  KANGLEIPUNG INITIATIVE".

## Bugs found and fixed (this pass)
1. **`LEVEL_REACHED` fired every frame** instead of once per level-up (fixed in the original build).
2. **Guest→account login could silently wipe your equipped skin.** The merge logic used `guestSave.equippedSkin || row.save_data?.equippedSkin`, but `'default'` is a truthy string — so it *always* picked the local guest value, even on a brand-new device with no real guest save, overwriting your account's actual equipped skin. Now it only trusts the local value when this device actually had a prior save.
3. **"Void Guardian Hunter" task (defeat 1 boss, 400 shards) was permanently unachievable.** Boss fights only ever existed inside Rank Mode in the original file — removing Rank Mode (as requested) correctly removed all boss content, but left this task behind promising something the game can no longer deliver. Removed the task.
4. **"Spectral Dash" task (use 'Flash Step' 50 times, 100 shards) was also permanently unachievable** — pre-existing in the original file, there's no dash action anywhere in the game. Removed the task.
5. **Damage-bonus skin perks did nothing.** `Math.floor(this.stats._dmgMult || 1)` — flooring a multiplier like `1.12` ("+12% Damage") always equals `1`, identical to no bonus at all. Fixed with a fractional accumulator so the bonus has a real effect over many hits (e.g. a +12% bonus now deals a genuine bonus hit roughly 1-in-8 attacks).
6. **That same damage bonus never applied to projectiles at all** (multi-shot builds) — projectile damage was hardcoded to `1` regardless of any bonus. Now projectiles carry and apply the computed damage value.
7. **The "Ad-Only" shop tab was always empty.** It filtered skins by `tier === 'ad'`, but ad-unlockable skins are tagged `adOnly: true` on a normal tier (legendary) — no skin has `tier: 'ad'`. Fixed the filter to check the flag instead.

## Honest limitation on multiplayer
Co-op here is **real-time presence**, not a shared simulated world: each
player's enemies/waves are simulated on their own device, and teammates
see each other's live position/HP over Supabase Realtime. A single shared
world (same enemies for everyone) needs an always-on authoritative server
— a separate, larger project. Say the word if you want that next.

## Backend
Supabase project: `Kangleipung Evolution` (`qdppxnuolvvkvxweurxc`,
`ap-southeast-1`). Tables: `players`, `rooms`, `room_players`. All writes
go through `SECURITY DEFINER` RPC functions (`signup_player`,
`login_player`, `resume_session`, `save_player_data`, `create_room`,
`join_room`, `leave_room`) — passwords are hashed in Postgres via
pgcrypto, never sent or stored in plaintext.

## Tell me what to change next
Per your note, send updates whenever — new skins, balance changes, a
shared-world multiplayer upgrade, anything.
