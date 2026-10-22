import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  Sliders,
  ShieldCheck,
  Bluetooth,
  Speaker,
  Headphones,
  Car,
  RotateCcw,
  Sparkles,
  Check,
  HelpCircle,
  Compass,
} from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';
import Header from '../components/Header';
import CourtesyFooter from '../components/CourtesyFooter';
import DSPEngine, { EQ_FREQUENCIES, BUILT_IN_PRESETS } from '../services/dspEngine';
import { EqualizerPreset } from '../types';

export const EqualizerScreen: React.FC = () => {
  const activePreset = usePlayerStore((s) => s.activePreset);
  const selectEQPreset = usePlayerStore((s) => s.selectEQPreset);
  const setEQBand = usePlayerStore((s) => s.setEQBand);
  const setBassBoost = usePlayerStore((s) => s.setBassBoost);
  const setVirtualizer = usePlayerStore((s) => s.setVirtualizer);
  const isEQEnabled = usePlayerStore((s) => s.isEQEnabled);
  const toggleEQ = usePlayerStore((s) => s.toggleEQ);
  const isDolbyAtmosEnabled = usePlayerStore((s) => s.isDolbyAtmosEnabled);
  const dolbyAtmosStrength = usePlayerStore((s) => s.dolbyAtmosStrength);
  const toggleDolbyAtmos = usePlayerStore((s) => s.toggleDolbyAtmos);
  const setDolbyAtmosStrength = usePlayerStore((s) => s.setDolbyAtmosStrength);
  const activeRoute = usePlayerStore((s) => s.activeRoute);

  const [showInfo, setShowInfo] = useState(false);

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

  const renderCardPattern = (pattern?: string) => {
    switch (pattern) {
      case 'standard':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Circle cx="135" cy="80" r="55" stroke="rgba(255,255,255,0.24)" strokeWidth="3" fill="none" />
            <Circle cx="135" cy="80" r="40" stroke="rgba(255,255,255,0.22)" strokeWidth="2.5" fill="none" />
            <Circle cx="135" cy="80" r="24" stroke="rgba(255,255,255,0.22)" strokeWidth="2" fill="none" />
            <Circle cx="25" cy="85" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
            <Circle cx="25" cy="85" r="30" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
          </Svg>
        );
      case 'natural':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Path d="M0 40 Q 40 10, 80 40 T 160 40" stroke="rgba(255,255,255,0.32)" strokeWidth="3.5" fill="none" />
            <Path d="M0 52 Q 40 22, 80 52 T 160 52" stroke="rgba(255,255,255,0.28)" strokeWidth="3" fill="none" />
            <Path d="M0 64 Q 40 34, 80 64 T 160 64" stroke="rgba(255,255,255,0.22)" strokeWidth="3" fill="none" />
            <Path d="M0 76 Q 40 46, 80 76 T 160 76" stroke="rgba(255,255,255,0.16)" strokeWidth="3" fill="none" />
          </Svg>
        );
      case 'thump':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Path d="M35 110 L15 0 L50 0 Z" fill="rgba(255,255,255,0.18)" />
            <Path d="M80 110 L60 0 L100 0 Z" fill="rgba(255,255,255,0.26)" />
            <Path d="M125 110 L110 0 L145 0 Z" fill="rgba(255,255,255,0.18)" />
          </Svg>
        );
      case 'amped':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Path d="M0 35 L20 52 L40 22 L60 52 L80 22 L100 52 L120 22 L140 52 L160 35" stroke="rgba(255,255,255,0.3)" strokeWidth="3.5" fill="none" />
            <Path d="M0 50 L20 67 L40 37 L60 67 L80 37 L100 67 L120 37 L140 67 L160 50" stroke="rgba(255,255,255,0.25)" strokeWidth="3" fill="none" />
            <Path d="M0 65 L20 82 L40 52 L60 82 L80 52 L100 82 L120 52 L140 82 L160 65" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
          </Svg>
        );
      case 'lyric':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Path d="M10 95 L145 10 L145 95 Z" fill="rgba(255,255,255,0.24)" />
            <Circle cx="128" cy="80" r="16" fill="rgba(255,255,255,0.3)" />
          </Svg>
        );
      case 'deep':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 160 110" style={StyleSheet.absoluteFill}>
            <Circle cx="80" cy="115" r="95" stroke="rgba(255,255,255,0.16)" strokeWidth="4" fill="none" />
            <Circle cx="80" cy="115" r="75" stroke="rgba(255,255,255,0.22)" strokeWidth="4" fill="none" />
            <Circle cx="80" cy="115" r="55" stroke="rgba(255,255,255,0.26)" strokeWidth="4" fill="none" />
            <Circle cx="80" cy="115" r="35" stroke="rgba(255,255,255,0.32)" strokeWidth="4" fill="none" />
            <Circle cx="80" cy="115" r="18" fill="rgba(255,255,255,0.38)" />
          </Svg>
        );
      default:
        return null;
    }
  };

  const dolbyPresets = BUILT_IN_PRESETS.filter((p) => p.isDolbyStyle);
  const activeDolbyDescription =
    activePreset.description ||
    'Dolby On signature curve: Balanced dynamics, crystal clarity, and expanded spatial depth.';

  return (
    <View style={styles.container}>
      <Header title="Equalizer & Dolby Audio" />

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
              {isEQEnabled ? 'Sound Engine: ON' : 'Sound Engine: OFF'}
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

        {/* DOLBY ATMOS 3D SPATIAL AUDIO CARD */}
        <View style={styles.atmosCard}>
          <View style={styles.atmosHeader}>
            <View style={styles.atmosBrandRow}>
              <View style={styles.dolbyLogoBadge}>
                <Text style={styles.dolbyLogoText}>DOLBY</Text>
              </View>
              <View style={styles.atmosTitleBox}>
                <Text style={styles.atmosMainTitle}>ATMOS</Text>
                <Text style={styles.atmosSubtitle}>3D SPATIAL AUDIO</Text>
              </View>
            </View>

            <Switch
              value={isDolbyAtmosEnabled}
              onValueChange={toggleDolbyAtmos}
              trackColor={{
                false: '#334155',
                true: THEME.colors.primary,
              }}
              thumbColor={isDolbyAtmosEnabled ? THEME.colors.primaryNeon : '#94A3B8'}
            />
          </View>

          {/* Spatial Status Badge */}
          <View style={styles.atmosStatusRow}>
            <View
              style={[
                styles.atmosStatusPill,
                isDolbyAtmosEnabled ? styles.atmosStatusPillActive : styles.atmosStatusPillInactive,
              ]}
            >
              <Compass
                size={13}
                color={isDolbyAtmosEnabled ? THEME.colors.primaryNeon : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.atmosStatusText,
                  isDolbyAtmosEnabled && { color: THEME.colors.primaryNeon },
                ]}
              >
                {isDolbyAtmosEnabled
                  ? '360° Binaural Spatial Dome Active'
                  : 'Stereo Processing Mode'}
              </Text>
            </View>
          </View>

          {/* Spatial Immersion Depth Slider (when enabled) */}
          {isDolbyAtmosEnabled && (
            <View style={styles.atmosControls}>
              <View style={styles.immersionHeader}>
                <Text style={styles.immersionLabel}>Spatial Immersion Level</Text>
                <Text style={styles.immersionValue}>
                  {Math.round((dolbyAtmosStrength / 1000) * 100)}%
                </Text>
              </View>

              <View style={styles.atmosBarBg}>
                <View
                  style={[
                    styles.atmosBarFill,
                    { width: `${(dolbyAtmosStrength / 1000) * 100}%` },
                  ]}
                />
              </View>

              <View style={styles.atmosStepButtons}>
                <TouchableOpacity
                  onPress={() => setDolbyAtmosStrength(Math.max(0, dolbyAtmosStrength - 150))}
                  style={styles.atmosStepBtn}
                >
                  <Text style={styles.atmosStepBtnText}>-15%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDolbyAtmosStrength(Math.min(1000, dolbyAtmosStrength + 150))}
                  style={styles.atmosStepBtn}
                >
                  <Text style={styles.atmosStepBtnText}>+15%</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.atmosDesc}>
            Binaural 3D acoustics transform stereo music into a panoramic spherical soundstage with height, depth, and spatial realism across phone speakers and headphones.
          </Text>
        </View>

        {/* DOLBY ON SOUND STYLES (MATCHING USER SCREENSHOT) */}
        <View style={styles.dolbyStylesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setShowInfo(!showInfo)}
                style={styles.infoBadgeBtn}
              >
                <HelpCircle size={15} color={THEME.colors.primaryNeon} />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>DOLBY ON SOUND STYLES</Text>
            </View>
            <Text style={styles.activeStyleBadge}>
              {activePreset.isDolbyStyle ? `${activePreset.name} Active` : 'Custom EQ'}
            </Text>
          </View>

          {showInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Dolby On styles apply proprietary multi-band acoustic dynamic curves, spatial stereo imaging, and harmonic tuning crafted for studio-quality mobile playback.
              </Text>
            </View>
          )}

          {/* Cards Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContent}
          >
            {dolbyPresets.map((preset) => {
              const isSelected = activePreset.id === preset.id;
              const gradientColors = preset.colors || ['#4C1D95', '#EA580C'];

              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.88}
                  style={[
                    styles.dolbyCard,
                    isSelected && styles.dolbyCardSelected,
                  ]}
                  onPress={() => selectEQPreset(preset)}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dolbyCardGradient}
                  >
                    {/* Background Decorative Graphic Pattern */}
                    {renderCardPattern(preset.pattern)}

                    {/* Top Right Badge */}
                    <View style={styles.cardTopBadgeRow}>
                      {preset.pattern === 'standard' && !isSelected && (
                        <View style={styles.standardSlidersBadge}>
                          <Sliders size={12} color="#FFFFFF" />
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    {/* Style Title */}
                    <View style={styles.cardBottomRow}>
                      <Text style={styles.dolbyCardTitle}>{preset.name}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dynamic Signature Curve Subtitle (Just like screenshot) */}
          <View style={styles.signatureDescBox}>
            <Text style={styles.signatureDescText}>{activeDolbyDescription}</Text>
          </View>
        </View>

        {/* Clean Sound Limiter Meter */}
        <View style={styles.limiterCard}>
          <View style={styles.limiterHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldCheck size={18} color={THEME.colors.primaryNeon} />
              <Text style={styles.limiterTitle}>Hardware Speaker Amplifier</Text>
            </View>
            <Text style={[styles.preAmpValue, { color: THEME.colors.primaryNeon }]}>
              Pixel Boost: Active (+3.5 dB)
            </Text>
          </View>
          <Text style={styles.limiterDesc}>
            Dynamic volume enhancer active. Amplifies audio output to deliver full, room-filling sound on phone speakers and rich punch on headphones.
          </Text>
        </View>

        {/* 10-Band Graphic Equalizer Sliders */}
        <View style={styles.eqCard}>
          <View style={styles.eqCardHeader}>
            <View>
              <Text style={styles.eqCardTitle}>Fine-Tune 10-Band Equalizer</Text>
              <Text style={styles.eqCardSub}>
                Adjust individual frequencies to customize the active sound style
              </Text>
            </View>
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
            <Text style={styles.fxTitle}>Deep Bass Punch</Text>
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
            <Text style={styles.fxTitle}>Surround Width</Text>
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
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 8,
  },

  // DOLBY ATMOS CARD
  atmosCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  atmosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atmosBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dolbyLogoBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginRight: 10,
  },
  dolbyLogoText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  atmosTitleBox: {
    justifyContent: 'center',
  },
  atmosMainTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  atmosSubtitle: {
    color: THEME.colors.primaryNeon,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  atmosStatusRow: {
    marginTop: 12,
  },
  atmosStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  atmosStatusPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  atmosStatusPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  atmosStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginLeft: 6,
  },
  atmosControls: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  immersionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  immersionLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  immersionValue: {
    color: THEME.colors.primaryNeon,
    fontSize: 13,
    fontWeight: '800',
  },
  atmosBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  atmosBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primaryNeon,
    borderRadius: 3,
  },
  atmosStepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  atmosStepBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  atmosStepBtnText: {
    color: THEME.colors.primaryNeon,
    fontSize: 11,
    fontWeight: '700',
  },
  atmosDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },

  // DOLBY ON SOUND STYLES SECTION
  dolbyStylesSection: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoBadgeBtn: {
    marginRight: 6,
    padding: 2,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  activeStyleBadge: {
    color: THEME.colors.primaryNeon,
    fontSize: 11,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoBoxText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  cardsScrollContent: {
    paddingVertical: 4,
  },
  dolbyCard: {
    width: 155,
    height: 105,
    borderRadius: 18,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dolbyCardSelected: {
    borderColor: THEME.colors.primaryNeon,
    shadowColor: THEME.colors.primaryNeon,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  dolbyCardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardTopBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  standardSlidersBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardBottomRow: {
    justifyContent: 'flex-end',
  },
  dolbyCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  signatureDescBox: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  signatureDescText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
  },

  // LIMITER CARD
  limiterCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
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
    marginLeft: 8,
  },
  preAmpValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  limiterDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },

  // EQUALIZER CARD
  eqCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 12,
  },
  eqCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eqCardTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  eqCardSub: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    maxWidth: 240,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  resetBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
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

  // FX ROW
  fxRow: {
    flexDirection: 'row',
    marginBottom: 16,
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
