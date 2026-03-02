-- Add snapshot_image column to org_versions table
ALTER TABLE org_versions ADD COLUMN IF NOT EXISTS snapshot_image TEXT;
