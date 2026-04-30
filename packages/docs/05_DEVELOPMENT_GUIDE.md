# Development Guide — Hướng dẫn Phát triển

## 1. Setup Môi trường

### Yêu cầu
| Tool | Phiên bản tối thiểu |
|------|-------------------|
| Docker Desktop | 4.x |
| Node.js | 20 LTS |
| Git | 2.x |

> Node.js chỉ cần cho editor tooling (type checking, ESLint). Runtime thật chạy trong Docker.

### Khởi động lần đầu

```bash
# 1. Clone
git clone git@github.com:phan-tuan-thanh/SystemManager.git
cd SystemManager

# 2. Tạo .env từ example
cp .env.example .env
# Chỉnh JWT_ACCESS_SECRET và JWT_REFRESH_SECRET (bất kỳ string nào cho local)

# 3. Chạy toàn bộ stack
docker compose up -d

# 4. Theo dõi log
docker compose logs -f backend
docker compose logs -f frontend
```

Sau ~60 giây, hệ thống sẵn sàng:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

### Khởi động nhanh (sau lần đầu)

```bash
./start.sh          # Script tự động start + health check
# hoặc
docker compose up -d
```

---

## 2. Development Workflow

### Hot reload

```bash
# Backend hot reload (nodemon trong Docker)
docker compose up backend --watch

# Frontend hot reload (Vite HMR)
# Đã tự động — source được mount vào container
```

### Chạy migrations sau khi thay đổi schema

```bash
# Trong container backend
docker compose exec backend sh -c "cd /app && npx prisma migrate dev --name <tên>"

# Hoặc tạo migration locally (cần DATABASE_URL trỏ đến Docker)
cd packages/backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/system_manager" \
  npx prisma migrate dev --name <tên_migration>
```

### Reset database

```bash
docker compose down -v        # Xóa volumes
docker compose up -d          # Tạo lại từ đầu + seed
```

---

## 3. Code Conventions

### 3.1 Backend (NestJS)

#### DTOs — Validation
```typescript
// ĐÚNG
@IsIn(['DEV', 'UAT', 'PROD'] as const)
environment: string;

// SAI — Không dùng @IsEnum với Prisma enum
@IsEnum(Environment)
environment: Environment;
```

#### Decorators — Roles
```typescript
// ĐÚNG
@Roles('ADMIN', 'OPERATOR')

// SAI
@Roles(Role.ADMIN, Role.OPERATOR)
```

#### Service — Soft delete
```typescript
// ĐÚNG
await this.prisma.server.update({
  where: { id },
  data: { deleted_at: new Date() }
});

// SAI
await this.prisma.server.delete({ where: { id } });
```

#### Service — List query luôn filter deleted
```typescript
const servers = await this.prisma.server.findMany({
  where: {
    deleted_at: null,        // BẮT BUỘC
    environment: query.environment,
  },
  skip: (query.page - 1) * query.limit,
  take: query.limit,
});
```

#### Response format
```typescript
// List
return { data: servers, meta: { total, page, limit } };

// Single
return { data: server };
```

#### Module registration
Module mới bắt buộc đăng ký trong `packages/backend/src/app.module.ts`:
```typescript
@Module({
  imports: [
    // ...existing modules
    NewFeatureModule,
  ],
})
export class AppModule {}
```

### 3.2 Frontend (React)

#### KHÔNG console.log
```typescript
// ĐÚNG
import { logger } from '@/utils/logger';
logger.info('Server created', { id: server.id });

// SAI
console.log('server', server);
```

#### Skeleton loader
```tsx
// ĐÚNG
if (isLoading) return <Skeleton active paragraph={{ rows: 5 }} />;

// SAI
if (isLoading) return <Spin />;
```

#### Destructive action
```tsx
// BẮT BUỘC Popconfirm cho Delete
<Popconfirm
  title="Xác nhận xóa server này?"
  onConfirm={() => deleteServer.mutate(id)}
  okText="Xóa"
  cancelText="Hủy"
>
  <Button danger>Xóa</Button>
</Popconfirm>
```

