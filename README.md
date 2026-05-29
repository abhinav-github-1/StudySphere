# StudySphere — Collaborative Study Room Platform

Hey there! Welcome to **StudySphere**, a collaborative online workspace built to help students and developers coordinate focus sessions, study together in virtual rooms, and stay productive. 

I built this project to solve a real student struggle: finding study buddies and maintaining focus in a remote environment. It features a premium, glassmorphic dark-theme React interface, a robust Spring Boot backend, real-time bidirectional messaging via Netty Socket.IO, and persistent tracking for focus session analytics.

---

## 🚀 The Architecture & Design Decisions

Rather than building a standard, boring CRUD app, I focused on high-performance real-time capabilities and clean architecture:

### 1. Real-Time Communication Hub (Spring Boot + Netty Socket.IO)
- **Separate Ports for REST & WebSockets:** The Spring Boot web container runs on port `8085`, handling JWT auth and standard API endpoints. A standalone high-performance **Netty-SocketIO** server runs on port `9092`, handling all persistent WebSocket connections asynchronously.
- **Dynamic Room-Based Scopes:** Sockets are organized into rooms. When joining a Study Room on the frontend, the client is subscribed to a room-specific socket channel (`room_{roomId}`). Messages, typing indicators, and session states are broadcasted only to active members in that room.
- **Targeted Notification Rooms:** Every logged-in user is subscribed to a personal target room (`user_{email}`). This lets us dispatch real-time, in-app notifications and study invitations directly to specific users without polling or broad broadcasts.

### 2. State-Tracked Study Session Timers
- **Real-Time Duration Tracker:** Focus timers are kept synchronized. When a participant starts a session, an active study session is logged in MongoDB.
- **Resilient Duration Calculation:** To prevent time drift or cheating via browser tampering, duration is calculated server-side using high-precision time differences (`java.time.Duration`) between start and end timestamps.

### 3. Bulletproof Security & Authentication
- **Stateless JWT Security Filter:** Implementing `OncePerRequestFilter` under Spring Security. Every request is verified against a signed JSON Web Token passed in the `Authorization` header.
- **Centralized Authentication Context:** Standardized controllers by inheriting from `BaseController`, eliminating redundant code to fetch the active user context from the security context holder.

### 4. Custom Global Domain Exception Mapping
- Removed generic `RuntimeException` throws. Built a clean hierarchy of custom business exceptions (`ResourceNotFoundException`, `UnauthorizedActionException`, `InvalidActionException`) mapped via `@ControllerAdvice` to appropriate HTTP statuses.

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite, Tailwind CSS (v4) with custom radial gradients, Axios, Socket.IO Client.
- **Backend:** Spring Boot 3.x, Spring Security, Netty-SocketIO, Lombok, MongoDB (supporting MongoDB Atlas).
- **Database:** MongoDB Atlas (Cloud Cluster).

---

## 📂 Project Structure

```
StudyRoom/
│
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/           # Reusable components (MessageBubble, TypingIndicator, SessionTimer)
│   │   ├── pages/                # Views (Dashboard, Study Room Details, Invitations, Notifications)
│   │   ├── services/             # Axios API / Authentication wrappers
│   │   ├── socket/               # Real-time Socket.IO clients
│   │   ├── utils/                # Unified date/time formatting utilities (date.js)
│   │   ├── App.jsx               # Routes and layouts
│   │   └── index.css             # Main styling, custom animations, glassmorphism tokens
│   └── package.json
│
└── backend/                      # Spring Boot REST & Socket API
    ├── src/main/java/com/collaborative/studyroom/
    │   ├── controller/           # Clean REST APIs extending BaseController
    │   ├── service/              # Core business services throwing Domain Exceptions
    │   ├── repository/           # MongoDB Atlas repositories
    │   ├── exception/            # Custom domain exception package
    │   ├── model/                # Data entities (RoomInvitation, StudySession, User)
    │   ├── config/               # Security, Global Exceptions, and WebSocket configurations
    │   └── websocket/            # Socket.IO Event Handlers
    ├── src/main/resources/
    │   └── application.properties # MongoDB Atlas cloud connection string
    └── pom.xml
```

---

## 🏁 Getting Started

Here's how to spin up the project locally on your machine.

### Prerequisites
- **Node.js** (v18+)
- **Java JDK 17** or higher

---

### 1. Database Setup
The backend is configured to connect directly to the MongoDB Atlas Cloud Cluster. Ensure the database connection string in `backend/src/main/resources/application.properties` is configured correctly:
```properties
spring.data.mongodb.uri=mongodb+srv://StudySphere:abhi%40123@cluster0.ysygd98.mongodb.net/studyroom?retryWrites=true&w=majority&appName=Cluster0
```

---

### 2. Run the Backend Server
The backend contains a self-bootstrapping Maven Wrapper, meaning you don't even need Maven installed globally!

1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Compile and run the Spring Boot app:
   ```cmd
   .\mvnw.cmd spring-boot:run
   ```
   *(On macOS or Linux, run `./mvnw spring-boot:run`)*
3. The REST API container will spin up on **`http://localhost:8085`** and the Netty Socket.IO engine will boot on port **`9092`**.

---

### 3. Run the Frontend Client
1. Go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot up the Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the gorgeous client interface at **`http://localhost:5173`**. Log in or register a new account, create a study room, invite your friends, and start focusing!
