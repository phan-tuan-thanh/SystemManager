# Generate Tests

Generate unit and integration tests for a module or component.

## Input
- Target: $ARGUMENTS (e.g., "backend/server", "frontend/server", "backend/auth", file path)

## Instructions

### For Backend Service Tests (`*.service.spec.ts`)

1. Read the service file to understand all methods.
2. Create tests in `__tests__/<name>.service.spec.ts`:

```typescript
describe('<ServiceName>', () => {
  let service: ServiceName;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    // Setup test module with mocked PrismaService
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {});
    it('should filter by status', async () => {});
    it('should exclude soft-deleted records', async () => {});
  });

  describe('findOne', () => {
    it('should return entity by id', async () => {});
    it('should throw NotFoundException if not found', async () => {});
    it('should throw NotFoundException for soft-deleted entity', async () => {});
  });

  describe('create', () => {
    it('should create and return new entity', async () => {});
    it('should throw ConflictException for duplicate unique fields', async () => {});
  });

  describe('update', () => {
    it('should update and return entity', async () => {});
    it('should throw NotFoundException if not found', async () => {});
  });

  describe('remove', () => {
    it('should soft delete (set deleted_at)', async () => {});
    it('should NOT hard delete', async () => {});
  });
});
```

### For Backend Controller Tests (`*.controller.spec.ts`)

1. Test HTTP layer: status codes, request validation, role authorization.
2. Mock the service layer.
3. Test cases:
   - Valid requests return correct status codes
   - Invalid DTOs return 400
   - Unauthorized requests return 401
   - Wrong role returns 403
   - Not found returns 404

### For Frontend Component Tests (`*.test.tsx`)

1. Read the component to understand its behavior.
2. Use Vitest + Testing Library:

```typescript
describe('<ComponentName>', () => {
  it('renders loading skeleton initially', () => {});
  it('renders data table when loaded', () => {});
  it('shows empty state when no data', () => {});
  it('calls API on filter change', () => {});
  it('shows confirmation modal on delete', () => {});
  it('navigates to detail page on row click', () => {});
});
```

### For Frontend Hook Tests (`*.test.ts`)

1. Test TanStack Query hooks with `renderHook` and `QueryClientProvider`.
2. Mock API responses with MSW (Mock Service Worker).

## Test Quality Rules
- Each test tests ONE thing
- Test behavior, not implementation
- Use meaningful test data (not "test123")
- Mock at boundaries (DB, HTTP), not internal functions
- Negative cases are as important as positive cases
- Test edge cases: empty list, max pagination, special characters in search
