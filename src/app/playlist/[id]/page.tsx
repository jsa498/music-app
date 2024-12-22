'use client';

import { useState, useEffect } from 'react';
import usePlayerStore from '../../../store/usePlayerStore';

interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  addedAt?: Date;
}

interface Playlist {
  _id: string;
  name: string;
  tracks: Track[];
}

export default function PlaylistPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    fetchPlaylist();
  }, [params.id]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${params.id}`);
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error('Error fetching playlist:', error);
    }
  };

  const handlePlay = (track: Track) => {
    setCurrentTrack({
      id: track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      videoId: track.videoId,
      addedAt: track.addedAt || new Date(),
    });
    setIsPlaying(true);
  };

  if (!playlist) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-700 rounded mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>
        <p className="text-gray-400">{playlist.tracks.length} tracks</p>
      </div>

      <div className="space-y-2">
        {playlist.tracks.map((track) => (
          <div
            key={track.videoId}
            className="flex items-center p-4 rounded bg-secondary hover:bg-opacity-80 cursor-pointer"
            onClick={() => handlePlay(track)}
          >
            <img
              src={track.thumbnail}
              alt={track.title}
              className="w-12 h-12 rounded mr-4"
            />
            <div>
              <h3 className="font-medium">{track.title}</h3>
              <p className="text-sm text-gray-400">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 