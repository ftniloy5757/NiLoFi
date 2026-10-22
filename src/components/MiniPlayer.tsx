import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipForward, Disc } from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, togglePlayPause, skipToNext, position, duration } =
    usePlayerStore();

  if (!currentTrack) return null;

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const bottomPosition = Platform.OS === 'ios' && insets.bottom > 0 ? insets.bottom + 58 : 58;

  return (
    <View style={[styles.wrapper, { bottom: bottomPosition }]}>
      {/* 2px Neon Progress Line */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.container}
        activeOpacity={0.9}
        onPress={onPress}
      >
        {/* Album Artwork / Disc Icon */}
        <View style={styles.artBox}>
          {currentTrack.artwork ? (
            <Image source={{ uri: currentTrack.artwork }} style={styles.artImage} />
          ) : (
            <View style={styles.fallbackArt}>
              <Disc color={THEME.colors.primaryNeon} size={22} />
            </View>
          )}
        </View>

        {/* Track Title & Artist */}
        <View style={styles.infoBox}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={togglePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPlaying ? (
              <Pause color="#000000" size={18} fill="#000000" />
            ) : (
              <Play color="#000000" size={18} fill="#000000" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipToNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SkipForward color={THEME.colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 56, // Sits right above bottom tab bar
    left: 12,
    right: 12,
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderHighlight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  progressBarBackground: {
    height: 2.5,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primaryNeon,
    shadowColor: THEME.colors.primaryGlow,
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  artBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  fallbackArt: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  infoBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primaryNeon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    shadowColor: THEME.colors.primaryNeon,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  skipButton: {
    padding: 6,
  },
});

export default MiniPlayer;
