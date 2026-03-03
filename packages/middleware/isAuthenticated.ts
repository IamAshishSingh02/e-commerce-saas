import { AuthError } from '@packages/error-handler'
import prisma from '@packages/libs/prisma'
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const isAuthenticated = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies.user_access_token ||
      req.cookies.seller_access_token ||
      req.headers.authorization?.split(' ')[1]

    if (!token) {
      return next(new AuthError('Unauthorized! Token missing'))
    }

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as { id: string; role: 'user' | 'seller' }

    if (!decoded) {
      return next(new AuthError('Unauthorized! Invalid token'))
    }

    if (decoded.role === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (!user) {
        return next(new AuthError('User not found'))
      }

      req.user = user
      return next()
    }

    if (decoded.role === 'seller') {
      const seller = await prisma.seller.findUnique({
        where: { id: decoded.id }
      })

      if (!seller) {
        return next(new AuthError('Seller not found'))
      }

      req.seller = seller
      return next()
    }

    return next(new AuthError('Invalid role'))
  } catch (error) {
    return next(error)
  }
}

export default isAuthenticated