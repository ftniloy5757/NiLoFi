import TrackPlayer, { Event } from 'react-native-track-player';
import usePlayerStore from './src/store/usePlayerStore';

export default async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    usePlayerStore.getState().togglePlayPause();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    usePlayerStore.getState().togglePlayPause();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    usePlayerStore.getState().seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
    usePlayerStore.getState().skipToNext();
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
    if (event && typeof event.position === 'number') {
      usePlayerStore.getState().updatePosition(event.position);
      if (event.duration && event.duration > 0) {
        usePlayerStore.setState({ duration: event.duration });
      }
    }
  });

  TrackPlayer.addEventListener(Event.RemoteDuck, async (event) => {
    if (event.paused) {
      await TrackPlayer.pause();
      usePlayerStore.setState({ isPlaying: false });
    } else {
      await TrackPlayer.play();
      usePlayerStore.setState({ isPlaying: true });
    }
  });
}
