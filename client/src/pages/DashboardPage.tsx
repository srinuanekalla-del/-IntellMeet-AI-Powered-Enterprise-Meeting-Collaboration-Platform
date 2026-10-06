import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/lib/authHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Meeting {
  _id: string;
  title: string;
  roomId: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledAt: string;
}

const useMeetings = () =>
  useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data } = await api.get<{ meetings: Meeting[] }>('/meetings');
      return data.meetings;
    },
  });

const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await api.post<{ meeting: Meeting }>('/meetings', { title });
      return data.meeting;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
};

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const [title, setTitle] = useState('');

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMeeting.mutate(title.trim(), {
      onSuccess: (meeting) => navigate(`/lobby/${meeting.roomId}`),
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">IntellMeet Dashboard</h1>
          <p className="text-slate-500">Signed in as {user?.name} ({user?.email})</p>
        </div>
        <Button variant="secondary" onClick={() => logout.mutate()}>
          Log out
        </Button>
      </div>

      <Card className="mb-6">
        <h2 className="mb-3 text-sm font-medium">Start a new meeting</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title, e.g. Sprint Planning"
          />
          <Button type="submit" disabled={createMeeting.isPending}>
            {createMeeting.isPending ? 'Creating…' : 'Create & join'}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium">Your meetings</h2>
        {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
        {meetings?.length === 0 && <p className="text-sm text-slate-400">No meetings yet.</p>}
        <div className="space-y-2">
          {meetings?.map((m) => (
            <div key={m._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-slate-400 capitalize">{m.status}</p>
              </div>
              <Button variant="secondary" onClick={() => navigate(`/lobby/${m.roomId}`)}>
                Join
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};