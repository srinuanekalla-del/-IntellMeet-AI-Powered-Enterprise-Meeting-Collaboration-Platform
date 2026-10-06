import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRecording } from '@/hooks/useRecording';
import { VideoTile } from '@/components/meeting/VideoTile';
import { ChatPanel } from '@/components/meeting/ChatPanel';
import { ParticipantList } from '@/components/meeting/ParticipantList';
import { MeetingControls } from '@/components/meeting/MeetingControls';

type SidePanel = 'chat' | 'participants' | null;

export const MeetingRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const socket = useMemo(() => getSocket(), []);
  const currentUser = useMemo(() => ({ id: user!.id, name: user!.name }), [user]);

  const { localStream, remotePeers, isScreenSharing, toggleMute, toggleCamera, toggleScreenShare } =
    useWebRTC(socket, roomId!, currentUser);
  const { isRecording, startRecording, stopRecording } = useRecording(localStream);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted((m) => !m);
  };

  const handleToggleCamera = () => {
    toggleCamera();
    setIsCameraOff((c) => !c);
  };

  const handleLeave = () => {
    disconnectSocket();
    navigate('/dashboard');
  };

  const peerList = Object.values(remotePeers);
  const gridCols = peerList.length === 0 ? 'grid-cols-1' : peerList.length <= 2 ? 'grid-cols-2' : 'grid-cols-3';

  if (!user) return null;

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <div className="flex flex-1 overflow-hidden">
        <div className={`grid flex-1 content-start gap-3 overflow-y-auto p-3 ${gridCols}`}>
          <VideoTile stream={localStream} name={currentUser.name} muted isSelf />
          {peerList.map((peer) => (
            <VideoTile key={peer.socketId} stream={peer.stream} name={peer.user.name} />
          ))}
        </div>

        {sidePanel && (
          <div className="w-80 shrink-0 border-l border-slate-800 bg-white">
            {sidePanel === 'chat' ? (
              <ChatPanel socket={socket} roomId={roomId!} currentUser={currentUser} />
            ) : (
              <ParticipantList
                localUser={currentUser}
                isLocalMuted={isMuted}
                isLocalCameraOff={isCameraOff}
                remotePeers={remotePeers}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 bg-slate-900 py-1">
        <button
          onClick={() => setSidePanel(sidePanel === 'chat' ? null : 'chat')}
          className={`rounded px-3 py-1 text-xs ${sidePanel === 'chat' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setSidePanel(sidePanel === 'participants' ? null : 'participants')}
          className={`rounded px-3 py-1 text-xs ${sidePanel === 'participants' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
        >
          👥 Participants ({peerList.length + 1})
        </button>
      </div>

      <MeetingControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isRecording={isRecording}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleRecording={isRecording ? stopRecording : startRecording}
        onLeave={handleLeave}
      />
    </div>
  );
};