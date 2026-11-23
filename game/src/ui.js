import { DISTRICTS } from './world.js';
import { MISSIONS } from './gameplay.js';

const UNIT_SVGS = {
  heli: `<svg viewBox="0 0 18 18" width="13" height="13"><path d="M2 5h14M9 5v3M5 8h7l2 3H5l-2-2 2-1zm1 5h7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  boat: `<svg viewBox="0 0 18 18" width="13" height="13"><path d="M2 12l2 3h10l2-3H2zm3-4h6l2 4H5V8zm2-3h3v3H7V5z" fill="currentColor"/></svg>`,
  cruiser: `<svg viewBox="0 0 18 18" width="13" height="13"><rect x="2" y="7" width="14" height="6" rx="1.5" fill="currentColor"/><path d="M4 7l2-3h6l2 3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>`,
  foot: `<svg viewBox="0 0 18 18" width="13" height="13"><circle cx="9" cy="4.2" r="2.2" fill="currentColor"/><path d="M6 9l3-1.5L12 9v4l-1.5 3M7.5 13L6 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
};

const WEAPON_SVGS = [
  `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M7 11V7a1.5 1.5 0 013 0v3m0-3a1.5 1.5 0 013 0v3m0-2a1.5 1.5 0 013 0v3m0-1a1.5 1.5 0 013 0v4c0 3-2 5-5 5h-3c-3 0-5-2-5-5v-3a1.5 1.5 0 011-1z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M4 9h14l2 2h-6l-1 6H9l1-5H4V9z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M3 9h15v3h-4l-1 6h-3l1-6H7l-1 4H4l1-4H3V9zm15 1h3v1.5h-3V10z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M2 10h19v2.2h-8l-2 4.8H8l1.5-4.8H2V10z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="17" height="17"><path d="M2 10h17v2.4h-5l.8 5.2h-2.8l-.6-5.2H7l-1 3.6H3.8l.8-3.6H2V10zm17 .6h3v1.2h-3v-1.2zM9 7.8h5v1.6H9V7.8z" fill="currentColor"/></svg>`,
];

function portraitSvg(role) {
  const palette = {
    broker: { bg: '#271226', accent: '#fb7185', hair: '#1c1221', skin: '#dfa886', suit: '#4c1d3d' },
    netrunner: { bg: '#0c2334', accent: '#22d3ee', hair: '#0f172a', skin: '#e8c1a4', suit: '#0e7490' },
    tuner: { bg: '#2c180e', accent: '#fbbf24', hair: '#291a10', skin: '#d49a74', suit: '#9a3412' },
    fixer: { bg: '#161b33', accent: '#c084fc', hair: '#111827', skin: '#ca9068', suit: '#4c1d95' },
  }[role] || { bg: '#1e293b', accent: '#22d3ee', hair: '#111', skin: '#e0b18c', suit: '#334155' };

  return `<svg viewBox="0 0 48 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" fill="${palette.bg}"/>
    <circle cx="24" cy="46" r="17" fill="${palette.suit}"/>
    <rect x="20" y="25" width="8" height="7" rx="3" fill="${palette.skin}"/>
    <circle cx="24" cy="19" r="9.5" fill="${palette.skin}"/>
    <path d="M14 17c1-8 19-8 20 0-2-3-5-4-10-4s-8 1-10 4z" fill="${palette.hair}"/>
    <rect x="17" y="17.5" width="14" height="3.2" rx="1.4" fill="${palette.accent}" opacity="0.9"/>
    <path d="M19 23.5q5 2.2 10 0" stroke="#7c4a32" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

const TACTIC_COLORS = {
  SPOTLIGHT: '#fbbf24',
  OVERWATCH: '#f97316',
  'SEA PATROL': '#22d3ee',
  RAMMING: '#f43f5e',
  FIRING: '#ef4444',
  PINCHING: '#fb7185',
  BLOCKADE: '#f59e0b',
  FLANKING: '#eab308',
  'SWAT PUSH': '#f43f5e',
  'IN PURSUIT': '#38bdf8',
};

const PAUSE_TABS = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];

const CHECKLIST_ITEMS = [
  { label: 'Syndicate Contracts', cur: 9, max: 12 },
  { label: 'District Influence', cur: 5, max: 7 },
  { label: 'Boulevard Street Runs', cur: 5, max: 6 },
  { label: 'Crew Trust Missions', cur: 3, max: 3 },
  { label: 'Marina Drop Caches', cur: 16, max: 20 },
  { label: 'Bazaar Bounties', cur: 6, max: 8 },
  { label: 'Exotic Cars Boosted', cur: 8, max: 10 },
  { label: 'CBPD Blockades Broken', cur: 11, max: 12 },
  { label: 'Bay Bridge Jumps', cur: 8, max: 12 },
];

const MISSION_MEDALS = ['G', 'G', 'G', 'S', 'S', '-'];

export class UIController {
  constructor(gameplay, sound) {
    this.g = gameplay;
    this.sound = sound;

    this.hudEl = document.getElementById('hud');
    this.pauseEl = document.getElementById('pause-screen');
    this.startEl = document.getElementById('start-screen');
    this.statsViewEl = document.getElementById('pause-stats-view');
    this.tabViewEl = document.getElementById('pause-tab-view');
    this.shopModalEl = document.getElementById('shop-modal');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.worldMapCanvas = document.getElementById('world-map-canvas');
    this.worldMapCtx = this.worldMapCanvas.getContext('2d');
    this._renderedTabSig = '';
    this._renderedShopSig = '';

    this._bindEvents();
    this._renderStaticPauseParts();
  }

