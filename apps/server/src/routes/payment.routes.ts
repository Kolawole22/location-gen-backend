import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createPayment,
  verifyPayment,
  getPayments,
} from "../controllers/payment.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Payment routes
router.get("/", getPayments);
router.post("/", createPayment);
router.post("/:reference/verify", verifyPayment);

export { router as paymentRouter };
