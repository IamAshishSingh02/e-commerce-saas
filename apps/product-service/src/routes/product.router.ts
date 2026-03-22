import { Router } from "express";
import { createDiscountCodes, createProduct, deleteDiscountCodes, deleteProductImage, getCategories, getDiscountCodes, uploadProductImage } from "../controller/product.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router = Router()

router.get('/get-categories', getCategories)

router.post('/create-discount-code', isAuthenticated, createDiscountCodes)
router.get('/get-discount-codes', isAuthenticated, getDiscountCodes)
router.delete('/delete-discount-code/:id', isAuthenticated, deleteDiscountCodes)

router.post('/upload-product-image', isAuthenticated, uploadProductImage)
router.delete('/delete-product-image', isAuthenticated, deleteProductImage)
router.post('/create-product', isAuthenticated, createProduct)

export default router