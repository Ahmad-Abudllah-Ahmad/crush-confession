# CrushConfessions

CrushConfessions is a platform where university students can anonymously post confessions about their crushes. The platform includes features such as anonymous posting, commenting, mutual reveal functionality, and direct chat activation. Only verified users with @umt.edu.pk email addresses can access the platform.

## Requirements

### Core Features

- **Session Isolation**: Ensures that when users log in with different accounts, they only see data relevant to their own account (e.g., confessions they posted or interacted with).

- **Instagram-Style Comment Section**: Allows users to comment on any confession anonymously or with their display name. Comments support nested replies, likes, and @mentions.

- **Mutual Reveal Button**: Both the confession poster and the confession reader must click "Reveal" to disclose their identities to each other.

- **Commenting Across Confessions**: Any logged-in user can view and comment on confessions posted by other users.

- **Identity Disclosure in Chat**: When both users click "Reveal," their identities are shown in the chat interface, enabling direct communication.

## Technical Implementation

### 1. Session Isolation

Proper user session management ensures that data is filtered based on the logged-in user's ID.

```javascript
// Middleware for session isolation
const filterUserData = (req, res, next) => {
  const userId = req.user.id; // Get logged-in user's ID
  req.query.userId = userId; // Attach user ID to query for filtering
  next();
};
app.use(filterUserData);

// Example: Fetch confessions for logged-in user
app.get('/confessions', authMiddleware, async (req, res) => {
  const confessions = await Confession.findAll({
    where: { userId: req.query.userId } // Filter by logged-in user's ID
  });
  res.json(confessions);
});
```

### 2. Instagram-Style Comment Section

Comments on confessions with features like likes, nested replies, and @mentions.

**Database Schema for Comments**
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  confession_id INT REFERENCES confessions(id),
  user_id INT REFERENCES users(id),
  content TEXT NOT NULL,
  parent_comment_id INT DEFAULT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**API Endpoints for Commenting**
```javascript
// Add a comment
app.post('/comments', authMiddleware, async (req, res) => {
  const { confession_id, content, parent_comment_id } = req.body;
  const comment = await Comment.create({
    confession_id,
    user_id: req.user.id,
    content,
    parent_comment_id: parent_comment_id || null,
    likes: 0
  });
  
  // Emit real-time update to clients viewing the confession
  io.emit(`comments-${confession_id}`, comment);
  
  res.status(201).json(comment);
});

// Fetch comments for a confession
app.get('/comments/:confessionId', async (req, res) => {
  const comments = await Comment.findAll({
    where: { confession_id: req.params.confessionId },
    include: [{ model: User, attributes: ['display_name'] }] // Show display names only
  });
  res.json(comments);
});

// Like a comment
app.patch('/comments/:commentId/like', authMiddleware, async (req, res) => {
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  comment.likes += 1;
  await comment.save();

  res.json({ success: true });
});
```

### 3. Mutual Reveal Button

Both parties must press "Reveal" to disclose their identities.

**Database Schema Update for Confessions**
```sql
ALTER TABLE confessions
ADD COLUMN sender_revealed BOOLEAN DEFAULT FALSE,
ADD COLUMN receiver_revealed BOOLEAN DEFAULT FALSE,
ADD COLUMN chat_channel_id UUID;
```

**Backend Logic for Mutual Reveal**
```javascript
// Handle reveal button press by sender or receiver
app.patch('/confessions/:confessionId/reveal', authMiddleware, async (req, res) => {
  const { userId } = req.user;
  
  const confession = await Confession.findByPk(req.params.confessionId);
  
  if (!confession) return res.status(404).json({ error: 'Confession not found' });

  if (confession.sender_id === userId) {
    confession.sender_revealed = true;
  } else if (confession.receiver_id === userId) {
    confession.receiver_revealed = true;
  }

  await confession.save();

  if (confession.sender_revealed && confession.receiver_revealed) {
    // Create chat channel when both reveal identities
    const chatChannelId = uuidv4();
    confession.chat_channel_id = chatChannelId;
    await confession.save();

    io.emit(`reveal-${confession.id}`, { chatChannelId });
    return res.json({ success: true, chatChannelId });
  }

  res.json({ success: true });
});
```

