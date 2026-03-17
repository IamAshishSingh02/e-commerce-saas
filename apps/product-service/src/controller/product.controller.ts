import { NotFoundError, ValidationError } from '@packages/error-handler'
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

// Create discount codes
export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {publicName, discountType, discountValue, discountCode} =req.body

    const isCodeExist = await prisma.discountCodes.findUnique({
      where: {
        discountCode
      }
    }) 

    if(isCodeExist)
      return next(new ValidationError('Discount code already available, please use a different code!'))

    const code = await prisma.discountCodes.create({
      data: {
        publicName,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id
      }
    })

    return res.status(201).json({
      success: true,
      code
    })

  } catch (error) {
    next(error)
  }
}

// Get discount codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = await prisma.discountCodes.findMany({
      where: {
        sellerId: req.seller.id
      }
    })

    return res.status(200).json({
      success: true,
      code
    })
  } catch (error) {
    return next(error)
  }
}

// Delete discount codes
export const deleteDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const{id} = req.params
    const sellerId = req.seller?.id

    const code = await prisma.discountCodes.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        sellerId: true
      }
    })

    if(!code)
      return next(new NotFoundError('Discount code not found!'))

    if(code.sellerId !== sellerId)
      return next(new ValidationError('Unauthorized access!'))

    await prisma.discountCodes.delete({
      where: {
        id
      }
    })

    return res.status(200).json({
      message: 'Discount code deleted successfully'
    })

  } catch (error) {
    return next(error)
  }
}