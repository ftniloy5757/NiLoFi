import * as FileSystem from 'expo-file-system';

export interface UserSettings {
  lastPlayedTrackId?: string;
  lastPlayedPosition?: number;
  selectedSortId?: string; // e.g. 'title_asc'
  selectedFilterId?: string; // e.g. 'all'
  activePresetId?: string;
  customGains?: number[];
  bassBoost?: number;
  virtualizer?: number;
  loudnessGain?: number;
  isEQEnabled?: boolean;
  favorites?: string[];
  isAdaptiveShuffle?: boolean;
  isRepeat?: boolean;
  isDolbyAtmosEnabled?: boolean;
  dolbyAtmosStrength?: number;
}

const SETTINGS_FILE = `${FileSystem.documentDirectory || ''}nilofi_user_settings.json`;

export class SettingsStorage {
  private static cachedSettings: UserSettings | null = null;
  private static saveTimeout: ReturnType<typeof setTimeout> | null = null;

  static async loadSettings(): Promise<UserSettings> {
    try {
      if (!FileSystem.documentDirectory) return {};
      const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
      if (!info.exists) {
        return {};
      }
      const raw = await FileSystem.readAsStringAsync(SETTINGS_FILE);
      const parsed = JSON.parse(raw);
      SettingsStorage.cachedSettings = parsed;
      return parsed || {};
    } catch (e) {
      console.warn('Failed to load user settings:', e);
      return {};
    }
  }

  static async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      if (!FileSystem.documentDirectory) return;
      SettingsStorage.cachedSettings = {
        ...(SettingsStorage.cachedSettings || {}),
        ...settings,
      };

      // Debounce writes slightly to prevent IO thrashing during continuous slider drags
      if (SettingsStorage.saveTimeout) {
        clearTimeout(SettingsStorage.saveTimeout);
      }
      SettingsStorage.saveTimeout = setTimeout(async () => {
        try {
          if (SettingsStorage.cachedSettings) {
            await FileSystem.writeAsStringAsync(
              SETTINGS_FILE,
              JSON.stringify(SettingsStorage.cachedSettings)
            );
          }
        } catch (err) {
          console.warn('Failed saving settings to file system:', err);
        }
      }, 150);
    } catch (e) {
      console.warn('Failed to queue user settings save:', e);
    }
  }

  static async saveSettingsImmediate(settings: Partial<UserSettings>): Promise<void> {
    try {
      if (!FileSystem.documentDirectory) return;
      SettingsStorage.cachedSettings = {
        ...(SettingsStorage.cachedSettings || {}),
        ...settings,
      };
      await FileSystem.writeAsStringAsync(
        SETTINGS_FILE,
        JSON.stringify(SettingsStorage.cachedSettings)
      );
    } catch (e) {
      console.warn('Failed to save settings immediately:', e);
    }
  }
}

export default SettingsStorage;
