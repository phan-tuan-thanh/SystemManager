# Check Module Dependencies

Verify module dependency integrity based on the SRS module dependency graph.

## Input
- Module name or "all": $ARGUMENTS

## Instructions

1. Read `docs/SRS.md` section 4.0b and section 10 for the module dependency map.
2. Check the current codebase against the dependency rules.

## Module Dependency Graph (from SRS)

```
AUTH (always on) ← required by everything
MODULE_MGMT (always on) ← AUTH
AUDIT_LOG (always on) ← AUTH

SERVER_MGMT ← AUTH
HARDWARE_MGMT ← SERVER_MGMT
NETWORK_MGMT ← SERVER_MGMT
APP_GROUP ← AUTH
SOFTWARE_MGMT ← APP_GROUP
PORT_MGMT ← SOFTWARE_MGMT, SERVER_MGMT

TOPOLOGY_2D ← SERVER_MGMT, SOFTWARE_MGMT
TOPOLOGY_3D ← TOPOLOGY_2D
REALTIME_STATUS ← TOPOLOGY_2D
TOPOLOGY_SNAPSHOT ← TOPOLOGY_2D, AUDIT_LOG
CHANGESET ← TOPOLOGY_2D, AUDIT_LOG
DEPLOYMENT_DOCS ← SOFTWARE_MGMT
CHANGE_HISTORY ← AUDIT_LOG
IMPORT_CSV ← all CORE modules
SSH_SYNC ← SERVER_MGMT
ALERT ← AUDIT_LOG
```

## Checks to perform:

1. **Module Guard**: Each module's controller uses `@RequireModule('<MODULE_KEY>')` decorator
2. **Service Dependencies**: Verify modules only import services from their declared dependencies
3. **Enable/Disable Logic**: When disabling a module, check if dependents are still enabled (should block or cascade)
4. **Database Relations**: Verify foreign key relations only exist between modules that have declared dependencies
5. **Frontend Routes**: Protected routes check module availability before rendering
6. **Sidebar Menu**: Menu items are hidden when module is disabled

## Output
Report any dependency violations:
- ❌ Module X imports from Module Y but Y is not a declared dependency
- ❌ Module X can be disabled while Module Z (which depends on X) remains enabled
- ⚠️  Module X has no @RequireModule guard
- ✅ All dependencies are correctly declared and enforced
