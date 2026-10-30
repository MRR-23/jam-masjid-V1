// Web Audio API Sound Synthesizer for Mosque TV
// Guarantees zero latency and works 100% offline without missing external audio files
import { AlarmToneKey } from '../types';

class AudioAlertSystem {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Model 1: Genta Syahdu Nabawi (Soft Ethereal Arpeggiated Chime - Sangat Sejuk & Tenang)
  private playNabawiChime(volume: number = 0.9, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (!isFinal) {
      // Detik 5, 4, 3, 2: Melodic Arpeggio 4 nada sejuk (F5 -> A5 -> C6 -> E6)
      const notes = [698.46, 880.00, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, noteStart);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.24 * volume, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.9);
      });
    } else {
      // Detik 1 (Puncak Masuk Waktu Shalat): Grand F-Major Chord Bergaung Megah & Khusyuk
      const chordNotes = [349.23, 523.25, 698.46, 880.00, 1046.50]; // F4, C5, F5, A5, C6
      chordNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3500, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const amp = (0.32 / (idx * 0.3 + 1)) * volume;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(amp, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    }
  }

  // Model 2: Beep Digital Jam Masjid Pro (Dual-Tone Precision Beep, Khas Jam Sholat Digital Terkemuka)
  private playModernBeep(volume: number = 0.85, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pulses = isFinal ? [0, 0.12, 0.24, 0.42] : [0, 0.13];

    pulses.forEach((offset, idx) => {
      const pStart = now + offset;
      const isLongFinal = isFinal && idx === pulses.length - 1;
      const dur = isLongFinal ? 0.38 : 0.085;
      const baseFreq = isLongFinal ? 1567.98 : (isFinal ? 1318.51 : 1174.66);

      // Dual oscillator for rich, crisp modern clock beep without abrasive clipping
      [baseFreq, baseFreq * 1.25].forEach((freq, oIdx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, pStart);
        filter.Q.setValueAtTime(3.0, pStart);

        osc.type = oIdx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, pStart);

        const amp = (oIdx === 0 ? 0.28 : 0.12) * volume;
        gain.gain.setValueAtTime(0, pStart);
        gain.gain.linearRampToValueAtTime(amp, pStart + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, pStart + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(pStart);
        osc.stop(pStart + dur + 0.05);
      });
    });
  }

  // Model 3: Ding-Dong Harmonis Klasik (Double Bell Chime yang Jernih dan Elegan)
  private playHarmonicChime(volume: number = 0.9, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (!isFinal) {
      // Detik 5, 4, 3, 2: Nada Ding Harmonis (G5 + D6 + overtone)
      const freqs = [783.99, 1174.66, 1567.98]; // G5, D6, G6
      const weights = [0.35, 0.20, 0.10];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(weights[idx] * volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      });
    } else {
      // Detik 1 (Puncak Masuk Waktu Adzan): Grand Double Chime "Ding - Dong"
      const dingFreqs = [1046.50, 1318.51, 1567.98]; // C6 major triad
      dingFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3 * volume * (1 - idx * 0.2), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });

      // Dong (G5 783.99 Hz) sesaat setelah Ding (+0.28s)
      const dongFreqs = [783.99, 987.77, 1174.66];
      dongFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.28);

        gain.gain.setValueAtTime(0, now + 0.28);
        gain.gain.linearRampToValueAtTime(0.35 * volume * (1 - idx * 0.2), now + 0.30);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.28);
        osc.stop(now + 1.85);
      });
    }
  }

  // Model 4: Lonceng Genta Jam Dinding Masjid (Resonansi Tubular Bell Megah)
  private playMasjidBell(volume: number = 0.9, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseFreq = isFinal ? 987.77 : 880.0; // B5 for final, A5 for countdown
    const harmonics = [1, 2.76, 5.4, 8.9];
    const decay = isFinal ? 1.8 : 0.85;

    harmonics.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      const amp = (0.35 / (idx + 1)) * volume;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  }

  // Model 5: Tabuhan Bedug & Gong Akustik (Nusantara Warm Bedug Resonance)
  private playBedugResonance(volume: number = 0.95, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const decay = isFinal ? 2.0 : 1.1;

    // Sub-bass bedug punch (membrane strike with pitch-drop)
    const bedugOsc = ctx.createOscillator();
    const bedugGain = ctx.createGain();
    bedugOsc.type = 'sine';
    bedugOsc.frequency.setValueAtTime(isFinal ? 75 : 88, now);
    bedugOsc.frequency.exponentialRampToValueAtTime(isFinal ? 48 : 55, now + 0.15);

    bedugGain.gain.setValueAtTime(0, now);
    bedugGain.gain.linearRampToValueAtTime(0.48 * volume, now + 0.015);
    bedugGain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 1.2 : 0.7));

    bedugOsc.connect(bedugGain);
    bedugGain.connect(ctx.destination);
    bedugOsc.start(now);
    bedugOsc.stop(now + 1.3);

    // Warm bronze gong overtone shimmer in background
    [185.0, 370.0, 555.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.02);

      const amp = (0.18 / (idx + 1)) * volume;
      gain.gain.setValueAtTime(0, now + 0.02);
      gain.gain.linearRampToValueAtTime(amp, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.02);
      osc.stop(now + decay + 0.1);
    });
  }

  // Model 6: Chime Kristal Madinah (Shimmering High-Crystal Bell - Bersih & Menentramkan)
  private playCrystalAlert(volume: number = 0.85, isFinal: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = isFinal ? [1046.50, 1318.51, 1567.98, 2093.00] : [1318.51, 1760.00];

    notes.forEach((freq, idx) => {
      const noteStart = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.25 * volume, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + (isFinal ? 1.6 : 0.85));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + (isFinal ? 1.7 : 0.9));
    });
  }

  // Soft Islamic chime (pleasant chime before adzan / reminder)
  public playIslamicChime(volume: number = 0.8) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.22);
        gain.gain.linearRampToValueAtTime(0.25 * volume, ctx.currentTime + idx * 0.22 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.22);
        osc.stop(ctx.currentTime + idx * 0.22 + 1.7);
      });
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }

  // Iqamah Warning Beep (e.g., 3 short beeps when 10s left, 1 long buzzer when Iqamah arrives)
  public playIqamahWarningBeep(isFinal: boolean = false, volume: number = 0.9) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 700, ctx.currentTime);

      const duration = isFinal ? 1.2 : 0.25;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3 * volume, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.1);
    } catch (e) {
      console.warn('Iqamah beep failed:', e);
    }
  }

  // Triple beep when countdown hits 0 (Iqamah dimulai, sholat ditegakkan)
  public playIqamahArrivalAlert(volume: number = 1.0) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      [0, 0.35, 0.7, 1.2].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const isLong = idx === 3;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isLong ? 987.77 : 880, ctx.currentTime + delay); // B5 or A5

        const dur = isLong ? 1.5 : 0.2;
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.35 * volume, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.1);
      });
    } catch (e) {
      console.warn('Iqamah arrival alert failed:', e);
    }
  }

  // Main alarm pulse method for 5-second countdown & adzan alert
  // Dispatches to the chosen tone style (default: 'nabawi_chime')
  public playAlarmBeepOnce(
    volume: number = 1.0, 
    isFinal: boolean = false, 
    toneType: AlarmToneKey = 'nabawi_chime'
  ) {
    try {
      switch (toneType) {
        case 'nabawi_chime':
          this.playNabawiChime(volume, isFinal);
          break;
        case 'modern_beep':
        case 'digital_beep':
          this.playModernBeep(volume, isFinal);
          break;
        case 'harmonic_chime':
          this.playHarmonicChime(volume, isFinal);
          break;
        case 'masjid_bell':
          this.playMasjidBell(volume, isFinal);
          break;
        case 'bedug_resonance':
        case 'acoustic_gong':
          this.playBedugResonance(volume, isFinal);
          break;
        case 'crystal_alert':
          this.playCrystalAlert(volume, isFinal);
          break;
        default:
          this.playNabawiChime(volume, isFinal);
          break;
      }
    } catch (e) {
      console.warn('Alarm tone failed:', e);
    }
  }

  // Alarm preview 5 detik penuh (detik 5, 4, 3, 2, dan detik 1 puncak)
  public playAdzanAlarm5Seconds(volume: number = 1.0, toneType: AlarmToneKey = 'harmonic_chime') {
    try {
      for (let i = 0; i < 5; i++) {
        const isFinal = i === 4;
        setTimeout(() => {
          this.playAlarmBeepOnce(volume, isFinal, toneType);
        }, i * 1000);
      }
    } catch (e) {
      console.warn('Adzan 5s alarm failed:', e);
    }
  }
}

export const soundManager = new AudioAlertSystem();
