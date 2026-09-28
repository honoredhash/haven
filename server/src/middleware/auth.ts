import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { HttpError } from "../lib/http-error.js";

type SessionToken = {
  sub: string;
  role: UserRole;
};

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const token = request.cookies?.session;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return next(new HttpError(401, "Please log in to continue"));
  }
  if (!secret || secret.length < 32) {
    return next(new HttpError(500, "Authentication is not configured"));
  }

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      (payload.role !== "OWNER" && payload.role !== "SEEKER")
    ) {
      throw new HttpError(401, "Your session is invalid. Please log in again");
    }
    request.authUser = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, "Your session has expired"));
  }
}

export function requireRole(role: UserRole) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authUser) {
      return next(new HttpError(401, "Please log in to continue"));
    }
    if (request.authUser.role !== role) {
      return next(new HttpError(403, "You do not have permission to do this"));
    }
    next();
  };
}

export function getAuthUser(request: Request): NonNullable<Request["authUser"]> {
  if (!request.authUser) {
    throw new HttpError(401, "Please log in to continue");
  }
  return request.authUser;
}

export type { SessionToken };
