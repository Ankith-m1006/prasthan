// Tap-to-talk recorder. Tap = start, tap again = stop + hand back the clip; stops by itself at 12 s.
// Web: getUserMedia is called first thing inside the tap handler (user gesture, so iOS Safari + Android Chrome allow it),
// then MediaRecorder with the format this browser really records (Safari iOS = mp4/aac, Chrome = webm/opus).
// Native: expo-audio.
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { RecordedAudio } from '../api/types';
import { MAX_RECORD_MS, clipFileFor, decideHold, isPermissionError, pickWebMime } from './holdToTalk';
import { unlockAudio } from './speak';

const isWeb = Platform.OS === 'web';
const webMime = isWeb && typeof MediaRecorder !== 'undefined' ? pickWebMime((m) => MediaRecorder.isTypeSupported(m)) : undefined;
const PRESET = { ...RecordingPresets.HIGH_QUALITY, web: { ...RecordingPresets.HIGH_QUALITY.web, mimeType: webMime } };

export type RecState = 'idle' | 'starting' | 'listening' | 'denied' | 'error';

export function useHoldToTalk(onClip: (clip: RecordedAudio) => void) {
  const recorder = useAudioRecorder(PRESET);
  const [state, setState] = useState<RecState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const media = useRef<MediaRecorder | null>(null);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; cap?: ReturnType<typeof setTimeout> }>({});

  const clear = () => {
    if (timers.current.tick) clearInterval(timers.current.tick);
    if (timers.current.cap) clearTimeout(timers.current.cap);
    timers.current = {};
  };
  useEffect(() => () => { clear(); media.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  const began = useCallback((stop: () => void) => {
    startedAt.current = Date.now();
    setElapsed(0);
    setState('listening');
    timers.current.tick = setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
    timers.current.cap = setTimeout(stop, MAX_RECORD_MS);
  }, []);

  const stop = useCallback(async () => {
    clear();
    if (!startedAt.current) return;
    const decision = decideHold(startedAt.current, Date.now());
    startedAt.current = 0;
    setState('idle');
    if (isWeb) {
      const mr = media.current;
      if (mr && mr.state !== 'inactive') { (mr as MediaRecorder & { skip?: boolean }).skip = decision === 'ignore'; mr.stop(); }
      return;
    }
    try { await recorder.stop(); } catch { return; }
    if (decision !== 'ignore' && recorder.uri) onClip({ uri: recorder.uri, mime: 'audio/mp4', name: 'clip.m4a' });
  }, [recorder, onClip]);

  const startWeb = useCallback(() => {
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    if (!md?.getUserMedia || typeof MediaRecorder === 'undefined') { setState('error'); return; }
    setState('starting');
    // first await-free call in the tap handler: keeps the user gesture for the mic prompt
    md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then((stream) => {
      const mr = new MediaRecorder(stream, webMime ? { mimeType: webMime } : undefined);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        media.current = null;
        if ((mr as MediaRecorder & { skip?: boolean }).skip || !chunks.length) return;
        const blob = new Blob(chunks, { type: mr.mimeType || webMime || 'audio/webm' });
        const file = clipFileFor(blob.type);
        onClip({ uri: URL.createObjectURL(blob), mime: file.mime, name: file.name });
      };
      media.current = mr;
      mr.start(250);
      began(() => void stop());
    }).catch((err: unknown) => setState(isPermissionError(err) ? 'denied' : 'error'));
  }, [onClip, began, stop]);

  const startNative = useCallback(async () => {
    setState('starting');
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { setState('denied'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
      await recorder.prepareToRecordAsync();
      recorder.record();
      began(() => void stop());
    } catch (err) {
      setState(isPermissionError(err) ? 'denied' : 'error');
    }
  }, [recorder, began, stop]);

  /** One tap handler: idle -> start, listening -> stop. */
  const toggle = useCallback(() => {
    if (state === 'starting') return;
    if (state === 'listening') { void stop(); return; }
    if (isWeb) startWeb(); else void startNative();
    unlockAudio(); // same gesture: lets the reply audio play later on iOS / Android
  }, [state, stop, startWeb, startNative]);

  return { state, elapsed, toggle, stop };
}
