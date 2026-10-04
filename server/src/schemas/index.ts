import { z } from "zod";

const propertyType = z.enum([
  "APARTMENT",
  "HOUSE",
  "CONDO",
  "LAND",
  "COMMERCIAL",
  "OTHER"
]);
const listingType = z.enum(["RENT", "SALE"]);
const propertyStatus = z.enum(["DRAFT", "PUBLISHED", "RENTED", "SOLD"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(10).max(72),
  role: z.enum(["SEEKER", "OWNER"])
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(72),
  role: z.enum(["SEEKER", "OWNER"])
});

const propertyFieldsSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  propertyType,
  listingType,
  price: z.coerce.number().positive().max(9_999_999_999.99),
  location: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(200),
  bedrooms: z.coerce.number().int().min(0).max(100),
  bathrooms: z.coerce.number().int().min(0).max(100),
  features: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  status: propertyStatus.optional()
});

export const propertySchema = propertyFieldsSchema.refine(
  (property) => property.status !== "RENTED" || property.listingType === "RENT",
  { message: "Only rental listings can be marked as rented", path: ["status"] }
).refine(
  (property) => property.status !== "SOLD" || property.listingType === "SALE",
  { message: "Only sale listings can be marked as sold", path: ["status"] }
);

export const updatePropertySchema = propertyFieldsSchema.partial().refine(
  (values) => Object.keys(values).length > 0,
  "At least one property field is required"
);

export const inquirySchema = z.object({
  message: z.string().trim().min(10).max(2000)
});

export const inquiryMessageSchema = inquirySchema;

export const inquiryStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"])
});

export const propertyIdSchema = z.string().regex(/^c[a-z0-9]{24}$/);

export const propertyQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  propertyType: propertyType.optional(),
  listingType: listingType.optional(),
  location: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().max(9_999_999_999.99).optional(),
  bedrooms: z.coerce.number().int().min(0).max(100).optional(),
  bathrooms: z.coerce.number().int().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest")
}).refine(
  (values) => values.minPrice === undefined || values.maxPrice === undefined || values.minPrice <= values.maxPrice,
  { message: "Minimum price cannot exceed maximum price", path: ["minPrice"] }
);
