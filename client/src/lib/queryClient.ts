import { QueryClient } from '@tanstack/react-query';

// Central query client: 30s default staleness is fine for most meeting/profile
// data, and refetchOnWindowFocus is off so switching tabs during a call
// doesn't trigger a burst of refetches.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
