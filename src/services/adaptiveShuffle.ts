import { Track, SessionPreferenceVector, TrackFeatureVector } from '../types';

export class AdaptiveShuffleEngine {
  private sessionVector: SessionPreferenceVector = {
    romantic: 0,
    sad: 0,
    lofi_chill: 0,
    high_energy: 0,
    acoustic: 0,
    mashup: 0,
    energy_tempo: 0,
    era_weight: 0.5,
    totalInteractions: 0,
    activeLockLabel: undefined,
  };

  /**
   * Called when a track ends or is skipped
   */
  public recordInteraction(
    track: Track,
    playedSeconds: number,
    totalDurationSeconds: number,
    wasManuallyChosen: boolean = false
  ): SessionPreferenceVector {
    const playPercentage = totalDurationSeconds > 0 ? (playedSeconds / totalDurationSeconds) : 0;
    const isEarlySkip = playPercentage < 0.20 || playedSeconds < 25;
    const isFullListen = playPercentage >= 0.80 || wasManuallyChosen;

    let delta = 0;
    if (isEarlySkip && !wasManuallyChosen) {
      delta = -2.5; // Strong skip penalty
    } else if (isFullListen) {
      delta = +3.5; // Strong completion boost
    }

    if (delta !== 0) {
      this.updateVector(track.vector, delta);
      this.sessionVector.totalInteractions++;
      this.sessionVector.activeLockLabel = this.computeActiveLockLabel();
    }

    return { ...this.sessionVector };
  }

  private updateVector(vector: TrackFeatureVector, weight: number): void {
    // Decay factor (0.92) to keep session fresh and adapt to mid-session mood shifts
    const decay = 0.92;

    this.sessionVector.romantic = Math.max(-5, Math.min(10, this.sessionVector.romantic * decay + vector.romantic * weight));
    this.sessionVector.sad = Math.max(-5, Math.min(10, this.sessionVector.sad * decay + vector.sad * weight));
    this.sessionVector.lofi_chill = Math.max(-5, Math.min(10, this.sessionVector.lofi_chill * decay + vector.lofi_chill * weight));
    this.sessionVector.high_energy = Math.max(-5, Math.min(10, this.sessionVector.high_energy * decay + vector.high_energy * weight));
    this.sessionVector.acoustic = Math.max(-5, Math.min(10, this.sessionVector.acoustic * decay + vector.acoustic * weight));
    this.sessionVector.mashup = Math.max(-5, Math.min(10, this.sessionVector.mashup * decay + vector.mashup * weight));
    this.sessionVector.energy_tempo = Math.max(0, Math.min(1, this.sessionVector.energy_tempo * decay + vector.energy_tempo * (weight > 0 ? 0.2 : -0.2)));
    this.sessionVector.era_weight = (this.sessionVector.era_weight * 0.85) + (vector.era_weight * 0.15);
  }

  /**
   * Re-ranks the upcoming queue based on cosine-similarity to current session vector,
   * blended with a 15% serendipity factor.
   */
  public reRankQueue(candidateTracks: Track[]): Track[] {
    if (candidateTracks.length <= 1) return candidateTracks;

    const scored = candidateTracks.map((track) => {
      const similarity = this.calculateSimilarity(track.vector);
      // 15% Serendipity Factor to keep the queue diverse
      const serendipity = (Math.random() - 0.5) * 0.3;
      const finalScore = similarity + serendipity;
      return { track, score: finalScore };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.track);
  }

  private calculateSimilarity(v: TrackFeatureVector): number {
    const sv = this.sessionVector;
    
    // Dot product between normalized session desires and song vector
    const dot =
      (sv.romantic * v.romantic) +
      (sv.sad * v.sad) +
      (sv.lofi_chill * v.lofi_chill) +
      (sv.high_energy * v.high_energy) +
      (sv.acoustic * v.acoustic) +
      (sv.mashup * v.mashup);

    // Era alignment penalty if user leans heavily toward a decade
    const eraDiff = Math.abs(sv.era_weight - v.era_weight);
    const eraBonus = (1 - eraDiff) * 1.5;

    return dot + eraBonus;
  }

  /**
   * Returns human-readable pattern lock pill for the UI
   */
  public computeActiveLockLabel(): string | undefined {
    const sv = this.sessionVector;
    if (sv.totalInteractions < 2) return undefined;

    const scores = [
      { name: 'Romantic & Melodic', val: sv.romantic },
      { name: 'Late Night Chill', val: sv.lofi_chill },
      { name: 'High-Energy Party', val: sv.high_energy },
      { name: 'Acoustic Warmth', val: sv.acoustic },
      { name: 'Remix & Mashups', val: sv.mashup },
      { name: 'Deep & Melancholy', val: sv.sad },
    ];

    scores.sort((a, b) => b.val - a.val);
    const top = scores[0];

    if (top.val > 2.0) {
      let eraStr = '';
      if (sv.era_weight < 0.25) eraStr = ' • 90s Classics';
      else if (sv.era_weight < 0.5) eraStr = ' • 2000s Hits';
      else if (sv.era_weight < 0.75) eraStr = ' • 2010s Vibe';
      else eraStr = ' • Modern 2020s';

      return `${top.name}${eraStr}`;
    }

    return undefined;
  }

  public resetSession(): SessionPreferenceVector {
    this.sessionVector = {
      romantic: 0,
      sad: 0,
      lofi_chill: 0,
      high_energy: 0,
      acoustic: 0,
      mashup: 0,
      energy_tempo: 0,
      era_weight: 0.5,
      totalInteractions: 0,
      activeLockLabel: undefined,
    };
    return { ...this.sessionVector };
  }

  public getSessionVector(): SessionPreferenceVector {
    return { ...this.sessionVector };
  }
}

export default new AdaptiveShuffleEngine();
