import mongoose, { Schema, Document } from 'mongoose';

export interface ITrack {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  addedAt: Date;
}

export interface IPlaylist extends Document {
  name: string;
  tracks: ITrack[];
  createdAt: Date;
  updatedAt: Date;
}

const trackSchema = new Schema<ITrack>({
  videoId: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  thumbnail: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
});

const playlistSchema = new Schema<IPlaylist>({
  name: { type: String, required: true },
  tracks: [trackSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Playlist = mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', playlistSchema); 