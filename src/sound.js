/**
 * Web Audio API Sound Synthesizer
 * Generates tactile, toy-like sound effects with zero external assets.
 * Muted by default until user interaction / sound toggle.
 */

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.muted = true; // Muted by default per requirements
  }

  initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.muted = !this.muted;
    if (!this.muted) {
      this.initContext();
      this.playDrop(); // Audio feedback when enabling
    }
    return !this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (!this.muted) {
      this.initContext();
    }
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Toy wooden block drop sound.
   */
  playDrop() {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Magical bundle chime sound (sticks wrapping into a bundle or splitting).
   */
  playBundle() {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Mechanical crane motor / winch lift sound.
   */
  playLift() {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(280, now + 0.4);

    // Soft lowpass filter to make it sound like a friendly toy motor
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Celebratory success fanfare for correct answers.
   */
  playSuccess() {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    // Cheerful arpeggio: C5, E5, G5, B5, C6
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;
      const duration = idx === freqs.length - 1 ? 0.6 : 0.25;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Gentle wobble / boing sound for "Let's borrow first!" or retry.
   */
  playWobble() {
    if (this.muted) return;
    this.initContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.12);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);
    osc.frequency.linearRampToValueAtTime(160, now + 0.38);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

export const soundManager = new SoundManager();
