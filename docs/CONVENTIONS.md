# Coding Conventions & Standards

Tài liệu quy chuẩn coding cho dự án SystemManager. Tất cả contributors (human & AI agent) phải tuân thủ.

---

## 1. Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Database table | snake_case, plural | `app_deployments`, `audit_logs` |
| Database column | snake_case | `created_at`, `server_id` |
| Database enum | UPPER_SNAKE_CASE | `ACTIVE`, `APP_SERVER` |
| TypeScript class | PascalCase | `ServerService`, `CreateServerDto` |
| TypeScript method | camelCase | `findAll()`, `softDelete()` |
| TypeScript interface | PascalCase, no "I" prefix | `Server`, `PaginatedResult` |
| TypeScript enum | PascalCase (name), UPPER_SNAKE_CASE (values) | `enum Role { ADMIN = 'ADMIN' }` |
| REST endpoint | kebab-case, plural | `/api/v1/app-deployments` |
| React component | PascalCase | `ServerList.tsx`, `TopologyView.tsx` |
| React hook | camelCase, "use" prefix | `useServers.ts`, `useAuth.ts` |
| CSS class | kebab-case (if custom) | Prefer Ant Design tokens |
| File (backend) | kebab-case | `server.service.ts`, `create-server.dto.ts` |
| File (frontend) | PascalCase (component), camelCase (util/hook) | `ServerList.tsx`, `useServers.ts` |
| Git branch | type/module-description | `feat/server-crud`, `fix/auth-refresh` |
| Commit message | conventional commits | `feat(server): add CRUD endpoints` |

---

## 2. TypeScript Rules

```typescript
// ✅ DO
- Use strict mode (strict: true in tsconfig)
- Use explicit return types on public methods
- Use enums for fixed sets of values
- Use `readonly` where mutation is not needed
- Use discriminated unions over type assertions

// ❌ DON'T
- Use `any` — use `unknown` if type is truly unknown
- Use `!` non-null assertion — handle null properly
- Use `@ts-ignore` — fix the type error
- Export default — use named exports
- Use class inheritance for code reuse — use composition
```

---

## 3. Backend Patterns

### Controller Pattern
```typescript
@Controller('servers')
@ApiTags('servers')
@UseGuards(AuthGuard, RolesGuard, ModuleGuard)
@RequireModule('SERVER_MGMT')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  @ApiOperation({ summary: 'List servers with pagination' })
  findAll(@Query() query: QueryServerDto) {
    return this.serverService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiOperation({ summary: 'Create a new server' })
  create(@Body() dto: CreateServerDto, @CurrentUser() user: User) {
    return this.serverService.create(dto, user);
  }
}
```

### Service Pattern
```typescript
@Injectable()
export class ServerService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryServerDto): Promise<PaginatedResult<Server>> {
    const where: Prisma.ServerWhereInput = {
      deletedAt: null, // Always exclude soft-deleted
      ...(query.status && { status: query.status }),
      ...(query.environment && { environment: query.environment }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { hostname: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.server.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.server.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async remove(id: string): Promise<void> {
    // Soft delete — NEVER use prisma.server.delete()
    await this.prisma.server.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

### DTO Pattern
```typescript
export class CreateServerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ example: 'SRV-001' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Production App Server 1' })
  name: string;

  @IsEnum(ServerType)
  @ApiProperty({ enum: ServerType, example: ServerType.APP_SERVER })
  type: ServerType;

  @IsEnum(Environment)
  @ApiProperty({ enum: Environment, example: Environment.PROD })
  environment: Environment;

  @IsEnum(ServerStatus)
  @IsOptional()
  @ApiProperty({ enum: ServerStatus, default: ServerStatus.ACTIVE })
  status?: ServerStatus;
}

export class UpdateServerDto extends PartialType(CreateServerDto) {}

export class QueryServerDto extends PaginationDto {
  @IsEnum(ServerStatus)
  @IsOptional()
  status?: ServerStatus;

  @IsEnum(Environment)
  @IsOptional()
  environment?: Environment;

  @IsString()
  @IsOptional()
  search?: string;
}
```

---

## 4. Frontend Patterns

### API Hook Pattern
```typescript
// hooks/useServers.ts
const QUERY_KEY = 'servers';

export function useServerList(filters: ServerFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => api.get('/servers', { params: filters }),
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServerDto) => api.post('/servers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      message.success('Server created successfully');
    },
  });
}
```

### Page Component Pattern
```typescript
// pages/server/index.tsx
export function ServerListPage() {
  const [filters, setFilters] = useSearchParams(); // URL state
  const { data, isLoading } = useServerList(parseFilters(filters));

  return (
    <PageLayout title="Server Management">
      <ServerFilter value={filters} onChange={setFilters} />
      <ServerTable
        data={data?.data}
        loading={isLoading}
        pagination={data?.meta}
      />
    </PageLayout>
  );
}
```

---

## 5. Error Handling

### Backend
```typescript
// ✅ Use NestJS built-in exceptions
throw new NotFoundException(`Server with ID ${id} not found`);
throw new ConflictException(`Server code ${code} already exists`);
throw new BadRequestException('Invalid date range');
throw new ForbiddenException('Insufficient permissions');

// ❌ Don't catch and swallow errors silently
// ❌ Don't return error as data ({ success: false, error: ... })
// ❌ Don't use generic Error — use typed exceptions
```

### Frontend
```typescript
// Page-level: Error Boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <ServerListPage />
</ErrorBoundary>

// Action-level: Toast notification
onError: (error) => {
  message.error(error.response?.data?.error?.message || 'Operation failed');
}
```

---

## 6. Git Workflow

1. Create branch from `main`: `feat/<module>-<description>`
2. Develop with small, focused commits
3. Run tests locally: `npm test`
4. Run lint: `npm run lint`
5. Create PR with description following template
6. Code review (human or `/review-pr`)
7. Merge to `main` (squash merge preferred)

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`
Scope: module name (e.g., `server`, `auth`, `topology`)
