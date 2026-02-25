import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp
} from '../utils/auth.helper'
import prisma from '@packages/libs/prisma'
import { ValidationError } from '@packages/error-handler'

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