# AWS Backend Test API & Playground

A clean, modular Express API built to demonstrate and learn AWS deployment strategies. This version includes an interactive **API Playground UI** served directly from the root route (`/`), interactive **Swagger UI** docs (`/api-docs`), and multi-container orchestrations using **Docker Compose** with **Redis Caching**.

---

## Folder Structure
```
aws-backend-test/
├── config/
│   ├── environment.js        # Configures port, node env, and dotenv
│   ├── redis.js              # Redis cache server connection setup
│   └── swagger.js            # Swagger API documentation definition
├── controllers/
│   └── item.controller.js    # Business logic for items with Redis Caching
├── middlewares/
│   └── errorHandler.js       # Handles 404 routes and global application errors
├── public/
│   └── index.html            # Statically served API Playground dashboard UI
├── routes/
│   ├── health.routes.js      # Health check (with Redis status) and info endpoints
│   └── item.routes.js        # Item resource endpoints (CRUD)
├── app.js                    # Express app setup, CORS, static file routing, Swagger docs
├── index.js                  # App entry point (listens on port & handles shutdown)
├── package.json              # Project configuration and script runners
├── Dockerfile                # Production-optimized Docker container recipe
├── .dockerignore             # Excludes unnecessary files from container builds
├── docker-compose.yml        # Orchestrates Backend and Redis containers
├── .env                      # Application environment variables (not committed)
├── .gitignore                # Excludes node_modules and .env from Git
└── README.md                 # Project guide & AWS deployment instructions
```

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file at the root:
```env
PORT=5000
NODE_ENV=development
APP_NAME="AWS Deployment Demo API"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 3. Run the Development Server
```bash
npm start
```
By default, the server runs on `http://localhost:5000`. 
- Access the **API Playground UI**: `http://localhost:5000`
- Access the **Swagger Docs UI**: `http://localhost:5000/api-docs`

*Note: If Redis is offline locally, the app will warn you in the console and dynamically fall back to standard in-memory array operations without crashing.*

---

## Running with Docker Compose (Multi-Container Setup)

To run the full stack including the Express backend and Redis cache container, use Docker Compose.

### 1. Start Services
Build and start both services in the background:
```bash
docker-compose up --build -d
```

### 2. Verify Services are Running
Check status of the containers:
```bash
docker-compose ps
```
You should see:
- `backend-container` listening on `0.0.0.0:5000->5000/tcp`
- `redis-container` listening on `0.0.0.0:6379->6379/tcp`

Navigating to `http://localhost:5000` will show **Redis Cache: CONNECTED** on the dashboard.

### 3. Check Logs
View merged live logs for all services:
```bash
docker-compose logs -f
```

### 4. Stop Services
Stop and remove containers and network attachments:
```bash
docker-compose down
```

---

## Redis Caching Details

- **GET /api/items**: First queries Redis using the key `items`.
  - **Cache Hit**: Data is returned instantly from Redis (`source: "cache"`).
  - **Cache Miss**: Data is fetched from database (`source: "database"`), stored in Redis cache, and returned.
- **POST/PUT/DELETE**: Modifying items triggers cache invalidation (`del("items")`), ensuring the next read gets the freshest database state.

---

## API Endpoints Reference

### Health & Metadata

#### `GET /`
Serves the interactive **API Playground UI**.

#### `GET /api-docs`
Serves the interactive **Swagger UI** containing all API operations.

#### `GET /api/info`
Returns general metadata about the server and running environment as JSON.

#### `GET /health`
Liveness check. Critical for AWS load balancing and container health checks.
* **Response (200 OK):**
```json
{
  "status": "UP",
  "uptime": 12.45,
  "timestamp": "2026-05-27T09:48:35.456Z",
  "nodeVersion": "v20.x.x",
  "memoryUsage": { ... },
  "platform": "linux",
  "redisConnected": true
}
```

---

### Items Resource (CRUD)

All items endpoints are standard REST CRUD operations. You can test them using the API Playground, Swagger UI, or curl.

---

## AWS Multi-Container Deployment Guide

### Deploying Multi-Container to AWS ECS (Elastic Container Service) with Fargate
This is the standard enterprise way to run `docker-compose` designs on AWS.

1. **Push Backend Image to ECR:**
   Create an ECR repository and push the backend docker image.
2. **ECS Task Definition (Task-Level Compose):**
   - Create a Task Definition on ECS.
   - Define **two containers** in the same task:
     - **Container 1 (backend)**: Set image URL to ECR, map container port `5000`. Add environment variable `REDIS_HOST=localhost` (Because containers inside the same ECS task share the localhost network interface).
     - **Container 2 (redis)**: Set image to `redis:7-alpine`, map container port `6379`.
3. **Run Services:**
   Deploy this task definition inside an ECS Service. AWS will run and scale both containers together.
