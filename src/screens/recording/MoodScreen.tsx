import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, FONT_SIZES, MOOD_EMOJI } from '../../utils/constants';
import { RootStackParamList } from '../../types';

type MoodScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Mood'>;
  route: RouteProp<RootStackParamList, 'Mood'>;
};

export default function MoodScreen({ navigation, route }: MoodScreenProps) {
  const { transcript, audioUri, insight, keyFacts } = route.params;
  const [moodScore, setMoodScore] = useState(5);

  const getMoodEmoji = (score: number): string => {
    if (score <= 2) return '😢';
    if (score <= 4) return '😕';
    if (score <= 6) return '😐';
    if (score <= 8) return '🙂';
    return '😊';
  };

  const handleContinue = () => {
    navigation.navigate('Insight', {
      transcript,
      audioUri,
      insight,
      keyFacts,
      moodScore: Math.round(moodScore),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Comment tu te sens globalement?</Text>
        </View>

        <View style={styles.moodContainer}>
          <Text style={styles.emoji}>{getMoodEmoji(moodScore)}</Text>
          <Text style={styles.score}>{Math.round(moodScore)}/10</Text>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={moodScore}
            onValueChange={setMoodScore}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
          <View style={styles.labels}>
            <Text style={styles.label}>😢</Text>
            <Text style={styles.label}>😕</Text>
            <Text style={styles.label}>😐</Text>
            <Text style={styles.label}>🙂</Text>
            <Text style={styles.label}>😊</Text>
          </View>
          <View style={styles.scaleLabels}>
            <Text style={styles.scaleLabel}>1</Text>
            <Text style={styles.scaleLabel}>10</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
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
  header: {
    marginBottom: SPACING.xl * 2,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  moodContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  emoji: {
    fontSize: 100,
    marginBottom: SPACING.md,
  },
  score: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sliderContainer: {
    paddingHorizontal: SPACING.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.xl,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.xs,
  },
  scaleLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
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
