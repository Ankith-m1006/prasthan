// Hold-to-talk recorder on expo-audio (Android + web). Press = start, release = stop + hand back the clip.
// Taps under 400 ms are ignored; recordings stop by themselves at 20 s.
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { RecordedAudio } from '../api/types';
import { MAX_RECORD_MS, decideHold, isPermissionError, pickWebMime } from './holdToTalk';

// Web: ask MediaRecorder for a format this browser really records (Safari iOS = mp4/aac, Chrome = webm/opus).
const webMime = Platform.OS === 'web' && typeof MediaRecorder !== 'undefined' ? pickWebMime((m) => MediaRecorder.isTypeSupported(m)) : undefined;
const PRESET = { ...RecordingPresets.HIGH_QUALITY, web: { ...RecordingPresets.HIGH_QUALITY.web, mimeType: webMime } };

export type RecState = 'idle' | 'listening' | 'denied' | 'error';

export function useHoldToTalk(onClip: (clip: RecordedAudio) => void) {
  const recorder = useAudioRecorder(PRESET);
  const [state, setState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const pressedAt = useRef(0);
  const starting = useRef(false);
  const releasedEarly = useRef(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const cap = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (tick.current) clearInterval(tick.current);
    if (cap.current) clearTimeout(cap.current);
    tick.current = null;
    cap.current = null;
  };
  useEffect(() => clear, []);

  const stop = useCallback(async () => {
    clear();
    if (starting.current) { releasedEarly.current = true; return; }
    if (!pressedAt.current) return;
    const decision = decideHold(pressedAt.current, Date.now());
    pressedAt.current = 0;
    setState('idle');
    try {
      await recorder.stop();
    } catch {
      return;
    }
    if (decision === 'ignore' || !recorder.uri) return;
    const web = Platform.OS === 'web';
    // web: the real type is read from the blob at upload time (api/http.ts); this is only a first guess
    onClip({ uri: recorder.uri, mime: web ? webMime?.split(';')[0] ?? 'audio/webm' : 'audio/mp4', name: web ? (webMime?.includes('mp4') ? 'clip.m4a' : 'clip.webm') : 'clip.m4a' });
  }, [recorder, onClip]);

  const start = useCallback(async () => {
    starting.current = true;
    releasedEarly.current = false;
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { starting.current = false; setState('denied'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
      await recorder.prepareToRecordAsync();
      recorder.record();
      pressedAt.current = Date.now();
      setElapsed(0);
      setState('listening');
      tick.current = setInterval(() => setElapsed(Date.now() - pressedAt.current), 250);
      cap.current = setTimeout(() => void stop(), MAX_RECORD_MS);
      starting.current = false;
      if (releasedEarly.current) void stop();
    } catch (err) {
      starting.current = false;
      setState(isPermissionError(err) ? 'denied' : 'error');
    }
  }, [recorder, stop]);

  return { state, elapsed, start, stop };
}
