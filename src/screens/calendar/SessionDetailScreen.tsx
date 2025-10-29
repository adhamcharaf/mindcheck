import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Audio } from 'expo-audio';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getSessionById, getMoodEmoji, formatSessionDate } from '../../services/sessions';
import { getSignedAudioUrl } from '../../services/storage';
import { useAuthStore } from '../../store/authStore';
import { Session, RootStackParamList } from '../../types';

type SessionDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SessionDetail'>;
  route: RouteProp<RootStackParamList, 'SessionDetail'>;
};

export default function SessionDetailScreen({ navigation, route }: SessionDetailScreenProps) {
  const { sessionId } = route.params;
  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // Check premium access: either is_premium OR trial_ends_at is still valid
  const hasPremiumAccess =
    user?.is_premium === true ||
    (user?.trial_ends_at && new Date(user.trial_ends_at) > new Date());

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Audio playback tracking
  const [position, setPosition] = useState(0); // Current position in ms
  const [duration, setDuration] = useState(0); // Total duration in ms
  const [isSeeking, setIsSeeking] = useState(false); // User is dragging slider

  useEffect(() => {
    // Refresh user data to get latest premium status
    refreshUser();
    loadSession();

    // Cleanup audio on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    const { session: data, error } = await getSessionById(sessionId);

    if (error || !data) {
      Alert.alert('Erreur', 'Impossible de charger la session.');
      navigation.goBack();
      return;
    }

    setSession(data);
    setLoading(false);
  };

  const handlePlayAudio = async () => {
    if (!hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }

    if (!session?.audio_url) {
      Alert.alert('Audio indisponible', 'Cette session n\'a pas d\'enregistrement audio.');
      return;
    }

    try {
      if (isPlaying && sound) {
        // Pause audio
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        // Resume audio
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Load and play audio with signed URL
        setIsLoadingAudio(true);

        // Generate signed URL from the file path stored in audio_url
        const { url: signedUrl, error: urlError } = await getSignedAudioUrl(session.audio_url);

        if (urlError || !signedUrl) {
          console.error('Error getting signed URL:', urlError);
          Alert.alert('Erreur', 'Impossible d\'accéder à l\'audio.');
          setIsLoadingAudio(false);
          return;
        }

        console.log('[DEBUG] Using signed URL for audio playback');

        // Configure audio mode for speaker output (not earpiece)
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: signedUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Erreur', 'Impossible de lire l\'audio.');
      setIsLoadingAudio(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      // Update position and duration
      if (!isSeeking) {
        setPosition(status.positionMillis || 0);
      }
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      // Reset when playback finishes
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  const handleSliderStart = () => {
    setIsSeeking(true);
  };

  const handleSliderEnd = async (value: number) => {
    setIsSeeking(false);
    await handleSeek(value);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Session introuvable</Text>
      </SafeAreaView>
    );
  }

  const moodEmoji = getMoodEmoji(session.mood_score);
  const formattedDate = session.created_at ? formatSessionDate(session.created_at) : 'Date inconnue';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>📅 {formattedDate}</Text>
          <Text style={styles.moodText}>
            {moodEmoji} Mood: {session.mood_score || '?'}/10
          </Text>
        </View>

        {/* Transcript Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptText}>{session.transcript}</Text>
          </View>
        </View>

        {/* Insight Section */}
        {session.insight && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Insight</Text>
            <View style={styles.insightContainer}>
              <Text style={styles.insightText}>{session.insight}</Text>
            </View>
          </View>
        )}

        {/* Audio Player */}
        {session.audio_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎧 Enregistrement audio</Text>
            {!hasPremiumAccess ? (
              <TouchableOpacity
                style={styles.audioLockedCard}
                onPress={() => setShowUpgradeModal(true)}
              >
                <Text style={styles.audioLockedText}>
                  🔒 Upgrade vers Premium pour écouter
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.audioPlayerCard}>
                {isLoadingAudio ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : (
                  <>
                    {/* Play/Pause Button */}
                    <TouchableOpacity
                      style={styles.playPauseButton}
                      onPress={handlePlayAudio}
                    >
                      <Text style={styles.playPauseIcon}>
                        {isPlaying ? '⏸️' : '▶️'}
                      </Text>
                    </TouchableOpacity>

                    {/* Time Display */}
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(position)}</Text>
                      <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>

                    {/* Slider */}
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={duration || 1}
                      value={position}
                      minimumTrackTintColor={COLORS.primary}
                      maximumTrackTintColor={COLORS.border}
                      thumbTintColor={COLORS.primary}
                      onSlidingStart={handleSliderStart}
                      onSlidingComplete={handleSliderEnd}
                      disabled={!sound}
                    />
                  </>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Close Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 Fonctionnalité Premium</Text>
            <Text style={styles.modalText}>
              Upgrade vers Premium pour écouter tes enregistrements audio
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                setShowUpgradeModal(false);
                // Close modal and user can navigate from main screen
                navigation.goBack();
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade maintenant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  dateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  moodText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  transcriptContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  transcriptText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  insightContainer: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  insightText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // Audio Player Styles
  audioLockedCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  audioLockedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  audioPlayerCard: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playPauseIcon: {
    fontSize: 32,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  closeButton: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
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
    textAlign: 'center',
  },
  modalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeButton: {
    backgroundColor: COLORS.premium,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  upgradeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
  cancelButton: {
    padding: SPACING.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
