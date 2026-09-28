import type { Response } from "express";

export function sendSuccess<T>(
  response: Response,
  message: string,
  data: T,
  status = 200
) {
  return response.status(status).json({ success: true, message, data });
}
