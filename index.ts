import express from "express";
import type { Request, Response } from "express";
import { authRouter } from "./route/authRoute";
import { sequelize } from "./db";
import path from "path";
import { locationRouter } from "./route/locationRouter";
import { populateGeoPoliticalZones } from "./populate-model/geo-political-zone";
import { populateStates } from "./populate-model/populateStates";
import { populateLGA } from "./populate-model/populateLGA";

console.log("Hello via Bun!");
const app = express();
const port = 2030;

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
    app.listen(2030, () => console.log(`App is running on port + ${port}`));
  })
  .catch((err) => console.log("error syncing database:", err));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: 200,
    message: "Hello world!",
  });
});

app.use("/auth", authRouter);
app.use("/", locationRouter);

// populateLGA();
