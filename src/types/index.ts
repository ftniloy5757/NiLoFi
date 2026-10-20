export type AudioLanguage = 'Punjabi' | 'Hindi / Bollywood' | 'Bangla' | 'English' | 'Instrumental' | 'Other';

export type AudioMood = 
  | 'Romantic' 
  | 'Sad' 
  | 'Lofi / Rain' 
  | 'High-Energy' 
  | 'Acoustic' 
  | 'Mashup / Remix' 
  | 'Chill';

export type AudioEra = '1990s' | '2000s' | '2010s' | '2020s';

export interface TrackFeatureVector {
  romantic: number;   // 0.0 to 1.0
  sad: number;        // 0.0 to 1.0
  lofi_chill: number; // 0.0 to 1.0
  high_energy: number;// 0.0 to 1.0
  acoustic: number;   // 0.0 to 1.0
  mashup: number;     // 0.0 to 1.0
  energy_tempo: number; // 0.0 to 1.0
  era_weight: number; // 0.0 (90s) to 1.0 (2020s)
}

export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // in seconds
  artwork?: string;
  year?: number;
  language: AudioLanguage;
  era: AudioEra;
  primaryMood: AudioMood;
  isFavorite?: boolean;
  playCount: number;
  skipCount: number;
  lastPlayedAt?: number;
  vector: TrackFeatureVector;
  lyrics?: string; // Raw or LRC content
  waveformPeaks?: number[]; // Normalized 0.0 to 1.0 amplitude array (40 bars)
}

export interface SessionPreferenceVector {
  romantic: number;
  sad: number;
  lofi_chill: number;
  high_energy: number;
  acoustic: number;
  mashup: number;
  energy_tempo: number;
  era_weight: number;
  totalInteractions: number;
  activeLockLabel?: string;
}

export interface EqualizerPreset {
  id: string;
  name: string;
  isCustom?: boolean;
  gains: number[]; // 10 bands in dB (-12 to +12)
  bassBoost: number; // 0 to 1000
  virtualizer: number; // 0 to 1000
  loudnessGain: number; // 0 to 2000 mB
}

export type AudioOutputRoute = 'Speaker' | 'Bluetooth' | 'Wired' | 'Car' | 'Unknown';

export interface SmartCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  gradientColors: [string, string];
  trackCount: number;
  filter: (track: Track) => boolean;
}

export interface LyricsLine {
  timeMs: number;
  text: string;
}

export interface SleepTimerState {
  isActive: boolean;
  targetEndTime: number | null; // Timestamp ms
  initialDurationMinutes: number;
  isFadePhase: boolean; // Last 30 seconds
}

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  accentColor?: string;
}
