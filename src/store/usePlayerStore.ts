import { create } from 'zustand';
import {
  Track,
  SessionPreferenceVector,
  EqualizerPreset,
  AudioOutputRoute,
  SleepTimerState,
} from '../types';
import AudioEngine from '../services/audioEngine';
import DSPEngine, { BUILT_IN_PRESETS } from '../services/dspEngine';
import AdaptiveShuffleEngine from '../services/adaptiveShuffle';
import LibraryScanner from '../services/libraryScanner';
import SleepTimerService from '../services/sleepTimer';

interface PlayerState {
  // Library & Queue
  tracks: Track[];
  queue: Track[];
  queueIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  searchQuery: string;

  // AI & Modes
  isAdaptiveShuffle: boolean;
  isRepeat: boolean;
  sessionVector: SessionPreferenceVector;

  // Audio & Hardware
  activePreset: EqualizerPreset;
  activeRoute: AudioOutputRoute;
  isEQEnabled: boolean;
  sleepTimer: SleepTimerState;
  favorites: string[];

  // Actions
  initialize: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleAdaptiveShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  resetMood: () => void;
  setEQBand: (index: number, gainDb: number) => void;
  selectEQPreset: (preset: EqualizerPreset) => void;
  setBassBoost: (strength: number) => void;
  setVirtualizer: (strength: number) => void;
  toggleEQ: () => void;
  startSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
  setSearchQuery: (query: string) => void;
  updatePosition: (seconds: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: [],
  queue: [],
  queueIndex: 0,
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  isLoading: true,
  searchQuery: '',

  isAdaptiveShuffle: true,
  isRepeat: false,
  sessionVector: AdaptiveShuffleEngine.getSessionVector(),

  activePreset: BUILT_IN_PRESETS[0],
  activeRoute: 'Speaker',
  isEQEnabled: true,
  sleepTimer: SleepTimerService.getState(),
  favorites: ['seed-1'],

  initialize: async () => {
    try {
      await AudioEngine.initialize();
      const scanned = await LibraryScanner.scanDeviceAudio();
      
      const firstTrack = scanned.length > 0 ? scanned[0] : null;

      set({
        tracks: scanned,
        queue: scanned,
        queueIndex: 0,
        currentTrack: firstTrack,
        duration: firstTrack ? firstTrack.duration : 0,
        isLoading: false,
      });

      // Register Sleep Timer callbacks
      SleepTimerService.registerCallbacks(
        (st) => set({ sleepTimer: st }),
        (vol) => AudioEngine.setMasterVolume(vol),
        () => get().togglePlayPause()
      );

      // Handle Route Changes
      AudioEngine.onAudioRouteChange((route) => {
        const newPreset = DSPEngine.handleRouteChange(route);
        set({
          activeRoute: route,
          ...(newPreset ? { activePreset: newPreset } : {}),
        });
      });
    } catch {
      set({ isLoading: false });
    }
  },

  playTrack: async (track: Track) => {
    const { currentTrack, position, duration, isAdaptiveShuffle, queue } = get();

    // Record interaction for previous track
    if (currentTrack) {
      const updatedVector = AdaptiveShuffleEngine.recordInteraction(
        currentTrack,
        position,
        duration,
        true // Manual selection
      );
      set({ sessionVector: updatedVector });
    }

    let activeQueue = [...queue];
    let newIndex = activeQueue.findIndex((t) => t.id === track.id);
    if (newIndex === -1) {
      activeQueue = [track, ...activeQueue];
      newIndex = 0;
    }

    if (isAdaptiveShuffle) {
      // Re-rank remaining unplayed tracks
      const upcoming = activeQueue.slice(newIndex + 1);
      const reRanked = AdaptiveShuffleEngine.reRankQueue(upcoming);
      activeQueue = [...activeQueue.slice(0, newIndex + 1), ...reRanked];
    }

    set({
      currentTrack: track,
      queue: activeQueue,
      queueIndex: newIndex,
      position: 0,
      duration: track.duration,
      isPlaying: true,
    });

    await AudioEngine.setTrack(track);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentTrack, tracks } = get();
    if (!currentTrack && tracks.length > 0) {
      await get().playTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      set({ isPlaying: false });
      await AudioEngine.pauseWithMicroFade();
    } else {
      set({ isPlaying: true });
      await AudioEngine.playWithMicroFade();
    }
  },

