import type { Request, Response, NextFunction, RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/user";

export const validateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validation rules
  await body("email").isEmail().withMessage("Invalid email format").run(req);
  await body("username")
    .notEmpty()
    .withMessage("Username is required")
    .run(req);
  await body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .run(req);

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array()[0].msg });
    return;
  }

  try {
    const { email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Error during validation", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
