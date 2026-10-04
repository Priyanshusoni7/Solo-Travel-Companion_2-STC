<div align="center">

# 🌍 Solo Travel Companion (STC)

**Connect · Explore · Travel Together**

A full-stack platform where solo travelers publish trips, find companions, join each other's plans and chat in real time.

### 🔗 [Live Demo](https://stc-frontend-6p0m.onrender.com)

![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-6DB33F?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square)
![Redis](https://img.shields.io/badge/Redis-cache-DC382D?style=flat-square)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-black?style=flat-square)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Security](#security)
- [Roles and Admin Panel](#roles-and-admin-panel)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Travelling alone is easier with company. STC lets a traveler post a trip with a day-by-day itinerary. Others discover it, request to join, and once accepted they become friends and can chat privately. A public community room and an admin panel complete the platform.

The repository contains **two independent applications**:

| Application | Folder | Purpose | Local URL |
|---|---|---|---|
| **Backend** | [`stc/`](stc) | REST + WebSocket API (Spring Boot) | http://localhost:8080 |
| **Frontend** | [`frontend/`](frontend) | Web client (React) | http://localhost:5173 |

They are built, run and deployed separately and communicate only over HTTP and WebSocket.

**Live demo:** https://stc-frontend-6p0m.onrender.com

> Hosted on Render's free tier: the first request after a period of inactivity can take up to a minute while the server wakes up. Use Chrome or Edge; Safari blocks the cross-site login cookie on the default hosting domains.

---

## Features

**Accounts & profiles**
- Registration with profile photo, session-based login, password rules
- Editable profile with real statistics (trips hosted, trips joined, friends) and upcoming trips
- E-mail addresses are private: visible only to the account owner and admins

**Travel plans**
- Create, edit and delete plans with a day-by-day itinerary and a cover photo
- Optional maximum number of companions, with "2/3 joined" and FULL indicators
- Plans close automatically when the trip starts
- Explore feed with interest, date range, "open only" and "hide ended" filters, pagination and search

**Companions**
- Join requests: send, accept, reject, cancel, leave a trip, remove a companion
- Accepted travelers automatically become friends

**Social & chat**
- Friend requests, unfriend, block and unblock
- Real-time private chat between friends, with unread badges
- Public community chat room with history
- Clear guidance when messaging someone who is not a friend yet

**Administration**
- Role-based admin panel: platform statistics, user role and account management, plan and community moderation, featured travel packages

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Backend | Java 17, Spring Boot 3.4, Spring Security, Spring Data JPA / Hibernate, Spring WebSocket (STOMP + SockJS), Maven |
| Frontend | React 18, React Router 6, Vite 6, Tailwind CSS 3, axios, STOMP.js, SockJS client |
| Data | MySQL 8 (primary database), Redis (cache) |
| Media | Cloudinary (profile and cover images) |
| Tooling | Docker, Docker Compose, nginx (frontend container) |

---

## Architecture

```
┌───────────────────────────┐        HTTPS (REST, JSON)         ┌──────────────────────────────┐
│  React frontend (Vite)    │ ───────────────────────────────▶ │  Spring Boot API             │
│  static files on any host │ ◀─────────────────────────────── │  /api/**   (REST)            │
│                           │   WebSocket (STOMP over SockJS)   │  /ws       (real-time chat)  │
└───────────────────────────┘                                   └──────────────┬───────────────┘
                                                                               │
                                                     ┌─────────────────────────┼─────────────────────────┐
                                                     ▼                         ▼                         ▼
                                              ┌─────────────┐          ┌──────────────┐          ┌──────────────┐
                                              │   MySQL     │          │    Redis     │          │  Cloudinary  │
                                              │  (data)     │          │  (cache)     │          │  (images)    │
                                              └─────────────┘          └──────────────┘          └──────────────┘
```

- **Authentication:** Spring Security form login with a server-side HTTP session. The browser sends the session cookie with every API and WebSocket request.
- **Backend layers:** controllers → services → repositories, with DTOs at the API boundary.
- **Caching:** the explore feed is cached in Redis and evicted whenever plans or profiles change.
- **Scheduled work:** a job closes travel plans whose start date has been reached.

---

## Repository Structure

```
.
├── stc/                        Spring Boot backend
│   ├── src/main/java/com/stc/stc/
│   │   ├── config/             security, CORS, WebSocket, Redis, scheduling
│   │   ├── controllers/        REST and STOMP controllers
│   │   ├── dto/                API request/response models
│   │   ├── entity/             JPA entities
│   │   ├── repository/         Spring Data repositories
│   │   ├── services/           business logic
│   │   └── helper/             shared utilities
│   ├── src/test/               security and feature tests
│   ├── Dockerfile
│   ├── compose.yaml
│   └── .env.example
│
├── frontend/                   React frontend
│   ├── src/
│   │   ├── api/                HTTP client and endpoint functions
│   │   ├── components/         layout and shared UI
│   │   ├── context/            authentication and notifications
│   │   ├── hooks/              WebSocket (STOMP) hook
│   │   ├── pages/              application pages, incl. admin/ and travel/
│   │   └── utils/              formatting helpers
│   ├── Dockerfile, nginx.conf, vercel.json
│   └── .env.example
│
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Java (JDK) | 17 |
| Node.js | 20 or newer |
| MySQL | 8 (local or hosted) |
| Redis | 6 or newer (local install or Docker) |
| Cloudinary account | needed for image uploads |

Maven is not required; the backend includes the Maven Wrapper (`mvnw`).

### 1. Clone the repository

```bash
git clone https://github.com/Priyanshusoni7/Solo-Travel-Companion_2-STC.git
cd Solo-Travel-Companion_2-STC
```

### 2. Start Redis (if you don't have it installed)

```bash
docker run -d --name stc-redis -p 6379:6379 redis:7
```

### 3. Configure and run the backend

```bash
cd stc
cp .env.example .env        # then fill in the values (see Configuration)
```

Load the variables from `.env` into your shell, then start the API:

```bash
# macOS / Linux
set -a && source .env && set +a
./mvnw spring-boot:run
```

```powershell
# Windows PowerShell
Get-Content .env | ForEach-Object { if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim().Trim('"'), 'Process') } }
.\mvnw.cmd spring-boot:run
```

The API is ready when the log shows `Started StcApplication`. Check it at http://localhost:8080/health.

On first start Hibernate creates or updates the database tables automatically.

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The development API URL (`http://localhost:8080`) is preset in `frontend/.env.development`.

