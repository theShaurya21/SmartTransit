# API contracts

Base path: `/api`. JSON request bodies are limited to 100 KB. Authentication is a signed one-day bearer JWT. Inactive users are rejected after login and on every protected request. API errors use `{ "message": "..." }`.

## Authentication and profile

- `POST /auth/register`: `{ "name", "email", "password", "requestedRole" }`; `requestedRole` may be `student`, `driver`, or `admin` (omitted means `student`). Student requests are activated as student accounts. Driver/admin requests are stored as pending and keep the effective role `student` until admin approval. Returns 201 with a safe user object and approval status.
- `POST /auth/login`: `{ "email", "password" }`; returns `{ "message", "token", "user" }`.
- `GET /auth/me`: returns `{ "message", "user" }`.
- `PATCH /auth/me`: `{ "name" }`; updates only the authenticated user's display name.

## Buses and routes

- `GET /buses`, `GET /buses/:id`: authenticated.
- `POST /buses`: admin; accepted fields are `busNumber`, `registrationNumber`, `driver`, `driverId`, `route`, `capacity`, and `status`. A supplied `driverId` must refer to an active driver account; the server sets the display name from that account.
- `PUT /buses/:id`: admin; same field allowlist. Bus assignment/status/route cannot change while it has an active trip. Buses referenced by trips cannot be deleted.
- `DELETE /buses/:id`: admin; returns 409 if any trip references the bus.
- `GET /routes`, `GET /routes/:id`: authenticated.
- `POST /routes`, `PUT /routes/:id`, `DELETE /routes/:id`: admin. Route create/update accepts `name`, `code`, `start`, `destination`, `stops`, `distance`, `duration`, `bus`, and `status`. A route referenced by a bus or trip cannot be deleted.

## Incidents and users

- `GET /incidents`: admins receive all; other users receive only their records.
- `POST /incidents`: any active user; accepted fields are `bus`, `route`, `category`, `severity`, and `description`. Reporter identity is taken from the JWT, not the body.
- `GET /incidents/:id`: admin or reporter.
- `PUT /incidents/:id`, `DELETE /incidents/:id`: admin only.
- `/users` list/create/update/delete: admin only; password hashes are never returned. List filters include `role`, `status`, and `approvalStatus`. `POST /users/:id/approve` grants the stored requested driver/admin role and activates the account; `POST /users/:id/reject` stores the rejection and keeps the account inactive. Pending requests must be approved/rejected rather than role-edited. Self-deletion and self-role/status changes are blocked, and the last active administrator cannot be demoted/deactivated or deleted. Users referenced by trips, bus assignments, or reported incidents must be deactivated rather than deleted.

## Dashboard and analytics

- `GET /dashboard/stats`: returns `{ totalBuses, activeBuses, activeRoutes, unresolvedIncidents, totalStudents, activeTrips, updatedAt }`. `totalStudents` is `null` for non-admin users.
- `GET /analytics?days=7|30|90`: admin-only; returns actual `{ buses, routes, incidents, periodDays, generatedAt }`. The incidents list is filtered by its creation timestamp.

## Trips and GPS

- `GET /trips/assigned`: driver-only; returns active buses linked to the signed-in driver.
- `POST /trips/start`: driver-only; `{ "busId": "..." }`. Server verifies driver assignment, bus status, and that neither bus nor driver already has an active trip.
- `GET /trips/active`: admin/student receives active trips; drivers receive their own.
- `PATCH /trips/:id/location`: assigned driver only; requires finite numeric latitude in `[-90, 90]` and longitude in `[-180, 180]`; optional accuracy must be in `[0, 10000]`. The server records `receivedAt` and source `device-geolocation`.
- `PATCH /trips/:id/end`: assigned driver or admin. A completed trip keeps its last location but no longer appears in active live tracking.

The active trip response includes `locationFresh`, computed against a two-minute threshold. The frontend polls every 15 seconds; there is no Socket.IO event transport yet.
