import { Database } from './database';

// Database types
export type User = Database['public']['Tables']['users']['Row'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

// Onboarding data
export interface OnboardingData {
  reason: string[];
  situation: string;
  challenge: string;
  frequency: 'daily' | '3-4x-week' | 'as-needed';
}

// Navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Onboarding4: undefined;
  Onboarding5: undefined;
  FirstRecording: undefined;
  Loading: { transcript: string; audioUri: string };
  Mood: { transcript: string; audioUri: string; insight: string; keyFacts: string[] };
  Insight: { transcript: string; audioUri: string; insight: string; keyFacts: string[]; moodScore: number };
  Paywall: { sessionId: string };
  Main: undefined;
  SessionDetail: { sessionId: string };
  SessionList: { date?: string; userId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Stats: undefined;
  Settings: undefined;
};

// Recording state
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  transcript: string;
}

// Mood mapping
export const MOOD_EMOJI = {
  1: '😢', 2: '😢', 3: '😕',
  4: '😕', 5: '😐', 6: '😐',
  7: '🙂', 8: '🙂', 9: '😊', 10: '😊'
} as const;
