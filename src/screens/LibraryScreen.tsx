import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
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
  ArrowUpDown,
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

export type SortField = 'title' | 'date' | 'listened';
export type SortOrder = 'asc' | 'desc';

export interface SortOptionConfig {
  id: string;
  field: SortField;
  order: SortOrder;
  label: string;
  subLabel: string;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { id: 'title_asc', field: 'title', order: 'asc', label: 'Name (A → Z)', subLabel: 'Alphabetical order' },
  { id: 'title_desc', field: 'title', order: 'desc', label: 'Name (Z → A)', subLabel: 'Reverse alphabetical order' },
  { id: 'date_desc', field: 'date', order: 'desc', label: 'Date (Newest)', subLabel: 'Recently added songs first' },
  { id: 'date_asc', field: 'date', order: 'asc', label: 'Date (Oldest)', subLabel: 'Oldest added songs first' },
  { id: 'listened_desc', field: 'listened', order: 'desc', label: 'Most Listened', subLabel: 'Highest play count first' },
  { id: 'listened_asc', field: 'listened', order: 'asc', label: 'Least Listened', subLabel: 'Unplayed / fresh songs' },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'ALL' },
  { id: 'favorites', label: 'FAVORITES' },
  { id: 'punjabi', label: 'PUNJABI' },
  { id: 'bollywood', label: 'BOLLYWOOD' },
  { id: 'lofi', label: 'LOFI' },
  { id: 'english', label: 'ENGLISH' },
  { id: 'romantic', label: 'ROMANTIC' },
  { id: 'high_energy', label: 'PARTY & DANCE' },
  { id: 'chill', label: 'CHILL' },
] as const;

