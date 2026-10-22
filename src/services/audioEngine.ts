import TrackPlayer, {
  Capability,
  State,
  Track as TPTrack,
  Event,
} from 'react-native-track-player';
import { Track, AudioOutputRoute } from '../types';
import DSPEngine from './dspEngine';
import NiLoFiAudioEffects from '../../modules/nilofi-audio-effects';

export class AudioEngine {
  private static instance: AudioEngine;
  private isInitialized = false;
  private currentVolume = 1.0;
  private onRouteChangeCallback: ((route: AudioOutputRoute) => void) | null = null;

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        waitForBuffer: true,
      });

      await TrackPlayer.updateOptions({
        stoppingAppPausesPlayback: false,
        progressUpdateEventInterval: 1,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
        ],
      });

      // Hardware progress event from native ExoPlayer
      TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
        if (event && typeof event.position === 'number') {
          const usePlayerStore = require('../store/usePlayerStore').default;
          usePlayerStore.getState().updatePosition(event.position);
          if (event.duration && event.duration > 0) {
            usePlayerStore.setState({ duration: event.duration });
          }
        }
      });

      // Track completion event from native ExoPlayer (when current song finishes in background)
      TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
        const usePlayerStore = require('../store/usePlayerStore').default;
        await usePlayerStore.getState().skipToNext();
      });

      // Playback state event from native ExoPlayer
      TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        const usePlayerStore = require('../store/usePlayerStore').default;
        if (event.state === State.Playing) {
          usePlayerStore.setState({ isPlaying: true });
        } else if (event.state === State.Paused || event.state === State.Stopped) {
          usePlayerStore.setState({ isPlaying: false });
        } else if (event.state === State.Ended) {
          usePlayerStore.getState().skipToNext();
        }
      });

      // Attach native DSP audio effects module to Android audio session
      NiLoFiAudioEffects.attachSession(0); // 0 attaches to output mix
      this.isInitialized = true;
    } catch {
      // In simulator or Expo Go without prebuild, gracefully mock initialization
      this.isInitialized = true;
    }
  }

  public async getProgress() {
    try {
      return await TrackPlayer.getProgress();
    } catch {
      return null;
    }
  }

  public async getPlaybackState() {
    try {
      return await TrackPlayer.getPlaybackState();
    } catch {
      return null;
    }
  }

  /**
   * 150ms Volume Ramp on Play/Pause/Seek to eliminate hardware pop/click noises
   */
  public async playWithMicroFade(): Promise<void> {
    try {
      await TrackPlayer.setVolume(0.0);
      await TrackPlayer.play();
      
      // Micro-fade ramp up (150ms)
      const steps = 5;
      const stepDuration = 30; // 30ms * 5 = 150ms
      for (let i = 1; i <= steps; i++) {
        setTimeout(async () => {
          try {
            await TrackPlayer.setVolume((i / steps) * this.currentVolume);
          } catch {}
        }, i * stepDuration);
      }
    } catch {
      try {
        await TrackPlayer.play();
      } catch {}
    }
  }

  public async pauseWithMicroFade(): Promise<void> {
    try {
      // Micro-fade ramp down (150ms)
      const steps = 5;
      const stepDuration = 30;
      for (let i = steps - 1; i >= 0; i--) {
        setTimeout(async () => {
          try {
            await TrackPlayer.setVolume((i / steps) * this.currentVolume);
            if (i === 0) {
              await TrackPlayer.pause();
              await TrackPlayer.setVolume(this.currentVolume);
            }
          } catch {}
        }, (steps - i) * stepDuration);
      }
    } catch {
      try {
        await TrackPlayer.pause();
      } catch {}
    }
  }

  public async setTrack(track: Track): Promise<void> {
    try {
      const tpTrack: TPTrack = {
        id: track.id,
        url: track.url,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork || require('../../assets/icon.png'),
        duration: track.duration,
      };

      await TrackPlayer.reset();
      await TrackPlayer.add([tpTrack]);
      await this.playWithMicroFade();
      DSPEngine.reapplyCurrentPreset();
    } catch {}
  }

  public async setQueue(tracks: Track[]): Promise<void> {
    try {
      const tpTracks: TPTrack[] = tracks.map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        artist: t.artist,
        artwork: t.artwork || require('../../assets/icon.png'),
        duration: t.duration,
      }));

      await TrackPlayer.reset();
      await TrackPlayer.add(tpTracks);
    } catch {}
  }

  public async seekTo(seconds: number): Promise<void> {
    try {
      await TrackPlayer.seekTo(seconds);
    } catch {}
  }

  public async setMasterVolume(vol: number): Promise<void> {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    try {
      await TrackPlayer.setVolume(this.currentVolume);
    } catch {}
  }

  public onAudioRouteChange(callback: (route: AudioOutputRoute) => void): void {
    this.onRouteChangeCallback = callback;
  }
}

export default AudioEngine.getInstance();
