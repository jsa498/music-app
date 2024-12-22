'use client';

import { useState, useCallback } from 'react';
import SearchBar from '../../components/SearchBar';
import MusicCard from '../../components/MusicCard';
import usePlayerStore from '../../store/usePlayerStore';

interface SearchResult {
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
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToQueue, setCurrentTrack, setIsPlaying } = usePlayerStore();

  const handlePlayTrack = useCallback((result: SearchResult) => {
    if (!result.id.videoId) return;

    const track = {
      id: result.id.videoId,
      videoId: result.id.videoId,
      title: result.snippet.title,
      artist: result.snippet.channelTitle,
      thumbnail: result.snippet.thumbnails.medium.url,
      addedAt: new Date(),
    };

    setCurrentTrack(track);
    setIsPlaying(true);
  }, [setCurrentTrack, setIsPlaying]);

  const handleAddToPlaylist = useCallback((result: SearchResult) => {
    if (!result.id.videoId) return;

    const track = {
      id: result.id.videoId,
      videoId: result.id.videoId,
      title: result.snippet.title,
      artist: result.snippet.channelTitle,
      thumbnail: result.snippet.thumbnails.medium.url,
      addedAt: new Date(),
    };

    addToQueue(track);
  }, [addToQueue]);

  const handleSearch = useCallback((searchResults: SearchResult[]) => {
    setResults(searchResults);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((result) => (
          <MusicCard
            key={result.id.videoId || result.id.playlistId || result.id.channelId}
            result={result}
            type={result.id.videoId ? 'video' : result.id.playlistId ? 'playlist' : 'channel'}
            onPlay={() => handlePlayTrack(result)}
            onAddToPlaylist={() => handleAddToPlaylist(result)}
          />
        ))}
      </div>
    </div>
  );
} 