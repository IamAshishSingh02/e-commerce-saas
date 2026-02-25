import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp
} from '../utils/auth.helper'
import prisma from '@packages/libs/prisma'
import { AuthError, ValidationError } from '@packages/error-handler'
import { setCookie } from '../utils/cookies/setCookie'

// Register new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, 'user')

    const { name, email } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return next(new ValidationError('User already exists with this email!'))
    }

    await checkOtpRestrictions(email)
    await trackOtpRequests(email)
    await sendOtp(name, email, 'user-activation-mail')

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify your account.'
    })

  } catch (error) {
    return next(error)
  }
}

// Verify user with OTP
export const verifyUser = async (
  req: Request,
  res: Response, 
  next: NextFunction
) => {
  try {
    const{name, email, password, otp} = req.body

    if(!name || !email || !password || !otp){
      return next(new ValidationError('All fields required'))
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if(existingUser){
      return next(new ValidationError('User already exists with this email!'))
    }

    await verifyOtp(email, otp)
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name, 
        email,
        password: hashedPassword
      }
    })

    return res.status(201).json({
      success: true,
      message: 'User registered successfully!'
    })

  } catch (error) {
    return next(error)
  }
}

// Login user
export const loginUser = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const {email, password} = req.body
    
    if(!email || !password){
      return next(new ValidationError('Email and Password are required!'))
    }

    const user = await prisma.user.findUnique({
      where: {email}
    })

    if(!user){
      return next(new AuthError(`User doesn't exists!`))
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password!)
    if(!isMatch){
      return next(new AuthError('Invalid email or password!'))
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: 'user'
      }, 
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: '15m'
      }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: 'user'
      }, 
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: '7d'
      }
    )

    // Store the tokens in httpOnly secure cookie
    setCookie(res, 'access_token', accessToken)
    setCookie(res, 'refresh_token', refreshToken)

    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    return next(error)
  }
}