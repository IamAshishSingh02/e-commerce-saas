import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyForgotPasswordOtp,
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

// Refresh token user
export const refreshToken = async(
  req: Request, 
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refresh_token

    if(!refreshToken){
      return next(new ValidationError('Unauthorized! No refresh token.'))
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as {id: string, role: string}

    if(!decoded || !decoded.id || !decoded.role){
      return next(new JsonWebTokenError('Forbidden! Invalid refresh token.'))
    }

    let account
    if(decoded.role === 'user'){
      account = await prisma.user.findUnique({
        where: {
          id: decoded.id
        }
      })
    }

    if(!account){
      return next(new AuthError(`Forbidden! ${decoded.role} not found`))
    }

    const newAccessToken = jwt.sign(
      {id: decoded.id, role: decoded.role},
      process.env.ACCESS_TOKEN_SECRET!,
      {expiresIn: '15m'}
    )

    setCookie(res, 'access_token', newAccessToken)

    return res.status(201).json({
      success: true
    })

  } catch (error) {
    return next(error)
  }
}

// User forgot password
export const forgotUserPassword = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { email } = req.body

    await handleForgotPassword(email, 'user')

    res.status(200).json({
      message: 'OTP sent to your email. Please verify your account.'
    })

  } catch (error) {
    next(error)
  }
}

// Verify the forgot password OTP
export const verifyUserForgotPassword = async(
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body

    await verifyForgotPasswordOtp(email, otp)

    res.status(200).json({
      message: 'OTP verified. You can reset your password.'
    })

  } catch (error) {
    next(error)
  }
}

// Reset user password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {email, newPassword} = req.body

    if(!email || !newPassword){
      return next(new ValidationError('Email and new password are required!'))
    }

    const user = await prisma.user.findUnique({
      where: {email}
    })

    if(!user){
      return next(new ValidationError('User not found!'))
    }

    // Compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password!)
    if(isSamePassword){
      return next(new ValidationError('New password cannot be same as the old password!'))
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user
    await prisma.user.update({
      where: {email},
      data: {
        password: hashedPassword
      }
    })

    res.status(200).json({
      message: 'Password reset successfully!'
    })

  } catch (error) {
    return next(error)
  }
}