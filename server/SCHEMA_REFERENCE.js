// Quick Reference: Database Model Relationships

/**
 * DATABASE ARCHITECTURE
 * 
 * User (1) ──────────────── (1) Couple
 *   │                          │
 *   ├─ email (unique)          ├─ user1Id (required)
 *   ├─ password (hashed)       ├─ user2Id (nullable until invited user joins)
 *   ├─ name                    ├─ inviteCode (auto-generated, 6-char hex)
 *   ├─ coupleId ──────────────>├─ status (pending | connected)
 *   ├─ profileColor            ├─ isActive
 *   ├─ lastActive             ├─ connectedAt
 *   └─ createdAt              └─ lastActivityAt
 * 
 * Couple (1) ──────────────── (1) CanvasState
 *   │                            │
 *   ├─ coupleId ──────────────>  ├─ coupleId (unique)
 *   └─ [Contains both users]     ├─ strokes[]
 *                                ├─ canvasSnapshot
 *                                ├─ lastModifiedBy
 *                                └─ updatedAt
 * 
 * Couple (1) ──────────────── (∞) Message
 *   │                            │
 *   ├─ coupleId ──────────────>  ├─ coupleId
 *   └─ [Group messages]          ├─ senderId
 *                                ├─ content
 *                                ├─ timestamp
 *                                └─ read
 * 
 */

/**
 * KEY DESIGN DECISIONS
 * 
 * 1. Couple Model as Hub
 *    - User does NOT store partner directly (no partnerId field)
 *    - coupleId links User to their partnership
 *    - Allows for flexible future features (group rooms, etc.)
 * 
 * 2. CanvasState Uniqueness
 *    - Each couple has exactly one canvas document
 *    - Strokes are array elements (scales to ~1000s of strokes)
 *    - Base64 snapshot for quick client restoration
 * 
 * 3. Invite Code Strategy
 *    - Auto-generated 6-char hex codes (16M possibilities)
 *    - Unique constraint prevents collisions
 *    - Human-friendly, no vowels to avoid inappropriate words
 * 
 * 4. Password Security
 *    - Bcryptjs hashing with 10 rounds
 *    - Never selected by default in queries
 *    - Use .select('+password') to explicitly include
 * 
 * 5. Activity Tracking
 *    - User.lastActive - helps identify inactive accounts
 *    - Couple.lastActivityAt - engagement analytics
 *    - Couple.isActive - real-time session flag for Socket.io
 * 
 */

/**
 * INDEXES FOR PERFORMANCE
 * 
 * User:
 *   - email (unique, frequently queried)
 *   - coupleId (relationship navigation)
 *   - createdAt (sorting for admin dashboards)
 * 
 * Couple:
 *   - user1Id, user2Id (finding couples by member)
 *   - inviteCode (invite acceptance)
 *   - status (filtering pending vs connected)
 *   - createdAt (sorting)
 * 
 * CanvasState:
 *   - coupleId (quick canvas lookup)
 *   - updatedAt (finding recent canvases)
 * 
 * Message (existing):
 *   - coupleId + timestamp (most important - message history queries)
 * 
 */

/**
 * QUERY PATTERNS
 * 
 * // Find user and their couple
 * User.findById(userId).populate('coupleId')
 * 
 * // Find couple with both members
 * Couple.findById(coupleId)
 *   .populate('user1Id', 'name email profileColor')
 *   .populate('user2Id', 'name email profileColor')
 * 
 * // Accept invite
 * Couple.findOne({ inviteCode: 'ABC123' })
 * 
 * // Get canvas for couple
 * CanvasState.findOne({ coupleId })
 * 
 * // Get messages (paginated)
 * Message.find({ coupleId })
 *   .sort({ timestamp: -1 })
 *   .limit(50)
 *   .lean() // performance optimization
 * 
 */

/**
 * SOCKET.IO INTEGRATION NOTES
 * 
 * On Connection:
 * 1. Get user's coupleId from JWT
 * 2. Join Socket.io room: room = coupleId.toString()
 * 3. Update Couple.isActive = true
 * 4. Emit 'partner-online' to room
 * 
 * On Drawing Stroke:
 * 1. Add stroke to CanvasState.strokes array
 * 2. Broadcast stroke via Socket.io to room
 * 3. Update CanvasState.lastModifiedBy
 * 
 * On Canvas Clear:
 * 1. Clear strokes array
 * 2. Set isCleared = true
 * 3. Broadcast 'canvas-cleared' event
 * 
 * On Disconnect:
 * 1. Update Couple.isActive = false
 * 2. Emit 'partner-offline' to room
 * 3. Save any pending canvas state
 * 
 */
