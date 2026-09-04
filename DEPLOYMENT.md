# Swasthya Sahayak — Complete Production Deployment Guide

This guide provides the complete, step-by-step production deployment workflow for **Swasthya Sahayak**:
- **Backend & Redis**: Containerized with Docker & Docker Compose on **AWS EC2 (Ubuntu 26.04 LTS)**.
- **Frontend UI**: Deployed globally on **Vercel** with Next.js 15.
- **CI/CD**: Fully automated deployment to EC2 via **GitHub Actions** on every `git push`.
- **Database**: Managed **Supabase PostgreSQL** & **MongoDB Atlas**.

---

## High-Level System Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │                  Vercel (Global Edge)                  │
   │               Next.js 15 Frontend UI                   │
   │           https://swasthya-sahayak.vercel.app          │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTPS / JSON (Credentials included)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             AWS EC2 Instance (Ubuntu 26.04 LTS)        │
   │                                                        │
   │  ┌───────────────────────┐  ┌───────────────────────┐  │
   │  │  swasthya-backend     │  │    swasthya-redis     │  │
   │  │  Express + Prisma API │◄─┼──► Redis 7 Alpine    │  │
   │  │  Port 4000            │  │    Port 6379 (Local)  │  │
   │  └───────────┬───────────┘  └───────────────────────┘  │
   └──────────────┼─────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   Supabase    │   │ MongoDB Atlas │
│  PostgreSQL   │   │ Triage Store  │
└───────────────┘   └───────────────┘
```

---

## Table of Contents
1. [Phase 1: AWS EC2 Instance Setup (Ubuntu 26.04 LTS)](#phase-1-aws-ec2-instance-setup-ubuntu-2604-lts)
2. [Phase 2: One-Time EC2 Server Configuration & First Launch](#phase-2-one-time-ec2-server-configuration--first-launch)
3. [Phase 3: GitHub Actions CI/CD Pipeline (Auto-Deploy on Git Push)](#phase-3-github-actions-cicd-pipeline-auto-deploy-on-git-push)
4. [Phase 4: Vercel Frontend Deployment](#phase-4-vercel-frontend-deployment)
5. [Phase 5: How to Update Environment Variables (.env) in the Future & Restart](#phase-5-how-to-update-environment-variables-env-in-the-future--restart)
6. [Phase 6: Maintenance & Troubleshooting Cheatsheet](#phase-6-maintenance--troubleshooting-cheatsheet)

---

## Phase 1: AWS EC2 Instance Setup (Ubuntu 26.04 LTS)

### Step 1.1: Launch the EC2 Instance
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/ec2/).
2. In the top-right corner, select your preferred region (e.g. `ap-south-1` Mumbai).
3. Navigate to **EC2 Dashboard** &rarr; click **Launch Instance**.
4. Configure the instance settings:
   - **Name**: `swasthya-sahayak-backend`
   - **Application and OS Images (AMI)**: Select **Ubuntu**, then choose **Ubuntu Server 26.04 LTS** (64-bit x86).
   - **Instance Type**: Select **`t3.small`** (2 vCPU, 2 GiB RAM) or **`t3.medium`** (2 vCPU, 4 GiB RAM, recommended for running BullMQ workers + Redis + Node concurrent requests).
   - **Key Pair (login)**:
     - Click **Create new key pair**.
     - Name: `swasthya-ec2-key`
     - Key pair type: `RSA`
     - Private key file format: `.pem`
     - Click **Create key pair** and save the downloaded file to your local computer.
   - **Network Settings (Security Group)**:
     - Check **Create security group**.
     - Set Inbound Security Group Rules:
       | Type | Port Range | Source Type | Source | Purpose |
       |---|---|---|---|---|
       | **SSH** | `22` | My IP (or Anywhere `0.0.0.0/0`) | `0.0.0.0/0` | Server administration & GitHub Actions |
       | **Custom TCP** | `4000` | Anywhere | `0.0.0.0/0` | Express Backend API |
       | **HTTP** | `80` | Anywhere | `0.0.0.0/0` | Optional Nginx / Certbot SSL |
       | **HTTPS** | `443` | Anywhere | `0.0.0.0/0` | Optional Nginx / Certbot SSL |
     > [!CAUTION]
     > **NEVER add Port 6379 (Redis) to the EC2 Security Group!** Redis is securely bound only to `127.0.0.1` and the internal Docker bridge network. It must never be exposed to the public internet.
   - **Configure Storage**: Set to **25 GiB** (`gp3`).
5. Review the summary and click **Launch Instance**.
6. Once launched, copy the **Public IPv4 address** from the EC2 console (e.g., `54.210.120.45`).

---

## Phase 2: One-Time EC2 Server Configuration & First Launch

### Step 2.1: Connect to your Ubuntu 26.04 LTS Instance via SSH
Open your terminal (macOS/Linux) or PowerShell (Windows):

```bash
# Set permissions on your downloaded private key (Linux/macOS)
chmod 400 /path/to/swasthya-ec2-key.pem

