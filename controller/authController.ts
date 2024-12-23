import type { Request, Response, NextFunction, RequestHandler } from "express";
import { User } from "../models/user";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import type { Model } from "sequelize";
import { body } from "express-validator";
import { validateRegistration } from "../middleware/validateRegistration";
import path from "path";
import fs from "fs";

const jwtSecret = process.env.JWT_SECRET || "";

export const register: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    const userResponse = user.toJSON();

    const token = jwt.sign({ userId: userResponse.id }, jwtSecret, {
      expiresIn: "72h",
    });

    res.status(201).json({
      message: "user registered successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Error registering user", error);
  }
};

export const logIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    console.log({ email, password });
    const user = await User.findOne({
      where: { email },
      attributes: { include: ["password"] },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid =
      user?.password && (await bcrypt.compare(password, user?.password));

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user?.id }, jwtSecret, {
      expiresIn: "72h",
    });
    const userResponse = user?.toJSON();

    console.log({ isPasswordValid });
    res.status(200).json({ message: "Login successful", user: user, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

export const updatePhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    // const { photo }: { photo: string } = req.body;
    console.log({ req });

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.photo) {
      const oldPhotoPath = path.join(__dirname, "..", user.photo);

      // Ensure the file exists before deleting
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath); // Deletes the old photo
      }
    }

    user.photo = path.join("uploads", req.file.filename).replace(/\\/g, "/");
    const photo = `${req.protocol}://${req.get("host")}/${user.photo}`;

    await user?.save();
    res.status(200).json({
      message: "photo updated successfully",
      user: { ...user.toJSON(), photo },
    });
  } catch (error) {
    console.error("Error updating photo:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the photo" });
  }
};

export const getSampleData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({ message: "This is sample data" });
};
