import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

export default function App() {
  const { initialize, isPlaying, updatePosition, position, duration } = usePlayerStore();
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  // Tick playback position when playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        const nextPos = position + 1;
        if (duration > 0 && nextPos >= duration) {
          usePlayerStore.getState().skipToNext();
        } else {
          updatePosition(nextPos);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, position, duration]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
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
              tabBarStyle: styles.tabBar,
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
                tabBarLabel: 'Smart Albums',
                tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="Equalizer"
              component={EqualizerScreen}
              options={{
                tabBarLabel: 'DSP EQ',
                tabBarIcon: ({ color, size }) => <Sliders color={color} size={size} />,
              }}
            />
            <Tab.Screen
              name="SessionStats"
              component={SessionStatsScreen}
              options={{
                tabBarLabel: 'Session AI',
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
