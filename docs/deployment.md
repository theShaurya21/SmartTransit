# SmartTransit deployment and verification

This guide matches the repository layout: `backend/` is the Express API and `frontend/` is the Vite SPA. It does not require source-code changes or relaxed startup checks. Do not paste credentials into chat, commit them, or place them in a frontend variable.

## Environment variables from the application code

| Variable | Where | Requirement / purpose |
|---|---|---|
| `MONGO_URI` | Backend | Required to start the API and to run `npm run create-admin`. |
| `JWT_SECRET` | Backend | Required to start the API; minimum 32 characters. Keep stable between routine deployments to preserve existing sessions. |
| `CORS_ORIGINS` | Backend | Required when `NODE_ENV=production`. Comma-separated exact browser origins, with scheme and hostname only, no path or trailing slash. |
| `NODE_ENV` | Backend | Set to `production` on Render. |
| `PORT` | Backend | Optional locally (defaults to `5000`); Render sets this automatically. |
| `VITE_API_URL` | Frontend build | Set on Vercel to the deployed API base URL ending in `/api`. Vite embeds it in the public build; it is not a secret. The code fallback is for local development. |
| `BOOTSTRAP_ADMIN_NAME` | Backend, temporary | Used only by the explicit `npm run create-admin` script. |
| `BOOTSTRAP_ADMIN_EMAIL` | Backend, temporary | Used only by the explicit `npm run create-admin` script. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Backend, temporary | Used only by the explicit `npm run create-admin` script; minimum 12 characters and maximum 72 UTF-8 bytes. Remove after provisioning. |

`MONGO_URI` and `JWT_SECRET` are always required for the API process. `CORS_ORIGINS` is required when `NODE_ENV` is `production`. The three bootstrap values are not needed by the running service after the first administrator has been created.

## 1. Create and secure the MongoDB Atlas database

1. In MongoDB Atlas, create or select a project and create a cluster. Choose a region near the Render service.
2. In **Security → Database Access**, create a password-authenticated database user for the app. Grant only read/write privileges on the SmartTransit database (use a scoped/custom role if needed); do not use an Atlas organization/project owner or a role that grants access to every database.
3. In **Security → Network Access**, add a development machine's public IP as a temporary `/32` entry only if you will provision the first admin or test locally. Remove it when no longer needed.
4. Deploy the Render service before finalizing its Atlas allowlist entry. On the Render service details page, open **Connect → Outbound** and copy the outbound IP ranges for its selected region. Add those ranges to the Atlas project's **Network Access** IP access list. If the Render account offers dedicated outbound IPs, those can be used instead. Do not use `0.0.0.0/0` for a production database.
5. In Atlas, open the cluster's **Connect → Drivers** instructions and copy the Node.js connection URI. Replace the username/password/database placeholders with the database user's credentials and the SmartTransit database name. Percent-encode reserved characters in the username or password (such as `@`, `:`, `/`, `?`, `#`, or `%`) before inserting them into the URI; retain Atlas's query options.
6. Store the complete URI only in Render's backend `MONGO_URI` environment variable or in a private local `backend/.env`. Do not commit it or put it in `VITE_API_URL`.

The URI shape below is a template only. The angle-bracketed parts are placeholders, not literal values; Atlas supplies the cluster host and recommended connection options.

```text
mongodb+srv://<encoded-database-user>:<encoded-password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
```

## 2. Generate a JWT secret locally

Run this in a local PowerShell terminal with Node.js installed:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy the result directly into Render's private `JWT_SECRET` value. Do not send it to anyone or paste it into source files, screenshots, chat, or a Vite variable. The generated value exceeds the 32-character minimum. Keep it stable across routine deploys; rotating it invalidates existing JWT sessions.

For local development, create `backend/.env` from `backend/.env.example` and replace the placeholders locally. Keep the real file private. The root and frontend `.gitignore` rules exclude `.env` and `.env.*` while allowing `.env.example`.

## 3. Deploy the backend to Render

1. In the Render Dashboard, choose **New → Web Service**, connect the Git provider, and select this repository and the branch to deploy.
2. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime/Language:** Node.js. The current Render default (24.22.1 as of 2026-10-29) is compatible; if pinning a version, use 22.12+ or 20.19+.
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health` (in Advanced settings, if shown)
3. Add these values in the service's **Environment** settings:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = the private Atlas URI from step 1
   - `JWT_SECRET` = the locally generated value
   - `CORS_ORIGINS` = the exact Vercel frontend origin, e.g. `https://your-app.vercel.app`; no trailing slash or `/api`
