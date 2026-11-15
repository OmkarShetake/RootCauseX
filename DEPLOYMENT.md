# ðŸš€ RootCauseX Production Deployment Guide

This guide provides end-to-end instructions for deploying **RootCauseX** across multiple environments, from a single VPS with Docker Compose to managed cloud PaaS platforms (Railway / Render) and production Nginx reverse proxying with SSL.

---

## ðŸ“‹ Architectural Overview for Deployment

RootCauseX runs as three coordinated services:
1. **`rootcausex-app`**: A unified container packaging both the **Java 21 Spring Boot 3.4+ backend** and the compiled **React 18 frontend** (served from Spring's `/static` directory on port `8080`).
2. **`rootcausex-postgres`**: PostgreSQL 16 image bundled with the **`pgvector`** extension for similarity search embeddings.
3. **`rootcausex-redis`**: Redis 7 Alpine caching tier with 24-hour TTL for issue triage caching.

---

## âš¡ Using Neon Serverless PostgreSQL (Recommended Free Database)

Neon provides free, serverless PostgreSQL with native `pgvector` support and scale-to-zero capabilities.

### 1. Set Up Neon
1. Go to [Neon.tech](https://neon.tech/) and create a free project named `rootcausex`.
2. Go to the **SQL Editor** tab in Neon and enable the `vector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy your connection string from the **Dashboard** (e.g., `postgresql://user:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require`).

### 2. Configure Render with Neon
In Render's **Environment Variables** for `rootcausex-backend`:
- Set `SPRING_DATASOURCE_URL` to your Neon connection string (RootCauseX automatically prefixes `jdbc:` and enforces SSL).
- Set `SPRING_DATASOURCE_USERNAME` to your Neon user.
- Set `SPRING_DATASOURCE_PASSWORD` to your Neon password.

---

## ðŸ›  Option 1: Single-Server VPS Deployment (Recommended)
*Ideal for: AWS EC2, DigitalOcean Droplet, Hetzner, GCP Compute Engine, or Linode.*

### Prerequisites
- A Linux server (Ubuntu 22.04 LTS / 24.04 LTS recommended)
- **Docker** & **Docker Compose** installed:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  # Log out and log back in, then verify:
  docker --version && docker compose version
  ```

---

### Step-by-Step Instructions

#### 1. Clone the Repository to Your Server
```bash
git clone https://github.com/your-username/RootCauseX.git
cd RootCauseX
```

#### 2. Create the Production Environment File
Copy the provided `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` using `nano .env` or `vim .env`:
```ini
POSTGRES_DB=rootcausex
POSTGRES_USER=rootcausex
POSTGRES_PASSWORD=your_secure_random_db_password_2026

# Optional: Higher GitHub API limit (5,000 req/hr)
GITHUB_TOKEN=ghp_yourGitHubPersonalAccessToken

# Optional: Real OpenAI or Gemini API Key (or leave mock mode)
AI_API_KEY=sk-yourRealApiKeyHere
AI_MODEL=gpt-4o-mini
AI_MOCK_MODE=false
```

#### 3. Build & Launch the Complete Stack
Run the production compose file in detached mode:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

#### 4. Monitor Initialization & Health Checks
Check the status of all three containers:
```bash
docker compose -f docker-compose.prod.yml ps
```
You should see:
```text
NAME                 IMAGE                      STATUS
rootcausex-postgres  pgvector/pgvector:pg16     Up (healthy)
rootcausex-redis     redis:7-alpine             Up (healthy)
rootcausex-app       rootcausex-app             Up (healthy)
```

View application startup logs:
```bash
docker compose -f docker-compose.prod.yml logs -f app
```

#### 5. Access Your Live Application
Open your browser and navigate to:
```text
http://<YOUR_SERVER_PUBLIC_IP>:8080
```

---

## ðŸŒ Option 2: Adding a Custom Domain & Free SSL (Nginx + Let's Encrypt)

To serve RootCauseX securely on `https://yourdomain.com` without exposing port 8080:

### 1. Install Nginx and Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/rootcausex`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Site & Obtain SSL Certificate
```bash
sudo ln -s /etc/nginx/sites-available/rootcausex /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain free SSL with automatic renewal
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Now your application is live with HTTPS at `https://yourdomain.com`!

---

## â˜ï¸ Option 3: Managed PaaS Deployment (Railway / Render)

If you do not want to manage a Linux VM or configure Docker manually:

### Deploying on Railway.app
1. Go to [railway.app](https://railway.app/) and create a new project.
2. Click **New** â†’ **Database** â†’ **PostgreSQL**.
   - Under database settings, execute: `CREATE EXTENSION IF NOT EXISTS vector;`
3. Click **New** â†’ **Database** â†’ **Redis**.
4. Click **New** â†’ **GitHub Repo** â†’ select `RootCauseX`.
5. Under service **Settings** â†’ **Build**:
   - Railway will automatically detect the root `Dockerfile`.
6. Add the following **Environment Variables**:
   - `SPRING_DATASOURCE_URL`: `${{Postgres.DATABASE_URL}}`
   - `REDIS_HOST`: `${{Redis.REDISHOST}}`
   - `REDIS_PORT`: `${{Redis.REDISPORT}}`
   - `AI_API_KEY`: your OpenAI / Gemini API key
   - `AI_MOCK_MODE`: `false` (or `auto`)
7. Click **Deploy**. Railway will build the multi-stage image, connect pgvector & Redis, and provide a live public HTTPS URL.

### Deploying on Render.com (Web Service + Neon + Render Redis)
1. **Create Redis Key-Value Instance on Render**:
   - Go to Render Dashboard -> **New** -> **Key Value** (Redis).
   - Name: `rootcausex-redis`, Region: `Ohio (US East)`.
   - Once Available, copy the **Internal Host** (e.g. `red-dbsm6plg1s2s73fj3q30`).
2. **Set Up Neon PostgreSQL Database**:
   - Create a project on [Neon.tech](https://neon.tech/) in the same region (`us-east-2` for Ohio).
   - Run in Neon SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`
   - Copy the Connection String: `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. **Create Web Service on Render**:
   - Click **New** -> **Web Service** -> Connect your `RootCauseX` repository.
   - **Language**: `Docker`
   - **Region**: `Ohio (US East)`
   - **Branch**: `main`
   - **Root Directory**: `backend` (or repo root with root `Dockerfile`)
4. **Configure Environment Variables**:
   | Variable | Value | Note |
   |---|---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` | Neon connection string with `jdbc:` prefix |
   | `SPRING_DATASOURCE_USERNAME` | `<neon_username>` | Neon DB user |
   | `SPRING_DATASOURCE_PASSWORD` | `<neon_password>` | Neon DB password |
   | `REDIS_HOST` | `red-dbsm6plg1s2s73fj3q30` | Render Redis Internal Host |
   | `REDIS_PORT` | `6379` | Default Redis port |
   | `SPRING_MAIN_ALLOW_BEAN_DEFINITION_OVERRIDING` | `true` | Prevents pgvector bean collisions |
   | `AI_MOCK_MODE` | `false` | Set `false` for live Gemini, `true` for deterministic semantic embeddings |
   | `AI_API_KEY` | `<your-gemini-or-openai-key>` | Optional when using local semantic vectors |
   | `GITHUB_TOKEN` | `<your-personal-access-token>` | Recommended: increases rate limit from 60 to 5,000 req/hr |

---

## ðŸ”„ Updating & CI/CD Pipeline

When you push new code to your repository:
```bash
# Pull new changes
git pull origin main

# Rebuild only the updated app container with zero downtime
docker compose -f docker-compose.prod.yml up --build -d app
```

---

## ðŸ” Troubleshooting & Operational Commands

| Command | Purpose |
|---|---|
| `docker compose -f docker-compose.prod.yml logs -f app` | Stream live application logs |
| `docker compose -f docker-compose.prod.yml restart app` | Restart the web application |
| `docker exec -it rootcausex-postgres psql -U rootcausex -d rootcausex` | Open PostgreSQL CLI |
| `docker exec -it rootcausex-redis redis-cli ping` | Verify Redis response (`PONG`) |
| `curl -s http://localhost:8080/actuator/health` | Check Spring Boot actuator health |
