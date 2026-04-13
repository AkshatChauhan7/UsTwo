# 💖 UsTwo  
### A Private Digital Sanctuary for Couples

---

## 🏁 Vision and Product Intent

UsTwo is an intimate, real-time shared space designed to bridge the emotional gap for long-distance and busy couples. Unlike generic messaging apps, UsTwo integrates conversation, synchronous entertainment, and shared memory-building into a single, cohesive ecosystem.

The product is built on the principle of **Private by Design**. It aims to move digital interaction from *transactional messaging* to *emotional co-presence*. By providing a dedicated "room" for two, UsTwo fosters relationship rituals that increase emotional intimacy across distances.

---

## 🛠 Feature Ecosystem

### 💬 Intimate Communication

- **Real-Time Messaging**  
  Powered by Socket.io for near-instant interaction.

- **Emotional Expression**  
  Includes typing indicators, emoji reactions, and read receipts to mimic in-person conversation flow.

- **Message Management**  
  Supports editing and soft-deleting messages to maintain a meaningful shared history.

---

### 🎬 Cinema Theater

- **Synchronized Playback**  
  Load any YouTube URL and watch in perfect sync.

- **Shared Control**  
  Play, pause, and seek actions mirrored in real-time.

- **Interaction Layer**  
  Reaction bubbles via WebRTC signaling and auto-volume ducking during partner speech.

---

### 🎨 Shared Canvas

- **Co-Creation**  
  A persistent real-time drawing board for art and visual notes.

- **Persistence**  
  Every stroke is saved, allowing the canvas to evolve over time.

---

### 📖 Shared Diary Book

- **Dual-Page Model**  
  "Left Page / Right Page" system with dedicated personal spaces.

- **Interactivity**  
  Draggable "ink-style" comments on each other's entries.

- **Real-Time Sync**  
  Entries update live, enabling a shared writing experience.

---

### 📸 Memory Lane

- **Relationship Archive**  
  Timeline-style gallery for photos with captions and milestone tags.

- **Interactive Timeline**  
  Immersive viewing with a heart-based reaction system.

---

### 🎮 Interactive Play & Planning

- **Games**  
  Built-in Tic-Tac-Toe for quick, playful interaction.

- **Shared Bucket List**  
  Plan future goals and track completed milestones together.

---

## 🏗 Technical Architecture

UsTwo uses a **Client-Server-Socket architecture** to ensure low-latency synchronization and data integrity.

- **Frontend**  
  React 19 + Vite for performance  
  Tailwind CSS for a warm, responsive UI

- **Backend**  
  Express 5 server with RESTful APIs

- **Real-Time Layer**  
  Socket.io for room-based communication and strict user pairing

- **Database**  
  MongoDB with optimized indexing for:
  - Messages  
  - Canvas states  
  - Relationship artifacts  

- **Authentication & Security**  
  - JWT-based authentication (7-day tokens)  
  - Bcryptjs password hashing  

---

## 🛡 Privacy and Security

- **Couple Isolation**  
  Data is strictly partitioned between paired users.

- **Single-Use Invites**  
  6-character hex codes for secure relationship pairing.

- **Encrypted Sessions**  
  Protected routes and socket middleware validate identity on every interaction.

---

## 📈 Future Roadmap (Phase C)

- **Scheduled Rituals**  
  Automated reminders for anniversaries and planned "Movie Dates"

- **Memory Map**  
  Geographic visualization of shared memories

- **Offline Reconciliation**  
  Conflict resolution for offline diary entries and canvas edits

---

## ❤️ UsTwo

Because every couple deserves a place of their own.
