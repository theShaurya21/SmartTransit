# SmartTransit

SmartTransit is a college transportation management and safety application. It centralizes bus and route records, user accounts, transport incident reporting, driver trips, and browser-device GPS updates.

## Problem, objectives, and scope

College transport information is often split across fleet, route, and incident records, making it difficult for students and administrators to see current service state. SmartTransit provides one role-based web portal for those records and a verified driver-to-trip-to-GPS workflow. Location, ETA, ridership, and notification behavior is shown only when supported by real configured data; unavailable capabilities remain explicitly labeled.

## Features by role

- **Students:** view buses and routes, submit incident reports, view their own reports, and see GPS locations for active trips when drivers are sharing a fresh device location.
- **Drivers:** view their assigned active buses, start/end trips, and share browser geolocation while an authenticated trip is active.
- **Administrators:** manage users, buses, routes, assignments, and incident status; view fleet summaries and actual stored-record analytics; end active trips if needed.

Public registration lets applicants request student, driver, or administrator access. Student accounts are activated as students; driver and administrator requests remain pending with student-level permissions until an administrator approves them. Administrators can also create active accounts directly and assign drivers to buses.

The first administrator is provisioned explicitly (there is no public admin registration or automatic seed). For a one-time bootstrap, set `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` privately in `backend/.env`, run `npm run create-admin`, then remove the temporary password variable. The script refuses to alter an existing account and requires a 12-character minimum password. Passwords are limited to 72 UTF-8 bytes for bcrypt compatibility.

## Stack and architecture

- Frontend: React 19, Vite, React Router, Axios, Leaflet / React-Leaflet, Lucide.
- Backend: Node.js, Express 5, Mongoose, MongoDB, bcryptjs, JWT, Helmet, express-rate-limit.
- Database: local MongoDB or MongoDB Atlas through `MONGO_URI`.
- API requests use a bearer token. See [architecture documentation](./docs/architecture.md) and [API documentation](./docs/api.md).

Brand tokens are navy `#1F2A44`, warm beige `#E8DCC8`, and soft gold `#C6A75E`.

## Local setup (Windows PowerShell)

Install Node.js `20.19+` or `22.12+` and run MongoDB locally, or use a MongoDB Atlas database.

```powershell
cd E:\SmartTransit\backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

Set `MONGO_URI` to the chosen database. Replace the sample `JWT_SECRET` with a private random value of at least 32 characters. For example, generate one locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

In another PowerShell window:

```powershell
cd E:\SmartTransit\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The backend defaults to port `5000`; its health endpoint is `http://localhost:5000/api/health`. Keep real `.env` files private.

## Environment variables

Backend variables are listed in [`backend/.env.example`](./backend/.env.example). Replace placeholder values before starting the API; do not put real credentials in either example file.

| Variable | Requirement | Purpose |
|---|---|---|
| `MONGO_URI` | Required at startup | MongoDB connection URI |
| `JWT_SECRET` | Required at startup | Private signing secret of at least 32 characters |
| `CORS_ORIGINS` | Required in production | Comma-separated exact browser origins; no trailing slash |
| `NODE_ENV` | Set to `production` when deployed | Enables production proxy handling and requires `CORS_ORIGINS` |
| `PORT` | Optional | HTTP port; defaults to `5000` locally. Render supplies this automatically. |
| `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Optional; only for `npm run create-admin` | Temporary one-time administrator setup values; the script also requires `MONGO_URI`. Remove the password after use. |

The frontend reads `VITE_API_URL` as the API base URL, including `/api`; the code falls back to `http://localhost:5000/api` only when it is unset. Set `VITE_API_URL` in the Vercel Production environment before building. Vite variables are public and must never contain secrets. See the [deployment guide](./docs/deployment.md) for Atlas, Render, Vercel, and verification steps.

## API summary

