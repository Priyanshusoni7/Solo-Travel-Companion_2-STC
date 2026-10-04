# Solo Travel Companion (STC)

A platform for solo travelers to publish travel plans, find companions, join trips, make friends and chat in real time.

The repository contains two independent applications:

| Folder | Application | Tech | Default URL |
|---|---|---|---|
| [`stc/`](stc) | Backend REST + WebSocket API | Java 17, Spring Boot, Spring Security, MySQL, Redis, Cloudinary | http://localhost:8080 |
| [`frontend/`](frontend) | Web frontend | React 18, Vite, Tailwind CSS | http://localhost:5173 |

Each application is built, run and deployed on its own. The frontend talks to the backend only through its API (`VITE_API_BASE_URL`).

## Features

- Registration and session-based login (BCrypt, CSRF protection)
- Travel plans with day-by-day itineraries, cover photos and companion limits
- Explore feed with filters and search
- Join requests (send, accept, reject, cancel, leave, remove)
- Friends, blocking, real-time private chat and community chat (STOMP over SockJS)
- Profiles with trip statistics
- Admin panel (role `ADMIN`): statistics, user management, plan and chat moderation, featured packages

## Run locally

Requirements: Java 17, Node.js 20+, MySQL, Redis.

**Backend**

```bash
cd stc
cp .env.example .env      # fill in database, Redis and Cloudinary settings
./mvnw spring-boot:run    # Windows: mvnw.cmd spring-boot:run
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

See [`stc/README.md`](stc/README.md) and [`frontend/README.md`](frontend/README.md) for configuration and deployment details.
