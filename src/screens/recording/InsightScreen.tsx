import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { COLORS, SPACING, FONT_SIZES, FAKE_PATTERNS } from '../../utils/constants';
import { uploadAudio } from '../../services/storage';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types';

type InsightScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Insight'>;
  route: RouteProp<RootStackParamList, 'Insight'>;
};

export default function InsightScreen({ navigation, route }: InsightScreenProps) {
  const { transcript, audioUri, insight, moodScore } = route.params;
  const user = useAuthStore((state) => state.user);
  const [isSaving, setIsSaving] = useState(false);

  // Fade-in animation for insight
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate insight fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Save session in the background
    saveSession();
  }, []);

  const saveSession = async () => {
    if (!user) {
      console.error('[DEBUG saveSession] No user found!');
      return;
    }

    console.log('[DEBUG saveSession] user.id:', user.id);
    console.log('[DEBUG saveSession] Starting session save...');

    setIsSaving(true);

    try {
      // Upload audio to storage
      const sessionId = Crypto.randomUUID();
      console.log('[DEBUG saveSession] Generated sessionId:', sessionId);
      console.log('[DEBUG saveSession] Upload params:', { userId: user.id, sessionId, audioUri });

      const { audioUrl, error: uploadError } = await uploadAudio({
        userId: user.id,
        sessionId,
        audioUri,
      });

      console.log('[DEBUG saveSession] Upload result:', { audioUrl, uploadError });

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
      }

      // Save session to database
      console.log('[DEBUG saveSession] Attempting to insert session to DB...');
      const { error: dbError } = await supabase.from('sessions').insert({
        id: sessionId,
        user_id: user.id,
        transcript,
        mood_score: moodScore,
        insight,
        audio_url: audioUrl || null,
      });

      console.log('[DEBUG saveSession] DB insert result:', { dbError });

      if (dbError) {
        console.error('Session save error:', dbError);
        Alert.alert('Erreur', 'Impossible de sauvegarder la session.');
      }

      setIsSaving(false);

      // Navigate to paywall with session ID
      navigation.navigate('Paywall', { sessionId });
    } catch (err) {
      console.error('Error saving session:', err);
      setIsSaving(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  // Get 2-3 random fake patterns
  const randomPatterns = FAKE_PATTERNS.sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Main Insight */}
        <View style={styles.insightContainer}>
          <Text style={styles.insightLabel}>💡 Ton insight:</Text>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.insightText}>{insight}</Text>
          </Animated.View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Locked Patterns */}
        <View style={styles.patternsContainer}>
          <Text style={styles.patternsLabel}>🔒 {randomPatterns.length} patterns détectés</Text>

          <View style={styles.patternsBlurred}>
            {randomPatterns.map((pattern, index) => (
              <View key={index} style={styles.patternItem}>
                <View style={styles.patternBlurContainer}>
                  <Text style={styles.patternText}>• {pattern.substring(0, 20)}... 🔒</Text>
                  <BlurView
                    style={styles.blurView}
                    tint="light"
                    intensity={50}
                    experimentalBlurMethod="dimezisBlurView"
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.unlockHint}>
            <Text style={styles.unlockHintText}>Débloquer tous les patterns</Text>
            <Text style={styles.premiumBadge}>Premium requis</Text>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        {isSaving ? (
          <Text style={styles.savingText}>Sauvegarde en cours...</Text>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Paywall', { sessionId: 'temp' })}
          >
            <Text style={styles.continueButtonText}>Continuer</Text>
          </TouchableOpacity>
        )}
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
  },
  insightContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  insightLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  insightText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },
  patternsContainer: {
    marginBottom: SPACING.xl,
  },
  patternsLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  patternsBlurred: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  patternItem: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  patternBlurContainer: {
    position: 'relative',
    backgroundColor: COLORS.backgroundDark,
    padding: SPACING.md,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  unlockHint: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  unlockHintText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  premiumBadge: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.premium,
    fontWeight: 'bold',
  },
  savingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
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
  continueButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
