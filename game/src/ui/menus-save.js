// Coralina Bay: Sunset Syndicate — Start Screen, 3 Save Slots, 7-Tab Pause Modal & Shops
import { GARAGE_PAINTS, MISSIONS, SAVE_PREFIX, getDefaultSaves } from '../core/config.js';
import { buyArmsService, buyGarageService, closeShop, upgradeCrewMember } from '../gameplay/garage-economy.js';
import { getCurrentMission, replayMission } from '../gameplay/missions.js';
import { drawWorldMap } from './minimap.js';

const TABS = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];
const $ = (id) => document.getElementById(id);

export function loadSavesFromStorage() {
  return getDefaultSaves().map((d) => {
    try { const r = localStorage.getItem(SAVE_PREFIX + d.slot); if (r) return { ...d, ...JSON.parse(r), slot: d.slot }; } catch {}
    return d;
  });
}

export function saveGameToSlot(g, slot) {
  const m = getCurrentMission(g), dist = g.getCurrentDistrict();
  const p = { slot, occupied: true, act: `ACT ${Math.min(3, g.missionIdx + 1)} — ${m.title}`, district: dist.name, cash: g.cash, rank: g.rank, rp: g.rp, completion: Math.min(100, Number((45 + g.career.missionsCleared * 3.2).toFixed(1))), time: g.clockText, accent: slot === 1 ? '#fb7185' : slot === 2 ? '#22d3ee' : '#fbbf24' };
  try { localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(p)); } catch {}
  const i = g.saves.findIndex((s) => s.slot === slot); if (i >= 0) g.saves[i] = p;
  g.sound.playAbility();
}

export function loadGameFromSlot(g, slot) {
  const s = g.saves.find((x) => x.slot === slot); if (!s?.occupied) return;
  Object.assign(g, { cash: s.cash, rank: s.rank, rp: s.rp, clockText: s.time || '17:42' });
  g.startNewOrContinue(false);
}

export function deleteSaveSlot(g, slot) {
  try { localStorage.removeItem(SAVE_PREFIX + slot); } catch {}
  const i = g.saves.findIndex((s) => s.slot === slot);
  if (i >= 0) g.saves[i] = { slot, occupied: false, act: 'EMPTY', district: 'No save data', cash: 0, rank: 1, rp: 0, completion: 0, time: '--:--', accent: '#475569' };
  g.sound.playClick();
}

export class MenusAndSaveController {
  constructor(g, sound) {
    this.game = g; this.sound = sound; this._lastTab = this._lastShop = null;
    this.el = {
      start: $('start-screen'), sSlots: $('start-slots'), pause: $('pause-screen'), pTabs: $('pause-tabs'), pCash: $('pause-cash'),
      pStats: $('pause-stats-view'), pTabV: $('pause-tab-view'), pChk: $('pause-checklist'), pMed: $('pause-medals'),
      pCar: $('pause-career-grid'), pSav: $('pause-save-slots'), wMap: $('world-map-canvas'), wp: $('map-waypoint-pill'),
      shop: $('shop-modal'), sT: $('shop-title'), sS: $('shop-sub'), sC: $('shop-cash'), sB: $('shop-body'),
    };
    const openTab = (t) => { g.mode = 'pause'; g.pauseTab = t; g.cameraCtrl.exitLock(); sound.playClick(); };
    $('btn-continue')?.addEventListener('click', () => g.startNewOrContinue(false));
    $('btn-newgame')?.addEventListener('click', () => g.startNewOrContinue(true));
    $('btn-loadgame')?.addEventListener('click', () => openTab('SAVE'));
    $('btn-settings')?.addEventListener('click', () => openTab('SETTINGS'));
    $('shop-close-btn')?.addEventListener('click', () => closeShop(g));
    this.el.wMap?.addEventListener('click', (e) => {
      const r = this.el.wMap.getBoundingClientRect();
      g.waypoint = { x: Math.round(((e.clientX - r.left) / r.width) * 365 - 165), z: Math.round(((e.clientY - r.top) / r.height) * 425 - 225), label: 'CUSTOM WAYPOINT' };
      sound.playClick(); drawWorldMap(this.el.wMap, g);
    });
  }

