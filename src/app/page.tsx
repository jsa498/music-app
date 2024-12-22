'use client';

import { useEffect, useState, useRef } from 'react';
import usePlayerStore from '../store/usePlayerStore';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import MusicCard from '../components/MusicCard';

interface Playlist {
  _id: string;
  name: string;
  tracks: any[];
}

export default function Home() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const recentlyPlayedRef = useRef<HTMLDivElement>(null);
  const { 
    recentlyPlayed,
    currentTrack,
    isPlaying,
    setCurrentTrack,
    setIsPlaying,
    addToQueue
  } = usePlayerStore();

  useEffect(() => {
    // Fetch playlists
    fetch('/api/playlists')
      .then((res) => res.json())
      .then((data) => setPlaylists(data))
      .catch((error) => console.error('Error fetching playlists:', error));
  }, []);

  const handlePlay = (track: any) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleAddToPlaylist = (track: any) => {
    addToQueue(track);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!recentlyPlayedRef.current) return;
    
    const scrollAmount = 220; // Card width (200px) + gap (20px)
    const currentScroll = recentlyPlayedRef.current.scrollLeft;
    const targetScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;

    recentlyPlayedRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleScroll('left');
      } else if (e.key === 'ArrowRight') {
        handleScroll('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-bold mb-2">Good evening</h1>
        <p className="text-[#aaaaaa]">Welcome to your music library</p>
      </div>
      
      {/* Recently Played */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recently played</h2>
          {recentlyPlayed.length > 6 && (
            <Link href="/history" className="text-sm text-gray-400 hover:text-white">
              See all
            </Link>
          )}
        </div>

        <div className="relative">
          <div 
            ref={recentlyPlayedRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          >
            {recentlyPlayed.map((track) => (
              <div key={track.id} className="snap-start">
                <MusicCard
                  result={{
                    id: { videoId: track.videoId },
                    snippet: {
                      title: track.title,
                      channelTitle: track.artist,
                      thumbnails: {
                        medium: { url: track.thumbnail }
                      }
                    }
                  }}
                  type="video"
                  onPlay={() => handlePlay(track)}
                  onAddToPlaylist={() => handleAddToPlaylist(track)}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                />
              </div>
            ))}
          </div>

          {recentlyPlayed.length > 6 && (
            <>
              <div className="absolute left-0 top-0 bottom-4 w-24 bg-gradient-to-r from-black to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-black to-transparent pointer-events-none" />
            </>
          )}
        </div>
      </div>

      {/* Your Playlists */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Your Playlists</h2>
          <Link 
            href="/library"
            className="text-[#aaaaaa] hover:text-white text-sm font-medium"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {playlists.slice(0, 6).map((playlist) => (
            <Link 
              key={playlist._id} 
              href={`/playlist/${playlist._id}`}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="aspect-square bg-white/5 rounded-lg mb-4 flex items-center justify-center">
                {playlist.tracks[0] ? (
                  <img
                    src={playlist.tracks[0].thumbnail}
                    alt={playlist.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-4xl text-white/20">🎵</div>
                )}
              </div>
              <h3 className="font-medium text-white/90 truncate">{playlist.name}</h3>
              <p className="text-sm text-white/60">{playlist.tracks.length} tracks</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
} 