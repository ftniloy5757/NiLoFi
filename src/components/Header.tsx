import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moon, Search } from 'lucide-react-native';
import THEME from '../constants/theme';
import usePlayerStore from '../store/usePlayerStore';

interface HeaderProps {
  title?: string;
  onOpenTimer?: () => void;
  onToggleSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'NiLoFi',
  onOpenTimer,
  onToggleSearch,
}) => {
  const { sleepTimer } = usePlayerStore();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android'
    ? (StatusBar.currentHeight || 40) + 10
    : Math.max(insets.top, 20) + 6;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.titleColumn}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.badgeText}>OFFLINE MUSIC</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onToggleSearch && (
          <TouchableOpacity onPress={onToggleSearch} style={styles.actionBtn}>
            <Search color={THEME.colors.textSecondary} size={20} />
          </TouchableOpacity>
        )}

        {onOpenTimer && (
          <TouchableOpacity
            onPress={onOpenTimer}
            style={[
              styles.actionBtn,
              sleepTimer.isActive && styles.activeTimerBtn,
            ]}
          >
            <Moon
              color={
                sleepTimer.isActive
                  ? THEME.colors.primaryNeon
                  : THEME.colors.textSecondary
              }
              size={20}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  titleColumn: {
    marginLeft: 10,
  },
  titleText: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeText: {
    color: THEME.colors.primaryNeon,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeTimerBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.primaryNeon,
  },
});

export default Header;