All paths below are relative to `/api`. Except for registration, login, and health, they require `Authorization: Bearer <token>`. Roles are `student`, `driver`, and `admin`; the server always checks the current database role/status.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public, rate-limited | Create a student account or request driver/admin access (`name`, `email`, `password`, `requestedRole`) |
| `POST` | `/auth/login` | Public, rate-limited | Authenticate and return a JWT and safe user profile |
| `GET` / `PATCH` | `/auth/me` | Any active user | Read/update own profile name |
| `GET` | `/health` | Public | Read API and MongoDB readiness |
| `GET` | `/buses`, `/buses/:id` | Any active user | Read buses |
| `POST` / `PUT` / `DELETE` | `/buses[/id]` | Admin | Manage buses and driver account assignments |
| `GET` | `/routes`, `/routes/:id` | Any active user | Read routes |
| `POST` / `PUT` / `DELETE` | `/routes[/id]` | Admin | Manage routes |
| `GET` / `POST` | `/incidents` | Any active user | Read permitted incident records / report an incident |
| `GET` | `/incidents/:id` | Admin or reporter | Read one incident |
| `PUT` / `DELETE` | `/incidents/:id` | Admin | Update or remove an incident |
| `GET` / `POST` / `PUT` / `DELETE` | `/users[/id]` | Admin | Manage users; list can filter by `role`, `status`, and `approvalStatus` |
| `POST` | `/users/:id/approve`, `/users/:id/reject` | Admin | Process a pending staff access request |
| `GET` | `/dashboard/stats` | Any active user | Actual bus, route, incident, and active-trip counts |
| `GET` | `/analytics?days=7\|30\|90` | Admin | Actual bus/routes and incidents in the selected window |
| `GET` | `/trips/assigned` | Driver | List active buses assigned to the driver |
| `GET` | `/trips/active` | Any active user | Read active trips; drivers see their own trips |
| `POST` | `/trips/start` | Driver | Start trip with `{ "busId": "<id>" }` |
| `PATCH` | `/trips/:id/location` | Assigned driver | Send `{ "latitude": number, "longitude": number, "accuracy": number }` |
| `PATCH` | `/trips/:id/end` | Assigned driver or admin | End an active trip |

Success responses are JSON resources or resource arrays. Errors return a JSON `message` and an appropriate 4xx/5xx status. More detail, authorization rules, and data relationships are in [API documentation](./docs/api.md).

## Database and migration notes

The application does not seed or overwrite records on startup. New optional `Bus.driverId` and `Incident.reporterId` relationships preserve older documents. To enable driver trips, create an active driver in User Management, edit the bus, and select that account. Existing incidents without `reporterId` remain admin-visible but cannot be matched to a reporter account.

MongoDB Atlas connection and access-list setup, safe credential handling, and deployment instructions are documented in the [deployment guide](./docs/deployment.md). The API requires a reachable MongoDB connection before it begins listening.

## Deployment

Recommended arrangement: **Vercel static frontend**, **Render Node.js web service**, and **MongoDB Atlas**. Follow the [deployment guide](./docs/deployment.md) for dashboard setup and the final verification checklist. Use HTTPS because browser geolocation requires a secure context. The app uses polling rather than WebSockets, and the backend keeps no local file state. Do not seed production data. Deployment has **not** been performed or verified.

## Tests and checks

```powershell
cd E:\SmartTransit\backend
npm test
npm audit --omit=dev

cd E:\SmartTransit\frontend
npm run lint
npm run build
```

Manual QA should use student, driver, and admin accounts. Check unauthorized writes and user administration; profile name synchronization; bus/route CRUD; incident privacy and status changes; driver assignment, GPS permission denial/grant, stale marker display, and trip ending; analytics date filters/CSV; and a mobile viewport. No real GPS device or production deployment is available in this environment.

## 3–5 minute demonstration

1. Sign in as an admin and show database-backed dashboard figures.
2. Create/edit a bus and route; assign an active driver account to the bus.
3. Review incident records and update a report's status.
4. Open Analytics and export the selected actual incident window.
5. Sign in as the assigned driver, start a trip, grant device geolocation, and show the reported location or the honest permission/network error.
6. Sign in as a student and show buses, routes, the active trip marker when available, and own incident reports.
7. Attempt an admin-only page/action as a student and show the server's denied access, then sign out.

## Current limitations

- Only the latest device GPS fix is stored per active trip; no history, Socket.IO updates, route geometry, or reliable ETA/traffic model exists.
- Student and dashboard analytics are limited to data currently modeled; no ridership/trip-performance analytics are fabricated.
- Notification preferences are device-local. No push, email, or SMS provider is configured.
- Bus/route assignment remains partly legacy text data and needs a deliberate relationship migration for full referential integrity.
- Tokens remain in `localStorage` for compatibility with the current app architecture; this increases impact of any frontend XSS.
- Browser geolocation requires explicit permission and HTTPS outside localhost. A running MongoDB service/Atlas deployment is required.
