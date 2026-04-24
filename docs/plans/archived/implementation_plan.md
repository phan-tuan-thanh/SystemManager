# Fix Server CSV Upload & Simplify Import

The user wants to simplify the import functionality by removing the general "Infrastructure" upload and focusing only on "Server" upload. Additionally, we need to fix the OS and Hardware details import/display.

## User Review Required

> [!IMPORTANT]
> The "Upload file hạ tầng" (Infra + Apps) option will be removed. Only "Server chi tiết (OS + Phần cứng)" will remain in the infrastructure group.

## Proposed Changes

### Database & Backend

#### [MODIFY] [schema.prisma](file:///Users/ptud/Documents/Labs/SystemManager/packages/backend/prisma/schema.prisma)
- Add `os String? @db.VarChar(255)` to the `Server` model.

#### [MODIFY] [import.service.ts](file:///Users/ptud/Documents/Labs/SystemManager/packages/backend/src/modules/import/import.service.ts)
- Update `importServer` logic:
    - Map the `os` column from CSV to the new `server.os` field.
    - Stop appending OS to the `description` field.
    - Ensure `cpu`, `ram`, and `total_storage_gb` are correctly parsed and saved as `HardwareComponent` specs.

#### [MODIFY] [server.service.ts](file:///Users/ptud/Documents/Labs/SystemManager/packages/backend/src/modules/server/server.service.ts)
- Ensure the `os` field is included in the response and update logic.

#### [MODIFY] [create-server.dto.ts](file:///Users/ptud/Documents/Labs/SystemManager/packages/backend/src/modules/server/dto/create-server.dto.ts) and [update-server.dto.ts](file:///Users/ptud/Documents/Labs/SystemManager/packages/backend/src/modules/server/dto/update-server.dto.ts)
- Add `os` field to the DTOs.

### Frontend

#### [MODIFY] [Sidebar.tsx](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/components/layout/Sidebar.tsx)
- Rename `/infra-upload` menu item label from "Upload" to "Upload Server".

#### [MODIFY] [infra-upload/index.tsx](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/pages/infra-upload/index.tsx)
- Remove `Segmented` control for switching between `infra` and `server`.
- Set `importType` to `server` by default.
- Remove all "infra" import logic and UI elements.
- Rename page title to "Upload Server".

#### [MODIFY] [types/server.ts](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/types/server.ts)
- Add `os?: string;` to the `Server` interface.

#### [MODIFY] [pages/server/[id].tsx](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/pages/server/[id].tsx)
- Add "Hệ điều hành" (OS) to the `Descriptions` component in the info tab.

#### [MODIFY] [pages/server/components/HardwareTab.tsx](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/pages/server/components/HardwareTab.tsx)
- Add a "Thông số" (Specs) column to the hardware table.
- Display cores for CPU, and GB for RAM/HDD/SSD based on the `specs` field.

#### [MODIFY] [pages/server/components/ServerForm.tsx](file:///Users/ptud/Documents/Labs/SystemManager/packages/frontend/src/pages/server/components/ServerForm.tsx)
- Add an "Hệ điều hành" (OS) input field to the server form.

## Verification Plan

### Automated Tests
- Perform a CSV upload using the sample provided by the user.
- Verify the `Server` record has the correct `os`.
- Verify `HardwareComponent` records are created for CPU, RAM, and HDD with correct `specs`.

### Manual Verification
- Confirm the sidebar shows "Upload Server" under Infrastructure.
- Confirm "Hệ điều hành" is displayed on the Server Detail page.
- Confirm the "Phần cứng" tab shows correct specs.
