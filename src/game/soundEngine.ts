class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastBlipTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainLevel = 0.06,
    slideToFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideToFreq), now + duration);
    }

    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  public playTextBlip(pitchBase = 420) {
    const now = performance.now();
    if (now - this.lastBlipTime < 45) return;
    this.lastBlipTime = now;
    const jitter = (Math.random() - 0.5) * 40;
    this.playTone(pitchBase + jitter, 0.045, 'square', 0.03);
  }

  public playMenuMove() {
    this.playTone(540, 0.045, 'square', 0.04);
  }

  public playConfirm() {
    this.playTone(660, 0.06, 'square', 0.05);
    setTimeout(() => this.playTone(880, 0.08, 'square', 0.05), 45);
  }

  public playCancel() {
    this.playTone(320, 0.07, 'triangle', 0.05, 220);
  }

  public playSlash(isCrit = false) {
    this.playTone(isCrit ? 980 : 620, 0.14, 'sawtooth', 0.08, 120);
    if (isCrit) {
      setTimeout(() => this.playTone(1240, 0.12, 'square', 0.07, 440), 50);
    }
  }

  public playEnemyHit() {
    this.playTone(180, 0.14, 'sawtooth', 0.09, 65);
  }

  public playPlayerHurt() {
    this.playTone(160, 0.18, 'sawtooth', 0.11, 55);
    setTimeout(() => this.playTone(110, 0.14, 'square', 0.08, 45), 60);
  }

  public playHeal() {
    this.playTone(523, 0.09, 'triangle', 0.06);
    setTimeout(() => this.playTone(659, 0.09, 'triangle', 0.06), 70);
    setTimeout(() => this.playTone(784, 0.14, 'triangle', 0.07), 140);
  }

  public playSpare() {
    this.playTone(587, 0.1, 'triangle', 0.06);
    setTimeout(() => this.playTone(740, 0.1, 'triangle', 0.06), 80);
    setTimeout(() => this.playTone(880, 0.12, 'triangle', 0.06), 160);
    setTimeout(() => this.playTone(1174, 0.22, 'sine', 0.07), 240);
  }

  public playSaveStar() {
    this.playTone(659, 0.08, 'sine', 0.06);
    setTimeout(() => this.playTone(987, 0.16, 'sine', 0.07), 70);
  }

  public playDefeatShatter() {
    this.playTone(280, 0.22, 'sawtooth', 0.09, 90);
    setTimeout(() => this.playTone(140, 0.35, 'sawtooth', 0.08, 40), 180);
  }
}

export const soundEngine = new SoundEngine();
