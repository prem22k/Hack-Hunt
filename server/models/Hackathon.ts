import mongoose, { Document, Schema } from 'mongoose';

export interface IHackathon extends Document {
  title: string;
  organizer: string;
  description: string;
  startDate: Date;
  endDate: Date;
  mode: 'online' | 'offline' | 'hybrid';
  isPaid: boolean;
  skills: string[];
  registrationUrl: string;
  source: 'mlh' | 'kaggle' | 'devpost';
  lastUpdated: Date;
  location?: string; // Keeping for compatibility/extra info
  prize?: string;    // Keeping for compatibility/extra info
}

const HackathonSchema: Schema = new Schema({
  title: { type: String, required: true },
  organizer: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  mode: { 
    type: String, 
    enum: ['online', 'offline', 'hybrid'],
    required: true 
  },
  isPaid: { type: Boolean, required: true, default: false },
  skills: [{ type: String }],
  registrationUrl: { type: String, required: true },
  source: { 
    type: String, 
    enum: ['mlh', 'kaggle', 'devpost'],
    required: true 
  },
  lastUpdated: { type: Date, default: Date.now },
  location: { type: String },
  prize: { type: String }
});

// Prevent duplicates using Unique index on title + startDate + source
HackathonSchema.index({ title: 1, startDate: 1, source: 1 }, { unique: true });

export default mongoose.model<IHackathon>('Hackathon', HackathonSchema);
