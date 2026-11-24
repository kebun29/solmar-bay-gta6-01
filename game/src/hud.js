// Coralina Bay: Sunset Syndicate — High-Contrast Glassy HUD Controller
import { getCurrentMission, getCurrentStage } from './missions.js';
import { drawMinimap } from './minimap.js';
import { getActivePoliceUnits } from './police-ai.js';

const WEAPON_ICONS = [
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 12V7a2 2 0 1 1 4 0v2m0-1V6a2 2 0 1 1 4 0v3m0-1a2 2 0 1 1 4 0v6a6 6 0 0 1-6 6H9a4 4 0 0 1-4-4v-4a2 2 0 1 1 2 0z"/></svg>',
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 8h15l2 2-1 2h-7l-1 6H7l1-6H3V8z"/></svg>',
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 9h16l3 2v2h-5l-1 5h-3l1-5H8l-2 4H3l2-4H2V9z"/></svg>',
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 10h20v3H11l-3 5H4l2-5H2v-3z"/></svg>',
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 10h19l3 1v2h-7l-1 5h-3l1-5H7l-2 4H2l2-4H1v-3z"/></svg>',
];

const UNIT_ICONS = {
  heli: '<svg viewBox="0 0 24 24" width="13" height="13" fill="#fbbf24"><path d="M3 6h18v2h-8v3h5l2 3h-5v2h3v2H6v-2h3v-2H4l2-3h5V8H3V6z"/></svg>',
  swat: '<svg viewBox="0 0 24 24" width="13" height="13" fill="#fb7185"><circle cx="12" cy="6" r="3"/><path d="M7 11h10l1 6h-3v5h-6v-5H6l1-6z"/></svg>',
  car: '<svg viewBox="0 0 24 24" width="13" height="13" fill="#38bdf8"><path d="M4 11l2-4h12l2 4v6h-2v-2H6v2H4v-6zm3 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
};

export function portraitSvg(role) {
  const palettes = {
    broker: { bg1: '#3b1d38', bg2: '#fb7185', skin: '#dca581', hair: '#1e141c', accent: '#fbbf24' },
    netrunner: { bg1: '#0e293b', bg2: '#22d3ee', skin: '#e5baa0', hair: '#0f172a', accent: '#38bdf8' },
    tuner: { bg1: '#3b1e14', bg2: '#f97316', skin: '#c98d66', hair: '#1c1917', accent: '#fb7185' },
    fixer: { bg1: '#23163b', bg2: '#a855f7', skin: '#b67c58', hair: '#18181b', accent: '#c084fc' },
  };
  const p = palettes[role] || palettes.broker;
  return `<svg viewBox="0 0 48 48" width="100%" height="100%">
    <defs><linearGradient id="g-${role}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${p.bg1}"/><stop offset="100%" stop-color="${p.bg2}"/></linearGradient></defs>
    <rect width="48" height="48" fill="url(#g-${role})"/>
    <path d="M8 48 C10 34, 38 34, 40 48 Z" fill="#0f172a"/>
    <circle cx="24" cy="21" r="9.5" fill="${p.skin}"/>
    <path d="M14 20 C14 11, 34 11, 34 20 C32 15, 16 15, 14 20 Z" fill="${p.hair}"/>
    <rect x="16" y="19" width="16" height="4" rx="2" fill="${p.accent}"/>
  </svg>`;
}