export const LibraryScreen: React.FC = () => {
  const tracks = usePlayerStore((s) => s.tracks);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const favorites = usePlayerStore((s) => s.favorites);
  const isAdaptiveShuffle = usePlayerStore((s) => s.isAdaptiveShuffle);
  const toggleAdaptiveShuffle = usePlayerStore((s) => s.toggleAdaptiveShuffle);
  const customPlaylists = usePlayerStore((s) => s.customPlaylists);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);
  const isScanning = usePlayerStore((s) => s.isScanning);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<SortOptionConfig>(SORT_OPTIONS[0]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = tracks.filter((track) => {
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'favorites') return favorites.includes(track.id);
      if (activeFilter === 'punjabi') return track.language === 'Punjabi';
      if (activeFilter === 'bollywood') return track.language === 'Hindi / Bollywood';
      if (activeFilter === 'lofi') return track.primaryMood === 'Lofi / Rain';
      if (activeFilter === 'english') return track.language === 'English';
      if (activeFilter === 'romantic') return track.primaryMood === 'Romantic';
      if (activeFilter === 'high_energy') return track.primaryMood === 'High-Energy' || track.primaryMood === 'Mashup / Remix';
      if (activeFilter === 'chill') return track.primaryMood === 'Chill' || track.primaryMood === 'Acoustic';

      return true;
    });

    // Apply sorting
    matches.sort((a, b) => {
      if (selectedSort.field === 'title') {
        const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true });
        return selectedSort.order === 'asc' ? cmp : -cmp;
      }
      if (selectedSort.field === 'date') {
        const timeA = a.createdAt || (a.year ? new Date(a.year, 0, 1).getTime() : 0);
        const timeB = b.createdAt || (b.year ? new Date(b.year, 0, 1).getTime() : 0);
        return selectedSort.order === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (selectedSort.field === 'listened') {
        const playA = a.playCount || 0;
        const playB = b.playCount || 0;
        if (playA !== playB) {
          return selectedSort.order === 'asc' ? playA - playB : playB - playA;
        }
        const lastA = a.lastPlayedAt || 0;
        const lastB = b.lastPlayedAt || 0;
        return selectedSort.order === 'asc' ? lastA - lastB : lastB - lastA;
      }
      return 0;
    });

    return matches;
  }, [tracks, search, activeFilter, favorites, selectedSort]);

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
              <Text style={styles.durationText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Playlist & Favorite Actions */}
        <TouchableOpacity
          style={styles.actionIconButton}
          onPress={() => setPlaylistModalTrack(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ListPlus size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => toggleFavorite(item.id)}
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
      <Header title="NiLoFi" />

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

      {/* Horizontally Swipeable Category Capsules */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.activeFilterText,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Action Header */}
      <View style={styles.actionHeader}>
        <View style={styles.metaActionRow}>
          <View style={styles.songCountGroup}>
            <Text style={styles.songCountText}>
              {filteredTracks.length} {filteredTracks.length === 1 ? 'Song' : 'Songs'}
            </Text>
            <TouchableOpacity
              onPress={refreshLibrary}
              style={styles.refreshBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RefreshCw
                size={13}
                color={isScanning ? THEME.colors.primaryNeon : THEME.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Sort Button */}
          <TouchableOpacity
            style={styles.sortTriggerBtn}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
          >
            <ArrowUpDown size={12} color={THEME.colors.primaryNeon} />
            <Text style={styles.sortTriggerText} numberOfLines={1}>
              {selectedSort.label}
            </Text>
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
        ListFooterComponent={<CourtesyFooter />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching songs found</Text>
          </View>
        }
      />

      {/* Sort System Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ArrowUpDown size={18} color={THEME.colors.primaryNeon} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Sort Song List</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsList}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = selectedSort.id === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.sortOptionItem,
                      isSelected && styles.selectedSortOptionItem,
                    ]}
                    onPress={() => {
                      setSelectedSort(opt);
                      setShowSortModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sortOptionTextGroup}>
                      <Text
                        style={[
                          styles.sortOptionLabel,
                          isSelected && styles.selectedSortOptionLabel,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.sortOptionSubLabel}>{opt.subLabel}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.sortCheckBadge}>
                        <Check size={14} color="#000000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add To Playlist Modal */}
      <Modal
        visible={!!playlistModalTrack}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPlaylistModalTrack(null);
          setIsCreatingInline(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setPlaylistModalTrack(null);
            setIsCreatingInline(false);
          }}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add to Playlist</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {playlistModalTrack?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setPlaylistModalTrack(null);
                  setIsCreatingInline(false);
                }}
              >
                <X size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {customPlaylists.map((pl) => {
              const inPlaylist =
                playlistModalTrack &&
                pl.trackIds.includes(playlistModalTrack.id);
              return (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistSelectItem}
                  onPress={async () => {
                    if (!playlistModalTrack) return;
                    if (inPlaylist) {
                      await removeTrackFromPlaylist(
                        pl.id,
                        playlistModalTrack.id
                      );
                    } else {
                      await addTrackToPlaylist(pl.id, playlistModalTrack.id);
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playlistSelectName}>{pl.name}</Text>
                    <Text style={styles.playlistSelectSub}>
                      {pl.trackIds.length}{' '}
                      {pl.trackIds.length === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkCircle,
                      inPlaylist && styles.activeCheckCircle,
                    ]}
                  >
                    {inPlaylist && <Check size={14} color="#000" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {isCreatingInline ? (
              <View style={styles.inlineCreateBox}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Playlist name..."
                  placeholderTextColor={THEME.colors.textMuted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.inlineSaveBtn}
                  onPress={handleCreateAndAdd}
                >
                  <Text style={styles.inlineSaveText}>Save</Text>
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
        </TouchableOpacity>
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
  filterWrapper: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.colors.card,
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
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  metaActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songCountText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  refreshBtn: {
    marginLeft: 6,
    padding: 4,
  },
  sortTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sortTriggerText: {
    color: THEME.colors.primaryNeon,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.colors.card,
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
    marginLeft: 6,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.colors.primaryNeon,
  },
  playAllText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sortModalCard: {
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  sortOptionsList: {
    marginTop: 8,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedSortOptionItem: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: THEME.colors.primaryNeon,
  },
  sortOptionTextGroup: {
    flex: 1,
  },
  sortOptionLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedSortOptionLabel: {
    color: THEME.colors.primaryNeon,
  },
  sortOptionSubLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sortCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.colors.primaryNeon,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeBtn: {
    padding: 4,
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
