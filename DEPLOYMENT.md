# Swasthya Sahayak — Production Deployment Guide

This guide outlines how to deploy **Swasthya Sahayak** into production across **Vercel** (Frontend) and **AWS EC2** (Dockerized Backend + Redis).

```
   ┌────────────────────────────────────────────────────────┐
   │                    Vercel (Global CDN)                │
   │               Next.js 15 Frontend UI                   │
   │           https://swasthya-sahayak.vercel.app          │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTP / JSON (Credentials included)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              AWS EC2 Instance (Ubuntu / AL2023)        │
   │  ┌───────────────────────┐  ┌───────────────────────┐  │
   │  │  swasthya-backend     │  │    swasthya-redis     │  │
   │  │  Express + Prisma API │◄─┼──► Redis 7 Alpine    │  │
   │  │  (Port 4000)          │  │    (Port 6379)        │  │
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

## 1. AWS EC2 Setup (Backend + Redis)

### Step 1.1: Launch EC2 Instance
1. Go to **AWS Management Console** &rarr; **EC2** &rarr; **Launch Instance**.
2. **Name**: `swasthya-sahayak-backend`
3. **AMI**: **Ubuntu 22.04 LTS** or **Amazon Linux 2023** (64-bit x86).
4. **Instance Type**: `t3.small` (2 vCPU, 2 GiB RAM) or `t3.medium` (recommended for BullMQ queues + Redis cache).
5. **Key Pair**: Select or create an SSH key pair (`.pem`).
6. **Network / Security Group**:
   - Allow **SSH (22)** from `My IP`
   - Allow **Custom TCP (4000)** from `Anywhere (0.0.0.0/0)` (or Nginx 80/443 if you configure SSL)
   - **DO NOT** expose port 6379 to the public internet (Redis is bound to `127.0.0.1` and internal Docker network).
7. **Storage**: 20 GiB gp3.
8. Click **Launch Instance**.

---

### Step 1.2: Connect and Deploy with 1 Command

SSH into your EC2 instance:
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

Clone the repository and run the automated deployment script:
```bash
# Clone the repository
git clone https://github.com/IndSumit07/Swasthya-Sahayak.git
cd Swasthya-Sahayak/server

# Configure your production environment variables
cp .env.example .env
nano .env
```

Make sure your `.env` contains your live Supabase database password, MongoDB URI, and your Vercel frontend domain in `CORS_ORIGIN`:
```env
PORT=4000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000,https://your-app.vercel.app

# Cross-site cookie settings for Vercel -> EC2 communication
COOKIE_SAME_SITE=none
COOKIE_SECURE=true

SUPABASE_URL=https://kuvqrpblrqjogprywqjw.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL="postgresql://postgres.kuvqrpblrqjogprywqjw:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.kuvqrpblrqjogprywqjw:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
MONGODB_URI="mongodb+srv://..."
```

Run the automated setup:
```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

The script will automatically:
1. Install Docker Engine and the Docker Compose plugin (if missing).
2. Build the multi-stage production image with Prisma and TypeScript compilation.
3. Start Redis 7 with AOF persistence.
4. Launch the Express backend on port 4000.
5. Perform health checks against `http://localhost:4000/api/v1/health`.

---

### Step 1.3: Useful EC2 Maintenance Commands

```bash
# View live application logs
docker compose logs -f backend

# View Redis logs
docker compose logs -f redis

# Restart the entire stack
docker compose restart

# Rebuild after pulling latest code from git
git pull origin main
docker compose up -d --build

# Run database migrations/seeds inside container if needed
docker compose exec backend npm run seed
```

---

## 2. Vercel Deployment (Frontend UI)

