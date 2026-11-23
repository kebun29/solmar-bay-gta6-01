import { DISTRICTS } from './world.js';

const UNIT_SVGS = {
  heli: `<svg viewBox="0 0 18 18" width="14" height="14"><path d="M2 5h14M9 5v3M5 8h7l2 3H5l-2-2 2-1zm1 5h7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  boat: `<svg viewBox="0 0 18 18" width="14" height="14"><path d="M2 12l2 3h10l2-3H2zm3-4h6l2 4H5V8zm2-3h3v3H7V5z" fill="currentColor"/></svg>`,
  cruiser: `<svg viewBox="0 0 18 18" width="14" height="14"><rect x="2" y="7" width="14" height="6" rx="1.5" fill="currentColor"/><path d="M4 7l2-3h6l2 3" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>`,
  foot: `<svg viewBox="0 0 18 18" width="14" height="14"><circle cx="9" cy="4.2" r="2.2" fill="currentColor"/><path d="M6 9l3-1.5L12 9v4l-1.5 3M7.5 13L6 16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
};

const WEAPON_SVGS = [
  `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 11V7a1.5 1.5 0 013 0v3m0-3a1.5 1.5 0 013 0v3m0-2a1.5 1.5 0 013 0v3m0-1a1.5 1.5 0 013 0v4c0 3-2 5-5 5h-3c-3 0-5-2-5-5v-3a1.5 1.5 0 011-1z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9h14l2 2h-6l-1 6H9l1-5H4V9z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 9h15v3h-4l-1 6h-3l1-6H7l-1 4H4l1-4H3V9zm15 1h3v1.5h-3V10z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 10h19v2.2h-8l-2 4.8H8l1.5-4.8H2V10z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 10h17v2.4h-5l.8 5.2h-2.8l-.6-5.2H7l-1 3.6H3.8l.8-3.6H2V10zm17 .6h3v1.2h-3v-1.2zM9 7.8h5v1.6H9V7.8z" fill="currentColor"/></svg>`,
];

function portraitSvg(role) {
  const palette = {
    broker: { bg: '#0f2940', accent: '#38bdf8', hair: '#1e1b2e', skin: '#e0b18c', suit: '#1e293b' },
    netrunner: { bg: '#16203a', accent: '#22d3ee', hair: '#0f172a', skin: '#e5bc9c', suit: '#0e7490' },
    tuner: { bg: '#2c1810', accent: '#f97316', hair: '#3b2416', skin: '#d8a07a', suit: '#9a3412' },
    fixer: { bg: '#231336', accent: '#a855f7', hair: '#1c1426', skin: '#cf9670', suit: '#581c87' },
  }[role] || { bg: '#1e293b', accent: '#38bdf8', hair: '#111', skin: '#e0b18c', suit: '#334155' };

  return `<svg viewBox="0 0 48 48" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="6" fill="${palette.bg}"/>
    <circle cx="24" cy="46" r="17" fill="${palette.suit}"/>
    <rect x="20" y="25" width="8" height="7" rx="3" fill="${palette.skin}"/>
    <circle cx="24" cy="19" r="9.5" fill="${palette.skin}"/>
    <path d="M14 17c1-8 19-8 20 0-2-3-5-4-10-4s-8 1-10 4z" fill="${palette.hair}"/>
    <rect x="17" y="17.5" width="14" height="3.2" rx="1.4" fill="${palette.accent}" opacity="0.85"/>
    <path d="M19 23.5q5 2.2 10 0" stroke="#7c4a32" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </svg>`;
}

const TACTIC_COLORS = {
  MARKSMAN: '#f97316',
  'SHORE WATCH': '#38bdf8',
  RAMMING: '#ef4444',
  FLANKING: '#eab308',
  'FOOT CHASE': '#f43f5e',
  'IN PURSUIT': '#3b82f6',
};

const PAUSE_TABS = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];

