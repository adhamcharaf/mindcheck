import { supabase } from './supabase';

export interface TranscribeAudioParams {
  audioUri: string;
  language?: string;
}

export interface TranscribeAudioResult {
  transcript: string;
  error?: string;
}

/**
 * Transcribes an audio chunk using Whisper API via Supabase Edge Function
 */
export async function transcribeAudio({
  audioUri,
  language = 'fr',
}: TranscribeAudioParams): Promise<TranscribeAudioResult> {
  try {
    console.log('[Whisper Service] Preparing to transcribe audio:', {
      audioUri,
      language,
    });

    const formData = new FormData();
    // React Native FormData accepts {uri, name, type} object
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);
    formData.append('language', language);

    console.log('[Whisper Service] FormData prepared, invoking Edge Function...');

    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: formData,
    });

    console.log('[Whisper Service] Edge Function response:', { data, error });

    if (error) {
      console.error('Whisper service error:', error);
      return {
        transcript: '',
        error: error.message || 'Transcription failed',
      };
    }

    if (data.error) {
      console.error('Whisper API error:', data.error);
      return {
        transcript: '',
        error: data.error,
      };
    }

    return {
      transcript: data.transcript || '',
    };
  } catch (err) {
    console.error('Unexpected error in transcribeAudio:', err);
    return {
      transcript: '',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
