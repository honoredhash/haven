# REST API

Base URL: `http://localhost:4000/api`

All responses follow `{ "success": boolean, "message": string, "data": object | null }`.
Errors use the same envelope. Authentication uses an HTTP-only JWT cookie; send requests with credentials enabled.

## Authentication

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| POST | `/auth/register` | Create a seeker or owner account | No |
| POST | `/auth/login` | Sign in | No |
| POST | `/auth/logout` | Clear the session cookie | No |
| GET | `/auth/me` | Return the current user | Yes |

Registration body: `{ "name": "Sam Lee", "email": "sam@example.com", "password": "StrongPass123!", "role": "SEEKER" }`. `role` is required and may be `SEEKER` or `OWNER`. An email may have one account for each role; duplicate registrations for the same email and role return `409`.

Login body: `{ "email": "sam@example.com", "password": "StrongPass123!", "role": "SEEKER" }`. Login authenticates the selected email/role pair. If the email is registered only under the other role, the API responds with `403` and instructs the user to register for the selected account type.

## Properties

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| GET | `/properties` | Search and paginate published properties | No |
| GET | `/properties/:id` | Get property details | No |
| GET | `/properties/my-listings` | List the signed-in owner's properties | Owner |
| POST | `/properties` | Create a property listing | Owner |
| PATCH | `/properties/:id` | Update an owned listing | Owner |
| DELETE | `/properties/:id` | Delete an owned listing | Owner |
| POST | `/properties/:id/images` | Upload listing images | Owner |
| DELETE | `/properties/:id/images/:imageId` | Remove an image from an owned listing | Owner |

Supported list query parameters include `search`, `propertyType`, `listingType`, `location`, `minPrice`, `maxPrice`, `bedrooms`, `bathrooms`, `page`, and `limit`.

Property create/update fields: `title`, `description`, `propertyType`, `listingType`, `price` (NGN amount), `location`, `address`, `bedrooms`, `bathrooms`, and optional `features`. Create/update accepts JSON; image upload uses multipart field `images` (up to 8 files, 5 MB each). Owners can add photos to existing listings and remove individual photos.

## Inquiries

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| POST | `/properties/:id/inquiries` | Send an inquiry to a property's owner | Seeker |
| GET | `/inquiries` | Get the signed-in seeker's inquiry history | Seeker |
| GET | `/owner/inquiries` | Get inquiries for the signed-in owner's properties | Owner |
| POST | `/inquiries/:id/messages` | Send a message in an inquiry conversation | Inquiry seeker or property owner |
| PATCH | `/inquiries/:id` | Update an inquiry status | Relevant owner |

Inquiry and reply body: `{ "message": "Is this property available for viewing?" }` (10–2000 characters).
Both inquiry-list endpoints include each inquiry's ordered `messages` and sender details.
Only the inquiry's seeker and property owner may reply. Closed inquiries cannot receive
messages; the owner can reopen one by changing its status. An owner's first reply moves
a `NEW` inquiry to `CONTACTED`.
Status update body: `{ "status": "CONTACTED" }` (`NEW`, `CONTACTED`, or `CLOSED`).

## Common responses

Success:

```json
{ "success": true, "message": "Request completed successfully", "data": {} }
```

Error:

```json
{ "success": false, "message": "A helpful error message", "data": null }
```

Expected status codes include `400` (invalid request), `401` (not authenticated),
`403` (not authorized), `404` (not found), `409` (conflict), `422` (validation),
and `500` (unexpected server error).
