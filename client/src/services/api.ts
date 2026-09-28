import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
  timeout: 12000,
  headers: { "Content-Type": "application/json" }
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? "We couldn't complete that request. Please try again.";
  }
  return "We couldn't complete that request. Please try again.";
}

export async function apiRequest<T>(
  request: Promise<{ data: ApiResponse<T> }>
): Promise<T> {
  const response = await request;
  return response.data.data;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "SEEKER" | "OWNER";
  createdAt?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  position: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: "APARTMENT" | "HOUSE" | "CONDO" | "LAND" | "COMMERCIAL" | "OTHER";
  listingType: "RENT" | "SALE";
  price: number;
  location: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  status: "DRAFT" | "PUBLISHED" | "RENTED" | "SOLD";
  images: PropertyImage[];
  owner: { id: string; name: string; createdAt?: string };
  _count?: { inquiries: number };
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  userId: string;
  message: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
  property: Pick<Property, "id" | "title" | "location" | "price" | "listingType"> & {
    images?: PropertyImage[];
  };
  user?: Pick<User, "id" | "name" | "email">;
}
