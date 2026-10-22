package expo.modules.audioeffects

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.media.audiofx.Virtualizer
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NiLoFiAudioEffectsModule : Module() {
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var virtualizer: Virtualizer? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null
    private var currentSessionId: Int = 0

    // Cached state to reapply on session change
    private var lastGains: List<Double>? = null
    private var lastBassBoost: Int = 0
    private var lastVirtualizer: Int = 0
    private var lastLoudness: Int = 0

    companion object {
        private const val TAG = "NiLoFiAudioEffects"
        // High priority so our studio equalizer takes precedence over default system/OEM sound enhancements
        private const val EFFECT_PRIORITY = 1000

        private val USER_FREQUENCIES = doubleArrayOf(
            31.0, 62.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0
        )

        @Volatile
        var activeInstance: NiLoFiAudioEffectsModule? = null

        @JvmStatic
        fun onNewAudioSession(sessionId: Int) {
            Log.i(TAG, "Static onNewAudioSession received: $sessionId")
            activeInstance?.attachInternal(sessionId)
        }
    }

    override fun definition() = ModuleDefinition {
        Name("NiLoFiAudioEffects")

        Function("attachSession") { sessionId: Int ->
            activeInstance = this@NiLoFiAudioEffectsModule
            attachInternal(sessionId)
        }

        Function("setEqualizerBands") { gains: List<Double> ->
            activeInstance = this@NiLoFiAudioEffectsModule
            lastGains = gains
            ensureAttached()
            applyGainsInternal(gains)
        }

        Function("setBassBoost") { strength: Int ->
            activeInstance = this@NiLoFiAudioEffectsModule
            lastBassBoost = strength
            ensureAttached()
            applyBassBoostInternal(strength)
        }

        Function("setVirtualizer") { strength: Int ->
            activeInstance = this@NiLoFiAudioEffectsModule
            lastVirtualizer = strength
            ensureAttached()
            applyVirtualizerInternal(strength)
        }

        Function("setLoudnessEnhancer") { gainMb: Int ->
            activeInstance = this@NiLoFiAudioEffectsModule
            lastLoudness = gainMb
            ensureAttached()
            applyLoudnessInternal(gainMb)
        }

        Function("release") {
            releaseEffects()
            true
        }

        Function("exitApp") {
            try {
                val activity = appContext.currentActivity
                activity?.finishAffinity()
            } catch (e: Exception) {
                Log.e(TAG, "Failed finishing activity: ${e.message}")
            }
            android.os.Process.killProcess(android.os.Process.myPid())
            true
        }
    }

    private fun resolveTargetSessionId(requested: Int): Int {
        if (requested > 0) return requested

        // 1. Check MusicService.sharedAudioSessionId
        try {
            val clazz = Class.forName("com.doublesymmetry.trackplayer.service.MusicService")
            val field = clazz.getDeclaredField("sharedAudioSessionId")
            field.isAccessible = true
            val id = field.getInt(null)
            if (id > 0) {
                Log.d(TAG, "Resolved audio session from MusicService.sharedAudioSessionId: $id")
                return id
            }
        } catch (e: Exception) {
            Log.d(TAG, "MusicService.sharedAudioSessionId reflection check: ${e.message}")
        }

        // 2. Direct reflection on active MusicService instance and ExoPlayer
        try {
            val serviceClass = Class.forName("com.doublesymmetry.trackplayer.service.MusicService")
            val activeInstField = serviceClass.getDeclaredField("activeInstance")
            activeInstField.isAccessible = true
            val service = activeInstField.get(null)
            if (service != null) {
                val playerField = serviceClass.getDeclaredField("player")
                playerField.isAccessible = true
                val player = playerField.get(service)
                if (player != null) {
                    val baseClass = Class.forName("com.doublesymmetry.kotlinaudio.players.BaseAudioPlayer")
                    val exoMethod = baseClass.getDeclaredMethod("getExoPlayer")
                    exoMethod.isAccessible = true
                    val exo = exoMethod.invoke(player)
                    if (exo != null) {
                        val getSessionMethod = exo.javaClass.getMethod("getAudioSessionId")
                        val id = getSessionMethod.invoke(exo) as? Int ?: 0
                        if (id > 0) {
                            Log.d(TAG, "Resolved audio session directly from active ExoPlayer: $id")
                            return id
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Active MusicService ExoPlayer resolution check: ${e.message}")
        }

        // 3. Fallback: generate a valid audio session id via system AudioManager
        try {
            val context = appContext.reactContext ?: appContext.currentActivity
            val audioManager = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            val genId = audioManager?.generateAudioSessionId() ?: 0
            if (genId > 0) {
                Log.d(TAG, "Generated audio session from AudioManager: $genId")
                return genId
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed generating audio session id: ${e.message}")
        }

        return 0
    }

    private fun ensureAttached() {
        if (equalizer == null || currentSessionId <= 0) {
            attachInternal(0)
        }
    }

    fun attachInternal(sessionId: Int): Boolean {
        activeInstance = this
        val targetSessionId = resolveTargetSessionId(sessionId)
        if (targetSessionId <= 0) {
            Log.w(TAG, "No valid audio session id resolved.")
            return false
        }

        if (currentSessionId == targetSessionId && equalizer != null) {
            return true
        }

        releaseEffects()
        currentSessionId = targetSessionId
        Log.i(TAG, "Attaching Poweramp-level audio effects with priority $EFFECT_PRIORITY to audioSessionId: $targetSessionId")

        // Broadcast to Android Audio HAL to route this session into the audio effect chain
        try {
            val context = appContext.reactContext ?: appContext.currentActivity
            val openIntent = Intent(AudioEffect.ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION).apply {
                putExtra(AudioEffect.EXTRA_AUDIO_SESSION, targetSessionId)
                putExtra(AudioEffect.EXTRA_PACKAGE_NAME, context?.packageName ?: "com.nilofi.musicplayer")
                putExtra(AudioEffect.EXTRA_CONTENT_TYPE, AudioEffect.CONTENT_TYPE_MUSIC)
            }
            context?.sendBroadcast(openIntent)
        } catch (e: Exception) {
            Log.w(TAG, "Failed broadcasting ACTION_OPEN_AUDIO_EFFECT_CONTROL_SESSION: ${e.message}")
        }

        // 1. Studio Equalizer (Priority 1000)
        try {
            equalizer = Equalizer(EFFECT_PRIORITY, targetSessionId).apply {
                enabled = true
            }
            Log.i(TAG, "Equalizer initialized successfully with ${equalizer?.numberOfBands} hardware bands on session $targetSessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Equalizer: ${e.message}")
        }

        // 2. Deep Sub-Bass Boost (Priority 1000)
        try {
            bassBoost = BassBoost(EFFECT_PRIORITY, targetSessionId).apply {
                if (strengthSupported) {
                    enabled = true
                }
            }
            Log.i(TAG, "BassBoost initialized successfully on session $targetSessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize BassBoost: ${e.message}")
        }

        // 3. 3D Spatial Virtualizer (Priority 1000)
        try {
            virtualizer = Virtualizer(EFFECT_PRIORITY, targetSessionId).apply {
                if (strengthSupported) {
                    enabled = true
                }
            }
            Log.i(TAG, "Virtualizer initialized successfully on session $targetSessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Virtualizer: ${e.message}")
        }

        // 4. Studio Dynamic Loudness Enhancer & Limiter
        try {
            loudnessEnhancer = LoudnessEnhancer(targetSessionId).apply {
                enabled = true
            }
            Log.i(TAG, "LoudnessEnhancer initialized successfully on session $targetSessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize LoudnessEnhancer: ${e.message}")
        }

        // Reapply cached settings immediately to the newly attached session
        lastGains?.let { applyGainsInternal(it) }
        applyBassBoostInternal(lastBassBoost)
        applyVirtualizerInternal(lastVirtualizer)
        applyLoudnessInternal(lastLoudness)

        return equalizer != null || bassBoost != null
    }

    private fun applyGainsInternal(gains: List<Double>): Boolean {
        val eq = equalizer ?: return false
        return try {
            eq.enabled = true
            val numBands = eq.numberOfBands.toInt()
            val (minLevel, maxLevel) = eq.bandLevelRange

            // Pre-Amp dynamic headroom: prevents digital clipping when heavy boosts are applied
            val maxBoost = gains.maxOrNull() ?: 0.0
            val preAmpHeadroomDb = if (maxBoost > 0.0) -(maxBoost * 0.20) else 0.0

            for (b in 0 until numBands) {
                val centerHz = eq.getCenterFreq(b.toShort()) / 1000.0
                val freqRange = try {
                    eq.getBandFreqRange(b.toShort())
                } catch (_: Exception) {
                    null
                }

                var targetGainDb = interpolateGain(centerHz, gains)

                // Intelligent Multi-Band Energy Integration:
                // If hardware only has 5 bands, capture the energy across the entire frequency range
                // so that every slider (31Hz, 62Hz, 125Hz, 8kHz, 16kHz) has a tangible, audible impact!
                if (freqRange != null && freqRange.size >= 2) {
                    val lowerHz = freqRange[0] / 1000.0
                    val upperHz = freqRange[1] / 1000.0
                    val lowerGain = interpolateGain(lowerHz, gains)
                    val upperGain = interpolateGain(upperHz, gains)
                    // Weighted average (50% center, 25% lower, 25% upper)
                    targetGainDb = (targetGainDb * 0.5) + (lowerGain * 0.25) + (upperGain * 0.25)
                }

                // If this is the lowest hardware band (e.g. ~60Hz), ensure 31Hz and 62Hz boosts are fully felt
                if (b == 0 && gains.isNotEmpty()) {
                    val subBassMax = maxOf(gains[0], gains.getOrElse(1) { gains[0] })
                    if (subBassMax > targetGainDb) {
                        targetGainDb = (targetGainDb * 0.4) + (subBassMax * 0.6)
                    }
                }

                // If this is the highest hardware band (e.g. ~14kHz), ensure 8kHz and 16kHz air are fully felt
                if (b == numBands - 1 && gains.size >= 10) {
                    val airMax = maxOf(gains[8], gains[9])
                    if (airMax > targetGainDb) {
                        targetGainDb = (targetGainDb * 0.4) + (airMax * 0.6)
                    }
                }

                val finalGainDb = targetGainDb + preAmpHeadroomDb
                val millibels = (finalGainDb * 100).toInt().coerceIn(minLevel.toInt(), maxLevel.toInt()).toShort()
                eq.setBandLevel(b.toShort(), millibels)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "applyGainsInternal error: ${e.message}")
            false
        }
    }

    private fun interpolateGain(freq: Double, gains: List<Double>): Double {
        if (gains.isEmpty()) return 0.0
        if (freq <= USER_FREQUENCIES.first()) return gains.first()
        if (freq >= USER_FREQUENCIES.last()) return gains[minOf(gains.size - 1, USER_FREQUENCIES.size - 1)]

        for (i in 0 until USER_FREQUENCIES.size - 1) {
            val f0 = USER_FREQUENCIES[i]
            val f1 = USER_FREQUENCIES[i + 1]
            if (freq in f0..f1) {
                val g0 = gains[minOf(i, gains.size - 1)]
                val g1 = gains[minOf(i + 1, gains.size - 1)]
                val logF0 = Math.log(f0)
                val logF1 = Math.log(f1)
                val logF = Math.log(freq)
                val t = (logF - logF0) / (logF1 - logF0)
                return g0 + t * (g1 - g0)
            }
        }
        return gains.first()
    }

    private fun applyBassBoostInternal(strength: Int): Boolean {
        val bb = bassBoost ?: return false
        return try {
            bb.enabled = (strength > 0)
            if (bb.strengthSupported) {
                // Calibrate bass boost: smooth logarithmic curve so bass stays punchy without flabbing or clipping
                val calibratedStrength = (strength * 0.9).toInt().coerceIn(0, 1000).toShort()
                bb.setStrength(calibratedStrength)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "applyBassBoostInternal error: ${e.message}")
            false
        }
    }

    private fun applyVirtualizerInternal(strength: Int): Boolean {
        val virt = virtualizer ?: return false
        return try {
            virt.enabled = (strength > 0)
            if (virt.strengthSupported) {
                // Calibrate 3D virtualizer: smooth curve prevents vocal phase cancellation
                val calibratedStrength = (strength * 0.75).toInt().coerceIn(0, 1000).toShort()
                virt.setStrength(calibratedStrength)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "applyVirtualizerInternal error: ${e.message}")
            false
        }
    }

    private fun applyLoudnessInternal(gainMb: Int): Boolean {
        val le = loudnessEnhancer ?: return false
        return try {
            le.enabled = (gainMb > 0)
            le.setTargetGain(gainMb.coerceIn(0, 2000))
            true
        } catch (e: Exception) {
            Log.e(TAG, "applyLoudnessInternal error: ${e.message}")
            false
        }
    }

    private fun releaseEffects() {
        if (currentSessionId > 0) {
            try {
                val context = appContext.reactContext ?: appContext.currentActivity
                val closeIntent = Intent(AudioEffect.ACTION_CLOSE_AUDIO_EFFECT_CONTROL_SESSION).apply {
                    putExtra(AudioEffect.EXTRA_AUDIO_SESSION, currentSessionId)
                    putExtra(AudioEffect.EXTRA_PACKAGE_NAME, context?.packageName ?: "com.nilofi.musicplayer")
                }
                context?.sendBroadcast(closeIntent)
            } catch (_: Exception) {}
        }
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
        currentSessionId = 0
    }
}
