// Coralina Bay: Sunset Syndicate — GTA VI Ultra-Clean HUD Controller (>82% Pure 3D Viewport)
import { getActivePoliceUnits } from '../entities/police-ai.js';
import { getCurrentMission, getCurrentStage } from '../gameplay/missions.js';
import { drawMinimap } from './minimap.js';

const W_ICONS = [
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 12V7a2 2 0 1 1 4 0v2m0-1V6a2 2 0 1 1 4 0v3m0-1a2 2 0 1 1 4 0v6a6 6 0 0 1-6 6H9a4 4 0 0 1-4-4v-4a2 2 0 1 1 2 0z"/></svg>',
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M3 8h15l2 2-1 2h-7l-1 6H7l1-6H3z"/></svg>',
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M2 9h16l3 2v2h-5l-1 5h-3l1-5H8l-2 4H3l2-4H2z"/></svg>',
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M2 10h20v3H11l-3 5H4l2-5H2z"/></svg>',
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M1 10h19l3 1v2h-7l-1 5h-3l1-5H7l-2 4H2l2-4H1z"/></svg>',
];

export function portraitSvg(role) {
  const p = { broker: ['#3b1d38', '#fb7185', '#dca581', '#1e141c', '#fbbf24'], netrunner: ['#0e293b', '#22d3ee', '#e5baa0', '#0f172a', '#38bdf8'], tuner: ['#3b1e14', '#f97316', '#c98d66', '#1c1917', '#fb7185'], fixer: ['#23163b', '#a855f7', '#b67c58', '#18181b', '#c084fc'] }[role] || ['#3b1d38', '#fb7185', '#dca581', '#1e141c', '#fbbf24'];
  return `<svg viewBox="0 0 48 48" width="100%" height="100%"><defs><linearGradient id="g-${role}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p[0]}"/><stop offset="100%" stop-color="${p[1]}"/></linearGradient></defs><rect width="48" height="48" fill="url(#g-${role})"/><path d="M8 48 C10 34,38 34,40 48 Z" fill="#0f172a"/><circle cx="24" cy="21" r="9.5" fill="${p[2]}"/><path d="M14 20 C14 11,34 11,34 20 C32 15,16 15,14 20 Z" fill="${p[3]}"/><rect x="16" y="19" width="16" height="4" rx="2" fill="${p[4]}"/></svg>`;
}

export class HUDController {
  constructor(game, sound) {
    this.game = game; this.sound = sound;
    const $ = (id) => document.getElementById(id);
    this.el = {
      hud: $('hud'), mHead: $('hud-mission-head'), sPill: $('hud-stage-pill'), sObj: $('hud-stage-obj'), mSegs: $('hud-mission-segs'),
      pTick: $('hud-police-ticker'), pTxt: $('hud-police-text'), dName: $('hud-district-name'), dSub: $('hud-district-sub'),
      map: $('minimap-canvas'), hpF: $('hud-hp-fill'), hpV: $('hud-hp-val'), arF: $('hud-ar-fill'), arV: $('hud-ar-val'),
      prompt: $('hud-interact-prompt'), dlg: $('hud-dialogue'), dPort: $('hud-dlg-portrait'), dSpk: $('hud-dlg-speaker'), dTxt: $('hud-dlg-text'),
      clock: $('hud-clock'), cash: $('hud-cash'), alert: $('hud-alert'), stars: $('hud-stars'),
      rPill: $('hud-rank-pill'), rTitle: $('hud-rank-title'), rpF: $('hud-rp-fill'), cMini: $('hud-crew-mini'),
      wBar: $('hud-weapon-bar'), spdCard: $('hud-speed-card'), spdV: $('hud-speed-val'), vName: $('hud-veh-name'), vDmg: $('hud-veh-dmg'), radio: $('hud-radio'),
    };
  }

