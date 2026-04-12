# Product Requirements Document (PRD)

## Product
**UsTwo** — A private digital room for couples to chat, co-create, preserve memories, write diary pages, and watch videos together in sync.

## Document metadata
- **Version:** 1.0
- **Date:** 12 April 2026
- **Prepared from:** current repository implementation (`client + server + socket layer`)
- **Status:** Living PRD (implementation-informed)

---

## 1) Vision and product intent
UsTwo is designed to be a shared emotional space for two partners. The experience should feel intimate, playful, and real-time by default.

### Core value proposition
- **Private by design:** one room for one couple.
- **Always shared:** actions are mirrored in near real-time (chat, canvas, diary, cinema).
- **Memory-rich:** relationship artifacts persist across sessions (messages, photos, diary, canvas state, cinema state).

### Product principles
- Keep interactions simple and emotionally warm.
- Minimize setup friction between sign-up and first shared moment.
- Prioritize trust, privacy, and relationship-specific boundaries.

---

## 2) Problem statement
Long-distance or busy couples need a focused, cozy digital place that combines:
1. Conversation,
2. Creative co-presence,
3. Shared memory building,
4. Synchronous entertainment,
without switching across many apps.

---

## 3) Target users and personas
### Primary persona: Connected Couple Pair
- Age: 18–35 (not hard-gated)
- Behaviors: daily messaging, media sharing, occasional co-watching
- Needs: emotionally expressive communication, shared rituals, low-friction coordination

### Secondary persona: Relationship archivist
- Loves preserving moments and creating timelines
- Wants easy photo upload + captions + milestone tagging

### Secondary persona: Ritual planner
- Uses recurring habits: nightly chat, shared diary, movie night
- Needs synchronization and lightweight notifications

---

## 4) Goals and success metrics
### Product goals (12-month)
- Increase shared-session frequency per couple.
- Increase retention via ritual features (diary + cinema + memories).
- Reduce friction from account creation to first meaningful interaction.

### North-star metric
- **Weekly Shared Moments per Couple (WSM):** count of meaningful synchronous interactions (chat send, diary update, canvas stroke batch, cinema session start).

### Supporting KPIs
- D1/D7/D30 couple retention
- % couples who complete pairing within first 24h
- Avg session duration in dashboard
- Messages per active couple per day
- % active couples using at least 2 non-chat modules weekly
- Error rate: auth failures, socket reconnection failures, upload failures

---

## 5) Current scope (as implemented)
This section reflects code currently in repo.

### 5.1 Authentication and session
**Implemented**
- Sign up/login with JWT (7-day token)
- Password hashing (`bcryptjs`)
- Protected frontend route (`/dashboard`)
- Token persisted in `localStorage`
- Auth middleware for protected API endpoints

### 5.2 Couple lifecycle
**Implemented**
- Generate invite code
- Accept invite code
- Fetch own couple info
- Disconnect partner relationship
- Authorization checks to enforce couple membership

### 5.3 Chat
**Implemented**
- REST history retrieval (pagination)
- Real-time send/receive via Socket.io
- Typing indicators
- Read receipts (REST + socket events)
- Reactions (emoji)
- Message edit (owner only)
- Message soft delete (owner only)

### 5.4 Shared Canvas
**Implemented**
- Real-time collaborative drawing
- Stroke persistence in DB
- Undo / redo / clear events
- Initial canvas state request on entry

### 5.5 Memory Lane
**Implemented**
- Upload memory image (`multer`, local disk)
- Caption + date + milestone flag
- Heart counter
- Delete one memory / clear all memories for couple
- Timeline-style UI with immersive photo view

### 5.6 Diary Book
**Implemented**
- Daily two-page entry model (left/right per partner side)
- Side-restricted editing (user edits own side)
- Ink-style comments on partner page
- Drag/move comments with z-index updates
- Real-time sync + REST fallback

### 5.7 Cinema Theater
**Implemented (v2 path active in UI)**
- Shared YouTube URL loading
- Countdown before playback
- Play/pause synchronization
- Seek synchronization
- Clear current video for both
- Overlay mini chat in theater
- Reaction bubbles via WebRTC signaling relay
- Auto volume ducking when partner speaking

### 5.8 Presence and room behavior
**Implemented**
- Join/leave couple room
- Partner online/offline events
- Couple active-state updates from socket room occupancy

---

## 6) Functional requirements
### FR-1 Account and authentication
- User can create account with name, email, password.
- User can log in and receive JWT.
- Protected routes require valid token.
- Expired/invalid token returns structured 401 error.

### FR-2 Couple pairing
- User can generate invite code.
- Another user can accept invite code to connect.
- A user cannot connect to multiple couples simultaneously.
- User can disconnect, clearing relationship linkage.

### FR-3 Messaging core
- Couple members can send and receive messages in real-time.
- Message history loads oldest → newest in UI.
- Typing state is propagated in near real-time.
- Read status can be updated per couple.

### FR-4 Message enrichment
- Reactions are toggle/update per user per message.
- Sender can edit own message if not deleted.
- Sender can soft-delete own message.

### FR-5 Shared canvas
- Couple members can draw strokes that appear for both users.
- Canvas state persists and reloads when reopened.
- Undo/redo and clear actions sync to both users.

