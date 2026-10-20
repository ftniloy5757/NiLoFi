import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import THEME from '../constants/theme';

interface WaveformSeekbarProps {
  peaks?: number[];
  currentPosition: number; // in seconds
  totalDuration: number;   // in seconds
  onSeek: (seconds: number) => void;
}

export const WaveformSeekbar: React.FC<WaveformSeekbarProps> = ({
  peaks = [],
  currentPosition,
  totalDuration,
  onSeek,
}) => {
  const bars = peaks.length === 40 ? peaks : Array.from({ length: 40 }, (_, i) => 0.3 + 0.5 * Math.sin(i * 0.4));
  const progressRatio = totalDuration > 0 ? Math.min(1, Math.max(0, currentPosition / totalDuration)) : 0;
  const activeBarIndex = Math.floor(progressRatio * 40);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTouch = (evt: GestureResponderEvent) => {
    const { locationX } = evt.nativeEvent;
    // Assume component container width is roughly 320 on phones, or measure
    // Clamping to ratio
    const touchRatio = Math.max(0, Math.min(1, locationX / 300));
    const targetSecond = touchRatio * totalDuration;
    onSeek(targetSecond);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handleTouch,
    onPanResponderMove: handleTouch,
  });

  return (
    <View style={styles.container}>
      {/* Waveform Bars */}
      <View style={styles.waveformContainer} {...panResponder.panHandlers}>
        {bars.map((heightFactor, index) => {
          const isPlayed = index <= activeBarIndex;
          const barHeight = Math.max(6, Math.round(heightFactor * 42));

          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: isPlayed
                    ? THEME.colors.primaryNeon
                    : 'rgba(255, 255, 255, 0.16)',
                  shadowColor: isPlayed ? THEME.colors.primaryGlow : 'transparent',
                  shadowOpacity: isPlayed ? 0.8 : 0,
                  shadowRadius: isPlayed ? 4 : 0,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Time Labels */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
        <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    width: '100%',
    paddingHorizontal: 4,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  timeText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

export default WaveformSeekbar;
