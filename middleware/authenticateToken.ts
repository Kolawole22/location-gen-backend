import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: string;
}

// Extend the Express Request type to include our custom user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET || "", (err, user) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    console.log({ user });

    // Attach user information to the request object
    req.user = user as JwtPayload;
    next();
  });
};
