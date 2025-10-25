import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import ProgressBar from '../../components/ProgressBar';
import { RootStackParamList } from '../../types';

type OnboardingScreen4Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding4'>;
};

type FrequencyOption = {
  id: string;
  label: string;
};

type TimingOption = {
  id: string;
  label: string;
};

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { id: 'daily', label: 'Tous les jours' },
  { id: 'few_times', label: 'Quelques fois par semaine' },
  { id: 'something_happens', label: 'Quand il se passe quelque chose' },
  { id: 'whenever', label: 'Quand j\'en ai envie' },
];

const TIMING_OPTIONS: TimingOption[] = [
  { id: 'morning', label: 'Le matin' },
  { id: 'evening', label: 'Le soir' },
  { id: 'flexible', label: 'Pas de préférence' },
];

export default function OnboardingScreen4({ navigation }: OnboardingScreen4Props) {
  const [frequency, setFrequency] = useState<string | null>(null);
  const [timing, setTiming] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const isValid = frequency !== null && timing !== null;

  const handleContinue = async () => {
    if (!isValid || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_frequency: frequency,
          onboarding_timing: timing,
        })
        .eq('id', user.id);

      if (error) throw error;

      navigation.navigate('Onboarding5');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={80} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Question 1: Frequency */}
          <View style={styles.section}>
            <Text style={styles.question}>Tu aimerais faire un check-in...</Text>
            <View style={styles.optionsContainer}>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    frequency === option.id && styles.optionSelected,
                  ]}
                  onPress={() => setFrequency(option.id)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.optionText,
                      frequency === option.id && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question 2: Timing */}
          <View style={styles.section}>
            <Text style={styles.question}>Plutôt à quel moment?</Text>
            <View style={styles.optionsContainer}>
              {TIMING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    timing === option.id && styles.optionSelected,
                  ]}
                  onPress={() => setTiming(option.id)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.optionText,
                      timing === option.id && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.continueButtonText}>Continuer</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    gap: SPACING.xl * 1.5,
  },
  section: {
    gap: SPACING.md,
  },
  question: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  option: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
