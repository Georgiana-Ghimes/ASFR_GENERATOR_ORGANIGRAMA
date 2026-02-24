-- Add validity date columns to org_versions table
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS valid_until DATE;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_org_versions_valid_from ON org_versions(valid_from);
CREATE INDEX IF NOT EXISTS idx_org_versions_valid_until ON org_versions(valid_until);
