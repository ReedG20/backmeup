import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

type RecordingState = 'idle' | 'recording' | 'error';

interface UseAudioRecordingOptions {
  onAudioChunk?: (audioData: ArrayBuffer) => void;
  chunkDurationMs?: number; // Duration of each recording chunk in milliseconds
}

export function useAudioRecording({ 
  onAudioChunk,
  chunkDurationMs = 800, // 800ms chunks to stay under AssemblyAI's 1000ms limit
}: UseAudioRecordingOptions = {}) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isRecordingActiveRef = useRef(false);
  const lastChunkSizeRef = useRef(0);

  // Chunked recording: record for a short duration, then stop, read, and restart
  const recordChunk = useCallback(async () => {
    if (!isRecordingActiveRef.current) {
      return;
    }

    try {
      // Create a new recording
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: false,
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 256000,
        },
      });

      recordingRef.current = recording;

      // Wait for the chunk duration
      await new Promise(resolve => setTimeout(resolve, chunkDurationMs));

      if (!isRecordingActiveRef.current) {
        await recording.stopAndUnloadAsync();
        return;
      }

      // Stop the recording
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri && onAudioChunk) {
        try {
          // Read the audio file as base64
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });

          // Convert base64 to ArrayBuffer
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // WAV files have a 44-byte header, skip it to send raw PCM data
          // AssemblyAI expects raw PCM audio, not WAV
          const WAV_HEADER_SIZE = 44;
          const pcmData = bytes.slice(WAV_HEADER_SIZE);
          
          // Only send if we have actual audio data
          if (pcmData.length > 0) {
            onAudioChunk(pcmData.buffer);
            lastChunkSizeRef.current = pcmData.length;
            console.log(`[Audio] Sent PCM chunk: ${pcmData.length} bytes`);
          }

          // Clean up the temporary file
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (error) {
          console.error('[Audio] Error processing chunk:', error);
        }
      }

      // Continue recording next chunk
      if (isRecordingActiveRef.current) {
        // Use setImmediate or setTimeout to avoid blocking
        setTimeout(() => recordChunk(), 0);
      }
    } catch (error) {
      console.error('[Audio] Error in recordChunk:', error);
      if (isRecordingActiveRef.current) {
        // Try to continue despite the error
        setTimeout(() => recordChunk(), 100);
      }
    }
  }, [chunkDurationMs, onAudioChunk]);

  const startRecording = useCallback(async () => {
    try {
      console.log('[Audio] Requesting permissions...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        console.error('[Audio] Permission denied');
        setRecordingState('error');
        return;
      }

      console.log('[Audio] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[Audio] Starting chunked recording...');
      console.log(`[Audio] Chunk duration: ${chunkDurationMs}ms`);
      isRecordingActiveRef.current = true;
      setRecordingState('recording');
      
      // Start the chunked recording loop
      recordChunk();

    } catch (error) {
      console.error('[Audio] Failed to start recording:', error);
      setRecordingState('error');
      isRecordingActiveRef.current = false;
    }
  }, [chunkDurationMs, recordChunk]);

  const stopRecording = useCallback(async () => {
    try {
      console.log('[Audio] Stopping recording...');
      isRecordingActiveRef.current = false;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (error) {
          console.warn('[Audio] Error stopping recording (may already be stopped):', error);
        }
        recordingRef.current = null;
      }

      setRecordingState('idle');
      console.log('[Audio] Recording stopped');
      console.log(`[Audio] Last chunk size: ${lastChunkSizeRef.current} bytes`);
    } catch (error) {
      console.error('[Audio] Failed to stop recording:', error);
      setRecordingState('error');
    }
  }, []);

  return {
    recordingState,
    startRecording,
    stopRecording,
  };
}
