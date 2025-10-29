// Crisis detection utility for identifying keywords that may indicate user distress

export const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'want to die',
  'hurt someone',
  'violence',
  'je veux mourir',
  'me suicider',
  'en finir',
  'tuer quelqu\'un',
];

export const CRISIS_MESSAGE =
  '\n\nSi tu traverses un moment difficile, parle à quelqu\'un: contacte les urgences ou une personne de confiance. Tu n\'es pas seul(e).';

/**
 * Detects crisis keywords in a transcript
 * @param transcript - The text to analyze
 * @returns true if crisis keywords are detected, false otherwise
 */
export function detectCrisis(transcript: string): boolean {
  if (!transcript) return false;

  const lowerTranscript = transcript.toLowerCase();

  return CRISIS_KEYWORDS.some(keyword =>
    lowerTranscript.includes(keyword.toLowerCase())
  );
}

/**
 * Silent logging for crisis detection events
 * In production, this would send to monitoring service
 * @param userId - The user ID
 * @param sessionId - The session ID
 * @param detectedKeywords - Keywords that were detected
 */
export function logCrisisDetection(
  userId: string,
  sessionId: string,
  detectedKeywords: string[]
): void {
  // Silent logging - in production this would send to monitoring service
  // For now, just console log for development
  console.log('[CRISIS DETECTION]', {
    userId,
    sessionId,
    detectedKeywords,
    timestamp: new Date().toISOString(),
  });

  // TODO: In production, send to monitoring service (e.g., Sentry, Mixpanel)
  // Example:
  // Sentry.captureMessage('Crisis keywords detected', {
  //   level: 'warning',
  //   extra: { userId, sessionId, detectedKeywords }
  // });
}

/**
 * Gets which specific crisis keywords were detected
 * @param transcript - The text to analyze
 * @returns Array of detected keywords
 */
export function getDetectedCrisisKeywords(transcript: string): string[] {
  if (!transcript) return [];

  const lowerTranscript = transcript.toLowerCase();

  return CRISIS_KEYWORDS.filter(keyword =>
    lowerTranscript.includes(keyword.toLowerCase())
  );
}
