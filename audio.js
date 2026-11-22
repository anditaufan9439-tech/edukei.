/**
 * JEJAK EVAV 3D: WEB AUDIO API SYNTHESIZER (HIGH-VOLUME BOOSTED EDITION)
 * Menghasilkan suara sintetis tanpa file MP3 eksternal dengan penguat Master Gain & Compressor:
 * - Dentang Gong Adat Kei (Boosted)
 * - Tabuhan Tifa Tradisional (Boosted)
 * - Suara Kembang Api Perayaan Ain Ni Ain (Boosted)
 * - Chime Kombo Kebijaksanaan (2x - 3x)
 * - Deburan Ombak Laut & Fanfare Kemenangan
 */

class EvavAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterOutput = null;
    this.isMuted = false;
    this.volumeBoost = 2.4; // Penguat volume utama (240% lebih nyaring & jelas)
    this.ambientGain = null;
    this.ambientSource = null;
    this.isAmbientPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Buat Compressor & Master Gain agar suara sangat nyaring namun tetap jernih tanpa pecah
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        this.masterOutput = this.ctx.createGain();
        this.masterOutput.gain.setValueAtTime(this.volumeBoost, this.ctx.currentTime);

        this.masterOutput.connect(compressor);
        compressor.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getDestination() {
    return this.masterOutput || (this.ctx ? this.ctx.destination : null);
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // Dentang Gong Adat Sakral Evav (Volume Ditingkatkan)
  playGong() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [146.83, 293.66, 440.0, 659.25, 880.0];
      const gains = [0.75, 0.45, 0.28, 0.16, 0.09];
      const decayTime = 2.6;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.72, now);
      masterGain.connect(dest);

      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.992, now + decayTime);
        g.gain.setValueAtTime(gains[idx], now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + decayTime + 0.1);
      });
    } catch (e) {}
  }

  // Tabuhan Tifa Adat Maluku Tenggara (Volume Ditingkatkan)
  playTifaRhythm() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const pattern = [
        { time: 0.0, freq: 115, dur: 0.15, gain: 0.68 },
        { time: 0.18, freq: 240, dur: 0.09, gain: 0.48 },
        { time: 0.32, freq: 240, dur: 0.09, gain: 0.48 },
        { time: 0.50, freq: 115, dur: 0.17, gain: 0.72 },
        { time: 0.72, freq: 260, dur: 0.11, gain: 0.55 }
      ];
      pattern.forEach(hit => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const start = now + hit.time;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(hit.freq, start);
        osc.frequency.exponentialRampToValueAtTime(hit.freq * 0.45, start + hit.dur);
        g.gain.setValueAtTime(hit.gain, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + hit.dur);
        osc.connect(g);
        g.connect(dest);
        osc.start(start);
        osc.stop(start + hit.dur + 0.02);
      });
    } catch (e) {}
  }

  // Suara Kombo Kebijaksanaan (Streak 2x / 3x)
  playCombo(streakLevel = 2) {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const baseNotes = streakLevel >= 3 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
      baseNotes.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch (e) {}
  }

  // Suara Kembang Api Perayaan Kampung Maren
  playFirework() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.38;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(now);
    } catch (e) {}
  }

  playWrong() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.26);
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  playFanfare() {
    if (this.isMuted) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + idx * 0.11;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.45, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.48);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    } catch (e) {}
  }

  startOceanAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.init();
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;
    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.08) * 0.22;
      }

      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = noiseBuffer;
      this.ambientSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(480, this.ctx.currentTime);

      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(320, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);

      this.ambientSource.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(dest);

      lfo.start();
      this.ambientSource.start();
      this.isAmbientPlaying = true;
    } catch (e) {}
  }

  stopOceanAmbient() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientSource) {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      }
    } catch (e) {}
    this.isAmbientPlaying = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopOceanAmbient();
    } else {
      this.startOceanAmbient();
    }
    return !this.isMuted;
  }
}

const audio = new EvavAudioEngine();
