const fs = require('fs');
const path = require('path');

const musicServicePath = path.resolve(
  __dirname,
  '../node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt'
);

if (!fs.existsSync(musicServicePath)) {
  console.log('[patch-track-player] MusicService.kt not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(musicServicePath, 'utf8');

// 1. Add sharedAudioSessionId and activeInstance to companion object
if (!content.includes('sharedAudioSessionId')) {
  content = content.replace(
    'companion object {',
    `companion object {
        @JvmStatic
        @Volatile
        var sharedAudioSessionId: Int = 0

        @JvmStatic
        @Volatile
        var activeInstance: MusicService? = null`
  );
}

// 2. Add onCreate hook to capture activeInstance
if (!content.includes('override fun onCreate()')) {
  content = content.replace(
    'class MusicService : HeadlessJsTaskService() {',
    `class MusicService : HeadlessJsTaskService() {
    override fun onCreate() {
        super.onCreate()
        activeInstance = this
    }`
  );
}

// 3. Add onDestroy hook cleanup
if (content.includes('override fun onDestroy() {') && !content.includes('activeInstance = null')) {
  content = content.replace(
    'override fun onDestroy() {',
    `override fun onDestroy() {
        if (activeInstance === this) {
            activeInstance = null
        }
        sharedAudioSessionId = 0`
  );
}

// 4. Configure audioSessionId on ExoPlayer in setupPlayer
const setupTarget = 'player = QueuedAudioPlayer(this@MusicService, playerConfig, bufferConfig, cacheConfig)';
const setupReplacement = `player = QueuedAudioPlayer(this@MusicService, playerConfig, bufferConfig, cacheConfig)
        player.automaticallyUpdateNotificationMetadata = automaticallyUpdateNotificationMetadata
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? android.media.AudioManager
            val generatedId = audioManager?.generateAudioSessionId() ?: 0
            val exoMethod = player.javaClass.getMethod("getExoPlayer") ?: player.javaClass.getDeclaredMethod("getExoPlayer")
            exoMethod.isAccessible = true
            val exo = exoMethod.invoke(player) as? com.google.android.exoplayer2.ExoPlayer
            if (exo != null) {
                if (generatedId > 0) {
                    exo.setAudioSessionId(generatedId)
                    sharedAudioSessionId = generatedId
                } else {
                    sharedAudioSessionId = exo.audioSessionId
                }
                Timber.d("NiLoFi: Initialized ExoPlayer with audioSessionId=%s", sharedAudioSessionId)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error configuring audioSessionId on ExoPlayer")
        }`;

if (content.includes(setupTarget) && !content.includes('NiLoFi: Initialized ExoPlayer')) {
  // Replace the next line too since we re-set player.automaticallyUpdateNotificationMetadata
  const targetWithNext = setupTarget + '\n        player.automaticallyUpdateNotificationMetadata = automaticallyUpdateNotificationMetadata';
  if (content.includes(targetWithNext)) {
    content = content.replace(targetWithNext, setupReplacement);
  } else {
    content = content.replace(setupTarget, setupReplacement);
  }
}

// 5. Handle NotificationState.CANCELLED to quit app and stop service when user swipes out notification
const cancelledHandler = `is NotificationState.CANCELLED -> {
                        Timber.d("Notification swiped out / cancelled by user - exiting app")
                        try {
                            player.clear()
                            player.stop()
                        } catch (_: Exception) {}
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            stopForeground(STOP_FOREGROUND_REMOVE)
                        } else {
                            @Suppress("DEPRECATION")
                            stopForeground(true)
                        }
                        stopSelf()
                        android.os.Process.killProcess(android.os.Process.myPid())
                    }
                    else -> {}`;

if (!content.includes('Notification swiped out / cancelled by user')) {
  content = content.replace('else -> {}', cancelledHandler);
}

// 6. Handle MediaSessionCallback.STOP to cleanly quit app
const stopTarget = 'MediaSessionCallback.STOP -> emit(MusicEvents.BUTTON_STOP)';
const stopReplacement = `MediaSessionCallback.STOP -> {
                        emit(MusicEvents.BUTTON_STOP)
                        try {
                            player.clear()
                            player.stop()
                        } catch (_: Exception) {}
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                            stopForeground(STOP_FOREGROUND_REMOVE)
                        } else {
                            @Suppress("DEPRECATION")
                            stopForeground(true)
                        }
                        stopSelf()
                        android.os.Process.killProcess(android.os.Process.myPid())
                    }`;

if (content.includes(stopTarget)) {
  content = content.replace(stopTarget, stopReplacement);
}

fs.writeFileSync(musicServicePath, content, 'utf8');
console.log('[patch-track-player] Successfully patched MusicService.kt for audio effects and swipe-out app termination.');
