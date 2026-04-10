/**
 * Sound effects manager.
 * Preloads audio files and provides play functions.
 */

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;

    // We use Web Audio API beeps instead of files for portability
    this.initialized = true;
  }

  /**
   * Play a beep tone using Web Audio API.
   * @param frequency Hz
   * @param duration ms
   * @param type OscillatorType
   */
  playBeep(frequency: number = 440, duration: number = 200, type: OscillatorType = "sine") {
    if (typeof window === "undefined") return;

    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.3;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio not available
    }
  }

  /** Traffic light: Red beep */
  playRedLight() {
    this.playBeep(400, 300, "sine");
  }

  /** Traffic light: Yellow beep */
  playYellowLight() {
    this.playBeep(600, 300, "sine");
  }

  /** Traffic light: Green (GO!) beep — higher pitch, longer */
  playGreenLight() {
    this.playBeep(880, 500, "square");
  }

  /** Race start fanfare */
  playRaceStart() {
    // Quick ascending beeps
    setTimeout(() => this.playBeep(523, 100), 0);     // C5
    setTimeout(() => this.playBeep(659, 100), 100);    // E5
    setTimeout(() => this.playBeep(784, 100), 200);    // G5
    setTimeout(() => this.playBeep(1047, 300), 300);   // C6
  }

  /** New record celebration */
  playNewRecord() {
    setTimeout(() => this.playBeep(523, 150, "square"), 0);
    setTimeout(() => this.playBeep(659, 150, "square"), 150);
    setTimeout(() => this.playBeep(784, 150, "square"), 300);
    setTimeout(() => this.playBeep(1047, 400, "square"), 450);
    setTimeout(() => this.playBeep(1319, 500, "square"), 700);
  }

  /** Finish beep */
  playFinish() {
    this.playBeep(1000, 500, "sine");
  }
}

export const soundManager = new SoundManager();
