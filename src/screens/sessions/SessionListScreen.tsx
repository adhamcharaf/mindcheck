import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getUserSessions, getMoodEmoji, formatSessionDate, groupSessionsByDate } from '../../services/sessions';
import { Session, RootStackParamList } from '../../types';

type SessionListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SessionList'>;
  route: RouteProp<RootStackParamList, 'SessionList'>;
};

export default function SessionListScreen({ navigation, route }: SessionListScreenProps) {
  const { date, userId } = route.params;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);

    const { sessions: allSessions, error } = await getUserSessions(userId);

    if (error || !allSessions) {
      console.error('Error loading sessions:', error);
      setLoading(false);
      return;
    }

    if (date) {
      // Filter sessions for specific date
      const filtered = allSessions.filter((session) => {
        if (!session.created_at) return false;
        const sessionDate = session.created_at.split('T')[0];
        return sessionDate === date;
      });
      setSessions(filtered);
    } else {
      // Show all sessions grouped by date
      setSessions(allSessions);
      const grouped = groupSessionsByDate(allSessions);
      setGroupedSessions(grouped);
    }

    setLoading(false);
  };

  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('SessionDetail', { sessionId });
  };

  const renderSessionCard = (session: Session) => {
    const emoji = getMoodEmoji(session.mood_score);
    const time = session.created_at ? new Date(session.created_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }) : '??:??';

    return (
      <TouchableOpacity
        key={session.id}
        style={styles.sessionCard}
        onPress={() => handleSessionPress(session.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTime}>{time}</Text>
          <Text style={styles.sessionMood}>
            {emoji} {session.mood_score || '?'}/10
          </Text>
        </View>

        {session.transcript && (
          <Text style={styles.sessionTranscript} numberOfLines={2}>
            {session.transcript}
          </Text>
        )}

        {session.insight && (
          <View style={styles.sessionInsight}>
            <Text style={styles.sessionInsightLabel}>💡</Text>
            <Text style={styles.sessionInsightText} numberOfLines={1}>
              {session.insight}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  // Specific date view
  if (date) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>
            {sessions.length > 0 && sessions[0].created_at
              ? formatSessionDate(sessions[0].created_at)
              : 'Sessions'}
          </Text>
          <Text style={styles.subtitle}>
            {sessions.length} session{sessions.length > 1 ? 's' : ''} ce jour
          </Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune session ce jour</Text>
            </View>
          ) : (
            <View style={styles.sessionsContainer}>
              {sessions.map((session) => renderSessionCard(session))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // All sessions view (grouped by date)
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Toutes mes sessions</Text>
        <Text style={styles.subtitle}>
          {sessions.length} session{sessions.length > 1 ? 's' : ''} au total
        </Text>

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucune session encore</Text>
            <Text style={styles.emptyStateSubtext}>
              Commence ta première session pour voir ton historique ici
            </Text>
          </View>
        ) : (
          <View style={styles.groupedContainer}>
            {sortedDates.map((dateStr) => {
              const sessionsForDate = groupedSessions[dateStr];
              const formattedDate = sessionsForDate[0]?.created_at
                ? formatSessionDate(sessionsForDate[0].created_at)
                : dateStr;

              return (
                <View key={dateStr} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{formattedDate}</Text>
                  {sessionsForDate.map((session) => renderSessionCard(session))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  sessionsContainer: {
    gap: SPACING.md,
  },
  groupedContainer: {
    gap: SPACING.xl,
  },
  dateGroup: {
    gap: SPACING.md,
  },
  dateHeader: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sessionCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sessionTime: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionMood: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  sessionTranscript: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  sessionInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sessionInsightLabel: {
    fontSize: FONT_SIZES.md,
  },
  sessionInsightText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
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
});
