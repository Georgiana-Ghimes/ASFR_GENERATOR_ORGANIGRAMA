-- Add chart_title column to org_versions table
ALTER TABLE org_versions 
ADD COLUMN chart_title VARCHAR DEFAULT 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026';
