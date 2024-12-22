'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { XMarkIcon, QueueListIcon, MusicalNoteIcon, FunnelIcon, ClockIcon, Bars3Icon } from '@heroicons/react/24/outline';
import usePlayerStore from '../store/usePlayerStore';
import { DragDropContext, Droppable, Draggable, DroppableProps } from 'react-beautiful-dnd';

// Create a custom Droppable component with default props
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

interface EnhancedQueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedQueuePanel({ isOpen, onClose }: EnhancedQueuePanelProps) {
  const {
    currentTrack,
    queue,
    removeFromQueue,
    clearQueue,
    setCurrentTrackIndex,
    setIsPlaying,
    currentTrackIndex,
    moveQueueItem,
    isAutoPlayEnabled,
    isLoadingRecommendations,
    recentlyPlayed,
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'artist'>('default');
  const [holdingItemId, setHoldingItemId] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout>();

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    moveQueueItem(sourceIndex, destinationIndex);
  }, [moveQueueItem]);

  const handleRemoveFromQueue = useCallback((trackId: string, index: number) => {
    if (index === currentTrackIndex) {
      if (queue.length > 1) {
        const nextIndex = index === queue.length - 1 ? index - 1 : index;
        setCurrentTrackIndex(nextIndex);
      }
    }
    removeFromQueue(trackId);
  }, [currentTrackIndex, queue.length, removeFromQueue, setCurrentTrackIndex]);

  const handleClearQueue = useCallback(() => {
    if (confirm('Are you sure you want to clear the queue?')) {
      clearQueue();
      onClose();
    }
  }, [clearQueue, onClose]);

  const handlePlayTrack = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  }, [setCurrentTrackIndex, setIsPlaying]);

  const handleSaveAsPlaylist = useCallback(async () => {
    try {
      const name = prompt('Enter playlist name:');
      if (!name?.trim()) return;

      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          tracks: queue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }

      alert('Playlist created successfully!');
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  }, [queue]);

  const handleMouseDown = (trackId: string) => {
    holdTimerRef.current = setTimeout(() => {
      setHoldingItemId(trackId);
    }, 500); // 500ms hold time
  };

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setHoldingItemId(null);
  };

  useEffect(() => {
    // Cleanup hold timer on unmount
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  // Clean up song title to remove extra info
  const cleanSongTitle = (title: string) => {
    return title
      .replace(/\s*\|.*$/, '') // Remove everything after |
      .replace(/\s*\(Official.*?\)/, '') // Remove (Official...)
      .replace(/\s*\[.*?\]/, '') // Remove [...]
      .replace(/\s*\(.*?\)/, '') // Remove (...)
      .replace(/\s*-\s*.*$/, '') // Remove everything after -
      .trim();
  };

  const sortedQueue = [...queue].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'artist') {
      return a.artist.localeCompare(b.artist);
    }
    return 0;
  });

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[400px] bg-[#282828] shadow-2xl 
                   transform transition-all duration-300 ease-in-out z-[101]
                   flex flex-col overflow-hidden
                   ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <QueueListIcon className="w-6 h-6" />
            <h2 className="text-xl font-bold">Queue</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative
                      ${activeTab === 'queue' ? 'text-white' : 'text-[#aaaaaa] hover:text-white'}`}
          >
            Queue
            {activeTab === 'queue' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative
                      ${activeTab === 'history' ? 'text-white' : 'text-[#aaaaaa] hover:text-white'}`}
          >
            History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'queue' ? (
            <>
              {/* Now Playing */}
              {currentTrack && (
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-xs font-medium text-[#aaaaaa] uppercase tracking-wider mb-3">Now Playing</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-12 h-12 rounded shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{currentTrack.title}</h4>
                      <p className="text-sm text-[#aaaaaa] truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Queue Controls */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-medium text-[#aaaaaa] uppercase tracking-wider">Next Up</h3>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="text-xs bg-white/5 rounded-full px-3 py-1 text-[#aaaaaa]"
                    >
                      <option value="default">Default</option>
                      <option value="title">Sort by Title</option>
                      <option value="artist">Sort by Artist</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingRecommendations && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-[#aaaaaa]">Loading recommendations...</span>
                      </div>
                    )}
                    <span className="text-xs text-[#aaaaaa]">{queue.length} tracks</span>
                  </div>
                </div>
              </div>

              {/* Queue List */}
              <div className="p-4">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#aaaaaa]">
                    <MusicalNoteIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm">Your queue is empty</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <StrictModeDroppable droppableId="queue">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {sortedQueue.map((track, index) => (
                            <Draggable
                              key={track.id}
                              draggableId={track.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onMouseDown={() => handleMouseDown(track.id)}
                                  onMouseUp={handleMouseUp}
                                  onMouseLeave={handleMouseUp}
                                  onClick={() => handlePlayTrack(index)}
                                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group cursor-pointer relative
                                            ${snapshot.isDragging ? 'bg-white/10 shadow-lg scale-[1.02]' : ''}
                                            ${currentTrackIndex === index ? 'bg-white/10' : ''}`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    transition: snapshot.isDragging ? 'none' : 'all 0.2s ease-out',
                                  }}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative">
                                      <img
                                        src={track.thumbnail}
                                        alt={track.title}
                                        className="w-10 h-10 rounded shadow"
                                        loading="lazy"
                                      />
                                      <div 
                                        className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200
                                                  ${holdingItemId === track.id ? 'opacity-100' : 'opacity-0'}`}
                                      >
                                        <Bars3Icon className="w-6 h-6 text-white" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm truncate">
                                        {cleanSongTitle(track.title)}
                                      </h4>
                                      <p className="text-sm text-[#aaaaaa] truncate">{track.artist}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromQueue(track.id, index);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-white/10 p-1.5 rounded-full transition-all"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </StrictModeDroppable>
                  </DragDropContext>
                )}
              </div>
            </>
          ) : (
            // History Tab
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-5 h-5 text-[#aaaaaa]" />
                <h3 className="text-xs font-medium text-[#aaaaaa] uppercase tracking-wider">Recently Played</h3>
              </div>
              {recentlyPlayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[#aaaaaa]">
                  <ClockIcon className="w-12 h-12 mb-2" />
                  <p className="text-sm">No recently played tracks</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentlyPlayed.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer group"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded shadow"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{track.title}</h4>
                        <p className="text-sm text-[#aaaaaa] truncate">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {activeTab === 'queue' && queue.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-[#282828]">
            <div className="flex gap-2">
              <button
                onClick={handleSaveAsPlaylist}
                className="flex-1 py-2 px-4 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
              >
                Save as Playlist
              </button>
              <button
                onClick={handleClearQueue}
                className="flex-1 py-2 px-4 rounded-full bg-white/10 font-medium hover:bg-white/20 transition-colors"
              >
                Clear Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 