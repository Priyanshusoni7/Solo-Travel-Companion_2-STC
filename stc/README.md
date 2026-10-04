# 🌍 Solo Travel Companion (STC)

<div align="center">

### Connect • Explore • Travel Together

A full-stack web application that helps solo travelers discover travel partners, create travel plans, communicate in real-time, and build meaningful travel communities.

---

![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?style=for-the-badge)
![Redis](https://img.shields.io/badge/Redis-Caching-red?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?style=for-the-badge)
![WebSocket](https://img.shields.io/badge/WebSocket-Real_Time-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge)

</div>

---

# 📑 Table of Contents

- Project Overview
- Features
- Tech Stack
- Architecture
- Project Structure
- Installation
- Running with Docker
- Environment Variables
- Authentication
- Redis
- WebSocket
- Project Modules
- Performance
- Troubleshooting
- FAQ
- Contributing
- License

---

# 🔄 Architecture Update: React frontend + ADMIN role

This repository folder (`stc/`) is now the **Spring Boot backend only**: a REST + WebSocket API.
The UI is a separate React application in `../frontend` with its own dev server, build and deployment.
Thymeleaf has been removed. Users now have a role (`USER` or `ADMIN`) and admins get an admin panel.

| | Backend (`stc/`) | Frontend (`../frontend/`) |
|---|---|---|
| Run locally | `mvnw spring-boot:run` → http://localhost:8080 | `npm run dev` → http://localhost:5173 |
| Build | `mvnw clean package` (API jar, no UI) | `npm run build` (static `dist/`) |
| Deploy | Dockerfile (unchanged approach) | any static host / its own Dockerfile |

---

# 📖 Project Overview

Solo Travel Companion (STC) is a full-stack travel networking platform designed specifically for solo travelers.

Instead of travelling alone, users can create travel plans, discover people with similar destinations, send join requests, become friends, chat privately in real time, and participate in a shared travel community.

The application focuses on making solo travel safer, more social, and easier to organize by combining travel planning, real-time communication, caching, and containerized deployment into one platform.

This project demonstrates modern backend development using Spring Boot along with Docker, Redis, WebSockets, Spring Security, Cloudinary, and MySQL.

---

# 🚀 Quick Start

```bash
git clone https://github.com/Priyanshusoni7/Solo-Travel-Companion_2-STC.git

cd Solo-Travel-Companion_2-STC

cp .env.example .env

# Update your environment variables

mvnw.cmd clean package

docker compose up --build
```

Open your browser:

```
http://localhost:8080
```

---

# ✨ Key Features

## 👤 User Management

- User Registration
- Secure Login
- BCrypt Password Encryption
- Profile Management
- User Search
- Authentication using Spring Security

---

## ✈ Travel Planning

Users can

- Create Travel Plans
- Edit Travel Plans
- Delete Travel Plans
- Browse Travel Plans
- View Complete Trip Details

Every travel plan contains information such as

- Destination
- Travel Date
- Description
- Maximum Participants
- Travel Preferences

---

## 🤝 Join Request System

Travelers can request to join another user's trip.

Features include

- Send Join Request
- Accept Request
- Reject Request
- View Pending Requests
- View Sent Requests
- View Joined Travelers

This creates a collaborative travel planning experience.

---

## 👥 Friendship System

After users interact, they can become friends.

Features

- Friend List
- Friend Requests
- Private Communication
- Friend-based Chat Access

---

## 💬 Real-Time Private Chat

The application provides instant messaging using

- Spring WebSocket
- STOMP
- SockJS

Features

- Live Messaging
- Message History
- Friend-to-Friend Communication
- Persistent Chat Storage

---

## 🌎 Community Chat

A public community allows travelers to communicate together.

Features

- Shared Chat Room
- Persistent Messages
- Message History
- Real-Time Updates

---

## 🚀 Dashboard

Every authenticated user gets a personalized dashboard.

Dashboard includes

- User Profile
- Travel Statistics
- Active Trips
- Joined Trips
- Pending Requests
- Friends
- Community Access

---

## 🖼 Image Upload

Images are uploaded securely using Cloudinary.

Benefits

- Secure Cloud Storage
- Fast Image Delivery
- Reduced Server Storage
- Reliable CDN

---

## ⚡ Redis Caching

Redis is used to improve application performance.

Currently cached

- Explore Travel Plans

Benefits

- Faster Response Time
- Reduced Database Load
- Improved User Experience

---

## 🐳 Docker Support

The application is fully containerized.

Includes

- Dockerfile
- Docker Compose
- Environment Variable Support

The project can be started with a single command.

---

# 🛠 Tech Stack

## Backend

- Java 17
- Spring Boot
- Spring MVC
- Spring Security
- Spring Data JPA
- Hibernate
- Spring WebSocket
- STOMP
- SockJS
- Redis
- Maven

---

## Frontend (separate app in `../frontend`)

- React 18 + React Router
- Vite
- Tailwind CSS
- axios, STOMP.js + SockJS

---

## Database

- MySQL

---

## Caching

- Redis

---

## Cloud Storage

- Cloudinary

---

## Containerization

- Docker
- Docker Compose

---

## Build Tool

- Maven

---

# 🏗 System Architecture

```
                Browser
                    │
                    │
         HTML • CSS • JavaScript
                    │
                    ▼
             Spring MVC Controller
                    │
                    ▼
                 Services
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
     MySQL Database        Redis Cache
         │
         ▼
    Cloudinary Storage

Real-Time Communication

Browser
    │
SockJS
    │
STOMP
    │
Spring WebSocket
    │
Broadcast Messages
```

---

# 📂 Project Structure

```
stc
│
├── src
│   ├── main
│   │   ├── java
│   │   │   ├── config
│   │   │   ├── controllers
│   │   │   ├── dto
│   │   │   ├── entity
│   │   │   ├── helper
│   │   │   ├── repository
│   │   │   ├── services
│   │   │   └── services/impl
│   │   │
│   │   └── resources
│   │       ├── static
│   │       ├── templates
│   │       └── application.properties
│   │
│   └── test
│
├── Dockerfile
├── compose.yaml
├── pom.xml
├── .env.example
├── README.md
└── .gitignore
```

---

# 🎯 Major Functional Modules

- Authentication
- User Management
- Travel Planning
- Join Request Management
- Friendship System
- Private Messaging
- Community Chat
- Dashboard
- Redis Caching
- Docker Deployment
- Cloudinary Integration

---

# 🔒 Security

The project uses Spring Security.

Security Features

- BCrypt Password Encoding
- Session-based login (Spring Security form login, JSON responses for the React app)
- CSRF protection (token exchanged via the X-XSRF-TOKEN header)
- CORS restricted to the configured frontend origin(s)
- Role-based access control: USER and ADMIN (`/api/admin/**` requires ADMIN)

No JWT or OAuth has been used in this project.

---

# ⚙️ Environment Variables

The project uses environment variables to securely manage sensitive configuration values such as database credentials, Cloudinary configuration, and Redis settings.

Create a `.env` file in the project root using `.env.example` as a reference.

Example:

```env
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/stc
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
```

**Never commit your `.env` file to GitHub.**

Only `.env.example` is included in this repository.

---

# 💻 Running the Application Locally (Without Docker)

## Prerequisites

Install the following software before running the project.

- Java 17
- Maven
- MySQL
- Redis
- Git

---

## Clone Repository

```bash
git clone https://github.com/Priyanshusoni7/Solo-Travel-Companion_2-STC.git
```

```bash
cd Solo-Travel-Companion_2-STC
```

---

## Configure Environment Variables

Create a `.env` file in the project root.

Fill in your

- MySQL credentials
- Cloudinary credentials
- Redis configuration

---

## Create Database

Open MySQL and create a database.

```sql
CREATE DATABASE stc;
```

Hibernate will automatically create the required tables when the application starts.

---

## Start Redis

Start Redis before launching the application.

Linux

```bash
redis-server
```

Windows

Start Redis using Docker or your installed Redis service.

---

## Build the Project

Using Maven Wrapper

Windows

```bash
mvnw.cmd clean package
```

Linux / macOS

```bash
./mvnw clean package
```

---

## Run the Application

Using Maven Wrapper

Windows

```bash
mvnw.cmd spring-boot:run
```

Linux

```bash
./mvnw spring-boot:run
```

Or run the generated JAR file.

```bash
java -jar target/stc-0.0.1-SNAPSHOT.jar
```

---

## Access Application

Open your browser.

```
http://localhost:8080
```

---

# 🐳 Running the Application Using Docker

The project includes

- Dockerfile
- Docker Compose

which makes running the application significantly easier.

---

## Step 1

Clone the repository.

```bash
git clone https://github.com/Priyanshusoni7/Solo-Travel-Companion_2-STC.git
```

---

## Step 2

Navigate into the project.

```bash
cd Solo-Travel-Companion_2-STC
```

---

## Step 3

Create your `.env` file.

Refer to `.env.example`.

---

## Step 4

Build the project.

Windows

```bash
mvnw.cmd clean package
```

Linux

```bash
./mvnw clean package
```

---

## Step 5

Start Docker containers.

```bash
docker compose up --build
```

Docker Compose will

- Build the Spring Boot application
- Create the application container
- Start Redis
- Connect the containers together

---

## Stop Containers

```bash
docker compose down
```

---

## Rebuild Containers

```bash
docker compose up --build
```

---

# 🗄 Database Configuration

The project uses **MySQL** as its primary database.

Spring Data JPA together with Hibernate automatically manages entity persistence.

Hibernate is configured to generate database tables based on entity classes.

Current entities include

- User
- Travel
- Friendship
- JoinRequest
- Message
- CommunityMessage
- StaticPlan

---

# ⚡ Redis Configuration

Redis is integrated to improve application performance.

Current cache implementation

- Explore Travel Plans

Benefits

- Faster page loading
- Reduced database queries
- Improved scalability
- Better response time

Redis runs on

```
localhost:6379
```

or through Docker Compose.

---

# ☁ Cloudinary Configuration

Cloudinary is used for storing uploaded images.

Benefits

- Cloud Storage
- CDN Delivery
- Faster Image Loading
- Reduced Server Storage

Required Environment Variables

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# 🔐 Authentication Flow

Authentication is handled using Spring Security.

Workflow

```
User
   │
   ▼
Login Form
   │
   ▼
Spring Security
   │
   ▼
Authentication Manager
   │
   ▼
UserDetailsService
   │
   ▼
Database
   │
   ▼
Authenticated Session
```

Passwords are encrypted using BCrypt before being stored in the database.

---

# 💬 Real-Time Chat Architecture

Private messaging and community chat are implemented using WebSockets.

Technology Stack

- Spring WebSocket
- STOMP
- SockJS

Workflow

```
Browser

↓

SockJS

↓

STOMP

↓

Spring WebSocket

↓

Chat Controller

↓

Broadcast

↓

Connected Clients
```

Messages are stored in MySQL, allowing chat history to persist across sessions.

---

# 📦 Build Commands

Clean project

```bash
mvnw.cmd clean
```

Compile

```bash
mvnw.cmd compile
```

Package

```bash
mvnw.cmd package
```

Run

```bash
mvnw.cmd spring-boot:run
```

Run Tests

```bash
mvnw.cmd test
```

---

# 📁 Important Configuration Files

| File | Purpose |
|------|----------|
| `application.properties` | Main Spring Boot configuration |
| `.env` | Local environment variables |
| `.env.example` | Sample environment variables |
| `Dockerfile` | Spring Boot Docker image |
| `compose.yaml` | Multi-container configuration |
| `pom.xml` | Maven dependencies |
| `.gitignore` | Git ignore rules |

---

# 🏛 Application Architecture

The project follows a layered architecture to keep responsibilities separated and the codebase maintainable.

```
                Client (Browser)
                       │
                       ▼
              Spring MVC Controllers
                       │
                       ▼
                  Service Layer
                       │
                       ▼
                Repository Layer
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        MySQL Database      Redis Cache
```

### Controller Layer

Responsible for

- Receiving HTTP requests
- Validating incoming data
- Calling the appropriate service
- Returning views or responses

Examples

- UserController
- TravelController
- FriendshipController
- ChatController
- MessageRestController

---

### Service Layer

Contains the application's business logic.

Responsibilities

- Travel management
- Authentication
- Friend management
- Join request handling
- Chat handling
- Redis caching
- Cloudinary integration

---

### Repository Layer

Responsible for communicating with the database.

Uses

- Spring Data JPA
- Hibernate

Repositories include

- UserRepo
- TravelRepo
- MessageRepository
- FriendshipRepository
- JoinRequestRepository
- CommunityMessageRepository
- StaticPlanRepository

---

# 🧩 Project Modules

## Authentication Module

Handles

- User Registration
- Login
- Session Authentication
- Logout

Technologies

- Spring Security
- BCrypt

---

## User Module

Responsible for

- User Profile
- Searching Users
- Updating User Information

---

## Travel Module

Core functionality of the application.

Features

- Create Travel Plan
- Edit Travel Plan
- Delete Travel Plan
- Browse Travel Plans
- View Plan Details

---

## Join Request Module

Allows users to request participation in another user's trip.

Includes

- Send Request
- Accept Request
- Reject Request
- Pending Requests
- Sent Requests

---

## Friendship Module

Responsible for

- Friend List
- Friend Relationships
- Private Chat Access

---

## Private Chat Module

Enables communication between friends.

Features

- Instant Messaging
- Persistent Messages
- Conversation History

---

## Community Chat Module

Public communication channel for all users.

Features

- Shared Chat Room
- Real-Time Updates
- Persistent Message History

---

## Dashboard Module

Displays

- User Profile
- Created Trips
- Joined Trips
- Pending Requests
- Friends
- Community Access

---

# 🔄 Request Lifecycle

Every request follows the same processing pipeline.

```
Client

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Service

↓

Controller

↓

View
```

This separation improves

- Maintainability
- Testability
- Scalability

---

# ⚡ Redis Cache Flow

The Explore Trips page uses Redis caching to reduce unnecessary database queries.

```
User opens Explore Page

↓

Check Redis

↓

Cache Exists?

      │
 ┌────┴─────┐
 │          │
Yes         No
 │          │
 ▼          ▼
Return   Query MySQL
Cache         │
              ▼
        Store in Redis
              │
              ▼
        Return Response
```

Benefits

- Reduced database load
- Faster response time
- Improved scalability

---

# 💬 WebSocket Communication Flow

```
Browser

↓

SockJS

↓

STOMP

↓

Spring WebSocket

↓

Chat Controller

↓

Message Service

↓

Database

↓

Broadcast

↓

Connected Clients
```

This allows messages to appear instantly without refreshing the page.

---

# 🔒 Spring Security Workflow

```
Login Form

↓

Spring Security Filter Chain

↓

Authentication Manager

↓

UserDetailsService

↓

Database

↓

BCrypt Password Verification

↓

Authenticated Session

↓

Protected Resources
```

The application uses session-based authentication rather than JWT.

---

# 🐳 Docker Architecture

The project is fully containerized.

```
Docker Compose

├── Spring Boot Container
│
└── Redis Container
```

Responsibilities

Spring Boot Container

- Runs the backend
- Connects to MySQL
- Connects to Redis
- Serves the REST/WebSocket API used by the React frontend

Redis Container

- Stores cached data
- Improves performance
- Reduces database load

---

# 🎯 Design Decisions

## Why Spring Boot?

- Rapid development
- Production-ready ecosystem
- Excellent dependency management
- Strong community support

---

## Why a separate React frontend?

- Frontend and backend can be developed, built and deployed independently
- Rich client-side interactions (chat, search, admin panel) without full page reloads
- The backend becomes a clean API that other clients could reuse

---

## Why MySQL?

- Reliable relational database
- ACID compliance
- Excellent support with Spring Data JPA

---

## Why Redis?

Redis is used to cache frequently accessed data.

Benefits

- Lower database load
- Better scalability
- Faster responses

---

## Why Docker?

Docker ensures that the application runs consistently across different environments.

Advantages

- Simplified deployment
- Environment consistency
- Easy setup for new developers
- Reduced configuration issues

---

## Why Cloudinary?

Instead of storing images locally,

Cloudinary provides

- Secure cloud storage
- Automatic image optimization
- CDN delivery
- Better scalability

---

# 🚀 Performance Optimizations

Implemented optimizations include

- Redis Caching
- Lazy Database Access using JPA
- Optimized Repository Queries
- Environment Variable Configuration
- Dockerized Deployment
- Cloud Image Storage

---

# 📈 Future Improvements

Potential enhancements include

- Email Verification
- Password Reset
- Push Notifications
- Google Maps Integration
- Travel Recommendations
- AI-based Travel Matching
- JWT Authentication
- OAuth Login
- Mobile Application
- REST API for Mobile Clients

---

# 📚 What This Project Demonstrates

This project showcases practical experience with

- Object-Oriented Programming
- MVC Architecture
- Layered Architecture
- Spring Boot Development
- Authentication & Authorization
- Database Design
- Docker
- Redis
- WebSockets
- Real-Time Communication
- Cloud Storage Integration
- Version Control using Git & GitHub
- Production-Oriented Development Practices

---

# 🛠 Troubleshooting

This section covers common issues you may encounter while setting up or running the application.

---

## MySQL Connection Failed

**Possible Causes**

- MySQL server is not running
- Incorrect database credentials
- Database does not exist
- Wrong JDBC URL

**Solution**

- Start the MySQL service
- Verify username and password
- Create the database if it does not exist
- Check your `.env` configuration

---

## Redis Connection Failed

**Symptoms**

- Application startup fails
- Cache-related exceptions
- Redis connection timeout

**Solution**

Ensure Redis is running.

Linux

```bash
redis-server
```

Verify the connection.

```bash
redis-cli
PING
```

Expected output

```
PONG
```

---

## Docker Build Failed

Possible reasons

- Docker Desktop is not running
- Internet connection issues
- Maven build failed
- Invalid Docker configuration

Try rebuilding.

```bash
docker compose down
docker compose up --build
```

---

## Port Already in Use

If port **8080** is already occupied, change the application's port.

Example

```properties
server.port=8081
```

---

## Images Not Uploading

Verify

- Cloudinary credentials
- Internet connection
- Environment variables
- Cloudinary account configuration

---

## Maven Build Failed

Clean the project first.

```bash
mvnw.cmd clean
```

Then rebuild.

```bash
mvnw.cmd package
```

---

## WebSocket Not Working

Verify that

- User is authenticated
- SockJS is loaded
- STOMP endpoint is correct
- Browser console contains no JavaScript errors
- Spring Boot application is running

---

# ❓ Frequently Asked Questions

### Why is Redis used?

Redis caches frequently accessed data, reducing database load and improving response times.

---

### Why use Docker?

Docker provides a consistent environment, making setup and deployment much easier across different machines.

---

### Where is the UI?

In the separate React app (`../frontend`). The Thymeleaf templates were migrated to React components.

---

### Does this project support real-time chat?

Yes.

Private and community chat are implemented using Spring WebSocket, STOMP, and SockJS.

---

### Is user authentication secure?

Yes.

The project uses

- Spring Security
- BCrypt password hashing
- Session-based authentication

---

### Is Redis required?

Redis is recommended for caching features. If disabled, the application will still work but may have reduced performance for cached endpoints.

---

# 🧑‍💻 Development Workflow

The recommended workflow while contributing or extending the project is:

1. Clone the repository.
2. Create a feature branch.
3. Implement changes.
4. Test locally.
5. Commit with meaningful messages.
6. Push the branch.
7. Open a Pull Request.

Example

```bash
git checkout -b feature/add-trip-filter
git add .
git commit -m "Add destination filter for travel plans"
git push origin feature/add-trip-filter
```

---

# 📋 Coding Standards

This project follows standard Java and Spring Boot best practices.

- Follow Java naming conventions.
- Keep controllers lightweight.
- Place business logic in services.
- Use repositories only for database access.
- Avoid hardcoded secrets.
- Use environment variables for configuration.
- Write meaningful commit messages.
- Keep methods small and focused.

---

# 🤝 Contributing

Contributions are welcome!

If you'd like to improve this project:

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

Please ensure that your code follows the existing project structure and coding standards.

---

# 📝 License

This project is intended for educational and portfolio purposes.

Feel free to fork and learn from the codebase.

If you use significant portions of this project, please provide appropriate credit to the original repository.

---

# 🙏 Acknowledgements

Special thanks to the open-source community and the developers behind the technologies used in this project.

- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- Redis
- Docker
- MySQL
- React
- Cloudinary
- Maven
- SockJS
- STOMP

---

# 📬 Contact

**Author:** Priyanshu Soni

If you have any questions, suggestions, or feedback, feel free to connect through GitHub.

---

# ⭐ Support the Project

If you found this project useful or learned something from it:

- ⭐ Star the repository
- 🍴 Fork the project
- 🛠 Contribute improvements
- 📢 Share it with others

Your support is greatly appreciated!

---

# 📌 Final Notes

Solo Travel Companion (STC) is a demonstration of building a modern, production-oriented Spring Boot application by integrating multiple technologies into a cohesive full-stack solution.

The project emphasizes clean architecture, real-time communication, caching, secure authentication, cloud-based media storage, and containerized deployment while maintaining a modular and maintainable codebase.

Thank you for checking out this project!

Happy Coding! 🚀