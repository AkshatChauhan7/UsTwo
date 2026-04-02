# UsTwo - STEP 2: Authentication & Route Authorization ✅

## Overview
Successfully implemented JWT-based authentication system with protected routes. All endpoints now use secure token verification and authorization checks.

---

## 🔐 Core Authentication System

### JWT Middleware ([server/middleware/authMiddleware.js](server/middleware/authMiddleware.js))

Handles token verification for protected routes:

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ msg: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: userId, iat, exp }
    next();
  } catch (err) {
    // Handle TokenExpiredError, JsonWebTokenError, etc.
  }
};
```

**Key Features:**
- ✅ Extracts token from `Authorization: Bearer <token>` header
- ✅ Verifies signature with `JWT_SECRET`
- ✅ Sets `req.user.id` for authenticated requests
- ✅ Specific error codes: `TOKEN_EXPIRED`, `INVALID_TOKEN`, `NO_TOKEN`
- ✅ 7-day token expiration

---

## 🔑 Auth Routes ([server/routes/auth.js](server/routes/auth.js))

### 1. **POST /api/auth/signup**
Register a new user account.

```
Request:
  Body: {
    email: "alice@example.com",
    password: "securepass123",
    name: "Alice Johnson"
  }

Response (201):
  {
    msg: "User registered successfully",
    token: "eyJhbGc...",
    user: {
      id: "507f...",
      name: "Alice Johnson",
      email: "alice@example.com",
      initials: "AJ"
    }
  }
```

**Validation:**
- ✅ Email, password, name required
- ✅ Password must be ≥6 characters
- ✅ Email uniqueness enforced
- ✅ Initials auto-generated from name
- ✅ Password hashed by User schema pre-save hook

**Error Codes:**
- `400` - MISSING_FIELDS, WEAK_PASSWORD, USER_EXISTS
- `500` - Server error

---

### 2. **POST /api/auth/login**
Authenticate user and receive JWT token.

```
Request:
  Body: {
    email: "alice@example.com",
    password: "securepass123"
  }

Response (200):
  {
    msg: "Login successful",
    token: "eyJhbGc...",
    user: {
      id: "507f...",
      name: "Alice Johnson",
      email: "alice@example.com",
      initials: "AJ",
      coupleId: "507f..." (or null if not paired)
    }
  }
```

**Logic:**
- ✅ Finds user by email
- ✅ Compares password using User.matchPassword() method
- ✅ Updates user.lastActive timestamp
- ✅ Returns coupleId for state management

**Error Codes:**
- `400` - MISSING_FIELDS
- `401` - INVALID_CREDENTIALS (vague for security)
- `500` - Server error

---

### 3. **GET /api/auth/me**
Verify JWT token and get current user info.

```
Request:
  Headers: Authorization: Bearer <token>

Response (200):
  {
    msg: "User verified",
    user: {
      id: "507f...",
      name: "Alice Johnson",
      email: "alice@example.com",
      initials: "AJ",
      coupleId: null,
      profileColor: "#3B82F6",
      lastActive: "2026-04-02T10:30:00Z",
      createdAt: "2026-04-02T09:00:00Z"
    }
  }
```

**Purpose:**
- ✅ Verify token is still valid
- ✅ Get user details from database
- ✅ Check for active couple connection
- ✅ Frontend can use this to validate session on app load

**Error Codes:**
- `401` - TOKEN_EXPIRED, INVALID_TOKEN, NO_TOKEN
- `404` - USER_NOT_FOUND (shouldn't happen if token valid)
- `500` - Server error

---

## 👥 Couples Routes ([server/routes/couples.js](server/routes/couples.js))

All routes **require JWT authentication**.

### 1. **POST /api/couples/generate-invite**
Create an invite code for partner to join.

```
Request:
  Headers: Authorization: Bearer <token>

Response (201):
  {
    msg: "Invite code generated successfully",
    inviteCode: "A1B2C3",
    coupleId: "507f...",
    expiresIn: "7 days"
  }
