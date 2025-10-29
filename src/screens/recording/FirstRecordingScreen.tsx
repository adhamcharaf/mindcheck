import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio, RecordingOptions, RecordingOptionsPresets } from 'expo-audio';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, LIMITS } from '../../utils/constants';
import { transcribeAudio } from '../../services/whisper';
import { RootStackParamList } from '../../types';

type FirstRecordingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FirstRecording'>;
};

export default function FirstRecordingScreen({ navigation }: FirstRecordingScreenProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Animation values for soundwave bars
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.5)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;
  const bar4 = useRef(new Animated.Value(0.5)).current;
  const bar5 = useRef(new Animated.Value(0.3)).current;

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Start recording immediately when screen mounts
    startRecording();

    return () => {
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  // Animate soundwave bars
  useEffect(() => {
    if (isRecording) {
      const animateBars = () => {
        Animated.loop(
          Animated.stagger(200, [
            Animated.sequence([
              Animated.timing(bar1, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 400,
                useNativeDriver: false,
              }),
            ]),
            Animated.sequence([
              Animated.timing(bar2, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 400,
                useNativeDriver: false,
              }),
            ]),
            Animated.sequence([
              Animated.timing(bar3, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 400,
                useNativeDriver: false,
              }),
            ]),
            Animated.sequence([
              Animated.timing(bar4, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 400,
                useNativeDriver: false,
              }),
            ]),
            Animated.sequence([
              Animated.timing(bar5, {
                toValue: Math.random() * 0.8 + 0.2,
                duration: 400,
                useNativeDriver: false,
              }),
            ]),
          ])
        ).start();
      };
      animateBars();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.getPermissionsAsync();
      if (!granted) {
        const { granted: requestGranted } = await Audio.requestPermissionsAsync();
        if (!requestGranted) {
          Alert.alert('Permission requise', 'Nous avons besoin d\'accéder au microphone.');
          navigation.goBack();
          return;
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use HIGH_QUALITY preset for better audio quality
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsRecording(true);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Note: Chunk upload every 10s would require more complex implementation
      // For MVP, we'll transcribe the full recording at the end
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      const uri = recording.getURI();
      await recording.stopAndUnloadAsync();

      // Clear the ref
      recordingRef.current = null;

      if (!uri) {
        Alert.alert('Erreur', 'Aucun enregistrement trouvé.');
        return;
      }

      // Transcribe the full recording
      setIsTranscribing(true);

      console.log('[DEBUG] Audio URI:', uri);

      // Pass URI directly to transcription service (React Native FormData approach)
      const result = await transcribeAudio({ audioUri: uri });

      setIsTranscribing(false);

      if (result.error) {
        console.error('Transcription error:', result.error);
        // Continue with empty transcript rather than blocking the flow
        Alert.alert(
          'Transcription partielle',
          'Nous avons eu du mal à transcrire certaines parties. Tu peux quand même continuer.',
          [
            {
              text: 'Continuer',
              onPress: () => {
                navigation.navigate('Loading', {
                  transcript: result.transcript || 'Session vocale enregistrée.',
                  audioUri: uri,
                });
              },
            },
          ]
        );
      } else {
        setTranscript(result.transcript);
        navigation.navigate('Loading', {
          transcript: result.transcript,
          audioUri: uri,
        });
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Erreur', 'Impossible de terminer l\'enregistrement.');
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(duration)}</Text>
          {duration > LIMITS.maxSessionDuration && (
            <Text style={styles.warning}>Durée maximale atteinte</Text>
          )}
        </View>

        {/* Soundwave Animation */}
        <View style={styles.soundwaveContainer}>
          <Animated.View
            style={[
              styles.bar,
              {
                height: bar1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                height: bar2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                height: bar3.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                height: bar4.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bar,
              {
                height: bar5.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Mic Icon */}
        <View style={styles.micContainer}>
          <View style={styles.micButton}>
            <Text style={styles.micIcon}>🎤</Text>
          </View>
        </View>
      </View>

      {/* Terminer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.stopButton, isTranscribing && styles.stopButtonDisabled]}
          onPress={stopRecording}
          disabled={isTranscribing || !isRecording}
        >
          <Text style={styles.stopButtonText}>
            {isTranscribing ? 'Transcription...' : 'Terminer'}
          </Text>
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  timer: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  warning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  soundwaveContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    gap: 8,
    marginBottom: SPACING.xl,
  },
  bar: {
    width: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    fontSize: 48,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  stopButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonDisabled: {
    opacity: 0.6,
  },
  stopButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