### 4. Identity Disclosure in Chat

Display real identities in the chat interface after mutual reveal.

**Chat Interface Logic**
```javascript
// Fetch participants' identities after mutual reveal
app.get('/chat/:chatChannelId/participants', authMiddleware, async (req, res) => {
  const chatChannel = await ChatChannel.findByPk(req.params.chatChannelId);

  if (!chatChannel) return res.status(404).json({ error: 'Chat channel not found' });

  const participants = await User.findAll({
    where: { id: [chatChannel.sender_id, chatChannel.receiver_id] },
    attributes: ['id', 'display_name', 'email'] // Show real identities after reveal
  });

  res.json(participants);
});
```

## Final Flow Diagram

```
sequenceDiagram
    participant User1 as Sender (Poster)
    participant User2 as Receiver (Reader)
    participant Server as Backend
    
    User1->>Server: Press "Reveal"
    Server-->>User1: Waiting for mutual reveal
    
    User2->>Server: Press "Reveal"
    Server-->>Server: Check mutual reveal status
    
    alt Both revealed identities
        Server->>User1/User2: Show real names in chat interface
        Server->>Server: Activate chat channel for direct messaging
        Server-->>User1/User2: Enable direct messaging in chat UI
    else One-sided reveal only
        Server-->>User1/User2: Maintain anonymity until mutual action occurs
    end
```

## Testing Commands

**Test Session Isolation:**
```bash
curl -H "Authorization: Bearer USER1_TOKEN" http://localhost/confessions # Should show only USER1's data

curl -H "Authorization: Bearer USER2_TOKEN" http://localhost/confessions # Should show only USER2's data
```

**Test Mutual Reveal:**
```bash
curl -X PATCH -H "Authorization: Bearer SENDER_TOKEN" http://localhost/confessions/123/reveal

curl -X PATCH -H "Authorization: Bearer RECEIVER_TOKEN" http://localhost/confessions/123/reveal # Should activate chat channel after this step.
```

**Test Comments:**
```bash
curl -X POST -H "Authorization: Bearer USER_TOKEN" -d '{
   "confession_id":123,
   "content":"This is so relatable!"
}' http://localhost/comments

curl -X PATCH -H "Authorization: Bearer USER_TOKEN" http://localhost/comments/456/like # Like a comment.
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crush-confessions.git
cd crush-confessions
```

2. Run the setup script (or follow the manual installation steps):
```bash
chmod +x setup.sh
./setup.sh
```

3. Manual installation steps (if not using the setup script):
   
   a. Install dependencies:
   ```bash
   npm install
   ```
   
   b. Create a .env file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/crushconfessions?schema=public"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   EMAIL_SERVER_HOST="smtp.example.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="user@example.com"
   EMAIL_SERVER_PASSWORD="password"
   EMAIL_FROM="noreply@crushconfessions.app"
   ```
   
   c. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
   
   d. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Installing Required Packages

If you're experiencing dependency issues, make sure to install these packages:

```bash
# Core dependencies
npm install next react react-dom typescript @prisma/client next-auth bcrypt jsonwebtoken

# UI and styling
npm install tailwindcss autoprefixer postcss class-variance-authority clsx tailwind-merge

# Form handling and validation
npm install react-hook-form zod @hookform/resolvers

# Real-time communication
npm install socket.io socket.io-client

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom @types/bcrypt @types/jsonwebtoken prisma eslint eslint-config-next
```

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Real-time Communication**: Socket.io

## Project Structure

```
crush-confessions/
├── app/                 # Next.js app router files
│   ├── api/             # API endpoints
│   ├── auth/            # Authentication pages
│   ├── confessions/     # Confession pages
│   ├── chat/            # Chat interface
│   ├── profile/         # User profile
├── components/          # React components
│   ├── auth/            # Authentication components
│   ├── confessions/     # Confession components
│   ├── layout/          # Layout components
│   ├── profile/         # Profile components 
│   ├── ui/              # UI components
├── lib/                 # Utility functions
├── prisma/              # Database schema and migrations
├── public/              # Static assets
├── styles/              # Global styles
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
