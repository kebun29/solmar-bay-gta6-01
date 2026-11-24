// Coralina Bay: Sunset Syndicate — Offline Web Audio SFX & FM Radio Synth
export const RADIO_STATIONS = [
  { id: 0, freq: '104.9 FM', name: 'CORALINA SUNSET', genre: 'TROPICAL SYNTH', bpm: 114, root: 58.27, scale: [0, 3, 7, 10, 12, 15] },
  { id: 1, freq: '96.3 FM', name: 'BAYSIDE NOIR', genre: 'LO-FI FUNK', bpm: 94, root: 65.41, scale: [0, 4, 7, 11, 14, 16] },
  { id: 2, freq: '108.5 FM', name: 'MARINA PULSE', genre: 'ELECTRO HOUSE', bpm: 126, root: 51.91, scale: [0, 2, 3, 7, 10, 12] },
  { id: 3, freq: 'OFF', name: 'RADIO OFF', genre: 'ENGINE ONLY', bpm: 0, root: 0, scale: [] },
];

export class SoundEngine {
  constructor() {
    Object.assign(this, { ctx: null, master: null, sfxGain: null, musicGain: null, engineOsc: null, engineGain: null, sirenOsc: null, sirenGain: null, stationIndex: 0, muted: false, masterVol: 0.7, step: 0, nextBeatTime: 0, initialized: false });
  }

  unlock() {
    if (this.initialized) { if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      const c = (this.ctx = new AC()), mkG = (v, dst) => { const g = c.createGain(); g.gain.value = v; g.connect(dst); return g; };
      this.master = mkG(0.42, c.destination); this.sfxGain = mkG(0.72, this.master); this.musicGain = mkG(0.24, this.master);
      const ef = c.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 260;
      this.engineGain = mkG(0, this.sfxGain); ef.connect(this.engineGain);
      this.engineOsc = c.createOscillator(); this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 54; this.engineOsc.connect(ef); this.engineOsc.start();
      this.sirenGain = mkG(0, this.sfxGain);
      this.sirenOsc = c.createOscillator(); this.sirenOsc.type = 'triangle'; this.sirenOsc.frequency.value = 640; this.sirenOsc.connect(this.sirenGain); this.sirenOsc.start();
      this.nextBeatTime = c.currentTime + 0.05; this.initialized = true;
    } catch {}
  }

  setMuted(m) { this.muted = m; if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.masterVol * 0.6, this.ctx.currentTime, 0.04); }
  setMasterVolume(v) { this.masterVol = Math.max(0, Math.min(1, v)); if (this.master && this.ctx && !this.muted) this.master.gain.setTargetAtTime(this.masterVol * 0.6, this.ctx.currentTime, 0.04); }
  cycleStation() { this.stationIndex = (this.stationIndex + 1) % RADIO_STATIONS.length; this.playClick(); return RADIO_STATIONS[this.stationIndex]; }
  getStation() { return RADIO_STATIONS[this.stationIndex]; }

  update(dt, { inVehicle, speedKmh, wantedStars, active }) {
    if (!this.initialized || this.ctx?.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (active && inVehicle && !this.muted) {
      this.engineOsc.frequency.setTargetAtTime(48 + Math.min(180, speedKmh * 1.15), now, 0.06);
      this.engineGain.gain.setTargetAtTime(0.05 + Math.min(0.11, speedKmh * 0.0009), now, 0.08);
    } else this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    if (active && wantedStars > 0 && !this.muted) {
      this.sirenOsc.frequency.setTargetAtTime(620 + Math.sin(now * 5.2) * 210, now, 0.03);
      this.sirenGain.gain.setTargetAtTime(0.028 + wantedStars * 0.006, now, 0.08);
    } else this.sirenGain.gain.setTargetAtTime(0, now, 0.08);
    const st = RADIO_STATIONS[this.stationIndex];
    if (active && inVehicle && st.bpm > 0 && !this.muted) {
      const stepSec = 60 / st.bpm / 2;
      while (this.nextBeatTime < now + 0.12) { this._note(st, this.step, this.nextBeatTime); this.step = (this.step + 1) % 16; this.nextBeatTime += stepSec; }
    } else this.nextBeatTime = now + 0.1;
  }

  _note(st, step, t) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = step % 4 === 0 ? 780 : 420;
    o.type = st.id === 1 ? 'sine' : 'sawtooth';
    o.frequency.setValueAtTime(st.root * Math.pow(2, st.scale[[0, 0, 2, 0, 3, 2, 1, 0][step % 8] % st.scale.length] / 12), t);
    g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(f); f.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 0.24);
    if (step % 2 === 1) {
      const l = c.createOscillator(), lg = c.createGain();
      l.type = 'triangle'; l.frequency.setValueAtTime(st.root * Math.pow(2, (st.scale[(step + 2) % st.scale.length] + 12) / 12), t);
      lg.gain.setValueAtTime(0.001, t); lg.gain.linearRampToValueAtTime(0.09, t + 0.01); lg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      l.connect(lg); lg.connect(this.musicGain); l.start(t); l.stop(t + 0.18);
    }
  }

  playShot(wid = 1) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const c = this.ctx, now = c.currentTime, dur = wid === 3 ? 0.19 : wid === 0 ? 0.07 : 0.11;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8);
    const n = c.createBufferSource(); n.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = wid === 3 ? 620 : wid === 4 ? 1150 : 1450;
    const g = c.createGain(); g.gain.setValueAtTime(wid === 0 ? 0.16 : 0.34, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    n.connect(f); f.connect(g); g.connect(this.sfxGain); n.start(now);
  }

  playImpact(heavy = false) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const c = this.ctx, now = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(heavy ? 130 : 210, now); o.frequency.exponentialRampToValueAtTime(38, now + (heavy ? 0.22 : 0.12));
    g.gain.setValueAtTime(heavy ? 0.35 : 0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.24 : 0.14));
    o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now + 0.26);
  }

  playAbility() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const c = this.ctx, now = c.currentTime;
    [440, 587.3, 880].forEach((freq, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(freq, now + i * 0.055);
      g.gain.setValueAtTime(0.14, now + i * 0.055); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.22);
      o.connect(g); g.connect(this.sfxGain); o.start(now + i * 0.055); o.stop(now + i * 0.055 + 0.24);
    });
  }

  playClick() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const c = this.ctx, now = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(720, now); o.frequency.exponentialRampToValueAtTime(420, now + 0.04);
    g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    o.connect(g); g.connect(this.sfxGain); o.start(now); o.stop(now + 0.05);
  }
}
