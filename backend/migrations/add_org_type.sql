-- Add org_type column to org_versions table
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS org_type VARCHAR(20) DEFAULT 'codificare';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_org_versions_org_type ON org_versions(org_type);
