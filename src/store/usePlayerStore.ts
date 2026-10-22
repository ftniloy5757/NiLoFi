import { create } from 'zustand';
import TrackPlayer from 'react-native-track-player';
import {
  Track,
  SessionPreferenceVector,
  EqualizerPreset,
  AudioOutputRoute,
  SleepTimerState,
  CustomPlaylist,
} from '../types';
import AudioEngine from '../services/audioEngine';
import DSPEngine, { BUILT_IN_PRESETS } from '../services/dspEngine';
import AdaptiveShuffleEngine from '../services/adaptiveShuffle';
import LibraryScanner from '../services/libraryScanner';
import SleepTimerService from '../services/sleepTimer';
import PlaylistStorage from '../services/playlistStorage';
import SettingsStorage, { UserSettings } from '../services/settingsStorage';

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
  isScanning: boolean;
  searchQuery: string;
  selectedSortId: string;
  selectedFilterId: string;
  customPlaylists: CustomPlaylist[];

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
  refreshLibrary: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleAdaptiveShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  setSelectedSortId: (sortId: string) => void;
  setSelectedFilterId: (filterId: string) => void;
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

  // Custom Playlists Actions
  createPlaylist: (name: string, description?: string) => Promise<CustomPlaylist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  playPlaylist: (playlist: CustomPlaylist) => Promise<void>;
}

const initialSeeds = LibraryScanner.getDemoSeedTracks();
const defaultStarterPlaylist: CustomPlaylist = {
  id: 'starter-1',
  name: 'Late Night Chill & Lofi',
  description: 'Relaxed beats and calm melodies',
  trackIds: ['seed-1', 'seed-4'],
  createdAt: Date.now(),
  accentColor: '#38BDF8',
};

