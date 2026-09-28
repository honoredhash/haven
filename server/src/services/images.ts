import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import { HttpError } from "../lib/http-error.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function configureImageStorage() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new HttpError(503, "Image uploads are not configured. Please try again later");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });
}

export async function uploadImage(file: Express.Multer.File) {
  configureImageStorage();
  if (!allowedMimeTypes.has(file.mimetype)) {
    throw new HttpError(422, "Upload a JPEG, PNG, WebP, or AVIF image");
  }
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "property-listing",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [{ width: 2000, height: 1500, crop: "limit" }]
      },
      (error, result) => {
        if (error || !result) {
          reject(new HttpError(502, "An image could not be uploaded. Please try again"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

export async function deleteImage(publicId: string) {
  configureImageStorage();
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary could not delete image ${publicId}`);
  }
}
