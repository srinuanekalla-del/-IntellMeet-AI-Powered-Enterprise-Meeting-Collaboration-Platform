# IntellMeet — Client (Week 2, Days 8-9)

| Day | What's implemented |
|---|---|
| 8 | Vite + React 19 + TypeScript scaffold, Tailwind CSS, TanStack Query provider, Zustand store, axios API client (with auto token-refresh on 401), Socket.io client setup, hand-rolled shadcn-style UI primitives (Button, Input, Card) |
| 9 | Login and Signup pages wired to the backend, a Zustand-backed auth store, a `ProtectedRoute` wrapper, and a placeholder Dashboard page that proves the whole flow works end to end |

## Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Opens at `http://localhost:5173`. Make sure the backend (`server/`) is running on port 5000 first — the frontend calls it directly.

## Folder structure

```
client/
├── src/
│   ├── components/
│   │   ├── ui/              # button.tsx, input.tsx, card.tsx
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   ├── api.ts            # axios instance, auto-refresh on 401
│   │   ├── authHooks.ts       # useLogin / useSignup / useLogout (TanStack Query)
│   │   ├── queryClient.ts
│   │   └── socket.ts          # Socket.io client, authenticated with JWT
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── DashboardPage.tsx
│   ├── store/
│   │   └── authStore.ts       # Zustand, persists user to localStorage
│   ├── types/index.ts
│   ├── App.tsx                 # routes
│   └── main.tsx                 # entry point, QueryClientProvider
├── .env.example
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## How auth flows

1. `SignupPage` / `LoginPage` call `useSignup()` / `useLogin()` → `POST /api/auth/signup|login`
2. On success, the returned `user` + `accessToken` go into the Zustand store (`authStore.ts`)
3. `api.ts`'s request interceptor attaches `Authorization: Bearer <token>` to every call automatically
4. If a request gets a 401 (expired access token), the response interceptor calls `POST /api/auth/refresh` (uses the httpOnly cookie set by the backend) and retries the original request once
5. `ProtectedRoute` checks the Zustand store — no user, no access, redirected to `/login`

## Next (rest of Week 2)

- Meeting list + "New meeting" flow on the dashboard, calling `/api/meetings`
- The actual video call room: join a Socket.io room, set up `RTCPeerConnection` per remote peer using the `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` events already relayed by the backend
- A notification bell wired to `notification:new` socket events and `GET /api/notifications`
