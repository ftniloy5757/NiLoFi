package expo.modules.audioeffects

import android.content.Context
import android.media.AudioManager
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
        private val USER_FREQUENCIES = doubleArrayOf(
            31.0, 62.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0
        )
    }

    override fun definition() = ModuleDefinition {
        Name("NiLoFiAudioEffects")

        Function("attachSession") { sessionId: Int ->
            attachInternal(sessionId)
        }

        Function("setEqualizerBands") { gains: List<Double> ->
            lastGains = gains
            ensureAttached()
            applyGainsInternal(gains)
        }

        Function("setBassBoost") { strength: Int ->
            lastBassBoost = strength
            ensureAttached()
            applyBassBoostInternal(strength)
        }

        Function("setVirtualizer") { strength: Int ->
            lastVirtualizer = strength
            ensureAttached()
            applyVirtualizerInternal(strength)
        }

        Function("setLoudnessEnhancer") { gainMb: Int ->
            lastLoudness = gainMb
            ensureAttached()
            applyLoudnessInternal(gainMb)
        }

        Function("release") {
            releaseEffects()
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
            Log.d(TAG, "MusicService reflection check: ${e.message}")
        }

        // 2. Generate a valid audio session id via system AudioManager
        try {
            val context = appContext.reactContext ?: appContext.currentActivity
            val audioManager = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            val genId = audioManager?.generateAudioSessionId() ?: 0
            if (genId > 0) {
                Log.d(TAG, "Generated fresh audio session from AudioManager: $genId")
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

    private fun attachInternal(sessionId: Int): Boolean {
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
        Log.i(TAG, "Attaching hardware audio effects to audioSessionId: $targetSessionId")

        // 1. Equalizer
        try {
            equalizer = Equalizer(0, targetSessionId).apply {
                enabled = true
            }
            Log.i(TAG, "Equalizer initialized successfully with ${equalizer?.numberOfBands} bands")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Equalizer: ${e.message}")
        }

        // 2. BassBoost
        try {
            bassBoost = BassBoost(0, targetSessionId).apply {
                if (strengthSupported) {
                    enabled = true
                }
            }
            Log.i(TAG, "BassBoost initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize BassBoost: ${e.message}")
        }

        // 3. Virtualizer
        try {
            virtualizer = Virtualizer(0, targetSessionId).apply {
                if (strengthSupported) {
                    enabled = true
                }
            }
            Log.i(TAG, "Virtualizer initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Virtualizer: ${e.message}")
        }

        // 4. LoudnessEnhancer
        try {
            loudnessEnhancer = LoudnessEnhancer(targetSessionId).apply {
                enabled = true
            }
            Log.i(TAG, "LoudnessEnhancer initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize LoudnessEnhancer: ${e.message}")
        }

        // Reapply cached settings
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

            for (b in 0 until numBands) {
                // center frequency in Hz
                val centerHz = eq.getCenterFreq(b.toShort()) / 1000.0
                val targetGainDb = interpolateGain(centerHz, gains)
                // gain is in dB (-12 to +12), convert to millibels (-1200 to +1200)
                val millibels = (targetGainDb * 100).toInt().coerceIn(minLevel.toInt(), maxLevel.toInt()).toShort()
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
                bb.setStrength(strength.coerceIn(0, 1000).toShort())
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
                virt.setStrength(strength.coerceIn(0, 1000).toShort())
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
