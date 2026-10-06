import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export interface RemotePeer {
  socketId: string;
  user: { id: string; name: string };
  stream?: MediaStream;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useWebRTC = (socket: Socket, roomId: string, localUser: { id: string; name: string }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Record<string, RemotePeer>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const createPeerConnection = useCallback(
    (remoteSocketId: string, remoteUser: { id: string; name: string }) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      cameraStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, cameraStreamRef.current!);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', { to: remoteSocketId, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        setRemotePeers((prev) => ({
          ...prev,
          [remoteSocketId]: { socketId: remoteSocketId, user: remoteUser, stream: event.streams[0] },
        }));
      };

      peerConnections.current[remoteSocketId] = pc;
      return pc;
    },
    [socket]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (!active) return;

      cameraStreamRef.current = stream;
      setLocalStream(stream);
      socket.emit('join-room', { roomId, user: localUser });
    };

    init().catch((err) => console.error('[WebRTC] getUserMedia failed:', err));

    const onUserJoined = async ({ socketId, user }: { socketId: string; user: any }) => {
      const pc = createPeerConnection(socketId, user);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { to: socketId, offer });
    };

    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      const pc = peerConnections.current[from] || createPeerConnection(from, { id: from, name: 'Participant' });
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { to: from, answer });
    };

    const onAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      await peerConnections.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      try {
        await peerConnections.current[from]?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] failed to add ICE candidate:', err);
      }
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      setRemotePeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on('user-joined', onUserJoined);
    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onIceCandidate);
    socket.on('user-left', onUserLeft);

    return () => {
      active = false;
      socket.off('user-joined', onUserJoined);
      socket.off('webrtc-offer', onOffer);
      socket.off('webrtc-answer', onAnswer);
      socket.off('webrtc-ice-candidate', onIceCandidate);
      socket.off('user-left', onUserLeft);

      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, socket]);

  const toggleMute = useCallback(() => {
    cameraStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  }, []);

  const toggleCamera = useCallback(() => {
    cameraStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && camTrack) sender.replaceTrack(camTrack);
      });
      if (camTrack) setLocalStream(new MediaStream([camTrack, ...(cameraStreamRef.current?.getAudioTracks() || [])]));
      setIsScreenSharing(false);
      return;
    }

    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    Object.values(peerConnections.current).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(screenTrack);
    });

    setLocalStream(screenStream);
    setIsScreenSharing(true);

    screenTrack.onended = () => toggleScreenShare();
  }, [isScreenSharing]);

  return { localStream, remotePeers, isScreenSharing, toggleMute, toggleCamera, toggleScreenShare };
};