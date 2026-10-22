import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  LayoutChangeEvent,
  Dimensions,
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
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 48);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);

  const stateRef = useRef({ totalDuration, containerWidth, onSeek });
  stateRef.current = { totalDuration, containerWidth, onSeek };

  const effectivePosition = isDragging ? dragPosition : currentPosition;
  const progressRatio = totalDuration > 0 ? Math.min(1, Math.max(0, effectivePosition / totalDuration)) : 0;
  const activeBarIndex = Math.floor(progressRatio * 40);

  const formatTime = (secs: number) => {
    const validSecs = Math.max(0, isNaN(secs) ? 0 : secs);
    const m = Math.floor(validSecs / 60);
    const s = Math.floor(validSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculatePositionFromTouch = (evt: GestureResponderEvent) => {
    const { locationX } = evt.nativeEvent;
    const width = Math.max(1, stateRef.current.containerWidth);
    const touchRatio = Math.max(0, Math.min(1, locationX / width));
    return touchRatio * stateRef.current.totalDuration;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const pos = calculatePositionFromTouch(evt);
        setDragPosition(pos);
      },
      onPanResponderMove: (evt) => {
        const pos = calculatePositionFromTouch(evt);
        setDragPosition(pos);
      },
      onPanResponderRelease: (evt) => {
        const pos = calculatePositionFromTouch(evt);
        setIsDragging(false);
        stateRef.current.onSeek(pos);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
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
        <Text style={styles.timeText}>{formatTime(effectivePosition)}</Text>
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
