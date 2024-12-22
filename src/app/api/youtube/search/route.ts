import { NextResponse } from 'next/server';
import { google, youtube_v3 } from 'googleapis';

const youtube = google.youtube('v3');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT_DURATION = 1000; // 1 second
let lastRequestTimestamp = 0;

async function searchWithScraping(query: string): Promise<any[]> {
  try {
    // Use YouTube's search page as a fallback (no API key needed)
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from YouTube');
    }

    const html = await response.text();
    
    // Extract initial data from the YouTube page
    const ytInitialData = html.match(/ytInitialData\s*=\s*({.+?});/)?.[1];
    
    if (!ytInitialData) {
      return [];
    }

    try {
      const data = JSON.parse(ytInitialData);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      
      const results = contents
        .filter((content: any) => content.videoRenderer)
        .map((content: any) => {
          const video = content.videoRenderer;
          return {
            id: { videoId: video.videoId },
            snippet: {
              title: video.title.runs[0].text,
              channelTitle: video.ownerText.runs[0].text,
              thumbnails: {
                medium: {
                  url: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
                },
              },
            },
          };
        })
        .slice(0, 25); // Return only first 25 results

      return results;
    } catch (error) {
      console.error('Error parsing YouTube data:', error);
      return [];
    }
  } catch (error) {
    console.error('YouTube scraping error:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.trim();
    const type = url.searchParams.get('type') || 'video';
    const duration = url.searchParams.get('duration');
    const sortBy = url.searchParams.get('sortBy');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Create cache key from all parameters
    const cacheKey = `${query}-${type}-${duration}-${sortBy}`;

    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      console.log('Returning cached result for:', query);
      return NextResponse.json(cachedResult.data);
    }

    // Try YouTube API first
    if (YOUTUBE_API_KEY) {
      try {
        // Implement rate limiting
        const now = Date.now();
        if (now - lastRequestTimestamp < RATE_LIMIT_DURATION) {
          const waitTime = RATE_LIMIT_DURATION - (now - lastRequestTimestamp);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastRequestTimestamp = Date.now();

        console.log(`Searching YouTube for: "${query}" (type: ${type})`);

        const params: youtube_v3.Params$Resource$Search$List = {
          part: ['snippet'],
          q: query,
          maxResults: 25,
          type: [type],
          key: YOUTUBE_API_KEY,
          regionCode: 'US',
          videoEmbeddable: type === 'video' ? 'true' : undefined,
          videoSyndicated: type === 'video' ? 'true' : undefined,
          safeSearch: 'none',
        };

        if (type === 'video') {
          Object.assign(params, {
            videoCategoryId: '10',
            videoType: 'any',
          });

          if (duration && duration !== 'any') {
            params.videoDuration = duration;
          }

          if (sortBy && sortBy !== 'relevance') {
            params.order = sortBy;
          }
        }

        const response = await youtube.search.list(params);
        const data = response.data;
        
        if (!data.items || data.items.length === 0) {
          throw new Error('No results found');
        }

        const transformedItems = data.items
          .filter(item => {
            const hasValidId = item.id && (
              (type === 'video' && item.id.videoId) ||
              (type === 'playlist' && item.id.playlistId) ||
              (type === 'channel' && item.id.channelId)
            );
            const hasValidThumbnail = item.snippet?.thumbnails?.medium?.url;
            const hasValidTitle = item.snippet?.title && !item.snippet.title.includes('\\');
            return hasValidId && hasValidThumbnail && hasValidTitle;
          })
          .map(item => ({
            id: item.id,
            snippet: {
              title: item.snippet?.title || '',
              channelTitle: item.snippet?.channelTitle || '',
              thumbnails: {
                medium: {
                  url: item.snippet?.thumbnails?.medium?.url || '',
                },
              },
            },
          }));

        // Cache the results
        cache.set(cacheKey, {
          data: transformedItems,
          timestamp: Date.now(),
        });

        return NextResponse.json(transformedItems);
      } catch (error: any) {
        console.error('YouTube API Error:', {
          message: error.message,
          code: error.code,
          errors: error.errors,
        });

        // If quota is exceeded or API key is invalid, try scraping
        if (error.code === 403 || error.code === 400 || error.code === 401) {
          console.log('Falling back to YouTube scraping');
          const scrapedResults = await searchWithScraping(query);
          
          if (scrapedResults.length > 0) {
            // Cache the scraped results
            cache.set(cacheKey, {
              data: scrapedResults,
              timestamp: Date.now(),
            });
            return NextResponse.json(scrapedResults);
          }
        }

        // Return cached results if available
        if (cachedResult) {
          console.log('Returning stale cached results');
          return NextResponse.json(cachedResult.data);
        }

        // If no results found, try scraping as a last resort
        console.log('Trying scraping as a last resort');
        const scrapedResults = await searchWithScraping(query);
        
        if (scrapedResults.length > 0) {
          cache.set(cacheKey, {
            data: scrapedResults,
            timestamp: Date.now(),
          });
          return NextResponse.json(scrapedResults);
        }

        return NextResponse.json({ 
          error: 'Search failed',
          details: 'No results found'
        }, { status: 404 });
      }
    } else {
      // If no API key is configured, use scraping
      console.log('No API key configured, using YouTube scraping');
      const scrapedResults = await searchWithScraping(query);
      
      if (scrapedResults.length > 0) {
        cache.set(cacheKey, {
          data: scrapedResults,
          timestamp: Date.now(),
        });
        return NextResponse.json(scrapedResults);
      }

      return NextResponse.json({ 
        error: 'Search failed',
        details: 'No results found'
      }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
} 