# SSH into your EC2 instance (default username is ubuntu)
ssh -i /path/to/swasthya-ec2-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

---

### Step 2.2: Install Docker & Docker Compose on Ubuntu 26.04 LTS
Run the following commands on your EC2 instance to install the official Docker Engine and Compose plugin:

```bash
# 1. Update package lists
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg git

# 3. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Add Docker repository to Apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Install Docker Engine, CLI, and Docker Compose Plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Enable Docker service and add the ubuntu user to docker group
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu

# Apply group changes immediately without logging out
newgrp docker

# Verify Docker and Compose are working
docker --version
docker compose version
```

---

### Step 2.3: Clone Repository and Setup Environment Variables
Clone the repository into your home directory:

```bash
cd ~
git clone https://github.com/IndSumit07/Swasthya-Sahayak.git
cd Swasthya-Sahayak/server

# Create your production .env from the template
cp .env.example .env

# Open and edit .env with your live database and API keys
nano .env
```

Ensure your `.env` contains your actual Supabase DB password, Supabase keys, MongoDB URI, and your frontend URL:
```env
# Server Configuration
PORT=4000
NODE_ENV=production

# CORS: Add your Vercel URL (comma-separated, wildcard .vercel.app is also supported)
CORS_ORIGIN="http://localhost:3000,https://swasthya-sahayak.vercel.app"

# Cross-Site Cookie Settings for Vercel Frontend -> EC2 Backend
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

# Supabase Auth & Config
SUPABASE_URL=https://kuvqrpblrqjogprywqjw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Prisma / Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.kuvqrpblrqjogprywqjw:[YOUR-ACTUAL-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.kuvqrpblrqjogprywqjw:[YOUR-ACTUAL-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# MongoDB Connection
MONGODB_URI="mongodb+srv://MainSumitHoon:[YOUR-PASSWORD]@cluster0.mongodb.net/?appName=Cluster0"

# Redis Configuration (inside Docker network, points to redis container)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://redis:6379
```
- Save in `nano`: Press **`Ctrl + O`**, then press **`Enter`**.
- Exit `nano`: Press **`Ctrl + X`**.

---

### Step 2.4: Launch the Containers
Run the turnkey deployment script or launch Docker Compose directly:

```bash
# Option A: Run the automated deployment script
chmod +x deploy-ec2.sh
./deploy-ec2.sh

# Option B: Run Docker Compose directly
docker compose up -d --build
```

---

### Step 2.5: Verify the Backend is Online
Test the healthcheck endpoint:

```bash
curl http://localhost:4000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12,
  "timestamp": "2026-09-04T11:40:00.000Z",
  "service": "Swasthya Sahayak API",
  "database": {
    "postgres": "connected",
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

You can also test it from your computer browser:
`http://<YOUR-EC2-PUBLIC-IP>:4000/api/v1/health`

---

## Phase 3: GitHub Actions CI/CD Pipeline (Auto-Deploy on Git Push)

