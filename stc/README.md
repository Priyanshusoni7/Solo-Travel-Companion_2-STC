# STC Backend (Spring Boot API)

REST and WebSocket API for **Solo Travel Companion**. It serves no UI; the React app in [`../frontend`](../frontend) is the client.

See the [main README](../README.md) for the project overview, full configuration reference and deployment guide.

## Stack

Java 17 · Spring Boot 3.4 · Spring Security · Spring Data JPA (Hibernate) · Spring WebSocket (STOMP + SockJS) · MySQL · Redis · Cloudinary · Maven Wrapper

## Run locally

Requirements: Java 17, MySQL, Redis, a Cloudinary account.

```bash
cp .env.example .env          # fill in the values
```

```bash
# macOS / Linux
set -a && source .env && set +a
./mvnw spring-boot:run
```

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

`run-local.ps1` loads `.env` and points Redis at a local container on port 6380 (`docker run -d --name stc-redis -p 6380:6379 redis:7`).

The API listens on http://localhost:8080. Check it at `GET /health`.

## Build

```bash
./mvnw clean package -DskipTests     # → target/stc-0.0.1-SNAPSHOT.jar
java -jar target/stc-0.0.1-SNAPSHOT.jar
```

## Docker

```bash
docker build -t stc-backend .
docker compose up --build            # API + Redis; database settings come from .env
```

The `Dockerfile` is a multi-stage build (Maven → JRE). `.dockerignore` keeps `.env` and local config out of the image.

## Environment variables

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | ✅ | – | MySQL connection |
| `SPRING_DATA_REDIS_URL` | ✅ | – | Redis connection, e.g. `redis://localhost:6379` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | ✅ | – | Image uploads |
| `APP_CORS_ALLOWED_ORIGINS` | prod | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins (comma separated) |
| `SESSION_COOKIE_SECURE` | prod | `false` | `true` behind HTTPS |
| `SESSION_COOKIE_SAME_SITE` | – | `lax` | `none` if the frontend is on a different site |
| `APP_ADMIN_EMAILS` | – | – | Registered e-mails promoted to `ADMIN` at startup |
| `APP_TIMEZONE` | – | `Asia/Kolkata` | Time zone for closing trips on their start date |
| `PORT` | – | `8080` | HTTP port |

## Project layout

```
src/main/java/com/stc/stc/
├── config/        SecurityConfig, WebConfig (CORS), WebSocketConfig, RedisConfig,
│                  ActiveAccountFilter, CsrfTokenHeaderFilter, RoleMigrationRunner,
│                  TravelPlanAutoCloser
├── controllers/   Auth, User, Travel, JoinRequest, Friendship, MessageRest, Chat (STOMP),
│                  Admin, Health, ApiExceptionHandler
├── dto/           request/response models
├── entity/        User, Role, Travel, JoinRequest, Friendship, Message, CommunityMessage, StaticPlan
├── repository/    Spring Data repositories
├── services/      business logic (interfaces + impl/)
└── helper/        CurrentUser, TripClock, ...
```

## Key behaviour

- **Auth:** form login at `POST /api/auth/login` (`email`, `password`) creates an HTTP session; responses are JSON (no redirects).
- **CSRF:** the token travels in the `X-XSRF-TOKEN` response/request header.
- **Roles:** `USER` by default. `/api/admin/**` requires `ADMIN`. Role and enabled status are re-checked on every request.
- **Schema:** managed by Hibernate (`ddl-auto=update`); schema changes are additive.
- **Caching:** the explore feed (`exploreTrips`) is cached in Redis for 5 minutes and evicted on changes.
- **Scheduling:** OPEN plans whose start date has been reached are set to CLOSED (at startup and every 15 minutes).

## Tests

```bash
./mvnw test -Dtest=SecurityConfigTest,TravelFeaturesTest
```

These run without a database. `StcApplicationTests` (full context) needs a reachable database.
