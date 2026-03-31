CREATE TABLE IF NOT EXISTS omti_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES org_versions(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omti_snapshots_version ON omti_snapshots(version_id);
CREATE INDEX IF NOT EXISTS idx_omti_snapshots_created ON omti_snapshots(created_at DESC);
