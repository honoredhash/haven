# Group 51 — Property Listing App

A full-stack property marketplace for property seekers to discover homes and contact owners, and for owners to publish and manage listings.

## Features

- Seeker and owner accounts with secure password hashing and cookie-based JWT authentication
- Property search, filters, sorting, and pagination
- Owner listing management and property image uploads
- Seeker inquiry history and owner inquiry management
- Responsive React interface backed by a REST API and PostgreSQL

## Tech stack

- **Client:** React, Vite, TypeScript, React Router, Axios, Bootstrap
- **Server:** Node.js, Express, TypeScript, Zod, JWT, bcrypt
- **Database:** PostgreSQL and Prisma
- **Images:** Cloudinary

## Project structure

```text
client/       React application
server/       Express API and Prisma schema
docs/         API reference
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL database
- Cloudinary account for image uploads (optional until uploads are used)

## Setup

1. Install packages from the project root:

   ```bash
   npm install
   ```

2. Copy `.env.example` to the repository root as `.env` and set `DATABASE_URL` and a random `JWT_SECRET`.
   Cloudinary variables are needed to upload images. Never commit `.env`.

3. Generate the Prisma client and apply the initial migration:

   ```bash
   npm run db:generate --workspace server
   npm run db:migrate --workspace server -- --name init
   ```

4. Start the API and client:

   ```bash
   npm run dev
   ```

   The client is served at `http://localhost:5173` and the API at
   `http://localhost:4000`. The health endpoint is `GET /api/health`.

## Development commands

Run from the project root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and API |
| `npm run build` | Build both workspaces |
| `npm run typecheck` | Type-check both workspaces |
| `npm run lint` | Lint both workspaces |
| `npm test` | Run backend tests |
| `npm run db:generate --workspace server` | Generate Prisma client |
| `npm run db:migrate --workspace server` | Apply a development migration |
| `npm run db:studio --workspace server` | Open Prisma Studio |

## Authentication

The API signs JWTs into HTTP-only, SameSite cookies. Password hashes are never included in API responses. The browser sends credentials through Axios; the client does not store tokens in local storage. Registration accepts `SEEKER` or `OWNER` roles.

## Environment variables

Copy `.env.example` to `.env` in the repository root. `DATABASE_URL` and a
random `JWT_SECRET` of at least 32 characters are required for the API.
`PORT` defaults to `4000`, `CLIENT_URL` defaults to `http://localhost:5173`,
and `VITE_API_URL` defaults to `http://localhost:4000/api`.
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
are required only when uploading listing images. Obtain the database URL from
your PostgreSQL provider and the image-storage values from the Cloudinary
dashboard. Do not share or commit `.env`.

## API

All API responses use `{ "success": boolean, "message": string, "data": object | null }`. See [docs/API.md](./docs/API.md) for routes, authentication requirements, request examples, and response details.

## Database

The Prisma schema and migrations live in `server/prisma`. Configure a PostgreSQL URL in `.env`, then run `db:generate` and `db:migrate` as above. Database-backed flows require a reachable PostgreSQL instance.

## Git workflow

Develop features on focused branches (for example, `feature/authentication`) and use pull requests for review. Do not commit environment files, credentials, or uploaded media.

## Deployment

This repository can be deployed as one Vercel project with two services. The `client` Vite service handles public frontend routes, and the `server` Express service handles public requests under `/api/`. The API receives the `/api` prefix unchanged, matching the Express routes and the client’s same-origin `/api` base URL. Client-side routes are handled by the Vite service.

Configure these Vercel environment variables before production deployment:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: random secret of at least 32 characters
- `CLIENT_URL`: deployed site origin
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: needed for image uploads
- `VITE_API_URL`: set to `/api` (or leave unset; this is the client default)

Vercel builds Prisma Client and the Express service in the server service’s build command. Apply pending Prisma migrations to the production database with `npx prisma migrate deploy --schema server/prisma/schema.prisma` before using the deployed app. The client calls the public `/api/` route, so no private Vercel service binding is required. Never add production credentials to the repository.
