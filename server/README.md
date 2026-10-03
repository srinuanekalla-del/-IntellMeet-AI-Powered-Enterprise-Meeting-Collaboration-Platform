# IntellMeet — Server (Week 1: Core Backend & Authentication Foundation)

This is the backend built through Week 1 of the 28-day plan:

| Day | What's implemented here |
|---|---|
| 1 | Project setup, Express + MongoDB + Socket.io skeleton, `/api/health` |
| 2 | `User` model, signup/login, JWT access + refresh tokens, bcrypt hashing |
| 3 | Profile routes, Cloudinary avatar upload, `protect` middleware, rate limiting |
| 4 | `Meeting` model + CRUD routes, WebRTC signaling events over Socket.io |
| 5 | Redis client wired in for caching and future Socket.io clustering |

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

Requirements running locally (or update the URIs to point at hosted versions):
- MongoDB (`MONGO_URI`)
- Redis (`REDIS_URL`)
- A Cloudinary account (`CLOUDINARY_*`) for avatar uploads

Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`

## Folder structure

```
server/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── redis.js       # Redis client
│   ├── models/
│   │   ├── User.js
│   │   └── Meeting.js
│   ├── middleware/
│   │   ├── auth.js         # protect + requireRole
│   │   ├── rateLimiter.js  # brute-force protection on auth routes
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── profileController.js
│   │   └── meetingController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── profileRoutes.js
│   │   └── meetingRoutes.js
│   ├── services/
│   │   └── cloudinary.js
│   ├── sockets/
│   │   └── index.js        # chat + WebRTC signaling relay
│   └── index.js             # app entry point
├── .env.example
├── .gitignore
└── package.json
```

## API quick reference

**Auth** (`/api/auth`)
- `POST /signup` — `{ name, email, password }` → user + access token, sets refresh cookie
- `POST /login` — `{ email, password }` → user + access token
- `POST /refresh` — reads refresh cookie → new access token
- `POST /logout` — clears refresh cookie

**Profile** (`/api/profile`, all require `Authorization: Bearer <accessToken>`)
- `GET /me`
- `PATCH /me` — `{ name }`
- `POST /avatar` — multipart form, field `avatar`
- `POST /invite` — `{ email }` (stub for Week 3 team invites)

**Meetings** (`/api/meetings`, all require auth)
- `POST /` — `{ title, scheduledAt }`
- `GET /` — meetings you host or attend
- `GET /:id`
- `PATCH /:id` — host only
- `DELETE /:id` — host only

## Socket.io events (client → server / server → client)

- `join-room` `{ roomId, user }` → broadcasts `user-joined`
- `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` `{ to, ... }` → relayed to `to` socket id
- `chat-message` `{ roomId, message, user }` → broadcast to room
- `disconnect` → broadcasts `user-left`

## Next (Week 2)

Wire these socket events into a React client with a `RTCPeerConnection` per remote peer, and build the meeting UI (video grid, chat panel, controls).