export class HUDController {
  constructor(game, sound) {
    this.game = game;
    this.sound = sound;
    this.el = {
      hud: document.getElementById('hud'),
      missionHead: document.getElementById('hud-mission-head'),
      stagePill: document.getElementById('hud-stage-pill'),
      stageTitle: document.getElementById('hud-stage-title'),
      missionSegs: document.getElementById('hud-mission-segs'),
      stageObj: document.getElementById('hud-stage-obj'),
      stageNext: document.getElementById('hud-stage-next'),
      policeCard: document.getElementById('hud-police-card'),
      policeCount: document.getElementById('hud-police-count'),
      policeRows: document.getElementById('hud-police-rows'),
      dispatch: document.getElementById('hud-dispatch'),
      districtName: document.getElementById('hud-district-name'),
      districtSub: document.getElementById('hud-district-sub'),
      standingText: document.getElementById('hud-standing-text'),
      standingFill: document.getElementById('hud-standing-fill'),
      contextTip: document.getElementById('hud-context-tip'),
      minimap: document.getElementById('minimap-canvas'),
      hpFill: document.getElementById('hud-hp-fill'),
      hpVal: document.getElementById('hud-hp-val'),
      arFill: document.getElementById('hud-ar-fill'),
      arVal: document.getElementById('hud-ar-val'),
      interactPrompt: document.getElementById('hud-interact-prompt'),
      dialogue: document.getElementById('hud-dialogue'),
      dlgPortrait: document.getElementById('hud-dlg-portrait'),
      dlgSpeaker: document.getElementById('hud-dlg-speaker'),
      dlgText: document.getElementById('hud-dlg-text'),
      clock: document.getElementById('hud-clock'),
      cash: document.getElementById('hud-cash'),
      alert: document.getElementById('hud-alert'),
      stars: document.getElementById('hud-stars'),
      rankPill: document.getElementById('hud-rank-pill'),
      rankTitle: document.getElementById('hud-rank-title'),
      rpText: document.getElementById('hud-rp-text'),
      rpFill: document.getElementById('hud-rp-fill'),
      weaponBar: document.getElementById('hud-weapon-bar'),
      crewCards: document.getElementById('hud-crew-cards'),
      speedCard: document.getElementById('hud-speed-card'),
      speedVal: document.getElementById('hud-speed-val'),
      vehName: document.getElementById('hud-veh-name'),
      vehDmg: document.getElementById('hud-veh-dmg'),
      radio: document.getElementById('hud-radio'),
    };
  }

