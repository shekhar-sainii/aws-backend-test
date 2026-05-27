# AWS Backend Test API & Playground

A clean, modular Express API built to demonstrate and learn AWS deployment strategies. This version includes an interactive **API Playground UI** served directly from the root route (`/`) of the server and complete **Docker** support.

---

## Folder Structure
```
aws-backend-test/
├── config/
│   └── environment.js        # Configures port, node env, and dotenv
├── controllers/
│   └── item.controller.js    # Business logic for items (in-memory CRUD)
├── middlewares/
│   └── errorHandler.js       # Handles 404 routes and global application errors
├── public/
│   └── index.html            # Statically served API Playground dashboard UI
├── routes/
│   ├── health.routes.js      # Health check and info endpoints
│   └── item.routes.js        # Item resource endpoints (CRUD)
├── app.js                    # Express app setup, CORS, static file routing
├── index.js                  # App entry point (listens on port & handles shutdown)
├── package.json              # Project configuration and script runners
├── Dockerfile                # Production-optimized Docker container recipe
├── .dockerignore             # Excludes unnecessary files from container builds
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
```

### 3. Run the Development Server
```bash
npm start
```
By default, the server runs on `http://localhost:5000`. You can access the **API Playground UI** by navigating to `http://localhost:5000` in your web browser.

---

## Running with Docker

This project comes pre-configured with Docker, making it easy to run locally in a containerized environment or deploy to container services like **AWS ECS** or **AWS App Runner**.

### 1. Build the Docker Image
```bash
docker build -t aws-backend-test .
```

### 2. Run the Docker Container
Map the container's port `5000` to port `5000` on your host machine:
```bash
docker run -d -p 5000:5000 --name backend-api aws-backend-test
```
You can now access the API Playground UI at `http://localhost:5000`.

### 3. Check Logs & Stop Container
* **View running container logs:**
  ```bash
  docker logs -f backend-api
  ```
* **Stop and remove container:**
  ```bash
  docker stop backend-api
  docker rm backend-api
  ```

---

## API Endpoints Reference

### Health & Metadata

#### `GET /`
Serves the interactive **API Playground UI** (HTML page).

#### `GET /api/info`
Returns general metadata about the server and running environment as JSON.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to the AWS Deployment Demo API!",
  "environment": "development",
  "port": 5000,
  "timestamp": "2026-05-27T09:48:32.123Z",
  "documentation": "See README.md for endpoint and deployment details"
}
```

#### `GET /health`
Liveness check. Critical for AWS Elastic Load Balancers (ELB), ECS Target Groups, and App Runner health checks to monitor if the container is healthy.
* **Response (200 OK):**
```json
{
  "status": "UP",
  "uptime": 12.45,
  "timestamp": "2026-05-27T09:48:35.456Z",
  "nodeVersion": "v20.x.x",
  "memoryUsage": { ... },
  "platform": "linux"
}
```

---

### Items Resource (CRUD)

#### `GET /api/items`
Retrieve all items.
* **Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id": "1", "name": "AWS EC2 Instance", "description": "...", "createdAt": "...", "updatedAt": "..." },
    { "id": "2", "name": "AWS S3 Bucket", "description": "...", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

#### `GET /api/items/:id`
Retrieve a single item by ID.

#### `POST /api/items`
Create a new item.
* **Request Body:**
```json
{
  "name": "AWS Lambda Function",
  "description": "Serverless compute service"
}
```

#### `PUT /api/items/:id`
Update an existing item.
* **Request Body:**
```json
{
  "name": "AWS Lambda",
  "description": "Updated serverless compute service description"
}
```

#### `DELETE /api/items/:id`
Delete an item.

---

## AWS Deployment Guide

Here are the three most common and practical ways to deploy this backend to AWS.

### Method 1: AWS Elastic Beanstalk (Recommended for Beginners)
Elastic Beanstalk manages the provisioning, load balancing, auto-scaling, and health monitoring automatically.

1. **Prepare the Zip:**
   Zip the contents of your directory (excluding `node_modules` and `.git`):
   ```bash
   zip -r archive.zip . -x "node_modules/*" ".git/*"
   ```
2. **Create a Beanstalk Application:**
   - Go to the **Elastic Beanstalk Console** on AWS.
   - Click **Create Application**.
   - Set Platform to **Node.js** (choose the recommended Node.js version).
   - Under **Application code**, select **Upload your code** and upload your `archive.zip`.
3. **Configure Environment Port:**
   - Elastic Beanstalk automatically routes incoming port 80 traffic to port 8080 or the port set under `PORT`. Our app reads `process.env.PORT` automatically, so it will bind correctly.
4. **Health Check Path:**
   - Under Configuration -> Instances / Load Balancer, set the Health Check HTTP path to `/health` (instead of `/`). This ensures AWS monitors the dedicated health endpoint.

---

### Method 2: AWS App Runner (Easiest Container / Git Deployment)
App Runner connects directly to GitHub and deploys automatically on every push.

1. **Push to GitHub:**
   Commit and push this code to a public/private GitHub repository.
2. **Create Service in App Runner Console:**
   - Select **Source code repository** and connect your GitHub account.
   - Choose your repository and the deployment branch (e.g. `main`).
   - Under Deployment settings, select **Automatic**.
3. **Configure Build & Start:**
   - Runtime: **Node.js 18** (or your preference).
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Port: `5000`
4. **Deploy:** Click deploy. AWS will provision a secure HTTPS URL for your API automatically.

---

### Method 3: AWS ECS (Elastic Container Service) with Fargate
Recommended for production docker-based microservices.

1. **Push Image to ECR (Elastic Container Registry):**
   - Create a repository in AWS ECR.
   - Authenticate your Docker client and push the built image:
     ```bash
     docker tag aws-backend-test:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/aws-backend-test:latest
     docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/aws-backend-test:latest
     ```
2. **Define Task Definition:**
   - Create an ECS Task Definition using the Fargate launch type.
   - Specify the container image URL, set port mappings to container port `5000`.
   - Add environment variables (like `NODE_ENV=production` and `PORT=5000`).
3. **Configure ECS Service & Load Balancer:**
   - Create a Service within your ECS Cluster.
   - Set up an Application Load Balancer (ALB) mapping listener port `80` to target group port `5000`.
   - Set target group health check path to `/health`.
