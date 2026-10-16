# Week 3 files: wiring guide

## Server (server/src)
1. `npm i openai` (already installed if Whisper worked).
2. Copy the folders in `server/src` into your project.
3. Check these assumptions and edit if they differ:
   - `middleware/auth.js` exports `protect` and sets `req.user` (with `_id` or `id`, and `name`).
   - `models/User.js` exists with `name` and `email`.
4. In `index.js`, mount the routers. `aiRoutes` goes BEFORE your old meeting routes so it handles transcribe/summarize
   (and you can delete those two lines from `routes/meetings.js`):
   ```js
   import aiRoutes from './routes/aiRoutes.js';
   import workspaceRoutes from './routes/workspaceRoutes.js';
   app.set('io', io);                       // after you create the Socket.IO server
   app.use('/api/meetings', aiRoutes);      // before meetingRoutes
   app.use('/api/meetings', meetingRoutes);
   app.use('/api', workspaceRoutes);
   ```
5. Live notifications: on socket connection, join a per-user room (use the authenticated user id you already have):
   ```js
   io.on('connection', (socket) => { socket.join(`user:${socket.user._id}`); /* ...existing code... */ });
   ```
6. Mentions: in your chat message handler call
   `notifyMentions(io, { text, fromUser: socket.user, roomId })` (from `utils/notify.js`).
7. `.env`:
   ```
   AI_PROVIDER=groq        # groq (free, default) | mock | openai
   GROQ_API_KEY=...        # only for groq (free tier)
   OPENAI_API_KEY=...      # only for openai
   ```
   Restart the backend after editing `.env` (type `rs` in nodemon).

## Client (client/src)
1. Copy the folders in `client/src`.
2. In `api/workspace.ts`, change the first import to your existing axios instance.
3. Add routes, for example:
   `/summaries` -> `PostMeetingDashboard`, `/projects` -> `ProjectBoard`.
4. Put `<NotificationBell />` in your navbar. For instant updates add, where your socket is created:
   `socket.on('notification', () => window.dispatchEvent(new Event('app:notification')))`
5. In the meeting room, replace your recording-stop handler's upload with `uploadRecording(roomId, blob)` and feed the
   result/error into `MeetingSummaryModal` (props: open, loading, error, data, onClose).

## Test (Day 21 checkpoint)
`AI_PROVIDER=groq GROQ_API_KEY=... node src/scripts/testSummaries.js`
(mock mode returns fixed output, so the accuracy test only means something with a real provider.)

## End-to-end check
record -> modal shows summary -> /summaries lists it -> Create task (pick project + assignee) -> task appears on
/projects board -> assignee sees a bell notification -> drag the card to Done.
