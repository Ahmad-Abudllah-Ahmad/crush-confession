import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Create Prisma client with logging in development
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In development, attach to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle potential connection issues in serverless environment
process.on('beforeExit', () => {
  void prisma.$disconnect()
})