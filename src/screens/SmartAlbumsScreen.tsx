import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  CloudRain,
  Heart,
  Flame,
  Disc,
  Clock,
  Sparkles,
  Headphones,
  Play,
  Sparkle,
  Plus,
  Trash2,
  Music,
  X,
  ListMusic,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import SmartClassifier from '../services/smartClassifier';
import { SmartCategory, CustomPlaylist, Track } from '../types';

export const SmartAlbumsScreen: React.FC = () => {
  const {
    tracks,
    playTrack,
    customPlaylists,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    playPlaylist,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'smart' | 'custom'>('smart');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<CustomPlaylist | null>(null);

  const categories = SmartClassifier.getSmartCategories(tracks);

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'CloudRain':
        return <CloudRain size={28} color="#38BDF8" />;
      case 'Heart':
        return <Heart size={28} color="#F43F5E" />;
      case 'Flame':
        return <Flame size={28} color="#F59E0B" />;
      case 'Disc':
        return <Disc size={28} color="#818CF8" />;
      case 'Clock':
        return <Clock size={28} color="#10B981" />;
      case 'Sparkles':
        return <Sparkles size={28} color="#EC4899" />;
      case 'Headphones':
      default:
        return <Headphones size={28} color="#A78BFA" />;
    }
  };

  const handlePlayCategory = (category: SmartCategory) => {
    const matching = tracks.filter(category.filter);
    if (matching.length > 0) {
      playTrack(matching[0]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      return;
    }
    await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateModalOpen(false);
  };

  const handleDeletePlaylist = (playlistId: string, name: string) => {
    deletePlaylist(playlistId);
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
  };

  const renderCategoryCard = ({ item }: { item: SmartCategory }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handlePlayCategory(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>{getCategoryIcon(item.iconName)}</View>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => handlePlayCategory(item)}
          >
            <Play size={16} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.autoTag}>
            <Sparkle size={10} color={THEME.colors.primaryNeon} />
            <Text style={styles.autoTagText}>SMART MIX</Text>
          </View>
          <Text style={styles.trackCount}>{item.trackCount} Tracks</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCustomPlaylistCard = ({ item }: { item: CustomPlaylist }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setSelectedPlaylist(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
            <ListMusic size={26} color={item.accentColor || THEME.colors.primaryNeon} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeletePlaylist(item.id, item.name)}
            >
              <Trash2 size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.playBtn, { marginLeft: 10 }]}
              onPress={() => playPlaylist(item)}
            >
              <Play size={16} color="#FFF" fill="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.description || 'Personal playlist'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.autoTag, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
            <Music size={10} color={THEME.colors.primary} />
            <Text style={[styles.autoTagText, { color: THEME.colors.primaryNeon }]}>
              MY PLAYLIST
            </Text>
          </View>
          <Text style={styles.trackCount}>{item.trackIds.length} Tracks</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Tracks in currently selected playlist
  const currentPlaylistTracks = selectedPlaylist
    ? tracks.filter((t) => selectedPlaylist.trackIds.includes(t.id))
    : [];

  return (
    <View style={styles.container}>
      <Header title="Playlists" />

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'smart' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('smart')}
        >
          <Sparkles
            size={14}
            color={activeTab === 'smart' ? THEME.colors.primaryNeon : THEME.colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeTab === 'smart' && styles.activeSegmentText]}
          >
            Smart Collections
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'custom' && styles.activeSegmentBtn]}
          onPress={() => setActiveTab('custom')}
        >
          <ListMusic
            size={14}
            color={activeTab === 'custom' ? THEME.colors.primaryNeon : THEME.colors.textMuted}
          />
          <Text
            style={[styles.segmentText, activeTab === 'custom' && styles.activeSegmentText]}
          >
            My Playlists ({customPlaylists.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle Banner */}
      <View style={styles.banner}>
        <Sparkles size={14} color={THEME.colors.primaryNeon} />
        <Text style={styles.bannerText}>
          {activeTab === 'smart'
            ? 'Automatic Collections • Grouped by mood and style'
            : 'Custom Playlists • Created by you and saved offline'}
        </Text>
      </View>

      {activeTab === 'smart' ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<CourtesyFooter />}
        />
      ) : (
        <FlatList
          data={customPlaylists}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomPlaylistCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.createBtnCard}
              onPress={() => setIsCreateModalOpen(true)}
            >
              <View style={styles.createIconBox}>
                <Plus size={20} color={THEME.colors.primaryNeon} />
              </View>
              <View>
                <Text style={styles.createTitle}>+ Create New Playlist</Text>
                <Text style={styles.createSub}>Create your own custom music mix</Text>
              </View>
            </TouchableOpacity>
          }
          ListFooterComponent={<CourtesyFooter />}
        />
      )}

      {/* Modal: Create Playlist */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name (e.g. Chill Nights, Gym)"
              placeholderTextColor={THEME.colors.textMuted}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, { marginTop: 10 }]}
              placeholder="Description (optional)"
              placeholderTextColor={THEME.colors.textMuted}
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  !newPlaylistName.trim() && { opacity: 0.5 },
                ]}
                disabled={!newPlaylistName.trim()}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.confirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: View Selected Playlist Tracks */}
      <Modal
        visible={!!selectedPlaylist}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlaylist(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.playlistDetailCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedPlaylist?.name}</Text>
                <Text style={styles.playlistDetailSub}>
                  {currentPlaylistTracks.length} {currentPlaylistTracks.length === 1 ? 'song' : 'songs'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPlaylist(null)}>
                <X size={22} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {currentPlaylistTracks.length > 0 && (
              <TouchableOpacity
                style={styles.playAllPlaylistBtn}
                onPress={() => {
                  if (selectedPlaylist) {
                    playPlaylist(selectedPlaylist);
                    setSelectedPlaylist(null);
                  }
                }}
              >
                <Play size={16} color="#FFF" fill="#FFF" />
                <Text style={styles.playAllPlaylistText}>Play All</Text>
              </TouchableOpacity>
            )}

            {currentPlaylistTracks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No songs added yet.</Text>
                <Text style={styles.emptySubText}>
                  Go to your Library and tap the "+" icon on any song to add it here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={currentPlaylistTracks}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 360, marginTop: 12 }}
                renderItem={({ item }) => (
                  <View style={styles.playlistTrackRow}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        playTrack(item);
                        setSelectedPlaylist(null);
                      }}
                    >
                      <Text style={styles.playlistTrackTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.playlistTrackArtist} numberOfLines={1}>
                        {item.artist}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeTrackBtn}
                      onPress={() => {
                        if (selectedPlaylist) {
                          removeTrackFromPlaylist(selectedPlaylist.id, item.id);
                          setSelectedPlaylist({
                            ...selectedPlaylist,
                            trackIds: selectedPlaylist.trackIds.filter((id) => id !== item.id),
                          });
                        }
                      }}
                    >
                      <Trash2 size={16} color={THEME.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              />
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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeSegmentBtn: {
    backgroundColor: THEME.colors.card,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginLeft: 6,
  },
  activeSegmentText: {
    color: THEME.colors.primaryNeon,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  bannerText: {
    color: THEME.colors.textHighlight,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
  createBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderStyle: 'dashed',
  },
  createIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  createTitle: {
    color: THEME.colors.primaryNeon,
    fontSize: 15,
    fontWeight: '700',
  },
  createSub: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    marginTop: 14,
  },
  cardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autoTagText: {
    color: THEME.colors.primaryNeon,
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  trackCount: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  playlistDetailCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  playlistDetailSub: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playAllPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 8,
  },
  playAllPlaylistText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  playlistTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  playlistTrackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  playlistTrackArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  removeTrackBtn: {
    padding: 8,
  },
});

export default SmartAlbumsScreen;
