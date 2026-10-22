import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  Sliders,
  ShieldCheck,
  Bluetooth,
  Speaker,
  Headphones,
  Car,
  RotateCcw,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import DSPEngine, { EQ_FREQUENCIES, BUILT_IN_PRESETS } from '../services/dspEngine';

export const EqualizerScreen: React.FC = () => {
  const activePreset = usePlayerStore((s) => s.activePreset);
  const selectEQPreset = usePlayerStore((s) => s.selectEQPreset);
  const setEQBand = usePlayerStore((s) => s.setEQBand);
  const setBassBoost = usePlayerStore((s) => s.setBassBoost);
  const setVirtualizer = usePlayerStore((s) => s.setVirtualizer);
  const isEQEnabled = usePlayerStore((s) => s.isEQEnabled);
  const toggleEQ = usePlayerStore((s) => s.toggleEQ);
  const activeRoute = usePlayerStore((s) => s.activeRoute);

  const preAmpGain = DSPEngine.calculatePreAmpAutoGain(activePreset.gains);

  const getRouteIcon = (route: string) => {
    switch (route) {
      case 'Bluetooth':
        return <Bluetooth size={16} color={THEME.colors.primaryNeon} />;
      case 'Wired':
        return <Headphones size={16} color={THEME.colors.primaryNeon} />;
      case 'Car':
        return <Car size={16} color={THEME.colors.primaryNeon} />;
      default:
        return <Speaker size={16} color={THEME.colors.primaryNeon} />;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Equalizer" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Switch & Output Device Status */}
        <View style={styles.topStatusCard}>
          <View style={styles.deviceStatus}>
            {getRouteIcon(activeRoute)}
            <Text style={styles.deviceText}>Audio Device: {activeRoute}</Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {isEQEnabled ? 'Sound Enhancer: ON' : 'Sound Enhancer: OFF'}
            </Text>
            <Switch
              value={isEQEnabled}
              onValueChange={toggleEQ}
              trackColor={{
                false: '#334155',
                true: THEME.colors.primary,
              }}
              thumbColor={isEQEnabled ? THEME.colors.primaryNeon : '#94A3B8'}
            />
          </View>
        </View>

        {/* Clean Sound Limiter Meter */}
        <View style={styles.limiterCard}>
          <View style={styles.limiterHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldCheck size={18} color={THEME.colors.success} />
              <Text style={styles.limiterTitle}>Clean Sound Guard</Text>
            </View>
            <Text
              style={[
                styles.preAmpValue,
                preAmpGain < 0 ? { color: THEME.colors.warning } : { color: THEME.colors.success },
              ]}
            >
              {preAmpGain < 0 ? 'Peak Control: Active' : 'Sound Guard: Safe'}
            </Text>
          </View>
          <Text style={styles.limiterDesc}>
            {preAmpGain < 0
              ? 'Automatically softens harsh volume spikes to keep music crisp and clear.'
              : 'Natural sound balance active with full dynamic range.'}
          </Text>
        </View>

        {/* Preset Selector Chips */}
        <Text style={styles.sectionHeader}>SOUND PRESETS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScroll}
        >
          {BUILT_IN_PRESETS.map((preset) => {
            const isActive = activePreset.id === preset.id;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, isActive && styles.activePresetChip]}
                onPress={() => selectEQPreset(preset)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    isActive && styles.activePresetChipText,
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 10-Band Graphic Equalizer Sliders */}
        <View style={styles.eqCard}>
          <View style={styles.eqCardHeader}>
            <Text style={styles.eqCardTitle}>Custom Sound Tuning</Text>
            <TouchableOpacity
              onPress={() => selectEQPreset(BUILT_IN_PRESETS[0])}
              style={styles.resetBtn}
            >
              <RotateCcw size={14} color={THEME.colors.textMuted} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bandsContainer}>
            {activePreset.gains.map((gain, index) => {
              const freq = EQ_FREQUENCIES[index];
              const normalizedHeight = ((gain + 12) / 24) * 120; // 0 to 120px

              return (
                <View key={freq} style={styles.bandColumn}>
                  <Text style={styles.bandGainText}>
                    {gain > 0 ? `+${gain}` : gain}
                  </Text>

                  {/* Vertical Interactive Slider Track */}
                  <View style={styles.sliderTrack}>
                    {/* Zero dB midline */}
                    <View style={styles.zeroLine} />
                    <View
                      style={[
                        styles.sliderFill,
                        {
                          height: normalizedHeight,
                          backgroundColor:
                            gain > 0
                              ? THEME.colors.primaryNeon
                              : 'rgba(255, 255, 255, 0.2)',
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.bandFreqText}>{freq}</Text>

                  {/* Quick increment/decrement buttons */}
                  <View style={styles.stepButtons}>
                    <TouchableOpacity
                      onPress={() => setEQBand(index, gain + 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEQBand(index, gain - 1)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bass & Surround Sound Controls */}
        <View style={styles.fxRow}>
          {/* Deep Bass */}
          <View style={styles.fxCard}>
            <Text style={styles.fxTitle}>Deep Bass</Text>
            <Text style={styles.fxValue}>
              {Math.round((activePreset.bassBoost / 1000) * 100)}%
            </Text>
            <View style={styles.fxBarBg}>
              <View
                style={[
                  styles.fxBarFill,
                  { width: `${(activePreset.bassBoost / 1000) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.fxButtons}>
              <TouchableOpacity
                onPress={() => setBassBoost(Math.max(0, activePreset.bassBoost - 150))}
                style={styles.fxBtn}
              >
                <Text style={styles.fxBtnText}>-15%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBassBoost(Math.min(1000, activePreset.bassBoost + 150))}
                style={styles.fxBtn}
              >
                <Text style={styles.fxBtnText}>+15%</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Surround Sound */}
          <View style={styles.fxCard}>
            <Text style={styles.fxTitle}>Surround Sound</Text>
            <Text style={styles.fxValue}>
              {Math.round((activePreset.virtualizer / 1000) * 100)}%
            </Text>
            <View style={styles.fxBarBg}>
              <View
                style={[
                  styles.fxBarFill,
                  { width: `${(activePreset.virtualizer / 1000) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.fxButtons}>
              <TouchableOpacity
                onPress={() => setVirtualizer(Math.max(0, activePreset.virtualizer - 150))}
                style={styles.fxBtn}
              >
                <Text style={styles.fxBtnText}>-15%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVirtualizer(Math.min(1000, activePreset.virtualizer + 150))}
                style={styles.fxBtn}
              >
                <Text style={styles.fxBtnText}>+15%</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  topStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: THEME.colors.primaryNeon,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  limiterCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  limiterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limiterTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  preAmpValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  limiterDesc: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  sectionHeader: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  presetsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  activePresetChip: {
    backgroundColor: THEME.colors.primaryNeon,
    borderColor: THEME.colors.primaryNeon,
  },
  presetChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activePresetChipText: {
    color: '#000000',
    fontWeight: '800',
  },
  eqCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  eqCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eqCardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  bandsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    paddingVertical: 10,
  },
  bandColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bandGainText: {
    color: THEME.colors.primaryNeon,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  sliderTrack: {
    width: 6,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  zeroLine: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 1,
  },
  sliderFill: {
    width: '100%',
    borderRadius: 3,
  },
  bandFreqText: {
    color: THEME.colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 6,
  },
  stepButtons: {
    marginTop: 6,
    flexDirection: 'row',
  },
  stepBtn: {
    paddingHorizontal: 3,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    marginHorizontal: 1,
  },
  stepBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  fxRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  fxCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  fxTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  fxValue: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  fxBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  fxBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primaryNeon,
    borderRadius: 3,
  },
  fxButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  fxBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fxBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default EqualizerScreen;
