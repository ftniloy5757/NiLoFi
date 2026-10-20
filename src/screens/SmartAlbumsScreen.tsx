import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import SmartClassifier from '../services/smartClassifier';
import { SmartCategory } from '../types';

export const SmartAlbumsScreen: React.FC = () => {
  const { tracks, playTrack } = usePlayerStore();
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
            <Text style={styles.autoTagText}>AUTO-ORGANIZED</Text>
          </View>
          <Text style={styles.trackCount}>{item.trackCount} Tracks</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Smart Albums" />

      {/* Info Banner */}
      <View style={styles.banner}>
        <Sparkles size={16} color={THEME.colors.primaryNeon} />
        <Text style={styles.bannerText}>
          Real-time on-device categorization • 100% Free & Offline
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryCard}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
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
});

export default SmartAlbumsScreen;
