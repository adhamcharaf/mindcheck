import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import {
  getSessionsThisMonth,
  getSessionsThisWeek,
  getUserSessions,
  calculateAverageMood,
  calculateStreak,
  getMoodGraphData,
} from '../../services/sessions';

type PeriodType = 'week' | 'month';

export default function StatsScreen() {
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('week');

  // Stats state
  const [totalSessionsThisMonth, setTotalSessionsThisMonth] = useState(0);
  const [averageMood, setAverageMood] = useState(0);
  const [streak, setStreak] = useState(0);
  const [graphData, setGraphData] = useState<{ labels: string[]; data: number[] }>({
    labels: [],
    data: [],
  });

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Get sessions this month for total count
      const { sessions: monthSessions } = await getSessionsThisMonth(user.id);
      setTotalSessionsThisMonth(monthSessions?.length || 0);

      // Get sessions for average mood calculation (week or month)
      let sessionsForAverage;
      if (period === 'week') {
        const { sessions } = await getSessionsThisWeek(user.id);
        sessionsForAverage = sessions || [];
      } else {
        sessionsForAverage = monthSessions || [];
      }
      setAverageMood(calculateAverageMood(sessionsForAverage));

      // Get all sessions for streak calculation
      const { sessions: allSessions } = await getUserSessions(user.id);
      setStreak(calculateStreak(allSessions || []));

      // Get mood graph data (last 7 days)
      const { labels, data } = await getMoodGraphData(user.id);
      setGraphData({ labels, data });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const screenWidth = Dimensions.get('window').width;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  const hasData = graphData.data.length > 0 && graphData.data.some(d => d > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Total Sessions Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sessions ce mois</Text>
        <Text style={styles.cardValue}>{totalSessionsThisMonth}</Text>
      </View>

      {/* Average Mood Card with Toggle */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Mood moyen</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, period === 'week' && styles.toggleButtonActive]}
              onPress={() => setPeriod('week')}
            >
              <Text style={[styles.toggleText, period === 'week' && styles.toggleTextActive]}>
                Semaine
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, period === 'month' && styles.toggleButtonActive]}
              onPress={() => setPeriod('month')}
            >
              <Text style={[styles.toggleText, period === 'month' && styles.toggleTextActive]}>
                Mois
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardValue}>
          {averageMood > 0 ? `${averageMood}/10` : 'Aucune donnée'}
        </Text>
      </View>

      {/* Streak Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Streak</Text>
        <Text style={styles.cardValue}>
          {streak} {streak > 1 ? 'jours' : 'jour'} {streak > 0 && '🔥'}
        </Text>
        {streak === 0 && (
          <Text style={styles.cardSubtext}>Fais une session pour commencer ton streak!</Text>
        )}
      </View>

      {/* Mood Graph */}
      <View style={styles.graphCard}>
        <Text style={styles.graphTitle}>Mood sur 7 derniers jours</Text>
        {hasData ? (
          <LineChart
            data={{
              labels: graphData.labels,
              datasets: [
                {
                  data: graphData.data,
                },
              ],
            }}
            width={screenWidth - SPACING.lg * 2}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.background,
              backgroundGradientFrom: COLORS.backgroundDark,
              backgroundGradientTo: COLORS.backgroundDark,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: COLORS.primary,
              },
            }}
            bezier
            style={styles.graph}
            fromZero
            segments={5}
          />
        ) : (
          <View style={styles.emptyGraphContainer}>
            <Text style={styles.emptyGraphText}>
              Pas encore de données pour le graphique.
            </Text>
            <Text style={styles.emptyGraphSubtext}>
              Fais une session pour voir ton mood évoluer!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  cardSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: COLORS.background,
  },
  graphCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  graphTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  graph: {
    marginVertical: SPACING.sm,
    borderRadius: 12,
  },
  emptyGraphContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyGraphText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyGraphSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
