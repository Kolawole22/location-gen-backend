import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller";

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many attempts, please try again after 15 minutes",
});

// Auth routes
router.post("/signup", signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

export { router as authRouter };
