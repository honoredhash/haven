import "./config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRouter from "./routes/auth.js";
import propertyRouter from "./routes/properties.js";
import { ownerRouter, userRouter } from "./routes/inquiries.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

const app = express();
const allowedOrigin = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({
    success: true,
    message: "Property Listing API is running",
    data: { status: "ok" }
  });
});

app.use("/api/auth", authRouter);
app.use("/api/properties", propertyRouter);
app.use("/api", userRouter);
app.use("/api", ownerRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
