# Initialize Project

Bootstrap the full project structure with monorepo setup, backend, and frontend.

## Instructions

1. Read `CLAUDE.md` for the complete project structure and tech stack.
2. Read `docs/SRS.md` for requirements context.

## Step-by-step

### 1. Root — Monorepo Setup
- Initialize `package.json` with workspaces: `["packages/*"]`
- Create `.gitignore` (node_modules, dist, .env, .DS_Store, coverage, *.log)
- Create `.env.example` with all required environment variables
- Create `docker-compose.yml` (PostgreSQL, Redis if needed, app services)
- Create root `tsconfig.json` (base config)

### 2. Backend — NestJS
```bash
# In packages/backend/
- package.json with dependencies: @nestjs/core, @nestjs/platform-express, 
  @nestjs/swagger, @nestjs/graphql, @nestjs/apollo, @nestjs/passport, 
  @nestjs/jwt, @prisma/client, class-validator, class-transformer,
  bcrypt, passport-jwt, passport-local
- tsconfig.json extending root
- nest-cli.json
- src/main.ts — bootstrap with Swagger, CORS, ValidationPipe, prefix /api/v1
- src/app.module.ts — register global modules
- src/common/ — guards, decorators, interceptors, filters, pipes
- prisma/schema.prisma — datasource + initial models (User, Role)
```

### 3. Frontend — React + Vite
```bash
# In packages/frontend/
- package.json with: react, react-dom, react-router-dom, antd, 
  @tanstack/react-query, zustand, axios, react-hook-form, zod,
  @hookform/resolvers
- vite.config.ts with proxy to backend API
- tsconfig.json
- src/main.tsx — QueryClientProvider, BrowserRouter, AntD ConfigProvider
- src/App.tsx — router setup
- src/api/client.ts — axios instance with interceptors (auth token, error handling)
- src/stores/authStore.ts — auth state (user, tokens, login/logout)
- src/components/layout/ — AppLayout, Sidebar, Header
```

### 4. Docker Compose
```yaml
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: system_manager
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
  
  backend:
    build: ./packages/backend
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/system_manager
    ports: ["3000:3000"]
  
  frontend:
    build: ./packages/frontend
    depends_on: [backend]
    ports: ["5173:5173"]
```

### 5. Environment Variables (.env.example)
```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/system_manager

# JWT
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Microsoft 365 SSO (optional — Phase 1b)
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/v1/auth/microsoft/callback

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=20971520

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 6. Initial Prisma Schema
Create base models: User, Role, UserGroup, UserGroupMember, UserRole, ModuleConfig, AuditLog

### 7. Verify
- `npm install` from root works
- `docker-compose up db` starts PostgreSQL
- `npx prisma migrate dev` creates initial tables
- Backend starts and Swagger UI loads at `/api/docs`
- Frontend starts and shows login page

## Checklist
- [ ] Monorepo structure with workspaces
- [ ] Backend boots with NestJS + Swagger
- [ ] Frontend boots with Vite + React
- [ ] Docker Compose for PostgreSQL
- [ ] .env.example with all variables
- [ ] .gitignore configured
- [ ] Prisma schema with base models
- [ ] Global guards (Auth, Roles, Module) registered
- [ ] Audit log interceptor registered
- [ ] ESLint + Prettier configured
