import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AppState, AppStateStatus, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TrackPlayer, { State } from 'react-native-track-player';
import {
  Music,
  Sparkles,
  Sliders,
  Activity,
} from 'lucide-react-native';

import THEME from './src/constants/theme';
import usePlayerStore from './src/store/usePlayerStore';
import LibraryScreen from './src/screens/LibraryScreen';
import SmartAlbumsScreen from './src/screens/SmartAlbumsScreen';
import EqualizerScreen from './src/screens/EqualizerScreen';
import SessionStatsScreen from './src/screens/SessionStatsScreen';
import MiniPlayer from './src/components/MiniPlayer';
import NowPlayingScreen from './src/screens/NowPlayingScreen';

const Tab = createBottomTabNavigator();

function AppContent() {
  const insets = useSafeAreaInsets();
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  const tabHeight = Platform.OS === 'ios' && insets.bottom > 0 ? 56 + insets.bottom : 60;
  const tabPaddingBottom = Platform.OS === 'ios' && insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View style={styles.root}>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: THEME.colors.primary,
            background: THEME.colors.background,
            card: THEME.colors.card,
            text: THEME.colors.textPrimary,
            border: THEME.colors.cardBorder,
            notification: THEME.colors.primaryNeon,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: [
              styles.tabBar,
              {
                height: tabHeight,
                paddingBottom: tabPaddingBottom,
              },
            ],
            tabBarActiveTintColor: THEME.colors.primaryNeon,
            tabBarInactiveTintColor: THEME.colors.textMuted,
            tabBarLabelStyle: styles.tabLabel,
          }}
        >
          <Tab.Screen
            name="Library"
            component={LibraryScreen}
            options={{
              tabBarLabel: 'Library',
              tabBarIcon: ({ color, size }) => <Music color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="SmartAlbums"
            component={SmartAlbumsScreen}
            options={{
              tabBarLabel: 'Playlists',
              tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Equalizer"
            component={EqualizerScreen}
            options={{
              tabBarLabel: 'Equalizer',
              tabBarIcon: ({ color, size }) => <Sliders color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="SessionStats"
            component={SessionStatsScreen}
            options={{
              tabBarLabel: 'Smart Mood',
              tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Floating MiniPlayer */}
      <MiniPlayer onPress={() => setIsNowPlayingOpen(true)} />

      {/* Full Screen Now Playing Hero */}
      <NowPlayingScreen
        visible={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
      />
    </View>
  );
}

export default function App() {
  const { initialize, isPlaying, updatePosition } = usePlayerStore();

  useEffect(() => {
    initialize();
  }, []);

  // Synchronize playback position & duration with native ExoPlayer / AVPlayer in real-time
  useEffect(() => {
    const syncProgressWithNative = async () => {
      try {
        const prog = await TrackPlayer.getProgress();
        if (prog && typeof prog.position === 'number') {
          updatePosition(prog.position);
          if (prog.duration && prog.duration > 0) {
            usePlayerStore.setState({ duration: prog.duration });
          }
        }
        const pbState = await TrackPlayer.getPlaybackState();
        const active = pbState.state === State.Playing || pbState.state === State.Buffering;
        usePlayerStore.setState({ isPlaying: active });
      } catch {}
    };

    // Immediate sync on mount
    syncProgressWithNative();

    // 1. Instantly re-sync whenever user returns from background, unlocks phone, or switches back
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        syncProgressWithNative();
      }
    });

    // 2. High-precision 500ms sync loop while actively playing
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(async () => {
        try {
          const prog = await TrackPlayer.getProgress();
          if (prog && typeof prog.position === 'number') {
            updatePosition(prog.position);
            if (prog.duration && prog.duration > 0) {
              usePlayerStore.setState({ duration: prog.duration });
              // Detect track completion and smoothly advance
              if (prog.duration > 0 && prog.position >= prog.duration - 0.5) {
                usePlayerStore.getState().skipToNext();
              }
            }
          }
        } catch {
          // Fallback if simulator
          const cur = usePlayerStore.getState().position;
          const tot = usePlayerStore.getState().duration;
          if (tot > 0 && cur >= tot) {
            usePlayerStore.getState().skipToNext();
          } else {
            updatePosition(cur + 1);
          }
        }
      }, 500);
    }

    return () => {
      appStateSub.remove();
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});
