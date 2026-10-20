# NiLoFi — Technical Specification & Execution Blueprint

# Role & Objective
Act as a Staff Mobile Audio Systems Engineer and Principal UI/UX Designer. Build a complete, production-ready, offline-first, 100% free-tier **Local Android Music Player App named "NiLoFi"** using **React Native (Expo SDK 52 Bare/Prebuild workflow with TypeScript)**.

The goal is to surpass apps like Poweramp, Musicolet, and Samsung Music by combining a zero-distortion native DSP audio engine, a session-aware AI Adaptive Shuffle algorithm, automated smart playlist categorization (by language, era, and mood), native Android lock-screen controls (including Shuffle toggle), and an ultra-minimalistic OLED dark aesthetic.

**Core Principles:**
1. **100% Free-Tier & Zero Cloud Dependency:** No paid APIs, no recurring costs, no subscriptions, and no cloud data storage. All AI recommendations, vector scoring, audio effects, and metadata indexing run strictly on-device.
2. **Branding & Courtesy:** App name is **NiLoFi**, with `assets/logo.png` as its official identity. Every screen contains the bottom-center courtesy notice: `"© 2026 Farhan T. Niloy"`.
3. **Repository Destination:** Configured for GitHub publication at `https://github.com/ftniloy5757/NiLoFi.git`.

---

# 1. Tech Stack & Native Android Architecture
- **Framework:** React Native 0.76+ / Expo SDK 52 with Custom Native Prebuild / Bare Android support + TypeScript.
- **Styling & Animations:** Custom StyleSheet / NativeWind with strict OLED palette + `react-native-reanimated` (120Hz gesture-driven sheet & visualizer transitions) + `lucide-react-native` icons.
- **Core Audio & Background Service:** `react-native-track-player` (configured with persistent Android Foreground `MediaBrowserService`, gapless playback, and custom lock-screen notification actions).
- **Native Android DSP Module (`modules/nilofi-audio-effects`):**
  - Directly binds to Android's native `android.media.audiofx.Equalizer`, `BassBoost`, `Virtualizer`, and `LoudnessEnhancer` via the ExoPlayer `audioSessionId`.
  - Real-time pre-amp auto-gain calculation to prevent hardware clipping or distortion.
- **Local File & Two-Tier Metadata Scanner:**
  - *Tier 1 (Instant):* Native Android `MediaStore.Audio.Media` cursor indexer via `expo-media-library` to catalogue thousands of tracks in milliseconds.
  - *Tier 2 (Deep Background):* Async worker parsing embedded USLT/SYLT lyrics, high-res ID3 art, and folder `.lrc` files.
- **Local Database & Cache:** `react-native-mmkv` / fast persistent storage for user preferences, custom EQ presets, adaptive session vector weights, and playback history.

---

# 2. Complete Feature Specifications

## A. Studio-Grade DSP Audio Engine, Anti-Clipping & 10-Band Equalizer
1. **10-Band Hardware-Linked Graphic Equalizer:**
   - Frequencies: `31Hz`, `62Hz`, `125Hz`, `250Hz`, `500Hz`, `1kHz`, `2kHz`, `4kHz`, `8kHz`, `16kHz`.
   - Gain Range: `-12dB` to `+12dB`.
2. **Anti-Clipping Soft Limiter & Auto-Preamp Gain:**
   - Dynamically calculates: `PreAmpGain = min(0, -1 * max(BandGain_i)) dB`.
   - Prevents harmonic distortion and speaker blowout when bass bands are heavily boosted.
3. **Scientifically Tuned Built-in Presets:**
   - *Flat (Studio Reference)*
   - *Punchy Sub-Bass*
   - *Vocal & Acoustic Clarity*
   - *Bollywood / Punjabi Dhol & Bass*
   - *Late Night Warmth*
   - *Electronic / EDM*
   - *Treble Sparkle*
   - *Custom User Presets (Saved to MMKV)*
4. **Per-Output Device Profiles:**
   - Automatically detects audio routing (Phone Speaker, Bluetooth Headphones/Earbuds, Wired Aux, Car Bluetooth) and restores the user's preferred preset for that output.
5. **Micro-Fades & Gapless Transition:**
   - 150ms anti-pop volume ramp on Play / Pause / Seek.
   - Smooth configurable 0s–12s track transition curve.

## B. Session-Aware AI Adaptive Shuffle Engine
1. **Track Vectorization:**
   - Normalizes each track into a feature profile: `Genre`, `Language`, `Mood/Vibe` (*Romantic, Sad, Lofi/Rain, High-Energy, Acoustic, Mashup*), `Era/Decade`, and `BPM/Energy`.