### Step 2.1: Import Project in Vercel
1. Log in to [vercel.com](https://vercel.com) and click **Add New...** &rarr; **Project**.
2. Select your GitHub repository: `Swasthya-Sahayak`.
3. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

---

### Step 2.2: Add Environment Variables in Vercel
In the Vercel **Environment Variables** panel, add:

| Key | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://<EC2-PUBLIC-IP>:4000/api/v1` | URL of your EC2 backend API |

> **Pro Tip**: If you map a custom domain with SSL to your EC2 instance (e.g. `https://api.yourdomain.com`), set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1`.

Click **Deploy**!

---

## 3. Recommended: Zero-CORS Setup with Next.js Rewrites

If you want **100% same-origin cookie handling** without worrying about browser third-party cookie restrictions or mixed content (HTTP vs HTTPS), you can proxy API calls directly through Vercel by adding a rewrite rule to [`client/next.config.ts`](file:///c:/Users/Sumit%20Kumar/Desktop/Swasthya%20Sahayak/client/next.config.ts):

```ts
import type { NextConfig } from "next";

const EC2_BACKEND_URL = process.env.EC2_BACKEND_URL || "http://<EC2-PUBLIC-IP>:4000";

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

With this rewrite:
1. In Vercel, set `EC2_BACKEND_URL=http://<EC2-PUBLIC-IP>:4000`.
2. In client, leave `NEXT_PUBLIC_API_URL=/api/v1`.
3. The browser only talks to `https://your-app.vercel.app/api/v1/...`, which Vercel securely forwards to your EC2 backend.
4. Zero CORS headers needed, zero third-party cookie warnings!

---

## 4. Automated CI/CD with GitHub Actions (Auto-Deploy on Git Push)

A complete automated CI/CD pipeline is configured in [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml). Every time you push code to the `main` branch, GitHub Actions will automatically connect to your EC2 instance over SSH, pull the latest commits, rebuild the backend container, and verify the healthcheck endpoint.

### Step 4.1: Add GitHub Repository Secrets
1. On GitHub, navigate to your repository: **`IndSumit07/Swasthya-Sahayak`**.
2. Click **Settings** (top tab) &rarr; **Secrets and variables** (left sidebar) &rarr; **Actions**.
3. Click **New repository secret** and add the following 3 secrets:

| Secret Name | Example Value | Description |
|---|---|---|
| `EC2_HOST` | `54.210.120.45` | Public IP or Public DNS of your EC2 instance |
| `EC2_USER` | `ubuntu` | Default username for Ubuntu LTS (`ubuntu`) |
| `EC2_SSH_KEY` | `-----BEGIN RSA PRIVATE KEY----- ...` | Entire contents of your `.pem` key pair file |
| `EC2_PORT` | `22` *(Optional)* | Default SSH port (defaults to `22` if omitted) |

> [!IMPORTANT]
> When copying your private key into `EC2_SSH_KEY`, paste the **entire file** including:
> ```
> -----BEGIN RSA PRIVATE KEY-----
> MIIEowIBAAKCAQEA...
> -----END RSA PRIVATE KEY-----
> ```
> Make sure there are no accidental trailing spaces.

### Step 4.2: How the Auto-Deploy Pipeline Works
1. **Trigger**: Pushing code affecting `server/**` or `docker-compose.yml` to `main` automatically triggers the action.
2. **Manual Trigger**: You can also trigger deployment on-demand anytime from the GitHub Actions tab by clicking **Deploy Backend & Redis to AWS EC2** &rarr; **Run workflow**.
3. **Execution Steps**:
   - Connects to EC2 via SSH using your key.
   - Runs `git fetch origin main && git reset --hard origin/main` to sync code cleanly without merge conflicts.
   - Preserves your existing `.env` on EC2.
   - Runs `docker compose up -d --build --remove-orphans`.
   - Polls `http://localhost:4000/api/v1/health` for up to 12 attempts to confirm the server booted successfully.
   - Automatically prunes dangling Docker images (`docker image prune -f`) to save EC2 disk space.

---

## 5. How to Update Environment Variables (`.env`) & Restart in the Future

Whenever you need to change a database password, add a new Vercel domain to `CORS_ORIGIN`, or update Supabase keys, follow this quick 3-step process:

### Step 5.1: SSH into your EC2 Instance
```bash
ssh -i /path/to/your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 5.2: Navigate to Server and Edit `.env`
```bash
cd ~/Swasthya-Sahayak/server
nano .env
```
Use arrow keys to navigate to the variable you want to modify (e.g., updating `CORS_ORIGIN`, `DATABASE_URL`, or `MONGODB_URI`).
- Save changes: Press **`Ctrl + O`**, then **`Enter`**.
- Exit editor: Press **`Ctrl + X`**.

### Step 5.3: Apply Changes and Restart the Backend
Run the following single command:

```bash
docker compose up -d --no-deps backend
```

> [!TIP]
> **Why `--no-deps backend`?**
> - It restarts **ONLY** the backend container with the updated `.env` values.
> - **Redis is NOT restarted**, which means your in-memory cache, rate limits, and queue worker jobs are **never dropped** or interrupted!
> - The restart takes only **1 to 2 seconds**.

### Step 5.4: Verify the New Configuration
Check the logs to verify the container picked up the changes and is running normally:
```bash
# View the last 30 lines of backend logs
docker compose logs --tail=30 backend

# Verify health status
curl http://localhost:4000/api/v1/health
```
You should see:
```json
{"status":"healthy","uptime":5,"database":{"postgres":"connected","redis":"connected"}}
```

