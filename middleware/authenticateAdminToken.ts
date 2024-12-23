import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: string; // Add role to the payload
}

// Update the Express Request type to include the role
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  // Verify the token and check the user's role.
  jwt.verify(token, process.env.JWT_SECRET || "", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const userWithRole = user as JwtPayload; // ensure correct typing for user

    if (!userWithRole.role || userWithRole.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Attach user information to the request object
    req.user = userWithRole;
    next();
  });
};
