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
    id: 'poweramp_v',
    name: 'Poweramp Signature (V-Curve)',
    gains: [7, 6, 3, 0, -2, -1, 1, 3, 5, 6],
    bassBoost: 350,
    virtualizer: 220,
    loudnessGain: 150,
  },
  {
    id: 'deep_subbass',
    name: 'Club & Deep Sub-Bass',
    gains: [9, 8, 4, 1, -2, 0, 2, 3, 4, 4],
    bassBoost: 520,
    virtualizer: 250,
    loudnessGain: 200,
  },
  {
    id: 'audiophile_harman',
    name: 'Audiophile Harman Reference',
    gains: [5.5, 4.0, 1.5, 0, 0, 0.5, 1.0, 2.5, 1.5, 0],
    bassBoost: 80,
    virtualizer: 80,
    loudnessGain: 50,
  },
  {
    id: 'vocal_air',
    name: 'Vocal Clarity & Acoustic Air',
    gains: [-1, 0, 1, -2, 1, 3, 4, 4, 3, 2],
    bassBoost: 40,
    virtualizer: 160,
    loudnessGain: 60,
  },
  {
    id: 'punjabi_dhol',
    name: 'Party & Dhol Beats',
    gains: [8, 7, 5, 1, -1, 1, 3, 4, 4, 3],
    bassBoost: 580,
    virtualizer: 240,
    loudnessGain: 180,
  },
  {
    id: 'rock_metal',
    name: 'Rock & Metal Crunch',
    gains: [5, 6, 3, -1, -3, 0, 3, 5, 5, 4],
    bassBoost: 260,
    virtualizer: 180,
    loudnessGain: 120,
  },
  {
    id: 'hiphop_rnb',
    name: 'Hip-Hop, Trap & 808s',
    gains: [8, 7, 3, 0, 1, 1, 2, 3, 4, 3],
    bassBoost: 480,
    virtualizer: 160,
    loudnessGain: 180,
  },
  {
    id: 'electronic_edm',
    name: 'Dance, EDM & Synthwave',
    gains: [6, 5, 2, -2, -1, 1, 3, 5, 6, 5],
    bassBoost: 400,
    virtualizer: 340,
    loudnessGain: 160,
  },
  {
    id: 'late_night',
    name: 'Warm & Relaxing (Late Night)',
    gains: [4, 3, 2, 1, 0, 0, -1, -2, -3, -5],
    bassBoost: 160,
    virtualizer: 90,
    loudnessGain: 0,
  },
  {
    id: 'flat',
    name: 'Studio Reference (Pure Flat)',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    virtualizer: 0,
    loudnessGain: 0,
  },
];

export class DSPEngine {
  private static instance: DSPEngine;
  private currentPreset: EqualizerPreset = BUILT_IN_PRESETS[0];
  private customPresets: Map<string, EqualizerPreset> = new Map();
  private routePresets: Map<AudioOutputRoute, string> = new Map();
  private isEnabled: boolean = true;

  private constructor() {
    // Poweramp-calibrated default output route assignments
    this.routePresets.set('Speaker', 'poweramp_v');
    this.routePresets.set('Bluetooth', 'poweramp_v');
    this.routePresets.set('Car', 'punjabi_dhol');
    this.routePresets.set('Wired', 'audiophile_harman');
  }

  public static getInstance(): DSPEngine {
    if (!DSPEngine.instance) {
      DSPEngine.instance = new DSPEngine();
    }
    return DSPEngine.instance;
  }

  /**
   * Studio Anti-Clipping Soft Limiter & Auto-PreAmp Headroom Calculation
   * If any EQ band is boosted above 0dB, calculate required Pre-Amp headroom
   * to guarantee zero digital clipping, no buzzing, and zero harsh volume pumping.
   */
  public calculatePreAmpAutoGain(gains: number[]): number {
    const maxPositiveBoost = Math.max(0, ...gains);
    return maxPositiveBoost > 0 ? -Number((maxPositiveBoost * 0.25).toFixed(1)) : 0;
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
