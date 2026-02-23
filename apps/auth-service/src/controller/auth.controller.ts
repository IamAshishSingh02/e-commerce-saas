import { Request, Response, NextFunction } from 'express'
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData
} from '../utils/auth.helper'
import prisma from '../../../../packages/libs/prisma'
import { ValidationError } from '../../../../packages/error-handler'

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