  skipToNext: async () => {
    const { queue, queueIndex, currentTrack, position, duration, isAdaptiveShuffle, isRepeat } = get();

    if (currentTrack) {
      const updatedVector = AdaptiveShuffleEngine.recordInteraction(
        currentTrack,
        position,
        duration,
        false
      );
      set({ sessionVector: updatedVector });
    }

    if (isRepeat && currentTrack) {
      await get().seekTo(0);
      await AudioEngine.playWithMicroFade();
      return;
    }

    let nextIndex = queueIndex + 1;
    let activeQueue = [...queue];

    if (nextIndex >= activeQueue.length) {
      nextIndex = 0; // Loop queue
    }

    if (isAdaptiveShuffle && nextIndex < activeQueue.length) {
      const upcoming = activeQueue.slice(nextIndex);
      const reRanked = AdaptiveShuffleEngine.reRankQueue(upcoming);
      activeQueue = [...activeQueue.slice(0, nextIndex), ...reRanked];
    }

    const nextTrack = activeQueue[nextIndex];
    if (nextTrack) {
      set({
        queue: activeQueue,
        queueIndex: nextIndex,
        currentTrack: nextTrack,
        position: 0,
        duration: nextTrack.duration,
        isPlaying: true,
      });
      await AudioEngine.setTrack(nextTrack);
    }
  },

  skipToPrevious: async () => {
    const { queue, queueIndex, position } = get();

    // If more than 3 seconds in, restart current track
    if (position > 3) {
      await get().seekTo(0);
      return;
    }

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      set({
        queueIndex: prevIndex,
        currentTrack: prevTrack,
        position: 0,
        duration: prevTrack.duration,
        isPlaying: true,
      });
      await AudioEngine.setTrack(prevTrack);
    }
  },

  seekTo: async (seconds: number) => {
    set({ position: seconds });
    await AudioEngine.seekTo(seconds);
  },

  toggleAdaptiveShuffle: () => {
    const nextState = !get().isAdaptiveShuffle;
    set({ isAdaptiveShuffle: nextState });
    if (nextState) {
      const { queue, queueIndex } = get();
      const upcoming = queue.slice(queueIndex + 1);
      const reRanked = AdaptiveShuffleEngine.reRankQueue(upcoming);
      set({ queue: [...queue.slice(0, queueIndex + 1), ...reRanked] });
    }
  },

  toggleRepeat: () => {
    set({ isRepeat: !get().isRepeat });
  },

  toggleFavorite: (trackId: string) => {
    const favs = new Set(get().favorites);
    if (favs.has(trackId)) {
      favs.delete(trackId);
    } else {
      favs.add(trackId);
    }
    set({ favorites: Array.from(favs) });
  },

  resetMood: () => {
    const cleared = AdaptiveShuffleEngine.resetSession();
    set({ sessionVector: cleared });
  },

  setEQBand: (index: number, gainDb: number) => {
    const updated = DSPEngine.setBandGain(index, gainDb);
    set({ activePreset: updated });
  },

  selectEQPreset: (preset: EqualizerPreset) => {
    DSPEngine.applyPreset(preset);
    set({ activePreset: preset });
  },

  setBassBoost: (strength: number) => {
    DSPEngine.setBassBoost(strength);
    set((state) => ({
      activePreset: { ...state.activePreset, bassBoost: strength },
    }));
  },

  setVirtualizer: (strength: number) => {
    DSPEngine.setVirtualizer(strength);
    set((state) => ({
      activePreset: { ...state.activePreset, virtualizer: strength },
    }));
  },

  toggleEQ: () => {
    const nextVal = !get().isEQEnabled;
    DSPEngine.toggleEQ(nextVal);
    set({ isEQEnabled: nextVal });
  },

  startSleepTimer: (minutes: number) => {
    SleepTimerService.startTimer(minutes);
    set({ sleepTimer: SleepTimerService.getState() });
  },

  cancelSleepTimer: () => {
    SleepTimerService.cancelTimer();
    set({ sleepTimer: SleepTimerService.getState() });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  updatePosition: (seconds: number) => {
    set({ position: seconds });
  },
}));

export default usePlayerStore;
