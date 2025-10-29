import { supabase } from './supabase';
import { Session } from '../types';

/**
 * Fetches all sessions for a user, ordered by date (most recent first)
 */
export async function getUserSessions(userId: string): Promise<{ sessions: Session[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return { sessions: null, error: error.message };
    }

    return { sessions: data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching sessions:', err);
    return { sessions: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Fetches a single session by ID
 */
export async function getSessionById(sessionId: string): Promise<{ session: Session | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return { session: null, error: error.message };
    }

    return { session: data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching session:', err);
    return { session: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Groups sessions by date for calendar marking
 * Returns an object with date strings as keys and sessions as values
 */
export function groupSessionsByDate(sessions: Session[]): Record<string, Session[]> {
  const grouped: Record<string, Session[]> = {};

  sessions.forEach((session) => {
    if (!session.created_at) return;

    // Format date as YYYY-MM-DD for calendar
    const dateStr = session.created_at.split('T')[0];

    if (!grouped[dateStr]) {
      grouped[dateStr] = [];
    }
    grouped[dateStr].push(session);
  });

  return grouped;
}

/**
 * Gets the mood emoji for a given mood score
 */
export function getMoodEmoji(moodScore: number | null): string {
  if (!moodScore) return '😐';

  if (moodScore <= 2) return '😢';
  if (moodScore <= 4) return '😕';
  if (moodScore <= 6) return '😐';
  if (moodScore <= 8) return '🙂';
  return '😊';
}

/**
 * Formats a date string to a readable format
 */
export function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${dayName} ${day} ${month}`;
}

/**
 * Gets sessions for the current month
 */
export async function getSessionsThisMonth(userId: string): Promise<{ sessions: Session[] | null; error: string | null }> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions this month:', error);
      return { sessions: null, error: error.message };
    }

    return { sessions: data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching sessions this month:', err);
    return { sessions: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Gets sessions for the current week
 */
export async function getSessionsThisWeek(userId: string): Promise<{ sessions: Session[] | null; error: string | null }> {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions this week:', error);
      return { sessions: null, error: error.message };
    }

    return { sessions: data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching sessions this week:', err);
    return { sessions: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Calculates average mood for a set of sessions
 */
export function calculateAverageMood(sessions: Session[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const validMoods = sessions
    .map(s => s.mood_score)
    .filter((mood): mood is number => mood !== null && mood !== undefined);

  if (validMoods.length === 0) return 0;

  const sum = validMoods.reduce((acc, mood) => acc + mood, 0);
  return Math.round((sum / validMoods.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculates streak (consecutive days with sessions)
 */
export function calculateStreak(sessions: Session[]): number {
  if (!sessions || sessions.length === 0) return 0;

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  );

  // Get unique dates (YYYY-MM-DD format)
  const uniqueDates = Array.from(
    new Set(
      sortedSessions
        .map(s => s.created_at?.split('T')[0])
        .filter((date): date is string => date !== undefined)
    )
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const sessionDate = new Date(uniqueDates[i]);
    sessionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - streak);

    // Check if session date matches expected consecutive date
    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (sessionDate.getTime() < expectedDate.getTime()) {
      // Gap found, stop counting
      break;
    }
  }

  return streak;
}

/**
 * Gets mood data for the last 7 days (for graph)
 */
export async function getMoodGraphData(userId: string): Promise<{
  labels: string[];
  data: number[];
  error: string | null;
}> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // Last 7 days including today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('created_at, mood_score')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching mood graph data:', error);
      return { labels: [], data: [], error: error.message };
    }

    // Create a map of date -> average mood
    const moodByDate = new Map<string, number[]>();

    sessions?.forEach(session => {
      if (session.created_at && session.mood_score) {
        const dateStr = session.created_at.split('T')[0];
        if (!moodByDate.has(dateStr)) {
          moodByDate.set(dateStr, []);
        }
        moodByDate.get(dateStr)!.push(session.mood_score);
      }
    });

    // Generate labels and data for last 7 days
    const labels: string[] = [];
    const data: number[] = [];
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      labels.push(dayName);

      const moods = moodByDate.get(dateStr);
      if (moods && moods.length > 0) {
        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        data.push(Math.round(avgMood * 10) / 10);
      } else {
        data.push(0); // No session on this day
      }
    }

    return { labels, data, error: null };
  } catch (err) {
    console.error('Unexpected error fetching mood graph data:', err);
    return { labels: [], data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