### 5. Create the first admin

Register an account in the app, add this line to `stc/.env`, and restart the backend:

```bash
APP_ADMIN_EMAILS=you@example.com
```

That account is promoted to `ADMIN` on startup. After that, admins can promote other users from the admin panel.

---

## Configuration

### Backend (`stc/.env`)

| Variable | Required | Example | Description |
|---|:---:|---|---|
| `SPRING_DATASOURCE_URL` | ✅ | `jdbc:mysql://localhost:3306/stc` | MySQL JDBC URL (hosted databases usually need `?sslMode=REQUIRED`) |
| `SPRING_DATASOURCE_USERNAME` | ✅ | `root` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | ✅ | `secret` | Database password |
| `SPRING_DATA_REDIS_URL` | ✅ | `redis://localhost:6379` | Redis connection URL |
| `CLOUDINARY_CLOUD_NAME` | ✅ | `my-cloud` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | `123456789` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | `abc...` | Cloudinary API secret |
| `APP_CORS_ALLOWED_ORIGINS` | ✅ in prod | `https://app.example.com` | Frontend origin(s) allowed to call the API, comma separated, no trailing slash. Default: `http://localhost:5173` |
| `SESSION_COOKIE_SECURE` | ✅ in prod | `true` | Send the session cookie over HTTPS only. Default: `false` |
| `SESSION_COOKIE_SAME_SITE` | – | `lax` / `none` | Use `none` when frontend and API are on different sites (see [Deployment](#deployment)). Default: `lax` |
| `APP_ADMIN_EMAILS` | – | `you@example.com` | Registered e-mails promoted to `ADMIN` at startup |
| `APP_TIMEZONE` | – | `Asia/Kolkata` | Time zone used to auto-close trips on their start date. Default: `Asia/Kolkata` |
| `PORT` | – | `8080` | HTTP port (set automatically by most hosts) |

### Frontend (`frontend/.env.*`)

| Variable | Required | Example | Description |
|---|:---:|---|---|
| `VITE_API_BASE_URL` | ✅ | `https://api.example.com` | Backend URL, no trailing slash. Read at **build time**, so rebuild after changing it |

> Never commit `.env` files with real credentials. Only `.env.example` files belong in the repository.

---

## API Overview

All endpoints are under `/api` and exchange JSON, except login (form fields) and uploads (multipart). Everything except registration, login and `/api/auth/me` requires a logged-in session.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Users | `GET /api/users/{id}`, `GET /api/users/{id}/stats`, `PUT /api/users/me`, `GET /api/search` |
| Travel plans | `GET /api/travel` (filters + paging), `GET /api/travel/mine`, `POST /api/travel`, `GET/PUT/DELETE /api/travel/{id}`, `POST /api/travel/{id}/join`, `POST /api/travel/{id}/leave`, `POST /api/travel/{id}/companions/{userId}/remove`, `POST/DELETE /api/travel/{id}/cover` |
| Join requests | `GET /api/requests/pending`, `GET /api/requests/sent`, `POST /api/requests/{id}/respond`, `POST /api/requests/{id}/cancel` |
| Friends | `GET /api/friends`, `GET /api/friends/pending`, `GET /api/friends/blocked`, `GET /api/friends/status/{userId}`, `POST /api/friends/request`, `POST /api/friends/{id}/accept`, `POST /api/friends/{id}/reject`, `POST /api/friends/block`, `POST /api/friends/unblock`, `DELETE /api/friends/{userId}` |
| Messages | `GET /api/messages/conversation/{userId}`, `GET /api/messages/unread`, `PUT /api/messages/{id}/read`, `GET /api/messages/community` |
| Admin | `/api/admin/stats`, `/api/admin/users`, `/api/admin/travel-plans`, `/api/admin/community-messages`, `/api/admin/static-plans` |
| Real-time | STOMP endpoint `/ws`. Send to `/app/chat.privateMessage`, `/app/chat.sendMessage`, `/app/chat.addUser`. Subscribe to `/user/queue/messages`, `/topic/public` |
| Health | `GET /health` |

---

## Security

- **Authentication:** Spring Security form login, server-side session, BCrypt password hashing.
- **CSRF protection:** enabled on every state-changing request. The token is returned in the `X-XSRF-TOKEN` response header and must be sent back in the `X-XSRF-TOKEN` request header (handled automatically by the frontend).
- **CORS:** restricted to the configured frontend origins, with credentials.
- **Authorization:** `/api/admin/**` requires `ROLE_ADMIN` (URL rule plus method security). Ownership checks protect plan editing, deletion, join-request decisions and message state.
- **Account status:** disabled accounts and role changes take effect on the next request, without waiting for a new login.
- **Data exposure:** API responses use DTOs; password hashes and other users' e-mail addresses are never returned.

---

## Roles and Admin Panel

| Role | Access |
|---|---|
| `USER` | Default for every registered account. Full use of the travel, social and chat features |
| `ADMIN` | Everything a user can do, plus the admin panel at `/admin` |

**Admin panel sections:**
- **Overview:** users, plans, join requests, friendships and messages at a glance
- **Users:** search, grant or revoke `ADMIN`, enable or disable accounts. An admin can't demote or disable themself, and the last active admin is protected
- **Travel plans:** search and delete any plan
- **Featured packages:** create packages with images, mark them as featured, delete them
- **Community:** review and delete community messages

---

## Testing

```bash
cd stc
./mvnw test -Dtest=SecurityConfigTest,TravelFeaturesTest
```

These run without a database. They cover authentication, CSRF, CORS, role-based access, and the travel-plan rules: join limits, auto-close, filters and ownership. The default `StcApplicationTests` context test needs a running database.

Frontend production build check:

```bash
cd frontend
npm run build
```

---

## Deployment

The two applications are deployed independently:

| Application | What gets deployed | Typical hosts |
|---|---|---|
| Backend (`stc/`) | Docker image built from `stc/Dockerfile` | Render, Railway, Fly.io, any Docker host |
| Frontend (`frontend/`) | Static files from `npm run build` (`dist/`) | Render Static Site, Vercel, Netlify, Cloudflare Pages, or `frontend/Dockerfile` (nginx) |

### Backend

1. Create a **Docker** web service with root directory **`stc`** (Dockerfile path `./Dockerfile`).
2. Provide MySQL and Redis (hosted services or add-ons) and set the [backend environment variables](#backend-stcenv).
3. In production, set at least:

   ```
   APP_CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
   SESSION_COOKIE_SECURE=true
   SESSION_COOKIE_SAME_SITE=none     # only if frontend and API are on different sites
   ```

4. Check `https://<your-backend-domain>/health` after deploying.

### Frontend

1. Create a static site with root directory **`frontend`**.
2. Build command `npm ci && npm run build`, publish directory `dist`.
3. Set `VITE_API_BASE_URL=https://<your-backend-domain>`.
4. Rewrite all paths to `/index.html`, so links like `/user/travel/myplans` work on refresh. This is preconfigured for Vercel (`vercel.json`) and Netlify (`public/_redirects`); on other hosts add a rewrite rule `/*` → `/index.html`.

### Domains and the login cookie

Login uses a session cookie set by the API domain.

- **Same site** (e.g. `app.example.com` + `api.example.com`): works in every browser with `SESSION_COOKIE_SAME_SITE=lax`. **Recommended.**
- **Different sites** (e.g. `*.vercel.app` + `*.onrender.com`, or two `*.onrender.com` subdomains): requires `SESSION_COOKIE_SAME_SITE=none` and `SESSION_COOKIE_SECURE=true`. Browsers that block third-party cookies (Safari by default, strict privacy modes) won't keep users logged in. Use a custom domain to avoid this.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows "Cannot reach the server" | Backend not running, or `VITE_API_BASE_URL` wrong (it is fixed at build time, so rebuild after changing it) |
| CORS error in the browser console | Add the exact frontend origin (scheme + host, no trailing slash) to `APP_CORS_ALLOWED_ORIGINS` and restart the backend |
| Login succeeds but you are logged out immediately | Cookie blocked: on different sites set `SESSION_COOKIE_SAME_SITE=none` + `SESSION_COOKIE_SECURE=true`, or use same-site domains |
| `403` on every POST/PUT/DELETE | CSRF token missing: requests must go through the frontend's API client, which sends `X-XSRF-TOKEN` |
| Backend fails at startup with Redis errors | Redis not reachable: check `SPRING_DATA_REDIS_URL` |
| Image upload fails | Check the Cloudinary variables; images must be under 5 MB |
| Page refresh on a deep link shows 404 | Configure the static host to rewrite `/*` to `/index.html` |

---

## License

This project is intended for educational and portfolio purposes. If you use significant parts of it, please credit the original repository.

---

<div align="center">

Made by [Priyanshusoni7](https://github.com/Priyanshusoni7) · ⭐ Star the repo if you find it useful

</div>
