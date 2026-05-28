# AWS Backend Test API & Playground

A clean, modular Express API built to demonstrate and learn AWS deployment strategies. This version includes an interactive **API Playground UI** served directly from the root route (`/`), interactive **Swagger UI** docs (`/api-docs`), multi-container orchestrations using **Docker Compose** with **Redis Caching**, and **Kubernetes (Minikube)** manifests.

---

## Folder Structure
```
aws-backend-test/
├── config/
│   ├── environment.js        # Configures port, node env, and dotenv
│   ├── kafka.js              # Kafka client connection and publishing setup
│   ├── redis.js              # Redis cache server connection setup
│   └── swagger.js            # Swagger API documentation definition
├── controllers/
│   └── item.controller.js    # Business logic for items with Redis Caching
├── k8s/
│   ├── deployment.yaml       # Kubernetes backend deployment manifest (2 replicas)
│   ├── service.yaml          # Kubernetes backend NodePort service
│   ├── redis-deployment.yaml # Kubernetes Redis deployment manifest
│   └── redis-service.yaml    # Kubernetes Redis ClusterIP service
├── middlewares/
│   └── errorHandler.js       # Handles 404 routes and global application errors
├── public/
│   └── index.html            # Statically served API Playground dashboard UI
├── routes/
│   ├── health.routes.js      # Health check (with Redis status) and info endpoints
│   └── item.routes.js        # Item resource endpoints (CRUD)
├── app.js                    # Express app setup, CORS, static file routing, Swagger docs
├── consumer.js               # Standalone consumer worker subscribing to events
├── index.js                  # App entry point (listens on port & handles shutdown)
├── package.json              # Project configuration and script runners
├── Dockerfile                # Production-optimized Docker container recipe
├── .dockerignore             # Excludes unnecessary files from container builds
├── docker-compose.yml        # Orchestrates Backend and Redis containers
├── docker-compose.kafka.yml  # Orchestrates Zookeeper, Kafka, Redis, Backend, and Consumer
├── .env                      # Application environment variables (not committed)
├── .gitignore                # Excludes node_modules and .env from Git
└── README.md                 # Project guide & AWS/Kubernetes deployment instructions
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
docker compose up --build -d
```

### 2. Verify Services are Running
Check status of the containers:
```bash
docker ps
```
You should see:
- `backend-container` listening on `0.0.0.0:5000->5000/tcp`
- `redis-container` listening on `0.0.0.0:6379->6379/tcp`

Navigating to `http://localhost:5000` will show **Redis Cache: CONNECTED** on the dashboard.

### 3. Stop Services
Stop and remove containers and network attachments:
```bash
docker compose down
```

---

## Event-Driven Architecture with Apache Kafka (Docker Compose)

Humne project me Apache Kafka integrate kiya hai to learn and demonstrate **Event-Driven Architecture (EDA)**. Is stack me asynchronous message streaming perform hoti hai:

### 1. Workflow
1. **Producer**: User jab index page ya API playground se item create (`POST /api/items`) karta hai, tab main `backend` container ek `ITEM_CREATED` event serialize karke Kafka broker topic `item-events` par publish karta hai.
2. **Consumer**: Ek standalone background node process (`consumer.js`) Kafka topic `item-events` ko subscribe karti hai aur incoming events consume karti hai.
3. **Redis Logging Cache**: Consumer received payload format details parse karke latest 20 logs Redis list `kafka_logs` me `LPUSH` format pattern par write and trim karta hai.
4. **Real-time Event Monitor UI**: Front-end javascript continuous polling (`GET /api/kafka-events`) perform karke dynamic list elements rendering update karta hai.

### 2. Services Configuration (`docker-compose.kafka.yml`)
Kafka stack orchestration setup me 5 containers active hote hain:
- **`zookeeper-container`**: Zookeeper metadata coordinator.
- **`kafka-container`**: Apache Kafka broker listening on cluster interface `kafka:29092`.
- **`redis-container`**: Shared database engine.
- **`backend-container`**: Express app serving backend endpoints and producing events.
- **`consumer-container`**: Standalone consumer worker process running `node consumer.js`.

### 3. Run and Verify Kafka Stack
Start all five containers:
```bash
docker compose -f docker-compose.kafka.yml up --build -d
```

Verify logs in consumer container:
```bash
docker logs -f consumer-container
```

Verify that events appear in real-time under the **Kafka Event Monitor** card on the dashboard when creating new items.

---

## Running with Kubernetes (Minikube)

You can deploy the complete stack onto a local Kubernetes cluster using the manifests in the `k8s/` directory.

### 1. Point Docker to Minikube's Docker daemon
Run this command in your terminal so that Docker builds images directly inside the Minikube virtual machine:
```bash
eval $(minikube docker-env)
```

### 2. Build the Backend Image
Build the backend image inside Minikube:
```bash
docker build -t aws-backend-test:latest .
```

### 3. Apply the Manifests
Create the deployments and services in the cluster:
```bash
kubectl apply -f k8s/
```

### 4. Verify Deployments
Ensure all pods are running successfully:
```bash
kubectl get pods
```
You should see:
- 1 Pod for `redis-deployment-...`
- 3 Pods for `backend-deployment-...` (running 3 replicas for load balancing)

Verify services:
```bash
kubectl get svc
```
Ensure `redis-service` (ClusterIP) and `backend-service` (NodePort) are active.

### 5. Access the API Playground UI
To open the backend application in your default browser, run:
```bash
minikube service backend-service
```
Or retrieve the direct NodePort URL:
```bash
minikube service backend-service --url
```

### 6. Clean Up Kubernetes Services
To remove the deployments and services:
```bash
kubectl delete -f k8s/
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
