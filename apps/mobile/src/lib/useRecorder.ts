// Hold-to-talk recorder on expo-audio (Android + web). Press = start, release = stop + hand back the clip.
// Taps under 400 ms are ignored; recordings stop by themselves at 20 s.
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { RecordedAudio } from '../api/types';
import { MAX_RECORD_MS, decideHold } from './holdToTalk';

export type RecState = 'idle' | 'listening' | 'denied' | 'error';

export function useHoldToTalk(onClip: (clip: RecordedAudio) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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
    onClip({ uri: recorder.uri, mime: web ? 'audio/webm' : 'audio/mp4', name: web ? 'clip.webm' : 'clip.m4a' });
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
    } catch {
      starting.current = false;
      setState('error');
    }
  }, [recorder, stop]);

  return { state, elapsed, start, stop };
}