```

**Logic:**
- ✅ User can only have one couple connection at a time
- ✅ Auto-generates 6-char hex code (via Couple schema)
- ✅ Creates couple record with user as user1Id
- ✅ Updates user.coupleId

**Error Codes:**
- `400` - COUPLE_EXISTS (user already paired)
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 2. **POST /api/couples/accept-invite**
Accept an invite code and connect with partner.

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    inviteCode: "A1B2C3"
  }

Response (200):
  {
    msg: "Successfully connected with partner!",
    coupleId: "507f...",
    couple: {
      _id: "507f...",
      status: "connected",
      connectedAt: "2026-04-02T11:00:00Z",
      isActive: false
    }
  }
```

**Logic:**
- ✅ Finds couple by invite code (case-insensitive)
- ✅ Validates code hasn't been used
- ✅ Prevents self-invites
- ✅ Checks user isn't already in a couple
- ✅ Updates couple.user2Id and status to "connected"
- ✅ Nullifies invite code after use
- ✅ Updates both users' coupleId

**Error Codes:**
- `400` - MISSING_INVITE_CODE, ALREADY_CONNECTED, SELF_INVITE, USER_ALREADY_COUPLED
- `404` - INVALID_CODE
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 3. **GET /api/couples/my-couple**
Get authenticated user's couple information.

```
Request:
  Headers: Authorization: Bearer <token>

Response (200):
  {
    msg: "Couple info retrieved",
    couple: {
      _id: "507f...",
      user1: {
        _id: "507f...",
        name: "Alice",
        email: "alice@...",
        initials: "A",
        profileColor: "#3B82F6"
      },
      user2: {
        _id: "507f...",
        name: "Bob",
        email: "bob@...",
        initials: "B",
        profileColor: "#EC4899"
      },
      status: "connected",
      isActive: true,
      createdAt: "2026-04-02T10:00:00Z",
      connectedAt: "2026-04-02T11:00:00Z"
    }
  }
```

**Error Codes:**
- `404` - NO_COUPLE
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 4. **GET /api/couples/info/:coupleId**
Get couple info by ID (requires auth).

```
Request:
  Headers: Authorization: Bearer <token>
  Params: coupleId=507f...
```

Same response as `/my-couple`.

**Error Codes:**
- `404` - COUPLE_NOT_FOUND
- `401` - UNAUTHORIZED
- `500` - Server error

---

### 5. **DELETE /api/couples/disconnect**
Disconnect from partner and break couple connection.

```
Request:
  Headers: Authorization: Bearer <token>

Response (200):
  {
    msg: "Successfully disconnected from partner"
  }
```

**Logic:**
- ✅ Finds couple containing user
- ✅ Clears coupleId from both users
- ✅ Deletes couple document

**Error Codes:**
- `404` - NO_COUPLE
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

## 💬 Chat Routes ([server/routes/chat.js](server/routes/chat.js))

All routes **require JWT authentication**.

### 1. **GET /api/chat/history/:coupleId**
Get paginated message history.

```
Request:
  Headers: Authorization: Bearer <token>
  Params: coupleId=507f...
  Query: limit=50&skip=0

Response (200):
  {
    msg: "Chat history retrieved",
    messages: [
      {
        _id: "507f...",
        content: "Hi!",
        senderId: {
          _id: "507f...",
          name: "Alice",
          initials: "A",
          profileColor: "#3B82F6"
        },
        timestamp: "2026-04-02T11:00:00Z",
        read: true
      }
    ],
    pagination: {
      total: 150,
      count: 50,
      skip: 0,
      limit: 50
    }
  }
```

**Features:**
- ✅ Verifies user is part of couple (security)
- ✅ Pagination with limit & skip
- ✅ Sorted by timestamp (newest first)
- ✅ Populates sender details
- ✅ Returns in chronological order (oldest first)

**Error Codes:**
- `403` - UNAUTHORIZED (not in couple)
- `404` - COUPLE_NOT_FOUND
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 2. **POST /api/chat/send**
Send a message (HTTP fallback for Socket.io).

```
Request:
  Headers: Authorization: Bearer <token>
  Body: {
    coupleId: "507f...",
    content: "Hello partner!"
  }

Response (201):
  {
    msg: "Message sent successfully",
    message: {
      _id: "507f...",
      coupleId: "507f...",
      senderId: {
        _id: "507f...",
        name: "Alice"
      },
      content: "Hello partner!",
      timestamp: "2026-04-02T11:00:00Z",
      read: false
    }
  }
```

