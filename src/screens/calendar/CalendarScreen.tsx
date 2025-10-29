import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getUserSessions, groupSessionsByDate, getMoodEmoji } from '../../services/sessions';
import { useAuthStore } from '../../store/authStore';
import { Session, RootStackParamList } from '../../types';

type CalendarNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarNavigationProp>();
  const user = useAuthStore((state) => state.user);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const loadSessions = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { sessions: data, error } = await getUserSessions(user.id);

    if (error || !data) {
      console.error('Error loading sessions:', error);
      setLoading(false);
      return;
    }

    setSessions(data);
    markCalendarDates(data);
    setLoading(false);
  };

  const markCalendarDates = (sessions: Session[]) => {
    const grouped = groupSessionsByDate(sessions);
    const marked: any = {};

    Object.keys(grouped).forEach((dateStr) => {
      const sessionsOnDate = grouped[dateStr];

      // Calculate average mood if multiple sessions on same day
      const totalMood = sessionsOnDate.reduce((sum, session) => {
        return sum + (session.mood_score || 0);
      }, 0);
      const averageMood = Math.round(totalMood / sessionsOnDate.length);
      const moodEmoji = getMoodEmoji(averageMood);

      marked[dateStr] = {
        marked: true,
        dotColor: COLORS.primary,
        customStyles: {
          text: {
            color: COLORS.text,
            fontWeight: 'bold',
          },
        },
        // Store emoji for rendering
        emoji: moodEmoji,
      };
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day: DateData) => {
    const dateStr = day.dateString;
    const grouped = groupSessionsByDate(sessions);
    const sessionsOnDate = grouped[dateStr];

    if (sessionsOnDate && sessionsOnDate.length > 0) {
      // Navigate to SessionList showing all sessions for this day
      navigation.navigate('SessionList', {
        date: dateStr,
        userId: user!.id,
      });
    }
  };

  const renderDay = (day: any) => {
    if (!day) return null;

    const dateStr = day.dateString;
    const markedDay = markedDates[dateStr];
    const emoji = markedDay?.emoji;

    return (
      <View style={styles.dayContainer}>
        <Text style={styles.dayNumber}>{day.day}</Text>
        {emoji && <Text style={styles.dayEmoji}>{emoji}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendrier</Text>
        <Text style={styles.subtitle}>
          {sessions.length} session{sessions.length > 1 ? 's' : ''} enregistrée{sessions.length > 1 ? 's' : ''}
        </Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.background,
          textSectionTitleColor: COLORS.textLight,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.background,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          textDisabledColor: COLORS.textMuted,
          monthTextColor: COLORS.text,
          textMonthFontSize: FONT_SIZES.lg,
          textDayFontSize: FONT_SIZES.md,
          textDayHeaderFontSize: FONT_SIZES.sm,
        }}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        dayComponent={({ date, state }) => {
          if (!date) return null;

          const dateStr = date.dateString;
          const markedDay = markedDates[dateStr];
          const emoji = markedDay?.emoji;
          const isToday = date.dateString === new Date().toISOString().split('T')[0];
          const isDisabled = state === 'disabled';

          return (
            <TouchableOpacity
              onPress={() => {
                if (!isDisabled && date) {
                  handleDayPress({ dateString: date.dateString } as DateData);
                }
              }}
              disabled={isDisabled}
              style={[
                styles.customDay,
                isToday && styles.todayDay,
                isDisabled && styles.disabledDay,
              ]}
            >
              <Text
                style={[
                  styles.customDayText,
                  isToday && styles.todayDayText,
                  isDisabled && styles.disabledDayText,
                ]}
              >
                {date.day}
              </Text>
              {emoji && <Text style={styles.customDayEmoji}>{emoji}</Text>}
            </TouchableOpacity>
          );
        }}
      />

      {sessions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Aucune session encore</Text>
          <Text style={styles.emptyStateText}>
            Commence ta première session pour voir ton historique ici
          </Text>
        </View>
      )}
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
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  calendar: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  dayNumber: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  dayEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  customDay: {
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  todayDay: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 8,
  },
  disabledDay: {
    opacity: 0.3,
  },
  customDayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  todayDayText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  disabledDayText: {
    color: COLORS.textMuted,
  },
  customDayEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