2. **Real-Time Behavioral Scoring:**
   - **Early Skip (< 20% duration or < 25s):** `-2.5` penalty applied to the active `SessionPreferenceVector`.
   - **Full Listen (> 80%), Manual Pick, or Repeat:** `+3.5` boost applied to the active `SessionPreferenceVector`.
3. **Dynamic Queue Re-Ranking:**
   - Re-ranks unplayed tracks after every song transition using weighted cosine similarity against the `SessionPreferenceVector`, blended with a 15% serendipity factor.
   - Rapid exponential decay when the user manually selects a contrasting track, switching session vibe instantly.
4. **UI Session Vibe Pill:**
   - Live badge on Now Playing (e.g., *"Adaptive Lock: Late Night Chill"*) with a 1-tap **"Reset Mood"** button.

## C. Playlists: Custom User Playlists & Smart Collections
1. **User-Created Custom Playlists:**
   - Full support for creating, naming, describing, and deleting custom playlists.
   - Dedicated local offline JSON storage (`nilofi_playlists.json`) via `expo-file-system`.
   - 1-tap add/remove track modal directly from Library track cards via `ListPlus` icon.
   - Playlist detail view with instant sequential playback and per-track removal.
2. **Automated Smart Collections:**
   - By Language & Region: Auto-grouped into *Punjabi, Hindi / Bollywood, Bangla, English, Instrumental*.
   - By Era: Auto-bucketed into *1990s, 2000s, 2010s, 2020s*.
   - By Vibe & Trend: *Rain & Late Night*, *Romantic & Melody*, *Mashups & Remixes*, *High-Energy Party*.

## D. Background Playback & Android 13/14/15 Lock Screen Controls
1. **Foreground Service Hardening:**
   - Configured with `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS`, `READ_MEDIA_AUDIO`, and `WAKE_LOCK`.
2. **Lock Screen & Notification Center Controls:**
   - High-res embedded album art.
   - 5 Lock Screen Actions:
     1. `Smart Shuffle Toggle`
     2. `Previous Track`
     3. `Play / Pause`
     4. `Next Track`
     5. `Favorite / Like Track`

## E. Synced Lyrics, Waveform Seekbar & Sleep Timer
1. **Zero-Lag Synced Lyrics Viewer:**
   - Fast binary-search timestamp engine for external `.lrc` files and embedded ID3 `USLT`/`SYLT` tags.
2. **Interactive Waveform Seekbar:**
   - 40-bar dynamic amplitude visualizer with smooth drag scrubbing.
3. **Smart Sleep Timer:**
   - Intervals: 15m, 30m, 45m, 60m, or "End of Track", with a smooth 30-second volume fade-out.

## F. Ultra-Minimalistic OLED Dark UI Theme (Jargon-Free)
- **Palette:**
  - Background: Pure Pitch Black (`#000000`).
  - Elevated Cards: Obsidian Slate (`#0B0F17`) with hairline borders (`rgba(255, 255, 255, 0.08)`).
  - Primary Accent: Electric Royal Blue (`#2563EB` with `#3B82F6` glow).
  - Typography: Pure White (`#FFFFFF`) for titles, Cool Grey (`#8E9BAE`) for metadata.
- **De-Jargonized Minimalist Interface:**
  - Standardized human-friendly labels: *Playlists*, *Equalizer*, *Smart Mood*, *Clean Sound Guard*, *Sound Enhancer*, *Deep Bass*, *Surround Sound*, *Smart Shuffle*.
- **Layout & Courtesy:**
  - 4 Navigation Tabs: **Library**, **Playlists**, **Equalizer**, **Smart Mood**.
  - Expandable Floating Mini-Player.
  - Bottom Center Courtesy Signature on all main views: `"© 2026 Farhan T. Niloy"`.

---

# 3. Deliverables & Build Setup
1. **Production Codebase:** Complete, modular TypeScript source files with zero placeholders or missing modules.
2. **Native Android Module:** `modules/nilofi-audio-effects` for hardware audio session control.
3. **Android Configuration:** Ready-to-build `app.json`, `AndroidManifest.xml` permissions, and `service.js`.
4. **Free GitHub Actions APK CI/CD:** `.github/workflows/build-apk.yml` with self-contained signing for one-click downloadable `app-release.apk`.
5. **Technical Report:** `report.md` explaining all systems in simple, friendly language.
6. **User Guide:** Step-by-step installation and feature walkthrough.
7. **Git Repository Setup:** Pushed to `https://github.com/ftniloy5757/NiLoFi.git` with a comprehensive `README.md`.