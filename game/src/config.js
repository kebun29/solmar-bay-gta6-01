// Coralina Bay: Sunset Syndicate — Central Game Configuration & Constants

export const WORLD_BOUNDS = {
  minX: -135,
  maxX: 32,
  minZ: -230,
  maxZ: 230,
};

export const CAMERA_DEFAULTS = {
  fov: 56,
  boostFov: 64,
  minPitch: -0.26, // ~ -15 deg
  maxPitch: 0.96,  // ~ +55 deg
  minDist: 4.5,
  maxDist: 14.5,
  vehicleDist: 9.2,
  onFootDist: 6.0,
  autoRecenterDelay: 2.5,
};

export const DISTRICTS = [
  { id: 'marina', name: 'MARINA BOULEVARD', sub: 'COASTAL ART-DECO STRIP', x: 0, z: 0, r: 95, standing: 67, status: 'ALLIED' },
  { id: 'azura', name: 'AZURA DOWNTOWN', sub: 'FINANCIAL SKYLINE', x: -72, z: -70, r: 95, standing: 58, status: 'FRIENDLY' },
  { id: 'bazaar', name: 'MANGROVE BAZAAR', sub: 'NEON NIGHT MARKET', x: -45, z: 60, r: 75, standing: 82, status: 'LOYAL' },
  { id: 'harbor', name: 'PELICAN HARBOR', sub: 'SHIPPING & YACHT DOCKS', x: 42, z: 120, r: 85, standing: 51, status: 'NEUTRAL' },
  { id: 'hibiscus', name: 'HIBISCUS HEIGHTS', sub: 'HILLSIDE VILLAS', x: -95, z: 125, r: 85, standing: 74, status: 'ALLIED' },
  { id: 'industrial', name: 'VERDANT INDUSTRIAL', sub: 'PORT WAREHOUSES', x: -120, z: -15, r: 80, standing: 44, status: 'CONTESTED' },
  { id: 'isla', name: 'ISLA DORADA', sub: 'PRIVATE RESORT ISLAND', x: 135, z: -165, r: 105, standing: 36, status: 'HOSTILE' },
];

