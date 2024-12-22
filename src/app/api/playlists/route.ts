import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import { Playlist } from '../../../models/Playlist';

export async function GET() {
  try {
    await connectDB();
    const playlists = await Playlist.find({}).sort({ createdAt: -1 });
    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    
    const playlist = new Playlist({
      name: body.name,
      tracks: [],
    });
    
    await playlist.save();
    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    
    const playlist = await Playlist.findByIdAndUpdate(
      body._id,
      { 
        $set: { 
          name: body.name,
          tracks: body.tracks,
          updatedAt: new Date(),
        }
      },
      { new: true }
    );
    
    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }
    
    await connectDB();
    await Playlist.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
} 