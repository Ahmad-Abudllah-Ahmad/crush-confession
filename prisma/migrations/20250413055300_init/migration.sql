-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT,
    "profilePicture" TEXT,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountStatus" TEXT NOT NULL DEFAULT 'PENDING'
);

-- CreateTable
CREATE TABLE "confessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "content" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "imageUrl" TEXT,
    CONSTRAINT "confessions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "confessions_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "startTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "conversations_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "conversations_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "playlistName" TEXT NOT NULL,
    "playlistDescription" TEXT,
    "playlistUrl" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    CONSTRAINT "playlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "confessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "likes_confessionId_fkey" FOREIGN KEY ("confessionId") REFERENCES "confessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "confessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_confessionId_fkey" FOREIGN KEY ("confessionId") REFERENCES "confessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_userId_confessionId_key" ON "likes"("userId", "confessionId");
