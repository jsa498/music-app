'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  QueueListIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/solid';
import usePlayerStore from '../store/usePlayerStore';
import Image from 'next/image';

export default function MobilePlayer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    setIsPlaying,
    setProgress,
    setVolume,
    playNext,
    playPrevious,
    toggleQueueVisibility,
  } = usePlayerStore();

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const miniPlayer = (
    <motion.div
      initial={false}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-40"
    >
      <div
        className="flex items-center px-4 py-2"
        onClick={() => setIsExpanded(true)}
      >
        <div className="relative w-12 h-12 rounded-md overflow-hidden mr-3">
          <Image
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium">{currentTrack.title}</div>
          <div className="truncate text-xs text-gray-400">
            {currentTrack.artist}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const expandedPlayer = (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black z-50"
    >
      <div className="h-full flex flex-col px-4 pt-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <ChevronDownIcon className="w-6 h-6" />
          </button>
          <button
            onClick={toggleQueueVisibility}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <QueueListIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Album Art */}
        <div className="relative aspect-square w-full max-w-sm mx-auto mb-8 rounded-lg overflow-hidden">
          <Image
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Track Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{currentTrack.title}</h2>
          <p className="text-gray-400">{currentTrack.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <input
            type="range"
            min={0}
            max={duration}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={playPrevious}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <BackwardIcon className="w-8 h-8" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 bg-white text-black rounded-full hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </button>
          <button
            onClick={playNext}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <ForwardIcon className="w-8 h-8" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-4">
          <SpeakerWaveIcon className="w-6 h-6" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isExpanded ? expandedPlayer : miniPlayer}
    </AnimatePresence>
  );
} 