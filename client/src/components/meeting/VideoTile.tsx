import { useEffect, useRef } from 'react';

interface VideoTileProps {
  stream?: MediaStream | null;
  name: string;
  muted?: boolean;
  isSelf?: boolean;
}

export const VideoTile = ({ stream, name, muted = false, isSelf = false }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-500">
          Connecting…
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {name}{isSelf ? ' (You)' : ''}
      </span>
    </div>
  );
};