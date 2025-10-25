import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface UploadAudioParams {
  userId: string;
  sessionId: string;
  audioUri: string;
}

export interface UploadAudioResult {
  audioUrl?: string;
  error?: string;
}

/**
 * Uploads an audio recording to Supabase Storage
 * Path format: {userId}/{sessionId}.m4a
 */
export async function uploadAudio({
  userId,
  sessionId,
  audioUri,
}: UploadAudioParams): Promise<UploadAudioResult> {
  try {
    // Read the audio file as base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer (recommended approach for React Native)
    const arrayBuffer = decode(base64Audio);

    // Upload to Supabase Storage
    const filePath = `${userId}/${sessionId}.m4a`;
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .upload(filePath, arrayBuffer, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        error: error.message || 'Upload failed',
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio-recordings')
      .getPublicUrl(filePath);

    return {
      audioUrl: urlData.publicUrl,
    };
  } catch (err) {
    console.error('Unexpected error in uploadAudio:', err);
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
