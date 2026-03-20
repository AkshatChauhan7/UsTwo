const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check route (before DB connection)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Database Connection & Routes Setup Function
async function setupRoutes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    mongoose.set('strictQuery', true);

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ustwo');
    console.log("✅ Connected to MongoDB");
    
    // Drop problematic indexes from old schema if they exist
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
    
    // Load auth routes AFTER Mongoose connects
    const authRoutes = require('./routes/auth');
    const couplesRoutes = require('./routes/couples');
    const chatRoutes = require('./routes/chat');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/couples', couplesRoutes);
    app.use('/api/chat', chatRoutes);
    
    console.log('✅ Auth routes registered at /api/auth');
    console.log('✅ Couples routes registered at /api/couples');
    console.log('✅ Chat routes registered at /api/chat');
    console.log('📍 Socket.io listening for real-time events');

    // Setup Socket.io handlers
    const chatSocket = require('./sockets/chatSocket');
    chatSocket(io);

    // Register 404 handler AFTER all routes
    app.use((req, res) => {
      console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
      res.status(404).json({ msg: 'Route not found' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('🔥 Server error:', err);
      res.status(500).json({ msg: 'Server error', error: err.message });
    });

    // Start Server
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (err) => {
      console.error('🔥 Server startup error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Setup Error:", err);
    process.exit(1);
  }
}

setupRoutes();