  cyclePauseTab(dir) {
    this.game.pauseTab = TABS[(TABS.indexOf(this.game.pauseTab) + dir + TABS.length) % TABS.length];
    this._lastTab = null; this.sound.playClick();
  }

  update() {
    const g = this.game;
    this.el.start.classList.toggle('hidden', g.mode !== 'start');
    this.el.pause.classList.toggle('hidden', g.mode !== 'pause');
    if (g.mode === 'start') this._startSlots();
    else if (g.mode === 'pause') this._pauseScreen();
    this._shopModal();
  }

  _startSlots() {
    const g = this.game;
    this.el.sSlots.innerHTML = g.saves.map((s) => `<div class="start-slot-card ${s.occupied ? '' : 'empty'}" data-slot="${s.slot}" style="border-left-color:${s.accent}"><div class="slot-kicker">SLOT ${s.slot} · ${s.act}</div><div class="slot-meta">${s.occupied ? `${s.district} · $${s.cash.toLocaleString()} · ${s.completion}%` : 'Start a new Coralina Bay file'}</div></div>`).join('');
    this.el.sSlots.querySelectorAll('.start-slot-card').forEach((c) => { c.onclick = () => { const sl = Number(c.dataset.slot); g.saves.find((x) => x.slot === sl)?.occupied ? loadGameFromSlot(g, sl) : g.startNewOrContinue(true); }; });
  }

  _pauseScreen() {
    const g = this.game, e = this.el;
    e.pCash.textContent = `$${g.cash.toLocaleString()}`;
    e.pTabs.innerHTML = TABS.map((t) => `<button class="p-tab ${g.pauseTab === t ? 'active' : ''}" data-t="${t}">${t}</button>`).join('');
    e.pTabs.querySelectorAll('.p-tab').forEach((b) => { b.onclick = () => { g.pauseTab = b.dataset.t; this._lastTab = null; this.sound.playClick(); }; });
    const ov = g.pauseTab === 'MAP' || g.pauseTab === 'STATS';
    e.pStats.classList.toggle('hidden', !ov); e.pTabV.classList.toggle('hidden', ov);
    if (ov) {
      drawWorldMap(e.wMap, g); if (e.wp && g.waypoint) e.wp.textContent = `WAYPOINT · ${g.waypoint.label}`;
      const c = g.career;
      e.pChk.innerHTML = [['Story Missions', `${c.missionsCleared}/12`, 75], ['Districts', `${c.districtsFriendly}/7`, 57], ['Boosts', `${c.vehiclesBoosted}/40`, 85], ['Crew', `${g.crew.reduce((a, x) => a + x.level, 0)}/9`, 44]].map(([k, v, p]) => `<div><div class="check-top"><span>${k}</span><span class="check-val">${v}</span></div><div class="check-bar"><div class="check-fill" style="width:${p}%"></div></div></div>`).join('');
      e.pMed.innerHTML = ['G', 'G', 'S', 'B', '·'].map((m) => `<div class="medal ${m === 'G' ? 'medal-g' : m === 'S' ? 'medal-s' : m === 'B' ? 'medal-b' : 'medal-none'}">${m}</div>`).join('');
      e.pCar.innerHTML = [['Top Speed', `${c.topSpeedKmh} KM/H`], ['Takedowns', c.takedowns], ['Escapes', c.pursuitsEscaped], ['Play Time', c.playTime]].map(([k, v]) => `<div class="career-cell"><div class="career-k">${k}</div><div class="career-v">${v}</div></div>`).join('');
      e.pSav.innerHTML = g.saves.map((s) => `<div class="save-row"><div><div class="save-t">SLOT ${s.slot} · ${s.act}</div><div class="save-s">${s.occupied ? `$${s.cash.toLocaleString()} · ${s.time}` : 'Empty'}</div></div><button class="save-btn" data-sv="${s.slot}">SAVE</button></div>`).join('');
      e.pSav.querySelectorAll('[data-sv]').forEach((b) => { b.onclick = () => saveGameToSlot(g, Number(b.dataset.sv)); });
    } else if (this._lastTab !== g.pauseTab) { this._lastTab = g.pauseTab; this._tabView(g.pauseTab); }
  }

