// Web Audio procedural sound engine and coastal radio synthesizer (100% offline)

export const RADIO_STATIONS = [
  { id: 0, freq: '98.4 FM', name: 'SOLMAR WAVE', genre: 'SYNTHWAVE', bpm: 112, root: 55, scale: [0, 3, 7, 10, 12, 15] },
  { id: 1, freq: '102.7 FM', name: 'PALOMA LOUNGE', genre: 'SUNSET CHILL', bpm: 92, root: 65.41, scale: [0, 4, 7, 11, 14, 16] },
  { id: 2, freq: '106.1 FM', name: 'QUAY PULSE', genre: 'NIGHT BASS', bpm: 124, root: 49, scale: [0, 2, 3, 7, 10, 12] },
  { id: 3, freq: 'OFF', name: 'RADIO OFF', genre: 'ENGINE ONLY', bpm: 0, root: 0, scale: [] },
];

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.stationIndex = 0;
    this.muted = false;
    this.step = 0;
    this.nextBeatTime = 0;
    this.initialized = false;
  }

  unlock() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.72;
      this.sfxGain.connect(this.master);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.24;
      this.musicGain.connect(this.master);

      // Continuous engine hum
      this.engineOsc = this.ctx.createOscillator();
      const engFilter = this.ctx.createBiquadFilter();
      engFilter.type = 'lowpass';
      engFilter.frequency.value = 260;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0;
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 54;
      this.engineOsc.connect(engFilter);
      engFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();

      // Continuous police siren
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenGain.gain.value = 0.0;
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.value = 640;
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.sfxGain);
      this.sirenOsc.start();

      this.nextBeatTime = this.ctx.currentTime + 0.05;
      this.initialized = true;
    } catch {
      // AudioContext unavailable in headless environment
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.ctx.currentTime, 0.04);
    }
  }

  cycleStation() {
    this.stationIndex = (this.stationIndex + 1) % RADIO_STATIONS.length;
    this.playClick();
    return RADIO_STATIONS[this.stationIndex];
  }

  getStation() {
    return RADIO_STATIONS[this.stationIndex];
  }

  update(dt, { inVehicle, speedKmh, wantedStars, active }) {
    if (!this.initialized || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    if (active && inVehicle && !this.muted) {
      const targetFreq = 48 + Math.min(180, speedKmh * 1.15);
      const targetGain = 0.05 + Math.min(0.11, speedKmh * 0.0009);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.06);
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
    } else {
      this.engineGain.gain.setTargetAtTime(0, now, 0.08);
    }

    if (active && wantedStars > 0 && !this.muted) {
      const wail = 620 + Math.sin(now * 5.2) * 210;
      this.sirenOsc.frequency.setTargetAtTime(wail, now, 0.03);
      this.sirenGain.gain.setTargetAtTime(0.028 + wantedStars * 0.006, now, 0.08);
    } else {
      this.sirenGain.gain.setTargetAtTime(0, now, 0.08);
    }

    const station = RADIO_STATIONS[this.stationIndex];
    if (active && inVehicle && station.bpm > 0 && !this.muted) {
      const stepSec = 60 / station.bpm / 2;
      while (this.nextBeatTime < now + 0.12) {
        this._scheduleRadioNote(station, this.step, this.nextBeatTime);
        this.step = (this.step + 1) % 16;
        this.nextBeatTime += stepSec;
      }
    } else {
      this.nextBeatTime = now + 0.1;
    }
  }

  _scheduleRadioNote(station, step, time) {
    // Bass pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = step % 4 === 0 ? 780 : 420;

    const noteIdx = [0, 0, 2, 0, 3, 2, 1, 0][step % 8] % station.scale.length;
    const semi = station.scale[noteIdx];
    const freq = station.root * Math.pow(2, semi / 12);

    osc.type = station.id === 1 ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.24);

    // Lead arpeggio on offbeats
    if (step % 2 === 1) {
      const lead = this.ctx.createOscillator();
      const lGain = this.ctx.createGain();
      const lSemi = station.scale[(step + 2) % station.scale.length] + 12;
      lead.type = 'triangle';
      lead.frequency.setValueAtTime(station.root * Math.pow(2, lSemi / 12), time);
      lGain.gain.setValueAtTime(0.001, time);
      lGain.gain.linearRampToValueAtTime(0.09, time + 0.01);
      lGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
      lead.connect(lGain);
      lGain.connect(this.musicGain);
      lead.start(time);
      lead.stop(time + 0.18);
    }
  }

  playShot(weaponId = 1) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = weaponId === 3 ? 0.19 : weaponId === 0 ? 0.07 : 0.11;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.8);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = weaponId === 3 ? 620 : weaponId === 4 ? 1150 : 1450;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(weaponId === 0 ? 0.16 : 0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  playImpact(heavy = false) {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(heavy ? 130 : 210, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + (heavy ? 0.22 : 0.12));
    gain.gain.setValueAtTime(heavy ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.24 : 0.14));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playAbility() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [440, 587.3, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);
      gain.gain.setValueAtTime(0.14, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.24);
    });
  }

  playClick() {
    if (!this.initialized || !this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}
