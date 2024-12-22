'use client';

import { useEffect, useRef, useCallback } from 'react';
import YouTube from 'react-youtube';
import usePlayerStore from '../store/usePlayerStore';

export default function YouTubePlayer() {
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout>();
  const recommendationsLoaded = useRef<boolean>(false);
  const retryCount = useRef<number>(0);
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 5000; // 5 seconds
  
  const {
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setProgress,
    setDuration,
    queue,
    currentTrackIndex,
    setCurrentTrackIndex,
    isShuffling,
    isRepeating,
    isSeeking,
    isAutoPlayEnabled,
    loadRecommendations,
  } = usePlayerStore();

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
    },
  };

  // Load recommendations proactively
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadRecommendationsIfNeeded = async () => {
      if (!currentTrack || !isAutoPlayEnabled || recommendationsLoaded.current) {
        return;
      }

      try {
        await loadRecommendations();
        recommendationsLoaded.current = true;
        retryCount.current = 0; // Reset retry count on success
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        
        // Only retry if we haven't exceeded the max retries
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          timeoutId = setTimeout(loadRecommendationsIfNeeded, RETRY_DELAY);
        } else {
          console.log('Max retries reached for recommendations');
        }
      }
    };

    loadRecommendationsIfNeeded();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentTrack, isAutoPlayEnabled, loadRecommendations]);

  // Reset recommendations loaded flag and retry count when track changes
  useEffect(() => {
    recommendationsLoaded.current = false;
    retryCount.current = 0;
  }, [currentTrack?.id]);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      if (playerRef.current && !isSeeking) {
        const currentTime = playerRef.current.getCurrentTime();
        setProgress(currentTime);
      }
    }, 100);
  }, [isSeeking, setProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = undefined;
    }
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    if (!playerRef.current) return;

    const handleStateChange = async () => {
      try {
        if (isPlaying && !isSeeking) {
          await playerRef.current.playVideo();
          startProgressTracking();
        } else {
          await playerRef.current.pauseVideo();
          stopProgressTracking();
        }
      } catch (error) {
        console.error('Error controlling YouTube player:', error);
      }
    };

    handleStateChange();

    return () => {
      stopProgressTracking();
    };
  }, [isPlaying, isSeeking, startProgressTracking, stopProgressTracking]);

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  const onReady = useCallback((event: any) => {
    playerRef.current = event.target;
    // Make player globally accessible for seeking
    (window as any).youtubePlayer = playerRef.current;
    playerRef.current.setVolume(volume * 100);
    const duration = playerRef.current.getDuration();
    setDuration(duration);
    if (isPlaying) {
      startProgressTracking();
    }
  }, [volume, setDuration, isPlaying, startProgressTracking]);

  const handleVideoEnd = useCallback(async () => {
    stopProgressTracking();
    
    // If repeat is on, replay the current track
    if (isRepeating) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
      return;
    }

    // Check if there are more tracks in the queue
    const nextTrackIndex = currentTrackIndex + 1;
    if (nextTrackIndex < queue.length) {
      setCurrentTrackIndex(nextTrackIndex);
      return;
    }

    // If autoplay is enabled and no more tracks in queue, try to load recommendations
    if (isAutoPlayEnabled) {
      try {
        await loadRecommendations();
        
        // After loading recommendations, check queue again
        if (queue.length > currentTrackIndex + 1) {
          setCurrentTrackIndex(currentTrackIndex + 1);
        } else {
          setIsPlaying(false);
          console.log('No more tracks available');
        }
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  }, [
    stopProgressTracking,
    isRepeating,
    currentTrackIndex,
    queue.length,
    setCurrentTrackIndex,
    isAutoPlayEnabled,
    loadRecommendations,
    setIsPlaying,
  ]);

  const onStateChange = useCallback((event: any) => {
    switch (event.data) {
      case YouTube.PlayerState.PLAYING:
        const duration = playerRef.current.getDuration();
        setDuration(duration);
        startProgressTracking();
        setIsPlaying(true);
        break;
      case YouTube.PlayerState.PAUSED:
        stopProgressTracking();
        setIsPlaying(false);
        break;
      case YouTube.PlayerState.ENDED:
        handleVideoEnd();
        break;
      default:
        if (event.data === -1) {
          console.error('YouTube player error');
          stopProgressTracking();
          setIsPlaying(false);
        }
        break;
    }
  }, [
    setDuration,
    startProgressTracking,
    stopProgressTracking,
    setIsPlaying,
    handleVideoEnd,
    queue.length,
    currentTrackIndex,
    setCurrentTrackIndex,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [stopProgressTracking]);

  if (!currentTrack) return null;

  return (
    <div className="hidden">
      <YouTube
        videoId={currentTrack.videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />
    </div>
  );
} 