import { requireNativeModule } from 'expo-modules-core';

export interface AudioEffectsCapabilities {
  hasDolbyHardware: boolean;
  hasSpatializer: boolean;
  bandsCount: number;
}

interface AudioEffectsNative {
  attachSession(sessionId: number): boolean;
  setEqualizerBands(gains: number[]): boolean;
  setBassBoost(strength: number): boolean;
  setVirtualizer(strength: number): boolean;
  setLoudnessEnhancer(gainMb: number): boolean;
  setDolbyAtmos?(enabled: boolean, strength: number): boolean;
  getAudioEffectsCapabilities?(): AudioEffectsCapabilities;
  release(): boolean;
  exitApp?(): boolean;
}

let nativeModule: AudioEffectsNative | null = null;
try {
  nativeModule = requireNativeModule<AudioEffectsNative>('NiLoFiAudioEffects');
} catch {
  // Graceful fallback for non-Android / Expo Go mock environments
  nativeModule = null;
}

export const NiLoFiAudioEffects = {
  isAvailable(): boolean {
    return nativeModule !== null;
  },

  attachSession(sessionId: number): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.attachSession(sessionId);
    } catch {
      return false;
    }
  },

  setEqualizerBands(gains: number[]): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.setEqualizerBands(gains);
    } catch {
      return false;
    }
  },

  setBassBoost(strength: number): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.setBassBoost(strength);
    } catch {
      return false;
    }
  },

  setVirtualizer(strength: number): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.setVirtualizer(strength);
    } catch {
      return false;
    }
  },

  setLoudnessEnhancer(gainMb: number): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.setLoudnessEnhancer(gainMb);
    } catch {
      return false;
    }
  },

  setDolbyAtmos(enabled: boolean, strength: number = 850): boolean {
    if (!nativeModule || !nativeModule.setDolbyAtmos) return true;
    try {
      return nativeModule.setDolbyAtmos(enabled, strength);
    } catch {
      return false;
    }
  },

  getCapabilities(): AudioEffectsCapabilities {
    if (!nativeModule || !nativeModule.getAudioEffectsCapabilities) {
      return { hasDolbyHardware: false, hasSpatializer: false, bandsCount: 10 };
    }
    try {
      return nativeModule.getAudioEffectsCapabilities();
    } catch {
      return { hasDolbyHardware: false, hasSpatializer: false, bandsCount: 10 };
    }
  },

  release(): boolean {
    if (!nativeModule) return true;
    try {
      return nativeModule.release();
    } catch {
      return false;
    }
  },

  exitApp(): boolean {
    if (!nativeModule || !nativeModule.exitApp) return true;
    try {
      return nativeModule.exitApp();
    } catch {
      return false;
    }
  }
};

export default NiLoFiAudioEffects;
