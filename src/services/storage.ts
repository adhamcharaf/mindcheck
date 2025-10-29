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

    // Return the file path (relative path in bucket)
    // This will be used to generate signed URLs on demand
    return {
      audioUrl: filePath,
    };
  } catch (err) {
    console.error('Unexpected error in uploadAudio:', err);
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Gets a signed URL for an audio file (valid for 1 hour)
 * This provides secure, temporary access to private audio files
 */
export async function getSignedAudioUrl(
  filePath: string
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('audio-recordings')
      .createSignedUrl(filePath, 3600); // 1 hour expiration

    if (error) {
      console.error('Error creating signed URL:', error);
      return {
        error: error.message || 'Failed to create signed URL',
      };
    }

    return {
      url: data.signedUrl,
    };
  } catch (err) {
    console.error('Unexpected error in getSignedAudioUrl:', err);
    return {
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
