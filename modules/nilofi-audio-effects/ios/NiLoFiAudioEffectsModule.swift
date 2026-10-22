import ExpoModulesCore
import AVFoundation

public final class NiLoFiAudioEffectsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NiLoFiAudioEffects")

    Function("attachSession") { (sessionId: Int) -> Bool in
      do {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playback, mode: .default, policy: .longFormAudio, options: [])
        try audioSession.setActive(true)
        return true
      } catch {
        return false
      }
    }

    Function("setEqualizerBands") { (gains: [Double]) -> Bool in
      return true
    }

    Function("setBassBoost") { (strength: Int) -> Bool in
      return true
    }

    Function("setVirtualizer") { (strength: Int) -> Bool in
      return true
    }

    Function("setLoudnessEnhancer") { (gainMb: Int) -> Bool in
      return true
    }

    Function("release") { () -> Bool in
      return true
    }
  }
}
