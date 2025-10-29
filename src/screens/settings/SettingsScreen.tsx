import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { getUserSessions } from '../../services/sessions';
import { supabase } from '../../services/supabase';
import { restorePurchases } from '../../services/revenuecat';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      // Fetch all user sessions
      const { sessions, error } = await getUserSessions(user.id);

      if (error || !sessions) {
        Alert.alert('Erreur', 'Impossible de récupérer tes données.');
        setIsExporting(false);
        return;
      }

      // Create export data
      const exportData = {
        user: {
          email: user.email,
          created_at: new Date().toISOString(),
          is_premium: user.is_premium,
          trial_ends_at: user.trial_ends_at,
        },
        sessions: sessions.map(session => ({
          date: session.created_at,
          transcript: session.transcript,
          mood_score: session.mood_score,
          insight: session.insight,
        })),
        exported_at: new Date().toISOString(),
      };

      // Write to file
      const filename = `mindcheck-data-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      // Share file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Succès', `Données exportées vers: ${fileUri}`);
      }
    } catch (err) {
      console.error('Export error:', err);
      Alert.alert('Erreur', 'Impossible d\'exporter tes données.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!user) return;

    setIsDeleting(true);
    setShowDeleteModal(false);

    try {
      // Delete user from database (CASCADE will handle sessions and messages)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Delete user error:', deleteError);
        Alert.alert('Erreur', 'Impossible de supprimer ton compte.');
        setIsDeleting(false);
        return;
      }

      // Sign out from Supabase auth
      await supabase.auth.signOut();

      // Logout (clear local state)
      await logout();

      Alert.alert(
        'Compte supprimé',
        'Ton compte et toutes tes données ont été supprimés définitivement.'
      );
    } catch (err) {
      console.error('Delete account error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) return;

    setIsRestoring(true);

    try {
      const { isPremium, error } = await restorePurchases(user.id);

      if (error) {
        Alert.alert('Erreur', 'Impossible de restaurer les achats.');
        setIsRestoring(false);
        return;
      }

      if (isPremium) {
        // Update local user state
        const updatedUser = {
          ...user,
          is_premium: true,
        };
        useAuthStore.getState().setUser(updatedUser);

        Alert.alert('✓ Succès', 'Tes achats ont été restaurés!');
      } else {
        Alert.alert('Aucun achat', 'Aucun achat Premium trouvé pour ce compte.');
      }
    } catch (err) {
      console.error('Restore purchases error:', err);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenLink = (url: string, title: string) => {
    // For now, just show an alert since links aren't set up yet
    Alert.alert(
      title,
      'Cette fonctionnalité sera disponible prochainement.',
      [{ text: 'OK' }]
    );

    // TODO: When ready, use:
    // Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>

            {user.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}

            {user.trial_ends_at && new Date(user.trial_ends_at) > new Date() && !user.is_premium && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialText}>
                  Essai gratuit - {Math.ceil((new Date(user.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours restants
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Data Management Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Données</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportData}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.actionButtonText}>Exporter mes données</Text>
              <Text style={styles.actionButtonSubtext}>Télécharge toutes tes sessions en JSON</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => setShowDeleteModal(true)}
          disabled={isDeleting}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>Supprimer mon compte</Text>
          <Text style={styles.actionButtonSubtext}>Suppression définitive de toutes tes données</Text>
        </TouchableOpacity>
      </View>

      {/* Purchases Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achats</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRestorePurchases}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.actionButtonText}>Restaurer les achats</Text>
              <Text style={styles.actionButtonSubtext}>Récupère ton accès Premium</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Links Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liens utiles</Text>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenLink('https://help.mindcheck.app', 'Aide')}
        >
          <Text style={styles.linkText}>Aide</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenLink('https://mindcheck.app/terms', 'Conditions d\'utilisation')}
        >
          <Text style={styles.linkText}>Conditions d'utilisation</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => handleOpenLink('https://mindcheck.app/privacy', 'Politique de confidentialité')}
        >
          <Text style={styles.linkText}>Politique de confidentialité</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer mon compte?</Text>
            <Text style={styles.modalText}>
              Cette action est irréversible. Toutes tes sessions, insights et données seront supprimés définitivement.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleDeleteAccountConfirm}
              >
                <Text style={styles.modalDeleteText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: COLORS.premium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  trialBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  trialText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  actionButtonSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.error,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  linkArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textMuted,
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.backgroundDark,
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalDeleteButton: {
    backgroundColor: COLORS.error,
  },
  modalDeleteText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: '600',
  },
});
