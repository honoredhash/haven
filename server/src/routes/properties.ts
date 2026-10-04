import { Router } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { asyncHandler } from "../lib/async-handler.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../lib/response.js";
import { getAuthUser, requireAuth, requireRole } from "../middleware/auth.js";
import {
  propertyIdSchema,
  propertyQuerySchema,
  propertySchema,
  updatePropertySchema
} from "../schemas/index.js";
import { deleteImage, uploadImage } from "../services/images.js";

const router = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, callback) => {
    const supported = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!supported.includes(file.mimetype)) {
      callback(new HttpError(422, "Upload a JPEG, PNG, WebP, or AVIF image"));
      return;
    }
    callback(null, true);
  }
});
const ownerOnly = [requireAuth, requireRole("OWNER")];

function validateId(value: string | string[]) {
  const result = propertyIdSchema.safeParse(typeof value === "string" ? value : "");
  if (!result.success) throw new HttpError(400, "Property ID is invalid");
  return result.data;
}

function parsePropertyInput(input: unknown) {
  return propertySchema.parse(input);
}

function propertyData<T extends { price: Prisma.Decimal }>(property: T) {
  return { ...property, price: Number(property.price) };
}

router.get("/my-listings", ...ownerOnly, asyncHandler(async (request, response) => {
  const { id: ownerId } = getAuthUser(request);
  const items = await prisma.property.findMany({
    where: { ownerId },
    include: {
      images: { orderBy: { position: "asc" } },
      owner: { select: { id: true, name: true } },
      _count: { select: { inquiries: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
  sendSuccess(response, "Your listings were retrieved", { items: items.map(propertyData) });
}));

router.post("/", ...ownerOnly, asyncHandler(async (request, response) => {
  const input = parsePropertyInput(request.body);
  const { id: ownerId } = getAuthUser(request);
  const property = await prisma.property.create({
    data: { ...input, ownerId },
    include: {
      images: true,
      owner: { select: { id: true, name: true } }
    }
  });
  sendSuccess(response, "Your property was listed", { property: propertyData(property) }, 201);
}));

router.get("/", asyncHandler(async (request, response) => {
  const filters = propertyQuerySchema.parse(request.query);
  const where: Prisma.PropertyWhereInput = {
    status: "PUBLISHED",
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {}),
    ...(filters.search ? {
      OR: [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } }
      ]
    } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? {
      price: {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
      }
    } : {}),
    ...(filters.bedrooms !== undefined ? { bedrooms: { gte: filters.bedrooms } } : {}),
    ...(filters.bathrooms !== undefined ? { bathrooms: { gte: filters.bathrooms } } : {})
  };
  const orderBy: Prisma.PropertyOrderByWithRelationInput = filters.sort === "price-asc"
    ? { price: "asc" }
    : filters.sort === "price-desc"
      ? { price: "desc" }
      : { createdAt: "desc" };
  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        owner: { select: { id: true, name: true } }
      }
    })
  ]);
  sendSuccess(response, "Properties were retrieved", {
    items: properties.map(propertyData),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit)
    }
  });
}));

router.get("/:id", asyncHandler(async (request, response) => {
  const id = validateId(request.params.id);
  const property = await prisma.property.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      images: { orderBy: { position: "asc" } },
      owner: { select: { id: true, name: true, createdAt: true } }
    }
  });
  if (!property) throw new HttpError(404, "Property not found");
  sendSuccess(response, "Property details were retrieved", { property: propertyData(property) });
}));

router.patch("/:id", ...ownerOnly, asyncHandler(async (request, response) => {
  const id = validateId(request.params.id);
  const { id: ownerId } = getAuthUser(request);
  const input = updatePropertySchema.parse(request.body);
  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true, listingType: true, status: true }
  });
  if (!property) throw new HttpError(404, "Property not found");
  if (property.ownerId !== ownerId) throw new HttpError(403, "You can only edit your own listings");
  const listingType = input.listingType ?? property.listingType;
  const status = input.status ?? property.status;
  if (status === "RENTED" && listingType !== "RENT") {
    throw new HttpError(422, "Only rental listings can be marked as rented");
  }
  if (status === "SOLD" && listingType !== "SALE") {
    throw new HttpError(422, "Only sale listings can be marked as sold");
  }
  const updated = await prisma.property.update({
    where: { id },
    data: input,
    include: { images: { orderBy: { position: "asc" } }, owner: { select: { id: true, name: true } } }
  });
  sendSuccess(response, "Your property was updated", { property: propertyData(updated) });
}));

