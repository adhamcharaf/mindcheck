import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getUserSessions, getMoodEmoji, formatSessionDate } from '../../services/sessions';
import { useAuthStore } from '../../store/authStore';
import { Session } from '../../types';
import { RootStackParamList } from '../../types';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const user = useAuthStore((state) => state.user);

  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Reload sessions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadLastSession();
      }
    }, [user?.id])
  );

  const loadLastSession = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { sessions, error } = await getUserSessions(user.id);

    if (error || !sessions || sessions.length === 0) {
      setLastSession(null);
      setLoading(false);
      return;
    }

    // Get the most recent session
    setLastSession(sessions[0]);
    setLoading(false);
  };

  const handleNewSession = () => {
    // Navigate to FirstRecordingScreen or appropriate recording flow
    navigation.navigate('FirstRecording');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour!</Text>
          <Text style={styles.subtitle}>Comment te sens-tu aujourd'hui?</Text>
        </View>

        {/* New Session Button */}
        <TouchableOpacity
          style={styles.newSessionButton}
          onPress={handleNewSession}
          activeOpacity={0.8}
        >
          <View style={styles.microphoneIcon}>
            <Text style={styles.microphoneEmoji}>🎙️</Text>
          </View>
          <Text style={styles.newSessionText}>Nouvelle session</Text>
          <Text style={styles.newSessionSubtext}>Appuie pour commencer</Text>
        </TouchableOpacity>

        {/* Last Session */}
        {loading ? (
          <View style={styles.lastSessionContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : lastSession ? (
          <View style={styles.lastSessionContainer}>
            <Text style={styles.lastSessionTitle}>Dernière session</Text>
            <TouchableOpacity
              style={styles.lastSessionCard}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: lastSession.id })}
              activeOpacity={0.7}
            >
              <View style={styles.lastSessionHeader}>
                <Text style={styles.lastSessionDate}>
                  {lastSession.created_at ? formatSessionDate(lastSession.created_at) : 'Date inconnue'}
                </Text>
                <Text style={styles.lastSessionMood}>
                  {getMoodEmoji(lastSession.mood_score)} {lastSession.mood_score || '?'}/10
                </Text>
              </View>

              {lastSession.insight && (
                <View style={styles.lastSessionInsight}>
                  <Text style={styles.lastSessionInsightLabel}>💡 Insight:</Text>
                  <Text style={styles.lastSessionInsightText} numberOfLines={2}>
                    {lastSession.insight}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* View All Sessions Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('SessionList', { userId: user!.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllButtonText}>Voir toutes mes sessions</Text>
              <Text style={styles.viewAllArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune session encore</Text>
            <Text style={styles.emptyStateSubtext}>
              Commence ta première session pour suivre ton humeur
            </Text>
          </View>
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
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  newSessionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  microphoneEmoji: {
    fontSize: 40,
  },
  newSessionText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: SPACING.xs,
  },
  newSessionSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    opacity: 0.8,
  },
  lastSessionContainer: {
    flex: 1,
  },
  lastSessionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  lastSessionCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  lastSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lastSessionDate: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  lastSessionMood: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  lastSessionInsight: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lastSessionInsightLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  lastSessionInsightText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  viewAllButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  viewAllButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  viewAllArrow: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
});
