import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { AppError } from "./error.middleware";

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  handler: (req: Request, res: Response) => {
    throw new AppError(429, "Too many requests", "RATE_LIMIT_EXCEEDED");
  },
});

// More strict limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  handler: (req: Request, res: Response) => {
    throw new AppError(
      429,
      "Too many login attempts",
      "AUTH_RATE_LIMIT_EXCEEDED"
    );
  },
});
