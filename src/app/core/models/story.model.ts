import { Timestamp } from '@angular/fire/firestore';

export type StoryStatus = 'pending' | 'voting' | 'completed';

export interface Story {
  storyId: string;
  title: string;
  description: string;
  status: StoryStatus;
  order: number;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  finalEstimate: string | null;
  estimateConsensus: boolean;
  statistics: StoryStatistics;
}

export interface StoryStatistics {
  average: number | null;
  mode: string | null;
  min: string | null;
  max: string | null;
  totalVotes: number;
}

export interface CreateStoryDto {
  title: string;
  description: string;
}

export interface Vote {
  userId: string;
  userName: string;
  userPhoto: string | null;
  value: string;
  votedAt: Timestamp;
}

export interface Message {
  messageId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  text: string;
  createdAt: Timestamp;
}
