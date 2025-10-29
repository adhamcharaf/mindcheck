import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { generateInsight } from '../../services/claude';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types';

type LoadingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loading'>;
  route: RouteProp<RootStackParamList, 'Loading'>;
};

export default function LoadingScreen({ navigation, route }: LoadingScreenProps) {
  const { transcript, audioUri } = route.params;
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    generateInsightAndNavigate();
  }, []);

  const generateInsightAndNavigate = async () => {
    try {
      // Get onboarding context
      const context = user
        ? {
            reason: user.onboarding_reason,
            situation: user.onboarding_situation,
            feeling: user.onboarding_feeling,
          }
        : undefined;

      // Generate insight (this is the first session, so isFirstSession = true)
      const result = await generateInsight({
        transcript,
        isFirstSession: true,
        context,
      });

      // Wait a minimum of 3 seconds to show loading screen (UX)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Navigate to Mood screen
      navigation.replace('Mood', {
        transcript,
        audioUri,
        insight: result.insight,
      });
    } catch (err) {
      console.error('Error generating insight:', err);
      // Continue anyway with fallback insight
      navigation.replace('Mood', {
        transcript,
        audioUri,
        insight: 'Merci pour ce partage.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.title}>Analyse en cours...</Text>
        <Text style={styles.subtitle}>
          Je prends le temps de bien comprendre ce que tu viens de partager
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
