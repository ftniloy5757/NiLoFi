import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import playbackService from './service';

// Register Root App Component
registerRootComponent(App);

// Register Android Background Playback Service
TrackPlayer.registerPlaybackService(() => playbackService);
