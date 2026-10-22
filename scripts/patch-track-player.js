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

// 1. Companion Object: sharedAudioSessionId and activeInstance
if (!content.includes('var sharedAudioSessionId: Int')) {
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

// 2. Class definition and onCreate with Notification dismiss broadcast receiver
const onCreateHook = `    private val notificationDismissReceiver = object : android.content.BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            Timber.d("NiLoFi: ACTION_DISMISS_NOTIFICATION received -> Quitting app.")
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
    }

    override fun onCreate() {
        super.onCreate()
        activeInstance = this
        try {
            val filter = android.content.IntentFilter("com.nilofi.musicplayer.ACTION_DISMISS_NOTIFICATION")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(notificationDismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(notificationDismissReceiver, filter)
            }
        } catch (e: Exception) {
            Timber.e(e, "Error registering notificationDismissReceiver")
        }
    }`;

if (content.includes('notificationDismissReceiver')) {
  // Update existing onCreate definition if needed
  const startIdx = content.indexOf('private val notificationDismissReceiver');
  const endIdx = content.indexOf('private lateinit var player: QueuedAudioPlayer');
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + onCreateHook + '\n    ' + content.substring(endIdx);
  }
} else if (content.includes('override fun onCreate()')) {
  const startIdx = content.indexOf('override fun onCreate()');
  const endIdx = content.indexOf('private lateinit var player: QueuedAudioPlayer');
  if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + onCreateHook + '\n    ' + content.substring(endIdx);
  }
} else {
  content = content.replace(
    'class MusicService : HeadlessJsTaskService() {',
    `class MusicService : HeadlessJsTaskService() {\n${onCreateHook}`
  );
}

// 3. onDestroy: Clean up receiver and activeInstance
const onDestroyHook = `    @MainThread
    override fun onDestroy() {
        try {
            unregisterReceiver(notificationDismissReceiver)
        } catch (_: Exception) {}
        if (activeInstance === this) {
            activeInstance = null
        }
        sharedAudioSessionId = 0`;

if (content.includes('override fun onDestroy() {')) {
  const onDestroyPattern = /@MainThread\s+override fun onDestroy\(\) \{[\s\S]*?(?=super\.onDestroy\(\))/;
  if (onDestroyPattern.test(content)) {
    content = content.replace(onDestroyPattern, `${onDestroyHook}\n        `);
  }
}

// 4. setupPlayer: BaseAudioPlayer reflection to ExoPlayer & audioSessionId listener
const setupPlayerReplacement = `player = QueuedAudioPlayer(this@MusicService, playerConfig, bufferConfig, cacheConfig)
        player.automaticallyUpdateNotificationMetadata = automaticallyUpdateNotificationMetadata
        try {
            val baseClass = Class.forName("com.doublesymmetry.kotlinaudio.players.BaseAudioPlayer")
            val exoMethod = baseClass.getDeclaredMethod("getExoPlayer")
            exoMethod.isAccessible = true
            val exo = exoMethod.invoke(player) as? com.google.android.exoplayer2.ExoPlayer
            if (exo != null) {
                val audioManager = getSystemService(Context.AUDIO_SERVICE) as? android.media.AudioManager
                val generatedId = audioManager?.generateAudioSessionId() ?: 0
                if (generatedId > 0) {
                    exo.setAudioSessionId(generatedId)
                    sharedAudioSessionId = generatedId
                } else if (exo.audioSessionId > 0) {
                    sharedAudioSessionId = exo.audioSessionId
                }

                exo.addListener(object : com.google.android.exoplayer2.Player.Listener {
                    override fun onAudioSessionIdChanged(audioSessionId: Int) {
                        if (audioSessionId > 0) {
                            sharedAudioSessionId = audioSessionId
                            Timber.d("NiLoFi: onAudioSessionIdChanged: %s", audioSessionId)
                            try {
                                val effectsModuleClass = Class.forName("expo.modules.audioeffects.NiLoFiAudioEffectsModule")
                                val onSessionMethod = effectsModuleClass.getDeclaredMethod("onNewAudioSession", Int::class.javaPrimitiveType)
                                onSessionMethod.invoke(null, audioSessionId)
                            } catch (t: Throwable) {
                                Timber.w(t, "Could not notify NiLoFiAudioEffectsModule: %s", t.message)
                            }
                        }
                    }
                })
                Timber.d("NiLoFi: Initialized ExoPlayer with audioSessionId=%s", sharedAudioSessionId)
                try {
                    val effectsModuleClass = Class.forName("expo.modules.audioeffects.NiLoFiAudioEffectsModule")
                    val onSessionMethod = effectsModuleClass.getDeclaredMethod("onNewAudioSession", Int::class.javaPrimitiveType)
                    onSessionMethod.invoke(null, sharedAudioSessionId)
                } catch (_: Throwable) {}
            }
        } catch (e: Exception) {
            Timber.e(e, "Error configuring audioSessionId on ExoPlayer")
        }`;

const setupPattern = /player = QueuedAudioPlayer\(this@MusicService, playerConfig, bufferConfig, cacheConfig\)[\s\S]*?(?=observeEvents\(\))/;
if (setupPattern.test(content)) {
  content = content.replace(setupPattern, `${setupPlayerReplacement}\n        `);
}

// 5. NotificationState.POSTED: Attach deleteIntent so swiping out triggers dismiss receiver
const postedTarget = `notificationId = it.notificationId;
                        notification = it.notification;`;
const postedReplacement = `notificationId = it.notificationId;
                        notification = it.notification;
                        try {
                            val dismissIntent = Intent("com.nilofi.musicplayer.ACTION_DISMISS_NOTIFICATION").apply {
                                setPackage(packageName)
                            }
                            val dismissFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                            } else {
                                PendingIntent.FLAG_UPDATE_CURRENT
                            }
                            it.notification.deleteIntent = PendingIntent.getBroadcast(this@MusicService, 9999, dismissIntent, dismissFlags)
                        } catch (e: Exception) {
                            Timber.e(e, "Error attaching deleteIntent to notification")
                        }`;

if (!content.includes('ACTION_DISMISS_NOTIFICATION").apply')) {
  content = content.replace(postedTarget, postedReplacement);
}

// 6. NotificationState.CANCELLED: Clean exit
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

// 7. MediaSessionCallback.STOP: Clean exit
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
console.log('[patch-track-player] Successfully patched MusicService.kt for audio effects and notification swipe-out app termination.');
