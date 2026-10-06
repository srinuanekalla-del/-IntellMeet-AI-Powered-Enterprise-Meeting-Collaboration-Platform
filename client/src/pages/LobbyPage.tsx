import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const LobbyPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError('Could not access camera/microphone. Check browser permissions.'));

    return () => stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = () => {
    stream?.getTracks().forEach((t) => t.stop());
    navigate(`/meeting/${roomId}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <Card className="w-full max-w-md bg-white">
        <h1 className="mb-1 text-lg font-semibold">Ready to join?</h1>
        <p className="mb-4 text-sm text-slate-500">Check your camera and mic before entering.</p>

        <div className="aspect-video overflow-hidden rounded-lg bg-slate-900">
          {error ? (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-red-400">
              {error}
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          )}
        </div>

        <Button className="mt-4 w-full" onClick={handleJoin} disabled={!stream}>
          Join meeting
        </Button>
      </Card>
    </div>
  );
};