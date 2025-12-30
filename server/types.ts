export interface NormalizedHackathon {
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
  location?: string;
  prize?: string;
  imageUrl?: string;
}