The repository already contains the workflow file [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

### Step 3.1: Add Repository Secrets on GitHub
1. Go to your GitHub repository: **`https://github.com/IndSumit07/Swasthya-Sahayak`**.
2. Click **Settings** (top tab) &rarr; in the left sidebar, click **Secrets and variables** &rarr; **Actions**.
3. Click **New repository secret** and add the following 3 secrets:

| Secret Name | Value | Instructions |
|---|---|---|
| `EC2_HOST` | `<YOUR-EC2-PUBLIC-IP>` | The public IP of your EC2 instance (e.g. `54.210.120.45`) |
| `EC2_USER` | `ubuntu` | For Ubuntu 26.04 LTS, the default SSH user is `ubuntu` |
| `EC2_SSH_KEY` | *(Paste full contents of `.pem` file)* | Open `swasthya-ec2-key.pem` in a text editor, copy all lines including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----` |
| `EC2_PORT` | `22` *(Optional)* | SSH port (defaults to 22 if not specified) |

---

### Step 3.2: Trigger an Automated Deployment
Now, whenever you push any changes to `main`:
```bash
git add .
git commit -m "feat: my new feature"
git push origin main
```

1. GitHub Actions automatically starts the workflow.
2. It securely connects to your EC2 instance over SSH.
3. It fetches the latest code with `git fetch origin main && git reset --hard origin/main`.
4. It builds and restarts the backend container (`docker compose up -d --build`).
5. It polls the healthcheck endpoint to ensure the app is healthy.
6. It cleans up dangling Docker layers (`docker image prune -f`) so your disk space never runs out.

> **Manual Trigger**: You can also trigger deployment on demand without pushing code by going to **GitHub** &rarr; **Actions** &rarr; **Deploy Backend & Redis to AWS EC2** &rarr; click **Run workflow**.

---

## Phase 4: Vercel Frontend Deployment

### Step 4.1: Import into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** &rarr; **Project**.
3. Select your repository: **`Swasthya-Sahayak`**.
4. Configure the Build & Development Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit &rarr; select **`client`** &rarr; click **Continue**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

---

### Step 4.2: Configure Environment Variables on Vercel
Under the **Environment Variables** section on Vercel, you only need to add **one variable**:

| Key | Value | Description |
|---|---|---|
| `NEXT_API_URL` | `http://<YOUR-EC2-PUBLIC-IP>:4000/api/v1` | URL pointing to your live EC2 backend API |

> [!NOTE]
> **No Supabase keys are needed on Vercel/client!** All database, auth, and business logic calls route securely through your EC2 Express backend API (`NEXT_API_URL`), which holds the secure database connections.

Click **Deploy**!

---

### Step 4.3: Recommended Zero-CORS Setup via Next.js Rewrites
To achieve **100% same-origin cookie handling** and eliminate any third-party cookie restrictions between Vercel and EC2, configure a proxy rewrite in [`client/next.config.ts`](file:///c:/Users/Sumit%20Kumar/Desktop/Swasthya%20Sahayak/client/next.config.ts):

```ts
import type { NextConfig } from "next";

const EC2_BACKEND_URL = process.env.EC2_BACKEND_URL || "http://<YOUR-EC2-PUBLIC-IP>:4000";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${EC2_BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

With this configuration:
1. In Vercel, set `EC2_BACKEND_URL=http://<YOUR-EC2-PUBLIC-IP>:4000`.
2. In your frontend client, requests go to `/api/v1/...`.
3. Vercel's edge network proxies the requests to your EC2 backend.
4. Browsers treat all auth cookies as **first-party cookies**, guaranteeing 100% compatibility across Chrome, Safari, iOS, and Firefox.

---

## Phase 5: How to Update Environment Variables (`.env`) in the Future & Restart

Whenever you need to update a secret (such as a database password, Supabase key, or adding a new Vercel domain to `CORS_ORIGIN`):

### Step 5.1: SSH into your EC2 instance
```bash
ssh -i /path/to/swasthya-ec2-key.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### Step 5.2: Navigate to the Server Directory and Edit `.env`
```bash
cd ~/Swasthya-Sahayak/server
nano .env
```
- Update any required values (e.g. `CORS_ORIGIN="http://localhost:3000,https://my-app.vercel.app"`).
- Save changes: Press **`Ctrl + O`**, then **`Enter`**.
- Exit editor: Press **`Ctrl + X`**.

### Step 5.3: Apply Changes & Restart Backend with Zero Cache Loss
Run this single command:

```bash
docker compose up -d --no-deps backend
```

> [!TIP]
> **Why `--no-deps backend` is the best practice:**
> 1. **Redis is NOT restarted**: All in-memory cached doctor searches, queue sequences, and BullMQ worker states are preserved without interruption.
> 2. **Near Zero Downtime**: Docker recreates and swaps only the `swasthya-backend` container in ~2 seconds.
> 3. **Instant Pickup**: Node.js immediately re-initializes with the updated `.env` values.

### Step 5.4: Verify the New Configuration
```bash
# Check the latest 30 lines of logs
docker compose logs --tail=30 backend

# Confirm the healthcheck is passing
curl http://localhost:4000/api/v1/health
```

---

## Phase 5.5: Custom Domain & Free HTTPS (SSL) Setup

To connect a custom domain like **`ss.api.sumoraai.in`** with a free auto-renewing SSL certificate (HTTPS), follow these steps:

### Step 5.5.1: Point DNS `A` Record to your EC2 IP
In your DNS provider (Cloudflare, GoDaddy, Namecheap, Route53, Hostinger):
- **Type**: `A`
- **Name / Subdomain**: `ss.api` (or `ss.api.sumoraai.in`)
- **Target / Value**: `15.252.169.184` (Your EC2 Public IP)
- **TTL**: `Auto` or `300 seconds`
- *(If using Cloudflare: Set Proxy Status to "DNS Only" / Grey cloud during certbot setup)*

### Step 5.5.2: Open Ports 80 & 443 in AWS EC2 Security Group
1. AWS Console &rarr; EC2 &rarr; Instances &rarr; Select your instance.
2. Click **Security** tab &rarr; Click Security Group ID &rarr; **Edit Inbound Rules**.
3. Add:
   - **HTTP**: Port `80`, Source `0.0.0.0/0`
   - **HTTPS**: Port `443`, Source `0.0.0.0/0`
4. Click **Save rules**.

### Step 5.5.3: Install Nginx & Certbot on EC2
SSH into your EC2 instance and run:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 5.5.4: Configure Nginx Reverse Proxy
Create the Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/ss.api.sumoraai.in
```
Paste this configuration:
```nginx
server {
    server_name ss.api.sumoraai.in;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ss.api.sumoraai.in /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5.5.5: Issue Free SSL Certificate with Certbot
```bash
sudo certbot --nginx -d ss.api.sumoraai.in
```
- Enter your email address for renewal notices.
- Agree to terms (`Y`).
- Certbot will automatically verify the domain, download the certificate, and configure Nginx for HTTPS with HTTP &rarr; HTTPS automatic redirection!

### Step 5.5.6: Update Vercel Environment Variables
On Vercel Dashboard &rarr; Settings &rarr; **Environment Variables**:
- Update **`NEXT_API_URL`**: `https://ss.api.sumoraai.in/api/v1`
- Redeploy your Vercel project.

---

## Phase 6: Maintenance & Troubleshooting Cheatsheet

### Check Running Services
```bash
docker compose ps
```
Should output:
```text
NAME                IMAGE               COMMAND                  SERVICE             CREATED             STATUS                    PORTS
swasthya-backend    server-backend      "docker-entrypoint.s…"   backend             5 minutes ago       Up 5 minutes (healthy)    0.0.0.0:4000->4000/tcp
swasthya-redis      redis:7-alpine      "docker-entrypoint.s…"   redis               5 minutes ago       Up 5 minutes (healthy)    127.0.0.1:6379->6379/tcp
```

### View Live Container Logs
```bash
# Follow live backend logs
docker compose logs -f backend

# Follow Redis logs
docker compose logs -f redis

# View the last 100 lines of both
docker compose logs --tail=100
```

### Run Database Seeds / Scripts on EC2
To run database seeds or Prisma commands inside the running container:
```bash
docker compose exec backend npm run seed
```

### Interactive Redis CLI inside Container
To inspect cache keys or queues:
```bash
docker compose exec redis redis-cli
# Inside Redis CLI:
# > ping
# > keys *
# > exit
```

### Disk Space Cleanup
Over time, Docker build layers can accumulate. To safely clean up unused images without touching your active containers or volumes:
```bash
docker image prune -f
```

### Restart Everything
```bash
docker compose restart
```

### Full Rebuild from Scratch
If you ever want to rebuild everything cleanly:
```bash
docker compose down
docker compose up -d --build
```
*(Your Redis database volume `redis_data` is persistent and will not be lost unless you explicitly run `docker compose down -v`).*
