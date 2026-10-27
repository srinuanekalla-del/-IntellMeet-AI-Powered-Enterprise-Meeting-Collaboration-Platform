# IntellMeet - Client

React + TypeScript front end for IntellMeet, an AI-powered meeting and collaboration platform:
real-time video meetings, AI summaries with action items, a team project board, and notifications.

**Live:** https://intell-meet-ai-powered-enterprise-m-eight.vercel.app

## What the client does

| Area | Days | What is implemented |
|---|---|---|
| Foundation | 8 | Vite + React 19 + TypeScript, Tailwind CSS, TanStack Query, Zustand, axios client with automatic token refresh, Socket.IO client, hand-rolled shadcn-style UI primitives (Button, Input, Card) |
| Authentication | 9 | Login and signup pages, auth store, `ProtectedRoute`, dashboard with the user's meetings |
| Meetings | 10-14 | Lobby, video room (WebRTC), in-meeting chat with typing indicator, screen sharing, recording controls, live participant list |
| AI | 15-17 | Record a clip, upload it, see the transcript, summary and action items; post-meeting summaries dashboard |
| Collaboration | 18-20 | Kanban project board, tasks created from action items with an assignee, notification bell with live updates |
| Delivery | 22-26 | Multi-stage Docker build served by nginx, Vercel deployment, optional Sentry error tracking |

## Tech stack

React 19, TypeScript, Vite 5, Tailwind CSS, TanStack Query, Zustand, React Router 6, axios,
socket.io-client, WebRTC (browser APIs), `@sentry/react` (optional).

## Run it locally

```bash
cd client
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

Opens at http://localhost:5173. Start the backend (`server/`) first, because the client calls it directly
on port 5000.

### With Docker (whole stack)

From the project root:

```bash
docker compose up --build
```

The client is served by nginx at http://localhost:5173. See the root README for the monitoring stack.

## Environment variables

Vite reads these at **build time** and bakes them into the JavaScript, so changing one means rebuilding
(or redeploying on Vercel).

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | REST API base address |
| `VITE_SOCKET_URL` | `http://localhost:5000` | Socket.IO server address |
| `VITE_SENTRY_DSN` | (empty) | Turns Sentry on when set |
| `VITE_SENTRY_TEST` | (empty) | Set to `true` once to send a test message to Sentry, then remove it |

Never put secrets in `VITE_*` variables: everything in them ships to the browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check with `tsc -b`, then build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Routes

| Path | Page | Needs login |
|---|---|---|
| `/login`, `/signup` | Authentication | No |
| `/dashboard` | Start a meeting, list your meetings, navigation, notification bell | Yes |
| `/lobby/:roomId` | Camera and microphone check before joining | Yes |
| `/meeting/:roomId` | Video room, chat, recording, AI summary box | Yes |
| `/summaries` | Past meeting summaries, action items, "Create task" | Yes |
| `/projects` | Kanban board, members, tasks | Yes |

`/` redirects to `/dashboard`. Anyone not logged in is sent to `/login`.

## Folder structure

```
client/
├── Dockerfile               # multi-stage: build with Node, serve with nginx
├── nginx.conf               # SPA fallback, gzip, asset caching
├── vercel.json              # rewrites every path to index.html on Vercel
├── .dockerignore
├── .env.example
├── tailwind.config.js
├── tsconfig.json            # strict mode; "@/" maps to src/
├── vite.config.ts
├── package.json
└── src/
    ├── api/
    │   └── workspace.ts          # projects, tasks, summaries, recording upload
    ├── components/
    │   ├── ui/                   # button.tsx, input.tsx, card.tsx
    │   ├── meeting/              # meeting-room pieces (chat panel and others)
    │   ├── CreateTaskModal.tsx   # turn an action item into a task
    │   ├── MeetingSummaryModal.tsx
    │   ├── NotificationBell.tsx
    │   └── ProtectedRoute.tsx
    ├── hooks/
    │   ├── useMeetingAI.ts       # upload a recording, hold summary + action items
    │   └── useWebRTC.ts          # peer connections, media streams, signalling
    ├── lib/
    │   ├── api.ts                # axios instance, auto-refresh on 401
    │   ├── authHooks.ts          # useLogin / useSignup / useLogout
    │   ├── queryClient.ts
    │   └── socket.ts             # shared authenticated Socket.IO connection
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── SignupPage.tsx
    │   ├── DashboardPage.tsx
    │   ├── LobbyPage.tsx
    │   ├── MeetingRoomPage.tsx
    │   ├── PostMeetingDashboard.tsx
    │   └── ProjectBoard.tsx
    ├── store/
    │   └── authStore.ts          # Zustand: user and access token
    ├── types/                    # index.ts, workspace.ts
    ├── App.tsx                   # routes
    └── main.tsx                  # entry point, providers, optional Sentry
```

