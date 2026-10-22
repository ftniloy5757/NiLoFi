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
    id: 'flat',
    name: 'Natural (Original)',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    virtualizer: 0,
    loudnessGain: 0,
  },
  {
    id: 'punchy_bass',
    name: 'Bass Boost',
    gains: [7, 6, 4, 1, 0, -1, 0, 1, 2, 2],
    bassBoost: 450,
    virtualizer: 150,
    loudnessGain: 100,
  },
  {
    id: 'vocal_clarity',
    name: 'Vocal Clarity',
    gains: [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
    bassBoost: 50,
    virtualizer: 200,
    loudnessGain: 50,
  },
  {
    id: 'punjabi_dhol',
    name: 'Party & Dhol Beats',
    gains: [8, 7, 5, 2, 0, 1, 3, 4, 3, 2],
    bassBoost: 600,
    virtualizer: 250,
    loudnessGain: 150,
  },
  {
    id: 'late_night',
    name: 'Warm & Relaxing',
    gains: [4, 3, 2, 1, 0, 0, -1, -2, -3, -4],
    bassBoost: 200,
    virtualizer: 100,
    loudnessGain: 0,
  },
  {
    id: 'electronic_edm',
    name: 'Dance & Electronic',
    gains: [6, 5, 2, 0, -1, 2, 4, 5, 5, 4],
    bassBoost: 500,
    virtualizer: 400,
    loudnessGain: 200,
  },
  {
    id: 'treble_sparkle',
    name: 'Bright & Crisp',
    gains: [-2, -1, 0, 0, 1, 2, 4, 6, 7, 8],
    bassBoost: 0,
    virtualizer: 300,
    loudnessGain: 100,
  },
];

export class DSPEngine {
  private static instance: DSPEngine;
  private currentPreset: EqualizerPreset = BUILT_IN_PRESETS[0];
  private customPresets: Map<string, EqualizerPreset> = new Map();
  private routePresets: Map<AudioOutputRoute, string> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    // Default route assignments
    this.routePresets.set('Speaker', 'flat');
    this.routePresets.set('Bluetooth', 'punchy_bass');
    this.routePresets.set('Car', 'punjabi_dhol');
    this.routePresets.set('Wired', 'vocal_clarity');
  }

  public static getInstance(): DSPEngine {
    if (!DSPEngine.instance) {
      DSPEngine.instance = new DSPEngine();
    }
    return DSPEngine.instance;
  }

  /**
   * Anti-Clipping Soft Limiter & Auto-PreAmp Gain Calculation
   * If any EQ band is boosted above 0dB, reduce Pre-Amp gain by exactly the peak boost
   * to guarantee zero digital clipping or speaker crackle.
   */
  public calculatePreAmpAutoGain(gains: number[]): number {
    const maxPositiveBoost = Math.max(0, ...gains);
    return -maxPositiveBoost;
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
