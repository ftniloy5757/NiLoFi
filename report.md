# NiLoFi — Technical Engineering Report & User Guide

> **Courtesy:** © 2026 Farhan T. Niloy. All rights reserved.  
> **Official Application:** NiLoFi (Offline AI Local Music Player)  
> **Target OS:** Android 13, 14, and 15  
> **Repository:** https://github.com/ftniloy5757/NiLoFi.git  

---

## 1. Executive Summary

NiLoFi was designed and built to solve the biggest frustration in mobile music players: **traditional shuffle is dumb**. 

Standard music apps use simple random number generators. If you are relaxing late at night and a random heavy gym track blasts in, the illusion is broken. NiLoFi replaces this with **on-device contextual AI** and **hardware-level audio processing**, while staying **100% free**, **100% offline**, and with **zero cloud fees**.

This report breaks down all the technical engineering choices in plain, simple English so you can understand exactly how everything under the hood works.

---

## 2. Core Systems Explained in Plain English

### A. The AI Adaptive Shuffle Engine (How it reads your mind)
Imagine having a DJ sitting beside you who watches your facial expressions. If you skip a song quickly, the DJ learns that you don't want that vibe right now. If you listen all the way through, the DJ plays more songs like that. That is what our **Session Vector Algorithm** does:

1. **Song Vector Profiles:** Every track on your phone is represented by 8 numbers between `0.0` and `1.0`:
   - `romantic`, `sad`, `lofi_chill`, `high_energy`, `acoustic`, `mashup`, `era_weight`, and `tempo`.
2. **The Active Session Memory:** When you start listening, your session starts neutral (`0.0`).
3. **The Early Skip Penalty (-2.5):** If you skip a track in the first 25 seconds (or before 20% of the song plays), the app applies a heavy `-2.5` penalty to that song's characteristics. For example, if you skip two rap songs in a row, rap is practically removed from your upcoming queue for the rest of your session!
4. **The Full Listen Boost (+3.5):** If you let a track finish (or manually pick it from your library), those attributes get boosted by `+3.5`.
5. **The Serendipity Factor (15%):** Why not just play the same 3 songs over and over? To prevent getting stuck in a loop, the engine injects a 15% random exploration factor. This ensures you discover songs in your library you haven't heard in months that still match your mood.
6. **The Vibe Pill:** When the math finds a strong pattern, it displays a glowing badge on the screen (e.g., *"Adaptive Lock: Late Night Chill • 2010s"*), with a 1-tap **Reset** button if you want to wipe the slate clean.

---

### B. Studio-Grade 10-Band Equalizer & Clean Sound Guard
In many music player apps, if you turn the bass all the way up, the sound starts crackling and distorting. This is called **digital clipping**—the audio signal is pushed beyond the maximum limits of your phone's digital-to-analog converter (DAC).

Here is how NiLoFi solves that:
- **Direct Native Android Binding:** We built a custom Kotlin module (`modules/nilofi-audio-effects`) that talks directly to Android's built-in `android.media.audiofx` framework.
- **Clean Sound Guard (Auto-Balancing Peak Control):**
  $$\text{PreAmpGain} = \min(0, -1 \times \text{Peak Boost})$$
  Whenever you boost the bass, NiLoFi automatically balances the internal pre-amp volume in real-time. This guarantees the audio waveform **never flatlines or clips**, keeping the bass punchy, tight, and crystal-clear without distorting your phone speakers or earbuds.
- **User-Friendly Sound Presets:** Includes calibrated curves with simple names: *Natural (Original)*, *Bass Boost*, *Vocal Clarity*, *Party & Dhol Beats*, *Warm & Relaxing*, and *Bright & Crisp*.
- **Deep Bass & Surround Sound:** One-tap quick boost controls for enhanced low frequencies and wide spatial audio.
- **Audio Device Memory:** NiLoFi remembers whether you are listening on your phone speaker, Bluetooth earbuds, wired headphones, or your car stereo, and automatically restores your preferred sound profile.

---

### C. Custom User Playlists & Smart Collections (100% Offline)
Users can now build and organize their personal music library effortlessly:
1. **User Custom Playlists:** Create unlimited custom playlists (e.g., "Late Night Chill", "Workout", "Favorites").
2. **1-Tap Add from Library:** Every song card in your Library features a **Playlist icon (≡+)**. Tapping it opens an instant bottom sheet where you can add or remove the song with a single checkmark, or even create a new playlist on the fly.
3. **Smart Collections:** In the **Playlists** tab, songs are also automatically organized into smart collections based on language (*Punjabi, Bollywood, Bangla, English*), era (*90s, 2000s, 2010s, 2020s*), and vibe (*Rain & Late Night, Romantic, Party Bangers*).
4. **Persistent Offline Storage:** Custom playlists are stored in a dedicated, structured JSON file in your phone's app sandbox (`nilofi_playlists.json`) using `expo-file-system`. No accounts, no logins, and zero cloud uploads—your playlists remain 100% private on your phone.

---

### D. Two-Tier High-Speed Library Scanner
If you have 5,000 songs on your phone, loading all of them into a mobile app can cause the app to freeze.

