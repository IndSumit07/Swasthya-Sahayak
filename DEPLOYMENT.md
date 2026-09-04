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
