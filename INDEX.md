# UsTwo Project - Complete Documentation Index

## 📚 Project Overview

UsTwo is a private digital room for couples with real-time chat, shared drawing canvas, and synchronized video playback.

**Tech Stack:** React 19 (Vite) · Express 5 · MongoDB (Mongoose) · Socket.io

---

## 🗺️ Documentation Roadmap

### Phase 1: Database & Schema ✅
- **Status:** Complete
- **Main Doc:** [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **Implementation:** [STEP1_COMPLETE.md](STEP1_COMPLETE.md)
- **What:** Database models, indexing, server resilience

### Phase 2: Authentication & Authorization ✅
- **Status:** Complete  
- **Main Docs:** 
  - [STEP2_COMPLETE.md](STEP2_COMPLETE.md) - Full details
  - [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) - Test guide
  - [README_STEP2.md](README_STEP2.md) - Overview
- **Reference:** [API_REFERENCE.md](API_REFERENCE.md)
- **What:** JWT auth, protected routes, error handling

### Phase 3: Real-Time Features 🚀 (Coming)
- **Planned:** Socket.io, Canvas sync, Video sync
- **Components:** Chat room, Drawing canvas, Movie player

---

## 📖 Quick Reference by Task

### I want to...

#### Understand the System
→ [ARCHITECTURE.md](ARCHITECTURE.md) - Visual diagrams and data flow

#### Test the API
→ [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) - Copy-paste curl commands

#### See All Endpoints
→ [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation

#### Check Database Schema
→ [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Models and relationships

#### Integrate with Frontend
→ [STEP2_COMPLETE.md](STEP2_COMPLETE.md#-frontend-integration-pattern) - Code examples

#### Understand What Changed
→ [STEP2_SUMMARY.md](STEP2_SUMMARY.md) - Summary of modifications

#### Set Up Development Environment
→ [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md#setup) - Installation steps

---

## 📋 Phase 1: Database & Schema

**Files:** 4 Mongoose models created/refined

### Models
1. **User.js** - User accounts with password hashing
2. **Couple.js** - Partnership relationships  
3. **Message.js** - Chat message storage
4. **CanvasState.js** - Drawing persistence

### Key Features
✅ Email validation & uniqueness
✅ Password hashing (bcryptjs)
✅ Invite code generation
✅ Comprehensive indexing
✅ Activity tracking

### Documentation
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete schema details
- [STEP1_COMPLETE.md](STEP1_COMPLETE.md) - Implementation guide
- [server/SCHEMA_REFERENCE.js](server/SCHEMA_REFERENCE.js) - Code comments

---

## 🔐 Phase 2: Authentication & Authorization

**Files:** 1 middleware created, 3 routes updated

### Components
1. **authMiddleware.js** - JWT verification
2. **auth.js** - Signup, login, verify endpoints
3. **couples.js** - Partnership management (JWT protected)
4. **chat.js** - Messaging endpoints (JWT protected)

### Endpoints (12 total)

#### Auth (3 endpoints)
```
POST   /api/auth/signup        - Register user
POST   /api/auth/login         - Get JWT token
GET    /api/auth/me            - Verify token
```

#### Couples (5 endpoints, all protected)
```
POST   /api/couples/generate-invite    - Create invite
POST   /api/couples/accept-invite      - Connect partners
GET    /api/couples/my-couple          - Get partnership
GET    /api/couples/info/:coupleId     - Get by ID
DELETE /api/couples/disconnect         - Break connection
```

#### Chat (4 endpoints, all protected)
```
GET    /api/chat/history/:coupleId     - Message history
POST   /api/chat/send                  - Send message
PUT    /api/chat/mark-read/:coupleId   - Mark read
GET    /api/chat/unread-count/:id      - Unread count
```

### Documentation
- [STEP2_COMPLETE.md](STEP2_COMPLETE.md) - Full implementation
- [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) - Testing guide
- [API_REFERENCE.md](API_REFERENCE.md) - Endpoint reference
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [README_STEP2.md](README_STEP2.md) - Quick overview
- [STEP2_SUMMARY.md](STEP2_SUMMARY.md) - Changes summary
- [STEP2_DELIVERY.md](STEP2_DELIVERY.md) - Completion report

---

## 🗂️ File Structure

```
UsTwo/
├── server/
│   ├── index.js                       (Express app setup)
│   ├── middleware/
│   │   └── authMiddleware.js          (JWT verification)
│   ├── models/
│   │   ├── User.js                    (User accounts)
│   │   ├── Couple.js                  (Partnerships)
│   │   ├── Message.js                 (Chat messages)
│   │   └── CanvasState.js             (Drawing data)
│   ├── routes/
│   │   ├── auth.js                    (Auth endpoints)
│   │   ├── couples.js                 (Couple endpoints)
│   │   ├── chat.js                    (Chat endpoints)
│   │   └── [socket.js]                (STEP 3: coming)
│   ├── sockets/
│   │   └── [handlers]                 (STEP 3: coming)
│   ├── SCHEMA_REFERENCE.js            (Model documentation)
│   └── package.json
│
├── src/                               (React frontend)
├── public/
├── .env                               (Configuration)
├── package.json
│
└── Documentation/
    ├── DATABASE_SCHEMA.md             (STEP 1: Models)
    ├── STEP1_COMPLETE.md              (STEP 1: Completion)
    ├── STEP2_COMPLETE.md              (STEP 2: Full docs)
    ├── STEP2_QUICKSTART.md            (STEP 2: Test guide)
    ├── STEP2_SUMMARY.md               (STEP 2: Summary)
    ├── STEP2_DELIVERY.md              (STEP 2: Report)
    ├── README_STEP2.md                (STEP 2: Overview)
    ├── API_REFERENCE.md               (All endpoints)
    ├── ARCHITECTURE.md                (System design)
    └── [This file]                    (Documentation index)
```

---

## 🚀 How to Start

### 1. First Time Setup
```bash
# Install dependencies
cd server && npm install

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/ustwo
JWT_SECRET=dev_secret_key
NODE_ENV=development
PORT=5001" > ../.env

# Start server
npm run dev
```

### 2. Test the System
Follow [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) - 10-minute complete test flow

### 3. Understand Architecture
Read [ARCHITECTURE.md](ARCHITECTURE.md) - System overview with diagrams

### 4. Check API Documentation
Reference [API_REFERENCE.md](API_REFERENCE.md) - All 12 endpoints with examples

---

## 🔐 Security Features

✅ **Password Security**
- Bcryptjs hashing (10 rounds)
- Never logged or exposed

✅ **JWT Authentication**
- 7-day token expiration
- Bearer token in Authorization header
- Verified on every protected request

✅ **Authorization Checks**
- Users can only access their own data
- Users must be in couple to access chat
- Invite codes are single-use

✅ **Error Handling**
- Generic messages (prevent user enumeration)
- Specific error codes for frontend
- Development mode includes full details

---

## 📊 Progress Tracking

```
STEP 1: Database & Schema       ✅ COMPLETE
STEP 2: Authentication          ✅ COMPLETE
STEP 3: Real-Time Features      🚀 IN PLANNING
```

### STEP 1 Deliverables
- ✅ User model with hashing
- ✅ Couple model with invite codes
- ✅ Message model with indexing
- ✅ CanvasState model for drawing
- ✅ Non-blocking server startup
- ✅ Database resilience

### STEP 2 Deliverables
- ✅ JWT authentication system
- ✅ Auth routes (signup, login, verify)
- ✅ Protected routes with authMiddleware
- ✅ Couples endpoints (invite flow)
- ✅ Chat endpoints (messaging)
- ✅ Comprehensive error handling
- ✅ Complete documentation

### STEP 3 Planning (Next)
- 🚀 Socket.io real-time chat
- 🚀 Live drawing canvas sync
- 🚀 Synchronized movie player
- 🚀 Online/offline status
- 🚀 Typing indicators
- 🚀 Connection management

---

## 💡 Common Tasks

### Testing
See [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) for curl commands

### Frontend Integration
See [STEP2_COMPLETE.md](STEP2_COMPLETE.md#-frontend-integration-pattern)

### Understanding Error Codes
See [API_REFERENCE.md](API_REFERENCE.md#error-response-format)

### Checking Database Queries
See [server/SCHEMA_REFERENCE.js](server/SCHEMA_REFERENCE.js#query-patterns)

### Modifying API
See [ARCHITECTURE.md](ARCHITECTURE.md#request-lifecycle) for patterns

---

## 🔗 External Resources

### Required Environment Setup
- Node.js 18+ 
- MongoDB 5.0+
- Terminal with curl (for testing)

### Tech Documentation
- [Express.js Docs](https://expressjs.com)
- [Mongoose Docs](https://mongoosejs.com)
- [JWT.io](https://jwt.io)
- [Bcryptjs Docs](https://github.com/dcodeIO/bcrypt.js)

---

## ❓ FAQ

### Where do I start?
1. Read [README_STEP2.md](README_STEP2.md) for overview
2. Follow [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) for testing
3. Reference [API_REFERENCE.md](API_REFERENCE.md) for details

### How do I understand the architecture?
→ [ARCHITECTURE.md](ARCHITECTURE.md) with diagrams

### How do I test the API?
→ [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md) with curl examples

### How do I integrate with React?
→ [STEP2_COMPLETE.md](STEP2_COMPLETE.md#-frontend-integration-pattern)

### What if a test fails?
→ [STEP2_QUICKSTART.md](STEP2_QUICKSTART.md#common-errors--solutions)

---

## 📞 Support Resources

**Troubleshooting:**
- [Common Errors & Solutions](STEP2_QUICKSTART.md#common-errors--solutions)
- [Debugging Tips](STEP2_QUICKSTART.md#debugging-tips)

**References:**
- [Complete API](API_REFERENCE.md)
- [Database Models](DATABASE_SCHEMA.md)
- [System Architecture](ARCHITECTURE.md)

---

## 📝 Notes

- All code uses CommonJS (require) in backend for consistency
- Frontend uses ESM (import)
- Environment variables required: see `.env.example`
- Database indexes optimized for queries
- Security-first error handling implemented

---

## 🎯 Next Steps

Ready to proceed to STEP 3?

**Prerequisites:**
- ✅ STEP 1 completed (Database)
- ✅ STEP 2 completed (Authentication)
- ✅ All 12 endpoints tested
- ✅ Database with sample data

**STEP 3 Will Include:**
- Socket.io connection management
- Real-time message broadcasting
- Canvas drawing synchronization
- Video player synchronization

---

## 📄 Document Legend

| Icon | Meaning |
|------|---------|
| ✅ | Completed |
| 🚀 | In progress/Planning |
| 📖 | Full documentation |
| 📋 | Quick reference |
| 🧪 | Testing guide |
| 📊 | Technical details |

---

**Last Updated:** April 2, 2026
**Status:** STEP 2 Complete ✅
**Next:** STEP 3 - Real-Time Features 🚀

For questions or issues, reference the appropriate documentation file above.