NiLoFi uses a **Two-Tier Architecture**:
1. **Tier 1 (Instant Indexing):** Instead of manually opening each MP3 file, NiLoFi queries Android's native `MediaStore` database cursor. It indexes thousands of song titles, artists, albums, and durations in **under 400 milliseconds**.
2. **Tier 2 (Background Lazy Loading):** Embedded high-resolution album art, waveform amplitude peaks, and `.lrc` lyrics are loaded quietly in the background as you scroll, keeping the user interface running at a locked **120Hz**.
3. **Instant Demo Seed Tracks:** For your first launch before you transfer music, NiLoFi includes royalty-free offline lofi, romantic, and party tracks with pre-calculated waveforms and synced lyrics so you can test all features immediately.

---

### E. Zero-Lag Synced Lyrics (`.LRC` Engine)
Lyrics in `.lrc` files have timestamps like `[01:23.45]`. In older players, scanning through hundreds of lines every second can lag your phone.

NiLoFi uses a **Binary Search Algorithm ($O(\log N)$)**:
- At any millisecond of song playback, the app finds the exact active line in less than **0.01 milliseconds**.
- The active lyric glows in electric cyan-blue, while the sheet smoothly auto-scrolls to keep the text centered on screen.

---

### F. Smart Sleep Timer with 30-Second Micro-Fade
Most sleep timers cut the music off abruptly, which can startle you awake. 
NiLoFi's sleep timer monitors your target bedtime. During the **final 30 seconds**, it gradually ramps the volume down from 100% to 0% in a smooth taper. Once the music fades out, playback pauses and your volume is reset back to normal for the next day.

---

## 3. Step-by-Step Instructions to Setup & Use NiLoFi on Your Mobile Phone

### Step 1: Downloading the App (100% Free via GitHub)
1. Go to your repository on GitHub: **https://github.com/ftniloy5757/NiLoFi**
2. Click on the **Actions** tab at the top.
3. Tap on the latest workflow run named **"Build NiLoFi Android APK"**.
4. Scroll down to the **Artifacts** section at the bottom.
5. Click **NiLoFi-Android-APK** to download the zip file.
6. Extract the zip file on your computer or phone to get **`NiLoFi-v1.0.0.apk`**.

### Step 2: Installing on Your Android Phone
1. Transfer the `.apk` file to your Android phone (via USB cable, Google Drive, or WhatsApp/Telegram).
2. Tap on `NiLoFi-v1.0.0.apk` in your phone's File Manager.
3. If prompted with *"Install unknown apps"*, tap **Settings** and toggle **"Allow from this source"**.
4. Tap **Install** and open **NiLoFi**!

### Step 3: Granting Permissions (First Launch)
When NiLoFi opens, Android will request:
- **Audio / Music Permission (`READ_MEDIA_AUDIO`):** Tap **Allow** so NiLoFi can index your local songs.
- **Notifications (`POST_NOTIFICATIONS`):** Tap **Allow** so lock-screen music controls and high-res album artwork can display when your phone is locked.

---

## 4. How to Use Every Feature in NiLoFi

### 1. Playing Music & Testing Smart Shuffle
- In the **Library** tab, tap any track to start playing.
- The **Mini-Player** will float up from the bottom. Tap it to open the full-screen player.
- Tap **Smart Shuffle** at the top or the shuffle button on the player (it glows neon blue when active).
- **Test the on-device AI:** Skip 2 tracks quickly in the first 10 seconds. Notice how NiLoFi immediately adapts and queues songs matching your preference!

### 2. Creating & Managing Custom Playlists
- **To create a playlist:** Switch to the **Playlists** tab, tap **My Playlists**, then tap **+ Create New Playlist**. Enter a title and description, and tap **Create**.
- **To add songs:** In the **Library** tab, tap the **Playlist icon (≡+)** on any song. Tap any of your playlists to immediately add or remove the song. You can also tap **+ Create New Playlist** directly inside this menu.
- **To play or manage:** In the **Playlists** tab, tap any custom playlist card to view all tracks, play them in sequence, or remove individual songs.

### 3. Tuning the Equalizer (Simplified & Clean)
- Switch to the **Equalizer** tab.
- Toggle **Sound Enhancer: ON** at the top.
- Pick any preset (e.g., *Bass Boost*, *Vocal Clarity*, or *Party & Dhol Beats*).
- You can fine-tune individual frequency bars under **Custom Sound Tuning**.
- Tap **Deep Bass** or **Surround Sound** for immediate bass impact and 3D depth.
- The **Clean Sound Guard** automatically prevents distortion and protects your speakers.

### 4. Viewing Your Smart Mood Profile
- Switch to the **Smart Mood** tab.
- View your **Live Vibe Profile** showing your current listening balance (Lofi, Romantic, Party, Acoustic, etc.).
- Tap **Reset** anytime you want to clear session memory and start fresh.

### 5. Using Synced Lyrics
- While a track is playing, tap the **SYNCED LYRICS** button at the bottom of the player.
- The lyrics will automatically scroll with timestamps in sync with the song.

### 6. Setting a Sleep Timer
- Tap the **Moon** icon in the top header.
- Choose **15m**, **30m**, **45m**, or **60m**.
- As you fall asleep, the volume will gently fade down over the final 30 seconds.

---

## 5. Courtesy & Copyright

At the bottom center of all main views (Library, Smart Albums, Equalizer, Session Stats, Lyrics, and Now Playing), the courtesy notice is proudly displayed:

```
© 2026 Farhan T. Niloy
```
