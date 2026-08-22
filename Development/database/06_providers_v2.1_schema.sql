-- ==============================================================================
-- [CC-003] Schema v2.1 — Nuevas columnas e índices en providers
-- Agrega columnas contact_name y service_category, e implementa RLS.
-- ==============================================================================

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS contact_name     text,
  ADD COLUMN IF NOT EXISTS service_category text[],
  ADD COLUMN IF NOT EXISTS objective_tags   text[];

DELETE FROM provider_tags;
DELETE FROM providers;

-- Índices GIN para los nuevos campos de array
CREATE INDEX IF NOT EXISTS idx_providers_service_types    ON providers USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_providers_service_category ON providers USING GIN(service_category);

ALTER TABLE provider_tags DROP CONSTRAINT IF EXISTS provider_tags_tag_id_fkey;

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Lectura pública de providers activos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'providers_public_read' AND tablename = 'providers') THEN
        CREATE POLICY "providers_public_read" ON providers FOR SELECT USING (status = 'active');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'providers_admin_write' AND tablename = 'providers') THEN
        CREATE POLICY "providers_admin_write" ON providers FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;
END $$;
