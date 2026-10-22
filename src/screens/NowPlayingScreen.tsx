import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  FileText,
  Moon,
  Sparkles,
  Disc,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import WaveformSeekbar from '../components/WaveformSeekbar';
import LyricsModal from '../components/LyricsModal';
import CourtesyFooter from '../components/CourtesyFooter';

interface NowPlayingScreenProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 64, 320);

export const NowPlayingScreen: React.FC<NowPlayingScreenProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    isAdaptiveShuffle,
    toggleAdaptiveShuffle,
    isRepeat,
    toggleRepeat,
    favorites,
    toggleFavorite,
    sessionVector,
    resetMood,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
  } = usePlayerStore();

  const insets = useSafeAreaInsets();
  const [showLyrics, setShowLyrics] = useState(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);

  const containerPaddingTop = Platform.OS === 'ios'
    ? Math.max(insets.top, 24) + 8
    : 44;
  const containerPaddingBottom = Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16) + 4
    : 16;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: containerPaddingTop,
            paddingBottom: containerPaddingBottom,
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <ChevronDown size={26} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>NOW PLAYING</Text>
            <Text style={styles.headerSubtitle}>
              {currentTrack.album || 'Local Library'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowTimerPicker(!showTimerPicker)}
            style={[styles.headerBtn, sleepTimer.isActive && styles.activeTimerBtn]}
          >
            <Moon
              size={20}
              color={
                sleepTimer.isActive
                  ? THEME.colors.primaryNeon
                  : THEME.colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Sleep Timer Picker Overlay */}
        {showTimerPicker && (
          <View style={styles.timerDropdown}>
            <Text style={styles.timerTitle}>Sleep Timer (Gentle Fade Out)</Text>
            <View style={styles.timerOptionsRow}>
              {[15, 30, 45, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={styles.timerOptionBtn}
                  onPress={() => {
                    startSleepTimer(mins);
                    setShowTimerPicker(false);
                  }}
                >
                  <Text style={styles.timerOptionText}>{mins}m</Text>
                </TouchableOpacity>
              ))}
              {sleepTimer.isActive && (
                <TouchableOpacity
                  style={[styles.timerOptionBtn, { backgroundColor: THEME.colors.danger }]}
                  onPress={() => {
                    cancelSleepTimer();
                    setShowTimerPicker(false);
                  }}
                >
                  <Text style={styles.timerOptionText}>Off</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Hero Artwork Box */}
        <View style={styles.artworkContainer}>
          <View style={styles.artworkCard}>
            {currentTrack.artwork ? (
              <Image source={{ uri: currentTrack.artwork }} style={styles.artworkImage} />
            ) : (
              <Image
                source={require('../../assets/logo.png')}
                style={styles.artworkImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        {/* Adaptive Vibe Pill */}
        {sessionVector.activeLockLabel && (
          <View style={styles.vibePillRow}>
            <View style={styles.vibePill}>
              <Sparkles size={12} color={THEME.colors.primaryNeon} />
              <Text style={styles.vibePillText}>
                {sessionVector.activeLockLabel}
              </Text>
            </View>
            <TouchableOpacity onPress={resetMood} style={styles.resetPillBtn}>
              <Text style={styles.resetPillText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Track Metadata & Heart Button */}
        <View style={styles.metaContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => toggleFavorite(currentTrack.id)}
            style={styles.favBtn}
          >
            <Heart
              size={24}
              color={isFav ? THEME.colors.danger : THEME.colors.textMuted}
              fill={isFav ? THEME.colors.danger : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* 40-Bar Interactive Waveform Seekbar */}
        <View style={styles.waveformWrapper}>
          <WaveformSeekbar
            peaks={currentTrack.waveformPeaks}
            currentPosition={position}
            totalDuration={duration}
            onSeek={seekTo}
          />
        </View>

        {/* Lock-Screen Controls Mirror */}
        <View style={styles.controlsRow}>
          {/* Action 1: Adaptive Shuffle Toggle */}
          <TouchableOpacity
            style={[
              styles.sideControlBtn,
              isAdaptiveShuffle && styles.activeSideControl,
            ]}
            onPress={toggleAdaptiveShuffle}
          >
            <Shuffle
              size={20}
              color={
                isAdaptiveShuffle
                  ? THEME.colors.primaryNeon
                  : THEME.colors.textSecondary
              }
            />
          </TouchableOpacity>

          {/* Action 2: Skip Previous */}
          <TouchableOpacity onPress={skipToPrevious} style={styles.skipBtn}>
            <SkipBack size={26} color={THEME.colors.textPrimary} fill={THEME.colors.textPrimary} />
          </TouchableOpacity>

          {/* Action 3: Play / Pause Hero Button */}
          <TouchableOpacity onPress={togglePlayPause} style={styles.playHeroBtn}>
            {isPlaying ? (
              <Pause size={28} color="#000000" fill="#000000" />
            ) : (
              <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          {/* Action 4: Skip Next */}
          <TouchableOpacity onPress={skipToNext} style={styles.skipBtn}>
            <SkipForward size={26} color={THEME.colors.textPrimary} fill={THEME.colors.textPrimary} />
          </TouchableOpacity>

          {/* Action 5: Repeat Mode */}
          <TouchableOpacity
            style={[styles.sideControlBtn, isRepeat && styles.activeSideControl]}
            onPress={toggleRepeat}
          >
            <Repeat
              size={20}
              color={
                isRepeat
                  ? THEME.colors.primaryNeon
                  : THEME.colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Secondary Actions (Synced Lyrics) */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.lyricsBtn}
            onPress={() => setShowLyrics(true)}
          >
            <FileText size={16} color={THEME.colors.primaryNeon} />
            <Text style={styles.lyricsBtnText}>SYNCED LYRICS</Text>
          </TouchableOpacity>
        </View>

        {/* Courtesy Footer */}
        <CourtesyFooter />

        {/* Synced Lyrics Modal */}
        <LyricsModal
          visible={showLyrics}
          onClose={() => setShowLyrics(false)}
          title={currentTrack.title}
          artist={currentTrack.artist}
          lyricsContent={currentTrack.lyrics}
          currentPosition={position}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimerBtn: {
    borderWidth: 1,
    borderColor: THEME.colors.primaryNeon,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  timerDropdown: {
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginTop: 8,
  },
  timerTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  timerOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  timerOptionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  timerOptionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  artworkCard: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  vibePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  vibePillText: {
    color: THEME.colors.primaryNeon,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  resetPillBtn: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resetPillText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trackTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  trackArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  favBtn: {
    padding: 8,
  },
  waveformWrapper: {
    marginVertical: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 10,
  },
  sideControlBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSideControl: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.primaryNeon,
  },
  skipBtn: {
    padding: 10,
  },
  playHeroBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.primaryNeon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primaryNeon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 8,
  },
  bottomActions: {
    alignItems: 'center',
    marginVertical: 4,
  },
  lyricsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  lyricsBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.8,
  },
});

export default NowPlayingScreen;
