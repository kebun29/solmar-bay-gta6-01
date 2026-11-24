// Coralina Bay: Sunset Syndicate — Start Screen, 3 Save Slots, 7-Tab Pause/Map Modal & Garage Shop UI
import { GARAGE_PAINTS, MISSIONS, SAVE_PREFIX, getDefaultSaves } from './config.js';
import { buyArmsService, buyGarageService, closeShop, upgradeCrewMember } from './garage-economy.js';
import { drawWorldMap } from './minimap.js';
import { getCurrentMission, replayMission } from './missions.js';

const PAUSE_TABS = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];

export function loadSavesFromStorage() {
  const defaults = getDefaultSaves();
  return defaults.map((def) => {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + def.slot);
      if (raw) return { ...def, ...JSON.parse(raw), slot: def.slot };
    } catch {
      // Ignore storage errors
    }
    return def;
  });
}

export function saveGameToSlot(game, slotNum) {
  const m = getCurrentMission(game);
  const dist = game.getCurrentDistrict();
  const payload = {
    slot: slotNum,
    occupied: true,
    act: `ACT ${Math.min(3, game.missionIdx + 1)} — ${m.title}`,
    district: dist.name,
    cash: game.cash,
    rank: game.rank,
    rp: game.rp,
    completion: Math.min(100, Number((45 + game.career.missionsCleared * 3.2).toFixed(1))),
    time: game.clockText,
    accent: slotNum === 1 ? '#fb7185' : slotNum === 2 ? '#22d3ee' : '#fbbf24',
  };
  try {
    localStorage.setItem(SAVE_PREFIX + slotNum, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
  const idx = game.saves.findIndex((s) => s.slot === slotNum);
  if (idx >= 0) game.saves[idx] = payload;
  game.sound.playAbility();
}

export function loadGameFromSlot(game, slotNum) {
  const s = game.saves.find((x) => x.slot === slotNum);
  if (!s || !s.occupied) return;
  game.cash = s.cash;
  game.rank = s.rank;
  game.rp = s.rp;
  game.clockText = s.time || '17:42';
  game.startNewOrContinue(false);
}

export function deleteSaveSlot(game, slotNum) {
  try {
    localStorage.removeItem(SAVE_PREFIX + slotNum);
  } catch {
    // Ignore storage errors
  }
  const idx = game.saves.findIndex((s) => s.slot === slotNum);
  if (idx >= 0) {
    game.saves[idx] = {
      slot: slotNum,
      occupied: false,
      act: 'EMPTY',
      district: 'No save data',
      cash: 0,
      rank: 1,
      rp: 0,
      completion: 0,
      time: '--:--',
      accent: '#475569',
    };
  }
  game.sound.playClick();
}

export class MenusAndSaveController {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;
    this._lastTab = null;
    this._lastShopKey = null;

    this.el = {
      startScreen: document.getElementById('start-screen'),
      startSlots: document.getElementById('start-slots'),
      pauseScreen: document.getElementById('pause-screen'),
      pauseTabs: document.getElementById('pause-tabs'),
      pauseCash: document.getElementById('pause-cash'),
      pauseStatsView: document.getElementById('pause-stats-view'),
      pauseTabView: document.getElementById('pause-tab-view'),
      pauseChecklist: document.getElementById('pause-checklist'),
      pauseMedals: document.getElementById('pause-medals'),
      pauseCareerGrid: document.getElementById('pause-career-grid'),
      pauseSaveSlots: document.getElementById('pause-save-slots'),
      worldMap: document.getElementById('world-map-canvas'),
      waypointPill: document.getElementById('map-waypoint-pill'),
      shopModal: document.getElementById('shop-modal'),
      shopTitle: document.getElementById('shop-title'),
      shopSub: document.getElementById('shop-sub'),
      shopCash: document.getElementById('shop-cash'),
      shopBody: document.getElementById('shop-body'),
    };

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('btn-continue')?.addEventListener('click', () => this.game.startNewOrContinue(false));
    document.getElementById('btn-newgame')?.addEventListener('click', () => this.game.startNewOrContinue(true));
    document.getElementById('btn-loadgame')?.addEventListener('click', () => {
      this.game.mode = 'pause';
      this.game.pauseTab = 'SAVE';
      this.game.cameraCtrl.exitLock();
      this.sound.playClick();
    });
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.game.mode = 'pause';
      this.game.pauseTab = 'SETTINGS';
      this.game.cameraCtrl.exitLock();
      this.sound.playClick();
    });
    document.getElementById('shop-close-btn')?.addEventListener('click', () => closeShop(this.game));

    this.el.worldMap?.addEventListener('click', (e) => {
      const rect = this.el.worldMap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      this.game.waypoint = {
        x: Math.round(nx * 365 - 165),
        z: Math.round(ny * 425 - 225),
        label: 'CUSTOM WAYPOINT',
      };
      this.sound.playClick();
      drawWorldMap(this.el.worldMap, this.game);
    });
  }

  cyclePauseTab(dir) {
    const idx = PAUSE_TABS.indexOf(this.game.pauseTab);
    const next = (idx + dir + PAUSE_TABS.length) % PAUSE_TABS.length;
    this.game.pauseTab = PAUSE_TABS[next];
    this._lastTab = null;
    this.sound.playClick();
  }

  update() {
    const g = this.game;
    this.el.startScreen.classList.toggle('hidden', g.mode !== 'start');
    this.el.pauseScreen.classList.toggle('hidden', g.mode !== 'pause');

    if (g.mode === 'start') {
      this._renderStartSlots();
    } else if (g.mode === 'pause') {
      this._renderPauseScreen();
    }

    this._renderShopModal();
  }

  _renderStartSlots() {
    this.el.startSlots.innerHTML = this.game.saves
      .map(
        (s) => `<div class="start-slot-card ${s.occupied ? '' : 'empty'}" data-slot="${s.slot}" style="border-left-color:${s.accent}">
          <div class="slot-kicker">SLOT ${s.slot} · ${s.act}</div>
          <div class="slot-meta">${s.occupied ? `${s.district} · $${s.cash.toLocaleString()} · ${s.completion}%` : 'Start a new Coralina Bay syndicate file'}</div>
        </div>`
      )
      .join('');

    this.el.startSlots.querySelectorAll('.start-slot-card').forEach((card) => {
      card.addEventListener('click', () => {
        const slot = Number(card.dataset.slot);
        const s = this.game.saves.find((x) => x.slot === slot);
        if (s && s.occupied) loadGameFromSlot(this.game, slot);
        else this.game.startNewOrContinue(true);
      });
    });
  }

  _renderPauseScreen() {
    const g = this.game;
    this.el.pauseCash.textContent = `$${g.cash.toLocaleString()}`;
    this.el.pauseTabs.innerHTML = PAUSE_TABS.map(
      (t) => `<button class="p-tab ${g.pauseTab === t ? 'active' : ''}" data-tab="${t}">${t}</button>`
    ).join('');
    this.el.pauseTabs.querySelectorAll('.p-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        g.pauseTab = btn.dataset.tab;
        this._lastTab = null;
        this.sound.playClick();
      });
    });

    const isMapOrStats = g.pauseTab === 'MAP' || g.pauseTab === 'STATS';
    this.el.pauseStatsView.classList.toggle('hidden', !isMapOrStats);
    this.el.pauseTabView.classList.toggle('hidden', isMapOrStats);

    if (isMapOrStats) {
      drawWorldMap(this.el.worldMap, g);
      if (this.el.waypointPill && g.waypoint) {
        this.el.waypointPill.textContent = `WAYPOINT · ${g.waypoint.label}`;
      }
      this._renderOverviewPanels();
    } else if (this._lastTab !== g.pauseTab) {
      this._lastTab = g.pauseTab;
      this._renderTabView(g.pauseTab);
    }
  }

  _renderOverviewPanels() {
    const g = this.game;
    const checks = [
      ['Story Missions', `${g.career.missionsCleared} / 12`, 75],
      ['Districts Allied', `${g.career.districtsFriendly} / 7`, 57],
      ['Vehicles Boosted', `${g.career.vehiclesBoosted} / 40`, 85],
      ['Crew Upgrades', `${g.crew.reduce((a, c) => a + c.level, 0)} / 9`, 44],
    ];
    this.el.pauseChecklist.innerHTML = checks
      .map(
        ([k, v, pct]) => `<div>
          <div class="check-top"><span>${k}</span><span class="check-val">${v}</span></div>
          <div class="check-bar"><div class="check-fill" style="width:${pct}%"></div></div>
        </div>`
      )
      .join('');

    this.el.pauseMedals.innerHTML = ['G', 'G', 'S', 'B', '·']
      .map((m) => `<div class="medal ${m === 'G' ? 'medal-g' : m === 'S' ? 'medal-s' : m === 'B' ? 'medal-b' : 'medal-none'}">${m}</div>`)
      .join('');

    const c = g.career;
    this.el.pauseCareerGrid.innerHTML = [
      ['Top Speed', `${c.topSpeedKmh} KM/H`],
      ['Takedowns', `${c.takedowns}`],
      ['Pursuits Escaped', `${c.pursuitsEscaped}`],
      ['Play Time', c.playTime],
    ]
      .map(([k, v]) => `<div class="career-cell"><div class="career-k">${k}</div><div class="career-v">${v}</div></div>`)
      .join('');

    this.el.pauseSaveSlots.innerHTML = g.saves
      .map(
        (s) => `<div class="save-row">
          <div><div class="save-t">SLOT ${s.slot} · ${s.act}</div><div class="save-s">${s.occupied ? `$${s.cash.toLocaleString()} · ${s.time}` : 'Empty'}</div></div>
          <button class="save-btn" data-save="${s.slot}">SAVE</button>
        </div>`
      )
      .join('');
    this.el.pauseSaveSlots.querySelectorAll('[data-save]').forEach((btn) => {
      btn.addEventListener('click', () => saveGameToSlot(g, Number(btn.dataset.save)));
    });
  }

  _renderTabView(tab) {
    const g = this.game;
    const view = this.el.pauseTabView;
    if (tab === 'STORY') {
      view.innerHTML = `<div class="panel-title">STORY MISSIONS · REPLAY</div><div class="tab-grid-3">${MISSIONS.map(
        (m, idx) => `<div class="dossier-card">
          <div class="dossier-head"><span class="dossier-title">MISSION ${m.num} · ${m.title}</span></div>
          <div class="dossier-sub">${m.stages[0].obj}</div>
          <button class="action-btn" data-replay="${idx}">LAUNCH MISSION</button>
        </div>`
      ).join('')}</div>`;
      view.querySelectorAll('[data-replay]').forEach((b) => {
        b.addEventListener('click', () => replayMission(g, Number(b.dataset.replay)));
      });
    } else if (tab === 'CREW') {
      view.innerHTML = `<div class="panel-title">SYNDICATE CREW UPGRADES</div><div class="tab-grid-3">${g.crew
        .map(
          (c, idx) => `<div class="dossier-card">
            <div class="dossier-head"><span class="dossier-title">${c.name}</span><span class="key-badge">LV ${c.level}/${c.maxLevel}</span></div>
            <div class="dossier-sub">${c.crew} — ${c.bio}</div>
            <button class="action-btn cyan" data-upg="${idx}" ${c.level >= c.maxLevel || g.cash < c.upgradeCost ? 'disabled' : ''}>
              ${c.level >= c.maxLevel ? 'MAXED' : `UPGRADE · $${c.upgradeCost.toLocaleString()}`}
            </button>
          </div>`
        )
        .join('')}</div>`;
      view.querySelectorAll('[data-upg]').forEach((b) => {
        b.addEventListener('click', () => {
          upgradeCrewMember(g, Number(b.dataset.upg));
          this._renderTabView('CREW');
        });
      });
    } else if (tab === 'SETTINGS') {
      view.innerHTML = `<div class="panel-title">AUDIO, CAMERA & TIME OF DAY</div>
        <div class="setting-row"><span>Time of Day</span>
          <div style="display:flex;gap:8px;">
            <button class="action-btn" data-tod="sunset">SUNSET</button>
            <button class="action-btn cyan" data-tod="midday">MIDDAY</button>
            <button class="action-btn" data-tod="night">NIGHT</button>
          </div>
        </div>
        <div class="setting-row"><span>Camera FOV (${g.settings.cameraFov}°)</span>
          <input id="set-fov" type="range" min="48" max="72" value="${g.settings.cameraFov}" />
        </div>
        <div class="setting-row"><span>Master Volume</span>
          <input id="set-vol" type="range" min="0" max="100" value="70" />
        </div>`;
      view.querySelectorAll('[data-tod]').forEach((b) => {
        b.addEventListener('click', () => {
          g.settings.timeOfDay = b.dataset.tod;
          g.world.setMode(b.dataset.tod);
          g.clockText = b.dataset.tod === 'night' ? '23:18' : b.dataset.tod === 'midday' ? '13:15' : '17:42';
          this.sound.playClick();
        });
      });
      view.querySelector('#set-fov')?.addEventListener('input', (e) => {
        g.settings.cameraFov = Number(e.target.value);
        g.camera.fov = g.settings.cameraFov;
        g.camera.updateProjectionMatrix();
      });
      view.querySelector('#set-vol')?.addEventListener('input', (e) => {
        this.sound.setMasterVolume(Number(e.target.value) / 100);
      });
    } else if (tab === 'CONTROLS') {
      const binds = [
        ['MOUSE / DRAG', '360° Free Orbit Camera (Pointer Lock + Drag Fallback)'],
        ['SCROLL WHEEL', 'Zoom Camera In / Out'],
        ['W A S D', 'Drive Vehicle / Camera-Relative Movement On-Foot'],
        ['LEFT CLICK / RMB', 'Fire Weapon / Over-the-Shoulder Aim'],
        ['F', 'Steal or Enter / Exit Nearby Vehicle'],
        ['E', 'Enter Marina Garage or Bazaar Arms Dealer'],
        ['SHIFT / SPACE', 'Sprint or Nitro Boost / Handbrake Drift'],
        ['1 – 5 / Z X C', 'Switch Weapon / Trigger Crew Abilities'],
        ['R / ESC / M', 'Cycle FM Radio / Pause & World Map'],
      ];
      view.innerHTML = `<div class="panel-title">CONTROLS & CAMERA</div><div class="tab-grid-2">${binds
        .map(([k, desc]) => `<div class="setting-row"><span class="key-badge">${k}</span><span class="dossier-sub">${desc}</span></div>`)
        .join('')}</div>`;
    } else if (tab === 'SAVE') {
      view.innerHTML = `<div class="panel-title">3-SLOT SYNDICATE SAVE MANAGER</div><div class="tab-grid-3">${g.saves
        .map(
          (s) => `<div class="dossier-card">
            <div class="dossier-head"><span class="dossier-title">SLOT ${s.slot}</span><span class="key-badge">${s.time}</span></div>
            <div class="dossier-sub">${s.act}<br/>${s.occupied ? `${s.district} · $${s.cash.toLocaleString()}` : 'Empty slot'}</div>
            <div style="display:flex;gap:6px;margin-top:4px;">
              <button class="action-btn cyan" data-s="${s.slot}">SAVE</button>
              <button class="action-btn" data-l="${s.slot}" ${s.occupied ? '' : 'disabled'}>LOAD</button>
              <button class="action-btn danger" data-d="${s.slot}" ${s.occupied ? '' : 'disabled'}>DEL</button>
            </div>
          </div>`
        )
        .join('')}</div>`;
      view.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { saveGameToSlot(g, Number(b.dataset.s)); this._renderTabView('SAVE'); }));
      view.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => loadGameFromSlot(g, Number(b.dataset.l))));
      view.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { deleteSaveSlot(g, Number(b.dataset.d)); this._renderTabView('SAVE'); }));
    }
  }

  _renderShopModal() {
    const g = this.game;
    const active = g.activeShop;
    this.el.shopModal.classList.toggle('hidden', !active);
    if (!active) {
      this._lastShopKey = null;
      return;
    }

    // Use sleek non-blocking right-docked styling for Marina Garage so the 3D beachfront remains crystal clear!
    this.el.shopModal.classList.toggle('garage-docked', active === 'garage');
    const key = `${active}-${g.cash}-${g.turboInstalled}-${g.heroVehicle?.damagePct}`;
    if (this._lastShopKey === key) return;
    this._lastShopKey = key;

    this.el.shopCash.textContent = `$${g.cash.toLocaleString()}`;
    if (active === 'garage') {
      this.el.shopTitle.textContent = 'MARINA GARAGE';
      this.el.shopSub.textContent = 'Repair · Respray (Clear Wanted) · Twin Turbo';
      this.el.shopBody.innerHTML = `
        <div class="setting-row">
          <div><div class="save-t">CHASSIS REPAIR</div><div class="save-s">Restore 100% integrity & drop heat</div></div>
          <button class="action-btn cyan" id="g-repair">$500</button>
        </div>
        <div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:7px;">
          <div style="width:100%;display:flex;justify-content:space-between;"><span class="save-t">RESPRAY PAINT ($800)</span><span class="save-s">Clears Wanted Stars</span></div>
          <div class="swatch-row">${GARAGE_PAINTS.map(
            (p) => `<button class="swatch-btn" title="${p.name}" data-paint="${p.hex}" style="background:${p.hex}"></button>`
          ).join('')}</div>
        </div>
        <div class="setting-row">
          <div><div class="save-t">TWIN TURBO STAGE 2</div><div class="save-s">Boosts V12 top speed to 223 KM/H</div></div>
          <button class="action-btn" id="g-turbo" ${g.turboInstalled ? 'disabled' : ''}>${g.turboInstalled ? 'INSTALLED' : '$2,500'}</button>
        </div>`;
      this.el.shopBody.querySelector('#g-repair')?.addEventListener('click', () => buyGarageService(g, 'repair'));
      this.el.shopBody.querySelector('#g-turbo')?.addEventListener('click', () => buyGarageService(g, 'turbo'));
      this.el.shopBody.querySelectorAll('[data-paint]').forEach((btn) => {
        btn.addEventListener('click', () => buyGarageService(g, 'respray', btn.dataset.paint));
      });
    } else {
      this.el.shopTitle.textContent = 'BAZAAR ARMS DEALER';
      this.el.shopSub.textContent = 'Ammo Refill · Titanium Armor · Trauma Medkit';
      this.el.shopBody.innerHTML = `
        <div class="setting-row"><div><div class="save-t">FULL AMMO CRATE</div><div class="save-s">Refill all 5 weapon slots</div></div><button class="action-btn cyan" id="a-ammo">$400</button></div>
        <div class="setting-row"><div><div class="save-t">TITANIUM VEST</div><div class="save-s">Restore Armor to 100%</div></div><button class="action-btn cyan" id="a-armor">$600</button></div>
        <div class="setting-row"><div><div class="save-t">TRAUMA MEDKIT</div><div class="save-s">Restore Health to 100%</div></div><button class="action-btn" id="a-med">$350</button></div>`;
      this.el.shopBody.querySelector('#a-ammo')?.addEventListener('click', () => buyArmsService(g, 'ammo'));
      this.el.shopBody.querySelector('#a-armor')?.addEventListener('click', () => buyArmsService(g, 'armor'));
      this.el.shopBody.querySelector('#a-med')?.addEventListener('click', () => buyArmsService(g, 'medkit'));
    }
  }
}