const CHECKLIST_ITEMS = [
  { label: 'Story Missions', cur: 8, max: 12 },
  { label: 'District Takeovers', cur: 5, max: 7 },
  { label: 'Coastal Street Races', cur: 4, max: 6 },
  { label: 'Crew Loyalty Jobs', cur: 3, max: 3 },
  { label: 'Smuggler Caches', cur: 14, max: 20 },
  { label: 'Night Market Contracts', cur: 5, max: 8 },
  { label: 'Exotic Cars Boosted', cur: 6, max: 10 },
  { label: 'SBPD Blockades Broken', cur: 9, max: 12 },
  { label: 'Skyline Jumps', cur: 7, max: 12 },
];

const MISSION_MEDALS = ['G', 'G', 'S', 'B', '-', '-'];

export class UIController {
  constructor(gameplay, sound) {
    this.g = gameplay;
    this.sound = sound;

    this.hudEl = document.getElementById('hud');
    this.pauseEl = document.getElementById('pause-screen');
    this.startEl = document.getElementById('start-screen');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.worldMapCanvas = document.getElementById('world-map-canvas');
    this.worldMapCtx = this.worldMapCanvas.getContext('2d');

    this._bindEvents();
    this._renderStaticPauseParts();
  }

  _bindEvents() {
    // Start screen buttons
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
      this.sound.setMuted(!this.sound.muted);
      this.sound.playClick();
    });

    // Click world map to set waypoint
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
    // Checklist
    const listEl = document.getElementById('pause-checklist');
    listEl.innerHTML = CHECKLIST_ITEMS.map((item) => {
      const pct = Math.round((item.cur / item.max) * 100);
      return `<div class="check-row">
        <div class="check-top"><span>${item.label}</span><span class="check-val">${item.cur}/${item.max}</span></div>
        <div class="check-bar"><div class="check-fill" style="width:${pct}%"></div></div>
      </div>`;
    }).join('');

    // Medals
    const medalsEl = document.getElementById('pause-medals');
    medalsEl.innerHTML = MISSION_MEDALS.map((m) => {
      const cls = m === 'G' ? 'medal-g' : m === 'S' ? 'medal-s' : m === 'B' ? 'medal-b' : 'medal-none';
      return `<div class="medal ${cls}">${m}</div>`;
    }).join('');
  }

  cyclePauseTab(dir) {
    const idx = PAUSE_TABS.indexOf(this.g.pauseTab);
    this.g.pauseTab = PAUSE_TABS[(idx + dir + PAUSE_TABS.length) % PAUSE_TABS.length];
    this.sound.playClick();
  }

  update() {
    const mode = this.g.mode;
    this.hudEl.classList.toggle('hidden', mode !== 'play');
    this.pauseEl.classList.toggle('hidden', mode !== 'pause');
    this.startEl.classList.toggle('hidden', mode !== 'start');

    if (mode === 'play') {
      this._updateInGameHUD();
      this._drawMinimap();
    } else if (mode === 'pause') {
      this._updatePauseScreen();
      this._drawWorldMap();
    } else if (mode === 'start') {
      this._updateStartSlots();
    }
  }

  _updateStartSlots() {
    const wrap = document.getElementById('start-slots');
    wrap.innerHTML = this.g.saves.map((s) => `
      <div class="start-slot-card ${s.occupied ? '' : 'empty'}" data-slot="${s.slot}" style="border-left-color:${s.accent}">
        <div class="slot-kicker">SLOT ${s.slot} · ${s.act}</div>
        <div class="slot-meta">${s.occupied ? `${s.district} · ¤${s.cash.toLocaleString()} · ${s.completion}%` : 'Start a new coastal syndicate file'}</div>
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

    // Mid-Left Police Response Card
    const units = g.getActivePoliceUnits();
    const policeCard = document.getElementById('hud-police-card');
    policeCard.classList.toggle('hidden', g.wantedStars <= 0);
    document.getElementById('hud-police-count').textContent = `${units.length} UNITS`;
    document.getElementById('hud-police-rows').innerHTML = units.map((u) => {
      const tagCol = TACTIC_COLORS[u.tactic] || '#38bdf8';
      return `<div class="unit-row">
        <span class="unit-icon" style="color:${u.color}">${UNIT_SVGS[u.type] || UNIT_SVGS.cruiser}</span>
        <span class="unit-call">${u.callsign}</span>
        <span class="unit-tag" style="color:${tagCol};border-color:${tagCol}55;background:${tagCol}1f">${u.tactic}</span>
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
    tipEl.classList.toggle('hidden', g.inVehicle);
    tipEl.textContent = 'DUCK BY A STALL TO HIDE';

    document.getElementById('hud-hp-fill').style.width = `${Math.max(0, Math.min(100, g.health))}%`;
    document.getElementById('hud-hp-val').textContent = Math.round(g.health);
    document.getElementById('hud-ar-fill').style.width = `${Math.max(0, Math.min(100, g.armour))}%`;
    document.getElementById('hud-ar-val').textContent = Math.round(g.armour);

    // Bottom-Center Dialogue Card
    const dlgEl = document.getElementById('hud-dialogue');
    dlgEl.classList.toggle('hidden', !g.dialogue || g.dialogue.timer <= 0);
    if (g.dialogue) {
      document.getElementById('hud-dlg-portrait').innerHTML = portraitSvg(g.dialogue.role);
      document.getElementById('hud-dlg-speaker').textContent = g.dialogue.speaker;
      document.getElementById('hud-dlg-text').textContent = g.dialogue.text;
    }

    // Top-Right Clock, Cash, Wanted Stars, Alert, Rank
    document.getElementById('hud-clock').textContent = g.clockText;
    document.getElementById('hud-cash').textContent = `¤${Math.round(g.cash).toLocaleString()}`;
    const starsEl = document.getElementById('hud-stars');
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      starsHtml += `<span class="star ${i < g.wantedStars ? 'lit' : ''}">★</span>`;
    }
    starsEl.innerHTML = starsHtml;
    const alertEl = document.getElementById('hud-alert');
    alertEl.textContent = g.wantedStars >= 4 ? 'AIR UNIT DEPLOYED' : g.wantedStars > 0 ? 'UNITS RESPONDING' : 'AREA CLEAR';
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
      const dmgLabel = integrity > 85 ? 'CLEAN' : integrity > 50 ? 'DENTED' : 'SMOKING';
      const st = this.sound.getStation();
      document.getElementById('hud-speed-val').textContent = kmh;
      document.getElementById('hud-veh-name').textContent = g.currentVehicle.name;
      document.getElementById('hud-veh-dmg').textContent = `${integrity}% ${dmgLabel}`;
      document.getElementById('hud-radio').textContent = `${st.freq} · ${st.name} · ${st.genre}`;
    }
  }

  _drawMinimap() {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const pPos = this.g.getPlayerPos();
    const heading = this.g.getPlayerHeading();
    const scale = 1.05;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0c1626';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(heading - Math.PI);

    const toLocal = (wx, wz) => [(wx - pPos.x) * scale, (wz - pPos.z) * scale];

    // Ocean east of x=34
    const [ox] = toLocal(34, pPos.z);
    ctx.fillStyle = '#0d4a66';
    ctx.fillRect(ox, -300, 300, 600);

    // Beach strip
    const [bx] = toLocal(17, pPos.z);
    ctx.fillStyle = '#6e5c42';
    ctx.fillRect(bx, -300, 17 * scale, 600);

    // Roads
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 10;
    const [rx0] = toLocal(0, 0);
    ctx.beginPath();
    ctx.moveTo(rx0, -280);
    ctx.lineTo(rx0, 280);
    ctx.stroke();

    ctx.lineWidth = 6;
    [-110, -35, 45, 125].forEach((rz) => {
      const [x1, y1] = toLocal(-140, rz);
      const [x2, y2] = toLocal(10, rz);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // GPS route line to stage target
    const stage = this.g.getCurrentStage();
    if (stage && stage.target) {
      const [tx, ty] = toLocal(stage.target.x, stage.target.z);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rx0, ty);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Police & unit blips
    for (const v of this.g.vehicles) {
      if (v.type !== 'police') continue;
      const [vx, vy] = toLocal(v.mesh.position.x, v.mesh.position.z);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(vx, vy, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    for (const c of this.g.cops) {
      if (c.downed) continue;
      const [vx, vy] = toLocal(c.char.mesh.position.x, c.char.mesh.position.z);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(vx, vy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Player center arrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.lineTo(cx, cy + 2.5);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.closePath();
    ctx.fill();

    // Rotating compass N pill on rim
    const nAng = heading - Math.PI - Math.PI / 2;
    const nx = cx + Math.cos(nAng) * (w * 0.41);
    const ny = cy + Math.sin(nAng) * (h * 0.41);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(nx, ny, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny + 0.5);
  }

  _updatePauseScreen() {
    const g = this.g;
    document.getElementById('pause-cash').textContent = `¤${Math.round(g.cash).toLocaleString()}`;

    const tabsEl = document.getElementById('pause-tabs');
    tabsEl.innerHTML = PAUSE_TABS.map((t) =>
      `<button class="p-tab ${t === g.pauseTab ? 'active' : ''}" data-tab="${t}">${t}</button>`
    ).join('');
    tabsEl.querySelectorAll('.p-tab').forEach((btn) => {
      btn.onclick = () => {
        g.pauseTab = btn.dataset.tab;
        this.sound.playClick();
      };
    });

    // Right column Rank & Career 8-metric grid
    document.getElementById('pause-rank-title').textContent = `RANK ${g.rank} · ${g.rankTitle}`;
    document.getElementById('pause-rank-rp').textContent = `${g.rp.toLocaleString()} / ${g.rpNext.toLocaleString()} RP`;
    document.getElementById('pause-rank-fill').style.width = `${Math.min(100, (g.rp / g.rpNext) * 100)}%`;

    const c = g.career;
    const metrics = [
      ['Missions Cleared', c.missionsCleared],
      ['Pursuits Escaped', c.pursuitsEscaped],
      ['Top Speed', `${c.topSpeedKmh} km/h`],
      ['Takedowns', c.takedowns],
      ['Cars Boosted', c.vehiclesBoosted],
      ['Friendly Districts', `${c.districtsFriendly} / 7`],
      ['Crew Assists', c.crewAssists],
      ['Time Played', c.playTime],
    ];
    document.getElementById('pause-career-grid').innerHTML = metrics.map(([k, v]) => `
      <div class="career-cell"><div class="career-k">${k}</div><div class="career-v">${v}</div></div>
    `).join('');

    // Save slots
    const slotsEl = document.getElementById('pause-save-slots');
    slotsEl.innerHTML = g.saves.map((s) => `
      <div class="save-row">
        <div class="save-info">
          <div class="save-t">SLOT ${s.slot} · ${s.occupied ? s.district : 'EMPTY'}</div>
          <div class="save-s">${s.occupied ? `¤${s.cash.toLocaleString()} · ${s.time}` : 'Available slot'}</div>
        </div>
        <button class="save-btn" data-save="${s.slot}">SAVE</button>
      </div>
    `).join('');
    slotsEl.querySelectorAll('.save-btn').forEach((btn) => {
      btn.onclick = () => g.saveToSlot(Number(btn.dataset.save));
    });

    document.getElementById('map-waypoint-pill').textContent = `WAYPOINT · ${g.waypoint.label}`;
  }

  // Color-coded 7-district coastal map with STRICTLY ZERO overlap between labels, POIs, and GPS route
  _drawWorldMap() {
    const ctx = this.worldMapCtx;
    const w = this.worldMapCanvas.width;
    const h = this.worldMapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep coastal ocean background
    const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
    oceanGrad.addColorStop(0, '#072238');
    oceanGrad.addColorStop(1, '#0b3b57');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle map grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 40; y < h; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 7 non-overlapping district polygons (clean coastal geography)
    const polys = [
      {
        name: 'MIRADOR HILLS', color: '#a855f7', lx: 92, ly: 76,
        pts: [[24, 24], [176, 24], [176, 170], [24, 170]],
      },
      {
        name: 'SOLMAR HEIGHTS', color: '#38bdf8', lx: 254, ly: 76,
        pts: [[182, 24], [326, 24], [326, 170], [182, 170]],
      },
      {
        name: 'PALOMA STRIP', color: '#f59e0b', lx: 386, ly: 82,
        pts: [[332, 24], [430, 24], [442, 214], [332, 214]],
      },
      {
        name: 'SALINAS FLATS', color: '#eab308', lx: 98, ly: 326,
        pts: [[24, 178], [176, 178], [176, 392], [24, 392]],
      },
      {
        name: 'LANTERN QUAY', color: '#f97316', lx: 254, ly: 298,
        pts: [[182, 178], [326, 178], [326, 332], [182, 332]],
      },
      {
        name: 'CALYPSO DOCKS', color: '#10b981', lx: 368, ly: 356,
        pts: [[332, 222], [442, 222], [430, 392], [182, 392], [182, 338], [332, 338]],
      },
      {
        name: 'CORAL KEY', color: '#ec4899', lx: 504, ly: 170,
        pts: [[474, 92], [534, 118], [540, 272], [486, 292], [468, 210]],
      },
    ];

    // Golden beach ribbon along east coast
    ctx.fillStyle = 'rgba(234, 200, 140, 0.34)';
    ctx.beginPath();
    ctx.moveTo(430, 24);
    ctx.lineTo(448, 24);
    ctx.lineTo(458, 218);
    ctx.lineTo(446, 392);
    ctx.lineTo(430, 392);
    ctx.closePath();
    ctx.fill();

    // Draw each district polygon
    for (const p of polys) {
      ctx.beginPath();
      p.pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = p.color + '2e';
      ctx.fill();
      ctx.strokeStyle = p.color + 'aa';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Road network (kept cleanly along district seams so it never crosses labels)
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    // Paloma Strip boulevard
    ctx.moveTo(332, 20); ctx.lineTo(332, 396);
    // Inland avenue
    ctx.moveTo(179, 20); ctx.lineTo(179, 396);
    // Cross avenues
    ctx.moveTo(24, 174); ctx.lineTo(436, 174);
    ctx.moveTo(179, 335); ctx.lineTo(434, 335);
    // Causeway bridge to Coral Key
    ctx.moveTo(436, 218); ctx.lineTo(474, 218);
    ctx.stroke();

    // Clean GPS route line along road corridors (Paloma Strip -> Cross Ave -> Lantern Quay)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(332, 128);
    ctx.lineTo(332, 174);
    ctx.lineTo(254, 174);
    ctx.lineTo(254, 224);
    ctx.stroke();

    // Player arrow on Paloma Strip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(332, 128, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // POI badges placed strictly in open space away from every district label & GPS line
    const pois = [
      { x: 92, y: 128, label: 'SAFEHOUSE', tag: 'H', col: '#38bdf8' },
      { x: 254, y: 128, label: 'GARAGE', tag: 'G', col: '#f59e0b' },
      { x: 254, y: 236, label: 'DROP', tag: '★', col: '#facc15' },
      { x: 98, y: 248, label: 'RACE', tag: 'R', col: '#ef4444' },
      { x: 504, y: 232, label: 'MARINA', tag: 'M', col: '#ec4899' },
    ];
    for (const poi of pois) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(poi.x, poi.y, 11, 0, Math.PI * 2);
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

    // District labels drawn last in clear dedicated pockets (guaranteed zero overlap)
    ctx.font = '800 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of polys) {
      const tw = ctx.measureText(p.name).width + 14;
      ctx.fillStyle = 'rgba(10, 16, 28, 0.78)';
      ctx.beginPath();
      ctx.roundRect(p.lx - tw / 2, p.ly - 10, tw, 20, 4);
      ctx.fill();
      ctx.strokeStyle = p.color + '99';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(p.name, p.lx, p.ly + 0.5);
    }
  }
}
