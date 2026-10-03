import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

interface Credentials {
  email: string;
  password: string;
}

interface SignupPayload extends Credentials {
  name: string;
}

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: Credentials) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      return data;
    },
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
};

export const useSignup = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const { data } = await api.post<AuthResponse>('/auth/signup', payload);
      return data;
    },
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
};

export const useLogout = () => {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => logout(),
  });
};
