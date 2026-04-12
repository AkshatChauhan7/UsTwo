const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  auth: {
    type: 'scheme',
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.warn('⚠️  Socket connection attempt without token');
    return next(new Error('No authentication token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    next();
  } catch (error) {
    console.error('🔥 Socket authentication error:', error.message);
    next(new Error('Invalid token'));
  }
});

// Global flag to track DB connection status
let isDBConnected = false;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} (path: ${req.path}) - Content-Type: ${req.headers['content-type']}`);
  next();
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check route (always available)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    dbConnected: isDBConnected,
    timestamp: new Date()
  });
});

// Database availability middleware for protected routes
const requireDB = (req, res, next) => {
  if (!isDBConnected) {
    return res.status(503).json({
      msg: 'Database connection pending. Please try again in a moment.',
      service: 'unavailable'
    });
  }
  next();
};

// Database Connection & Routes Setup Function
async function setupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    mongoose.set('strictQuery', true);

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ustwo');
    console.log("✅ Connected to MongoDB");
    
    isDBConnected = true;

    // Clean up old indexes if they exist
    try {
      const db = mongoose.connection.db;
      if (db && db.listCollections) {
        const collections = await db.listCollections().toArray();
        if (collections.some(c => c.name === 'users')) {
          try {
            await db.collection('users').dropIndex('username_1');
            console.log('🗑️  Dropped old username_1 index');
          } catch (e) {
            // Index doesn't exist, that's fine
          }
        }
      }
    } catch (e) {
      console.log('⚠️  Could not clean up old indexes:', e.message);
    }
    
  } catch (err) {
    console.error("❌ Database Connection Error:", err.message);
    console.error('⚠️  Server will continue but DB-dependent routes will return 503');
    isDBConnected = false;
    // Don't exit - let server continue running without DB
  }
}

// Register Routes (will be protected by requireDB middleware where needed)
function registerRoutes() {
  const authRoutes = require('./routes/auth');
  const couplesRoutes = require('./routes/couples');
  const chatRoutes = require('./routes/chat');
  const memoriesRoutes = require('./routes/memories');
  const diaryRoutes = require('./routes/diary');
  
  app.use('/api/auth', requireDB, authRoutes);
  app.use('/api/couples', requireDB, couplesRoutes);
  app.use('/api/chat', requireDB, chatRoutes);
  app.use('/api/memories', requireDB, memoriesRoutes);
  app.use('/api/diary', requireDB, diaryRoutes);
  
  console.log('✅ Auth routes registered at /api/auth');
  console.log('✅ Couples routes registered at /api/couples');
  console.log('✅ Chat routes registered at /api/chat');
  console.log('✅ Memories routes registered at /api/memories');
  console.log('✅ Diary routes registered at /api/diary');
  console.log('📍 Socket.io listening for real-time events');

  // Setup Socket.io handlers
  const chatSocket = require('./sockets/chatSocket');
  chatSocket(io);

  // Register 404 handler AFTER all routes
  app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ msg: 'Route not found' });
  });

  // Error handling middleware (must be last)
  app.use((err, req, res, next) => {
    console.error('🔥 Server error:', err);
    res.status(err.status || 500).json({
      msg: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });
}

// Start Server (BEFORE DB connection - non-blocking)
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (err) => {
  console.error('🔥 Server startup error:', err);
  process.exit(1);
});

// Register routes immediately
registerRoutes();

// Attempt database connection asynchronously (non-blocking)
setupDatabase();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📦 SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('✅ HTTP server closed');
    if (isDBConnected) {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }
    process.exit(0);
  });
});