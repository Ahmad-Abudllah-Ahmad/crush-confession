import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

// Extend the NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    accountStatus: string
  }
  
  interface Session {
    user: {
      id: string
      accountStatus: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accountStatus: string
  }
}

// Create auth handler with simplified config
const handler = NextAuth({
  // Explicitly set the secret for JWT encryption
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode in production to help troubleshoot
  
  // Configure cookie settings for better cross-domain compatibility
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('NextAuth authorize called with credentials:', 
            credentials ? { email: credentials.email, passwordProvided: !!credentials.password } : 'no credentials')
          
          if (!credentials) {
            console.log('No credentials provided')
            return null
          }
          
          // Input validation
          const credentialsSchema = z.object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          
          const result = credentialsSchema.safeParse(credentials)
          if (!result.success) {
            console.log('Invalid credentials format:', result.error.format())
            throw new Error('Invalid credentials format')
          }
          
          const { email, password } = result.data
          console.log(`Attempting to authenticate user: ${email}`)
          
          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
          })
          
          if (!user) {
            console.log(`No user found with email: ${email}`)
            throw new Error('No user found with this email')
          }
          
          console.log(`User found: ${user.id}, account status: ${user.accountStatus}`)
          
          // Check password
          const isPasswordValid = await bcrypt.compare(password, user.password)
          
          if (!isPasswordValid) {
            console.log('Invalid password provided')
            throw new Error('Invalid password')
          }
          
          console.log('Authentication successful')
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user
          return userWithoutPassword
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accountStatus = user.accountStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id
        session.user.accountStatus = token.accountStatus
      }
      return session
    },
  },
})

// Export the handler
export { handler as GET, handler as POST } 