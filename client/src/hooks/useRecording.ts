import { useCallback, useRef, useState } from 'react';

export const useRecording = (stream: MediaStream | null, onRecordingReady?: (blob: Blob) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });

      // Still offer the local download — useful regardless of AI processing.
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `intellmeet-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      onRecordingReady?.(blob);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [stream, isRecording, onRecordingReady]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
};
