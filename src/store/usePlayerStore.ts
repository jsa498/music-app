import { create } from 'zustand';
import { Track } from '../types/track';
import { getRecommendations } from '../services/recommendations';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  recentlyPlayed: Track[];
  currentTrackIndex: number;
  volume: number;
  progress: number;
  duration: number;
  isShuffling: boolean;
  isRepeating: boolean;
  isSeeking: boolean;
  isExpanded: boolean;
  isQueueVisible: boolean;
  isAutoPlayEnabled: boolean;
  isLoadingRecommendations: boolean;
  recommendationsError: string | null;

  // Track Control
  setCurrentTrack: (track: Track | null, addToQueue?: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  
  // Queue Management
  setQueue: (queue: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  
  // Recently Played
  addToRecentlyPlayed: (track: Track) => void;
  clearRecentlyPlayed: () => void;
  
  // Player Controls
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTrackIndex: (index: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setIsSeeking: (isSeeking: boolean) => void;
  
  // UI State
  setIsExpanded: (isExpanded: boolean) => void;
  toggleQueueVisibility: () => void;
  
  // Auto-play controls
  setAutoPlayEnabled: (enabled: boolean) => void;
  loadRecommendations: () => Promise<void>;
}

const MIN_QUEUE_SIZE = 3;
const MAX_QUEUE_SIZE = 50;
const MAX_RECENTLY_PLAYED = 20;

// Load recently played from localStorage
const loadRecentlyPlayed = (): Track[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('recentlyPlayed');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading recently played:', error);
    return [];
  }
};

const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  queue: [],
  recentlyPlayed: loadRecentlyPlayed(),
  currentTrackIndex: 0,
  volume: 1,
  progress: 0,
  duration: 0,
  isShuffling: false,
  isRepeating: false,
  isSeeking: false,
  isExpanded: false,
  isQueueVisible: false,
  isAutoPlayEnabled: true,
  isLoadingRecommendations: false,
  recommendationsError: null,

  setCurrentTrack: (track, addToQueue = false) => {
    const state = get();
    
    if (track) {
      // Add current track to recently played
      if (state.currentTrack) {
        state.addToRecentlyPlayed(state.currentTrack);
      }
      
      if (addToQueue) {
        const isInQueue = state.queue.some(t => t.id === track.id);
        if (!isInQueue) {
          set({ 
            queue: [...state.queue, track],
            currentTrackIndex: state.queue.length,
            currentTrack: track,
            isPlaying: true
          });
          return;
        }
      }
      
      set({ 
        currentTrack: track,
        isPlaying: true
      });

      // Load recommendations if queue is getting low
      if (state.isAutoPlayEnabled && state.queue.length < MIN_QUEUE_SIZE) {
        state.loadRecommendations();
      }
    } else {
      set({ currentTrack: null, isPlaying: false });
    }
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  // Queue Management
  setQueue: (queue) => set({ queue }),
  addToQueue: (track) => {
    const { queue } = get();
    const isInQueue = queue.some(t => t.id === track.id);
    if (!isInQueue) {
      set((state) => ({ queue: [...state.queue, track] }));
    }
  },
  removeFromQueue: (trackId) =>
    set((state) => {
      const newQueue = state.queue.filter((track) => track.id !== trackId);
      const currentTrackIndex = state.currentTrackIndex;
      
      // Adjust current track index if needed
      if (currentTrackIndex >= newQueue.length) {
        return {
          queue: newQueue,
          currentTrackIndex: Math.max(0, newQueue.length - 1)
        };
      }
      
      return { queue: newQueue };
    }),
  clearQueue: () => set({ 
    queue: [], 
    currentTrack: null, 
    isPlaying: false,
    currentTrackIndex: 0 
  }),
  moveQueueItem: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newQueue = [...state.queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      
      // Adjust current track index if needed
      let newIndex = state.currentTrackIndex;
      if (fromIndex === state.currentTrackIndex) {
        newIndex = toIndex;
      } else if (
        fromIndex < state.currentTrackIndex && 
        toIndex >= state.currentTrackIndex
      ) {
        newIndex--;
      } else if (
        fromIndex > state.currentTrackIndex && 
        toIndex <= state.currentTrackIndex
      ) {
        newIndex++;
      }
      
      return {
        queue: newQueue,
        currentTrackIndex: newIndex
      };
    });
  },
  
  // Recently Played Management
  addToRecentlyPlayed: (track) => {
    if (!track) return;
    
    set((state) => {
      // Don't add if it's already the most recent track
      if (state.recentlyPlayed[0]?.id === track.id) {
        return state;
      }
      
      const newRecentlyPlayed = [
        track,
        ...state.recentlyPlayed.filter(t => t.id !== track.id)
      ].slice(0, MAX_RECENTLY_PLAYED);

      // Save to localStorage
      localStorage.setItem('recentlyPlayed', JSON.stringify(newRecentlyPlayed));
      
      return { recentlyPlayed: newRecentlyPlayed };
    });
  },

  clearRecentlyPlayed: () => {
    set({ recentlyPlayed: [] });
    localStorage.setItem('recentlyPlayed', JSON.stringify([]));
  },
  
  // Player Controls
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setCurrentTrackIndex: (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      const track = queue[index];
      set({ 
        currentTrackIndex: index,
        currentTrack: track,
        isPlaying: true,
      });
      get().addToRecentlyPlayed(track);
    }
  },

  toggleShuffle: () => set((state) => ({ isShuffling: !state.isShuffling })),
  toggleRepeat: () => set((state) => ({ isRepeating: !state.isRepeating })),

  playNext: () => {
    const state = get();
    const nextTrack = state.queue[0];

    if (nextTrack) {
      // Remove the played track from queue
      const newQueue = state.queue.slice(1);
      set({ 
        currentTrack: nextTrack,
        queue: newQueue,
        isPlaying: true
      });

      // Add current track to recently played
      state.addToRecentlyPlayed(nextTrack);

      // Load more recommendations if queue is getting low
      if (state.isAutoPlayEnabled && newQueue.length < MIN_QUEUE_SIZE) {
        state.loadRecommendations();
      }
    } else if (state.isRepeating) {
      // If repeat is on and queue is empty, replay current track
      if (state.currentTrack) {
        state.setCurrentTrack(state.currentTrack);
      }
    } else {
      // If no next track and no repeat, stop playing
      set({ 
        currentTrack: null,
        isPlaying: false
      });

      // Try to load recommendations if autoplay is enabled
      if (state.isAutoPlayEnabled) {
        state.loadRecommendations();
      }
    }
  },

  playPrevious: () => {
    const { queue, currentTrackIndex, progress, isRepeating } = get();
    if (!queue.length) return;

    // If current track has played for more than 3 seconds, restart it
    if (progress > 3) {
      get().setProgress(0);
      return;
    }

    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      if (!isRepeating) {
        get().setProgress(0);
        return;
      }
      prevIndex = queue.length - 1;
    }
    get().setCurrentTrackIndex(prevIndex);
  },

  seekTo: (time: number) => {
    set({ progress: time });
    const player = (window as any).youtubePlayer;
    if (player) {
      player.seekTo(time);
    }
  },
  
  setIsSeeking: (isSeeking: boolean) => set({ isSeeking }),
  
  // UI State
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  toggleQueueVisibility: () => set((state) => ({ isQueueVisible: !state.isQueueVisible })),
  
  // Auto-play controls
  setAutoPlayEnabled: (enabled) => set({ isAutoPlayEnabled: enabled }),
  
  loadRecommendations: async () => {
    const state = get();
    if (state.isLoadingRecommendations || !state.isAutoPlayEnabled) return;

    set({ isLoadingRecommendations: true, recommendationsError: null });

    try {
      const recommendations = await getRecommendations({
        currentTrack: state.currentTrack,
        recentTracks: state.recentlyPlayed,
        limit: MAX_QUEUE_SIZE - state.queue.length
      });

      if (recommendations.length > 0) {
        // Filter out tracks that are already in queue or recently played
        const newTracks = recommendations.filter(track => {
          const isInQueue = state.queue.some(t => t.id === track.id);
          const isCurrentTrack = state.currentTrack?.id === track.id;
          const isRecentlyPlayed = state.recentlyPlayed.some(t => t.id === track.id);
          return !isInQueue && !isCurrentTrack && !isRecentlyPlayed;
        });

        if (newTracks.length > 0) {
          set(state => ({ 
            queue: [...state.queue, ...newTracks].slice(0, MAX_QUEUE_SIZE)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      set({ recommendationsError: 'Failed to load recommendations' });
    } finally {
      set({ isLoadingRecommendations: false });
    }
  },
}));

export default usePlayerStore; 