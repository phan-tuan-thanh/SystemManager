# Scaffold New Frontend Page Module

Create a new React page module following the project's standard structure.

## Input
- Page/module name: $ARGUMENTS (e.g., "server", "deployment", "topology")

## Instructions

1. Read `CLAUDE.md` for frontend conventions.
2. Read `docs/SRS.md` section for UI/UX requirements of this module.
3. Create the following files under `packages/frontend/src/pages/<module-name>/`:

```
<module-name>/
├── index.tsx                    # Page entry (list view)
├── [id].tsx                     # Detail view (if applicable)
├── components/
│   ├── <Name>List.tsx           # Table/list component
│   ├── <Name>Form.tsx           # Create/Edit form (modal or page)
│   ├── <Name>Detail.tsx         # Detail view content
│   └── <Name>Filter.tsx         # Filter bar component
└── hooks/
    └── use<Name>.ts             # API hooks (useQuery, useMutation)
```

4. **API hooks** (`hooks/use<Name>.ts`):
   - `use<Name>List(filters)` — paginated list query
   - `use<Name>Detail(id)` — single item query
   - `useCreate<Name>()` — create mutation with optimistic update
   - `useUpdate<Name>()` — update mutation
   - `useDelete<Name>()` — soft delete mutation
   - Use TanStack Query (useQuery, useMutation)
   - Configure proper query keys for cache invalidation

5. **List component**: Use Ant Design `Table` with:
   - Server-side pagination (page, limit)
   - Column sorting
   - Filter bar (status, environment, search text)
   - Action column (view, edit, delete with confirmation)
   - Skeleton loading state

6. **Form component**: Use React Hook Form + Zod:
   - Validation matching backend DTOs
   - Can be rendered as Modal (for simple entities) or full page (for complex ones)
   - Pre-fill for edit mode

7. **Detail component**: Tab-based layout showing:
   - Basic info
   - Related entities (sub-tables)
   - Change history timeline (if applicable)

8. **Routing**: Add routes in the router config:
   - `/<module-name>` → list page
   - `/<module-name>/:id` → detail page
   - `/<module-name>/create` → create page (if not modal)

## Checklist
- [ ] API hooks use proper TanStack Query patterns
- [ ] Table has pagination, sorting, filtering
- [ ] Form validates input with Zod
- [ ] Delete has confirmation modal
- [ ] Loading states use Skeleton (not Spinner)
- [ ] Error states handled (toast for actions, boundary for pages)
- [ ] Routes registered in router config
- [ ] Component uses Ant Design consistently