  update() {
    const g = this.game, e = this.el, show = g.mode === 'play';
    e.hud.classList.toggle('hidden', !show); if (!show) return;
    const m = getCurrentMission(g), st = getCurrentStage(g);
    e.mHead.textContent = `MISSION ${m.num} · ${m.title}`; e.sPill.textContent = `${g.stageIdx + 1}/${m.stages.length}`; e.sObj.textContent = st.obj;
    e.mSegs.innerHTML = m.stages.map((_, i) => `<span class="seg ${i < g.stageIdx ? 'done' : i === g.stageIdx ? 'active' : ''}"></span>`).join('');

    const units = getActivePoliceUnits(g), showPol = g.wantedStars > 0 && units.length > 0;
    e.pTick.classList.toggle('hidden', !showPol);
    if (showPol) e.pTxt.textContent = `${g.alertText} • ${units.slice(0, 2).map((u) => `${u.callsign} ${u.tactic}`).join(' • ')}`;

    const dist = g.getCurrentDistrict();
    e.dName.textContent = dist.name; e.dSub.textContent = dist.sub;
    e.hpF.style.width = `${Math.round(g.health)}%`; e.hpV.textContent = `${Math.round(g.health)}`;
    e.arF.style.width = `${Math.round(g.armour)}%`; e.arV.textContent = `${Math.round(g.armour)}`;
    drawMinimap(e.map, g);

    const promptTxt = g.shotMode === 'midday' ? '[F] STEAL / ENTER VEHICLE · CORSAIR V12'
      : !g.inVehicle && g.nearbyVehicle ? `[F] STEAL / ENTER VEHICLE · ${g.nearbyVehicle.name}`
      : g.nearbyLocation && !g.activeShop ? `PRESS [E] · ${g.nearbyLocation.name}` : '';
    e.prompt.classList.toggle('hidden', !promptTxt); if (promptTxt) e.prompt.textContent = promptTxt;

    const showDlg = g.dialogue?.timer > 0 && !promptTxt;
    e.dlg.classList.toggle('hidden', !showDlg);
    if (showDlg) { e.dPort.innerHTML = portraitSvg(g.dialogue.role); e.dSpk.textContent = g.dialogue.speaker; e.dTxt.textContent = g.dialogue.text; }

    e.clock.textContent = g.clockText; e.cash.textContent = `$${g.cash.toLocaleString()}`;
    e.alert.textContent = g.alertText; e.alert.className = `hud-alert ${g.wantedStars >= 4 ? 'danger' : g.wantedStars >= 1 ? 'warn' : 'clear'}`;
    e.stars.innerHTML = [1, 2, 3, 4, 5].map((s) => `<span class="star ${s <= g.wantedStars ? 'lit' : ''}">★</span>`).join('');
    e.rPill.textContent = `R${g.rank}`; e.rTitle.textContent = g.rankTitle;
    e.rpF.style.width = `${Math.min(100, (g.rp / g.rpNext) * 100)}%`;
    e.cMini.textContent = g.crew.map((c) => (c.cd > 0 ? `${c.key}:${Math.ceil(c.cd)}` : c.key)).join('·');

    const showW = !g.inVehicle && g.activeShop !== 'garage';
    e.wBar.classList.toggle('hidden', !showW);
    if (showW) e.wBar.innerHTML = g.weapons.map((w, i) => `<div class="w-slot ${i === g.activeWeapon ? 'active' : ''}"><span class="w-key">${w.key}</span><span class="w-icon">${W_ICONS[i]}</span><span class="w-ammo">${w.ammo}</span></div>`).join('');

    e.spdCard.classList.toggle('hidden', !g.inVehicle);
    if (g.inVehicle && g.currentVehicle) {
      e.spdV.textContent = `${Math.round(Math.abs(g.currentVehicle.speed) * 3.6)}`;
      e.vName.textContent = g.currentVehicle.name;
      e.vDmg.textContent = `${Math.max(5, 100 - Math.round(g.currentVehicle.damagePct))}%`;
      const stn = this.sound.getStation(); e.radio.textContent = `${stn.freq} · ${stn.name}`;
    }
  }
}
