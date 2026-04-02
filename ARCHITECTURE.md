# UsTwo Architecture - After STEP 2

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│  ┌──────────────┬──────────────┬──────────────┐              │
│  │   Auth UI    │  Chat UI     │  Canvas UI   │              │
│  │  (Login)     │  (Messages)  │  (Drawing)   │              │
│  └──────────────┴──────────────┴──────────────┘              │
│                          ↓                                    │
│              axios + Bearer Token Auth                        │
│                          ↓                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Express.js Backend                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          HTTP Routes (REST API)                      │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌────────────────────────────┐   │   │
│  │  │ /auth       │  │ Protected Routes (JWT)     │   │   │
│  │  │ • signup    │  │ ├─ /couples                │   │   │
│  │  │ • login     │  │ ├─ /chat                   │   │   │
│  │  │ • me        │  │ └─ /socket (coming)        │   │   │
│  │  └─────────────┘  └────────────────────────────┘   │   │
│  │                     ↓                               │   │
│  │              authMiddleware                         │   │
│  │         (Verify JWT Token)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Mongoose Models                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │  User    │  │  Couple  │  │  CanvasState     │  │   │
│  │  ├──────────┤  ├──────────┤  ├──────────────────┤  │   │
│  │  │email     │  │user1Id   │  │coupleId          │  │   │
│  │  │password  │  │user2Id   │  │strokes[]         │  │   │
│  │  │name      │  │status    │  │lastModifiedBy    │  │   │
│  │  │coupleId  │  │isActive  │  │updatedAt         │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────┐                           │   │
│  │  │  Message             │                           │   │
│  │  ├──────────────────────┤                           │   │
│  │  │coupleId              │                           │   │
│  │  │senderId              │                           │   │
│  │  │content               │                           │   │
│  │  │timestamp             │                           │   │
│  │  │read                  │                           │   │
│  │  └──────────────────────┘                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              MongoDB (Database)                              │
│                                                              │
│  Collections:                                                │
│  • users       (15 fields, indexed on email/coupleId)       │
│  • couples     (6 fields, indexed on user IDs/code)         │
│  • messages    (5 fields, indexed on coupleId+timestamp)    │
│  • canvasstates (7 fields, indexed on coupleId)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 2 Auth Flow

```
User Signup/Login
    ↓
    ├─ Validate email, password, name
    ├─ Check email not already registered (signup)
    ├─ Hash password with bcryptjs
    ├─ Create User in MongoDB
    ├─ Generate JWT token (7-day expiration)
    ├─ Return token + user info
    ↓
Client Storage
    ├─ localStorage.setItem('token', token)
    ├─ setUser(userData)
    ↓
Authenticated Requests
    ├─ axios.get(url, {
    │    headers: { Authorization: 'Bearer ' + token }
    │  })
    ├─ Server receives request
    ├─ authMiddleware extracts token from header
    ├─ Verifies JWT signature
    ├─ Sets req.user.id
    ├─ Route handler executes with known user ID
    ↓
Response
    └─ Return data / error
```

---

## Data Relationships

```
User (1) ──┐
           │
           ├──── Couple (1) ──┐
           │                  │
User (1) ──┘                  ├──── CanvasState (1)
                              │
                              ├──── Message (∞)
                              │
                              ├──── Socket.io Room
                              │     (real-time sync)
                              └─────────────────
```

**One Couple = Two Users + One Canvas + Message History + Real-time Room**

---

## Request Lifecycle

