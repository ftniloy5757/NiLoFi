import { EqualizerPreset, AudioOutputRoute } from '../types';
import NiLoFiAudioEffects from '../../modules/nilofi-audio-effects';

export const EQ_FREQUENCIES = [
  '31Hz',
  '62Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
  '16kHz',
];

export const BUILT_IN_PRESETS: EqualizerPreset[] = [
  {
    id: 'dolby_standard',
    name: 'Standard',
    subtitle: 'Dolby On signature curve',
    description: 'Dolby On signature curve: Balanced dynamics, crystal clarity, and expanded spatial depth.',
    isDolbyStyle: true,
    pattern: 'standard',
    colors: ['#4C1D95', '#EA580C'],
    gains: [6, 5, 2, 0, 0, 1, 3, 4, 4, 3],
    bassBoost: 450,
    virtualizer: 300,
    loudnessGain: 400,
  },
  {
    id: 'dolby_natural',
    name: 'Natural',
    subtitle: 'True-to-life studio balance',
    description: 'True acoustic realism: Flat studio accuracy with pristine dynamic transparency.',
    isDolbyStyle: true,
    pattern: 'natural',
    colors: ['#BE185D', '#E11D48'],
    gains: [2, 1, 0, 0, 0, 1, 1, 2, 2, 1],
    bassBoost: 150,
    virtualizer: 200,
    loudnessGain: 250,
  },
  {
    id: 'dolby_thump',
    name: 'Thump',
    subtitle: 'Club & sub-bass punch',
    description: 'Sub-bass resonance: Heavy club punch and driving low-end impact.',
    isDolbyStyle: true,
    pattern: 'thump',
    colors: ['#D97706', '#CA8A04'],
    gains: [9, 8, 5, 2, 0, 0, 2, 3, 4, 3],
    bassBoost: 800,
    virtualizer: 250,
    loudnessGain: 500,
  },
  {
    id: 'dolby_amped',
    name: 'Amped',
    subtitle: 'Maximum projection & volume',
    description: 'High-gain loudness: Maximum projection, boosted attack, and room-filling volume.',
    isDolbyStyle: true,
    pattern: 'amped',
    colors: ['#DC2626', '#EA580C'],
    gains: [6, 6, 4, 3, 4, 5, 5, 6, 7, 6],
    bassBoost: 550,
    virtualizer: 400,
    loudnessGain: 750,
  },
  {
    id: 'dolby_lyric',
    name: 'Lyric',
    subtitle: 'Vocal & lyric clarity',
    description: 'Vocal clarity: Forward mid-range with crisp acoustic definition and vocal presence.',
    isDolbyStyle: true,
    pattern: 'lyric',
    colors: ['#9D174D', '#C026D3'],
    gains: [-2, -1, 0, 2, 5, 6, 5, 3, 2, 1],
    bassBoost: 100,
    virtualizer: 250,
    loudnessGain: 350,
  },
  {
    id: 'dolby_deep',
    name: 'Deep',
    subtitle: 'Sub-bass immersion',
    description: 'Sub-bass immersion: Atmospheric warmth, deep sub-bass, and cinematic field.',
    isDolbyStyle: true,
    pattern: 'deep',
    colors: ['#9F1239', '#881337'],
    gains: [8, 7, 4, 1, 0, 0, 1, 2, 2, 1],
    bassBoost: 650,
    virtualizer: 400,
    loudnessGain: 350,
  },
  {
    id: 'flat',
    name: 'Pure Flat',
    subtitle: 'Studio direct reference',
    description: 'Pure Flat: Unaltered 0dB reference response across all 10 frequency bands.',
    isDolbyStyle: false,
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    virtualizer: 0,
    loudnessGain: 200,
  },
];

