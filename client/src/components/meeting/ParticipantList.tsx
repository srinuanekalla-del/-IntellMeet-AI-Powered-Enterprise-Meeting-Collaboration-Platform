import type { RemotePeer } from '@/hooks/useWebRTC';

interface ParticipantListProps {
  localUser: { id: string; name: string };
  isLocalMuted: boolean;
  isLocalCameraOff: boolean;
  remotePeers: Record<string, RemotePeer>;
}

export const ParticipantList = ({
  localUser,
  isLocalMuted,
  isLocalCameraOff,
  remotePeers,
}: ParticipantListProps) => {
  const peerList = Object.values(remotePeers);

  return (
    <div className="space-y-2 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        In this meeting ({peerList.length + 1})
      </p>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="text-sm font-medium">{localUser.name} (You)</span>
        <div className="flex gap-1 text-xs text-slate-400">
          {isLocalMuted && <span title="Muted">🔇</span>}
          {isLocalCameraOff && <span title="Camera off">📷🚫</span>}
        </div>
      </div>

      {peerList.map((peer) => (
        <div key={peer.socketId} className="flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-sm">{peer.user.name}</span>
          <span className={`h-2 w-2 rounded-full ${peer.stream ? 'bg-green-500' : 'bg-amber-400'}`} />
        </div>
      ))}

      {peerList.length === 0 && (
        <p className="px-3 py-2 text-sm text-slate-400">Waiting for others to join…</p>
      )}
    </div>
  );
};