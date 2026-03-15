import { NotFoundError } from '@packages/error-handler'
import prisma from '@packages/libs/prisma'
import {Request, Response, NextFunction} from 'express'

// Get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.siteConfig.findFirst()

    if(!config){
      return next(new NotFoundError('Categories not found!'))
    }

    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories
    })

  } catch (error) {
    return next(error)
  }
}