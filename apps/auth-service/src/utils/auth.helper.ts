import crypto from 'crypto'
import { ValidationError } from '@packages/error-handler'
import redis from '@packages/libs/redis'
import { sendEmail } from './sendMail/index'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Validate registration data
export const validateRegistrationData = (
  data: any,
  userType: 'user' | 'seller'
) => {
  const { name, email, password, phone_number, country } = data

  if (
    !name?.trim() ||
    !email?.trim() ||
    !password?.trim() ||
    (userType === 'seller' && (!phone_number?.trim() || !country?.trim()))
  ) {
    throw new ValidationError('Missing required fields')
  }

  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format!')
  }
}

// Check OTP restrictions
export const checkOtpRestrictions = async (email: string) => {
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      'Account locked due to multiple failed attempts! Try again after 30 minutes'
    )
  }

  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      'Too many OTP requests! Please wait 1 hour before requesting again'
    )
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      'Please wait 1 minute before requesting a new OTP!'
    )
  }
}

// Track OTP requests
export const trackOtpRequests = async (email: string) => {
  const otpRequestKey = `otp_request_count:${email}`

  const currentValue = await redis.get(otpRequestKey)
  const otpRequests = parseInt(currentValue || '0')

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600)

    throw new ValidationError(
      'Too many OTP requests! Please wait 1 hour before requesting again'
    )
  }

  await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600)
}

// Send OTP
export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString()

  const emailSent = await sendEmail(
    email,
    'Verify your email',
    template,
    { name, otp }
  )

  if (!emailSent) {
    throw new Error('Failed to send OTP email')
  }

  await redis.set(`otp:${email}`, otp, 'EX', 5 * 60)
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60)
}