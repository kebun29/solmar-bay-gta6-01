// CORALINA BAY: Sunset Syndicate packager for make.fun gta6-01 (Node 22, standard library only).
// Copies the offline Three.js open-world game (game/) and showcase captures (screenshots/) into
// the output directory and writes dossier.json via the vendored makefun-game helper.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const PROJECT_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function packageCoralinaBay() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  cpSync(join(PROJECT_ROOT, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });

  const shotsSrc = join(PROJECT_ROOT, 'screenshots');
  const shotsDest = join(OUTPUT_DIR, 'screenshots');
  mkdirSync(shotsDest, { recursive: true });
  if (existsSync(shotsSrc)) {
    cpSync(shotsSrc, shotsDest, { recursive: true });
  }

  const dossierJson = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierJson);
}

packageCoralinaBay();
