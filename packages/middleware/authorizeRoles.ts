import { AuthError } from '@packages/error-handler'
import { Response, NextFunction } from 'express'

export const isSeller = (req:any, res: Response, next: NextFunction) => {
  if(req.role !== 'seller')
    return next(new AuthError('Access denied: Seller only!'))
}

export const isUser = (req:any, res: Response, next: NextFunction) => {
  if(req.role !== 'user')
    return next(new AuthError('Access denied: User only!'))
}