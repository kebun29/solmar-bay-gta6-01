// Coralina Bay: Sunset Syndicate — Core Configuration & Constants
export const WORLD_BOUNDS = { minX: -135, maxX: 32, minZ: -230, maxZ: 230 };
export const CAMERA_DEFAULTS = { fov: 56, boostFov: 64, minPitch: -0.26, maxPitch: 0.96, minDist: 4.5, maxDist: 14.5, vehicleDist: 9.2, onFootDist: 6.0, autoRecenterDelay: 2.5 };

export const DISTRICTS = [
  ['marina', 'MARINA BOULEVARD', 'COASTAL ART-DECO STRIP', 0, 0, 95, 67, 'ALLIED'],
  ['azura', 'AZURA DOWNTOWN', 'FINANCIAL SKYLINE', -72, -70, 95, 58, 'FRIENDLY'],
  ['bazaar', 'MANGROVE BAZAAR', 'NEON NIGHT MARKET', -45, 60, 75, 82, 'LOYAL'],
  ['harbor', 'PELICAN HARBOR', 'SHIPPING & YACHT DOCKS', 42, 120, 85, 51, 'NEUTRAL'],
  ['hibiscus', 'HIBISCUS HEIGHTS', 'HILLSIDE VILLAS', -95, 125, 85, 74, 'ALLIED'],
  ['industrial', 'VERDANT INDUSTRIAL', 'PORT WAREHOUSES', -120, -15, 80, 44, 'CONTESTED'],
  ['isla', 'ISLA DORADA', 'PRIVATE RESORT ISLAND', 135, -165, 105, 36, 'HOSTILE'],
].map(([id, name, sub, x, z, r, standing, status]) => ({ id, name, sub, x, z, r, standing, status }));

export function getDistrictAt(x, z) {
  let best = DISTRICTS[0], bd = Infinity;
  for (const d of DISTRICTS) { const dd = Math.hypot(x - d.x, z - d.z); if (dd < bd) { bd = dd; best = d; } }
  return best;
}

export const WEAPONS = [
  [0, '1', 'BRAWL', '∞', '∞', 24, 0.35, 3], [1, '2', 'CORAL 9MM', 16, 96, 28, 0.24, 45],
  [2, '3', 'VIPER SMG', 36, 180, 19, 0.11, 38], [3, '4', 'TIDAL 12G', 8, 32, 56, 0.65, 22], [4, '5', 'SYNDICATE AR', 30, 120, 35, 0.14, 60],
].map(([id, key, name, ammo, maxAmmo, damage, cooldown, range]) => ({ id, key, name, ammo, maxAmmo, damage, cooldown, range }));

export const CREW_ABILITIES = [
  ['Z', 'blackout', 'SIGNAL BLACKOUT', 'Maya Lin · Hacker', 'netrunner', 'Scrambles CBPD dispatch towers and drops wanted heat.', '#22d3ee', 24, 2400],
  ['X', 'nitro', 'NITRO SURGE', 'Rico Vega · Driver', 'tuner', 'Injects twin-stage nitrous and patches chassis damage.', '#fb7185', 18, 2200],
  ['C', 'flare', 'FLARE SCREEN', 'Dante Cruz · Tactician', 'fixer', 'Pops thermal smoke cover and deploys titanium armor.', '#c084fc', 22, 2600],
].map(([key, id, name, crew, role, bio, accent, maxCd, upgradeCost]) => ({ key, id, name, crew, role, bio, accent, maxCd, cd: 0, level: 1, maxLevel: 3, upgradeCost }));

export const MISSIONS = [
  { num: 2, title: 'SUNSET HEIST', stages: [
    { title: 'BOOST THE CORSAIR V12', obj: 'Steal the getaway coupe on Marina Boulevard', next: 'PELICAN HARBOR', target: { x: 2, z: 95 } },
    { title: 'SHAKE CBPD PATROL', obj: 'Escape pursuit into Mangrove Bazaar', next: 'MEET VALERIA', target: { x: -40, z: 60 } },
  ] },
  { num: 5, title: 'BRIDGE RUNNER', stages: [
    { title: 'INTERCEPT THE COURIER', obj: 'Track the syndicate convoy past Azura Downtown', next: 'BAY BLOCKADE', target: { x: 2, z: -60 } },
    { title: 'BREACH THE BAY BLOCKADE', obj: 'Outrun CBPD along Marina Blvd toward the Bay Bridge', next: 'ISLA DORADA', target: { x: 45, z: -150 } },
    { title: 'CROSS CORALINA BRIDGE', obj: 'Race across the Suspension Bridge under air fire', next: 'YACHT DOCK', target: { x: 120, z: -175 } },
    { title: 'DOCK AT ISLA DORADA', obj: 'Deliver the encrypted drive to the private yacht', next: 'COMPLETE', target: { x: 155, z: -120 } },
  ] },
  { num: 6, title: 'BAZAAR TAKEDOWN', stages: [
    { title: 'ENTER MANGROVE BAZAAR', obj: 'Link up with Maya inside the neon night market', next: 'SECURE BAZAAR', target: { x: -42, z: 60 } },
    { title: 'SECURE MANGROVE BAZAAR', obj: 'Clear CBPD SWAT squad from the wet market plaza', next: 'EXFIL HARBOR', target: { x: -46, z: 64 } },
    { title: 'REACH THE EXFIL SKIFF', obj: 'Sprint east to Pelican Harbor pier', next: 'COMPLETE', target: { x: 14, z: 82 } },
  ] },
];

export const GARAGE_PAINTS = [['Coral Sunset', '#f43f5e'], ['Bay Turquoise', '#06b6d4'], ['Solar Gold', '#f59e0b'], ['Miami Mint', '#10b981'], ['Midnight Violet', '#8b5cf6'], ['Obsidian Pearl', '#1e293b']].map(([name, hex]) => ({ name, hex }));
export const INTERACTIVE_LOCATIONS = [
  { id: 'garage', name: 'MARINA GARAGE', subtitle: 'Repair · Respray · Turbo', x: -11.4, z: 10.0, radius: 7.5, color: 0x22d3ee },
  { id: 'arms', name: 'BAZAAR ARMS DEALER', subtitle: 'Ammo · Armor · Medkit', x: -36.5, z: 73.5, radius: 6.0, color: 0xfb7185 },
];
export const SAVE_PREFIX = 'coralina_bay_slot_';

export function getDefaultSaves() {
  return [
    { slot: 1, occupied: true, act: 'ACT III — BRIDGE RUNNER', district: 'Marina Boulevard', cash: 31800, rank: 6, rp: 6420, completion: 74.8, time: '17:42', accent: '#fb7185' },
    { slot: 2, occupied: true, act: 'ACT II — BAZAAR TAKEDOWN', district: 'Mangrove Bazaar', cash: 19250, rank: 4, rp: 3180, completion: 48.2, time: '23:18', accent: '#22d3ee' },
    { slot: 3, occupied: false, act: 'EMPTY', district: 'No save data', cash: 0, rank: 1, rp: 0, completion: 0, time: '--:--', accent: '#475569' },
  ];
}
