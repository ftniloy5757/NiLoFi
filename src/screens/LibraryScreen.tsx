import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import {
  Play,
  Shuffle,
  Heart,
  Music2,
  ListPlus,
  Check,
  Plus,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import { Track } from '../types';

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

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
    customPlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
    refreshLibrary,
    isScanning,
  } = usePlayerStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'punjabi' | 'bollywood' | 'lofi'>('all');
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tracks.filter((track) => {
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'favorites') return favorites.includes(track.id);
      if (activeFilter === 'punjabi') return track.language === 'Punjabi';
      if (activeFilter === 'bollywood') return track.language === 'Hindi / Bollywood';
      if (activeFilter === 'lofi') return track.primaryMood === 'Lofi / Rain';

      return true;
    });
  }, [tracks, search, activeFilter, favorites]);


  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim() || !playlistModalTrack) return;
    const pl = await createPlaylist(newPlaylistName.trim());
    await addTrackToPlaylist(pl.id, playlistModalTrack.id);
    setNewPlaylistName('');
    setIsCreatingInline(false);
  };

  const renderTrackItem = ({ item }: { item: Track }) => {
    const isCurrent = currentTrack?.id === item.id;
    const isFav = favorites.includes(item.id);

    return (
      <View style={[styles.trackCard, isCurrent && styles.activeTrackCard]}>
        <TouchableOpacity
          style={styles.trackMainTouch}
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
      </TouchableOpacity>

        {/* Add to Playlist Button */}
        <TouchableOpacity
          onPress={() => setPlaylistModalTrack(item)}
          style={styles.actionIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ListPlus size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        {/* Favorite Heart Button */}
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists..."
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.songCountText}>
            {filteredTracks.length} {filteredTracks.length === 1 ? 'Song' : 'Songs'}
          </Text>
          <TouchableOpacity
            onPress={refreshLibrary}
            style={{ marginLeft: 8, padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RefreshCw
              size={13}
              color={isScanning ? THEME.colors.primaryNeon : THEME.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

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
              {isAdaptiveShuffle ? 'Smart Shuffle' : 'Shuffle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() => {
              if (filteredTracks.length > 0) playTrack(filteredTracks[0]);
            }}
          >
            <Play size={14} color="#000000" fill="#000000" />
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
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
        refreshing={isScanning}
        onRefresh={refreshLibrary}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
            <Music2 size={36} color={THEME.colors.textMuted} style={{ marginBottom: 12, opacity: 0.6 }} />
            <Text style={{ color: THEME.colors.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 6 }}>
              {isScanning
                ? 'Scanning music from device storage...'
                : search
                ? `No songs matching "${search}"`
                : 'No offline songs found'}
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 13, textAlign: 'center' }}>
              {isScanning
                ? 'Filtering out ringtones & system sounds...'
                : 'Pull down to refresh or check permissions in Settings.'}
            </Text>
          </View>
        }
        ListFooterComponent={<CourtesyFooter />}
      />


      {/* Modal: Add to Playlist */}
      <Modal
        visible={!!playlistModalTrack}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPlaylistModalTrack(null);
          setIsCreatingInline(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add to Playlist</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {playlistModalTrack?.title} • {playlistModalTrack?.artist}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setPlaylistModalTrack(null);
                  setIsCreatingInline(false);
                }}
              >
                <X size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* List of custom playlists */}
            <FlatList
              data={customPlaylists}
              keyExtractor={(pl) => pl.id}
              style={{ maxHeight: 240, marginVertical: 8 }}
              renderItem={({ item: pl }) => {
                const isAdded = playlistModalTrack
                  ? pl.trackIds.includes(playlistModalTrack.id)
                  : false;

                return (
                  <TouchableOpacity
                    style={styles.playlistSelectItem}
                    onPress={() => {
                      if (!playlistModalTrack) return;
                      if (isAdded) {
                        removeTrackFromPlaylist(pl.id, playlistModalTrack.id);
                      } else {
                        addTrackToPlaylist(pl.id, playlistModalTrack.id);
                      }
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playlistSelectName}>{pl.name}</Text>
                      <Text style={styles.playlistSelectSub}>
                        {pl.trackIds.length} {pl.trackIds.length === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkCircle,
                        isAdded && styles.activeCheckCircle,
                      ]}
                    >
                      {isAdded && <Check size={14} color="#000000" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* Inline New Playlist Box */}
            {isCreatingInline ? (
              <View style={styles.inlineCreateBox}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="New playlist name..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.inlineSaveBtn}
                  onPress={handleCreateAndAdd}
                >
                  <Text style={styles.inlineSaveText}>Save & Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.newPlaylistTrigger}
                onPress={() => setIsCreatingInline(true)}
              >
                <Plus size={16} color={THEME.colors.primaryNeon} />
                <Text style={styles.newPlaylistTriggerText}>
                  Create New Playlist
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  activeFilterChip: {
    backgroundColor: THEME.colors.primaryNeon,
    borderColor: THEME.colors.primaryNeon,
  },
  filterText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: '#000000',
    fontWeight: '800',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  songCountText: {
    color: THEME.colors.textMuted,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  activeShuffleBtn: {
    borderColor: THEME.colors.primaryNeon,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  actionBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.colors.primaryNeon,
  },
  playAllText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  trackMainTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTrackCard: {
    borderColor: THEME.colors.primaryNeon,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
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
    maxWidth: 110,
  },
  pillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginHorizontal: 8,
  },
  pillText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  durationText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  actionIconButton: {
    padding: 6,
    marginRight: 4,
  },
  heartButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  playlistSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  playlistSelectName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  playlistSelectSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckCircle: {
    backgroundColor: THEME.colors.primaryNeon,
    borderColor: THEME.colors.primaryNeon,
  },
  inlineCreateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 10,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inlineSaveBtn: {
    backgroundColor: THEME.colors.primaryNeon,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  inlineSaveText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  newPlaylistTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderStyle: 'dashed',
  },
  newPlaylistTriggerText: {
    color: THEME.colors.primaryNeon,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default LibraryScreen;
