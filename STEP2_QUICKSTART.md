# STEP 2 Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running locally or connection string
- `.env` file configured

## Setup

### 1. Configure Environment
```bash
# Create/update .env in project root
MONGODB_URI=mongodb://localhost:27017/ustwo
JWT_SECRET=dev_secret_key_change_in_production
NODE_ENV=development
PORT=5001
```

### 2. Install Dependencies
```bash
cd server
npm install
```

### 3. Start Server
```bash
npm run dev
# Output should show:
# ✅ Server running on http://localhost:5001
# 🔌 Connecting to MongoDB...
# ✅ Connected to MongoDB
# ✅ Auth routes registered at /api/auth
# ✅ Couples routes registered at /api/couples
# ✅ Chat routes registered at /api/chat
```

---

## Test User Flow

### Step 1: Signup User A
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Password123",
    "name": "Alice Johnson"
  }'
```

**Response:**
```json
{
  "msg": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "initials": "AJ"
  }
}
```

**Save token:**
```bash
TOKEN_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Step 2: Verify Token Works
```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN_A"
```

**Response:**
```json
{
  "msg": "User verified",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "initials": "AJ",
    "coupleId": null,
    "profileColor": "#3B82F6",
    "lastActive": "2026-04-02T12:00:00.000Z",
    "createdAt": "2026-04-02T12:00:00.000Z"
  }
}
```

---

### Step 3: Generate Invite Code
```bash
curl -X POST http://localhost:5001/api/couples/generate-invite \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "msg": "Invite code generated successfully",
  "inviteCode": "A1B2C3",
  "coupleId": "507f1f77bcf86cd799439012",
  "expiresIn": "7 days"
}
```

**Save invite code:**
```bash
INVITE_CODE="A1B2C3"
COUPLE_ID="507f1f77bcf86cd799439012"
```

---

### Step 4: Signup User B
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "Password456",
    "name": "Bob Smith"
  }'
```

**Save token:**
```bash
TOKEN_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Step 5: User B Accepts Invite
```bash
curl -X POST http://localhost:5001/api/couples/accept-invite \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{
    \"inviteCode\": \"$INVITE_CODE\"
  }"
```

**Response:**
```json
{
  "msg": "Successfully connected with partner!",
  "coupleId": "507f1f77bcf86cd799439012",
  "couple": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "connected",
    "connectedAt": "2026-04-02T12:05:00.000Z",
    "isActive": false
  }
}
```

---

### Step 6: Both Get Couple Info
```bash
# User A
curl -X GET http://localhost:5001/api/couples/my-couple \
  -H "Authorization: Bearer $TOKEN_A"

# User B
curl -X GET http://localhost:5001/api/couples/my-couple \
  -H "Authorization: Bearer $TOKEN_B"
```

**Response (both see same couple with both partners):**
```json
{
  "msg": "Couple info retrieved",
  "couple": {
    "_id": "507f1f77bcf86cd799439012",
    "user1": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "initials": "AJ",
      "profileColor": "#3B82F6"
    },
    "user2": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "initials": "BS",
      "profileColor": "#3B82F6"
    },
    "status": "connected",
    "isActive": false,
    "createdAt": "2026-04-02T12:00:00.000Z",
    "connectedAt": "2026-04-02T12:05:00.000Z"
  }
}
```

---

### Step 7: User A Sends Message
```bash
curl -X POST http://localhost:5001/api/chat/send \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d "{
    \"coupleId\": \"$COUPLE_ID\",
    \"content\": \"Hey Bob! 👋\"
  }"
```

**Response:**
```json
{
  "msg": "Message sent successfully",
  "message": {
    "_id": "507f1f77bcf86cd799439014",
    "coupleId": "507f1f77bcf86cd799439012",
    "senderId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice Johnson"
    },
    "content": "Hey Bob! 👋",
    "timestamp": "2026-04-02T12:10:00.000Z",
    "read": false
  }
}
```

---

### Step 8: User B Retrieves Chat History
```bash
curl -X GET "http://localhost:5001/api/chat/history/$COUPLE_ID" \
  -H "Authorization: Bearer $TOKEN_B"
```

**Response:**
```json
{
  "msg": "Chat history retrieved",
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "content": "Hey Bob! 👋",
      "senderId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Alice Johnson",
        "initials": "AJ",
        "profileColor": "#3B82F6"
      },
      "timestamp": "2026-04-02T12:10:00.000Z",
      "read": false
    }
  ],
  "pagination": {
    "total": 1,
    "count": 1,
    "skip": 0,
    "limit": 50
  }
}
```

---

### Step 9: Mark Messages as Read
```bash
curl -X PUT "http://localhost:5001/api/chat/mark-read/$COUPLE_ID" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "msg": "Messages marked as read",
  "modifiedCount": 1
}
```

---

### Step 10: Test Disconnection
```bash
curl -X DELETE http://localhost:5001/api/couples/disconnect \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "msg": "Successfully disconnected from partner"
}
```

**Verify disconnection:**
```bash
curl -X GET http://localhost:5001/api/couples/my-couple \
  -H "Authorization: Bearer $TOKEN_A"
```

**Response:**
```json
{
  "msg": "No couple connection found",
  "code": "NO_COUPLE"
}
```

---

## Common Errors & Solutions

### 401 No Token
```json
{
  "msg": "No token provided. Authorization required.",
  "code": "NO_TOKEN"
}
```
**Fix:** Include `Authorization: Bearer <token>` header

### 401 Token Expired
```json
{
  "msg": "Token expired. Please login again.",
  "code": "TOKEN_EXPIRED"
}
```
**Fix:** Login again to get new token

### 400 COUPLE_EXISTS
```json
{
  "msg": "You already have a partner connection",
  "code": "COUPLE_EXISTS"
}
```
**Fix:** Disconnect from current partner first

### 404 INVALID_CODE
```json
{
  "msg": "Invalid or expired invite code",
  "code": "INVALID_CODE"
}
```
**Fix:** Verify invite code is correct and not already used

---

## Debugging Tips

### Check Server Logs
```bash
# Terminal should show:
📨 POST /api/auth/signup
✅ User created successfully: alice@example.com
📨 POST /api/couples/generate-invite
✅ Invite generated: A1B2C3
```

### Check Database
```bash
# MongoDB shell
use ustwo
db.users.find()
db.couples.find()
db.messages.find()
```

### Test Token Validity
Decode JWT at https://jwt.io (paste your token to see decoded content)

### Enable Debug Logging
```javascript
// Add to server/index.js
mongoose.set('debug', true);
```

---

## Next Steps

1. Test the complete flow above
2. Verify all endpoints work
3. Check MongoDB has created documents
4. Confirm error codes match documentation
5. Ready for STEP 3: Socket.io real-time features

---

## Documentation Reference

- **Full API Reference:** [API_REFERENCE.md](API_REFERENCE.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Complete Implementation:** [STEP2_COMPLETE.md](STEP2_COMPLETE.md)
- **Summary:** [STEP2_SUMMARY.md](STEP2_SUMMARY.md)
