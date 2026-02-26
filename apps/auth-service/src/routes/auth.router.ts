import { Router } from "express";
import { loginUser, resetUserPassword, forgotUserPassword, userRegistration, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller";


const router = Router()

router.post('/user-registration', userRegistration)
router.post('/verify-user', verifyUser)
router.post('/login-user', loginUser)
router.post('/forgot-password-user', forgotUserPassword)
router.post('/verify-forgot-password-user', verifyUserForgotPassword)
router.post('/reset-password-user', resetUserPassword)

export default router