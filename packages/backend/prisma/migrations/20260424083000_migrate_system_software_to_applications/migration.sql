-- Set INFRASTRUCTURE for groups that have SYSTEM applications
UPDATE application_groups
SET group_type = 'INFRASTRUCTURE'
WHERE id IN (
  SELECT DISTINCT group_id FROM applications
  WHERE application_type = 'SYSTEM' AND deleted_at IS NULL
);

-- Set INFRASTRUCTURE for groups that have SystemSoftware
UPDATE application_groups
SET group_type = 'INFRASTRUCTURE'
WHERE id IN (
  SELECT DISTINCT group_id FROM system_software WHERE deleted_at IS NULL
);

-- Migrate SystemSoftware records to Applications
INSERT INTO applications (
  id, group_id, code, name, version, sw_type, eol_date, application_type, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  group_id,
  'SW_' || UPPER(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '_', 'g')),
  name,
  version,
  sw_type,
  eol_date,
  'SYSTEM',
  created_at,
  NOW()
FROM system_software
WHERE deleted_at IS NULL
ON CONFLICT (code) DO NOTHING;
