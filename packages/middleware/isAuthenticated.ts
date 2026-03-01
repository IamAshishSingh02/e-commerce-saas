import { AuthError } from '@packages/error-handler'
import prisma from '@packages/libs/prisma'
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.access_token || req.headers.authorization?.split(' ')[1]

    if(!token){
      return next(new AuthError('Unauthorized! Token missing'))
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.ACCESS_TOKEN_SECRET!
    ) as {id: string, role: 'user' | 'seller'}

    if(!decoded){
      return next(new AuthError('Unauthorized! Invalid token.'))
    }

    const account = await prisma.user.findUnique({
      where: {
        id: decoded.id
      }
    })

    if(!account){
      return next(new AuthError('Account is not found!'))
    }

    req.user = account

    return next()

  } catch (error) {
    return next(error)
  }
}

export default isAuthenticated