export function getDistrictAt(x, z) {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(x - d.x, z - d.z);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

export const WEAPONS = [
  { id: 0, key: '1', name: 'BRAWL', ammo: '∞', maxAmmo: '∞', damage: 24, cooldown: 0.35, range: 3.0 },
  { id: 1, key: '2', name: 'CORAL 9MM', ammo: 16, maxAmmo: 96, damage: 28, cooldown: 0.24, range: 45 },
  { id: 2, key: '3', name: 'VIPER SMG', ammo: 36, maxAmmo: 180, damage: 19, cooldown: 0.11, range: 38 },
  { id: 3, key: '4', name: 'TIDAL 12G', ammo: 8, maxAmmo: 32, damage: 56, cooldown: 0.65, range: 22 },
  { id: 4, key: '5', name: 'SYNDICATE AR', ammo: 30, maxAmmo: 120, damage: 35, cooldown: 0.14, range: 60 },
];

export const CREW_ABILITIES = [
  {
    key: 'Z',
    id: 'blackout',
    name: 'SIGNAL BLACKOUT',
    crew: 'Maya Lin · Hacker',
    role: 'netrunner',
    bio: 'Ex-grid security architect. Scrambles CBPD dispatch towers and drops wanted heat.',
    accent: '#22d3ee',
    maxCd: 24,
    cd: 0,
    level: 1,
    maxLevel: 3,
    upgradeCost: 2400,
  },
  {
    key: 'X',
    id: 'nitro',
    name: 'NITRO SURGE',
    crew: 'Rico Vega · Driver',
    role: 'tuner',
    bio: 'Marina street-racing mechanic. Injects twin-stage nitrous and patches chassis damage.',
    accent: '#fb7185',
    maxCd: 18,
    cd: 0,
    level: 1,
    maxLevel: 3,
    upgradeCost: 2200,
  },
  {
    key: 'C',
    id: 'flare',
    name: 'FLARE SCREEN',
    crew: 'Dante Cruz · Tactician',
    role: 'fixer',
    bio: 'Former harbor tactical fixer. Pops thermal smoke cover and deploys titanium armor plates.',
    accent: '#c084fc',
    maxCd: 22,
    cd: 0,
    level: 1,
    maxLevel: 3,
    upgradeCost: 2600,
  },
];

export const MISSIONS = [
  {
    num: 2,
    title: 'SUNSET HEIST',
    stages: [
      { title: 'BOOST THE CORSAIR V12', obj: 'Steal the getaway coupe on Marina Boulevard', next: 'NEXT: REACH PELICAN HARBOR', target: { x: 2, z: 95 } },
      { title: 'SHAKE CBPD PATROL', obj: 'Escape pursuit into Mangrove Bazaar', next: 'NEXT: MEET VALERIA AT THE BAZAAR', target: { x: -40, z: 60 } },
    ],
  },
  {
    num: 5,
    title: 'BRIDGE RUNNER',
    stages: [
      { title: 'INTERCEPT THE COURIER', obj: 'Track the syndicate convoy past Azura Downtown', next: 'NEXT: BREACH THE BAY BLOCKADE', target: { x: 2, z: -60 } },
      { title: 'BREACH THE BAY BLOCKADE', obj: 'Outrun CBPD units along Marina Boulevard toward the Suspension Bridge', next: 'NEXT: STASH THE VAULT DRIVE AT ISLA DORADA', target: { x: 45, z: -150 } },
      { title: 'CROSS CORALINA BRIDGE', obj: 'Race across the Bay Suspension Bridge under air fire', next: 'NEXT: DOCK AT ISLA DORADA', target: { x: 120, z: -175 } },
      { title: 'DOCK AT ISLA DORADA', obj: 'Deliver the encrypted drive to the private yacht', next: 'NEXT: CONTRACT COMPLETE', target: { x: 155, z: -120 } },
    ],
  },
  {
    num: 6,
    title: 'BAZAAR TAKEDOWN',
    stages: [
      { title: 'ENTER MANGROVE BAZAAR', obj: 'Link up with Maya inside the neon night market', next: 'NEXT: SECURE MANGROVE BAZAAR', target: { x: -42, z: 60 } },
      { title: 'SECURE MANGROVE BAZAAR', obj: 'Clear CBPD tactical squad from the wet market plaza', next: 'NEXT: EXFIL VIA PELICAN HARBOR', target: { x: -46, z: 64 } },
      { title: 'REACH THE EXFIL SKIFF', obj: 'Sprint east to Pelican Harbor pier', next: 'NEXT: CONTRACT COMPLETE', target: { x: 14, z: 82 } },
    ],
  },
];

export const GARAGE_PAINTS = [
  { name: 'Coral Sunset', hex: '#f43f5e' },
  { name: 'Bay Turquoise', hex: '#06b6d4' },
  { name: 'Solar Gold', hex: '#f59e0b' },
  { name: 'Miami Mint', hex: '#10b981' },
  { name: 'Midnight Violet', hex: '#8b5cf6' },
  { name: 'Obsidian Pearl', hex: '#1e293b' },
];

export const INTERACTIVE_LOCATIONS = [
  {
    id: 'garage',
    name: 'MARINA GARAGE',
    subtitle: 'Repair · Respray · Turbo',
    x: -11.4,
    z: 10.0,
    radius: 7.5,
    color: 0x22d3ee,
  },
  {
    id: 'arms',
    name: 'BAZAAR ARMS DEALER',
    subtitle: 'Ammo · Titanium Armor · Medkit',
    x: -36.5,
    z: 73.5,
    radius: 6.0,
    color: 0xfb7185,
  },
];

export const SAVE_PREFIX = 'coralina_bay_slot_';

export function getDefaultSaves() {
  return [
    {
      slot: 1,
      occupied: true,
      act: 'ACT III — BRIDGE RUNNER',
      district: 'Marina Boulevard',
      cash: 31800,
      rank: 6,
      rp: 6420,
      completion: 74.8,
      time: '17:42',
      accent: '#fb7185',
    },
    {
      slot: 2,
      occupied: true,
      act: 'ACT II — BAZAAR TAKEDOWN',
      district: 'Mangrove Bazaar',
      cash: 19250,
      rank: 4,
      rp: 3180,
      completion: 48.2,
      time: '23:18',
      accent: '#22d3ee',
    },
    {
      slot: 3,
      occupied: false,
      act: 'EMPTY',
      district: 'No save data',
      cash: 0,
      rank: 1,
      rp: 0,
      completion: 0,
      time: '--:--',
      accent: '#475569',
    },
  ];
}
