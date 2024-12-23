import express, { type RequestHandler } from "express";
import {
  getSampleData,
  logIn,
  register,
  updatePhoto,
} from "../controller/authController";
import { validateRegistration } from "../middleware/validateRegistration";
import { authenticateToken } from "../middleware/authenticateToken";
import { upload } from "../middleware/upload-photo";

export const authRouter = express.Router();

authRouter.route("/register").post(validateRegistration, register);
authRouter.route("/login").post(logIn);
authRouter
  .route("/update-photo")
  .put(authenticateToken, upload.single("photo"), updatePhoto);
authRouter.get("/sample", authenticateToken, getSampleData);
