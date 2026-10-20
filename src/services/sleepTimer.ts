import { SleepTimerState } from '../types';

export type SleepTimerCallback = (state: SleepTimerState) => void;
export type VolumeFadeCallback = (volume: number) => void;
export type PlaybackStopCallback = () => void;

export class SleepTimerService {
  private static instance: SleepTimerService;
  private state: SleepTimerState = {
    isActive: false,
    targetEndTime: null,
    initialDurationMinutes: 0,
    isFadePhase: false,
  };
  private intervalId: NodeJS.Timeout | null = null;
  private onStateChange: SleepTimerCallback | null = null;
  private onVolumeFade: VolumeFadeCallback | null = null;
  private onStopPlayback: PlaybackStopCallback | null = null;

  public static getInstance(): SleepTimerService {
    if (!SleepTimerService.instance) {
      SleepTimerService.instance = new SleepTimerService();
    }
    return SleepTimerService.instance;
  }

  public registerCallbacks(
    stateCb: SleepTimerCallback,
    volumeCb: VolumeFadeCallback,
    stopCb: PlaybackStopCallback
  ): void {
    this.onStateChange = stateCb;
    this.onVolumeFade = volumeCb;
    this.onStopPlayback = stopCb;
  }

  public startTimer(minutes: number): void {
    this.cancelTimer();

    const targetEndTime = Date.now() + minutes * 60 * 1000;
    this.state = {
      isActive: true,
      targetEndTime,
      initialDurationMinutes: minutes,
      isFadePhase: false,
    };

    this.notifyState();

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  public cancelTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state = {
      isActive: false,
      targetEndTime: null,
      initialDurationMinutes: 0,
      isFadePhase: false,
    };
    if (this.onVolumeFade) {
      this.onVolumeFade(1.0); // Reset volume
    }
    this.notifyState();
  }

  private tick(): void {
    if (!this.state.isActive || !this.state.targetEndTime) return;

    const remainingMs = this.state.targetEndTime - Date.now();

    if (remainingMs <= 0) {
      // Time is up!
      this.cancelTimer();
      if (this.onStopPlayback) {
        this.onStopPlayback();
      }
      return;
    }

    // If within final 30 seconds: smooth gradual fade out
    if (remainingMs <= 30000) {
      this.state.isFadePhase = true;
      const volumeLevel = Math.max(0.05, remainingMs / 30000);
      if (this.onVolumeFade) {
        this.onVolumeFade(volumeLevel);
      }
      this.notifyState();
    }
  }

  public getState(): SleepTimerState {
    return { ...this.state };
  }

  public getRemainingSeconds(): number {
    if (!this.state.isActive || !this.state.targetEndTime) return 0;
    return Math.max(0, Math.floor((this.state.targetEndTime - Date.now()) / 1000));
  }

  private notifyState(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
}

export default SleepTimerService.getInstance();
