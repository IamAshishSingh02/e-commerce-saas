import { Router } from "express";
import { loginUser, resetUserPassword, forgotUserPassword, userRegistration, verifyUser, verifyUserForgotPassword, refreshToken, getUser, sellerRegistration, verifySeller, createShop, createStripeConnectLink, loginSeller, getSeller } from "../controller/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller } from "@packages/middleware/authorizeRoles";


const router = Router()

//------------------USER----------------------

router.post('/user-registration', userRegistration)
router.post('/verify-user', verifyUser)
router.post('/login-user', loginUser)
router.get('/logged-in-user', isAuthenticated, getUser)
router.post('/refresh-token-user', refreshToken)
router.post('/forgot-password-user', forgotUserPassword)
router.post('/verify-forgot-password-user', verifyUserForgotPassword)
router.post('/reset-password-user', resetUserPassword)

//----------------SELLER----------------------

router.post('/seller-registration', sellerRegistration)
router.post('/verify-seller', verifySeller)
router.post('/create-shop', createShop)
router.post('/create-stripe-link', createStripeConnectLink)
router.post('/login-seller', loginSeller)
router.get('/logged-in-seller', isAuthenticated, isSeller, getSeller)
router.post('/refresh-token-seller', refreshToken)

export default router