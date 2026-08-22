-- =============================================================================
-- DPIRD Digital Advisory Platform - Indexes & Triggers
-- Target Database: Supabase (PostgreSQL 15+)
-- File: 02_indexes_and_triggers.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. B-Tree Indexes
-- Búsquedas rápidas por estado, fechas y jerarquías.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sectors_parent ON sectors(parent_id);
CREATE INDEX IF NOT EXISTS idx_sectors_slug ON sectors(slug);

CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_close_date ON grants(close_date);
CREATE INDEX IF NOT EXISTS idx_grants_dml ON grants(dml_min, dml_max);

CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);

CREATE INDEX IF NOT EXISTS idx_sessions_status ON diagnostic_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON diagnostic_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_consultant ON diagnostic_sessions(consultant_id);

CREATE INDEX IF NOT EXISTS idx_responses_session ON user_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question ON user_responses(question_id);

CREATE INDEX IF NOT EXISTS idx_match_session ON match_results(session_id, match_score DESC);

-- -----------------------------------------------------------------------------
-- 2. GIN Indexes (Array Matching)
-- Optimización para búsquedas con operadores de array (ej: &&, @>)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_grants_sector_tags ON grants USING GIN(sector_tags);
CREATE INDEX IF NOT EXISTS idx_grants_trigger_tags ON grants USING GIN(trigger_tags);
CREATE INDEX IF NOT EXISTS idx_grants_objective_tags ON grants USING GIN(objective_tags);
CREATE INDEX IF NOT EXISTS idx_providers_trigger_tags ON providers USING GIN(trigger_tags);
CREATE INDEX IF NOT EXISTS idx_sessions_activated_tags ON diagnostic_sessions USING GIN(activated_tags);

-- -----------------------------------------------------------------------------
-- 3. Automatic updated_at Function & Triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to grants
DROP TRIGGER IF EXISTS trigger_grants_updated_at ON grants;
CREATE TRIGGER trigger_grants_updated_at
  BEFORE UPDATE ON grants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to providers
DROP TRIGGER IF EXISTS trigger_providers_updated_at ON providers;
CREATE TRIGGER trigger_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to questions
DROP TRIGGER IF EXISTS trigger_questions_updated_at ON questions;
CREATE TRIGGER trigger_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to diagnostic_sessions
DROP TRIGGER IF EXISTS trigger_sessions_updated_at ON diagnostic_sessions;
CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON diagnostic_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
