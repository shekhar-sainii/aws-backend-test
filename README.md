# AWS Backend Test API

A clean, modular Express API built to demonstrate and learn AWS deployment strategies.

## Folder Structure
```
aws-backend-test/
├── config/
│   └── environment.js        # Configures port and environment settings
├── controllers/
│   └── item.controller.js    # Business logic for items (in-memory CRUD)
├── middlewares/
│   └── errorHandler.js       # Handles 404 routes and global application errors
├── routes/
│   ├── health.routes.js      # Health check endpoints (critical for AWS ELB)
│   └── item.routes.js        # Item resource endpoints
├── app.js                    # Express app setup and middleware routing
├── index.js                  # App entry point (listens on port & handles shutdown)
├── package.json              # Project configuration and script runners
└── README.md                 # Project guide & AWS deployment instructions
```

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm start
```
By default, the server will run on `http://localhost:3000`. You can change the port using an environment variable:
```bash
PORT=5000 npm start
```

---

## API Endpoints Reference

### Health Check & System Status

#### `GET /`
Returns general metadata about the server and running environment.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Welcome to the AWS Deployment Demo API!",
  "environment": "development",
  "port": 3000,
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
  "nodeVersion": "v18.x.x",
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
* **Response (200 OK):**
```json
{
  "success": true,
  "data": { "id": "1", "name": "AWS EC2 Instance", ... }
}
```

#### `POST /api/items`
Create a new item.
* **Request Body:**
```json
{
  "name": "AWS Lambda Function",
  "description": "Serverless compute service"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "id": "3",
    "name": "AWS Lambda Function",
    "description": "Serverless compute service",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### `PUT /api/items/:id`
Update an existing item.
* **Request Body:**
```json
{
  "description": "Updated serverless compute service description"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Item updated successfully",
  "data": { ... }
}
```

#### `DELETE /api/items/:id`
Delete an item.
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Item deleted successfully",
  "data": { ... }
}
```

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
   - Port: `3000`
4. **Deploy:** Click deploy. AWS will provision a secure HTTPS URL for your API automatically.

---

### Method 3: AWS EC2 (Virtual Machine deployment with PM2 & Nginx)
For full control over the server environment.

1. **Launch EC2 Instance:**
   - Launch an Ubuntu Server instance in AWS Console.
   - Configure Security Groups to allow port `22` (SSH), `80` (HTTP), and `3000` (for testing API directly).
2. **Connect via SSH:**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-public-ip
   ```
3. **Install Node.js & Nginx:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx
   ```
4. **Clone & Setup Code:**
   - Clone your git repository or transfer your code.
   - Run `npm install`.
5. **Run App with PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   pm2 start index.js --name "aws-backend"
   pm2 startup
   pm2 save
   ```
6. **Configure Nginx Reverse Proxy (Optional but Recommended):**
   - Edit `/etc/nginx/sites-available/default` to forward port 80 to port 3000:
     ```nginx
     location / {
         proxy_pass http://localhost:3000;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
     }
     ```
   - Restart Nginx: `sudo systemctl restart nginx`
