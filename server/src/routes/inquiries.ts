import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../lib/response.js";
import { getAuthUser, requireAuth, requireRole } from "../middleware/auth.js";
import { inquirySchema, inquiryStatusSchema, propertyIdSchema } from "../schemas/index.js";

const userRouter = Router();
const ownerRouter = Router();

function validateInquiryId(value: string | string[]) {
  const result = propertyIdSchema.safeParse(typeof value === "string" ? value : "");
  if (!result.success) throw new HttpError(400, "Inquiry ID is invalid");
  return result.data;
}

userRouter.post(
  "/properties/:id/inquiries",
  requireAuth,
  requireRole("SEEKER"),
  asyncHandler(async (request, response) => {
    const id = propertyIdSchema.parse(request.params.id);
    const { id: userId } = getAuthUser(request);
    const input = inquirySchema.parse(request.body);
    const property = await prisma.property.findFirst({
      where: { id, status: "PUBLISHED" },
      select: { id: true, ownerId: true }
    });
    if (!property) throw new HttpError(404, "Property not found");
    if (property.ownerId === userId) throw new HttpError(400, "You cannot inquire about your own property");
    const inquiry = await prisma.inquiry.create({
      data: { ...input, propertyId: property.id, userId },
      include: {
        property: { select: { id: true, title: true, location: true, price: true, listingType: true } }
      }
    });
    sendSuccess(response, "Your inquiry was sent", {
      inquiry: { ...inquiry, property: { ...inquiry.property, price: Number(inquiry.property.price) } }
    }, 201);
  })
);

userRouter.get("/inquiries", requireAuth, requireRole("SEEKER"), asyncHandler(async (request, response) => {
  const { id: userId } = getAuthUser(request);
  const inquiries = await prisma.inquiry.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          listingType: true,
          images: { orderBy: { position: "asc" }, take: 1 }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  sendSuccess(response, "Your inquiries were retrieved", {
    items: inquiries.map((inquiry) => ({
      ...inquiry,
      property: { ...inquiry.property, price: Number(inquiry.property.price) }
    }))
  });
}));

ownerRouter.get("/owner/inquiries", requireAuth, requireRole("OWNER"), asyncHandler(async (request, response) => {
  const { id: ownerId } = getAuthUser(request);
  const inquiries = await prisma.inquiry.findMany({
    where: { property: { ownerId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true, location: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  sendSuccess(response, "Property inquiries were retrieved", { items: inquiries });
}));

ownerRouter.patch("/inquiries/:id", requireAuth, requireRole("OWNER"), asyncHandler(async (request, response) => {
  const id = validateInquiryId(request.params.id);
  const { id: ownerId } = getAuthUser(request);
  const input = inquiryStatusSchema.parse(request.body);
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true } } }
  });
  if (!inquiry) throw new HttpError(404, "Inquiry not found");
  if (inquiry.property.ownerId !== ownerId) throw new HttpError(403, "You can only manage inquiries for your properties");
  const updated = await prisma.inquiry.update({
    where: { id },
    data: { status: input.status },
    include: {
      user: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true } }
    }
  });
  sendSuccess(response, "Inquiry status was updated", { inquiry: updated });
}));

export { ownerRouter, userRouter };
