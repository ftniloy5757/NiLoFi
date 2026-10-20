<div align="center">
  <img src="./assets/logo.png" width="160" height="160" alt="NiLoFi Logo" style="border-radius: 24px;" />
  <h1>NiLoFi</h1>
  <p><strong>Studio-Grade Offline AI Music Player for Android</strong></p>
  <p><em>100% Free-Tier • Zero Cloud Costs • True OLED Dark Aesthetic</em></p>

  [![Build NiLoFi Android APK](https://github.com/ftniloy5757/NiLoFi/actions/workflows/build-apk.yml/badge.svg)](https://github.com/ftniloy5757/NiLoFi/actions/workflows/build-apk.yml)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Android%2013%20%7C%2014%20%7C%2015-brightgreen.svg)]()
  [![React Native](https://img.shields.io/badge/React%20Native-0.76-blue.svg)]()
  [![Expo SDK](https://img.shields.io/badge/Expo-SDK%2052-black.svg)]()
</div>

---

> **Courtesy Notice:** © 2026 Farhan T. Niloy. All rights reserved.

---

## 🌟 What is NiLoFi?

**NiLoFi** is an enterprise-grade, offline-first local Android music player crafted to surpass legacy media players (like Poweramp, Musicolet, and Samsung Music). Built using **React Native & Expo Bare/Prebuild**, NiLoFi bridges cutting-edge on-device machine learning heuristics with Android's native hardware `AudioEffect` DSP stack.

### 💎 Key Highlights

- 🧠 **Smart Mood & Adaptive Shuffle:** Replaces traditional pseudo-random shuffle with an on-device contextual AI engine that analyzes completion rates, early skips, and manual selections to learn your active listening vibe in real-time.
- 📁 **Custom User Playlists & Smart Collections:** Create your own custom playlists, add songs with 1-tap from your library, and browse auto-generated smart collections (by mood, genre, and era)—all persisted locally and 100% offline.
- 🎛️ **Studio 10-Band Equalizer & Clean Sound Guard:** Direct hardware binding to Android's `Equalizer`, `BassBoost`, `Virtualizer`, and `LoudnessEnhancer` with a **Clean Sound Guard (Anti-Clipping)** that automatically balances pre-amp levels to eliminate speaker crackle.
- 🔒 **Native Android Lock-Screen Controls:** Persistent foreground media playback with 5 notification center buttons (including a dedicated **Smart Shuffle Toggle**).
- 📜 **Synced LRC & Waveform Scrubber:** 40-bar interactive amplitude seekbar and glassmorphic synced lyrics with binary-search time tracking.
- 🌙 **Minimalist OLED Dark Aesthetic:** Deep `#000000` surface designed for zero battery waste on AMOLED screens, accented with Electric Royal Blue (`#2563EB`) and Neon Cyan (`#38BDF8`), free from confusing technical jargons.
- 💸 **100% Free-Tier & Private:** Zero cloud subscriptions, zero third-party API keys, zero tracking, and automated GitHub Actions to build installable APKs completely free.

---

## 📱 Visual Showcase & Architecture

```
NiLoFi Application Core
├── Native Hardware DSP (Kotlin Module)
│   ├── android.media.audiofx.Equalizer (10 Bands: 31Hz - 16kHz)
│   ├── android.media.audiofx.BassBoost & Virtualizer
│   └── Clean Sound Guard (Auto-Balancing Peak Limiter)
├── Smart Mood Engine (On-Device AI)
│   ├── Track Vectorization (Romantic, Sad, Lofi, Energy, Acoustic, Mashup)
│   ├── Real-Time Skip Penalty (-2.5) & Completion Boost (+3.5)
│   └── Cosine Similarity Queue Re-Ranking with 15% Fresh Variety
├── Two-Tier Media Scanner & Storage
│   ├── Tier 1: High-Speed Native MediaStore Cursor (< 500ms)
│   ├── Tier 2: Deep Tag & Synced LRC Parser
│   └── Offline Custom Playlist Storage (JSON / File System)
└── UI Experience (OLED 120Hz & Minimalist)
    ├── Library (Search, Filter Pills & 1-Tap Add to Playlist)
    ├── Playlists (Smart Collections & User Custom Playlists)
    ├── Equalizer (Sound Enhancer, Presets, Deep Bass, Surround)
    ├── Smart Mood (Live Vibe Profile & Mood Reset)
    └── Expandable Floating Mini-Player & Hero Now-Playing
```

---

## 🚀 How to Build & Install onto Your Phone

### Option A: Download Pre-Built APK via GitHub Actions (Recommended, No Setup Needed)
1. Push this repository to `https://github.com/ftniloy5757/NiLoFi.git`.
2. Open your repository on GitHub and click on the **Actions** tab.
3. Select the latest run of **"Build NiLoFi Android APK"**.
4. Once completed (approx. 4-5 minutes), scroll to **Artifacts** at the bottom of the page.
5. Download **`NiLoFi-Android-APK`**, unzip it, transfer `NiLoFi-v1.0.0.apk` to your phone, and tap **Install**!

---

### Option B: Local Android Build via Terminal

#### Prerequisites
- Node.js 18+ or 20+
- JDK 17
- Android Studio with Android SDK Platform 34 installed

#### Steps
```bash
# 1. Clone repository
git clone https://github.com/ftniloy5757/NiLoFi.git
cd NiLoFi

# 2. Install dependencies
npm install

# 3. Generate native Android project via Expo Prebuild
npx expo prebuild --platform android --clean

# 4. Compile and install directly to your connected Android phone (via USB Debugging)
npx expo run:android
```

---

## 🎧 Feature Walkthrough & Usage Guide

| Feature | How to Use |
|---|---|
| **Smart Shuffle** | Tap the **Shuffle** button on the Now Playing screen or Library. The badge will illuminate neon blue (`Smart Shuffle`). The engine will immediately begin learning your mood. |
| **Custom Playlists** | In the **Playlists** tab, tap **My Playlists**, then **+ Create New Playlist**. To add songs from your Library, tap the **Playlist icon (≡+)** on any track card and check your desired playlist. |
| **Reset Mood** | If your listening mood changes abruptly, tap **Reset** on the Now Playing screen or Smart Mood tab to clear session memory. |
| **Equalizer & Sound Presets** | Switch to the **Equalizer** tab. Pick from tuned presets (like *Bass Boost*, *Vocal Clarity*, or *Party & Dhol Beats*) or adjust the custom tuning sliders. The **Clean Sound Guard** automatically prevents distortion. |
| **Deep Bass & Surround** | Boost low-end thump or widen spatial presence with 1 tap on the **Deep Bass** and **Surround Sound** controls. |
| **Synced Lyrics** | While a song is playing, tap **SYNCED LYRICS** at the bottom of the Now Playing screen. If a `.lrc` file exists with matching name, lyrics scroll in real-time. |
| **Sleep Timer** | Tap the **Moon** icon in the header. Choose 15m, 30m, 45m, or 60m. Over the final 30 seconds, NiLoFi smoothly ramps down the volume to zero. |
| **Lock-Screen Controls** | Lock your phone while music is playing. You will see high-resolution artwork and 5 controls including the Smart Shuffle toggle directly on your lock screen. |

---

## ⚖️ License & Courtesy

Distributed under the MIT License. Developed with pride by **Farhan T. Niloy**.

```
© 2026 Farhan T. Niloy. All rights reserved.
```
