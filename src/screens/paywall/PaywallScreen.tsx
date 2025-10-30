import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, PRICING, TRIAL_DURATION_DAYS } from '../../utils/constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { RootStackParamList } from '../../types';
import { purchasePremium, PackageType } from '../../services/revenuecat';

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Paywall'>;
  route: RouteProp<RootStackParamList, 'Paywall'>;
};

export default function PaywallScreen({ navigation, route }: PaywallScreenProps) {
  const user = useAuthStore((state) => state.user);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('weekly');

  const handleSaveContent = async () => {
    if (!user) return;

    setIsProcessing(true);

    try {
      // Call mock RevenueCat purchase
      const { success, error } = await purchasePremium(user.id, selectedPackage);

      if (error || !success) {
        Alert.alert('Erreur', 'Impossible de traiter l\'achat. Réessaye.');
        setIsProcessing(false);
        return;
      }

      // Update local user state (including onboarding_completed to trigger navigation switch)
      const updatedUser = {
        ...user,
        is_premium: true,
        trial_ends_at: null,
        onboarding_completed: true,
      };
      useAuthStore.getState().setUser(updatedUser);

      // Show success message
      // Navigation will automatically switch to MainStack when onboarding_completed becomes true
      Alert.alert(
        '✓ Premium activé!',
        'Tes données sont sauvegardées. Profite de toutes les fonctionnalités!',
        [
          {
            text: 'Commencer',
          },
        ]
      );
    } catch (err) {
      console.error('Purchase error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaye.');
    } finally {
      setIsProcessing(false);
    }
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

      // Update local state with trial info
      const updatedUser = {
        ...user,
        onboarding_completed: true,
        trial_ends_at: trialEndsAt.toISOString(),
      };
      useAuthStore.getState().setUser(updatedUser);

      // Show surprise message
      // Navigation will automatically switch to MainStack when onboarding_completed becomes true
      Alert.alert(
        '🎉 Surprise!',
        `OK, on te donne Premium. Gratuit.\n\nDécouvre tout pendant ${TRIAL_DURATION_DAYS} jours.`,
        [
          {
            text: 'Activer mon Premium',
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
          {/* Package Selection */}
          <View style={styles.packageSelection}>
            <TouchableOpacity
              style={[
                styles.packageOption,
                selectedPackage === 'weekly' && styles.packageOptionSelected,
              ]}
              onPress={() => setSelectedPackage('weekly')}
              disabled={isProcessing}
            >
              <View style={styles.packageHeader}>
                <Text style={[
                  styles.packageTitle,
                  selectedPackage === 'weekly' && styles.packageTitleSelected,
                ]}>
                  Hebdomadaire
                </Text>
                <View style={[
                  styles.radioButton,
                  selectedPackage === 'weekly' && styles.radioButtonSelected,
                ]}>
                  {selectedPackage === 'weekly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={[
                styles.packagePrice,
                selectedPackage === 'weekly' && styles.packagePriceSelected,
              ]}>
                ${PRICING.weekly.amount} CAD/semaine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.packageOption,
                selectedPackage === 'annual' && styles.packageOptionSelected,
              ]}
              onPress={() => setSelectedPackage('annual')}
              disabled={isProcessing}
            >
              <View style={styles.packageHeader}>
                <View>
                  <Text style={[
                    styles.packageTitle,
                    selectedPackage === 'annual' && styles.packageTitleSelected,
                  ]}>
                    Annuel
                  </Text>
                  <Text style={styles.packageBadge}>{PRICING.yearly.badge}</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedPackage === 'annual' && styles.radioButtonSelected,
                ]}>
                  {selectedPackage === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={[
                styles.packagePrice,
                selectedPackage === 'annual' && styles.packagePriceSelected,
              ]}>
                ${PRICING.yearly.amount} CAD/an
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSaveContent}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {isProcessing ? 'Traitement...' : 'Sauvegarder mon contenu'}
              </Text>
            </LinearGradient>
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
  packageSelection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  packageOption: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
  },
  packageOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  packageTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  packageTitleSelected: {
    color: COLORS.primary,
  },
  packageBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.premium,
    fontWeight: 'bold',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  packagePriceSelected: {
    color: COLORS.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  primaryButton: {
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
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
