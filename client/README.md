# IntellMeet - Server

Node.js + Express API for IntellMeet, an AI-powered meeting and collaboration platform. It handles
authentication, meetings, real-time signalling (Socket.IO), AI transcription and summaries, the project
board and notifications.

**Live API health check:** https://intellmeet-ai-s2uy.onrender.com/api/health
(The free Render server sleeps when idle, so the first request can take about a minute.)

## What the server does

| Area | Days | What is implemented |
|---|---|---|
| Foundation | 1 | Express with ES modules, MongoDB (Mongoose), dotenv, CORS, Helmet, Socket.IO, folder structure |
| Authentication | 2-3 | Signup and login, JWT access tokens (15 min) plus httpOnly refresh cookie (7 days), bcrypt hashing, protected routes, rate limiting on login and signup, Cloudinary avatar upload |
| Meetings | 4-6 | Meeting model and CRUD, Redis caching, Socket.IO rooms, chat, WebRTC signalling relay |
| AI | 15-17 | Audio upload, Whisper transcription, summary and action-item extraction, saved summaries |
| Collaboration | 18-20 | Projects, members, tasks, tasks created from action items, notifications with live delivery and `@mentions` |
| Delivery | 22-26 | Multi-stage Docker image, health check, Prometheus `/metrics`, optional Sentry, Render deployment |

## Tech stack

Node 22, Express 4, Mongoose 8 (MongoDB Atlas), Socket.IO 4, ioredis, jsonwebtoken, bcryptjs, multer,
Cloudinary, helmet, express-rate-limit, OpenAI-compatible SDK (used for Groq), prom-client, `@sentry/node`.

## Run it locally

```bash
cd server
npm install --legacy-peer-deps
cp .env.example .env       # Windows: copy .env.example .env   (then fill in your own values)
npm run dev                # nodemon src/index.js
```

Listens on http://localhost:5000. If Redis is not running you will see `[Redis] not available`; the API still
works with caching switched off.

`--legacy-peer-deps` is needed because `multer-storage-cloudinary` expects Cloudinary v1 while the project
uses v2.

### With Docker

From the project root: `docker compose up --build` (adds Redis, the client and, optionally, Prometheus and
Grafana). Do not run `npm run dev` at the same time, because both use port 5000.

## Environment variables

Create `server/.env` from `.env.example`. Never commit it.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (5000) | HTTP port |
| `NODE_ENV` | no | `production` turns on secure cookies and hides error stacks |
| `CLIENT_URL` | yes | Allowed browser origin for CORS and Socket.IO. No trailing slash |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | yes | Token signing keys (use long random values) |
| `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES` | no (15m, 7d) | Token lifetimes |
| `REDIS_URL` | no | Cache; without it caching is disabled |
| `AI_PROVIDER` | no (groq) | `groq`, `openai` or `mock` (fixed fake output, no key needed) |
| `GROQ_API_KEY` | for groq | Groq API key |
| `OPENAI_API_KEY` | for openai | OpenAI API key |
| `WHISPER_LANGUAGE` | no (en) | Language hint for transcription |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for avatars | Avatar upload |
| `METRICS_TOKEN` | recommended in production | If set, `/metrics` requires `Authorization: Bearer <token>` |
| `SENTRY_DSN` | no | Turns Sentry error tracking on |
| `SENTRY_TEST` | no | Set to `true` once to send a test message, then remove it |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon (restarts on save) |
| `npm start` | Start with Node (used in Docker and on Render) |
| `node src/scripts/testSummaries.js` | AI accuracy check on three sample meetings (needs a real AI key) |

## API

All routes except signup, login, refresh, logout and health require `Authorization: Bearer <access token>`.

### Authentication (`/api/auth`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/signup`, `/login` | Create an account or log in (rate limited). Returns the user and an access token, sets the refresh cookie |
| POST | `/refresh` | New access token from the refresh cookie |
| POST | `/logout` | Clear the refresh cookie |

### Meetings (`/api/meetings`)

| Method | Path | Purpose |
|---|---|---|
| POST, GET | `/` | Create a meeting, list meetings |
| GET, PATCH, DELETE | `/:id` | Read, update or delete a meeting |
| POST | `/:id/participants` | Add a participant |
| POST | `/room/:roomId/transcribe` | Upload audio (multipart field `audio`, up to 50 MB); returns transcript, summary and action items |
| POST | `/room/:roomId/summarize` | Re-run the summary on a saved transcript |
| GET | `/summaries`, `/summaries/:id` | Your saved summaries |

### Projects and tasks (`/api`)

| Method | Path | Purpose |
|---|---|---|
| GET, POST | `/projects` | List or create projects |
| GET | `/projects/:projectId` | One project with its members |
| POST | `/projects/:projectId/members` | Add a member by email |
| GET, POST | `/projects/:projectId/tasks` | List or create tasks |
| POST | `/tasks/from-action-item` | Turn a summary action item into a task |
| PATCH, DELETE | `/tasks/:id` | Move, reassign or delete a task |

### Other

| Method | Path | Purpose |
|---|---|---|
| GET, PATCH | `/api/notifications`, `/api/notifications/:id/read` | List notifications, mark one read |
| GET, PATCH | `/api/profile` | Profile and avatar |
| GET | `/api/health` | Health check, no login needed |
| GET | `/metrics` | Prometheus metrics (token-protected when `METRICS_TOKEN` is set) |

## Folder structure

