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

type OnboardingScreen3Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding3'>;
};

type ReasonOption = {
  id: string;
  label: string;
};

const REASON_OPTIONS: ReasonOption[] = [
  { id: 'perspective', label: 'Prendre du recul' },
  { id: 'evolution', label: 'Voir mon évolution' },
  { id: 'understand', label: 'Me comprendre mieux' },
  { id: 'discharge', label: 'Me décharger' },
  { id: 'memories', label: 'Garder des souvenirs' },
  { id: 'other', label: 'Autre raison' },
];

export default function OnboardingScreen3({ navigation }: OnboardingScreen3Props) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const isValid =
    selectedReason !== null &&
    (selectedReason !== 'other' || otherReason.trim().length > 0);

  const handleContinue = async () => {
    if (!isValid || !user) return;

    setLoading(true);

    try {
      const reasonValue =
        selectedReason === 'other' ? `other: ${otherReason}` : selectedReason;

      const { error } = await supabase
        .from('users')
        .update({ onboarding_reason: reasonValue })
        .eq('id', user.id);

      if (error) throw error;

      navigation.navigate('Onboarding4');
    } catch (err) {
      console.error('Error saving onboarding reason:', err);
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
        <ProgressBar progress={60} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.question}>Pourquoi tu veux tenir un journal?</Text>
            </View>

            <View style={styles.optionsContainer}>
              {REASON_OPTIONS.map((option) => (
                <View key={option.id}>
                  <TouchableOpacity
                    style={[
                      styles.option,
                      selectedReason === option.id && styles.optionSelected,
                    ]}
                    onPress={() => setSelectedReason(option.id)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedReason === option.id && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>

                  {/* Show text input if "other" is selected */}
                  {option.id === 'other' && selectedReason === 'other' && (
                    <TextInput
                      style={styles.textInput}
                      placeholder="Dis-nous pourquoi..."
                      placeholderTextColor={COLORS.textMuted}
                      value={otherReason}
                      onChangeText={setOtherReason}
                      editable={!loading}
                      autoFocus
                    />
                  )}
                </View>
              ))}
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
  },
  header: {
    marginBottom: SPACING.xl,
  },
  question: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: SPACING.md,
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
  textInput: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING.sm,
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
