import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { prisma } from '../../../../lib/prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

// Schema for validation
const signupSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .endsWith('@umt.edu.pk', 'Only @umt.edu.pk email addresses are allowed'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    console.log('Received signup request for:', body.email)
    
    const result = signupSchema.safeParse(body)
    
    if (!result.success) {
      console.error('Validation error:', result.error.format())
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.format() },
        { status: 400 }
      )
    }
    
    const { email, password } = result.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      console.log('User already exists with email:', email)
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('Password hashed successfully')
    
    // Create user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          accountStatus: 'ACTIVE', // Set to ACTIVE by default
          displayName: email.split('@')[0], // Set a default display name
        },
      })
      
      console.log('User created successfully:', user.id)
      
      return NextResponse.json(
        { 
          message: 'User registered successfully. You can now sign in.',
          userId: user.id 
        },
        { status: 201 }
      )
    } catch (createError) {
      if (createError instanceof PrismaClientKnownRequestError) {
        if (createError.code === 'P2002') {
          console.error('Unique constraint violation:', createError)
          return NextResponse.json(
            { message: 'Email already registered' },
            { status: 409 }
          )
        }
      }
      throw createError; // Re-throw for the outer catch block
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Something went wrong during registration. Please try again later.' },
      { status: 500 }
    )
  }
} 