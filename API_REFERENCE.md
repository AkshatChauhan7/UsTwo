# UsTwo API Reference - STEP 2

## Base URL
```
http://localhost:5001/api
```

## Authentication
All protected routes require:
```
Headers: {
  Authorization: "Bearer <JWT_TOKEN>"
}
```

---

## Auth Endpoints

### Signup
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

Returns: { msg, token, user }
Status: 201
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Returns: { msg, token, user }
Status: 200
```

### Verify Token (Protected)
```
GET /auth/me
Authorization: Bearer <token>

Returns: { msg, user }
Status: 200
```

---

## Couples Endpoints (All Protected)

### Generate Invite Code
```
POST /couples/generate-invite
Authorization: Bearer <token>

Returns: { msg, inviteCode, coupleId, expiresIn }
Status: 201
```

### Accept Invite Code
```
POST /couples/accept-invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "inviteCode": "A1B2C3"
}

Returns: { msg, coupleId, couple }
Status: 200
```

### Get My Couple Info
```
GET /couples/my-couple
Authorization: Bearer <token>

Returns: { msg, couple }
Status: 200
```

### Get Couple Info by ID
```
GET /couples/info/:coupleId
Authorization: Bearer <token>

Returns: { msg, couple }
Status: 200
```

### Disconnect from Partner
```
DELETE /couples/disconnect
Authorization: Bearer <token>

Returns: { msg }
Status: 200
```

---

## Chat Endpoints (All Protected)

### Get Chat History
```
GET /chat/history/:coupleId?limit=50&skip=0
Authorization: Bearer <token>

Returns: { msg, messages, pagination }
Status: 200
```

### Send Message
```
POST /chat/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "coupleId": "507f...",
  "content": "Hello!"
}

Returns: { msg, message }
Status: 201
```

### Mark Messages as Read
```
PUT /chat/mark-read/:coupleId
Authorization: Bearer <token>

Returns: { msg, modifiedCount }
Status: 200
```

### Get Unread Count
```
GET /chat/unread-count/:coupleId
Authorization: Bearer <token>

Returns: { msg, coupleId, unreadCount }
Status: 200
```

---

## Error Response Format

```json
{
  "msg": "Error message",
  "code": "ERROR_CODE",
  "error": "Detailed error (development only)"
}
```

### Common Error Codes

**Auth:**
- `NO_TOKEN` - Missing authorization header
- `TOKEN_EXPIRED` - Token validity expired
- `INVALID_TOKEN` - Token signature invalid
- `MISSING_FIELDS` - Required fields missing
- `WEAK_PASSWORD` - Password < 6 chars
- `USER_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong email/password
- `USER_NOT_FOUND` - User deleted or invalid

**Couples:**
- `COUPLE_EXISTS` - User already has couple
- `MISSING_INVITE_CODE` - No invite code provided
- `INVALID_CODE` - Invite code doesn't exist
- `ALREADY_CONNECTED` - Invite already used
- `SELF_INVITE` - Can't accept own invite
- `USER_ALREADY_COUPLED` - User in different couple
- `COUPLE_NOT_FOUND` - Couple doesn't exist
- `NO_COUPLE` - User has no couple

**Chat:**
- `MISSING_FIELDS` - Required fields missing
- `EMPTY_MESSAGE` - Message content empty
- `UNAUTHORIZED` - Not in couple/can't access
- `COUPLE_NOT_FOUND` - Couple doesn't exist

---

## Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST with creation)
- `400` - Bad request (validation error)
- `401` - Unauthorized (auth required/invalid)
- `403` - Forbidden (no permission)
- `404` - Not found
- `500` - Server error

---

## Example Workflow

```
1. User A Signs Up
   POST /auth/signup

2. User A Generates Invite
   POST /couples/generate-invite
   → Gets inviteCode: "ABC123"

3. User B Signs Up
   POST /auth/signup

4. User B Accepts Invite
   POST /couples/accept-invite
   Body: { inviteCode: "ABC123" }

5. Both Can Now
   GET /couples/my-couple
   POST /chat/send
   GET /chat/history/:coupleId

6. Users Can Disconnect
   DELETE /couples/disconnect
```

---

## Frontend Hook Template

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Notes

- All timestamps are ISO 8601 format
- Pagination: default limit=50, default skip=0
- Invite codes are 6-character uppercase hex
- Token expiration: 7 days
- Messages are sorted oldest → newest in responses
- Password must be minimum 6 characters
