import { AuthError, NotFoundError, ValidationError } from '@packages/error-handler'
import { imagekit } from '@packages/libs/imagekit'
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

// Upload product images
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {file} = req.body

    const response = await imagekit.files.upload({
      file,
      fileName: `product-${Date.now()}.jpg`,
      folder: '/products'
    })

    res.status(201).json({
      url: response.url,
      fileName: response.fileId
    })

  } catch (error) {
    return next(error)
  }
}

// Delete product image
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {fileId} = req.body

    await imagekit.files.delete(fileId)

    res.status(200).json({
      success: true,
    })

  } catch (error) {
    return next(error)
  }
}

// Create product 
export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title, 
      shortDescription,
      detailedDescription,
      warranty,
      customSpecifications, 
      slug,
      tags,
      cashOnDelivery,
      brand,
      videoUrl,
      category,
      subCategory,
      colors = [],
      sizes = [],
      discountCodes = [],
      stock,
      regularPrice,
      salePrice,
      customProperties = {},
      images = [], 
    } = req.body

    if (
      !title ||
      !slug ||
      !shortDescription ||
      !detailedDescription ||
      !category ||
      !subCategory ||
      !salePrice ||
      !regularPrice ||
      !stock ||
      !tags ||
      !images?.length 
    ) return next(new ValidationError('Missing required fields!'))

    if (!req.seller?.id)
      return next(new AuthError('Only seller can create products'))

    if (!req.seller?.shop?.id)
      return next(new ValidationError('Seller must have a shop to create products'))

    const slugCheck = await prisma.product.findUnique({
      where: { slug }
    })

    if (slugCheck)
      return next(new ValidationError('Slug already exists! Please use a different slug!'))

    if (discountCodes?.length > 0) {
      const validCodes = await prisma.discountCodes.findMany({
        where: {
          id: { in: discountCodes },
          sellerId: req.seller.id
        }
      })

      if (validCodes.length !== discountCodes.length)
        return next(new ValidationError('Some discount codes are invalid or do not belong to you'))
    }

    const result = await prisma.$transaction(async (tx) => {

      // Create the product first
      const newProduct = await tx.product.create({
        data: {
          title,
          shortDescription,
          detailedDescription,
          warranty: warranty || null,
          cashOnDelivery: Boolean(cashOnDelivery),
          slug,
          shopId: req.seller.shop.id,
          tags: Array.isArray(tags) 
            ? tags 
            : tags.split(",").map((tag: string) => tag.trim()),
          brand: brand || null, 
          videoUrl: videoUrl || null,
          category,
          subCategory,
          colors: colors || [],
          sizes: sizes || [],
          discountCodes: discountCodes || [], 
          stock: parseInt(stock),
          salePrice: parseFloat(salePrice),
          regularPrice: parseFloat(regularPrice),
          customProperties: customProperties || {},
          customSpecifications: customSpecifications || {},
        }
      })

      // Create images separately with proper relation
      if (images?.length > 0) {
        await Promise.all(
          images.map((image: any) =>
            tx.image.create({
              data: {
                fileId: image.fileId,
                url: image.url,
                productId: newProduct.id
              }
            })
          )
        )
      }

      // Fetch complete product with images
      return await tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          images: true,
          shop: {
            select: {
              id: true,
              name: true,
              rating: true
            }
          }
        }
      })
    })

    res.status(201).json({
      success: true,
      product: result
    })

  } catch (error) {
    return next(error)
  }
}

// Get logged in seller products 
export const getShopProducts = async (
  req: any, 
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: req?.seller?.shop?.id
      },
      include: {
        images: true
      }
    })

    res.status(200).json({
      success: true,
      products
    })
  } catch (error) {
    return next(error)
  }
}