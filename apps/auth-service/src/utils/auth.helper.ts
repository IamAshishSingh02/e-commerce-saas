import crypto from 'crypto'
import { ValidationError } from '@packages/error-handler'
import redis from '@packages/libs/redis'
import { sendEmail } from './sendMail/index'
import prisma from '@packages/libs/prisma'

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

  if (otpRequests >= 5) {
    await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 60 * 60)

    throw new ValidationError(
      'Too many OTP requests! Please wait 1 hour before requesting again'
    )
  }

  await redis.set(otpRequestKey, otpRequests + 1, 'EX', 60 * 60)
}

// Send OTP
export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString()
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')

  const emailSent = await sendEmail(
    email,
    'Verify your email',
    template,
    { name, otp }
  )

  if (!emailSent) {
    throw new Error('Failed to send OTP email')
  }

  await redis.set(`otp:${email}`, hashedOtp, 'EX', 5 * 60)
  await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 1 * 60)
}

// Verify OTP
export const verifyOtp = async (
  email: string, 
  otp: string
) => {
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')
  const storedOtp = await redis.get(`otp:${email}`)

  if(!storedOtp){
    throw new ValidationError('Invalid or Expired OTP!')
  }

  const failedAttemptsKey = `otp_attempts:${email}`
  const currentValue = await redis.get(failedAttemptsKey)
  const failedAttempts = parseInt(currentValue || '0')

  if(storedOtp !== hashedOtp){
    if(failedAttempts >= 10){
      await redis.set(`otp_lock:${email}`, 'locked', 'EX', 30 * 60)
      await redis.del(`otp:${email}`, failedAttemptsKey)

      throw new ValidationError('Too many failed attempts. Your account is locked for 30 minutes!')
    }

    await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 5 * 60)
    throw new ValidationError(`Incorrect OTP. ${10 - (failedAttempts)} attempts left!`)
  }

  await redis.del(`otp:${email}`, failedAttemptsKey, `otp_request_count:${email}`, `otp_cooldown:${email}`)
}

// Handle forgot password
export const handleForgotPassword = async(
  email: string,
  userType: 'user' | 'seller'
) => {
  if (!email) {
    throw new ValidationError('Email is required!')
  }

  let user = null
  if (userType === 'user') {
    user = await prisma.user.findUnique({ where: { email } })
  }

  if (!user) {
    throw new ValidationError(`${userType} not found!`)
  }

  await checkOtpRestrictions(user.email)
  await trackOtpRequests(user.email)

  await sendOtp(user.name, user.email, 'forgot-password-user-mail')
}

// Verify forgot password OTP
export const verifyForgotPasswordOtp = async(
  email: string,
  otp: string
) => {
  if (!email || !otp) {
    throw new ValidationError('Email and OTP are required!')
  }

  await verifyOtp(email, otp)
}