let lastSkipTimestamp = 0;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  tracks: initialSeeds,
  queue: initialSeeds,
  queueIndex: 0,
  currentTrack: initialSeeds[0],
  isPlaying: false,
  position: 0,
  duration: initialSeeds[0]?.duration || 0,
  isLoading: false,
  isScanning: false,
  searchQuery: '',
  selectedSortId: 'title_asc',
  selectedFilterId: 'all',
  customPlaylists: [defaultStarterPlaylist],

  isAdaptiveShuffle: true,
  isRepeat: false,
  sessionVector: AdaptiveShuffleEngine.getSessionVector(),

  activePreset: BUILT_IN_PRESETS[0],
  activeRoute: 'Speaker',
  isEQEnabled: true,
  sleepTimer: SleepTimerService.getState(),
  favorites: ['seed-1'],

  refreshLibrary: async () => {
    set({ isScanning: true });
    try {
      const scanned = await LibraryScanner.scanDeviceAudio();
      if (scanned && scanned.length > 0) {
        const { currentTrack } = get();
        const savedSettings = await SettingsStorage.loadSettings();

        // 1. Check if user already has a currentTrack in memory
        let active = currentTrack && scanned.some((t) => t.id === currentTrack.id) ? currentTrack : null;

        // 2. Otherwise restore from persistent settings
        let restoredPos = 0;
        if (!active && savedSettings.lastPlayedTrackId) {
          const matched = scanned.find((t) => t.id === savedSettings.lastPlayedTrackId);
          if (matched) {
            active = matched;
            restoredPos = savedSettings.lastPlayedPosition || 0;
          }
        }

        // 3. Fallback to first track
        if (!active) {
          active = scanned[0];
        }

        const activeIndex = scanned.findIndex((t) => t.id === active?.id);

        set({
          tracks: scanned,
          queue: scanned,
          queueIndex: activeIndex >= 0 ? activeIndex : 0,
          currentTrack: active,
          position: restoredPos,
          duration: active ? active.duration : 0,
        });

        // Preload track in background into TrackPlayer so it's ready to play
        try {
          await TrackPlayer.reset();
          await TrackPlayer.add([{
            id: active.id,
            url: active.url,
            title: active.title,
            artist: active.artist,
            artwork: active.artwork || require('../../assets/icon.png'),
            duration: active.duration,
          }]);
          if (restoredPos > 0) {
            await TrackPlayer.seekTo(restoredPos);
          }
        } catch {}
      }
    } catch (err) {
      console.warn('Refresh library warning:', err);
    } finally {
      set({ isScanning: false });
    }
  },

  initialize: async () => {
    try {
      await AudioEngine.initialize().catch(() => {});

      // 1. Load persistent user settings
      const savedSettings = await SettingsStorage.loadSettings();

      // 2. Restore Equalizer Preset and Sound Parameters
      let restoredPreset = BUILT_IN_PRESETS[0];
      if (savedSettings.activePresetId) {
        const found = BUILT_IN_PRESETS.find((p) => p.id === savedSettings.activePresetId);
        if (found) {
          restoredPreset = {
            ...found,
            ...(savedSettings.customGains ? { gains: savedSettings.customGains } : {}),
            ...(typeof savedSettings.bassBoost === 'number' ? { bassBoost: savedSettings.bassBoost } : {}),
            ...(typeof savedSettings.virtualizer === 'number' ? { virtualizer: savedSettings.virtualizer } : {}),
            ...(typeof savedSettings.loudnessGain === 'number' ? { loudnessGain: savedSettings.loudnessGain } : {}),
          };
        } else if (savedSettings.customGains) {
          restoredPreset = {
            id: 'custom_active',
            name: 'Custom',
            isCustom: true,
            gains: savedSettings.customGains,
            bassBoost: savedSettings.bassBoost ?? 0,
            virtualizer: savedSettings.virtualizer ?? 0,
            loudnessGain: savedSettings.loudnessGain ?? 0,
          };
        }
      }

      const isEQEnabled = savedSettings.isEQEnabled ?? true;
      DSPEngine.applyPreset(restoredPreset);
      DSPEngine.toggleEQ(isEQEnabled);

      set({
        activePreset: restoredPreset,
        isEQEnabled,
        favorites: savedSettings.favorites || ['seed-1'],
        isAdaptiveShuffle: savedSettings.isAdaptiveShuffle ?? true,
        isRepeat: savedSettings.isRepeat ?? false,
        selectedSortId: savedSettings.selectedSortId || 'title_asc',
        selectedFilterId: savedSettings.selectedFilterId || 'all',
      });

      // 3. Scan device audio and restore last played track
      try {
        await get().refreshLibrary();
      } catch (scanErr) {
        console.warn('Audio scan warning:', scanErr);
      }

      // 4. Load custom playlists from storage
      try {
        const savedPlaylists = await PlaylistStorage.loadPlaylists();
        if (savedPlaylists && savedPlaylists.length > 0) {
          set({ customPlaylists: savedPlaylists });
        } else {
          await PlaylistStorage.savePlaylists([defaultStarterPlaylist]);
        }
      } catch (plErr) {
        console.warn('Playlist load warning:', plErr);
      }

      // 5. Register Sleep Timer callbacks
      SleepTimerService.registerCallbacks(
        (st) => set({ sleepTimer: st }),
        (vol) => AudioEngine.setMasterVolume(vol),
        () => get().togglePlayPause()
      );

      // 6. Handle Route Changes
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

    // Persist last played song
    SettingsStorage.saveSettings({
      lastPlayedTrackId: track.id,
      lastPlayedPosition: 0,
    });

    await AudioEngine.setTrack(track);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentTrack, tracks, position } = get();
    if (!currentTrack && tracks.length > 0) {
      await get().playTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      set({ isPlaying: false });
      if (currentTrack) {
        SettingsStorage.saveSettings({
          lastPlayedTrackId: currentTrack.id,
          lastPlayedPosition: position,
        });
      }
      await AudioEngine.pause();
    } else {
      set({ isPlaying: true });
      await AudioEngine.play();
    }
  },

  skipToNext: async () => {
    const now = Date.now();
    if (now - lastSkipTimestamp < 600) return;
    lastSkipTimestamp = now;

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
      await AudioEngine.play();
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

      SettingsStorage.saveSettings({
        lastPlayedTrackId: nextTrack.id,
        lastPlayedPosition: 0,
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

      SettingsStorage.saveSettings({
        lastPlayedTrackId: prevTrack.id,
        lastPlayedPosition: 0,
      });

      await AudioEngine.setTrack(prevTrack);
    }
  },

  seekTo: async (seconds: number) => {
    set({ position: seconds });
    const { currentTrack } = get();
    if (currentTrack) {
      SettingsStorage.saveSettings({
        lastPlayedTrackId: currentTrack.id,
        lastPlayedPosition: seconds,
      });
    }
    await AudioEngine.seekTo(seconds);
  },

  toggleAdaptiveShuffle: () => {
    const nextState = !get().isAdaptiveShuffle;
    set({ isAdaptiveShuffle: nextState });
    SettingsStorage.saveSettings({ isAdaptiveShuffle: nextState });
    if (nextState) {
      const { queue, queueIndex } = get();
      const upcoming = queue.slice(queueIndex + 1);
      const reRanked = AdaptiveShuffleEngine.reRankQueue(upcoming);
      set({ queue: [...queue.slice(0, queueIndex + 1), ...reRanked] });
    }
  },

  toggleRepeat: () => {
    const nextRepeat = !get().isRepeat;
    set({ isRepeat: nextRepeat });
    SettingsStorage.saveSettings({ isRepeat: nextRepeat });
  },

  toggleFavorite: (trackId: string) => {
    const favs = new Set(get().favorites);
    if (favs.has(trackId)) {
      favs.delete(trackId);
    } else {
      favs.add(trackId);
    }
    const updated = Array.from(favs);
    set({ favorites: updated });
    SettingsStorage.saveSettings({ favorites: updated });
  },

  setSelectedSortId: (sortId: string) => {
    set({ selectedSortId: sortId });
    SettingsStorage.saveSettings({ selectedSortId: sortId });
  },

  setSelectedFilterId: (filterId: string) => {
    set({ selectedFilterId: filterId });
    SettingsStorage.saveSettings({ selectedFilterId: filterId });
  },

  resetMood: () => {
    const cleared = AdaptiveShuffleEngine.resetSession();
    set({ sessionVector: cleared });
  },

  setEQBand: (index: number, gainDb: number) => {
    const updated = DSPEngine.setBandGain(index, gainDb);
    set({ activePreset: updated });
    SettingsStorage.saveSettings({
      activePresetId: 'custom_active',
      customGains: updated.gains,
    });
  },

  selectEQPreset: (preset: EqualizerPreset) => {
    DSPEngine.applyPreset(preset);
    set({ activePreset: preset });
    SettingsStorage.saveSettings({
      activePresetId: preset.id,
      customGains: preset.gains,
      bassBoost: preset.bassBoost,
      virtualizer: preset.virtualizer,
      loudnessGain: preset.loudnessGain,
    });
  },

  setBassBoost: (strength: number) => {
    DSPEngine.setBassBoost(strength);
    set((state) => ({
      activePreset: { ...state.activePreset, bassBoost: strength },
    }));
    SettingsStorage.saveSettings({ bassBoost: strength });
  },

  setVirtualizer: (strength: number) => {
    DSPEngine.setVirtualizer(strength);
    set((state) => ({
      activePreset: { ...state.activePreset, virtualizer: strength },
    }));
    SettingsStorage.saveSettings({ virtualizer: strength });
  },

  toggleEQ: () => {
    const nextVal = !get().isEQEnabled;
    DSPEngine.toggleEQ(nextVal);
    set({ isEQEnabled: nextVal });
    SettingsStorage.saveSettings({ isEQEnabled: nextVal });
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

  createPlaylist: async (name: string, description?: string) => {
    const newPlaylist: CustomPlaylist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'My Playlist',
      description: description?.trim() || '',
      trackIds: [],
      createdAt: Date.now(),
      accentColor: '#38BDF8',
    };
    const updated = [newPlaylist, ...get().customPlaylists];
    set({ customPlaylists: updated });
    await PlaylistStorage.savePlaylists(updated);
    return newPlaylist;
  },

  deletePlaylist: async (playlistId: string) => {
    const updated = get().customPlaylists.filter((pl) => pl.id !== playlistId);
    set({ customPlaylists: updated });
    await PlaylistStorage.savePlaylists(updated);
  },

  addTrackToPlaylist: async (playlistId: string, trackId: string) => {
    const updated = get().customPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        if (pl.trackIds.includes(trackId)) return pl;
        return { ...pl, trackIds: [...pl.trackIds, trackId] };
      }
      return pl;
    });
    set({ customPlaylists: updated });
    await PlaylistStorage.savePlaylists(updated);
  },

  removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
    const updated = get().customPlaylists.map((pl) => {
      if (pl.id === playlistId) {
        return { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) };
      }
      return pl;
    });
    set({ customPlaylists: updated });
    await PlaylistStorage.savePlaylists(updated);
  },

  playPlaylist: async (playlist: CustomPlaylist) => {
    const { tracks, playTrack } = get();
    const playlistTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
    if (playlistTracks.length > 0) {
      set({ queue: playlistTracks, queueIndex: 0 });
      await playTrack(playlistTracks[0]);
    }
  },
}));

export default usePlayerStore;