```
server/
├── Dockerfile               # multi-stage, runs as the unprivileged "node" user
├── .dockerignore
├── .env.example
├── package.json
└── src/
    ├── index.js             # app setup, middleware, routes, server start
    ├── instrument.js        # Sentry setup (only active when SENTRY_DSN is set)
    ├── metrics.js           # Prometheus metrics and /metrics handler
    ├── config/              # db.js (MongoDB), redis.js
    ├── controllers/         # auth, profile, meeting, meetingAI, workspace, notification
    ├── middleware/          # auth.js (protect), errorHandler.js, rateLimiter.js
    ├── models/              # User, Meeting, MeetingSummary, Project, Task, Notification
    ├── routes/              # authRoutes, profileRoutes, meetingRoutes, aiRoutes,
    │                        # workspaceRoutes, notificationRoutes
    ├── services/            # aiService.js, cloudinary.js, notificationService.js
    ├── sockets/             # index.js (Socket.IO auth and events)
    ├── utils/               # generateTokens.js, notify.js
    └── scripts/             # testSummaries.js
```

`aiRoutes` is mounted before `meetingRoutes` so the transcribe and summaries routes are handled by the AI
controller.

## How it works

### Authentication and security

- Passwords are hashed with bcryptjs (12 rounds).
- The access token (15 minutes) is sent in the response body. The refresh token (7 days) lives in an httpOnly
  cookie, `secure` in production and `sameSite: none` in production so the Vercel front end can use it.
- `protect` middleware verifies the access token on every private route. Socket.IO connections are verified
  the same way during the handshake.
- `authLimiter` rate-limits login and signup. `trust proxy` is on so limits see real visitor addresses behind
  Render.
- Helmet sets security headers, and CORS only allows `CLIENT_URL` with credentials.

### AI pipeline (`services/aiService.js`)

1. `transcribeAudio` sends the recording to Whisper large-v3 (Groq by default, language hint `en`, vocabulary
   prompt for days and meeting words).
2. `summarizeTranscript` asks the language model for JSON: a 2-4 sentence summary and action items with the
   assignee and the deadline *words as spoken*.
3. Dates are resolved in code (`resolveDue`), not by the model, because language models are unreliable at
   weekday arithmetic. "next Friday", "Wednesday" and "tomorrow" become real calendar dates.
4. The result is saved as a `MeetingSummary` and an `action-item` notification is created.
5. Provider errors are turned into friendly messages (for example a 429 becomes "temporarily unavailable").

`AI_PROVIDER=mock` returns fixed output, so the UI can be built and demoed without an API key.

### Real time (`sockets/index.js`)

| Event | Purpose |
|---|---|
| connection | Token check, then the socket joins its personal room `user:<id>` |
| `join-room`, `user-joined`, `user-left` | Meeting presence |
| `webrtc-offer`, `webrtc-answer`, `webrtc-ice-candidate` | WebRTC signalling relay |
| `chat-message` | Broadcast to the room; `@name` creates a notification |
| `typing` | Typing indicator |
| `notification:new` | Sent to `user:<id>` when a notification is created |

### Notifications

`notifyUser` saves a notification and emits `notification:new` to the recipient's room. Types:
`meeting-invite`, `meeting-starting`, `task-assigned`, `chat-mention`, `action-item`. A failure to save a
notification is logged and never breaks the request that caused it.

## Data models

| Model | Main fields |
|---|---|
| User | name, email, password (hashed) |
| Meeting | title, roomId, status, scheduledAt, participants |
| MeetingSummary | roomId, createdBy, transcript, summary, actionItems (text, assignee, dueDate, task) |
| Project | name, description, owner, members |
| Task | project, title, status (`todo`, `in_progress`, `done`), assignee, dueDate, sourceSummary |
| Notification | recipient, type, message, read |

## Monitoring and errors

- **Prometheus:** `/metrics` exposes `intellmeet_http_request_duration_seconds` (labelled by method, route
  pattern and status), `intellmeet_socket_connections`, `intellmeet_transcriptions_total` and the standard
  process metrics (memory, CPU, event-loop lag). Route labels are patterns such as `/:id`, never raw URLs.
- **Grafana:** a ready dashboard is in `monitoring/` at the project root.
- **Sentry:** server errors with status 500 or above are reported when `SENTRY_DSN` is set.

## Docker and deployment

- **Docker:** the first stage installs production dependencies with `npm ci --omit=dev --legacy-peer-deps`,
  the second stage is a small `node:22-alpine` image running as the `node` user, with a health check on
  `/api/health`.
- **Render:** create a Web Service from the repository with Root Directory `server` and Language Docker, set
  Health Check Path to `/api/health`, turn Auto-Deploy off, and add the environment variables above.
  MongoDB Atlas must allow Render's addresses (Network Access, `0.0.0.0/0` for a free tier).
- **CI/CD:** GitHub Actions checks the code, builds the image, and calls a Render deploy hook after a push to
  `main`.

## Testing

- `node src/scripts/testSummaries.js` runs three sample meetings through the AI and checks assignees,
  deadlines and false positives (target: 5 of 5 matched, 0 false positives).
- A JMeter load test and an OWASP ZAP scan are in `jmeter/` and `security/` at the project root.

## Known limitations

- One server instance. To run several, Socket.IO needs sticky sessions or a Redis adapter.
- Redis is optional; without it caching is simply off.
- `multer` 1.x is deprecated upstream; upgrading to 2.x is a recommended next step.
- `src/services/openaiService.js` is the original Whisper helper and is no longer used by the active code path.
- Speech recognition can mishear names in noisy audio, so action-item owners depend on audio quality.
- The free Render tier sleeps after about 15 minutes idle.
