import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";

export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, "The requested endpoint was not found"));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      success: false,
      message: "The request body contains invalid JSON",
      data: null
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      success: false,
      message: error.message,
      data: error.details
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(422).json({
      success: false,
      message: "Please check the submitted information",
      data: null
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(422).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 5 MB or smaller"
        : "The image upload could not be processed",
      data: null
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(409).json({
        success: false,
        message: "A record with those details already exists",
        data: null
      });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({
        success: false,
        message: "The requested record was not found",
        data: null
      });
      return;
    }
  }

  console.error("Unhandled API error", error);
  response.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later",
    data: null
  });
};
