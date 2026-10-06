interface MeetingControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onLeave: () => void;
}

const ControlButton = ({
  active,
  danger,
  onClick,
  label,
  icon,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex h-11 w-11 items-center justify-center rounded-full text-lg transition ${
      danger
        ? 'bg-red-600 text-white hover:bg-red-700'
        : active
          ? 'bg-slate-700 text-white hover:bg-slate-600'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`}
  >
    {icon}
  </button>
);

export const MeetingControls = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isRecording,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleRecording,
  onLeave,
}: MeetingControlsProps) => (
  <div className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white px-4 py-3">
    <ControlButton active={isMuted} onClick={onToggleMute} label={isMuted ? 'Unmute' : 'Mute'} icon={isMuted ? '🔇' : '🎙️'} />
    <ControlButton
      active={isCameraOff}
      onClick={onToggleCamera}
      label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
      icon={isCameraOff ? '📷🚫' : '📷'}
    />
    <ControlButton
      active={isScreenSharing}
      onClick={onToggleScreenShare}
      label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      icon="🖥️"
    />
    <ControlButton
      active={isRecording}
      onClick={onToggleRecording}
      label={isRecording ? 'Stop recording' : 'Start recording'}
      icon={isRecording ? '⏺️' : '⚪'}
    />
    <ControlButton danger onClick={onLeave} label="Leave meeting" icon="📵" />
  </div>
);