# STC Frontend (React)

Standalone React app for **Solo Travel Companion**. It replaces the old Thymeleaf pages and talks
to the Spring Boot API in `../stc` over HTTP (REST) and WebSocket (STOMP over SockJS).
It is built, run and deployed independently of the backend.

## Stack

- React 18, React Router 6, Vite 6
- Tailwind CSS 3 (same utility classes the Thymeleaf templates used), Font Awesome 6
- axios (REST), @stomp/stompjs + sockjs-client (chat)

## Configuration

| Variable | When | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | build time | Base URL of the Spring Boot API, no trailing slash. `.env.development` sets `http://localhost:8080` for `npm run dev`. For production set it in your host's environment or in `.env.production` (see `.env.example`). |

The backend must list this app's origin in `APP_CORS_ALLOWED_ORIGINS` (see `../stc/.env.example`).

## Run locally

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. Start the backend separately (`../stc`, port 8080).

## Build

```bash
npm run build
```

Output goes to `dist/` (static files). `npm run preview` serves the build locally on port 4173.

## Deploy (pick one)

- **Docker / nginx**: `docker build --build-arg VITE_API_BASE_URL=https://your-api.example.com -t stc-frontend .`
  then `docker run -p 80:80 stc-frontend`. `nginx.conf` already falls back to `index.html` for deep links.
- **Vercel**: framework "Vite", build `npm run build`, output `dist`, env `VITE_API_BASE_URL`. `vercel.json` handles deep links.
- **Netlify / Render static site / Cloudflare Pages**: build `npm run build`, publish `dist`, env `VITE_API_BASE_URL`.
  `public/_redirects` handles deep links on Netlify; on Render add a rewrite `/*` → `/index.html`.

## How it talks to the backend

- **Session login**: `POST /api/auth/login` (form fields `email`, `password`) creates the backend HTTP
  session; axios sends the session cookie with `withCredentials: true`.
- **CSRF**: every API response carries the current token in the `X-XSRF-TOKEN` response header;
  `src/api/client.js` stores it and sends it back as the `X-XSRF-TOKEN` request header on writes.
- **WebSocket**: `new SockJS(VITE_API_BASE_URL + '/ws')`, same STOMP destinations as before.

## Structure

```
src/
  api/          axios client (base URL, CSRF, 401 handling) + endpoint functions
  context/      AuthContext (current user/role), ToastContext (notifications)
  hooks/        useStomp (STOMP/SockJS connection with auto-reconnect)
  components/   navbars, footer, route guards, shared form/layout pieces
  pages/        one component per former Thymeleaf page
  pages/travel/ plan create/edit/view, my plans, join requests
  pages/admin/  admin panel (overview, users, travel plans, packages, community)
  utils/        date/format helpers
```
