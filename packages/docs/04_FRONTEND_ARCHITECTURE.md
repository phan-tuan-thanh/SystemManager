# Frontend Architecture

## 1. Tech Stack Frontend

| Package | Version | Mục đích |
|---------|---------|----------|
| React | 18 | UI framework |
| Vite | 5 | Build tool, dev server |
| TypeScript | 5 (strict) | Type safety |
| Ant Design (antd) | 5 | UI component library |
| React Router | 6 | Client-side routing |
| TanStack Query | 5 | Server state, caching, refetch |
| Zustand | 4 | Global client state |
| Axios | 1 | HTTP client |
| Apollo Client | 3 | GraphQL client |
| React Hook Form | 7 | Form state management |
| Zod | 3 | Schema validation |
| React Flow | 11 | Topology 2D interactive |
| vis-network | 9 | Topology 2D vis engine |
| Mermaid | 10 | Topology diagram render |
| React Three Fiber | 8 | Topology 3D |
| dayjs | 1 | Date formatting |
| papaparse | 5 | CSV parsing client-side |

---

## 2. Cấu trúc Thư mục Chi tiết

```
packages/frontend/src/
├── App.tsx                  # Root router, routes, lazy imports
├── main.tsx                 # React DOM render, QueryClient, ApolloClient
├── api/
│   ├── client.ts            # Axios instance, JWT interceptor, auto-refresh
│   └── hooks/               # TanStack Query hooks theo module
│       ├── useServers.ts    # useServerList, useServerDetail, useCreateServer...
│       ├── useApplications.ts
│       ├── useDeployments.ts
│       └── ...
├── graphql/
│   ├── apolloClient.ts      # Apollo Client config
│   ├── queries/
│   │   └── topology.ts      # GET_TOPOLOGY query
│   └── subscriptions/
│       └── topology.ts      # SERVER_STATUS_CHANGED subscription
├── stores/
│   ├── authStore.ts         # { user, token, isAuthenticated, login(), logout() }
│   └── uiStore.ts           # { sidebarCollapsed, theme }
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx    # Ant Design Layout wrapper
│   │   ├── Sidebar.tsx      # Menu navigation
│   │   └── Header.tsx       # Top bar, user dropdown, notifications
│   └── common/
│       ├── DataTable.tsx    # Reusable table với pagination, sort, filter
│       ├── ColumnMapper.tsx # CSV column mapping UI
│       ├── StatusBadge.tsx  # Colored badges cho enums
│       └── PageHeader.tsx   # Breadcrumb + action buttons
├── pages/                   # 1 folder = 1 domain
│   ├── auth/                # Login page
│   ├── dashboard/           # Overview metrics
│   ├── admin/               # User, UserGroup management
│   ├── server/              # Server list + detail
│   ├── hardware/            # Hardware inventory
│   ├── network/             # Network configs
│   ├── application/         # App list, AppGroups
│   ├── deployment/          # Deployment list + detail
│   ├── topology/            # Topology 2D/3D (phức tạp nhất)
│   ├── changeset/           # ChangeSet management
│   ├── connection/          # App connections
│   ├── app-import/          # Unified import (tabs)
│   ├── audit/               # Audit log viewer
│   └── setup/               # Setup wizard (first run)
└── types/
    ├── server.ts
    ├── application.ts
    ├── topology.ts
    └── ...
```

---

## 3. Routing (App.tsx)

```tsx
// Pattern: Protected routes, lazy loading
<Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route index element={<Navigate to="/dashboard" />} />
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="servers" element={<ServerList />} />
  <Route path="servers/:id" element={<ServerDetail />} />
  <Route path="applications" element={<ApplicationPage />} />
  <Route path="topology" element={<TopologyPage />} />
  <Route path="changesets" element={<ChangeSetList />} />
  <Route path="audit" element={<AuditLog />} />
  <Route path="admin/*" element={<AdminRoutes />} />
  {/* Redirects backward compat */}
  <Route path="app-upload" element={<Navigate to="/app-import?tab=app" />} />
</Route>
<Route path="/login" element={<Login />} />
<Route path="/setup" element={<Setup />} />
```

---

## 4. Data Fetching Pattern (TanStack Query)

### Hook pattern

```typescript
// api/hooks/useServers.ts
export function useServerList(params: ServerQuery) {
  return useQuery({
    queryKey: ['servers', params],
    queryFn: () => client.get('/servers', { params }).then(r => r.data),
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServerDto) => client.post('/servers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
```

### Trong Component

```tsx
function ServerList() {
  const [params, setParams] = useState({ page: 1, limit: 20 });
  const { data, isLoading } = useServerList(params);
  const create = useCreateServer();

  if (isLoading) return <Skeleton />;  // KHÔNG dùng Spinner
  return (
    <DataTable
      data={data?.data}
      meta={data?.meta}
      onPageChange={(p) => setParams(prev => ({ ...prev, page: p }))}
    />
  );
}
```

**Query key conventions:**
- List: `['servers', params]` — invalidate khi thêm/sửa/xóa
- Detail: `['servers', id]`
- Invalidate sau mutation: `queryClient.invalidateQueries({ queryKey: ['servers'] })`

