import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import ProgressBar from '../../components/ProgressBar';
import { RootStackParamList } from '../../types';

type OnboardingScreen1Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;
};

type GoalOption = {
  id: string;
  label: string;
};

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'mood', label: 'Mon humeur' },
  { id: 'life', label: 'Ma vie quotidienne' },
  { id: 'thoughts', label: 'Mes pensées' },
  { id: 'patterns', label: 'Mes schémas' },
  { id: 'all', label: 'Tout ça' },
];

export default function OnboardingScreen1({ navigation }: OnboardingScreen1Props) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Swipe to logout gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only activate for horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Detect swipe right (at least 100px movement)
        if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 50) {
          handleLogoutConfirmation();
        }
      },
    })
  ).current;

  const handleLogoutConfirmation = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleContinue = async () => {
    if (!selectedGoal || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ onboarding_goal: selectedGoal })
        .eq('id', user.id);

      if (error) throw error;

      navigation.navigate('Onboarding2');
    } catch (err) {
      console.error('Error saving onboarding goal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container} {...panResponder.panHandlers}>
        <ProgressBar progress={20} />

        {/* Subtle hint for swipe gesture */}
        <Text style={styles.swipeHint}>Glissez vers la droite pour vous déconnecter</Text>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Voyce est ton journal vocal quotidien</Text>
            <Text style={styles.question}>Qu'est-ce que tu aimerais suivre?</Text>
          </View>

          <View style={styles.optionsContainer}>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  selectedGoal === option.id && styles.optionSelected,
                ]}
                onPress={() => setSelectedGoal(option.id)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedGoal === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedGoal || loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.continueButton, !selectedGoal && styles.continueButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.continueButtonText}>Continuer</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  swipeHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    opacity: 0.6,
    textAlign: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  question: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
  },
  optionsContainer: {
    gap: SPACING.md,
  },
  option: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
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