  update() {
    const g = this.game;
    const showHud = g.mode === 'play';
    this.el.hud.classList.toggle('hidden', !showHud);
    if (!showHud) return;

    const m = getCurrentMission(g);
    const st = getCurrentStage(g);
    this.el.missionHead.textContent = `MISSION ${m.num} · ${m.title}`;
    this.el.stagePill.textContent = `STAGE ${g.stageIdx + 1}/${m.stages.length}`;
    this.el.stageTitle.textContent = st.title;
    this.el.stageObj.textContent = st.obj;
    this.el.stageNext.textContent = st.next;
    this.el.missionSegs.innerHTML = m.stages
      .map((_, i) => `<span class="seg ${i < g.stageIdx ? 'done' : i === g.stageIdx ? 'active' : ''}"></span>`)
      .join('');

    // Police Dispatch Card
    const units = getActivePoliceUnits(g);
    const showPolice = g.wantedStars > 0 && units.length > 0;
    this.el.policeCard.classList.toggle('hidden', !showPolice);
    if (showPolice) {
      this.el.policeCount.textContent = `${Math.max(units.length, g.activeUnitCount)} UNITS`;
      this.el.policeRows.innerHTML = units
        .map(
          (u) => `<div class="unit-row">
            <span class="unit-icon">${UNIT_ICONS[u.icon] || UNIT_ICONS.car}</span>
            <span class="unit-call">${u.callsign}</span>
            <span class="unit-tag" style="color:${u.color};border-color:${u.color}80;background:${u.color}22">${u.tactic}</span>
            <span class="unit-dist">${u.dist} m</span>
          </div>`
        )
        .join('');
      this.el.dispatch.textContent = g.dispatchLine;
    }

    // District & Standing
    const dist = g.getCurrentDistrict();
    this.el.districtName.textContent = dist.name;
    this.el.districtSub.textContent = dist.sub;
    this.el.standingText.textContent = `${dist.status} · ${dist.standing}`;
    this.el.standingFill.style.width = `${dist.standing}%`;
    this.el.contextTip.classList.toggle('hidden', g.shotMode !== 'night' && (g.inVehicle || dist.id !== 'bazaar'));

    // Vitals & Minimap
    this.el.hpFill.style.width = `${Math.round(g.health)}%`;
    this.el.hpVal.textContent = `${Math.round(g.health)}`;
    this.el.arFill.style.width = `${Math.round(g.armour)}%`;
    this.el.arVal.textContent = `${Math.round(g.armour)}`;
    drawMinimap(this.el.minimap, g);

    // Contextual Interaction Prompt ([F] STEAL / ENTER VEHICLE or [E] MARINA GARAGE)
    let promptText = '';
    if (g.shotMode === 'midday') {
      promptText = '[F] STEAL / ENTER VEHICLE · CORSAIR V12';
    } else if (!g.inVehicle && g.nearbyVehicle) {
      promptText = `[F] STEAL / ENTER VEHICLE · ${g.nearbyVehicle.name}`;
    } else if (g.nearbyLocation && !g.activeShop) {
      promptText = `PRESS [E] · ${g.nearbyLocation.name}`;
    }
    this.el.interactPrompt.classList.toggle('hidden', !promptText);
    if (promptText) this.el.interactPrompt.textContent = promptText;

    // Dialogue bar (hide if midday garage shot needs unobstructed bottom-center prompt, or keep compact)
    const showDlg = g.dialogue && g.dialogue.timer > 0 && g.shotMode !== 'midday';
    this.el.dialogue.classList.toggle('hidden', !showDlg);
    if (showDlg) {
      this.el.dlgPortrait.innerHTML = portraitSvg(g.dialogue.role);
      this.el.dlgSpeaker.textContent = g.dialogue.speaker;
      this.el.dlgText.textContent = g.dialogue.text;
    }

    // Top-right status
    this.el.clock.textContent = g.clockText;
    this.el.cash.textContent = `$${g.cash.toLocaleString()}`;
    this.el.alert.textContent = g.alertText;
    this.el.alert.className = `hud-alert ${g.wantedStars >= 4 ? 'danger' : g.wantedStars >= 1 ? 'warn' : 'clear'}`;
    this.el.stars.innerHTML = [1, 2, 3, 4, 5]
      .map((s) => `<span class="star ${s <= g.wantedStars ? 'lit' : ''}">★</span>`)
      .join('');

    this.el.rankPill.textContent = `RANK ${g.rank}`;
    this.el.rankTitle.textContent = g.rankTitle;
    this.el.rpText.textContent = `${g.rp.toLocaleString()} / ${g.rpNext.toLocaleString()} RP`;
    this.el.rpFill.style.width = `${Math.min(100, (g.rp / g.rpNext) * 100)}%`;

    // Hide mid-right weapon/crew stack while docked garage panel is open in midday shot so they never overlap
    const midRight = document.querySelector('.hud-mid-right');
    if (midRight) midRight.classList.toggle('hidden', g.activeShop === 'garage');

    this.el.weaponBar.innerHTML = g.weapons
      .map(
        (w, idx) => `<div class="w-slot ${idx === g.activeWeapon ? 'active' : ''}">
          <span class="w-key">${w.key}</span>
          <span class="w-icon">${WEAPON_ICONS[idx]}</span>
          <span class="w-ammo">${w.ammo}</span>
        </div>`
      )
      .join('');

    this.el.crewCards.innerHTML = g.crew
      .map(
        (c) => `<div class="crew-card ${c.cd > 0 ? 'cooling' : ''}">
          <div class="crew-portrait">
            ${portraitSvg(c.role)}
            <span class="crew-key">${c.key}</span>
            ${c.cd > 0 ? `<span class="crew-cd">${Math.ceil(c.cd)}</span>` : ''}
          </div>
          <div>
            <div class="crew-name">${c.name}</div>
            <div class="crew-role">${c.crew}</div>
          </div>
        </div>`
      )
      .join('');

    // Speedometer (shown when driving)
    this.el.speedCard.classList.toggle('hidden', !g.inVehicle);
    if (g.inVehicle && g.currentVehicle) {
      const kmh = Math.round(Math.abs(g.currentVehicle.speed) * 3.6);
      this.el.speedVal.textContent = `${kmh}`;
      this.el.vehName.textContent = g.currentVehicle.name;
      this.el.vehDmg.textContent = `${Math.max(5, 100 - Math.round(g.currentVehicle.damagePct))}% INTACT`;
      const stn = this.sound.getStation();
      this.el.radio.textContent = `${stn.freq} · ${stn.name} · ${stn.genre}`;
    }
  }
}