export class DSPEngine {
  private static instance: DSPEngine;
  private currentPreset: EqualizerPreset = BUILT_IN_PRESETS[0];
  private customPresets: Map<string, EqualizerPreset> = new Map();
  private routePresets: Map<AudioOutputRoute, string> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    this.routePresets.set('Speaker', 'dolby_amped');
    this.routePresets.set('Bluetooth', 'dolby_standard');
    this.routePresets.set('Car', 'dolby_thump');
    this.routePresets.set('Wired', 'dolby_natural');
  }

  public static getInstance(): DSPEngine {
    if (!DSPEngine.instance) {
      DSPEngine.instance = new DSPEngine();
    }
    return DSPEngine.instance;
  }

  public setDolbyAtmos(enabled: boolean, strength: number = 850): void {
    NiLoFiAudioEffects.setDolbyAtmos(enabled, strength);
  }

  public getCapabilities() {
    return NiLoFiAudioEffects.getCapabilities();
  }

  public calculatePreAmpAutoGain(gains: number[]): number {
    return 0;
  }

  public applyPreset(preset: EqualizerPreset): void {
    this.currentPreset = preset;
    if (!this.isEnabled) return;

    NiLoFiAudioEffects.attachSession(0);
    NiLoFiAudioEffects.setEqualizerBands(preset.gains);
    NiLoFiAudioEffects.setBassBoost(preset.bassBoost);
    NiLoFiAudioEffects.setVirtualizer(preset.virtualizer);
    NiLoFiAudioEffects.setLoudnessEnhancer(preset.loudnessGain);
  }

  public reapplyCurrentPreset(): void {
    if (!this.isEnabled) return;
    NiLoFiAudioEffects.attachSession(0);
    NiLoFiAudioEffects.setEqualizerBands(this.currentPreset.gains);
    NiLoFiAudioEffects.setBassBoost(this.currentPreset.bassBoost);
    NiLoFiAudioEffects.setVirtualizer(this.currentPreset.virtualizer);
    NiLoFiAudioEffects.setLoudnessEnhancer(this.currentPreset.loudnessGain);
  }

  public setBandGain(bandIndex: number, gainDb: number): EqualizerPreset {
    const clampedGain = Math.max(-12, Math.min(12, gainDb));
    const newGains = [...this.currentPreset.gains];
    newGains[bandIndex] = clampedGain;

    const updated: EqualizerPreset = {
      ...this.currentPreset,
      id: 'custom_active',
      name: 'Custom',
      isCustom: true,
      gains: newGains,
    };

    this.applyPreset(updated);
    return updated;
  }

  public setBassBoost(strength: number): void {
    const clamped = Math.max(0, Math.min(1000, strength));
    this.currentPreset.bassBoost = clamped;
    NiLoFiAudioEffects.setBassBoost(clamped);
  }

  public setVirtualizer(strength: number): void {
    const clamped = Math.max(0, Math.min(1000, strength));
    this.currentPreset.virtualizer = clamped;
    NiLoFiAudioEffects.setVirtualizer(clamped);
  }

  public handleRouteChange(newRoute: AudioOutputRoute): EqualizerPreset | null {
    const targetPresetId = this.routePresets.get(newRoute);
    if (!targetPresetId) return null;

    const matched =
      BUILT_IN_PRESETS.find((p) => p.id === targetPresetId) ||
      this.customPresets.get(targetPresetId);

    if (matched) {
      this.applyPreset(matched);
      return matched;
    }
    return null;
  }

  public getCurrentPreset(): EqualizerPreset {
    return this.currentPreset;
  }

  public getAllPresets(): EqualizerPreset[] {
    return [...BUILT_IN_PRESETS, ...Array.from(this.customPresets.values())];
  }

  public toggleEQ(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.applyPreset(this.currentPreset);
    } else {
      // Zero out hardware effects
      NiLoFiAudioEffects.setEqualizerBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      NiLoFiAudioEffects.setBassBoost(0);
      NiLoFiAudioEffects.setVirtualizer(0);
      NiLoFiAudioEffects.setLoudnessEnhancer(0);
    }
  }
}

export default DSPEngine.getInstance();
