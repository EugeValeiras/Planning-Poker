import { Timestamp } from '@angular/fire/firestore';

export type RoleType = 'moderator' | 'voter' | 'observer';

export interface Room {
  roomId: string;
  roomCode: string;
  name: string;
  description: string;
  createdBy: string;
  moderatorId: string;
  votingScale: string[];
  isVotingActive: boolean;
  votesRevealed: boolean;
  currentStoryId: string | null;
  timerDuration: number;
  timerStartedAt: Timestamp | null;
  timerPausedAt: Timestamp | null;
  timerRemainingSeconds: number | null;
  actionLoading: boolean;
  actionLoadingMessage: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateRoomDto {
  name: string;
  description: string;
  votingScale?: string[];
}

export interface Participant {
  userId: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: RoleType;
  isOnline: boolean;
  lastSeen: Timestamp;
  hasVoted: boolean;
  joinedAt: Timestamp;
}
