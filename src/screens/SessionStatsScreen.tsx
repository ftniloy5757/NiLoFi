import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Activity,
  Zap,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';

export const SessionStatsScreen: React.FC = () => {
  const sessionVector = usePlayerStore((s) => s.sessionVector);
  const resetMood = usePlayerStore((s) => s.resetMood);

  const metrics = [
    { name: 'Late Night & Lofi', val: sessionVector.lofi_chill, color: '#38BDF8' },
    { name: 'Romantic & Melodic', val: sessionVector.romantic, color: '#F43F5E' },
    { name: 'High-Energy Party', val: sessionVector.high_energy, color: '#F59E0B' },
    { name: 'Acoustic & Unplugged', val: sessionVector.acoustic, color: '#10B981' },
    { name: 'Mashups & Remixes', val: sessionVector.mashup, color: '#818CF8' },
    { name: 'Deep Melancholy', val: sessionVector.sad, color: '#64748B' },
  ];

  return (
    <View style={styles.container}>
      <Header title="Smart Mood" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Pattern Lock Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.pillBadge}>
              <Sparkles size={12} color={THEME.colors.primaryNeon} />
              <Text style={styles.pillBadgeText}>SMART SHUFFLE</Text>
            </View>
            <TouchableOpacity onPress={resetMood} style={styles.resetBtn}>
              <RotateCcw size={14} color={THEME.colors.textMuted} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.lockTitle}>
            {sessionVector.activeLockLabel || 'Learning Your Music Vibe...'}
          </Text>
          <Text style={styles.lockSubtitle}>
            {sessionVector.activeLockLabel
              ? 'Your queue adjusts in real time as your mood shifts.'
              : 'Play or skip a couple of songs to tune the player to your taste.'}
          </Text>

          <View style={styles.statsMiniRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>{sessionVector.totalInteractions}</Text>
              <Text style={styles.miniStatLabel}>Songs Played</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>
                {Math.round(sessionVector.energy_tempo * 100)}%
              </Text>
              <Text style={styles.miniStatLabel}>Energy Level</Text>
            </View>
            <View style={styles.miniDivider} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNum}>15%</Text>
              <Text style={styles.miniStatLabel}>Fresh Variety</Text>
            </View>
          </View>
        </View>

        {/* Real-time Vibe Breakdown */}
        <View style={styles.vectorsCard}>
          <View style={styles.vectorsHeader}>
            <Activity size={18} color={THEME.colors.primaryNeon} />
            <Text style={styles.vectorsTitle}>Your Current Vibe Profile</Text>
          </View>

          {metrics.map((item) => {
            // Map value (-5 to 10) to 0% - 100%
            const normalizedRatio = Math.max(0.05, Math.min(1.0, (item.val + 2) / 10));

            return (
              <View key={item.name} style={styles.vectorRow}>
                <View style={styles.labelRow}>
                  <Text style={styles.vectorName}>{item.name}</Text>
                  <Text style={[styles.vectorScore, { color: item.color }]}>
                    {item.val > 0 ? `+${item.val.toFixed(1)}` : item.val.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${normalizedRatio * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* How It Works Guide */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <ShieldCheck size={18} color={THEME.colors.success} />
            <Text style={styles.infoTitle}>100% Private & Offline</Text>
          </View>
          <Text style={styles.infoDesc}>
            • <Text style={{ color: '#FFF' }}>Quick Skip:</Text> Skipping a song tells NiLoFi to play less of that genre.{'\n'}
            • <Text style={{ color: '#FFF' }}>Smart Boost:</Text> Finishing a song tells NiLoFi to queue more matching tracks.{'\n'}
            • <Text style={{ color: '#FFF' }}>Completely Private:</Text> Learns locally on your device with no internet needed.
          </Text>
        </View>

        <CourtesyFooter />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  heroCard: {
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderHighlight,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  pillBadgeText: {
    color: THEME.colors.primaryNeon,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  resetText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  lockTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  lockSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  statsMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatNum: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  miniStatLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  miniDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  vectorsCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  vectorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vectorsTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  vectorRow: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  vectorName: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  vectorScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  infoDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default SessionStatsScreen;
