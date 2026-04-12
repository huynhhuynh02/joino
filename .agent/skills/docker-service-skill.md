# Skill: Docker Service Pattern

## Purpose
Hướng dẫn thêm/cấu hình service trong Docker Compose cho ProjectFlow.

## Base docker-compose.yml Structure

```yaml
version: '3.9'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: projectflow_frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - NEXT_PUBLIC_WS_URL=ws://localhost:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - projectflow_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: projectflow_backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - PORT=4000
      - DATABASE_URL=postgresql://admin:secret@db:5432/projectflow
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=7d
      - SMTP_HOST=mail
      - SMTP_PORT=1025
      - SMTP_FROM=noreply@projectflow.local
      - UPLOAD_DIR=/app/uploads
      - MAX_FILE_SIZE=10485760
    volumes:
      - ./backend:/app
      - /app/node_modules
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy
      mail:
        condition: service_started
    restart: unless-stopped
    networks:
      - projectflow_network
    command: npm run dev

  db:
    image: postgres:16-alpine
    container_name: projectflow_db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: projectflow
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d projectflow"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - projectflow_network

  mail:
    image: mailhog/mailhog
    container_name: projectflow_mail
    ports:
      - "1025:1025"   # SMTP server
      - "8025:8025"   # Web UI
    restart: unless-stopped
    networks:
      - projectflow_network

volumes:
  postgres_data:
    driver: local
  uploads_data:
    driver: local

networks:
  projectflow_network:
    driver: bridge
```

## Dockerfile: Backend (Node.js)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 4000

# Dev: hot reload with tsx
CMD ["npm", "run", "dev"]
```

## Dockerfile: Frontend (Next.js)

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

## .dockerignore (both services)

```
node_modules
.next
.git
.env
*.log
dist
build
coverage
```

## .env.example

```bash
# ===== APPLICATION =====
NODE_ENV=development

# ===== JWT =====
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# ===== DATABASE =====
DATABASE_URL=postgresql://admin:secret@localhost:5432/projectflow

# ===== MAIL =====
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@projectflow.local

# ===== FRONTEND =====
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Common Docker Commands

```bash
# Start all services
docker-compose up -d

# Start + rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run Prisma migrations
docker-compose exec backend npx prisma migrate dev

# Seed database
docker-compose exec backend npx prisma db seed

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Stop all
docker-compose down

# Stop + remove volumes (⚠️ deletes data)
docker-compose down -v

# Access PostgreSQL directly
docker-compose exec db psql -U admin -d projectflow
```

## Adding a New Service Pattern

```yaml
# Add to docker-compose.yml under services:
  [service_name]:
    image: [docker_image]:[tag]
    container_name: projectflow_[name]
    ports:
      - "[host_port]:[container_port]"
    environment:
      KEY: value
    volumes:
      - [volume_name]:/data
    networks:
      - projectflow_network
    restart: unless-stopped
```

## Health Check Pattern

Always add health checks for critical services (DB, cache):
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

## Notes
- All services use the same `projectflow_network` bridge
- Internal service communication uses service name (e.g., `db`, `mail`) as hostname
- External access uses `localhost` with mapped ports
- MailHog web UI accessible at `http://localhost:8025` for dev email testing
