const SEASON_SKINS = [
  {
    id:       'solar_eclipse',
    name:     'Solar Eclipse',
    tier:     'elite',
    type:     'nova',
    price:    1300,
    desc:     'The blinding corona of a dying star. The gold standard of Season 1. +12% Damage · +8% Movement Speed · +15% Soul Shard Gain.',
    colors:   [0xff8c00, 0xffdd00, 0x8b008b, 0x000033],
    glowColor:'#ff8c00',
    bodyGlow: '#ffaa22',
    seasonOnly: true,
    bonuses:  { damageBonus: 1.12, speedBonus: 1.08, shardGain: 1.15 },
    bonusLabel: '+12% Damage · +8% Speed · +15% Shards',
  },
  {
    id:       'shadow_reaper',
    name:     'Shadow Reaper',
    tier:     'elite',
    type:     'orbit',
    price:    1300,
    desc:     'Forged in the darkest void. Season Pass Lv.20 exclusive — the pinnacle of darkness. +15% Dash Speed · +10% Soul Shard Gain.',
    colors:   [0x2d0066, 0x8a2be2, 0x000000, 0x440088],
    glowColor:'#8a2be2',
    bodyGlow: '#6600cc',
    seasonOnly: true,
    bonuses:  { dashBonus: 1.15, shardGain: 1.10 },
    bonusLabel: '+15% Dash Speed · +10% Soul Shards',
  },
];

/* ═══════════════════════════════════════════════════════
   SEASON MANAGER
   Owns the Spin-to-Win UI, Season Pass progress bar,
   wheel animation, and all CrazyGames ad hooks.
═══════════════════════════════════════════════════════ */