#### Sau mutation
```typescript
const deleteServer = useMutation({
  mutationFn: (id: string) => client.delete(`/servers/${id}`),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['servers'] });
    message.success('Đã xóa server');
  },
  onError: () => message.error('Xóa thất bại'),
});
```

---

## 4. Git Workflow

### Branch Strategy

```
main (stable, production)
  └── sprint/N (sprint integration branch)
        ├── feat/<module>-<description>
        ├── fix/<module>-<description>
        └── chore/<description>
```

### Quy trình hàng ngày

```bash
# Bắt đầu tính năng mới
git checkout sprint/20            # Checkout sprint branch
git pull origin sprint/20         # Sync mới nhất
git checkout -b feat/server-bulk-export

# Code...

# Commit
git add packages/backend/src/modules/server/
git add packages/frontend/src/pages/server/
git commit -m "feat(server): add bulk export CSV endpoint"

# Push và mở PR về sprint/20
git push -u origin feat/server-bulk-export
# Mở PR: feat/server-bulk-export → sprint/20
```

### Commit Message Format (Conventional Commits)

```
feat(module): mô tả ngắn
fix(module): mô tả lỗi đã fix
chore(deps): update dependency X
docs(api): cập nhật API reference
refactor(topology): tách component lớn
test(server): thêm unit tests service
```

Module examples: `auth`, `server`, `application`, `topology`, `deployment`, `connection`, `changeset`

### KHÔNG commit
- `.env`, `.env.*`
- `node_modules/`
- `*.secret`, `*.key`
- File `.claude/`, `.secrects/`

---

## 5. TypeScript Check

```bash
# Backend
cd packages/backend
npx tsc --noEmit 2>&1 | head -50

# Frontend
cd packages/frontend
npx tsc --noEmit 2>&1 | head -50
```

**Fix lỗi TS trước khi commit — không bỏ qua.**

---

## 6. Testing

### Backend Unit Tests
```bash
docker compose exec backend sh -c "npm run test"
# Hoặc specific file:
docker compose exec backend sh -c "npm run test -- --testPathPattern=server.service"
```

Pattern test:
```typescript
describe('ServerService', () => {
  it('should create a server with valid data', async () => { ... });
  it('should throw ConflictException when IP already exists', async () => { ... });
  it('should soft delete instead of hard delete', async () => { ... });
});
```

### Smoke Test nhanh (Manual)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"Admin@123"}' | jq -r '.data.access_token')

# Test endpoint bất kỳ
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/servers | jq '.meta'

# Test 401
curl -s http://localhost:3000/api/v1/servers | jq '.statusCode'
# Expected: 401
```

---

## 7. Debug Tips

### Xem log backend
```bash
docker compose logs -f backend
docker compose logs -f backend --since 5m   # 5 phút gần nhất
```

### Prisma Studio (Database GUI)
```bash
docker compose exec backend sh -c "npx prisma studio --port 5555 --hostname 0.0.0.0"
# Truy cập: http://localhost:5555
```

### Query DB trực tiếp
```bash
docker compose exec db psql -U postgres -d system_manager
# \dt             — list tables
# \d servers      — describe table
# SELECT * FROM servers WHERE deleted_at IS NULL LIMIT 5;
```

### Reset và seed lại data
```bash
docker compose exec backend sh -c "npx ts-node --transpile-only prisma/seed.ts"
```

---

## 8. Thêm Module Mới (Checklist)

```
[ ] Tạo thư mục packages/backend/src/modules/<name>/
[ ] Tạo <name>.module.ts, .controller.ts, .service.ts
[ ] Tạo DTOs (create, update, query)
[ ] Tạo entity (response shape)
[ ] Đăng ký trong app.module.ts
[ ] Thêm route prefix /api/v1/<name>
[ ] Thêm @ApiOperation trên mọi endpoint
[ ] Thêm @Roles decorator phù hợp
[ ] Viết unit tests cho service
[ ] Tạo page frontend packages/frontend/src/pages/<name>/
[ ] Thêm route trong App.tsx
[ ] Tạo TanStack Query hooks
[ ] Thêm menu item trong Sidebar.tsx
[ ] Cập nhật API Reference (packages/docs/03_API_REFERENCE.md)
```