### FR-6 Memory lane
- Couple members can add photo memories with metadata.
- Stored memories are queryable by couple and date.
- Users can heart a memory.
- Authorized users can delete one/all memories.

### FR-7 Shared diary
- Diary entry exists per couple per day.
- Each partner edits only assigned side (left/right).
- Users can add/move comments on pages.
- Diary updates synchronize in real-time.

### FR-8 Cinema sync
- Couple can load/replace a YouTube URL.
- Playback state (play/pause/time) synchronizes.
- Manual seek synchronizes to partner.
- Optional live reaction bubbles support camera/mic stream exchange.

### FR-9 Security and authorization
- Every protected API validates JWT.
- Feature access requires couple membership checks.
- Socket actions should enforce same membership checks before mutate/broadcast.

---

## 7) Non-functional requirements
### NFR-1 Performance
- P95 API response for core endpoints < 500ms (excluding upload).
- Real-time event propagation target < 300ms median in normal network conditions.
- Initial dashboard interactive render target < 2.5s on broadband.

### NFR-2 Reliability
- Server should boot even if DB unavailable and expose health endpoint.
- DB-dependent routes should return `503` until DB ready.
- Socket reconnect should auto-attempt with bounded retries.

### NFR-3 Security
- Passwords must be hashed.
- JWT secret must come from environment in production.
- Inputs validated for required fields and ownership checks.
- Uploaded files limited by type and size.

### NFR-4 Privacy
- Couple data isolation is mandatory.
- No cross-couple data retrieval.
- Logs should avoid sensitive plaintext content in production.

### NFR-5 Maintainability
- Clear route/model boundaries.
- Shared response error format with stable `code` values.
- Living API and schema documentation kept in-repo.

---

## 8) UX requirements
- Single protected dashboard with clear module tabs (`Chat`, `Canvas`, `Memories`, `Cinema`) and floating `Diary` affordance.
- Emotional visual design (cozy gradients, romantic iconography) retained while preserving readability.
- Minimal steps from login to interaction.
- Feature alerts for asynchronous partner activity (cinema invite, diary note).

---

## 9) Out-of-scope (for current baseline)
- Group/multi-user rooms (more than two members)
- Native mobile apps
- End-to-end encrypted message storage
- Payment/subscription features
- AI-generated content or moderation pipeline

---

## 10) Risks and known gaps
1. **Inconsistent invite code length in docs/UI hints**
   - Some docs mention 6 chars; UI placeholder suggests 8 chars. Backend generation currently uses 6 hex chars from `crypto.randomBytes(3)`.
2. **Socket auth secret fallback**
   - Socket auth has fallback secret string in server setup; production should enforce env-only secret.
3. **WebRTC support variability**
   - Reaction bubbles depend on camera/mic permissions and network/NAT conditions.
4. **No automated test suite currently configured**
   - Frontend has lint/build scripts; backend `test` script is placeholder.
5. **Storage strategy**
   - Memories upload to local disk path, which may need cloud object storage for scale.

---

## 11) Roadmap proposal
### Phase A — Stabilization (short-term)
- Add automated tests for auth, couple access control, and socket authorization paths.
- Standardize invite code format across backend, docs, and UI.
- Add robust error surfaces in frontend for upload/socket/cinema sync failures.

### Phase B — Trust and reliability (mid-term)
- Add refresh-token/session hardening.
- Add rate limits for auth/invite endpoints.
- Add observability dashboard (errors, latency, socket room health).

### Phase C — Product growth (mid/long-term)
- Shared rituals: reminders, anniversary milestones, scheduled movie dates.
- Memory lane search/filtering.
- Diary history browse with calendar map.
- Better synchronization conflict handling and offline reconciliation.

---

## 12) Release acceptance criteria (baseline)
A release is acceptable when:
1. Couple can sign up, pair, and access dashboard.
2. Chat send/receive works in real-time with persisted history.
3. Canvas collaboration works with persisted strokes.
4. Memory creation (including upload) and retrieval works.
5. Diary left/right editing and comment movement sync works.
6. Cinema URL load and playback sync works between partners.
7. Authorization prevents cross-couple access in API + socket mutations.
8. Health endpoint reflects DB connectivity status.

---

## 13) Technical stack snapshot
- **Frontend:** React 19, Vite, React Router, Axios, Framer Motion, Socket.io Client, simple-peer
- **Backend:** Express 5, Mongoose, JWT, bcryptjs, Socket.io, multer
- **Database:** MongoDB
- **Transport:** REST + WebSocket (Socket.io)

---

## 14) Open decisions
- Should invite codes expire on a strict timestamp instead of implicit pending status?
- Should message deletion preserve old content in audit trails (admin-only) or hard-remove content?
- Should cinema state use one single source (current dual `CinemaState` and `Couple` cinema fields can be unified)?
- Should media uploads move to S3-compatible storage for deployability?

---

## 15) Summary
UsTwo is already beyond a basic chat MVP: it includes a meaningful multi-module couple experience with real-time synchronization across chat, canvas, diary, and cinema plus memory persistence. The next product phase should focus on reliability, test coverage, and production-hardening while preserving the emotionally warm UX that differentiates the product.
