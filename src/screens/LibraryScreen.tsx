import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Play,
  Shuffle,
  Heart,
  Music2,
  SlidersHorizontal,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import { Track } from '../types';

export const LibraryScreen: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    toggleFavorite,
    favorites,
    isAdaptiveShuffle,
    toggleAdaptiveShuffle,
  } = usePlayerStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'punjabi' | 'bollywood' | 'lofi'>('all');

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(search.toLowerCase()) ||
      track.artist.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'favorites') return favorites.includes(track.id);
    if (activeFilter === 'punjabi') return track.language === 'Punjabi';
    if (activeFilter === 'bollywood') return track.language === 'Hindi / Bollywood';
    if (activeFilter === 'lofi') return track.primaryMood === 'Lofi / Rain';

    return true;
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderTrackItem = ({ item }: { item: Track }) => {
    const isCurrent = currentTrack?.id === item.id;
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.trackCard, isCurrent && styles.activeTrackCard]}
        activeOpacity={0.7}
        onPress={() => {
          if (isCurrent) {
            togglePlayPause();
          } else {
            playTrack(item);
          }
        }}
      >
        <View style={styles.iconBox}>
          <Music2
            size={20}
            color={isCurrent ? THEME.colors.primaryNeon : THEME.colors.textSecondary}
          />
        </View>

        <View style={styles.trackDetails}>
          <Text
            style={[styles.trackTitle, isCurrent && styles.activeTrackTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {item.artist}
            </Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>{item.language}</Text>
            </View>
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={styles.heartButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={18}
            color={isFav ? THEME.colors.danger : THEME.colors.textMuted}
            fill={isFav ? THEME.colors.danger : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search local songs, artists, albums..."
          placeholderTextColor={THEME.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'favorites', 'punjabi', 'bollywood', 'lofi'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.activeFilterChip,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Header */}
      <View style={styles.actionHeader}>
        <Text style={styles.songCountText}>
          {filteredTracks.length} {filteredTracks.length === 1 ? 'Song' : 'Songs'}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isAdaptiveShuffle && styles.activeShuffleBtn,
            ]}
            onPress={toggleAdaptiveShuffle}
          >
            <Shuffle
              size={14}
              color={
                isAdaptiveShuffle
                  ? THEME.colors.primaryNeon
                  : THEME.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.actionBtnText,
                isAdaptiveShuffle && { color: THEME.colors.primaryNeon },
              ]}
            >
              {isAdaptiveShuffle ? 'Adaptive ON' : 'Shuffle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() => {
              if (filteredTracks.length > 0) playTrack(filteredTracks[0]);
            }}
          >
            <Play size={14} color="#FFF" fill="#FFF" />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracks List */}
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrackItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<CourtesyFooter />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchInput: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    color: THEME.colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: THEME.colors.primary,
  },
  filterText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFF',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  songCountText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginRight: 8,
  },
  activeShuffleBtn: {
    borderColor: THEME.colors.primaryNeon,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  actionBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playAllText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  activeTrackCard: {
    borderColor: THEME.colors.primaryNeon,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trackTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTrackTitle: {
    color: THEME.colors.primaryNeon,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trackArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    maxWidth: 120,
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  durationText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginLeft: 'auto',
  },
  heartButton: {
    padding: 6,
  },
});

export default LibraryScreen;
