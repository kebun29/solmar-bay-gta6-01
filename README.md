# Coralina Bay: Sunset Syndicate

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/kebun29/solmar-bay-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/kebun29/solmar-bay-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original 100% offline 3D open-world crime game set in Coralina Bay — featuring 7 coastal districts, Art-Deco pastel beachfront boulevards, the Coralina Bay Suspension Bridge, three full time-of-day moods (Golden Sunset, Rain-Slicked Neon Night, and Turquoise Tropical Midday), free 360° GTA-style mouse-look controls, escalating 1–5 star CBPD pursuits, articulated on-foot combat in Mangrove Bazaar, interactive Marina Garage & Arms Dealer, Web Audio radio/SFX, and a 3-slot save system. Built for the [make.fun `gta6-01` bounty](https://make.fun/bounty/gta6-01).

## Run Locally

```bash
node serve.ts
```

Then open `http://localhost:8080` in your browser.

## Highlights

- **Clean Modular Native ES Architecture (16 Modules, Zero Build Step)**: Organized into focused single-responsibility modules under `game/src/` (`main.js`, `config.js`, `textures.js`, `city-world.js`, `lighting-fx.js`, `camera-controls.js`, `vehicles.js`, `pedestrians.js`, `police-ai.js`, `combat.js`, `missions.js`, `garage-economy.js`, `hud.js`, `minimap.js`, `menus-save.js`, `audio.js`).
- **Full 360° GTA-Style Mouse-Look & Driving Controls**: Automatic Pointer Lock on click with smooth drag fallback, clamped pitch (`-15°` to `+55°`), scroll-wheel zoom, camera-relative on-foot WASD + over-the-shoulder aiming, free 360° vehicle orbit with gentle 2.5s auto-recenter, and `[F]` steal/enter vehicle.
- **Stylized Next-Gen Coastal Visuals**: Sculpted beveled vehicles with sloped windshields, wheel arches, wing mirrors, multi-spoke rims + brake calipers, LED lightbars, procedural PBR cracked wet-puddle asphalt, Art-Deco stucco facades with balconies & rooftop AC, volumetric sunset sun halo & fire/smoke sprites, and slatted crates / hazard drums / corrugated stalls in Mangrove Bazaar.
- **Live Marina Garage, 7-Tab Syndicate Dossier & 3-Slot Saves**: Repair, respray (clear wanted), and twin-turbo upgrade at Marina Garage (`E`), full interactive world map & 3-slot `localStorage` saves (`ESC` / `M`), and offline Web Audio procedural SFX + 3 FM radio stations (`R`).
