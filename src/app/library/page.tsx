'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline';
import usePlayerStore from '../../store/usePlayerStore';

interface Playlist {
  _id: string;
  name: string;
  tracks: any[];
}

export default function LibraryPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists');
      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName }),
      });

      if (response.ok) {
        setNewPlaylistName('');
        setIsCreating(false);
        fetchPlaylists();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setCurrentTrack(playlist.tracks[0]);
      setIsPlaying(true);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[2rem] font-bold mb-2">Library</h1>
          <p className="text-[#aaaaaa]">{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Create playlist</span>
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 p-6 bg-[#181818] rounded-lg">
          <h2 className="text-xl font-bold mb-4">Create new playlist</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              className="input-primary flex-1"
              autoFocus
            />
            <button
              onClick={handleCreatePlaylist}
              className="btn-primary"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewPlaylistName('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {playlists.map((playlist) => (
          <Link
            key={playlist._id}
            href={`/playlist/${playlist._id}`}
            className="music-card group"
          >
            <div className="music-card-image bg-[#282828] flex items-center justify-center">
              {playlist.tracks.length > 0 ? (
                <img
                  src={playlist.tracks[0].thumbnail}
                  alt={playlist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl text-[#aaaaaa]">🎵</div>
              )}
              <div className="music-card-overlay">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handlePlayPlaylist(playlist);
                  }}
                  className="player-control-primary"
                  title="Play"
                >
                  <PlayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="music-card-title">{playlist.name}</h3>
            <p className="music-card-subtitle">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
} 