router.delete("/:id", ...ownerOnly, asyncHandler(async (request, response) => {
  const id = validateId(request.params.id);
  const { id: ownerId } = getAuthUser(request);
  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: true }
  });
  if (!property) throw new HttpError(404, "Property not found");
  if (property.ownerId !== ownerId) throw new HttpError(403, "You can only delete your own listings");
  await prisma.property.delete({ where: { id } });
  const imageDeleteResults = await Promise.allSettled(property.images.map((image) => deleteImage(image.publicId)));
  if (imageDeleteResults.some((result) => result.status === "rejected")) {
    console.error("One or more property images could not be deleted", imageDeleteResults);
  }
  sendSuccess(response, "Your property was deleted", null);
}));

router.post("/:id/images", ...ownerOnly, imageUpload.array("images", 8), asyncHandler(async (request, response) => {
  const id = validateId(request.params.id);
  const { id: ownerId } = getAuthUser(request);
  const property = await prisma.property.findUnique({
    where: { id },
    select: { ownerId: true, _count: { select: { images: true } } }
  });
  if (!property) throw new HttpError(404, "Property not found");
  if (property.ownerId !== ownerId) throw new HttpError(403, "You can only add images to your own listings");
  const files = request.files;
  if (!Array.isArray(files) || files.length === 0) throw new HttpError(422, "Choose at least one image to upload");
  if (files.length + property._count.images > 12) throw new HttpError(422, "A property can have at most 12 images");

  const uploaded: Array<{ url: string; publicId: string }> = [];
  try {
    for (const file of files) uploaded.push(await uploadImage(file));
    const images = await prisma.propertyImage.createManyAndReturn({
      data: uploaded.map((image, index) => ({
        ...image,
        propertyId: id,
        position: property._count.images + index
      }))
    });
    sendSuccess(response, "Property images were uploaded", { images }, 201);
  } catch (error) {
    const cleanupResults = await Promise.allSettled(uploaded.map((image) => deleteImage(image.publicId)));
    if (cleanupResults.some((result) => result.status === "rejected")) {
      console.error("Failed to clean up partially uploaded property images", cleanupResults);
    }
    throw error;
  }
}));

router.delete("/:id/images/:imageId", ...ownerOnly, asyncHandler(async (request, response) => {
  const id = validateId(request.params.id);
  const imageId = validateId(request.params.imageId);
  const { id: ownerId } = getAuthUser(request);
  const image = await prisma.propertyImage.findUnique({
    where: { id: imageId },
    include: { property: { select: { id: true, ownerId: true } } }
  });
  if (!image || image.propertyId !== id) throw new HttpError(404, "Property image not found");
  if (image.property.ownerId !== ownerId) {
    throw new HttpError(403, "You can only remove images from your own listings");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.propertyImage.delete({ where: { id: imageId } });
    const remainingImages = await transaction.propertyImage.findMany({
      where: { propertyId: id },
      select: { id: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    });
    await Promise.all(remainingImages.map((remainingImage, position) =>
      transaction.propertyImage.update({
        where: { id: remainingImage.id },
        data: { position }
      })
    ));
  });

  let cleanupWarning = false;
  try {
    await deleteImage(image.publicId);
  } catch (error) {
    cleanupWarning = true;
    console.error(`Image ${imageId} was removed from property ${id}, but provider cleanup failed`, error);
  }

  sendSuccess(
    response,
    cleanupWarning
      ? "The image was removed from the listing, but its stored file could not be cleaned up"
      : "The image was removed from the listing",
    { imageId, cleanupWarning }
  );
}));

export default router;
