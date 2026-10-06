import { FormEvent, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  message: string;
  user: { id: string; name: string };
  timestamp: string;
}

interface ChatPanelProps {
  socket: Socket;
  roomId: string;
  currentUser: { id: string; name: string };
}

const TYPING_TIMEOUT_MS = 2000;

export const ChatPanel = ({ socket, roomId, currentUser }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMessage = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);
    const onTyping = ({ user, isTyping }: { user: { id: string; name: string }; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(user.name);
        else next.delete(user.name);
        return next;
      });
    };

    socket.on('chat-message', onMessage);
    socket.on('typing', onTyping);
    return () => {
      socket.off('chat-message', onMessage);
      socket.off('typing', onTyping);
    };
  }, [socket]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const emitTyping = (isTyping: boolean) => {
    socket.emit('typing', { roomId, user: currentUser, isTyping });
  };

  const handleChange = (value: string) => {
    setDraft(value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), TYPING_TIMEOUT_MS);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    socket.emit('chat-message', { roomId, message: draft.trim(), user: currentUser });
    setDraft('');
    emitTyping(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.user.id === currentUser.id ? 'text-right' : 'text-left'}>
            <p className="text-xs text-slate-400">{m.user.name}</p>
            <p
              className={`inline-block rounded-lg px-3 py-1.5 text-sm ${
                m.user.id === currentUser.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {m.message}
            </p>
          </div>
        ))}
      </div>

      {typingUsers.size > 0 && (
        <p className="px-3 pb-1 text-xs italic text-slate-400">
          {Array.from(typingUsers).join(', ')} typing…
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-200 p-3">
        <Input value={draft} onChange={(e) => handleChange(e.target.value)} placeholder="Type a message…" />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
};