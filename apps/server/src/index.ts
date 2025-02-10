import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes";
import { locationRouter } from "./routes/location.routes";
import { paymentRouter } from "./routes/payment.routes";
import { errorHandler } from "./middleware/error.middleware";
import {
  rateLimiter,
  authRateLimiter,
} from "./middleware/rate-limit.middleware";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Apply rate limiting
app.use(rateLimiter); // Global rate limiter
app.use("/api/auth", authRateLimiter); // Stricter rate limiting for auth routes

// Routes
app.use("/api/auth", authRouter);
app.use("/api/locations", locationRouter);
app.use("/api/payments", paymentRouter);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