  _bindEvents() {
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.g.loadFromSlot(1);
    });
    document.getElementById('btn-newgame').addEventListener('click', () => {
      this.g.startNewOrContinue(true);
    });
    document.getElementById('btn-loadgame').addEventListener('click', () => {
      this.g.loadFromSlot(2);
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.g.mode = 'pause';
      this.g.pauseTab = 'SETTINGS';
      this._renderedTabSig = '';
      this.sound.playClick();
    });
    document.getElementById('shop-close-btn').addEventListener('click', () => {
      this.g.closeShop();
    });

    this.worldMapCanvas.addEventListener('click', (e) => {
      const rect = this.worldMapCanvas.getBoundingClientRect();
      const u = (e.clientX - rect.left) / rect.width;
      const v = (e.clientY - rect.top) / rect.height;
      const wx = -200 + u * 340;
      const wz = -180 + v * 360;
      this.g.waypoint = { x: wx, z: wz, label: 'CUSTOM WAYPOINT' };
      this.sound.playClick();
    });
  }

  _renderStaticPauseParts() {
    const listEl = document.getElementById('pause-checklist');
    listEl.innerHTML = CHECKLIST_ITEMS.map((item) => {
      const pct = Math.round((item.cur / item.max) * 100);
      return `<div class="check-row">
        <div class="check-top"><span>${item.label}</span><span class="check-val">${item.cur}/${item.max}</span></div>
        <div class="check-bar"><div class="check-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');

    const medalsEl = document.getElementById('pause-medals');
    medalsEl.innerHTML = MISSION_MEDALS.map((m) => {
      const cls = m === 'G' ? 'medal-g' : m === 'S' ? 'medal-s' : m === 'B' ? 'medal-b' : 'medal-none';
      return `<div class="medal ${cls}">${m}</div>`;
    }).join('');
  }

  cyclePauseTab(dir) {
    const idx = PAUSE_TABS.indexOf(this.g.pauseTab);
    this.g.pauseTab = PAUSE_TABS[(idx + dir + PAUSE_TABS.length) % PAUSE_TABS.length];
    this._renderedTabSig = '';
    this.sound.playClick();
    this.update();
  }

  update() {
    const mode = this.g.mode;
    this.hudEl.classList.toggle('hidden', mode !== 'play');
    this.pauseEl.classList.toggle('hidden', mode !== 'pause');
    this.startEl.classList.toggle('hidden', mode !== 'start');
    this.shopModalEl.classList.toggle('hidden', mode !== 'play' || !this.g.activeShop);

    if (mode === 'play') {
      this._updateInGameHUD();
      this._drawMinimap();
      if (this.g.activeShop) {
        this._updateShopModal();
      } else {
        this._renderedShopSig = '';
      }
    } else if (mode === 'pause') {
      this._updatePauseScreen();
      if (this.g.pauseTab === 'STATS' || this.g.pauseTab === 'MAP') {
        this._drawWorldMap();
      }
    } else if (mode === 'start') {
      this._updateStartSlots();
    }
  }

  _updateStartSlots() {
    const wrap = document.getElementById('start-slots');
    wrap.innerHTML = this.g.saves.map((s) => `
      <div class="start-slot-card ${s.occupied ? '' : 'empty'}" data-slot="${s.slot}" style="border-left-color:${s.accent}">
        <div class="slot-kicker">SLOT ${s.slot} · ${s.act}</div>
        <div class="slot-meta">${s.occupied ? `${s.district} · $${s.cash.toLocaleString()} · ${s.completion}%` : 'Start a new Coralina Bay syndicate file'}</div>
      </div>
    `).join('');
    wrap.querySelectorAll('.start-slot-card').forEach((el) => {
      el.onclick = () => {
        const slot = Number(el.dataset.slot);
        if (!this.g.loadFromSlot(slot)) this.g.startNewOrContinue(true);
      };
    });
  }

  _updateInGameHUD() {
    const g = this.g;
    const mission = g.getCurrentMission();
    const stage = g.getCurrentStage();
    const dist = g.getCurrentDistrict();

    // Top-Left Mission Card
    document.getElementById('hud-mission-head').textContent = `MISSION ${mission.num} · ${mission.title}`;
    document.getElementById('hud-stage-pill').textContent = `STAGE ${g.stageIdx + 1}/${mission.stages.length}`;
    document.getElementById('hud-stage-title').textContent = stage.title;
    document.getElementById('hud-stage-obj').textContent = stage.obj;
    document.getElementById('hud-stage-next').textContent = stage.next;

    const segWrap = document.getElementById('hud-mission-segs');
    segWrap.innerHTML = mission.stages.map((_, i) => {
      const cls = i < g.stageIdx ? 'seg done' : i === g.stageIdx ? 'seg active' : 'seg';
      return `<div class="${cls}"></div>`;
    }).join('');

    // Mid-Left CBPD Dispatch Card
    const units = g.getActivePoliceUnits();
    const policeCard = document.getElementById('hud-police-card');
    policeCard.classList.toggle('hidden', g.wantedStars <= 0);
    document.getElementById('hud-police-count').textContent = `${g.activeUnitCount || units.length} UNITS`;
    document.getElementById('hud-police-rows').innerHTML = units.map((u) => {
      const tagCol = TACTIC_COLORS[u.tactic] || '#22d3ee';
      return `<div class="unit-row">
        <span class="unit-icon" style="color:${u.color}">${UNIT_SVGS[u.type] || UNIT_SVGS.cruiser}</span>
        <span class="unit-call">${u.callsign}</span>
        <span class="unit-tag" style="color:${tagCol};border-color:${tagCol}66;background:${tagCol}22">${u.tactic}</span>
        <span class="unit-dist">${u.dist} m</span>
      </div>`;
    }).join('');
    document.getElementById('hud-dispatch').textContent = g.dispatchLine;

    // Bottom-Left District + Standing + Tip + Health/Armour
    document.getElementById('hud-district-name').textContent = dist.name;
    document.getElementById('hud-district-sub').textContent = dist.subtitle;
    document.getElementById('hud-standing-text').textContent = `${dist.status} · ${dist.standing}`;
    document.getElementById('hud-standing-fill').style.width = `${dist.standing}%`;
    const tipEl = document.getElementById('hud-context-tip');
    if (g.shotMode) {
      tipEl.classList.toggle('hidden', g.inVehicle);
      tipEl.textContent = 'USE STALLS FOR HARD COVER';
    } else {
      tipEl.classList.remove('hidden');
      if (!g.inVehicle) {
        tipEl.textContent = g.nearbyVehicle
          ? `PRESS [F] TO HIJACK ${g.nearbyVehicle.name}`
          : 'DRAG MOUSE 360° · WASD MOVE';
      } else {
        tipEl.textContent = 'DRAG MOUSE 360° · [SHIFT] NITRO · [F] EXIT';
      }
    }

    document.getElementById('hud-hp-fill').style.width = `${Math.max(0, Math.min(100, g.health))}%`;
    document.getElementById('hud-hp-val').textContent = Math.round(g.health);
    document.getElementById('hud-ar-fill').style.width = `${Math.max(0, Math.min(100, g.armour))}%`;
    document.getElementById('hud-ar-val').textContent = Math.round(g.armour);

    // Bottom-Center Interactive World Prompt & Dialogue Card
    const promptEl = document.getElementById('hud-interact-prompt');
    if (promptEl) {
      const showPrompt = !g.shotMode && !g.activeShop && !!g.nearbyLocation;
      promptEl.classList.toggle('hidden', !showPrompt);
      if (showPrompt) {
        promptEl.textContent = `PRESS [E] · ${g.nearbyLocation.name} (${g.nearbyLocation.subtitle})`;
      }
    }
    const dlgEl = document.getElementById('hud-dialogue');
    dlgEl.classList.toggle('hidden', !g.dialogue || g.dialogue.timer <= 0);
    if (g.dialogue) {
      document.getElementById('hud-dlg-portrait').innerHTML = portraitSvg(g.dialogue.role);
      document.getElementById('hud-dlg-speaker').textContent = g.dialogue.speaker;
      document.getElementById('hud-dlg-text').textContent = g.dialogue.text;
    }

    // Top-Right Clock, Cash, Wanted Stars, Alert, Rank
    document.getElementById('hud-clock').textContent = g.clockText;
    document.getElementById('hud-cash').textContent = `$${Math.round(g.cash).toLocaleString()}`;
    const starsEl = document.getElementById('hud-stars');
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      starsHtml += `<span class="star ${i < g.wantedStars ? 'lit' : ''}">★</span>`;
    }
    starsEl.innerHTML = starsHtml;
    const alertEl = document.getElementById('hud-alert');
    alertEl.textContent = g.wantedStars >= 4 ? 'CBPD AIR SUPPORT' : g.wantedStars > 0 ? 'UNITS CLOSING IN' : 'BAY CLEAR';
    alertEl.className = `hud-alert ${g.wantedStars >= 4 ? 'danger' : g.wantedStars > 0 ? 'warn' : 'clear'}`;

    document.getElementById('hud-rank-pill').textContent = `RANK ${g.rank}`;
    document.getElementById('hud-rank-title').textContent = g.rankTitle;
    document.getElementById('hud-rp-fill').style.width = `${Math.min(100, (g.rp / g.rpNext) * 100)}%`;
    document.getElementById('hud-rp-text').textContent = `${g.rp.toLocaleString()} / ${g.rpNext.toLocaleString()} RP`;

    // Mid-Right 5-slot Weapon Bar
    const wBar = document.getElementById('hud-weapon-bar');
    wBar.innerHTML = g.weapons.map((w, idx) => `
      <div class="w-slot ${idx === g.activeWeapon ? 'active' : ''}">
        <span class="w-key">${w.key}</span>
        <span class="w-icon">${WEAPON_SVGS[idx]}</span>
        <span class="w-ammo">${w.ammo}</span>
      </div>
    `).join('');

    // Mid-Right Crew Ability Cards
    const roles = ['netrunner', 'tuner', 'fixer'];
    const cWrap = document.getElementById('hud-crew-cards');
    cWrap.innerHTML = g.crew.map((ab, idx) => {
      const cooling = ab.cd > 0.1;
      return `<div class="crew-card ${cooling ? 'cooling' : ''}">
        <div class="crew-portrait">
          ${portraitSvg(roles[idx])}
          <span class="crew-key">${ab.key}</span>
          ${cooling ? `<span class="crew-cd">${Math.ceil(ab.cd)}</span>` : ''}
        </div>
        <div class="crew-info">
          <div class="crew-name">${ab.name}</div>
          <div class="crew-role">${ab.crew}</div>
        </div>
      </div>`;
    }).join('');

    // Bottom-Right Driving Speedometer
    const speedCard = document.getElementById('hud-speed-card');
    speedCard.classList.toggle('hidden', !g.inVehicle);
    if (g.inVehicle && g.currentVehicle) {
      const kmh = Math.round(Math.abs(g.currentVehicle.speed) * 3.6);
      const integrity = Math.max(0, 100 - Math.round(g.currentVehicle.damagePct));
      const dmgLabel = integrity >= 75 ? 'INTACT' : integrity >= 45 ? 'SCUFFED' : 'CRITICAL';
      const st = this.sound.getStation();
      document.getElementById('hud-speed-val').textContent = kmh;
      document.getElementById('hud-veh-name').textContent = g.currentVehicle.name;
      const dmgEl = document.getElementById('hud-veh-dmg');
      dmgEl.textContent = `${integrity}% ${dmgLabel}`;
      dmgEl.style.color = integrity >= 75 ? '#34d399' : integrity >= 45 ? '#fbbf24' : '#f43f5e';
      document.getElementById('hud-radio').textContent = `${st.freq} · ${st.name} · ${st.genre}`;
    }
  }

  _drawMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const rad = w / 2 - 1;
    const pPos = this.g.getPlayerPos();
    const heading = this.g.getPlayerHeading();
    const scale = 1.02;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    // Circular radar clip
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.clip();

    // Base radar fill
    ctx.fillStyle = '#091423';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(heading - Math.PI);

    const toLocal = (wx, wz) => [(wx - pPos.x) * scale, (wz - pPos.z) * scale];

    // Ocean east of x=34
    const [ox] = toLocal(34, pPos.z);
    ctx.fillStyle = '#0a4866';
    ctx.fillRect(ox, -300, 300, 600);

    // Golden beach strip
    const [bx] = toLocal(17, pPos.z);
    ctx.fillStyle = '#735e40';
    ctx.fillRect(bx, -300, 17 * scale, 600);

    // Coastal Marina Boulevard
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10;
    const [rx0] = toLocal(0, 0);
    ctx.beginPath();
    ctx.moveTo(rx0, -280);
    ctx.lineTo(rx0, 280);
    ctx.stroke();

    // Cross avenues
    ctx.lineWidth = 5.5;
    [-110, -35, 45, 125].forEach((rz) => {
      const [x1, y1] = toLocal(-140, rz);
      const [x2, y2] = toLocal(10, rz);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Bay Suspension Bridge span north
    const [brx1, bry1] = toLocal(0, -145);
    const [brx2, bry2] = toLocal(135, -185);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(brx1, bry1);
    ctx.lineTo(brx2, bry2);
    ctx.stroke();

    // GPS route line
    const stage = this.g.getCurrentStage();
    if (stage && stage.target) {
      const [tx, ty] = toLocal(stage.target.x, stage.target.z);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx0, ty);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police cruiser blips
    for (const v of this.g.vehicles) {
      if (v.type !== 'police') continue;
      const [vx, vy] = toLocal(v.mesh.position.x, v.mesh.position.z);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(vx, vy, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    // On-foot officer blips
    for (const c of this.g.cops) {
      if (c.downed) continue;
      const [vx, vy] = toLocal(c.char.mesh.position.x, c.char.mesh.position.z);
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(vx, vy, 3.0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Subtle concentric radar sweep rings
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Player center chevron
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4.8, cy + 4.8);
    ctx.lineTo(cx, cy + 2.2);
    ctx.lineTo(cx - 4.8, cy + 4.8);
    ctx.closePath();
    ctx.fill();

    // Rotating compass N pill on circular rim
    const nAng = heading - Math.PI - Math.PI / 2;
    const nx = cx + Math.cos(nAng) * (rad - 11);
    const ny = cy + Math.sin(nAng) * (rad - 11);
    ctx.fillStyle = '#09111e';
    ctx.beginPath();
    ctx.arc(nx, ny, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 8.5px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny + 0.5);

    ctx.restore();
  }

  _updatePauseScreen() {
    const g = this.g;
    document.getElementById('pause-cash').textContent = `$${Math.round(g.cash).toLocaleString()}`;

    const tabsEl = document.getElementById('pause-tabs');
    if (tabsEl.dataset.activeTab !== g.pauseTab) {
      tabsEl.dataset.activeTab = g.pauseTab;
      tabsEl.innerHTML = PAUSE_TABS.map((t) =>
        `<button class="p-tab ${t === g.pauseTab ? 'active' : ''}" data-tab="${t}">${t}</button>`
      ).join('');
      tabsEl.querySelectorAll('.p-tab').forEach((btn) => {
        btn.onclick = () => {
          g.pauseTab = btn.dataset.tab;
          this._renderedTabSig = '';
          this.sound.playClick();
          this.update();
        };
      });
    }

    const isStats = g.pauseTab === 'STATS';
    this.statsViewEl.classList.toggle('hidden', !isStats);
    this.tabViewEl.classList.toggle('hidden', isStats);

    if (isStats) {
      document.getElementById('pause-rank-title').textContent = `RANK ${g.rank} · ${g.rankTitle}`;
      document.getElementById('pause-rank-rp').textContent = `${g.rp.toLocaleString()} / ${g.rpNext.toLocaleString()} RP`;
      document.getElementById('pause-rank-fill').style.width = `${Math.min(100, (g.rp / g.rpNext) * 100)}%`;

      const c = g.career;
      const metrics = [
        ['Contracts Cleared', c.missionsCleared],
        ['Pursuits Escaped', c.pursuitsEscaped],
        ['Top Speed', `${c.topSpeedKmh} km/h`],
        ['Takedowns', c.takedowns],
        ['Cars Boosted', c.vehiclesBoosted],
        ['Allied Districts', `${c.districtsFriendly} / 7`],
        ['Crew Assists', c.crewAssists],
        ['Time Played', c.playTime],
      ];
      document.getElementById('pause-career-grid').innerHTML = metrics.map(([k, v]) => `
        <div class="career-cell"><div class="career-k">${k}</div><div class="career-v">${v}</div></div>
      `).join('');

      const slotsEl = document.getElementById('pause-save-slots');
      slotsEl.innerHTML = g.saves.map((s) => `
        <div class="save-row">
          <div class="save-info">
            <div class="save-t">SLOT ${s.slot} · ${s.occupied ? s.district : 'EMPTY'}</div>
            <div class="save-s">${s.occupied ? `$${s.cash.toLocaleString()} · ${s.time}` : 'Available slot'}</div>
          </div>
          <button class="save-btn" data-save="${s.slot}">SAVE</button>
        </div>
      `).join('');
      slotsEl.querySelectorAll('.save-btn').forEach((btn) => {
        btn.onclick = () => g.saveToSlot(Number(btn.dataset.save));
      });

      document.getElementById('map-waypoint-pill').textContent = `WAYPOINT · ${g.waypoint.label}`;
    } else {
      const sig = `${g.pauseTab}:${Math.round(g.cash)}:${g.crew.map((x) => x.level).join(',')}:${g.saves.map((s) => (s.occupied ? s.time : '0')).join(',')}:${g.settings.graphics}:${g.settings.timeOfDay}:${g.settings.cameraFov}:${this.sound.muted}`;
      if (this._renderedTabSig !== sig) {
        this._renderedTabSig = sig;
        this._renderPauseTabContent(g.pauseTab);
      }
    }
  }

  _renderPauseTabContent(tab) {
    const g = this.g;
    const view = this.tabViewEl;

    if (tab === 'MAP') {
      view.innerHTML = `
        <div class="panel-title">CORALINA BAY INTERACTIVE GPS &amp; DISTRICTS</div>
        <div class="tab-grid-2" style="flex:1;">
          <div class="dossier-card">
            <div class="dossier-title">FAST-WAYPOINT DESTINATIONS</div>
            <div class="dossier-sub">Click any district or interactive shop to lock GPS navigation on your radar.</div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:4px;">
              ${DISTRICTS.map((d) => `
                <div class="setting-row" style="padding:6px 10px;">
                  <div>
                    <div style="font-size:11px;font-weight:900;color:${d.color}">${d.name}</div>
                    <div style="font-size:9.5px;color:#94a3b8">${d.subtitle} · ${d.status} (${d.standing})</div>
                  </div>
                  <button class="action-btn cyan" data-wp-x="${(d.bounds.xMin + d.bounds.xMax) / 2}" data-wp-z="${(d.bounds.zMin + d.bounds.zMax) / 2}" data-wp-label="${d.name}">SET GPS</button>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="dossier-card">
            <div class="dossier-title">INTERACTIVE WORLD LOCATIONS [PRESS E]</div>
            <div class="dossier-sub">Drive or walk into glowing neon rings in Coralina Bay and press E to access syndicate services.</div>
            <div class="setting-row">
              <div>
                <div style="font-size:11.5px;font-weight:900;color:#22d3ee">MARINA GARAGE</div>
                <div style="font-size:10px;color:#94a3b8">Marina Boulevard · Repair ($500), Body Paint ($750), Turbo Boost ($2,500)</div>
              </div>
              <button class="action-btn cyan" data-wp-x="-11.4" data-wp-z="10" data-wp-label="MARINA GARAGE">ROUTE</button>
            </div>
            <div class="setting-row">
              <div>
                <div style="font-size:11.5px;font-weight:900;color:#fb7185">BAZAAR ARMS DEALER</div>
                <div style="font-size:10px;color:#94a3b8">Mangrove Bazaar · Full Ammo ($600), Titanium Armor ($800), Medkit ($400)</div>
              </div>
              <button class="action-btn" data-wp-x="-36.5" data-wp-z="73.5" data-wp-label="BAZAAR ARMS DEALER">ROUTE</button>
            </div>
            <div class="dossier-sub" style="margin-top:auto;">Active Waypoint: <strong style="color:#fbbf24">${g.waypoint.label}</strong></div>
          </div>
        </div>`;
      view.querySelectorAll('[data-wp-label]').forEach((btn) => {
        btn.onclick = () => {
          g.waypoint = { x: Number(btn.dataset.wpX), z: Number(btn.dataset.wpZ), label: btn.dataset.wpLabel };
          this._renderedTabSig = '';
          this.sound.playClick();
        };
      });
    } else if (tab === 'STORY') {
      view.innerHTML = `
        <div class="panel-title">SYNDICATE STORY CONTRACTS · REPLAY &amp; BRIEFINGS</div>
        <div class="tab-grid-3">
          ${MISSIONS.map((m, idx) => `
            <div class="dossier-card">
              <div class="dossier-head">
                <span class="stage-pill">MISSION ${m.num}</span>
                <span style="font-size:10px;font-weight:800;color:${idx === g.missionIdx ? '#34d399' : '#94a3b8'}">${idx === g.missionIdx ? 'ACTIVE' : 'UNLOCKED'}</span>
              </div>
              <div class="dossier-title">${m.title}</div>
              <div style="display:flex;flex-direction:column;gap:4px;margin:4px 0;">
                ${m.stages.map((st, sIdx) => `
                  <div style="font-size:10px;color:#cbd5e1;"><strong style="color:#fbbf24">${sIdx + 1}.</strong> ${st.title}</div>
                `).join('')}
              </div>
              <div style="margin-top:auto;padding-top:6px;">
                <button class="action-btn" style="width:100%" data-replay="${idx}">REPLAY MISSION</button>
              </div>
            </div>
          `).join('')}
        </div>`;
      view.querySelectorAll('[data-replay]').forEach((btn) => {
        btn.onclick = () => g.replayMission(Number(btn.dataset.replay));
      });
    } else if (tab === 'CREW') {
      view.innerHTML = `
        <div class="panel-title">SYNDICATE CREW ROSTER &amp; ABILITY UPGRADES</div>
        <div class="tab-grid-3">
          ${g.crew.map((ab, idx) => {
            const maxed = ab.level >= ab.maxLevel;
            const canAfford = g.cash >= ab.upgradeCost;
            return `<div class="dossier-card">
              <div class="dossier-head">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div class="crew-portrait" style="width:42px;height:42px;">${portraitSvg(ab.role || 'netrunner')}</div>
                  <div>
                    <div class="dossier-title">${ab.crew.split(' · ')[0]}</div>
                    <div style="font-size:10px;color:${ab.accent};font-weight:800;">${ab.name} [${ab.key}]</div>
                  </div>
                </div>
                <span class="rank-pill">LVL ${ab.level}/${ab.maxLevel}</span>
              </div>
              <div class="dossier-sub">${ab.bio || ''}</div>
              <div style="font-size:10.5px;color:#cbd5e1;">Cooldown: <strong style="color:#fbbf24">${ab.maxCd}s</strong></div>
              <button class="action-btn" style="margin-top:auto;" data-upgrade="${idx}" ${maxed || !canAfford ? 'disabled' : ''}>
                ${maxed ? 'MAX LEVEL' : `UPGRADE ($${ab.upgradeCost.toLocaleString()})`}
              </button>
            </div>`;
          }).join('')}
        </div>`;
      view.querySelectorAll('[data-upgrade]').forEach((btn) => {
        btn.onclick = () => {
          if (g.upgradeCrew(Number(btn.dataset.upgrade))) this._renderedTabSig = '';
        };
      });
    } else if (tab === 'SETTINGS') {
      view.innerHTML = `
        <div class="panel-title">AUDIO, GRAPHICS &amp; CAMERA SETTINGS</div>
        <div class="tab-grid-2">
          <div class="dossier-card">
            <div class="dossier-title">AUDIO MIXER</div>
            <div class="setting-row">
              <span>Master Audio</span>
              <button id="set-mute-btn" class="action-btn cyan">${this.sound.muted ? 'MUTED' : 'ENABLED'}</button>
            </div>
            <div class="setting-row">
              <span>Master Volume (${Math.round(this.sound.masterVol * 100)}%)</span>
              <input id="set-master-vol" type="range" min="0" max="100" value="${Math.round(this.sound.masterVol * 100)}" />
            </div>
            <div class="setting-row">
              <span>Radio Volume (${Math.round(this.sound.musicVol * 100)}%)</span>
              <input id="set-music-vol" type="range" min="0" max="100" value="${Math.round(this.sound.musicVol * 100)}" />
            </div>
            <div class="setting-row">
              <span>SFX Volume (${Math.round(this.sound.sfxVol * 100)}%)</span>
              <input id="set-sfx-vol" type="range" min="0" max="100" value="${Math.round(this.sound.sfxVol * 100)}" />
            </div>
          </div>
          <div class="dossier-card">
            <div class="dossier-title">DISPLAY &amp; CAMERA</div>
            <div class="setting-row">
              <span>Graphics Quality</span>
              <div style="display:flex;gap:6px;">
                ${['LOW', 'MEDIUM', 'HIGH'].map((q) => `
                  <button class="action-btn ${g.settings.graphics === q ? '' : 'cyan'}" data-gfx="${q}">${q}</button>
                `).join('')}
              </div>
            </div>
            <div class="setting-row">
              <span>Camera FOV (${g.settings.cameraFov}°)</span>
              <input id="set-fov" type="range" min="48" max="74" value="${g.settings.cameraFov}" />
            </div>
            <div class="setting-row">
              <span>Atmosphere / Time</span>
              <div style="display:flex;gap:6px;">
                <button class="action-btn ${g.settings.timeOfDay === 'sunset' ? '' : 'cyan'}" data-tod="sunset">SUNSET</button>
                <button class="action-btn ${g.settings.timeOfDay === 'night' ? '' : 'cyan'}" data-tod="night">NIGHT</button>
              </div>
            </div>
          </div>
        </div>`;
      view.querySelector('#set-mute-btn').onclick = () => {
        this.sound.setMuted(!this.sound.muted);
        this._renderedTabSig = '';
      };
      view.querySelector('#set-master-vol').oninput = (e) => this.sound.setMasterVolume(Number(e.target.value) / 100);
      view.querySelector('#set-music-vol').oninput = (e) => this.sound.setMusicVolume(Number(e.target.value) / 100);
      view.querySelector('#set-sfx-vol').oninput = (e) => this.sound.setSfxVolume(Number(e.target.value) / 100);
      view.querySelector('#set-fov').oninput = (e) => g.applySettings({ cameraFov: Number(e.target.value) });
      view.querySelectorAll('[data-gfx]').forEach((b) => {
        b.onclick = () => { g.applySettings({ graphics: b.dataset.gfx }); this._renderedTabSig = ''; };
      });
      view.querySelectorAll('[data-tod]').forEach((b) => {
        b.onclick = () => { g.applySettings({ timeOfDay: b.dataset.tod }); this._renderedTabSig = ''; };
      });
    } else if (tab === 'CONTROLS') {
      const binds = [
        ['W / A / S / D', 'Drive Vehicle / Move On-Foot'],
        ['SHIFT', 'Sprint / Nitro Boost (with Turbo)'],
        ['SPACE', 'Handbrake Drift / Fire Weapon'],
        ['LEFT CLICK', 'Fire Equipped Weapon'],
        ['F', 'Enter / Exit Nearest Vehicle'],
        ['E', 'Interact (Marina Garage / Arms Dealer)'],
        ['1 – 5', 'Select Weapon Slot (Brawl, 9mm, SMG, 12G, AR)'],
        ['Z / X / C', 'Trigger Crew Abilities (Blackout, Nitro, Flare)'],
        ['R', 'Cycle Coralina Bay Radio Station'],
        ['CTRL', 'Crouch / Hard Cover'],
        ['ESC / M', 'Open Pause Dossier & World Map'],
        ['Q / E (Pause)', 'Switch Between All 7 Dossier Tabs'],
      ];
      view.innerHTML = `
        <div class="panel-title">KEYBOARD &amp; MOUSE CONTROLS</div>
        <div class="tab-grid-2">
          ${binds.map(([k, desc]) => `
            <div class="setting-row">
              <span class="key-badge">${k}</span>
              <span style="font-size:11px;color:#e2e8f0;">${desc}</span>
            </div>
          `).join('')}
        </div>`;
    } else if (tab === 'SAVE') {
      view.innerHTML = `
        <div class="panel-title">LOCAL SAVE MANAGER (3 SLOTS · OFFLINE STORAGE)</div>
        <div class="tab-grid-3">
          ${g.saves.map((s) => `
            <div class="dossier-card" style="border-top:3px solid ${s.accent}">
              <div class="dossier-title">SLOT ${s.slot} · ${s.occupied ? s.act : 'EMPTY SLOT'}</div>
              <div class="dossier-sub">
                ${s.occupied ? `${s.district} · $${s.cash.toLocaleString()} · Rank ${s.rank} · ${s.time}` : 'No saved syndicate progress in this slot.'}
              </div>
              <div style="display:flex;gap:6px;margin-top:auto;padding-top:8px;">
                <button class="action-btn cyan" style="flex:1" data-slot-save="${s.slot}">SAVE</button>
                <button class="action-btn" style="flex:1" data-slot-load="${s.slot}" ${s.occupied ? '' : 'disabled'}>LOAD</button>
                <button class="action-btn danger" data-slot-del="${s.slot}" ${s.occupied ? '' : 'disabled'}>DEL</button>
              </div>
            </div>
          `).join('')}
        </div>`;
      view.querySelectorAll('[data-slot-save]').forEach((b) => {
        b.onclick = () => { g.saveToSlot(Number(b.dataset.slotSave)); this._renderedTabSig = ''; };
      });
      view.querySelectorAll('[data-slot-load]').forEach((b) => {
        b.onclick = () => { g.loadFromSlot(Number(b.dataset.slotLoad)); };
      });
      view.querySelectorAll('[data-slot-del]').forEach((b) => {
        b.onclick = () => { g.deleteSlot(Number(b.dataset.slotDel)); this._renderedTabSig = ''; };
      });
    }
  }

  _updateShopModal() {
    const g = this.g;
    const sig = `${g.activeShop}:${Math.round(g.cash)}:${Math.round(g.health)}:${Math.round(g.armour)}:${g.turboInstalled}:${Math.round(g.heroVehicle.damagePct)}`;
    if (this._renderedShopSig === sig) return;
    this._renderedShopSig = sig;

    document.getElementById('shop-cash').textContent = `$${Math.round(g.cash).toLocaleString()}`;
    const body = document.getElementById('shop-body');

    if (g.activeShop === 'garage') {
      document.getElementById('shop-title').textContent = 'MARINA GARAGE';
      document.getElementById('shop-sub').textContent = 'Coralina Bay Custom Tuning & Bodywork';
      const swatches = [
        { name: 'Coral Red', hex: 0xe11d48, css: '#e11d48' },
        { name: 'Sunset Gold', hex: 0xf59e0b, css: '#f59e0b' },
        { name: 'Electric Cyan', hex: 0x06b6d4, css: '#06b6d4' },
        { name: 'Midnight Violet', hex: 0x7c3aed, css: '#7c3aed' },
        { name: 'Pearl White', hex: 0xf1f5f9, css: '#f1f5f9' },
      ];
      body.innerHTML = `
        <div class="setting-row">
          <div>
            <div style="font-size:11.5px;font-weight:800;">Full Chassis Repair (${Math.max(0, 100 - Math.round(g.heroVehicle.damagePct))}% Intact)</div>
            <div style="font-size:10px;color:#94a3b8;">Restore vehicle hull integrity to 100%</div>
          </div>
          <button id="buy-repair" class="action-btn cyan" ${g.cash < 500 || g.heroVehicle.damagePct <= 0 ? 'disabled' : ''}>REPAIR $500</button>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;">
          <div style="font-size:11.5px;font-weight:800;">Respray Body Paint ($750)</div>
          <div class="swatch-row">
            ${swatches.map((sw) => `<button class="swatch-btn" title="${sw.name}" data-paint="${sw.hex}" style="background:${sw.css}"></button>`).join('')}
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div style="font-size:11.5px;font-weight:800;">Twin-Stage Turbo Boost</div>
            <div style="font-size:10px;color:#94a3b8;">Increases top speed &amp; unlocks nitro afterburners</div>
          </div>
          <button id="buy-turbo" class="action-btn" ${g.turboInstalled || g.cash < 2500 ? 'disabled' : ''}>${g.turboInstalled ? 'INSTALLED' : 'INSTALL $2,500'}</button>
        </div>`;
      body.querySelector('#buy-repair').onclick = () => g.buyGarageService('repair');
      body.querySelector('#buy-turbo').onclick = () => g.buyGarageService('turbo');
      body.querySelectorAll('[data-paint]').forEach((b) => {
        b.onclick = () => g.buyGarageService('paint', Number(b.dataset.paint));
      });
    } else if (g.activeShop === 'arms') {
      document.getElementById('shop-title').textContent = 'BAZAAR ARMS DEALER';
      document.getElementById('shop-sub').textContent = 'Mangrove Bazaar Black-Market Outfitter';
      body.innerHTML = `
        <div class="setting-row">
          <div>
            <div style="font-size:11.5px;font-weight:800;">Refill All Weapon Ammo</div>
            <div style="font-size:10px;color:#94a3b8;">Top off 9mm, Viper SMG, Tidal 12G &amp; Syndicate AR</div>
          </div>
          <button id="buy-ammo" class="action-btn cyan" ${g.cash < 600 ? 'disabled' : ''}>BUY $600</button>
        </div>
        <div class="setting-row">
          <div>
            <div style="font-size:11.5px;font-weight:800;">Titanium Body Armor (${Math.round(g.armour)}%)</div>
            <div style="font-size:10px;color:#94a3b8;">Refill ballistic vest armor to 100%</div>
          </div>
          <button id="buy-armor" class="action-btn" ${g.cash < 800 || g.armour >= 100 ? 'disabled' : ''}>BUY $800</button>
        </div>
        <div class="setting-row">
          <div>
            <div style="font-size:11.5px;font-weight:800;">Trauma Medkit (${Math.round(g.health)}% HP)</div>
            <div style="font-size:10px;color:#94a3b8;">Restore health to 100%</div>
          </div>
          <button id="buy-medkit" class="action-btn cyan" ${g.cash < 400 || g.health >= 100 ? 'disabled' : ''}>BUY $400</button>
        </div>`;
      body.querySelector('#buy-ammo').onclick = () => g.buyArmsService('ammo');
      body.querySelector('#buy-armor').onclick = () => g.buyArmsService('armor');
      body.querySelector('#buy-medkit').onclick = () => g.buyArmsService('medkit');
    }
  }

  // Organic coastal peninsula & island archipelago map with Bay Suspension Bridge
  _drawWorldMap() {
    const ctx = this.worldMapCtx;
    const w = this.worldMapCanvas.width;
    const h = this.worldMapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep tropical ocean bathymetry gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
    oceanGrad.addColorStop(0, '#041a2c');
    oceanGrad.addColorStop(0.55, '#072f49');
    oceanGrad.addColorStop(1, '#0b4560');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle nautical lat/lon grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 40; y < h; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Helper for smooth closed organic curves (midpoint quadratic smoothing)
    const traceSmoothClosed = (pts) => {
      ctx.beginPath();
      const n = pts.length;
      const startX = (pts[n - 1][0] + pts[0][0]) / 2;
      const startY = (pts[n - 1][1] + pts[0][1]) / 2;
      ctx.moveTo(startX, startY);
      for (let i = 0; i < n; i++) {
        const cur = pts[i];
        const next = pts[(i + 1) % n];
        const mx = (cur[0] + next[0]) / 2;
        const my = (cur[1] + next[1]) / 2;
        ctx.quadraticCurveTo(cur[0], cur[1], mx, my);
      }
      ctx.closePath();
    };

    // Main Coralina Peninsula silhouette (organic coves, headlands & harbor mouth)
    const peninsulaPts = [
      [34, 52], [95, 22], [185, 18], [285, 26], [358, 42],
      [392, 82], [386, 134], [404, 184], [418, 232], [402, 278],
      [388, 326], [362, 372], [295, 396], [202, 392], [124, 384],
      [56, 362], [24, 304], [28, 220], [18, 132],
    ];

    // Isla Dorada organic barrier island across Coralina Bay
    const islandPts = [
      [464, 86], [506, 74], [536, 114], [542, 178],
      [528, 248], [496, 286], [462, 268], [452, 206], [458, 138],
    ];

    // Small southern tropical cay
    const cayPts = [
      [458, 324], [492, 316], [506, 344], [486, 368], [452, 354],
    ];

    // Turquoise shallow-water shelf halos around landmasses
    const drawShelf = (pts, padColor, lineW) => {
      traceSmoothClosed(pts);
      ctx.strokeStyle = padColor;
      ctx.lineWidth = lineW;
      ctx.stroke();
    };
    drawShelf(peninsulaPts, 'rgba(34, 211, 238, 0.14)', 26);
    drawShelf(peninsulaPts, 'rgba(56, 189, 248, 0.22)', 12);
    drawShelf(islandPts, 'rgba(34, 211, 238, 0.15)', 22);
    drawShelf(islandPts, 'rgba(56, 189, 248, 0.24)', 10);
    drawShelf(cayPts, 'rgba(34, 211, 238, 0.14)', 14);

    // Fill peninsula base land + golden beach rim
    traceSmoothClosed(peninsulaPts);
    ctx.fillStyle = '#111d2e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 201, 139, 0.65)';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Clip organic district regions inside peninsula
    ctx.save();
    traceSmoothClosed(peninsulaPts);
    ctx.clip();

    const mainlandDistricts = [
      {
        name: 'HIBISCUS HEIGHTS', color: '#c084fc', lx: 102, ly: 78,
        pts: [[10, 10], [176, 10], [184, 108], [168, 176], [10, 184]],
      },
      {
        name: 'AZURA DOWNTOWN', color: '#38bdf8', lx: 244, ly: 80,
        pts: [[176, 10], [320, 10], [312, 174], [168, 176], [184, 108]],
      },
      {
        name: 'MARINA BOULEVARD', color: '#fb7185', lx: 356, ly: 132,
        pts: [[320, 10], [435, 10], [435, 238], [318, 234], [312, 174]],
      },
      {
        name: 'VERDANT INDUSTRIAL', color: '#facc15', lx: 98, ly: 326,
        pts: [[10, 184], [168, 176], [178, 398], [10, 398]],
      },
      {
        name: 'MANGROVE BAZAAR', color: '#f59e0b', lx: 242, ly: 288,
        pts: [[168, 176], [312, 174], [318, 234], [312, 322], [174, 326]],
      },
      {
        name: 'PELICAN HARBOR', color: '#14b8a6', lx: 318, ly: 358,
        pts: [[318, 234], [435, 238], [420, 405], [174, 405], [174, 326], [312, 322]],
      },
    ];

    for (const d of mainlandDistricts) {
      ctx.beginPath();
      d.pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = d.color + '30';
      ctx.fill();
      ctx.strokeStyle = d.color + '99';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Smooth curved road network inside peninsula
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.48)';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Coastal Marina Boulevard curving north to bridge approach
    ctx.moveTo(318, 380);
    ctx.quadraticCurveTo(324, 240, 322, 145);
    ctx.quadraticCurveTo(320, 88, 376, 78);
    // Inland expressway
    ctx.moveTo(174, 32);
    ctx.quadraticCurveTo(182, 176, 174, 378);
    // Mid-peninsula cross highway
    ctx.moveTo(30, 180);
    ctx.quadraticCurveTo(190, 172, 398, 178);
    // Southern harbor road
    ctx.moveTo(174, 324);
    ctx.quadraticCurveTo(285, 320, 384, 322);
    ctx.stroke();
    ctx.restore();

    // Draw Isla Dorada island & southern cay
    traceSmoothClosed(islandPts);
    ctx.fillStyle = '#2d1629';
    ctx.fill();
    ctx.fillStyle = 'rgba(244, 63, 94, 0.24)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 201, 139, 0.72)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    traceSmoothClosed(cayPts);
    ctx.fillStyle = '#15323b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(236, 201, 139, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // === GRAND CORALINA BAY SUSPENSION BRIDGE (Northern Bay Span) ===
    // Bridge roadway glow
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(368, 84);
    ctx.quadraticCurveTo(422, 74, 468, 108);
    ctx.stroke();

    // Bridge steel deck line
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(368, 84);
    ctx.quadraticCurveTo(422, 74, 468, 108);
    ctx.stroke();

    // Twin suspension bridge towers on the map
    [[400, 81], [438, 88]].forEach(([tx, ty]) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tx, ty, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Southern harbor causeway to Isla Dorada
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.52)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(404, 244);
    ctx.lineTo(458, 244);
    ctx.stroke();
    ctx.setLineDash([]);

    // Active GPS route along Marina Boulevard across Bay Suspension Bridge to Isla Dorada
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(322, 186);
    ctx.quadraticCurveTo(320, 118, 368, 84);
    ctx.quadraticCurveTo(422, 74, 468, 108);
    ctx.lineTo(494, 134);
    ctx.stroke();

    // Player live marker on Marina Boulevard
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(322, 186, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // POI badges placed cleanly away from district labels
    const pois = [
      { x: 96, y: 128, tag: 'H', col: '#c084fc' },
      { x: 244, y: 128, tag: 'G', col: '#38bdf8' },
      { x: 242, y: 234, tag: 'B', col: '#f59e0b' },
      { x: 98, y: 248, tag: 'R', col: '#facc15' },
      { x: 496, y: 142, tag: '★', col: '#fde047' },
      { x: 496, y: 236, tag: 'Y', col: '#fb7185' },
    ];
    for (const poi of pois) {
      ctx.fillStyle = '#09111f';
      ctx.beginPath();
      ctx.arc(poi.x, poi.y, 10.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = poi.col;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(poi.tag, poi.x, poi.y + 0.5);
    }

    // Bridge label pill
    ctx.font = '800 8.5px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bLabel = 'BAY BRIDGE';
    const btw = ctx.measureText(bLabel).width + 10;
    ctx.fillStyle = 'rgba(10, 16, 28, 0.86)';
    ctx.beginPath();
    ctx.roundRect(422 - btw / 2, 54 - 8, btw, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    ctx.fillText(bLabel, 422, 54.5);

    // District labels drawn last in open pockets (zero overlap)
    const allLabels = [
      ...mainlandDistricts.map((d) => ({ name: d.name, color: d.color, lx: d.lx, ly: d.ly })),
      { name: 'ISLA DORADA', color: '#f43f5e', lx: 498, ly: 188 },
    ];
    ctx.font = '800 10.5px "Segoe UI", sans-serif';
    for (const p of allLabels) {
      const tw = ctx.measureText(p.name).width + 14;
      ctx.fillStyle = 'rgba(8, 13, 24, 0.82)';
      ctx.beginPath();
      ctx.roundRect(p.lx - tw / 2, p.ly - 10, tw, 20, 5);
      ctx.fill();
      ctx.strokeStyle = p.color + 'aa';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(p.name, p.lx, p.ly + 0.5);
    }
  }
}