```
┌─ Incoming Request ─────────────────────────────────┐
│                                                     │
│  POST /api/couples/generate-invite                 │
│  Headers: Authorization: Bearer <token>            │
│  Body: { ... }                                      │
│                                                     │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─ Middleware Stack ────────────────────────────────┐
│                                                    │
│  1. express.json() - Parse body                   │
│  2. logging middleware - Log request              │
│  3. CORS middleware - Handle cross-origin         │
│  4. requireDB middleware - Check MongoDB ready    │
│  5. authMiddleware - Verify JWT token             │
│                                                    │
└─────────────────┬────────────────────────────────┘
                  ↓
┌─ Route Handler ───────────────────────────────────┐
│                                                    │
│  router.post('/generate-invite',                  │
│    authMiddleware,  ← JWT verified               │
│    async (req, res) => {                          │
│      const userId = req.user.id;  ← From JWT    │
│      // Validate, authorize, execute               │
│    }                                               │
│  );                                                │
│                                                    │
└─────────────────┬────────────────────────────────┘
                  ↓
┌─ Database Operations ─────────────────────────────┐
│                                                    │
│  • Query existing couples                          │
│  • Create new Couple document                      │
│  • Update User document                            │
│  • Return results                                  │
│                                                    │
└─────────────────┬────────────────────────────────┘
                  ↓
┌─ Response ────────────────────────────────────────┐
│                                                    │
│  201 Created                                       │
│  {                                                 │
│    msg: "Invite code generated successfully",    │
│    inviteCode: "ABC123",                          │
│    coupleId: "507f...",                           │
│    expiresIn: "7 days"                            │
│  }                                                 │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Protected Route Pattern

```javascript
// Before STEP 2: No protection
router.get('/my-couple/:userId', async (req, res) => {
  const userId = req.params.userId; // ❌ Client controls
  // Any user can request any other user's couple
});

// After STEP 2: JWT Protected
router.get('/my-couple', authMiddleware, async (req, res) => {
  const userId = req.user.id; // ✅ From verified JWT
  // Only authenticated user can get their own couple
  
  const couple = await Couple.findOne({
    $or: [{ user1Id: userId }, { user2Id: userId }]
  });
  // User can only see their own couple
});
```

---

## Error Handling Pattern

```javascript
// Validation
if (!inviteCode) {
  return res.status(400).json({
    msg: 'Invite code is required',
    code: 'MISSING_INVITE_CODE'
  });
}

// Authorization
if (couple.user1Id.toString() !== req.user.id &&
    couple.user2Id.toString() !== req.user.id) {
  return res.status(403).json({
    msg: 'You are not authorized to access this chat',
    code: 'UNAUTHORIZED'
  });
}

// Not Found
if (!couple) {
  return res.status(404).json({
    msg: 'Couple not found',
    code: 'COUPLE_NOT_FOUND'
  });
}

// Server Error
catch (error) {
  return res.status(500).json({
    msg: 'Error sending message',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

---

## File Structure After STEP 2

```
server/
├── index.js                    (Non-blocking startup)
├── middleware/
│   └── authMiddleware.js       ✨ JWT verification
├── models/
│   ├── User.js                 (Password hashing)
│   ├── Couple.js               (Invite code generation)
│   ├── Message.js
│   └── CanvasState.js
├── routes/
│   ├── auth.js                 (signup, login, verify)
│   ├── couples.js              (All JWT protected)
│   ├── chat.js                 (All JWT protected)
│   └── [socket.js]             (Coming in STEP 3)
└── sockets/
    └── [chatSocket.js]         (Coming in STEP 3)

.env                            (Required)
DATABASE_SCHEMA.md
API_REFERENCE.md
STEP1_COMPLETE.md
STEP2_COMPLETE.md
STEP2_SUMMARY.md
```

---

## Environment Variables Required

```bash
# .env (in root directory)
MONGODB_URI=mongodb://localhost:27017/ustwo
JWT_SECRET=your_secret_key_here_change_in_production
NODE_ENV=development
PORT=5001
```

**Never commit `.env` to git!**

---

## Testing Priorities (STEP 2)

1. ✅ Signup creates user with hashed password
2. ✅ Login returns JWT token
3. ✅ Verify token works on `/auth/me`
4. ✅ Invalid token returns 401
5. ✅ Routes require JWT (return 401 without)
6. ✅ User can generate invite
7. ✅ User can accept invite (single use)
8. ✅ Users can see their couple
9. ✅ Unauthorized users get 403
10. ✅ Messages can be sent & retrieved

---

## Summary

**STEP 2 adds:**
- ✅ JWT authentication system
- ✅ Secure password hashing
- ✅ Protected routes with authorization
- ✅ Error handling with codes
- ✅ User identity from tokens (not requests)

**Result:** Backend is now production-ready for user-facing features.

**Next:** Socket.io for real-time features (STEP 3)
