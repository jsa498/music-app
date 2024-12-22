import { Track } from '../types/track';

interface RecommendationParams {
  currentTrack?: Track;
  recentTracks?: Track[];
  limit?: number;
}

export async function getRecommendations({ 
  currentTrack, 
  recentTracks = [], 
  limit = 10 
}: RecommendationParams): Promise<Track[]> {
  try {
    let recommendations: Track[] = [];

    // Strategy 1: Get recommendations based on current track
    if (currentTrack) {
      const params = new URLSearchParams({
        videoId: currentTrack.videoId,
        limit: limit.toString(),
      });

      try {
        const response = await fetch(`/api/youtube/recommendations?${params}`);
        if (response.ok) {
          const data = await response.json();
          recommendations = data.map((item: any) => ({
            id: item.videoId,
            videoId: item.videoId,
            title: item.title,
            artist: item.artist,
            thumbnail: item.thumbnail,
            addedAt: new Date(),
          }));
        }
      } catch (error) {
        console.error('Error getting recommendations from current track:', error);
      }
    }

    // Strategy 2: If no recommendations yet, try based on recent tracks
    if (recommendations.length === 0 && recentTracks.length > 0) {
      // Get unique artists from recent tracks
      const recentArtists = [...new Set(recentTracks.map(track => track.artist))];
      const randomArtist = recentArtists[Math.floor(Math.random() * recentArtists.length)];
      
      const params = new URLSearchParams({
        q: `${randomArtist} music type:video`,
        limit: limit.toString(),
      });

      try {
        const response = await fetch(`/api/youtube/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          recommendations = data.map((item: any) => ({
            id: item.id.videoId,
            videoId: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            addedAt: new Date(),
          }));
        }
      } catch (error) {
        console.error('Error getting recommendations from recent tracks:', error);
      }
    }

    // Strategy 3: If still no recommendations, get trending music
    if (recommendations.length === 0) {
      try {
        const response = await fetch('/api/youtube/trending');
        if (response.ok) {
          const data = await response.json();
          recommendations = data.map((item: any) => ({
            id: item.id.videoId,
            videoId: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium.url,
            addedAt: new Date(),
          }));
        }
      } catch (error) {
        console.error('Error getting trending music:', error);
      }
    }

    // Filter out any potential duplicates
    const uniqueRecommendations = recommendations.filter((track, index, self) =>
      index === self.findIndex((t) => t.videoId === track.videoId)
    );

    return uniqueRecommendations.slice(0, limit);
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return [];
  }
} 