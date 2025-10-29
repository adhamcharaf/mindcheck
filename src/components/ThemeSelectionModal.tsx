import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

export type RecordingTheme = 'free' | 'daily' | 'difficult' | 'reflection';

interface ThemeSelectionModalProps {
  visible: boolean;
  onSelect: (theme: RecordingTheme) => void;
}

export default function ThemeSelectionModal({ visible, onSelect }: ThemeSelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => onSelect('free')}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>💭 Besoin d'aide pour démarrer?</Text>

          {/* Primary option: Free talk */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onSelect('free')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Parle librement</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>Ou choisis un thème:</Text>

          {/* Theme buttons */}
          <View style={styles.themeGrid}>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={() => onSelect('daily')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeEmoji}>🌅</Text>
              <Text style={styles.themeText}>Ma journée</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeButton}
              onPress={() => onSelect('difficult')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeEmoji}>😟</Text>
              <Text style={styles.themeText}>Moment difficile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeButton}
              onPress={() => onSelect('reflection')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeEmoji}>💭</Text>
              <Text style={styles.themeText}>Réflexion libre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  orText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  themeGrid: {
    width: '100%',
    gap: SPACING.md,
  },
  themeButton: {
    backgroundColor: COLORS.backgroundDark,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  themeEmoji: {
    fontSize: FONT_SIZES.xl,
  },
  themeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
});
