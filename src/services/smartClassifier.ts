import { Track, SmartCategory, AudioLanguage, AudioEra, AudioMood, TrackFeatureVector } from '../types';

export class SmartClassifier {
  /**
   * Analyzes track title, artist, album, and ID3 data to deduce features, mood, era, and language
   */
  public static classifyTrack(
    title: string,
    artist: string,
    album: string,
    year?: number
  ): {
    language: AudioLanguage;
    era: AudioEra;
    primaryMood: AudioMood;
    vector: TrackFeatureVector;
  } {
    const text = `${title} ${artist} ${album}`.toLowerCase();

    // 1. Language Detection
    let language: AudioLanguage = 'English';
    if (
      text.match(/(punjabi|sidhu|ap dhillon|karan aujla|diljit|shubh|amrit|jassi|bhangra|dhol|yaaran|jatt)/i)
    ) {
      language = 'Punjabi';
    } else if (
      text.match(/(arijit|shreya|atif|kumar sanu|udit|sonu nigam|neha|bollywood|ishq|pyaar|dil|tum|tere|mohabbat|humdum)/i)
    ) {
      language = 'Hindi / Bollywood';
    } else if (
      text.match(/(bangla|rabindra|anupam|shreya ghoshal bangla|somlata|tahsan|habib|bappa|bangladesh|kolkata|bristi)/i)
    ) {
      language = 'Bangla';
    } else if (text.match(/(instrumental|piano|guitar|ambient|synth|beats|study|orchestra)/i)) {
      language = 'Instrumental';
    }

    // 2. Era Detection
    let era: AudioEra = '2020s';
    let eraWeight = 0.9;
    const detectedYear = year || this.extractYearFromText(text);

    if (detectedYear) {
      if (detectedYear < 2000) {
        era = '1990s';
        eraWeight = 0.15;
      } else if (detectedYear < 2010) {
        era = '2000s';
        eraWeight = 0.45;
      } else if (detectedYear < 2020) {
        era = '2010s';
        eraWeight = 0.72;
      } else {
        era = '2020s';
        eraWeight = 0.95;
      }
    }

    // 3. Mood & Vibe Vectorization
    const isRomantic = Boolean(text.match(/(love|romantic|dil|heart|ishq|pyar|tum|tere|sanam|jaan|beloved|sweet)/i));
    const isLofi = Boolean(text.match(/(lofi|rain|barish|chill|slowed|reverb|sleep|night|cafe|breeze|late night)/i));
    const isSad = Boolean(text.match(/(sad|broken|alone|dard|judaai|tears|crying|pain|judai|tanhai)/i));
    const isMashup = Boolean(text.match(/(mashup|remix|megamix|vs|flip|bootleg|dj|club mix)/i));
    const isHighEnergy = Boolean(text.match(/(party|dance|dhol|bass|bhangra|gym|workout|energy|trap|edm|club)/i));
    const isAcoustic = Boolean(text.match(/(acoustic|unplugged|guitar|live|raw|piano|strings)/i));

    let primaryMood: AudioMood = 'Chill';
    if (isMashup) primaryMood = 'Mashup / Remix';
    else if (isRomantic) primaryMood = 'Romantic';
    else if (isLofi) primaryMood = 'Lofi / Rain';
    else if (isHighEnergy) primaryMood = 'High-Energy';
    else if (isSad) primaryMood = 'Sad';
    else if (isAcoustic) primaryMood = 'Acoustic';

    const vector: TrackFeatureVector = {
      romantic: isRomantic ? 0.9 : 0.1,
      sad: isSad ? 0.85 : 0.05,
      lofi_chill: isLofi ? 0.95 : 0.2,
      high_energy: isHighEnergy ? 0.9 : 0.15,
      acoustic: isAcoustic ? 0.85 : 0.2,
      mashup: isMashup ? 1.0 : 0.0,
      energy_tempo: isHighEnergy ? 0.85 : (isLofi || isSad ? 0.25 : 0.5),
      era_weight: eraWeight,
    };

    return { language, era, primaryMood, vector };
  }

  private static extractYearFromText(text: string): number | undefined {
    const match = text.match(/\b(19\d\d|20\d\d)\b/);
    return match ? parseInt(match[0], 10) : undefined;
  }

  /**
   * Generates predefined smart categories with filters
   */
  public static getSmartCategories(tracks: Track[]): SmartCategory[] {
    const categories: SmartCategory[] = [
      {
        id: 'rain_late_night',
        title: 'Rain & Late Night',
        subtitle: 'Slowed, acoustic, lofi & atmospheric calm',
        iconName: 'CloudRain',
        gradientColors: ['#1E1B4B', '#0F172A'],
        trackCount: 0,
        filter: (t) => t.primaryMood === 'Lofi / Rain' || t.vector.lofi_chill > 0.6,
      },
      {
        id: 'romantic_melody',
        title: 'Romantic & Melodies',
        subtitle: 'Heartfelt ballads & soulful acoustics',
        iconName: 'Heart',
        gradientColors: ['#4C0519', '#1E1B4B'],
        trackCount: 0,
        filter: (t) => t.primaryMood === 'Romantic' || t.vector.romantic > 0.6,
      },
      {
        id: 'bollywood_punjabi_hits',
        title: 'Bollywood & Punjabi Beats',
        subtitle: 'Dhol, high-velocity party bangers & anthems',
        iconName: 'Flame',
        gradientColors: ['#78350F', '#18181B'],
        trackCount: 0,
        filter: (t) =>
          t.language === 'Punjabi' ||
          t.language === 'Hindi / Bollywood' ||
          t.primaryMood === 'High-Energy',
      },
      {
        id: 'mashups_remixes',
        title: 'Mashups & Club Remixes',
        subtitle: 'Seamless bootlegs, flips & megamixes',
        iconName: 'Disc',
        gradientColors: ['#312E81', '#1E1B4B'],
        trackCount: 0,
        filter: (t) => t.primaryMood === 'Mashup / Remix' || t.vector.mashup > 0.5,
      },
      {
        id: 'golden_90s',
        title: 'Golden 90s Classics',
        subtitle: 'Nostalgic melodies & timeless tape hits',
        iconName: 'Clock',
        gradientColors: ['#14532D', '#0F172A'],
        trackCount: 0,
        filter: (t) => t.era === '1990s',
      },
      {
        id: 'nostalgia_2000s',
        title: '2000s Era Nostalgia',
        subtitle: 'The golden age of MP3 & early 2000s vibes',
        iconName: 'Sparkles',
        gradientColors: ['#1E3A8A', '#0F172A'],
        trackCount: 0,
        filter: (t) => t.era === '2000s',
      },
      {
        id: 'instrumental_focus',
        title: 'Instrumental & Focus',
        subtitle: 'Zero vocals, pure immersion & deep study',
        iconName: 'Headphones',
        gradientColors: ['#042F2E', '#0F172A'],
        trackCount: 0,
        filter: (t) => t.language === 'Instrumental' || t.vector.acoustic > 0.7,
      },
    ];

    // Compute live counts
    return categories.map((cat) => ({
      ...cat,
      trackCount: tracks.filter(cat.filter).length,
    }));
  }
}

export default SmartClassifier;
