import { supabase } from './supabase';
import { MemoryContext } from './sessions';

export interface GenerateInsightParams {
  transcript: string;
  isFirstSession?: boolean;
  context?: {
    reason?: string | null;
    situation?: string | null;
    feeling?: string | null;
  };
  memoryContext?: MemoryContext | null;
}

export interface GenerateInsightResult {
  insight: string;
  keyFacts: string[];
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
  memoryContext,
}: GenerateInsightParams): Promise<GenerateInsightResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-insight', {
      body: {
        transcript,
        isFirstSession,
        context,
        memoryContext,
      },
    });

    if (error) {
      console.error('Claude service error:', error);
      return {
        insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
        keyFacts: [],
        hasCrisisKeywords: false,
        error: error.message || 'Insight generation failed',
      };
    }

    if (data.error) {
      console.error('Claude API error:', data.error);
      return {
        insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
        keyFacts: [],
        hasCrisisKeywords: false,
        error: data.error,
      };
    }

    return {
      insight: data.insight || 'Merci pour ce partage.',
      keyFacts: data.keyFacts || [],
      hasCrisisKeywords: data.hasCrisisKeywords || false,
    };
  } catch (err) {
    console.error('Unexpected error in generateInsight:', err);
    return {
      insight: 'Nous avons eu du mal à générer un insight. Réessaye plus tard.',
      keyFacts: [],
      hasCrisisKeywords: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
