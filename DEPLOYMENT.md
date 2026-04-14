# 🚀 Joino — Production Deployment Guide

This guide provides instructions for deploying **Joino** to a production environment using Docker, Nginx, and SSL.

---

## 📋 Prerequisites

- **Server:** VPS / Dedicated Server (Ubuntu 22.04 LTS recommended).
- **Domain:** A registered domain (e.g., `joino.yourdomain.com`).
- **Tools:** Docker (24.0+) and Docker Compose (2.10+).
- **SSL:** Let's Encrypt (Certbot) or Cloudflare.

---

## 🔐 1. Environment Configuration

Create a `.env` file in the root directory. **Never commit this file to version control.**

```bash
# General
NODE_ENV=production
JWT_SECRET=your_very_long_random_secret_string
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# Backend
PORT=4000
DATABASE_URL=postgresql://admin:YOUR_DB_PASSWORD@db:5432/joino
FRONTEND_URL=https://app.yourdomain.com

# Email (SMTP Production Service)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Database (Postgres)
POSTGRES_DB=joino
POSTGRES_USER=admin
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
```

---

## 🛠️ 2. Production Docker Setup

For production, we use a separate docker-compose configuration that doesn't mount local code volumes and uses optimized builds.

### Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    container_name: joino_frontend_prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - joino_prod_network

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: joino_backend_prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin:YOUR_DB_PASSWORD@db:5432/joino
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - joino_prod_network

  db:
    image: postgres:16-alpine
    container_name: joino_db_prod
    environment:
      POSTGRES_DB: joino
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: YOUR_DB_PASSWORD
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - joino_prod_network

volumes:
  postgres_prod_data:

networks:
  joino_prod_network:
    driver: bridge
```

---

## 🌐 3. Automated Nginx & SSL Setup

Joino includes a pre-configured Nginx container and Certbot service in `docker-compose.prod.yml`.

### Initial SSL Setup
Before starting the full stack, you need to generate the initial SSL certificates:

1.  **Configure `.env`**: Ensure `DOMAIN_NAME` and URLs are set to `joino.cloud`.
2.  **Run Initialization**:
    ```bash
    chmod +x init-ssl.sh
    ./init-ssl.sh
    ```
    *Note: Ensure port 80 is not being used by any other service on the host during this step.*

### Automatic Renewal
The `certbot` service in `docker-compose.prod.yml` will automatically check for renewals every 12 hours.

---

## 🚀 4. Deployment Steps

1.  **Upload code to server:**
    ```bash
    git clone https://github.com/huynhhuynh02/joino.git
    cd joino
    ```

2.  **Configure production environment:**
    `nano .env` (Paste your production config using `joino.cloud`).

3.  **Bootstrap SSL:**
    ```bash
    ./init-ssl.sh
    ```

4.  **Build and start containers:**
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```

5.  **Initialize Database:**
    ```bash
    docker exec -it joino_backend_prod npx prisma migrate deploy
    ```

---

## 📈 5. Monitoring & Maintenance

- **View Logs:** `docker compose -f docker-compose.prod.yml logs -f`
- **Backup Database:**
  ```bash
  docker exec joino_db_prod pg_dump -U admin joino > backup_$(date +%F).sql
  ```

---

## 🤖 6. CI/CD with GitHub Actions

The project includes an automatic deployment workflow in `.github/workflows/deploy.yml`. To enable it, add the following **Actions Secrets** in your GitHub repository settings:

1.  `SERVER_IP`: Your server's public IP address.
2.  `SERVER_USER`: The SSH username (usually `root` or `ubuntu`).
3.  `SERVER_PASSWORD`: Your server account password.
4.  `SERVER_PATH`: The absolute path where you want the project to be located (e.g., `/var/www/joino`).

Once these secrets are set, every push to the `master` branch will trigger the workflow:
- If it's the first time, it will **auto-clone** the repository.
- If already exists, it will **pull**, **build**, and **redeploy** automatically.

---
*For support or queries, contact huynhhuynh02@gmail.com*