4. Do not manually set `PORT` on Render; the platform injects it. The server binds to `0.0.0.0`.
5. Create the service and wait for its deploy to succeed. Use **Connect → Outbound** to finish the Atlas Network Access allowlist described above. If Atlas access was not yet allowed, the process will fail to start; add the correct ranges and redeploy.
6. Record the Render service's public HTTPS URL, e.g. `https://your-service.onrender.com`. Its health endpoint is `https://your-service.onrender.com/api/health`.

The health endpoint returns HTTP 200 with `{"status":"ok","database":"connected"}` only when Mongoose reports a live database connection. A healthy response alone does not verify authenticated API operations or data persistence.

## 4. Deploy the frontend to Vercel

1. In the Vercel Dashboard, choose **Add New → Project**, import this repository, and configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (or allow Vercel to detect Vite)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
2. Add `VITE_API_URL` under the project's **Settings → Environment Variables** for the **Production** environment. Set it to the Render HTTPS URL ending in `/api`, e.g. `https://your-service.onrender.com/api`. Do not add a trailing slash. Vite compiles this into the frontend at build time; it must not contain credentials.
3. Deploy the frontend and note its canonical Production domain, e.g. `https://your-app.vercel.app`. Ensure Render's `CORS_ORIGINS` is exactly that origin (scheme and hostname only). If the domain changes, update the Render environment and redeploy. To permit additional frontend origins, list each exact origin separated by commas.
4. If `VITE_API_URL` changes, trigger a new Vercel deployment so the new value is compiled. `frontend/vercel.json` rewrites SPA deep links to `/index.html`.

Set `CORS_ORIGINS` to the origin that the browser uses, not the backend URL. Do not use a wildcard. Preview domains are separate origins; allow only the exact preview domains you intend to use.

## 5. Provision the first administrator

There is no automatic admin seed or public admin registration. From a trusted local machine, use a private `backend/.env` containing `MONGO_URI` and temporary `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` values, then run:

```powershell
cd E:\SmartTransit\backend
npm run create-admin
```

The database user must have `readWrite` access, and the local public IP must temporarily be on the Atlas allowlist. Remove the bootstrap password from the local environment immediately after success. The script refuses to alter an account that already exists.

## Final deployment verification checklist

Use test accounts and records. Avoid destructive tests against real operational data; clean up only records you created and have confirmed are safe to remove.

- [ ] **Backend readiness:** open `https://<render-service>.onrender.com/api/health`; confirm HTTP 200 and `{"status":"ok","database":"connected"}`. Confirm Render logs show successful startup and no missing-variable or Atlas connection errors.
- [ ] **Frontend/API configuration:** open the Vercel Production site; confirm login/register requests reach the Render `/api` URL without browser CORS errors. Confirm `VITE_API_URL` contains no credentials and ends in `/api`.
- [ ] **Authentication:** register a test student, log in, reload the page, and confirm the session works. Verify an invalid password is rejected. Request driver/admin access and confirm the account remains pending with no elevated role until an admin approves it.
- [ ] **MongoDB persistence:** create a test record, fetch it again, redeploy or restart the backend, and fetch it again. Confirm the record remains in Atlas rather than a local database.
- [ ] **Buses:** as admin, create and read a test bus; update it and confirm the change persists. As a student, verify the bus is readable but create/update/delete requests are denied.
- [ ] **Routes:** as admin, create/read/update a test route and confirm persistence. Verify non-admin route mutations are denied.
- [ ] **Incidents:** as a student, create a test incident and confirm it persists and is visible to its reporter. Confirm another student cannot read it, while an admin can review it and update its status.
- [ ] **User authorization:** as admin, list users and create a test driver. Confirm student/driver requests to admin-only user-management endpoints are denied. Verify that changing/deactivating the test account takes effect for protected requests; do not disable your only admin account.
- [ ] **CORS:** confirm requests from the configured Vercel origin succeed and an unapproved browser origin is rejected. Keep production origins exact.

Record the actual deployment URLs and test outcome outside the repository. Do not report the database or deployment as verified until these checks have been performed against live services.

## Provider references

- [Render Web Services](https://render.com/docs/web-services)
- [Render outbound IP addresses](https://render.com/docs/outbound-ip-addresses)
- [Render health checks](https://render.com/docs/health-checks)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel Vite SPA rewrites](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)
- [MongoDB Atlas IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [MongoDB Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)
- [MongoDB Atlas connection strings](https://www.mongodb.com/docs/atlas/connect-your-application/)
