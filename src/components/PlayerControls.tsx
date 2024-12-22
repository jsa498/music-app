'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowPathRoundedSquareIcon,
  ArrowsRightLeftIcon,
  QueueListIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/solid';

interface PlayerControlsProps {
  expanded?: boolean;
  onQueueClick?: () => void;
}

export default function PlayerControls({ expanded = false, onQueueClick }: PlayerControlsProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    setIsPlaying,
    setVolume,
    queue,
    isShuffling,
    isRepeating,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    seekTo,
    isSeeking,
    setIsSeeking,
    isAutoPlayEnabled,
    setAutoPlayEnabled,
    isLoadingRecommendations,
  } = usePlayerStore();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (newVolume > 0) {
        setIsMuted(false);
      }
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMuted, volume, prevVolume, setVolume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setHoverTime(percentage * duration);
  };

  if (!currentTrack) return null;

  const progressBar = (
    <div 
      className={`w-full ${expanded ? 'mb-6 px-8' : 'mb-2 px-2'}`}
      onMouseEnter={() => setIsHoveringProgress(true)}
      onMouseLeave={() => setIsHoveringProgress(false)}
    >
      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
        <span>{formatTime(progress)}</span>
        <span>{isHoveringProgress ? formatTime(hoverTime) : formatTime(duration)}</span>
      </div>
      <div 
        ref={progressBarRef}
        className={`group bg-white/10 rounded-full relative cursor-pointer ${expanded ? 'h-2' : 'h-1'}`}
        onClick={handleProgressBarClick}
        onMouseMove={handleProgressBarHover}
      >
        <div
          className="absolute h-full bg-white/80 rounded-full transition-all"
          style={{ width: `${(progress / duration) * 100}%` }}
        />
        {isHoveringProgress && (
          <div
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${(hoverTime / duration) * 100}%` }}
          />
        )}
        <div 
          className={`absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white rounded-full shadow-lg transform transition-opacity ${
            isHoveringProgress ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ left: `${(progress / duration) * 100}%` }}
        />
      </div>
    </div>
  );

  const playbackControls = (
    <div className={`flex items-center justify-center space-x-4 ${expanded ? 'scale-125 mb-8' : ''}`}>
      <button 
        onClick={toggleShuffle}
        className={`player-control ${isShuffling ? 'text-accent' : 'text-gray-400'}`}
        title="Shuffle"
      >
        <ArrowsRightLeftIcon className="w-4 h-4" />
      </button>
      <button 
        onClick={playPrevious}
        className="player-control text-gray-400"
        title="Previous"
      >
        <BackwardIcon className="w-4 h-4" />
      </button>
      <button
        onClick={handlePlayPause}
        className="player-control-primary"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon className="w-4 h-4" />
        ) : (
          <PlayIcon className="w-4 h-4 ml-0.5" />
        )}
      </button>
      <button 
        onClick={playNext}
        className="player-control text-gray-400"
        title="Next"
      >
        <ForwardIcon className="w-4 h-4" />
      </button>
      <button 
        onClick={toggleRepeat}
        className={`player-control ${isRepeating ? 'text-accent' : 'text-gray-400'}`}
        title="Repeat"
      >
        <ArrowPathRoundedSquareIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setAutoPlayEnabled(!isAutoPlayEnabled)}
        className={`player-control relative ${isAutoPlayEnabled ? 'text-accent' : 'text-gray-400'}`}
        title="Autoplay similar songs"
      >
        <PlayCircleIcon className="w-4 h-4" />
        {isLoadingRecommendations && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
    </div>
  );

  const volumeControls = (
    <div className="flex items-center space-x-2 justify-end">
      <button
        onClick={onQueueClick}
        className="player-control text-gray-400 mr-2"
        title="Queue"
      >
        <QueueListIcon className="w-4 h-4" />
      </button>
      <button
        onClick={toggleMute}
        className="player-control text-gray-400"
        title={volume === 0 ? 'Unmute' : 'Mute'}
      >
        {volume === 0 ? (
          <SpeakerXMarkIcon className="w-4 h-4" />
        ) : (
          <SpeakerWaveIcon className="w-4 h-4" />
        )}
      </button>
      <div className="w-24 group">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          title="Volume"
        />
      </div>
    </div>
  );

  const queueButton = (
    <button
      onClick={onQueueClick}
      className="player-control-button"
      title="Queue"
    >
      <QueueListIcon className="w-5 h-5" />
    </button>
  );

  if (expanded) {
    return (
      <div className="w-full">
        {progressBar}
        {playbackControls}
        {volumeControls}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {progressBar}
      <div className="flex items-center gap-2 px-2 py-2">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-[180px] max-w-[250px]">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-12 h-12 rounded shadow-lg"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate text-white/90">{currentTrack.title}</h3>
            <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex-1 flex justify-center">
          {playbackControls}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center min-w-[180px] justify-end">
          {volumeControls}
        </div>
      </div>
    </div>
  );
} 