package expo.modules.audioeffects

import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.media.audiofx.Virtualizer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NiLoFiAudioEffectsModule : Module() {
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var virtualizer: Virtualizer? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null
    private var currentSessionId: Int = 0

    override fun definition() = ModuleDefinition {
        Name("NiLoFiAudioEffects")

        Function("attachSession") { sessionId: Int ->
            try {
                releaseEffects()
                currentSessionId = sessionId
                
                // Priority 0, audio session id
                equalizer = Equalizer(0, sessionId).apply {
                    enabled = true
                }
                bassBoost = BassBoost(0, sessionId).apply {
                    enabled = true
                }
                virtualizer = Virtualizer(0, sessionId).apply {
                    enabled = true
                }
                loudnessEnhancer = LoudnessEnhancer(sessionId).apply {
                    enabled = true
                }
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        Function("setEqualizerBands") { gains: List<Double> ->
            try {
                equalizer?.let { eq ->
                    val numBands = eq.numberOfBands.toInt()
                    val (minLevel, maxLevel) = eq.bandLevelRange
                    
                    for (i in 0 until minOf(numBands, gains.size)) {
                        // gain is in dB (-12 to +12), convert to millibels (-1200 to +1200)
                        val millibels = (gains[i] * 100).toInt().coerceIn(minLevel.toInt(), maxLevel.toInt()).toShort()
                        eq.setBandLevel(i.toShort(), millibels)
                    }
                    true
                } ?: false
            } catch (e: Exception) {
                false
            }
        }

        Function("setBassBoost") { strength: Int ->
            try {
                bassBoost?.let { bb ->
                    // strength 0 to 1000
                    bb.setStrength(strength.coerceIn(0, 1000).toShort())
                    true
                } ?: false
            } catch (e: Exception) {
                false
            }
        }

        Function("setVirtualizer") { strength: Int ->
            try {
                virtualizer?.let { virt ->
                    // strength 0 to 1000
                    virt.setStrength(strength.coerceIn(0, 1000).toShort())
                    true
                } ?: false
            } catch (e: Exception) {
                false
            }
        }

        Function("setLoudnessEnhancer") { gainMb: Int ->
            try {
                loudnessEnhancer?.let { le ->
                    // Target gain in millibels
                    le.setTargetGain(gainMb.coerceIn(0, 2000))
                    true
                } ?: false
            } catch (e: Exception) {
                false
            }
        }

        Function("release") {
            releaseEffects()
            true
        }
    }

    private fun releaseEffects() {
        try {
            equalizer?.release()
            bassBoost?.release()
            virtualizer?.release()
            loudnessEnhancer?.release()
        } catch (_: Exception) {}
        equalizer = null
        bassBoost = null
        virtualizer = null
        loudnessEnhancer = null
    }
}
