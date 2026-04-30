# Deployment Guide

## 1. Kiến trúc Docker Compose

```yaml
services:
  db:        # PostgreSQL 15 — port 5432
  migrate:   # One-time: prisma migrate deploy + seed (chạy rồi exit)
  backend:   # NestJS — port 3000 (sau khi migrate hoàn tất)
  frontend:  # React/Vite — port 5173 (sau khi backend healthy)
```

**Dependency order:**
```
db (healthy) → migrate (completed) → backend (up) → frontend (up)
```

---

## 2. Biến Môi Trường

### Backend (`.env` hoặc `docker-compose.yml` environment section)

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|---------|---------|-------|
| `DATABASE_URL` | ✅ | — | `postgresql://user:pass@host:5432/dbname` |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret key cho access token (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret key cho refresh token (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | — | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | — | `7d` | Refresh token TTL |
| `PORT` | — | `3000` | Port backend listen |
| `NODE_ENV` | — | `development` | `development` hoặc `production` |
| `FRONTEND_URL` | — | `http://localhost:5173` | CORS whitelist |
| `MS365_CLIENT_ID` | ❌ SSO only | — | Azure AD App client ID |
| `MS365_CLIENT_SECRET` | ❌ SSO only | — | Azure AD App client secret |
| `MS365_TENANT_ID` | ❌ SSO only | — | Azure AD tenant |
| `MS365_REDIRECT_URI` | ❌ SSO only | — | OAuth callback URL |
| `UPLOAD_DIR` | — | `./uploads` | Thư mục lưu DeploymentDocs |
| `MAX_FILE_SIZE` | — | `20971520` | 20MB tính bằng bytes |

### Frontend (Vite build-time)

| Biến | Mặc định | Mô tả |
|------|---------|-------|
| `BACKEND_URL` | `http://backend:3000` | URL backend (trong container) |

---

## 3. Local Development

```bash
# Start toàn bộ
docker compose up -d

# Xem logs
docker compose logs -f

# Restart service cụ thể
docker compose restart backend

# Stop
docker compose down

# Stop + xóa volumes (reset DB)
docker compose down -v
```

---

## 4. Production Setup

### 4.1 Chuẩn bị

```bash
# Tạo .env.production với values thật
cat > .env.production << EOF
DATABASE_URL=postgresql://appuser:StrongPass@db-host:5432/systemmanager
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
EOF
```

### 4.2 Build Production Images

```bash
# Build backend
docker build -t systemmanager-backend:latest packages/backend/

# Build frontend (với BACKEND_URL cho production)
docker build \
  --build-arg BACKEND_URL=https://api.your-domain.com \
  -t systemmanager-frontend:latest packages/frontend/
```

### 4.3 docker-compose.prod.yml (Template)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: systemmanager
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - backend

  backend:
    image: systemmanager-backend:latest
    restart: always
    env_file: .env.production
    depends_on:
      - db
    networks:
      - backend
      - frontend
    volumes:
      - uploads:/app/uploads

  frontend:
    image: systemmanager-frontend:latest
    restart: always
    depends_on:
      - backend
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - frontend

networks:
  backend:
  frontend:

volumes:
  pgdata:
  uploads:
```

### 4.4 Nginx Config (Template)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        proxy_pass http://frontend:5173;
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # GraphQL
    location /graphql {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# HTTP redirect
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

---

## 5. CI/CD (GitHub Actions — Template)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: TypeScript check
        run: |
          cd packages/backend && npx tsc --noEmit
          cd packages/frontend && npx tsc --noEmit

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build images
        run: |
          docker build -t backend:${{ github.sha }} packages/backend/
          docker build -t frontend:${{ github.sha }} packages/frontend/
      - name: Deploy to server
        run: |
          # SSH deploy commands
          ssh deploy@your-server "cd /app && docker compose pull && docker compose up -d"
```

---

## 6. Health Checks

### Backend
```bash
curl http://localhost:3000/api/v1/system/status
# Expected: { "data": { "status": "OK", "initialized": true } }
```

### Database
```bash
docker compose exec db pg_isready -U postgres
# Expected: /var/run/postgresql:5432 - accepting connections
```

### All services
```bash
docker compose ps
# All services should be "running" hoặc "exited (0)" (migrate service)
```

---

## 7. Backup & Restore

### Backup PostgreSQL
```bash
# Backup
docker compose exec db pg_dump -U postgres system_manager > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U postgres system_manager < backup_20260430.sql
```

### Backup uploads
```bash
tar -czf uploads_$(date +%Y%m%d).tar.gz packages/backend/uploads/
```

---

## 8. Production Checklist

Trước khi deploy lên PROD:

- [ ] `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` đủ mạnh (min 32 chars random)
- [ ] `DATABASE_URL` trỏ đến DB production (không phải localhost)
- [ ] `NODE_ENV=production` (tắt Swagger UI, verbose logs)
- [ ] HTTPS/SSL configured
- [ ] Backup DB trước khi deploy
- [ ] Chạy `prisma migrate deploy` (KHÔNG `migrate dev` trên production)
- [ ] Test login flow sau deploy
- [ ] Kiểm tra `/api/v1/system/status` trả về `OK`
- [ ] Docker volumes được mount (không bị mất data khi restart)
- [ ] Firewall: chỉ expose port 80/443 ra ngoài (không 3000, 5432)
