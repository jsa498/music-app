'use client';

import { useEffect } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { ChevronDownIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/outline';
import PlayerControls from './PlayerControls';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface EnhancedPlayerProps {
  onQueueClick: () => void;
}

export default function EnhancedPlayer({ onQueueClick }: EnhancedPlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    volume,
    isExpanded,
    setIsExpanded 
  } = usePlayerStore();
  
  // Only expand on explicit user action
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  if (!currentTrack) return null;

  return (
    <div 
      className={`fixed bottom-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10
                 transition-all duration-300 ease-in-out transform
                 ${isExpanded ? 'h-[80vh]' : 'h-24'}`}
      style={{
        left: 'var(--sidebar-width, 0px)',
        width: 'calc(100% - var(--sidebar-width, 0px))'
      }}
    >
      {isExpanded && (
        <button 
          onClick={handleCollapseClick}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronDownIcon className="w-6 h-6" />
        </button>
      )}

      <div className="h-full">
        {isExpanded ? (
          <div className="grid grid-cols-2 gap-8 p-8 h-full">
            <div className="flex flex-col items-center justify-center">
              <img 
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-96 h-96 rounded-lg shadow-2xl"
              />
              <h2 className="text-2xl font-bold mt-6">{currentTrack.title}</h2>
              <p className="text-lg text-gray-400">{currentTrack.artist}</p>
              
              <div className="w-full mt-8">
                <PlayerControls expanded onQueueClick={onQueueClick} />
              </div>

              <div className="flex gap-4 mt-6">
                <button className="player-action-button">
                  <PlusIcon className="w-5 h-5" />
                  <span>Add to Playlist</span>
                </button>
                <button className="player-action-button">
                  <ShareIcon className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Up Next</h3>
                {/* Queue will be implemented in QueuePanel */}
              </div>
            </div>
          </div>
        ) : (
          <PlayerControls onQueueClick={onQueueClick} />
        )}
      </div>
    </div>
  );
} 