  _tabView(tab) {
    const g = this.game, v = this.el.pTabV;
    if (tab === 'STORY') {
      v.innerHTML = `<div class="panel-title">STORY MISSIONS</div><div class="tab-grid-3">${MISSIONS.map((m, i) => `<div class="dossier-card"><div class="dossier-head"><span class="dossier-title">M${m.num} · ${m.title}</span></div><div class="dossier-sub">${m.stages[0].obj}</div><button class="action-btn" data-r="${i}">LAUNCH</button></div>`).join('')}</div>`;
      v.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => replayMission(g, Number(b.dataset.r)); });
    } else if (tab === 'CREW') {
      v.innerHTML = `<div class="panel-title">SYNDICATE CREW ABILITIES (Z / X / C)</div><div class="tab-grid-3">${g.crew.map((c, i) => `<div class="dossier-card"><div class="dossier-head"><span class="dossier-title">[${c.key}] ${c.name}</span><span class="key-badge">LV ${c.level}/${c.maxLevel}</span></div><div class="dossier-sub">${c.crew} — ${c.bio}</div><button class="action-btn cyan" data-u="${i}" ${c.level >= c.maxLevel || g.cash < c.upgradeCost ? 'disabled' : ''}>${c.level >= c.maxLevel ? 'MAXED' : `UPGRADE $${c.upgradeCost.toLocaleString()}`}</button></div>`).join('')}</div>`;
      v.querySelectorAll('[data-u]').forEach((b) => { b.onclick = () => { upgradeCrewMember(g, Number(b.dataset.u)); this._tabView('CREW'); }; });
    } else if (tab === 'SETTINGS') {
      v.innerHTML = `<div class="panel-title">AUDIO, CAMERA & TIME</div><div class="setting-row"><span>Time of Day</span><div style="display:flex;gap:8px"><button class="action-btn" data-tod="sunset">SUNSET</button><button class="action-btn cyan" data-tod="midday">MIDDAY</button><button class="action-btn" data-tod="night">NIGHT</button></div></div><div class="setting-row"><span>FOV (${g.settings.cameraFov}°)</span><input id="s-fov" type="range" min="48" max="72" value="${g.settings.cameraFov}"/></div><div class="setting-row"><span>Volume</span><input id="s-vol" type="range" min="0" max="100" value="70"/></div>`;
      v.querySelectorAll('[data-tod]').forEach((b) => { b.onclick = () => { g.settings.timeOfDay = b.dataset.tod; g.world.setMode(b.dataset.tod); g.clockText = b.dataset.tod === 'night' ? '23:18' : b.dataset.tod === 'midday' ? '13:15' : '17:42'; this.sound.playClick(); }; });
      v.querySelector('#s-fov').oninput = (e) => { g.settings.cameraFov = g.camera.fov = Number(e.target.value); g.camera.updateProjectionMatrix(); };
      v.querySelector('#s-vol').oninput = (e) => this.sound.setMasterVolume(Number(e.target.value) / 100);
    } else if (tab === 'CONTROLS') {
      v.innerHTML = `<div class="panel-title">CONTROLS</div><div class="tab-grid-2">${[['MOUSE', '360° Free Orbit'], ['SCROLL', 'Zoom'], ['WASD', 'Drive / Walk'], ['LMB/RMB', 'Fire / Aim'], ['F', 'Steal / Enter Car'], ['E', 'Garage / Arms'], ['SHIFT/SPC', 'Nitro / Drift'], ['1-5 / ZXC', 'Weapons / Crew'], ['R / ESC', 'Radio / Pause']].map(([k, d]) => `<div class="setting-row"><span class="key-badge">${k}</span><span class="dossier-sub">${d}</span></div>`).join('')}</div>`;
    } else if (tab === 'SAVE') {
      v.innerHTML = `<div class="panel-title">3-SLOT SAVE MANAGER</div><div class="tab-grid-3">${g.saves.map((s) => `<div class="dossier-card"><div class="dossier-head"><span class="dossier-title">SLOT ${s.slot}</span><span class="key-badge">${s.time}</span></div><div class="dossier-sub">${s.act}<br/>${s.occupied ? `${s.district} · $${s.cash.toLocaleString()}` : 'Empty'}</div><div style="display:flex;gap:6px"><button class="action-btn cyan" data-s="${s.slot}">SAVE</button><button class="action-btn" data-l="${s.slot}" ${s.occupied ? '' : 'disabled'}>LOAD</button><button class="action-btn danger" data-d="${s.slot}" ${s.occupied ? '' : 'disabled'}>DEL</button></div></div>`).join('')}</div>`;
      v.querySelectorAll('[data-s]').forEach((b) => { b.onclick = () => { saveGameToSlot(g, Number(b.dataset.s)); this._tabView('SAVE'); }; });
      v.querySelectorAll('[data-l]').forEach((b) => { b.onclick = () => loadGameFromSlot(g, Number(b.dataset.l)); });
      v.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { deleteSaveSlot(g, Number(b.dataset.d)); this._tabView('SAVE'); }; });
    }
  }

  _shopModal() {
    const g = this.game, e = this.el, act = g.activeShop;
    e.shop.classList.toggle('hidden', !act); if (!act) { this._lastShop = null; return; }
    e.shop.classList.toggle('garage-docked', act === 'garage');
    const key = `${act}-${g.cash}-${g.turboInstalled}-${g.heroVehicle?.damagePct}`;
    if (this._lastShop === key) return; this._lastShop = key;
    e.sC.textContent = `$${g.cash.toLocaleString()}`;
    if (act === 'garage') {
      e.sT.textContent = 'MARINA GARAGE'; e.sS.textContent = 'Repair · Respray · Twin Turbo';
      e.sB.innerHTML = `<div class="setting-row"><div><div class="save-t">CHASSIS REPAIR</div><div class="save-s">100% integrity</div></div><button class="action-btn cyan" id="g-r">$500</button></div><div class="setting-row" style="flex-direction:column;align-items:flex-start;gap:6px"><div style="width:100%;display:flex;justify-content:space-between"><span class="save-t">RESPRAY ($800)</span><span class="save-s">Clears Wanted</span></div><div class="swatch-row">${GARAGE_PAINTS.map((p) => `<button class="swatch-btn" title="${p.name}" data-p="${p.hex}" style="background:${p.hex}"></button>`).join('')}</div></div><div class="setting-row"><div><div class="save-t">TWIN TURBO</div><div class="save-s">223 KM/H top speed</div></div><button class="action-btn" id="g-t" ${g.turboInstalled ? 'disabled' : ''}>${g.turboInstalled ? 'INSTALLED' : '$2,500'}</button></div>`;
      e.sB.querySelector('#g-r').onclick = () => buyGarageService(g, 'repair');
      e.sB.querySelector('#g-t').onclick = () => buyGarageService(g, 'turbo');
      e.sB.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => buyGarageService(g, 'respray', b.dataset.p); });
    } else {
      e.sT.textContent = 'BAZAAR ARMS DEALER'; e.sS.textContent = 'Ammo · Armor · Medkit';
      e.sB.innerHTML = `<div class="setting-row"><div><div class="save-t">AMMO CRATE</div><div class="save-s">Refill 5 weapons</div></div><button class="action-btn cyan" id="a-1">$400</button></div><div class="setting-row"><div><div class="save-t">TITANIUM VEST</div><div class="save-s">100% Armor</div></div><button class="action-btn cyan" id="a-2">$600</button></div><div class="setting-row"><div><div class="save-t">MEDKIT</div><div class="save-s">100% Health</div></div><button class="action-btn" id="a-3">$350</button></div>`;
      e.sB.querySelector('#a-1').onclick = () => buyArmsService(g, 'ammo');
      e.sB.querySelector('#a-2').onclick = () => buyArmsService(g, 'armor');
      e.sB.querySelector('#a-3').onclick = () => buyArmsService(g, 'medkit');
    }
  }
}
