import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
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
import stripe from '@packages/libs/stripe'

//------------------USER---------------------------

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
    const { name, email, password, otp } = req.body

    if (!name || !email || !password || !otp) {
      return next(new ValidationError('All fields required'))
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
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
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ValidationError('Email and Password are required!'))
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return next(new AuthError(`User doesn't exists!`))
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password!)
    if (!isMatch) {
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
    setCookie(res, 'user_access_token', accessToken)
    setCookie(res, 'user_refresh_token', refreshToken)

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

// Get logged in user info
export const getUser = async (
  req: any, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const user = req.user

    res.status(201).json({
      success: true,
      user
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
export const verifyUserForgotPassword = async (
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
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return next(new ValidationError('Email and new password are required!'))
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return next(new ValidationError('User not found!'))
    }

    // Compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password!)
    if (isSamePassword) {
      return next(new ValidationError('New password cannot be same as the old password!'))
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update the user
    await prisma.user.update({
      where: { email },
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

//----------------- SELLER------------------- 

// Register a new seller
export const sellerRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, 'seller')

    const { name, email } = req.body

    const existingSeller = await prisma.seller.findUnique({
      where: {
        email
      }
    })

    if (existingSeller)
      return next(new ValidationError('Seller already exists with this email!'))

    await checkOtpRestrictions(email)
    await trackOtpRequests(email)
    await sendOtp(name, email, 'seller-activation-mail')

    return res.status(200).json({
      message: 'OTP sent to your email. Please verify your account.'
    })

  } catch (error) {
    return next(error)
  }
}

// Verify seller with OTP
export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, phone_number, country, otp } = req.body

    if (!name || !email || !password || !phone_number || !country || !otp) {
      return next(new ValidationError('All fields required'))
    }

    const existingSeller = await prisma.seller.findUnique({
      where: { email }
    })

    if (existingSeller) {
      return next(new ValidationError('Seller already exists with this email!'))
    }

    await verifyOtp(email, otp)
    const hashedPassword = await bcrypt.hash(password, 10)

    const seller = await prisma.seller.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone_number,
        country
      }
    })

    return res.status(201).json({
      seller,
      success: true,
      message: 'Seller registered successfully!'
    })

  } catch (error) {
    return next(error)
  }
}

// Create a new shop
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {name, bio, address, opening_hours, website, category, sellerId} = req.body

    if(
      !name.trim() || 
      !bio.trim() ||
      !address.trim() ||
      !sellerId ||
      !opening_hours.trim() ||
      !category
    ){
      return next(new ValidationError('All fields required!'))
    }

    const shopData: any = {
      name: name.trim(), 
      bio: bio.trim(),
      address: address.trim(),
      sellerId,
      opening_hours: opening_hours.trim(),
      category
    }

    if(website && website.trim() !== ''){
      shopData.website = website
    }

    const shop = await prisma.shop.create({
      data: shopData
    })

    res.status(201).json({
      success: true,
      shop
    })

  } catch (error) {
    return next(error)
  }
}

// Create Stripe connect link
export const createStripeConnectLink = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const {sellerId} = req.body

    if(!sellerId)
      return next(new ValidationError('Seller ID is required!'))

    const seller = await prisma.seller.findUnique({
      where: {
        id: sellerId
      }
    })

    if(!seller)
      return next(new ValidationError('Seller not available with this ID!'))

    let stripeAccountId = seller.stripeId;

    if (!stripeAccountId) {
      const stripeAccount = await stripe.accounts.create({
        type: 'express',
        email: seller.email,
        country: seller.country,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      })

      stripeAccountId = stripeAccount.id;

      await prisma.seller.update({
        where: { 
          id: sellerId 
        },
        data: { 
          stripeId: stripeAccountId 
        }
      })
    }

    const stripeAccountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`,
      type: 'account_onboarding'
    })

    res.json({
      url: stripeAccountLink.url
    })

  } catch (error) {
    return next(error)
  }
}

// Login seller
export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next(new ValidationError('Email and Password are required!'))
    }

    const seller = await prisma.seller.findUnique({
      where: { email }
    })

    if (!seller) {
      return next(new AuthError(`Seller doesn't exists!`))
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, seller.password!)
    if (!isMatch) {
      return next(new AuthError('Invalid email or password!'))
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: seller.id,
        role: 'seller'
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: '15m'
      }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        id: seller.id,
        role: 'seller'
      },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: '7d'
      }
    )

    // Store the tokens in httpOnly secure cookie
    setCookie(res, 'seller_access_token', accessToken)
    setCookie(res, 'seller_refresh_token', refreshToken)

    res.status(200).json({
      message: 'Login successful!',
      user: {
        id: seller.id,
        name: seller.name,
        email: seller.email
      }
    })

  } catch (error) {
    return next(error)
  }
}

// Get logged in seller info
export const getSeller = async (
  req: any, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const seller = req.seller

    res.status(201).json({
      success: true,
      seller
    })
  } catch (error) {
    return next(error)
  }
}

//----------------------COMMON---------------------

// Refresh token user and seller
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRefreshToken = req.cookies.user_refresh_token
    const sellerRefreshToken = req.cookies.seller_refresh_token

    const token = userRefreshToken || sellerRefreshToken

    if (!token) {
      return next(new ValidationError('Unauthorized! No refresh token.'))
    }

    const decoded = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET!
    ) as { id: string; role: 'user' | 'seller' }

    let account

    if (decoded.role === 'user') {
      account = await prisma.user.findUnique({
        where: { id: decoded.id }
      })
    }

    if (decoded.role === 'seller') {
      account = await prisma.seller.findUnique({
        where: { id: decoded.id }
      })
    }

    if (!account) {
      return next(new AuthError(`${decoded.role} not found`))
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    )

    if (decoded.role === 'user') {
      setCookie(res, 'user_access_token', newAccessToken)
    }

    if (decoded.role === 'seller') {
      setCookie(res, 'seller_access_token', newAccessToken)
    }

    return res.status(200).json({
      success: true
    })

  } catch (error) {
    return next(error)
  }
}