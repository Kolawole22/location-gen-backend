import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Handle AppError (our custom error)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      errors: err.errors,
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle unique constraint violations
    if (err.code === "P2002") {
      return res.status(409).json({
        status: "error",
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        message: "A record with this value already exists",
        field: err.meta?.target as string[],
      });
    }

    // Handle foreign key constraint violations
    if (err.code === "P2003") {
      return res.status(409).json({
        status: "error",
        code: "FOREIGN_KEY_CONSTRAINT_VIOLATION",
        message: "Referenced record does not exist",
        field: err.meta?.field_name as string,
      });
    }

    // Handle record not found
    if (err.code === "P2001") {
      return res.status(404).json({
        status: "error",
        code: "RECORD_NOT_FOUND",
        message: "The requested record was not found",
      });
    }
  }

  // Handle other Prisma errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: "error",
      code: "PRISMA_VALIDATION_ERROR",
      message: "Invalid data provided to database operation",
    });
  }

  // Handle all other errors
  return res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
};
