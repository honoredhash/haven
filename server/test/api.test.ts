import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import jwt from "jsonwebtoken";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import app from "../src/app.js";
import {
  loginSchema,
  propertyQuerySchema,
  propertySchema,
  registerSchema
} from "../src/schemas/index.js";

let server: Server;
let baseUrl: string;

before(async () => {
  server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("health endpoint uses the common success envelope", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    success: true,
    message: "Property Listing API is running",
    data: { status: "ok" }
  });
});

test("protected session endpoint rejects requests without a cookie", async () => {
  const response = await fetch(`${baseUrl}/api/auth/me`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.success, false);
  assert.equal(body.data, null);
});

test("unknown API routes return a common not-found envelope", async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.data, null);
});

test("malformed JSON and property IDs return bad-request envelopes", async () => {
  const malformedBody = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"name":'
  });
  const malformedResponse = await malformedBody.json();
  assert.equal(malformedBody.status, 400);
  assert.equal(malformedResponse.success, false);
  assert.equal(malformedResponse.message, "The request body contains invalid JSON");

  const invalidId = await fetch(`${baseUrl}/api/properties/not-valid`);
  const invalidIdResponse = await invalidId.json();
  assert.equal(invalidId.status, 400);
  assert.equal(invalidIdResponse.success, false);
  assert.equal(invalidIdResponse.data, null);

  const invalidFilters = await fetch(`${baseUrl}/api/properties?minPrice=5000&maxPrice=1000`);
  const invalidFiltersResponse = await invalidFilters.json();
  assert.equal(invalidFilters.status, 422);
  assert.equal(invalidFiltersResponse.success, false);
  assert.equal(invalidFiltersResponse.data, null);
});

test("malformed inquiry IDs return a bad-request envelope", async () => {
  const secret = process.env.JWT_SECRET ?? "test-only-jwt-secret-with-at-least-32-characters";
  process.env.JWT_SECRET = secret;
  const token = jwt.sign({ role: "OWNER" }, secret, { subject: "test-owner" });
  const response = await fetch(`${baseUrl}/api/inquiries/not-valid`, {
    method: "PATCH",
    headers: { Cookie: `session=${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CLOSED" })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Inquiry ID is invalid");
  assert.equal(body.data, null);
});

test("registration and login normalize email and require an account role", () => {
  const input = registerSchema.parse({
    name: "Sam Lee",
    email: "SAM@EXAMPLE.COM",
    password: "StrongPassword123!",
    role: "SEEKER"
  });

  assert.equal(input.email, "sam@example.com");
  assert.equal(input.role, "SEEKER");
  assert.equal(registerSchema.safeParse({ ...input, role: undefined }).success, false);
  assert.equal(registerSchema.safeParse({ ...input, password: "short" }).success, false);
  const login = loginSchema.parse({
    email: "SAM@EXAMPLE.COM",
    password: "StrongPassword123!",
    role: "OWNER"
  });
  assert.equal(login.email, "sam@example.com");
  assert.equal(login.role, "OWNER");
  assert.equal(loginSchema.safeParse({ ...login, role: undefined }).success, false);
});

test("property filters apply defaults and reject reversed price ranges", () => {
  const filters = propertyQuerySchema.parse({ page: "2", minPrice: "1000" });

  assert.equal(filters.page, 2);
  assert.equal(filters.limit, 12);
  assert.equal(filters.sort, "newest");
  assert.equal(propertyQuerySchema.safeParse({ minPrice: "5000", maxPrice: "1000" }).success, false);
});

test("property payload validates required content and numeric fields", () => {
  const valid = {
    title: "Light-filled family home",
    description: "A lovely home with generous natural light and a welcoming garden.",
    propertyType: "HOUSE",
    listingType: "RENT",
    price: "2500000",
    location: "Ikeja, Lagos",
    address: "12 Garden Street",
    bedrooms: "3",
    bathrooms: "2"
  };
  const input = propertySchema.parse(valid);

  assert.equal(input.price, 2500000);
  assert.equal(input.bedrooms, 3);
  assert.deepEqual(input.features, []);
  assert.equal(propertySchema.safeParse({ ...valid, price: "-1" }).success, false);
  assert.equal(propertySchema.safeParse({ ...valid, status: "SOLD" }).success, false);
  assert.equal(propertySchema.safeParse({ ...valid, status: "RENTED" }).success, true);
});
