// Colors - Voyce Brand Palette
export const COLORS = {
  primary: '#8B7FFF',       // Violet doux
  secondary: '#FF9ECD',     // Rose pêche
  accent: '#FFD23F',        // Jaune insight
  background: '#1A1A2E',    // Dark BG
  backgroundDark: '#16213E', // Surface
  text: '#FFFFFF',          // Text primary
  textLight: '#AAAAAA',     // Text secondary
  textMuted: '#AAAAAA',     // Text secondary
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  premium: '#FFD700',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// API endpoints
export const API_ENDPOINTS = {
  whisper: 'https://api.openai.com/v1/audio/transcriptions',
  claude: 'https://api.anthropic.com/v1/messages',
};

// Limits
export const LIMITS = {
  freeSessionsPerWeek: 3,
  maxSessionDuration: 900, // 15 minutes in seconds
  audioChunkInterval: 10000, // 10 seconds
};

// Crisis keywords for detection
export const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'want to die',
  'hurt someone',
  'violence',
];

// Fake patterns for FOMO (randomized)
export const FAKE_PATTERNS = [
  'Stress lié au travail mentionné fréquemment',
  'Les jours où tu fais du sport, ton mood est meilleur',
  'Tu sembles plus anxieux en début de semaine',
  'Tes pensées reviennent souvent sur tes relations',
  'Tu es plus productif quand tu dors bien',
  'Ton humeur s\'améliore quand tu passes du temps dehors',
  'Tu mentionnes souvent le besoin de prendre du recul',
];

// Pricing
export const PRICING = {
  weekly: {
    amount: 8.99,
    currency: 'CAD',
    label: 'Semaine',
  },
  yearly: {
    amount: 79,
    currency: 'CAD',
    label: 'Année',
    badge: '2 mois gratuits',
  },
};

// Trial duration in days
export const TRIAL_DURATION_DAYS = 7;

// Mood emoji mapping
export const MOOD_EMOJI = {
  1: '😢', 2: '😢', 3: '😕',
  4: '😕', 5: '😐', 6: '😐',
  7: '🙂', 8: '🙂', 9: '😊', 10: '😊'
} as const;
