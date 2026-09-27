const SKIN_CATALOGUE = [

  /* ════════════════════════════════════════════════════
     BASIC  ·  220 Shards  ·  Solid monochrome trails
  ════════════════════════════════════════════════════ */
  {
    id: 'default', name: 'Soul White', tier: 'basic', type: 'solid',
    price: 0,
    desc: 'The original pale radiance of a freshly reaped soul.',
    colors: [0x00f5ff], glowColor: '#00f5ff', bodyGlow: '#00f5ff',
  },
  {
    id: 'crimson', name: 'Crimson Wraith', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Blood-red trail scorched by ten thousand kills.',
    colors: [0xff1a3a], glowColor: '#ff1a3a', bodyGlow: '#ff1a3a',
  },
  {
    id: 'toxic', name: 'Toxic Spectre', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Radioactive green aura that poisons the air itself.',
    colors: [0x00ff66], glowColor: '#00ff66', bodyGlow: '#00ff66',
  },
  {
    id: 'amber', name: 'Amber Shade', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Warm golden glow of an ancient wandering spirit.',
    colors: [0xffaa00], glowColor: '#ffaa00', bodyGlow: '#ffaa00',
  },
  {
    id: 'rose', name: 'Rose Specter', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Soft pink haze — beauty hiding pure malice.',
    colors: [0xff66aa], glowColor: '#ff66aa', bodyGlow: '#ff66aa',
  },
  // ── 10 New Basic skins ──────────────────────────────
  {
    id: 'cobalt', name: 'Cobalt Wraith', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Deep ocean-blue trail echoing the coldest depths of the soul.',
    colors: [0x0047ab], glowColor: '#0047ab', bodyGlow: '#0060e0',
  },
  {
    id: 'emerald', name: 'Emerald Soul', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Saturated jewel-green energy mined from the earth\'s core.',
    colors: [0x00c957], glowColor: '#00c957', bodyGlow: '#00ff6e',
  },
  {
    id: 'ochre', name: 'Neon Ochre', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Burnished mustard-yellow — the colour of ancient soul parchment.',
    colors: [0xddaa00], glowColor: '#ddaa00', bodyGlow: '#ffcc22',
  },
  {
    id: 'slate', name: 'Slate Phantom', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Cold grey fog that drifts in from the edge of existence.',
    colors: [0x708090], glowColor: '#708090', bodyGlow: '#99aabb',
  },
  {
    id: 'indigo', name: 'Indigo Revenant', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Inky indigo bleed from a dimension where light moves backwards.',
    colors: [0x4b0082], glowColor: '#7700cc', bodyGlow: '#9933ff',
  },
  {
    id: 'scarlet', name: 'Scarlet Banshee', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Screaming bright red, visible across every plane of existence.',
    colors: [0xff2200], glowColor: '#ff2200', bodyGlow: '#ff5500',
  },
  {
    id: 'teal', name: 'Teal Spectre', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Calm teal radiance — the last colour you see before oblivion.',
    colors: [0x00aaaa], glowColor: '#00cccc', bodyGlow: '#00eeee',
  },
  {
    id: 'ivory', name: 'Ivory Haunt', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Pale bone-white energy stripped of all warmth and mercy.',
    colors: [0xf0e6d3], glowColor: '#e8d9c0', bodyGlow: '#ffffff',
  },
  {
    id: 'lime', name: 'Lime Reaper', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Aggressive acid-lime — nature\'s warning colour worn as armour.',
    colors: [0x99ff00], glowColor: '#99ff00', bodyGlow: '#ccff44',
  },
  {
    id: 'navy', name: 'Navy Dusk', tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Midnight-navy cloak of a soul that sank to the ocean floor.',
    colors: [0x001f5b], glowColor: '#0033aa', bodyGlow: '#0055dd',
  },

  /* ════════════════════════════════════════════════════
     PREMIUM  ·  450 Shards  ·  Dual-tone gradients
                              with pulse oscillation
  ════════════════════════════════════════════════════ */
  {
    id: 'cyberwave', name: 'Cyberwave', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Fades from deep violet to electric cyan — a digital ghost.',
    colors: [0xbf00ff, 0x00f5ff], glowColor: '#8800ff', bodyGlow: '#00f5ff',
  },
  {
    id: 'inferno', name: 'Inferno Fade', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Shifts from bright orange at its core to darkest red at the tip.',
    colors: [0xff6600, 0xff0022], glowColor: '#ff3300', bodyGlow: '#ffaa00',
  },
  {
    id: 'aurora', name: 'Aurora Soul', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Northern lights captured in ethereal form — green to violet.',
    colors: [0x00ff88, 0xaa00ff], glowColor: '#44bb77', bodyGlow: '#00ffaa',
  },
  {
    id: 'midnight', name: 'Midnight Dream', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Cobalt blue bleeds into shimmering silver.',
    colors: [0x0066ff, 0xaaccff], glowColor: '#0044cc', bodyGlow: '#88aaff',
  },
  // ── 10 New Premium skins ────────────────────────────
  {
    id: 'vaporwave', name: 'Vaporwave Mist', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Hot pink blooms into aqua haze — nostalgia distilled into soul energy.',
    colors: [0xff71ce, 0x01cdfe], glowColor: '#ff71ce', bodyGlow: '#ff99ee',
  },
  {
    id: 'magma', name: 'Magma Flow', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Molten rock pulses between deep black and searing orange.',
    colors: [0xff4500, 0x1a0000], glowColor: '#ff4500', bodyGlow: '#ff7700',
  },
  {
    id: 'cyber_dusk', name: 'Cyber Dusk', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Dusky burnt-orange transitions through the last light of a digital sunset.',
    colors: [0xff6b35, 0x2d0080], glowColor: '#ff6b35', bodyGlow: '#ff9944',
  },
  {
    id: 'glacier', name: 'Glacier Pulse', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Polar white oscillates with arctic blue — frigid and absolute.',
    colors: [0xeef6ff, 0x005577], glowColor: '#aaddff', bodyGlow: '#ddf0ff',
  },
  {
    id: 'toxin', name: 'Toxin Surge', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Neon chartreuse bleeds into venomous purple — poison made beautiful.',
    colors: [0x80ff00, 0x8800ff], glowColor: '#80ff00', bodyGlow: '#aaff44',
  },
  {
    id: 'candy', name: 'Candy Hex', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Cotton-candy pink fades to bubblegum blue — sweet annihilation.',
    colors: [0xff88dd, 0x88ccff], glowColor: '#ff99ee', bodyGlow: '#ffaaf0',
  },
  {
    id: 'ember', name: 'Ember Fade', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Dying embers pulse between amber and ash grey — beautiful extinction.',
    colors: [0xff8c00, 0x444444], glowColor: '#ff8c00', bodyGlow: '#ffaa44',
  },
  {
    id: 'deep_sea', name: 'Deep Sea', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Abyssal darkness melts into bioluminescent green — life in the void.',
    colors: [0x001133, 0x00ffaa], glowColor: '#007755', bodyGlow: '#00ddaa',
  },
  {
    id: 'solar_flare', name: 'Solar Flare', tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Plasma ribbons of yellow and white surge from a miniature sun.',
    colors: [0xffff00, 0xff6600], glowColor: '#ffee00', bodyGlow: '#ffff88',
  },
  {
    id: 'spectral_rift', name: 'Spectral Rift', tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Reality tears apart in two — cyan on one side, dark crimson on the other.',
    colors: [0x00ffff, 0xaa0022], glowColor: '#00aaaa', bodyGlow: '#00ffff',
  },

  /* ════════════════════════════════════════════════════
     LEGENDARY  ·  670 Shards  ·  Particle emitters
                               + Orbiting effects
  ════════════════════════════════════════════════════ */
  {
    id: 'flame', name: 'Burning Wraith', tier: 'legendary', type: 'flame',
    price: 670,
    desc: 'Your wake leaves a trail of real flame particles that flicker and rise.',
    colors: [0xff4400, 0xff8800, 0xffff00], glowColor: '#ff4400', bodyGlow: '#ff6600',
  },
  {
    id: 'electric', name: 'Arc Phantom', tier: 'legendary', type: 'electric',
    price: 670,
    desc: 'Crackling lightning sparks arc from your body as you move.',
    colors: [0xffffff, 0xaaddff, 0x0088ff], glowColor: '#66aaff', bodyGlow: '#aaddff',
  },
  {
    id: 'void_walker', name: 'Void Walker', tier: 'legendary', type: 'void',
    price: 670,
    desc: 'Tiny dark cubes tumble in your wake — fragments of collapsed dimensions.',
    colors: [0x6600cc, 0x220044], glowColor: '#440088', bodyGlow: '#9900ff',
  },
  // ── 5 New Legendary skins ───────────────────────────
  {
    id: 'supernova', name: 'Supernova', tier: 'legendary', type: 'nova',
    price: 670,
    desc: 'A dying star implodes inside you — outward blasts of gold and white plasma.',
    colors: [0xffeeaa, 0xff8800, 0xffffff], glowColor: '#ffdd44', bodyGlow: '#ffffaa',
  },
  {
    id: 'void_singularity', name: 'Void Singularity', tier: 'legendary', type: 'orbit',
    price: 670,
    desc: 'Six dark matter orbs rotate in perfect silence around your collapsing core.',
    colors: [0x110022, 0x6600cc, 0x220044], glowColor: '#440088', bodyGlow: '#550099',
  },
  {
    id: 'dragon_spirit', name: 'Dragon Spirit', tier: 'legendary', type: 'dragon',
    price: 670,
    desc: 'Ancient draconic breath trails behind — red-gold embers and coiling smoke.',
    colors: [0xff2200, 0xff8800, 0xffcc00], glowColor: '#ff4400', bodyGlow: '#ff6600',
  },
  {
    id: 'crystal_orbit', name: 'Crystal Orbit', tier: 'legendary', type: 'orbit',
    price: 670,
    desc: 'Prismatic shards orbit like a shattered planet — every colour of the spectrum.',
    colors: [0x00ffff, 0xff00ff, 0xffff00], glowColor: '#88ffff', bodyGlow: '#aaffff',
  },
  {
    id: 'phantom_storm', name: 'Phantom Storm', tier: 'legendary', type: 'electric',
    price: 670,
    desc: 'A tempest of violet static — jagged arcs that tear through the veil.',
    colors: [0xcc00ff, 0x8800cc, 0xff88ff], glowColor: '#aa00ee', bodyGlow: '#dd44ff',
  },

  // ── 10 New Basic skins (v4 Expansion) ──────────────
  {
    id: 'obsidian',     name: 'Obsidian Reaper',   tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Volcanic black glass — sharper than any blade ever forged.',
    colors: [0x1a0a00], glowColor: '#330a00', bodyGlow: '#552200',
  },
  {
    id: 'cerulean',     name: 'Cerulean Wraith',   tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Sky-blue clarity from a soul that ascended past the clouds.',
    colors: [0x007fff], glowColor: '#007fff', bodyGlow: '#44aaff',
  },
  {
    id: 'vermillion',   name: 'Vermillion Shade',  tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Cinnabar red — the war-paint of a spirit that refuses to rest.',
    colors: [0xe34234], glowColor: '#e34234', bodyGlow: '#ff6655',
  },
  {
    id: 'chartreuse',   name: 'Chartreuse Specter',tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Radioactive yellow-green — life forced into the shape of death.',
    colors: [0x7fff00], glowColor: '#7fff00', bodyGlow: '#aaff44',
  },
  {
    id: 'orchid',       name: 'Orchid Phantom',    tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Pale violet-pink — the ghost of something once beautiful.',
    colors: [0xda70d6], glowColor: '#da70d6', bodyGlow: '#ee99ee',
  },
  {
    id: 'sienna',       name: 'Sienna Haunt',      tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Earthy rust-brown — the colour of dried blood on old stone.',
    colors: [0xa0522d], glowColor: '#c06030', bodyGlow: '#dd7744',
  },
  {
    id: 'periwinkle',   name: 'Periwinkle Soul',   tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Soft blue-lavender — the last breath of a fading dimension.',
    colors: [0xccccff], glowColor: '#aaaaee', bodyGlow: '#ddddff',
  },
  {
    id: 'jade',         name: 'Jade Revenant',     tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Ancient jade stone channelling the power of ten thousand reapings.',
    colors: [0x00a86b], glowColor: '#00a86b', bodyGlow: '#00cc88',
  },
  {
    id: 'saffron',      name: 'Saffron Wraith',    tier: 'basic', type: 'solid',
    price: 220,
    desc: 'Spice-gold warmth hiding incandescent fury beneath the surface.',
    colors: [0xf4c430], glowColor: '#f4c430', bodyGlow: '#ffdd66',
  },
  {
    id: 'ash',          name: 'Ash Phantom',       tier: 'basic', type: 'solid',
    price: 220,
    desc: 'The grey of a world after the fire — quiet, total, absolute.',
    colors: [0xb2beb5], glowColor: '#b2beb5', bodyGlow: '#d4d8d5',
  },

  // ── 10 New Premium skins (v4 Expansion) ─────────────
  {
    id: 'twilight_fade',  name: 'Twilight Fade',    tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Deep violet sky melts into golden horizon — the hour the sun bleeds.',
    colors: [0x6a0dad, 0xffb347], glowColor: '#8833dd', bodyGlow: '#aa55ff',
  },
  {
    id: 'ice_fire',       name: 'Ice & Fire',        tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Absolute zero blue at the head, dragon-heart red at the tail.',
    colors: [0x00cfff, 0xff2200], glowColor: '#0088cc', bodyGlow: '#44ccff',
  },
  {
    id: 'poison_mist',    name: 'Poison Mist',       tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Sickly lime pulsing into toxic magenta — beautiful biological warfare.',
    colors: [0xaaff00, 0xff00aa], glowColor: '#88ee00', bodyGlow: '#ccff44',
  },
  {
    id: 'royal_violet',   name: 'Royal Violet',      tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Deep imperial purple fades into gleaming white-gold — sovereign energy.',
    colors: [0x7b2fbe, 0xf8e87d], glowColor: '#9933cc', bodyGlow: '#cc66ff',
  },
  {
    id: 'neon_dusk',      name: 'Neon Dusk',         tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Hot-pink city lights bleed into electric purple at closing hour.',
    colors: [0xff0090, 0x6600ff], glowColor: '#ff0090', bodyGlow: '#ff44bb',
  },
  {
    id: 'arctic_flame',   name: 'Arctic Flame',      tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Ice-white core blazing into electric-blue edges — cold fire made real.',
    colors: [0xffffff, 0x0044ff], glowColor: '#88aaff', bodyGlow: '#ccddff',
  },
  {
    id: 'amber_gold',    name: 'Amber & Gold',     tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Warm metallic shimmer — molten gold bleeding through amber light.',
    colors: [0xcd7f32, 0xffd700], glowColor: '#cc8822', bodyGlow: '#ffbb44',
  },
  {
    id: 'verdant_storm',  name: 'Verdant Storm',     tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Forest-green pulses through silver-white — nature\'s thunderclap.',
    colors: [0x00aa44, 0xdddddd], glowColor: '#00bb55', bodyGlow: '#44dd88',
  },
  {
    id: 'rose_gold',      name: 'Rose Gold',         tier: 'premium', type: 'gradient',
    price: 450,
    desc: 'Blush pink fused with soft gold — elegance sharpened to a killing edge.',
    colors: [0xffb6c1, 0xb8860b], glowColor: '#cc8899', bodyGlow: '#ffccdd',
  },
  {
    id: 'shadow_pulse',   name: 'Shadow Pulse',      tier: 'premium', type: 'pulse',
    price: 450,
    desc: 'Pitch-black darkness surges with sudden bursts of deep crimson light.',
    colors: [0x0a0008, 0xcc0022], glowColor: '#880011', bodyGlow: '#cc0033',
  },

  // ── 5 New Legendary skins (v4 Expansion) ────────────
  {
    id: 'cosmic_rift',    name: 'Cosmic Rift',       tier: 'legendary', type: 'electric',
    price: 670,
    desc: 'A tear in spacetime crackles around you — blue-white lightning from another universe.',
    colors: [0x00ffff, 0x0000ff, 0xffffff], glowColor: '#00ddff', bodyGlow: '#88eeff',
  },
  {
    id: 'infernal_orbit', name: 'Infernal Orbit',    tier: 'legendary', type: 'orbit',
    price: 670,
    desc: 'Six magma spheres rotate in tight formation — a miniature solar system of pure destruction.',
    colors: [0xff4400, 0xff8800, 0xff2200], glowColor: '#ff5500', bodyGlow: '#ff7722',
  },
  {
    id: 'ghost_nova',     name: 'Ghost Nova',        tier: 'legendary', type: 'nova',
    price: 670,
    desc: 'A spectral white explosion — particles burst outward then vanish like they never existed.',
    colors: [0xffffff, 0xaaccff, 0x8888ff], glowColor: '#aabbff', bodyGlow: '#ccddff',
  },
  {
    id: 'molten_dragon',  name: 'Molten Dragon',     tier: 'legendary', type: 'dragon',
    price: 670,
    desc: 'Lava-orange scales shed and ignite — the wake of a beast born in the earth\'s core.',
    colors: [0xff6600, 0xff2200, 0xffaa00], glowColor: '#ff5500', bodyGlow: '#ff8833',
  },
  {
    id: 'astral_storm',   name: 'Astral Storm',      tier: 'legendary', type: 'flame',
    price: 670,
    desc: 'Astral-blue flame surges upward from every step — a soul burning on two planes at once.',
    colors: [0x0055ff, 0x00aaff, 0xaaddff], glowColor: '#0077ff', bodyGlow: '#44aaff',
  },

  /* ── Achievement-unlock ── */
  {
    id: 'golden_tail', name: 'Golden Sovereign', tier: 'legendary', type: 'gradient',
    price: 0,
    desc: 'Forged from 5,000 gathered souls — the mark of a true Rich Reaper.',
    colors: [0xffd700, 0xffaa00], glowColor: '#ffd700', bodyGlow: '#ffee88',
    achievementOnly: true,
  },

  /* ── Ad-only ── */
  {
    id: 'stardust', name: 'Stardust Angel', tier: 'legendary', type: 'gradient',
    price: 670,
    desc: 'A divine shimmer of golden stardust — earned by watching a single ad.',
    colors: [0xffd700, 0xffffff], glowColor: '#ffdd44', bodyGlow: '#ffeebb',
    adOnly: true,
  },
];

// Merge season skins into the main catalogue (must be after SKIN_CATALOGUE declaration)
SEASON_SKINS.forEach(s => {
  if (!SKIN_CATALOGUE.find(x => x.id === s.id)) SKIN_CATALOGUE.push(s);
});

/* ═══════════════════════════════════════════════════════
   SKIN SYSTEM — Preview Renderer + Shop Controller
═══════════════════════════════════════════════════════ */
