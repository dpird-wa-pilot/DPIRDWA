-- =============================================================================
-- DPIRD Digital Advisory Platform - Row Level Security (RLS) Policies
-- Target Database: Supabase (PostgreSQL 15+)
-- File: 03_rls_policies.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enable RLS on all tables
-- -----------------------------------------------------------------------------
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Domain Content Policies (Lectura pública para catálogo del Wizard)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public read access on active sectors" ON sectors;
CREATE POLICY "Allow public read access on active sectors"
  ON sectors FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access on active tags" ON tags;
CREATE POLICY "Allow public read access on active tags"
  ON tags FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access on visible grants" ON grants;
CREATE POLICY "Allow public read access on visible grants"
  ON grants FOR SELECT
  USING (status IN ('open', 'coming_soon', 'ongoing'));

DROP POLICY IF EXISTS "Allow public read access on grant_tags" ON grant_tags;
CREATE POLICY "Allow public read access on grant_tags"
  ON grant_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on active providers" ON providers;
CREATE POLICY "Allow public read access on active providers"
  ON providers FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Allow public read access on provider_tags" ON provider_tags;
CREATE POLICY "Allow public read access on provider_tags"
  ON provider_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on grant_providers" ON grant_providers;
CREATE POLICY "Allow public read access on grant_providers"
  ON grant_providers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on active questions" ON questions;
CREATE POLICY "Allow public read access on active questions"
  ON questions FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read access on question_tags" ON question_tags;
CREATE POLICY "Allow public read access on question_tags"
  ON question_tags FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- Operational Policies (Diagnostic Sessions, Responses, Match Results)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public insert on diagnostic_sessions" ON diagnostic_sessions;
CREATE POLICY "Allow public insert on diagnostic_sessions"
  ON diagnostic_sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on diagnostic_sessions" ON diagnostic_sessions;
CREATE POLICY "Allow public read on diagnostic_sessions"
  ON diagnostic_sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public update on diagnostic_sessions" ON diagnostic_sessions;
CREATE POLICY "Allow public update on diagnostic_sessions"
  ON diagnostic_sessions FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow insert on user_responses" ON user_responses;
CREATE POLICY "Allow insert on user_responses"
  ON user_responses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select on user_responses" ON user_responses;
CREATE POLICY "Allow select on user_responses"
  ON user_responses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert on match_results" ON match_results;
CREATE POLICY "Allow insert on match_results"
  ON match_results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select on match_results" ON match_results;
CREATE POLICY "Allow select on match_results"
  ON match_results FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- Consultants Policy (Acceso para usuarios autenticados de DPIRD)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow authenticated consultants read access" ON consultants;
CREATE POLICY "Allow authenticated consultants read access"
  ON consultants FOR SELECT
  TO authenticated
  USING (true);
