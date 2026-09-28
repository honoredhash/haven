import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../lib/response.js";
import { requireAuth, getAuthUser } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../schemas/index.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please try again later",
    data: null
  }
});
const sessionCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

function setSessionCookie(token: string, response: Parameters<typeof sendSuccess>[0]) {
  response.cookie("session", token, sessionCookie);
}

router.post("/register", authLimiter, asyncHandler(async (request, response) => {
  const input = registerSchema.parse(request.body);
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(500, "Authentication is not configured");

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  setSessionCookie(jwt.sign({ role: user.role }, secret, { subject: user.id, expiresIn: "7d" }), response);
  sendSuccess(response, "Your account has been created", { user }, 201);
}));

router.post("/login", authLimiter, asyncHandler(async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const isPasswordValid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !isPasswordValid) throw new HttpError(401, "Email or password is incorrect");

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(500, "Authentication is not configured");
  setSessionCookie(jwt.sign({ role: user.role }, secret, { subject: user.id, expiresIn: "7d" }), response);
  sendSuccess(response, "You are signed in", {
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}));

router.post("/logout", (_request, response) => {
  response.clearCookie("session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  sendSuccess(response, "You are signed out", null);
});

router.get("/me", requireAuth, asyncHandler(async (request, response) => {
  const { id } = getAuthUser(request);
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  if (!user) throw new HttpError(401, "Your account is no longer available");
  sendSuccess(response, "Your account was retrieved", { user });
}));

export default router;
