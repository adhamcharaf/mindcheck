import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import ProgressBar from '../../components/ProgressBar';
import { RootStackParamList } from '../../types';

type OnboardingScreen2Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding2'>;
};

type FeelingOption = {
  id: string;
  label: string;
};

const FEELING_OPTIONS: FeelingOption[] = [
  { id: 'good', label: 'Ça va bien' },
  { id: 'mixed', label: 'C\'est mitigé' },
  { id: 'intense_positive', label: 'C\'est intense (mais positif)' },
  { id: 'difficult', label: 'C\'est difficile' },
];

const MIN_TEXT_LENGTH = 10;

export default function OnboardingScreen2({ navigation }: OnboardingScreen2Props) {
  const [situation, setSituation] = useState('');
  const [feeling, setFeeling] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const isValid = situation.length >= MIN_TEXT_LENGTH && feeling !== null;

  const handleContinue = async () => {
    if (!isValid || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          onboarding_situation: situation,
          onboarding_feeling: feeling,
        })
        .eq('id', user.id);

      if (error) throw error;

      navigation.navigate('Onboarding3');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ProgressBar progress={40} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Question 1: Life situation */}
            <View style={styles.section}>
              <Text style={styles.question}>Raconte-nous ta vie en ce moment</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Par exemple: études, travail, famille, projet..."
                placeholderTextColor={COLORS.textMuted}
                value={situation}
                onChangeText={setSituation}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              {situation.length > 0 && situation.length < MIN_TEXT_LENGTH && (
                <Text style={styles.hint}>
                  Encore {MIN_TEXT_LENGTH - situation.length} caractères minimum
                </Text>
              )}
            </View>

            {/* Question 2: General feeling */}
            <View style={styles.section}>
              <Text style={styles.question}>En général, comment ça se passe?</Text>
              <View style={styles.optionsContainer}>
                {FEELING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.option,
                      feeling === option.id && styles.optionSelected,
                    ]}
                    onPress={() => setFeeling(option.id)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        feeling === option.id && styles.optionTextSelected,
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
            onPress={handleContinue}
            disabled={!isValid || loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.continueButtonText}>Continuer</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
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
    gap: SPACING.xl,
  },
  section: {
    gap: SPACING.md,
  },
  question: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 120,
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
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
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