---

## 5. Form Pattern (React Hook Form + Zod)

```tsx
const schema = z.object({
  name: z.string().min(1, 'Tên không được trống'),
  environment: z.enum(['DEV', 'UAT', 'PROD']),
  port_number: z.number().int().min(1).max(65535),
});

function ServerForm({ onSubmit }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Form onFinish={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Form.Item label="Tên" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
            <Input {...field} />
          </Form.Item>
        )}
      />
    </Form>
  );
}
```

---

## 6. Topology Page (Phức tạp nhất)

File chính: `pages/topology/index.tsx`

### Kiến trúc

```
TopologyPage (index.tsx)
├── TopologyFilterPanel.tsx  — filter bar ngang (engine, layout, edge style, node filter)
├── TopologyReactFlowView.tsx — React Flow 2D canvas
├── TopologyVisNetworkView.tsx — vis-network canvas
├── TopologyMermaidView.tsx   — Mermaid diagram
└── TopologyThreeView.tsx     — React Three Fiber 3D
```

### State trong index.tsx

```typescript
// Filter state
const [filters, setFilters] = useState({
  environment?: string,        // DEV | UAT | PROD
  nodeType: 'all',             // all | server | app
  showMiniMap: true,
  layout: 'force',             // force | hierarchical
  connectionMode: false,       // drag-to-connect mode
  edgeStyle: 'bezier',         // bezier | step (orthogonal)
  visibleGroupNames: string[], // [] = show all groups
  visibleServerIds: string[],  // [] = show all servers
  visibleAppIds: string[],     // [] = show all apps
});

// View mode
const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
const [renderEngine, setRenderEngine] = useState<'reactflow' | 'visnetwork' | 'mermaid'>('visnetwork');
```

### Data Flow Topology

```
GraphQL query topology(environment)
    → data.topology.servers (với deployments, ports, networkConfigs)
    → data.topology.connections

filteredData useMemo:
    1. Filter by environment
    2. Filter by visibleServerIds / visibleGroupNames / visibleAppIds
    3. Clean orphan connections (source/target không còn visible)

Passed to: TopologyReactFlowView / TopologyVisNetworkView / etc.
```

### Build Graph (React Flow)

```typescript
// buildGraph(servers, connections, layout, edgeStyle) → { nodes, edges }
// Nodes: ServerNode (type='server') + AppNode (type='app')
// Edges: ProtocolEdge với label protocol, offset khi parallel edges
// Layout: dagre (hierarchical) hoặc force-directed
```

---

## 7. Auth Flow (Frontend)

```typescript
// stores/authStore.ts (Zustand + persist)
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user, token) => void;
  logout: () => void;
}

// api/client.ts
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 8. Quy tắc Code Frontend

### Đặt tên
- Components: `PascalCase.tsx`
- Hooks: `use<Resource><Action>.ts` (VD: `useServerList`, `useCreateDeployment`)
- Types: `camelCase.ts` (VD: `server.ts`, `topology.ts`)
- Utils: `camelCase.ts` (VD: `formatDate.ts`, `buildGraph.ts`)

### UI Patterns bắt buộc
- Loading state: `<Skeleton />` — KHÔNG dùng `<Spin />` hay `<Spinner />`
- Delete confirmation: `<Popconfirm>` bắt buộc cho mọi destructive action
- Error toast: `message.error('...')` từ Ant Design
- KHÔNG `console.log` — dùng `logger.info(...)` từ `utils/logger.ts`

### Import CSV — Unified Page (`/app-import`)
Trang import tab với 3 tabs: `?tab=app`, `?tab=deployment`, `?tab=connection`

Mỗi tab là 4-step wizard:
1. Upload file CSV
2. Column Mapper (kéo thả mapping)
3. Preview table (sửa inline)
4. Import result (success/error per row)

### Topology Node Filter Modal
Được implement trong `TopologyFilterPanel.tsx`. Khi có `groupOptions` / `serverOptions` / `appOptions`, hiện button "Lọc node" mở Modal với:
- Search input (filter across tất cả sections)
- 3 `FilterSection` (Hệ thống, Servers, Ứng dụng)
- Local state trong modal — chỉ apply khi bấm "Áp dụng"
- Server items hiển thị IP làm description

---

## 9. GraphQL Client (Apollo)

```typescript
// graphql/apolloClient.ts
const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
  headers: { Authorization: `Bearer ${getToken()}` }
});

// Dùng subscription:
const { data } = useSubscription(SERVER_STATUS_CHANGED);
```

---

## 10. Logging Frontend

```typescript
// utils/logger.ts
const logger = {
  info: (msg: string, meta?: any) => { /* send to backend + console */ },
  warn: (msg: string, meta?: any) => { /* ... */ },
  error: (msg: string, error?: Error) => { /* ... */ },
  debug: (msg: string, meta?: any) => { /* only if LOG_LEVEL >= debug */ },
};
```

Logs được batch gửi về `POST /api/v1/admin/client-logs` (fire-and-forget).
