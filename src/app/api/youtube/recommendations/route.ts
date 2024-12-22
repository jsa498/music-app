import { google, youtube_v3 } from 'googleapis';
import { NextResponse } from 'next/server';

interface Track {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  addedAt: Date;
}

const youtube = google.youtube('v3');
const API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');
    const limit = Number(searchParams.get('limit')) || 10;

    if (!videoId || !title || !artist) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    // Try to get related videos using search
    const searchResponse = await youtube.search.list({
      key: API_KEY,
      part: ['snippet'],
      maxResults: limit,
      type: ['video'],
      q: `${title} ${artist}`,
      videoCategoryId: '10', // Music category
    });

    if (!searchResponse.data.items) {
      return NextResponse.json({ items: [] });
    }

    const recommendations: Track[] = searchResponse.data.items
      .filter((item) => item.id?.videoId !== videoId)
      .map((item) => ({
        videoId: item.id?.videoId || '',
        title: item.snippet?.title || '',
        artist: item.snippet?.channelTitle || '',
        thumbnail: item.snippet?.thumbnails?.default?.url || '',
        addedAt: new Date(),
      }));

    return NextResponse.json({ items: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
} 