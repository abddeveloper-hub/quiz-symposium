/**
 * Web Audio API procedural sound synthesizer for zero-latency tactile quiz audio.
 * Works without any external mp3 files.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Short tactile click for UI buttons
   */
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  /**
   * Dramatic buzzer unlock sequence (countdown tick or unlock ping)
   */
  public playUnlock() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High-energy futuristic chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Silent fail
    }
  }

  /**
   * Loud dramatic buzzer hit when contestant presses buzzer
   */
  public playBuzz() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Dual oscillator buzz chord (sawtooth + square for rich arcade buzzer feel)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.linearRampToValueAtTime(260, now + 0.1);
      osc1.frequency.linearRampToValueAtTime(200, now + 0.35);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(225, now);
      osc2.frequency.linearRampToValueAtTime(265, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(205, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch {
      // Silent fail
    }
  }

  /**
   * Award points fanfare / celebration
   */
  public playAward() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + i * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // Silent fail
    }
  }

  /**
   * Penalty sound (descending buzzer)
   */
  public playPenalty() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Silent fail
    }
  }

  /**
   * Countdown tick for last 3 seconds
   */
  public playTick() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Silent fail
    }
  }
}

export const sounds = new SoundEffects();
