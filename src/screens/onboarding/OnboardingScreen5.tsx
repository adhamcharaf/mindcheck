import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import ProgressBar from '../../components/ProgressBar';
import { RootStackParamList } from '../../types';

type OnboardingScreen5Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding5'>;
};

function getContextualQuestion(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Comment tu te sens ce matin?';
  } else if (hour >= 12 && hour < 18) {
    return 'Qu\'est-ce qui s\'est passé aujourd\'hui?';
  } else {
    return 'Raconte ta journée';
  }
}

export default function OnboardingScreen5({ navigation }: OnboardingScreen5Props) {
  const [question] = useState(getContextualQuestion());
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const updateOnboardingStatus = useAuthStore((state) => state.updateOnboardingStatus);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleMicPress = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Request microphone permission
      const { granted } = await getRecordingPermissionsAsync();
      if (!granted) {
        const { granted: requestGranted } = await requestRecordingPermissionsAsync();
        if (!requestGranted) {
          Alert.alert(
            'Permission requise',
            'Voyce a besoin d\'accéder au microphone pour enregistrer ton journal vocal.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }
      }

      // Navigate to FirstRecording screen (onboarding will be completed at the end of the flow)
      navigation.navigate('FirstRecording');
    } catch (err) {
      console.error('Error navigating to recording:', err);
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaye.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressBar progress={100} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu es prêt!</Text>
          <Text style={styles.question}>{question}</Text>
        </View>

        <View style={styles.micContainer}>
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.micButton,
                {
                  transform: [{ scale: loading ? 1 : pulseAnim }],
                },
              ]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.micHint}>Appuie pour commencer à parler</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  question: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  micContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.xl * 2,
  },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  micIcon: {
    fontSize: 64,
  },
  micHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
});
