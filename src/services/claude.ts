import { supabase } from './supabase';

export interface GenerateInsightParams {
  transcript: string;
  isFirstSession?: boolean;
  context?: {
    reason?: string | null;
    situation?: string | null;
    feeling?: string | null;
  };
}

export interface GenerateInsightResult {
  insight: string;
  hasCrisisKeywords: boolean;
  error?: string;
}

/**
 * Generates an insight from a session transcript using Claude API via Supabase Edge Function
 */
export async function generateInsight({
  transcript,
  isFirstSession = false,
  context,
}: GenerateInsightParams): Promise<GenerateInsightResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-insight', {
      body: {
        transcript,
        isFirstSession,
        context,
      },
    });

    if (error) {
      console.error('Claude service error:', error);
      return {
        insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
        hasCrisisKeywords: false,
        error: error.message || 'Insight generation failed',
      };
    }

    if (data.error) {
      console.error('Claude API error:', data.error);
      return {
        insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
        hasCrisisKeywords: false,
        error: data.error,
      };
    }

    return {
      insight: data.insight || 'Merci pour ce partage.',
      hasCrisisKeywords: data.hasCrisisKeywords || false,
    };
  } catch (err) {
    console.error('Unexpected error in generateInsight:', err);
    return {
      insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
      hasCrisisKeywords: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
