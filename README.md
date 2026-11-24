# Coralina Bay: Sunset Syndicate

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/kebun29/solmar-bay-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/kebun29/solmar-bay-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original 100% offline 3D open-world crime game set in Coralina Bay — featuring 7 coastal districts, Art-Deco pastel beachfront boulevards, the Coralina Bay Suspension Bridge, three full time-of-day moods with procedural PMREM sky reflections (Golden Sunset, Rain-Slicked Neon Night, and Turquoise Tropical Midday), free 360° GTA-style mouse-look controls, escalating 1–5 star CBPD pursuits, articulated on-foot combat in Mangrove Bazaar, interactive Marina Garage & Arms Dealer, Web Audio radio/SFX, and a 3-slot save system. Built for the [make.fun `gta6-01` bounty](https://make.fun/bounty/gta6-01).

## Run Locally

```bash
node serve.ts --port 8080
```

Then open `http://localhost:8080` in desktop Chrome.

## Architecture & Highlights

- **Semantic Modular ES Architecture (Zero Build Step, 100% Offline)**:
  - `game/index.html` + `game/styles/hud.css` (GTA VI Ultra-Clean floating HUD with >82% unobstructed 3D viewport)
  - `game/src/main.js` — Bootstrap, `GameEngine` coordinator & main loop
  - `game/src/core/` — `config.js`, `camera-controls.js`, `audio.js`
  - `game/src/world/` — `textures.js`, `lighting-fx.js`, `city-world.js`
  - `game/src/entities/` — `vehicles.js`, `pedestrians.js`, `police-ai.js`
  - `game/src/gameplay/` — `combat.js`, `missions.js`, `garage-economy.js`
  - `game/src/ui/` — `hud.js`, `minimap.js`, `menus-save.js`
- **Next-Gen Coastal 3D Visuals**: Procedural `THREE.PMREMGenerator` environment reflection maps for Sunset, Night, and Midday; sculpted aerodynamic Corsair V12 & CBPD Interceptors with dark glossy glass cabins, A/B/C pillars, GT carbon rear wing, rear diffuser, dual chrome exhausts, slim LED taillight strips, and low-profile CBPD lightbars; dark wet-puddle asphalt that pops neon & taillight reflections.
- **Full 360° GTA Controls & Progression**: Auto Pointer Lock with smooth drag fallback, clamped pitch, scroll zoom, camera-relative on-foot WASD + over-the-shoulder aim, vehicle 360° orbit with 2.5s auto-recenter, `[F]` steal/enter, `[E]` Marina Garage & Bazaar Arms Dealer, `[ESC]` / `[M]` 7-tab Syndicate Dossier & World Map, and 3-slot `localStorage` saves.
