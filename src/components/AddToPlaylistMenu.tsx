'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/solid';

interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface Playlist {
  _id: string;
  name: string;
  tracks: Track[];
}

interface AddToPlaylistMenuProps {
  track: Track;
  onClose: () => void;
}

export default function AddToPlaylistMenu({ track, onClose }: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<{ [key: string]: boolean }>({});

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
    } finally {
      setIsLoading(false);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    setIsAdding(prev => ({ ...prev, [playlistId]: true }));
    try {
      const playlist = playlists.find(p => p._id === playlistId);
      if (!playlist) return;

      // Check if track already exists in playlist
      if (playlist.tracks.some(t => t.videoId === track.videoId)) {
        return;
      }

      const updatedTracks = [...playlist.tracks, track];
      
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...playlist,
          tracks: updatedTracks,
        }),
      });

      if (response.ok) {
        // Update local state
        setPlaylists(prev =>
          prev.map(p =>
            p._id === playlistId
              ? { ...p, tracks: updatedTracks }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
    } finally {
      setIsAdding(prev => ({ ...prev, [playlistId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-secondary rounded-lg p-4 w-96 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Add to Playlist</h2>
        
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-800 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map(playlist => (
              <button
                key={playlist._id}
                onClick={() => addToPlaylist(playlist._id)}
                disabled={isAdding[playlist._id] || playlist.tracks.some(t => t.videoId === track.videoId)}
                className="w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-between group"
              >
                <span className="font-medium">{playlist.name}</span>
                {playlist.tracks.some(t => t.videoId === track.videoId) ? (
                  <CheckIcon className="w-5 h-5 text-primary" />
                ) : (
                  <PlusIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 