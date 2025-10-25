import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, PRICING, TRIAL_DURATION_DAYS } from '../../utils/constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types';

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
  route: RouteProp<RootStackParamList, 'Paywall'>;
};

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const user = useAuthStore((state) => state.user);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveContent = () => {
    // Placeholder for RevenueCat IAP
    Alert.alert(
      'À venir',
      'L\'intégration RevenueCat IAP sera ajoutée prochainement. Pour le moment, utilise le bouton "Plus tard" pour activer le Premium gratuit pendant 7 jours.',
      [{ text: 'OK' }]
    );
  };

  const handleLater = async () => {
    // Surprise: Give 7-day trial (reciprocity tactic)
    if (!user) return;

    setIsProcessing(true);

    try {
      // Calculate trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

      // Set trial in database
      const { error } = await supabase
        .from('users')
        .update({
          trial_ends_at: trialEndsAt.toISOString(),
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error setting trial:', error);
        Alert.alert('Erreur', 'Impossible d\'activer le Premium. Réessaye.');
        setIsProcessing(false);
        return;
      }

      // Update local state - this will trigger root navigation to re-render and show MainTabs
      useAuthStore.getState().updateOnboardingStatus(true);

      // Show surprise message
      Alert.alert(
        '🎉 Surprise!',
        `OK, on te donne Premium. Gratuit.\n\nDécouvre tout pendant ${TRIAL_DURATION_DAYS} jours.`,
        [
          {
            text: 'Activer mon Premium',
            // No navigation needed - the root Navigation component will automatically
            // re-render and show MainTabs when onboarding_completed becomes true
          },
        ]
      );
    } catch (err) {
      console.error('Error activating trial:', err);
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaye.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu viens de créer:</Text>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>1 session personnalisée</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>1 insight unique</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>3 patterns détectés 🔒</Text>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Ne perds pas ce que tu viens de construire.</Text>
        </View>

        <View style={styles.pricingContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveContent}
            disabled={isProcessing}
          >
            <Text style={styles.primaryButtonText}>Sauvegarder mon contenu</Text>
            <View style={styles.pricingRow}>
              <Text style={styles.pricingText}>
                ${PRICING.weekly.amount}/{PRICING.weekly.label.toLowerCase()}
              </Text>
              <Text style={styles.pricingOr}>ou</Text>
              <Text style={styles.pricingText}>
                ${PRICING.yearly.amount}/an
              </Text>
            </View>
            <Text style={styles.badge}>{PRICING.yearly.badge}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trialButton}
            onPress={handleLater}
            disabled={isProcessing}
          >
            <Text style={styles.trialButtonText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          Aucune carte requise. Annule quand tu veux.
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl * 2,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  listContainer: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  listText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  ctaContainer: {
    marginBottom: SPACING.xl * 2,
  },
  ctaText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  pricingContainer: {
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  pricingText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  pricingOr: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
  },
  badge: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
  trialButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  trialButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  disclaimer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
