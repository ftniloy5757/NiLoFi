import * as MediaLibrary from 'expo-media-library';
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
        isFavorite: item.id === 'seed-1',
        waveformPeaks: LibraryScanner.generateWaveformPeaks(item.title + item.artist),
      };
    });
  }

  /**
   * Fast Tier 1 native media scanner
   */
  public static async scanDeviceAudio(): Promise<Track[]> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        // Return demo seed tracks if permission not granted
        return this.getDemoSeedTracks();
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 500,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      if (!media.assets || media.assets.length === 0) {
        return this.getDemoSeedTracks();
      }

      const scannedTracks: Track[] = media.assets.map((asset) => {
        const title = asset.filename.replace(/\.[^/.]+$/, '');
        const artist = 'Unknown Artist';
        const album = 'Local Audio';
        const duration = Math.round(asset.duration || 180);

        const classification = SmartClassifier.classifyTrack(title, artist, album);

        return {
          id: asset.id,
          url: asset.uri,
          title,
          artist,
          album,
          genre: 'Local',
          duration,
          year: new Date(asset.creationTime).getFullYear(),
          language: classification.language,
          era: classification.era,
          primaryMood: classification.primaryMood,
          vector: classification.vector,
          playCount: 0,
          skipCount: 0,
          waveformPeaks: LibraryScanner.generateWaveformPeaks(title),
        };
      });

      // Combine user device tracks with the demo seed tracks
      return [...scannedTracks, ...this.getDemoSeedTracks()];
    } catch {
      // Fallback to seed tracks on error or simulator
      return this.getDemoSeedTracks();
    }
  }
}

export default LibraryScanner;
