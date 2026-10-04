import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  timeout: 12000,
  headers: { "Content-Type": "application/json" }
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }
    if (!error.response) {
      return "Haven couldn't reach the service. Check your connection and try again.";
    }
    if (error.response.status >= 500) {
      return "Haven's service is temporarily unavailable. Please try again later.";
    }
    return "The service returned an unexpected response. Please try again.";
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
