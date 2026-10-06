import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

/**
 * Wraps routes that require authentication. If the user is remembered
 * but we don't have a live access token yet (e.g. after a full page
 * reload/direct URL navigation), we proactively refresh it here BEFORE
 * rendering any children — this matters most for the meeting room,
 * whose Socket.io connection needs a valid token the instant it mounts.
 */
export const ProtectedRoute = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const logout = useAuthStore((s) => s.logout);
  const [isChecking, setIsChecking] = useState(!accessToken && !!user);

  useEffect(() => {
    if (user && !accessToken) {
      api
        .post('/auth/refresh')
        .then(({ data }) => setAccessToken(data.accessToken))
        .catch(() => logout())
        .finally(() => setIsChecking(false));
    }
  }, [user, accessToken, setAccessToken, logout]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  return <Outlet />;
};