-- Add approval tracking columns to org_versions table
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