## How it works

### Authentication

1. `LoginPage` / `SignupPage` call `useLogin()` / `useSignup()`, which post to `/api/auth/login|signup`.
2. The returned user and access token go into the Zustand store.
3. The axios request interceptor in `lib/api.ts` adds `Authorization: Bearer <token>` to every call.
4. On a 401 (the access token lasts 15 minutes), the response interceptor calls `POST /api/auth/refresh`,
   which uses the httpOnly refresh cookie, stores the new token and retries the original request once.
   If refresh fails, the user is logged out.
5. `ProtectedRoute` redirects anyone without a session to `/login`.

### Video meetings

`useWebRTC` creates one peer connection per participant. Signalling goes through Socket.IO:

| Event | Direction | Purpose |
|---|---|---|
| `join-room` | client -> server | Enter a room with the user's name |
| `user-joined`, `user-left` | server -> client | Presence updates |
| `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate` | relayed | WebRTC negotiation |
| `chat-message` | both | Chat; `@name` mentions create notifications |
| `typing` | both | Typing indicator |

The recording button captures audio with `MediaRecorder` and also offers a local `.webm` download.

### AI summary and tasks

1. Stop a recording -> `useMeetingAI` posts the audio to `POST /api/meetings/room/:roomId/transcribe`.
2. The server transcribes it, writes the summary and action items, saves them and returns the result.
3. `MeetingSummaryModal` shows the summary, action items and transcript.
4. `/summaries` lists saved summaries. "Create task" opens `CreateTaskModal` (pick a project and an assignee),
   and the item shows "Task created".

### Project board

`ProjectBoard` has three columns (To do, In progress, Done) using native HTML5 drag and drop. A move updates
the screen at once and then `PATCH`es the task; if the request fails the card goes back and an error shows.
Members are added by email, and assignees must be members of the project.

### Notifications

`NotificationBell` loads `GET /api/notifications` and refreshes immediately when the server sends the
`notification:new` Socket.IO event (a 30-second poll is the fallback). Clicking a notification marks it
read and opens the related page.

## Build and deploy

- **Docker:** `Dockerfile` builds with Node 22, then copies `dist/` into `nginx:alpine`. `nginx.conf` serves
  `index.html` for unknown paths so deep links like `/meeting/123` survive a refresh.
- **Vercel:** set Root Directory to `client` and add `VITE_API_URL` / `VITE_SOCKET_URL` before the first
  deploy. `vercel.json` provides the same path fallback.
- **CORS:** the backend must list the deployed address in `CLIENT_URL`, with no trailing slash.

## Error tracking (optional)

When `VITE_SENTRY_DSN` is set, `main.tsx` starts Sentry and reports uncaught browser errors. Without it,
nothing is sent.

## Known limitations

- Video between two different networks may need a TURN relay server; same machine or same network works.
- `@mentions` match single-word names only.
- The refresh cookie is cross-site on Vercel + Render, so Incognito windows and some strict browsers
  block it and log you out on reload. Use a normal window.
- The free Render backend sleeps when idle, so the first request after a pause can take about a minute.