**Logic:**
- ✅ Validates non-empty content
- ✅ Trims whitespace
- ✅ Verifies sender is in couple
- ✅ Saves message with timestamp
- ✅ Returns populated message

**Error Codes:**
- `400` - MISSING_FIELDS, EMPTY_MESSAGE
- `403` - UNAUTHORIZED
- `404` - COUPLE_NOT_FOUND
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 3. **PUT /api/chat/mark-read/:coupleId**
Mark all messages in couple as read.

```
Request:
  Headers: Authorization: Bearer <token>
  Params: coupleId=507f...

Response (200):
  {
    msg: "Messages marked as read",
    modifiedCount: 5
  }
```

**Logic:**
- ✅ Verifies user is in couple
- ✅ Updates all unread messages to read

**Error Codes:**
- `403` - UNAUTHORIZED
- `404` - COUPLE_NOT_FOUND
- `401` - NO_TOKEN, INVALID_TOKEN
- `500` - Server error

---

### 4. **GET /api/chat/unread-count/:coupleId**
Get count of unread messages (excludes user's own messages).

```
Request:
  Headers: Authorization: Bearer <token>
  Params: coupleId=507f...

Response (200):
  {
    msg: "Unread count retrieved",
    coupleId: "507f...",
    unreadCount: 3
  }
```

---

## 📋 Frontend Integration Pattern

```javascript
// 1. On app startup
const response = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.token}` }
});

if (response.ok) {
  // Token valid, set user state
  const { user } = await response.json();
  setUser(user);
} else {
  // Token invalid/expired, redirect to login
  localStorage.removeItem('token');
  navigate('/login');
}

// 2. After login
const { token, user } = await loginResponse.json();
localStorage.setItem('token', token);
setUser(user);

// 3. All subsequent requests
const options = {
  headers: {
    Authorization: `Bearer ${localStorage.token}`,
    'Content-Type': 'application/json'
  }
};
fetch('/api/couples/my-couple', options);
```

---

## 🔒 Security Checklist

✅ **Passwords:**
- Hashed with bcryptjs (10 rounds)
- Never logged
- Excluded from default queries

✅ **JWT Tokens:**
- 7-day expiration
- Signed with SECRET_KEY
- Bearer token in Authorization header
- Verified on every protected route

✅ **Authorization:**
- Users can only access their own data
- Users can only modify their own couple
- Messages only accessible to couple members
- Invite codes are single-use

✅ **Error Messages:**
- Generic messages for security (e.g., "Invalid credentials")
- Development mode includes full error details
- Production mode hides internal errors

---

## 🧪 Testing Commands

### Setup
```bash
# 1. Ensure .env has:
MONGODB_URI=mongodb://localhost:27017/ustwo
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5001

# 2. Start server
npm run dev
```

### Test Flow
```bash
# 1. Signup
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Password123",
    "name": "Alice Johnson"
  }'

# Response:
# {
#   "msg": "User registered successfully",
#   "token": "eyJhbGc...",
#   "user": { ... }
# }

# 2. Save token (replace YOUR_TOKEN below)
TOKEN="eyJhbGc..."

# 3. Verify auth
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Generate invite
curl -X POST http://localhost:5001/api/couples/generate-invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Response includes: inviteCode: "A1B2C3"

# 5. Login as second user (similar to signup)
# ... then accept invite with second user's token

# 6. Get couple info
curl -X GET http://localhost:5001/api/couples/my-couple \
  -H "Authorization: Bearer $TOKEN"

# 7. Send message
curl -X POST http://localhost:5001/api/chat/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coupleId": "507f...",
    "content": "Hello!"
  }'
```

---

## ✅ Verification Checklist

- [x] JWT middleware created and applied to protected routes
- [x] Auth routes: signup, login, verify
- [x] Password hashing with bcryptjs
- [x] Couples routes with JWT protection
- [x] Chat routes with authorization checks
- [x] Error handling with specific codes
- [x] User can't access other users' data
- [x] Invite code is single-use
- [x] Token expiration (7 days)
- [x] CommonJS consistency maintained
- [x] No syntax errors

---

## 🎯 Status: ✅ READY FOR STEP 3

Authentication system is rock-solid and production-ready. All routes are protected, error handling is comprehensive, and authorization is properly enforced.

**Next: Socket.io Implementation for Real-Time Chat, Canvas Sync, & Movie Player**
