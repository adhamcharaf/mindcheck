import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface AuthUser {
  id: string;
  email: string;
  onboarding_completed: boolean;
  is_premium?: boolean | null;
  trial_ends_at?: string | null;
  onboarding_goal?: string | null;
  onboarding_situation?: string | null;
  onboarding_feeling?: string | null;
  onboarding_reason?: string | null;
  onboarding_frequency?: string | null;
  onboarding_timing?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuth: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  updateOnboardingStatus: (completed: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@voyce:auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuth: false,
  isLoading: true,

  setUser: (user) => {
    set({ user, isAuth: !!user, isLoading: false });

    // Persist to AsyncStorage
    if (user) {
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }

    // Clear state
    set({ user: null, isAuth: false });
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  },

  initialize: async () => {
    try {
      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user data from database
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, email, onboarding_completed, is_premium, trial_ends_at, onboarding_goal, onboarding_situation, onboarding_feeling, onboarding_reason, onboarding_frequency, onboarding_timing')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          set({ isLoading: false });
          return;
        }

        if (userData) {
          set({
            user: {
              id: userData.id,
              email: userData.email,
              onboarding_completed: userData.onboarding_completed ?? false,
              is_premium: userData.is_premium,
              trial_ends_at: userData.trial_ends_at,
              onboarding_goal: userData.onboarding_goal,
              onboarding_situation: userData.onboarding_situation,
              onboarding_feeling: userData.onboarding_feeling,
              onboarding_reason: userData.onboarding_reason,
              onboarding_frequency: userData.onboarding_frequency,
              onboarding_timing: userData.onboarding_timing,
            },
            isAuth: true,
            isLoading: false,
          });

          // Persist to AsyncStorage
          await AsyncStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              id: userData.id,
              email: userData.email,
              onboarding_completed: userData.onboarding_completed ?? false,
              is_premium: userData.is_premium,
              trial_ends_at: userData.trial_ends_at,
              onboarding_goal: userData.onboarding_goal,
              onboarding_situation: userData.onboarding_situation,
              onboarding_feeling: userData.onboarding_feeling,
              onboarding_reason: userData.onboarding_reason,
              onboarding_frequency: userData.onboarding_frequency,
              onboarding_timing: userData.onboarding_timing,
            })
          );
        } else {
          set({ isLoading: false });
        }
      } else {
        // Try to load from AsyncStorage (fallback)
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const user = JSON.parse(stored);
          set({ user, isAuth: true, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ isLoading: false });
    }
  },

  updateOnboardingStatus: (completed: boolean) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, onboarding_completed: completed };
      get().setUser(updatedUser);
    }
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user?.id) return;

    try {
      // Fetch fresh user data from database
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, onboarding_completed, is_premium, trial_ends_at, onboarding_goal, onboarding_situation, onboarding_feeling, onboarding_reason, onboarding_frequency, onboarding_timing')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error refreshing user data:', error);
        return;
      }

      if (userData) {
        const refreshedUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          onboarding_completed: userData.onboarding_completed ?? false,
          is_premium: userData.is_premium,
          trial_ends_at: userData.trial_ends_at,
          onboarding_goal: userData.onboarding_goal,
          onboarding_situation: userData.onboarding_situation,
          onboarding_feeling: userData.onboarding_feeling,
          onboarding_reason: userData.onboarding_reason,
          onboarding_frequency: userData.onboarding_frequency,
          onboarding_timing: userData.onboarding_timing,
        };

        set({ user: refreshedUser });

        // Persist to AsyncStorage
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedUser));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  },
}));
