'use client';

import { memo, useCallback, useState } from 'react';
import { PlayIcon, PlusIcon, PauseIcon } from '@heroicons/react/24/outline';
import usePlayerStore from '../store/usePlayerStore';

interface MusicCardProps {
  result: {
    id: {
      videoId?: string;
      playlistId?: string;
      channelId?: string;
    };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
    };
  };
  type: 'video' | 'playlist' | 'channel';
  onPlay: () => void;
  onAddToPlaylist: () => void;
  isCurrentTrack?: boolean;
  isPlaying?: boolean;
}

const PlayPauseIcon = memo(({ isPlaying }: { isPlaying: boolean }) => (
  isPlaying ? (
    <PauseIcon className="w-6 h-6 text-black" />
  ) : (
    <PlayIcon className="w-6 h-6 text-black" />
  )
));

PlayPauseIcon.displayName = 'PlayPauseIcon';

const MusicCard = memo(({ 
  result, 
  type, 
  onPlay, 
  onAddToPlaylist, 
  isCurrentTrack = false,
  isPlaying = false 
}: MusicCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onPlay();
  }, [onPlay]);

  const handleAddToPlaylistClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddToPlaylist();
  }, [onAddToPlaylist]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div 
      className={`relative rounded-lg overflow-hidden bg-[#282828] select-none
                ${isCurrentTrack ? 'ring-2 ring-primary' : ''}
                hover:shadow-xl w-[160px]`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
        willChange: 'transform',
      }}
    >
      <div className="relative aspect-square">
        <img
          src={result.snippet.thumbnails.medium.url}
          alt={result.snippet.title}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
        {type === 'video' && (
          <div 
            className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2
                     transition-opacity duration-200 ease-out`}
            style={{
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? 'auto' : 'none',
            }}
          >
            <button
              onClick={handleAddToPlaylistClick}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors transform hover:scale-105 active:scale-95"
              title="Add to playlist"
              type="button"
            >
              <PlusIcon className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={handlePlayClick}
              className="p-1.5 rounded-full bg-white hover:bg-white/90 transition-colors transform hover:scale-105 active:scale-95"
              title={isPlaying && isCurrentTrack ? "Pause" : "Play"}
              type="button"
            >
              <PlayPauseIcon isPlaying={isPlaying && isCurrentTrack} />
            </button>
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-xs font-medium line-clamp-1 text-gray-100 mb-0.5">
          {result.snippet.title}
        </h3>
        <p className="text-[10px] text-gray-400 line-clamp-1">
          {result.snippet.channelTitle}
        </p>
      </div>
    </div>
  );
});

MusicCard.displayName = 'MusicCard';

export default MusicCard; 