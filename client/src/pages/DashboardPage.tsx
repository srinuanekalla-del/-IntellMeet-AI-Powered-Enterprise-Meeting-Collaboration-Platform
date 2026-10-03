import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/lib/authHooks';
import { Button } from '@/components/ui/button';

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

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

      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        Meeting list, scheduling, and the video call UI land here in Week 2's
        remaining days — this page just confirms the protected route and
        auth flow are wired correctly.
      </div>
    </div>
  );
};
