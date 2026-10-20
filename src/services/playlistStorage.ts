import * as FileSystem from 'expo-file-system';
import { CustomPlaylist } from '../types';

const PLAYLISTS_FILE = `${FileSystem.documentDirectory || ''}nilofi_playlists.json`;

export class PlaylistStorage {
  static async loadPlaylists(): Promise<CustomPlaylist[]> {
    try {
      if (!FileSystem.documentDirectory) return [];
      const info = await FileSystem.getInfoAsync(PLAYLISTS_FILE);
      if (!info.exists) {
        return [];
      }
      const raw = await FileSystem.readAsStringAsync(PLAYLISTS_FILE);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (e) {
      console.warn('Failed to load playlists from file system:', e);
      return [];
    }
  }

  static async savePlaylists(playlists: CustomPlaylist[]): Promise<void> {
    try {
      if (!FileSystem.documentDirectory) return;
      await FileSystem.writeAsStringAsync(PLAYLISTS_FILE, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists to file system:', e);
    }
  }
}

export default PlaylistStorage;
