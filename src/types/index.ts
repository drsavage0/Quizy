
import type { User as FirebaseUser } from "firebase/auth";
import type { TranslationKey } from "@/lib/translations";

export type Difficulty = "easy" | "smart" | "master";

export interface GeneratedQuestion {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  topic: string;
  questions: GeneratedQuestion[];
}

export interface UserProfile extends Partial<FirebaseUser> {
  // uid, displayName, email, photoURL are from FirebaseUser
  isAnonymous?: boolean; // Added for anonymous users
  totalQuizPoints?: number; // New field for cumulative points
  // Add any custom fields if needed
}

export interface ScoreEntry {
  id?: string; // Document ID from Firestore
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  score: number;
  totalQuestions: number;
  topic: string;
  timestamp: Date;
}

export interface Category {
  name: string; 
  icon: React.ElementType;
  description?: string; 
  translationKey: TranslationKey; 
  descriptionKey: TranslationKey; 
  popular?: boolean; 
}

export interface MultiplayerMode {
  id: string;
  translationKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: React.ElementType;
  path: string; // e.g. /multiplayer/speed-challenge (can be non-functional for now)
}

// Multiplayer Score Attack Types
export interface PlayerGameState {
  userId: string;
  displayName: string | null;
  avatarUrl?: string | null;
  score: number;
  currentAnswerIndex: number | null; // Index of the answer chosen for the current question
  hasAnsweredThisRound: boolean;
}

export interface ScoreAttackGameData {
  gameId: string;
  player1: PlayerGameState | null;
  player2: PlayerGameState | null;
  currentQuestionIndex: number;
  questions?: GeneratedQuestion[]; // Questions for the current game session
  status: 'waiting' | 'fetchingQuestions' | 'preparingMatch' | 'active' | 'player1_won' | 'player2_won' | 'tie' | 'abandoned';
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}

// Multiplayer Speed Challenge Lobby Types
export interface SpeedChallengePlayerData {
  userId: string;
  displayName: string | null;
  avatarUrl?: string | null;
}
export interface SpeedChallengeGameData {
  gameId: string;
  player1: SpeedChallengePlayerData | null;
  player2: SpeedChallengePlayerData | null;
  status: 'waiting' | 'active'; // 'active' triggers client-side simulation for both
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
}
