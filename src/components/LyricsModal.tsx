import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Music } from 'lucide-react-native';
import THEME from '../constants/theme';
import LyricsService from '../services/lyricsService';

interface LyricsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  lyricsContent?: string;
  currentPosition: number;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  visible,
  onClose,
  title,
  artist,
  lyricsContent,
  currentPosition,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const parsedLyrics = LyricsService.parseLRC(lyricsContent || '');
  const activeLineIndex = LyricsService.findCurrentLineIndex(parsedLyrics, currentPosition);

  useEffect(() => {
    if (activeLineIndex >= 0 && scrollRef.current) {
      // Auto scroll active line toward center
      scrollRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * 48 - 140),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Text style={styles.artist} numberOfLines={1}>{artist} • Synced Lyrics</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={THEME.colors.textPrimary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Lyrics Body */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {parsedLyrics.length > 0 ? (
              parsedLyrics.map((line, index) => {
                const isActive = index === activeLineIndex;
                return (
                  <View key={index} style={[styles.lineBox, isActive && styles.activeLineBox]}>
                    <Text
                      style={[
                        styles.lyricText,
                        isActive && styles.activeLyricText,
                      ]}
                    >
                      {line.text}
                    </Text>
                  </View>
                );
              })
            ) : lyricsContent && lyricsContent.trim().length > 0 ? (
              <Text style={styles.plainLyricText}>{lyricsContent}</Text>
            ) : (
              <View style={styles.emptyContainer}>
                <Music size={48} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTitle}>No Synced Lyrics Found</Text>
                <Text style={styles.emptySubtitle}>
                  Place a matching .lrc file in the track folder to see real-time lyrics
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Courtesy Footer */}
          <View style={styles.footer}>
            <Text style={styles.courtesyText}>© 2026 Farhan T. Niloy</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '82%',
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: THEME.colors.cardBorder,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 30,
    paddingBottom: 80,
  },
  lineBox: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeLineBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  lyricText: {
    color: THEME.colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  activeLyricText: {
    color: THEME.colors.primaryNeon,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(56, 189, 248, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  plainLyricText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
  },
  courtesyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.6,
  },
});

export default LyricsModal;
