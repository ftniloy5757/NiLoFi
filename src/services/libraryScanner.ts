import * as MediaLibrary from 'expo-media-library';
import { Platform, PermissionsAndroid } from 'react-native';
import { Track } from '../types';
import SmartClassifier from './smartClassifier';

export class LibraryScanner {
  /**
   * Generates sample normalized waveform bars (40 bars from 0.1 to 1.0)
   */
  public static generateWaveformPeaks(seedStr: string): number[] {
    const peaks: number[] = [];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }

    for (let i = 0; i < 40; i++) {
      const pseudoRandom = Math.abs(Math.sin(hash + i * 1.35));
      // Bell curve weighting in the middle, natural music dynamics
      const envelope = Math.sin((i / 40) * Math.PI);
      const val = Math.max(0.15, Math.min(0.98, pseudoRandom * 0.7 + envelope * 0.3));
      peaks.push(parseFloat(val.toFixed(2)));
    }
    return peaks;
  }

  /**
   * Royalty-Free Seed tracks for instant offline testing on first launch
   */
  public static getDemoSeedTracks(): Track[] {
    const demoTracks = [
      {
        id: 'seed-1',
        title: 'Midnight Rain Lofi',
        artist: 'NiLoFi Studio Sessions',
        album: 'Chill Monsoon Vol. 1',
        genre: 'Lofi',
        duration: 198,
        url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        year: 2024,
        lyrics: `[00:00.00] (Instrumental intro - Gentle raindrops falling)\n[00:15.00] Soft keys playing under the amber streetlights\n[00:32.00] Midnight rain taps against the window pane\n[00:48.00] Let the thoughts drift away into the night\n[01:05.00] Lofi warmth in a pitch black room\n[01:25.00] (Deep sub-bass heartbeat rhythm)\n[01:45.00] Lost in the static of quiet dreams\n[02:10.00] Smooth outro fading into rain...`,
      },
      {
        id: 'seed-2',
        title: 'Pehli Nazar Melodies',
        artist: 'Arijit & Shreya Tribute',
        album: 'Bollywood Acoustic Unplugged',
        genre: 'Bollywood',
        duration: 245,
        url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=acoustic-guitar-ambient-10874.mp3',
        year: 2018,
        lyrics: `[00:00.00] (Acoustic guitar strumming)\n[00:18.00] Dil ki baatein suno zara\n[00:35.00] Tere bina lagta nahi dil mera\n[00:55.00] Saanso mein basi hai teri khushboo\n[01:15.00] Har mod pe dhundhe tujhe nazar\n[01:40.00] Yeh ishq sufiyaana sa hai\n[02:05.00] Tum ho toh har lamha haseen ban gaya...`,
      },
      {
        id: 'seed-3',
        title: 'Punjabi Dhol Anthem (Mashup)',
        artist: 'DJ Harpz & Sidhu Crew',
        album: 'Bhangra Night Megamix',
        genre: 'Punjabi',
        duration: 215,
        url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=action-rock-10026.mp3',
        year: 2023,
        lyrics: `[00:00.00] (Dhol beats dropping heavy)\n[00:14.00] Balle Balle! NiLoFi remix in the house!\n[00:30.00] Bass drop booming in your earbuds\n[00:50.00] Non-stop energy across the floor\n[01:12.00] Dhol beats rocking the night away\n[01:40.00] Put your hands up high!`,
      },
      {
        id: 'seed-4',
        title: 'Nostalgic 90s Cassette Rewind',
        artist: 'Golden Era Melodies',
        album: 'Pure 90s Romance',
        genre: 'Romantic',
        duration: 230,
        url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=romantic-piano-ambient-6831.mp3',
        year: 1996,
        lyrics: `[00:00.00] (Warm cassette tape hiss & piano)\n[00:20.00] Woh pehli baarish, woh purani yaadein\n[00:45.00] 90s ka zamaana, dil se dil ki baatein\n[01:10.00] Tere sang beete woh haseen pal\n[01:35.00] Aaj bhi gunjte hain mere khayalo mein...`,
      },
      {
        id: 'seed-5',
        title: 'Electric Neon Drive',
        artist: 'Cyber Synthwave',
        album: 'Night City Odyssey',
        genre: 'Electronic',
        duration: 185,
        url: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_03130e9d48.mp3?filename=synthwave-80s-110045.mp3',
        year: 2024,
        lyrics: `[00:00.00] (Analog synthesizer pulse)\n[00:25.00] Cruising through neon highways\n[00:45.00] Electric blue reflections on the windshield\n[01:10.00] 120 beats per minute\n[01:35.00] Pure hardware synth power`,
      },
    ];

    return demoTracks.map((item) => {
      const classification = SmartClassifier.classifyTrack(
        item.title,
        item.artist,
        item.album,
        item.year
      );

      return {
        ...item,
        language: classification.language,
        era: classification.era,
        primaryMood: classification.primaryMood,
        vector: classification.vector,
        playCount: Math.floor(Math.random() * 8) + 2,
        skipCount: 0,
        createdAt: item.year ? new Date(item.year, 0, 1).getTime() : Date.now(),
        isFavorite: item.id === 'seed-1',
        waveformPeaks: LibraryScanner.generateWaveformPeaks(item.title + item.artist),
      };
    });
  }

  /**
   * Request audio reading permissions across all Android API levels (10 through 17)
   */
  public static async requestAudioPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const androidVersion = typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);

        if (androidVersion >= 33) {
          // Android 13+ (API 33, 34, 35, 36, 37) requires READ_MEDIA_AUDIO
          const hasAudioPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
          );
          if (!hasAudioPermission) {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
            );
            if (result === PermissionsAndroid.RESULTS.GRANTED) {
              return true;
            }
          } else {
            return true;
          }
        } else {
          // Android 12 and below requires READ_EXTERNAL_STORAGE
          const hasStorage = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          if (!hasStorage) {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
            );
            if (result === PermissionsAndroid.RESULTS.GRANTED) {
              return true;
            }
          } else {
            return true;
          }
        }
      }

      // Also verify/request via expo-media-library
      const perm = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      if (perm.granted || perm.status === 'granted') {
        return true;
      }

      const req = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      return req.granted || req.status === 'granted';
    } catch (err) {
      console.warn('Audio permission request error:', err);
      return false;
    }
  }

  /**
   * Filters out ringtones, notification tones, alarms, call recordings, voice notes, and system sounds.
   * Retains ONLY real songs.
   */
  private static isMusicFile(asset: MediaLibrary.Asset): boolean {
    const filename = (asset.filename || '').toLowerCase().trim();
    const uri = (asset.uri || '').toLowerCase().trim();
    const duration = asset.duration || 0;

    // 1. Reject non-music audio formats (e.g. ringtone containers, midi, voice memos)
    const invalidExtensions = ['.m4r', '.mid', '.midi', '.amr', '.3gp', '.tmp', '.dat', '.bak'];
    if (invalidExtensions.some((ext) => filename.endsWith(ext) || uri.endsWith(ext))) {
      return false;
    }

    // 2. Require standard music file formats
    const validExtensions = ['.mp3', '.m4a', '.flac', '.wav', '.aac', '.ogg', '.opus', '.wma'];
    const hasValidExtension = validExtensions.some((ext) => filename.endsWith(ext) || uri.endsWith(ext));
    if (!hasValidExtension) {
      return false;
    }

    // 3. Path-based rejection: strictly reject ringtones, notifications, alarms, and chat audio
    const blacklistPaths = [
      '/ringtones/',
      '/ringtone/',
      '/notifications/',
      '/notification/',
      '/alarms/',
      '/alarm/',
      '/system/media/',
      '/android/media/',
      '/sounds/',
      '/system/sounds/',
      '/ui/',
      '/whatsapp audio/',
      '/whatsapp voice notes/',
      '/com.whatsapp/',
      '/telegram/telegram audio/',
      '/callrec/',
      '/call_rec/',
      '/call recording/',
      '/call recordings/',
      '/callrecordings/',
      '/sound_recorder/',
      '/soundrecorder/',
      '/voicenotes/',
      '/voice_notes/',
      '/voice notes/',
      '/voice recorder/',
      '/voice_recorder/',
      '/recordings/call/',
    ];

    if (blacklistPaths.some((dir) => uri.includes(dir))) {
      return false;
    }

    // 4. Filename pattern rejection for messaging voice clips and phone recordings
    // WhatsApp voice clips: PTT-20240101-WA0001.opus, AUD-20240101-WA0002.mp3
    if (/^(ptt-|aud-)/i.test(filename)) {
      return false;
    }

    // Call recordings and sound memos: call_rec_*, voice_record_*, rec_*
    if (/^(call_rec|callrec|rec_|recording_|voice_record)/i.test(filename)) {
      return false;
    }

    // Explicit tone/alarm indicators in filename
    const toneKeywords = [
      'ringtone',
      'ringtones',
      'notification',
      'notifications',
      'alarm tone',
      'alert tone',
      'message tone',
      'sms tone',
      'ui_sound',
      'touch_sound',
      'hangouts_',
    ];
    if (toneKeywords.some((kw) => filename.includes(kw))) {
      return false;
    }

    // 5. Minimum duration threshold:
    // Real songs are almost never under 25 seconds.
    // Notification chimes (0.5s - 5s) and ringtones (5s - 25s) are eliminated.
    // If duration is 0 (unindexed metadata on some files), we allow it only if it passed all path & filename checks.
    if (duration > 0 && duration < 25) {
      return false;
    }

    return true;
  }

  /**
   * Intelligently parses artist and title from filename
   * (e.g., "Artist - Title", "01. Song Name", "Heeriye - Arijit Singh")
   */
  private static parseTitleAndArtist(rawFilename: string): { title: string; artist: string } {
    let clean = rawFilename.replace(/\.[^/.]+$/, '');

    // Strip common audio noise suffixes: (Official Audio), [Lyrics], (320kbps), etc.
    clean = clean.replace(/\s*(\(|\[)(official\s*(audio|video|music\s*video)|lyrics|320\s*kbps|hd|hq|4k|remastered|lyrics\s*video)(\)|\])/gi, '');

    // Strip leading track numbers like "01. ", "02 - ", "1. ", "1 - "
    clean = clean.replace(/^\s*\d{1,3}[\s.\-_]+/g, '');

    clean = clean.replace(/_/g, ' ').trim();

    // Check for delimiter patterns: "Artist - Title"
    if (clean.includes(' - ')) {
      const parts = clean.split(' - ').map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          artist: parts[0],
          title: parts.slice(1).join(' - '),
        };
      }
    }

    return {
      title: clean || 'Unknown Track',
      artist: 'Local Artist',
    };
  }

  /**
   * Fast Tier 1 native media scanner with full pagination and smart music filtering
   */
  public static async scanDeviceAudio(): Promise<Track[]> {
    try {
      const hasPermission = await this.requestAudioPermissions();
      if (!hasPermission) {
        return this.getDemoSeedTracks();
      }

      const allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let endCursor: string | undefined = undefined;
      let lastCursor: string | undefined = undefined;

      // Loop through all pages to fetch all audio files across storage
      while (hasNextPage) {
        let page;
        try {
          page = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.audio,
            first: 100,
            after: endCursor,
            sortBy: [MediaLibrary.SortBy.creationTime],
          });
        } catch {
          // Fallback without sortBy if creationTime descriptor is not supported on custom OS
          page = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.audio,
            first: 100,
            after: endCursor,
          });
        }

        if (page.assets && page.assets.length > 0) {
          allAssets.push(...page.assets);
        }

        // Break if no more pages or endCursor didn't advance
        if (!page.hasNextPage || !page.assets || page.assets.length === 0 || page.endCursor === lastCursor) {
          break;
        }

        lastCursor = endCursor;
        endCursor = page.endCursor;
        hasNextPage = page.hasNextPage;

        // Safety limit to prevent memory exhaustion on giant storages
        if (allAssets.length >= 15000) {
          break;
        }
      }

      // Filter out ringtones, notifications, alarms, voice notes, and sound effects
      const filteredAssets = allAssets.filter((asset) => this.isMusicFile(asset));

      if (filteredAssets.length === 0) {
        return this.getDemoSeedTracks();
      }

      // De-duplicate by URI/ID
      const seenIds = new Set<string>();
      const scannedTracks: Track[] = [];

      for (const asset of filteredAssets) {
        if (seenIds.has(asset.id) || seenIds.has(asset.uri)) continue;
        seenIds.add(asset.id);
        seenIds.add(asset.uri);

        const { title, artist } = this.parseTitleAndArtist(asset.filename);
        const album = 'Local Library';
        const duration = Math.round(asset.duration || 180);

        const classification = SmartClassifier.classifyTrack(title, artist, album);

        scannedTracks.push({
          id: asset.id,
          url: asset.uri,
          title,
          artist,
          album,
          genre: 'Local',
          duration,
          year: new Date(asset.creationTime || Date.now()).getFullYear() || 2024,
          createdAt: asset.creationTime || asset.modificationTime || Date.now(),
          language: classification.language,
          era: classification.era,
          primaryMood: classification.primaryMood,
          vector: classification.vector,
          playCount: 0,
          skipCount: 0,
          waveformPeaks: LibraryScanner.generateWaveformPeaks(title),
        });
      }

      return scannedTracks.length > 0 ? scannedTracks : this.getDemoSeedTracks();
    } catch (err) {
      console.warn('scanDeviceAudio error:', err);
      return this.getDemoSeedTracks();
    }
  }
}

export default LibraryScanner;
