# Generate API Documentation

Generate or update OpenAPI/Swagger documentation for a module.

## Input
- Module name: $ARGUMENTS (e.g., "server", "deployment", or "all")

## Instructions

1. Read the controller file(s) for the specified module.
2. Ensure all endpoints have proper Swagger decorators:

```typescript
// Required decorators for each endpoint:
@ApiTags('<module-name>')
@ApiOperation({ summary: 'Short description' })
@ApiResponse({ status: 200, description: 'Success', type: EntityClass })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden — insufficient role' })
@ApiResponse({ status: 404, description: 'Not found' })

// For DTOs — each property needs:
@ApiProperty({ description: '...', example: '...', required: true/false })

// For query parameters:
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'sortBy', required: false, type: String })
@ApiQuery({ name: 'search', required: false, type: String })
```

3. Verify Swagger is accessible at `/api/docs` in dev mode.
4. Check that all DTOs have `@ApiProperty` with meaningful examples.
5. Ensure response types match actual response shapes.

## API Response Standards
```
GET    /api/v1/<resource>      → 200 { data: [], meta: { total, page, limit } }
GET    /api/v1/<resource>/:id  → 200 { data: { ... } }
POST   /api/v1/<resource>      → 201 { data: { ... } }
PATCH  /api/v1/<resource>/:id  → 200 { data: { ... } }
DELETE /api/v1/<resource>/:id  → 200 { data: { id, deleted: true } }
```
