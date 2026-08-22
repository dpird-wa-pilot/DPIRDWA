-- ==============================================================================
-- [CC-002] DPIRD Database Schema Update - Resources & Match Results
-- Creates the resources and resource_tags tables, Configures RLS policies,
-- and updates the match_results constraint to support resources.
-- ==============================================================================

DROP TABLE IF EXISTS resource_tags CASCADE;
DROP TABLE IF EXISTS resources CASCADE;

-- 1. Create resources table
CREATE TABLE resources (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  title                 text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  resource_type         text NOT NULL CHECK (resource_type IN (
                          'book_chapter',
                          'journal_article',
                          'research_report'
                        )),

  -- Autoría
  authors               text[],
  author_affiliations   text[],

  -- Descripción
  abstract              text,
  summary               text,

  -- Publicación
  publication_date      date,
  publisher             text,
  journal_name          text,
  volume_issue          text,
  doi                   text,
  isbn                  text,
  report_number         text,

  -- Acceso — siempre vía biblioteca DPIRD
  library_url           text NOT NULL,

  -- Taxonomía dual
  raw_disciplines       text[],        -- taxonomía original de la biblioteca
  sector_tags           text[],        -- slugs de sectors
  trigger_tags          text[],        -- tags del sistema BFS
  dml_levels            text[],        -- ['foundational','emerging','established','advanced']

  -- Admin
  is_featured           boolean DEFAULT false,
  is_active             boolean DEFAULT true,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- 2. Create resource_tags junction table
CREATE TABLE resource_tags (
  resource_id   uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id        uuid,
  PRIMARY KEY   (resource_id, tag_id)
);

-- 3. GIN Indexes for Array Columns and general indexes
CREATE INDEX idx_resources_type          ON resources(resource_type);
CREATE INDEX idx_resources_is_active     ON resources(is_active);
CREATE INDEX idx_resources_trigger_tags  ON resources USING GIN(trigger_tags);
CREATE INDEX idx_resources_sector_tags   ON resources USING GIN(sector_tags);
CREATE INDEX idx_resources_dml_levels    ON resources USING GIN(dml_levels);

-- 4. Set updated_at trigger (Requires moddatetime extension if not already enabled)
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Lectura pública (anon puede leer recursos activos)
CREATE POLICY "resources_public_read"
  ON resources FOR SELECT
  USING (is_active = true);

-- Solo admin puede modificar
CREATE POLICY "resources_admin_write"
  ON resources FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- resource_tags: lectura pública
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_tags_public_read"
  ON resource_tags FOR SELECT
  USING (true);

-- 6. Update match_results check constraint to include 'resource'
ALTER TABLE match_results
  DROP CONSTRAINT match_results_result_type_check;

ALTER TABLE match_results
  ADD CONSTRAINT match_results_result_type_check
  CHECK (result_type IN ('grant', 'provider', 'resource'));

-- 7. Add generic result_id / result_name to match_results
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS result_id uuid;
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS result_name text;

-- 8. Migrate any existing match_results data
UPDATE match_results
  SET result_id = grant_id, result_name = (SELECT name FROM grants WHERE id = grant_id)
  WHERE result_type = 'grant' AND grant_id IS NOT NULL;

UPDATE match_results
  SET result_id = provider_id, result_name = (SELECT name FROM providers WHERE id = provider_id)
  WHERE result_type = 'provider' AND provider_id IS NOT NULL;

-- Columns 'grant_id', 'provider_id', 'grant_or_provider_name' are now deprecated
-- and can be dropped safely once frontend migration is confirmed.
