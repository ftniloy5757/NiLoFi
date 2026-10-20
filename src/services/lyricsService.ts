import { LyricsLine } from '../types';

export class LyricsService {
  /**
   * Parses standard .LRC format into time-indexed LyricsLine array
   */
  public static parseLRC(lrcContent: string): LyricsLine[] {
    if (!lrcContent || lrcContent.trim().length === 0) return [];

    const lines = lrcContent.split('\n');
    const result: LyricsLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let match: RegExpExecArray | null;
      timeRegex.lastIndex = 0;
      const timestamps: number[] = [];

      while ((match = timeRegex.exec(trimmed)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        let millis = 0;
        if (match[3]) {
          millis = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
        }
        const timeMs = minutes * 60 * 1000 + seconds * 1000 + millis;
        timestamps.push(timeMs);
      }

      const text = trimmed.replace(/\[\d{2}:\d{2}\.?\d{2,3}?\]/g, '').trim();

      if (text.length > 0) {
        for (const t of timestamps) {
          result.push({ timeMs: t, text });
        }
      }
    }

    // Sort by timestamp
    result.sort((a, b) => a.timeMs - b.timeMs);
    return result;
  }

  /**
   * Zero-lag binary search to find the active lyric line at current audio position
   */
  public static findCurrentLineIndex(lines: LyricsLine[], currentSeconds: number): number {
    if (lines.length === 0) return -1;
    const currentMs = currentSeconds * 1000;

    if (currentMs < lines[0].timeMs) return 0;
    if (currentMs >= lines[lines.length - 1].timeMs) return lines.length - 1;

    let low = 0;
    let high = lines.length - 1;
    let best = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].timeMs <= currentMs) {
        best = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return best;
  }
}

export default LyricsService;
