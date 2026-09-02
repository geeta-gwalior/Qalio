import express from "express";
import {
    loginUser,
    verifyToken,
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
} from "../../controllers/auth/authController"

const router = express.Router();

// 🔹 Login route (Common for all users)
router.post("/login", loginUser);

router.post("/verify", verifyToken);


//password-reset/forgot-password routes
// Request password reset (send email)
router.post("/forgot-password/request", requestPasswordReset)

// Verify reset token
router.post("/forgot-password/verify-token", verifyResetToken)

// Reset password with token
router.post("/forgot-password/reset", resetPassword)

export default router;