-- =============================================================================
-- DPIRD Digital Advisory Platform - Database Schema Script (Phase 2 MVP)
-- Target Database: Supabase (PostgreSQL 15+)
-- File: 01_schema.sql
-- =============================================================================

-- Enable pgcrypto extension for UUID generation if not present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables to ensure clean recreation of schema constraints
DROP TABLE IF EXISTS match_results CASCADE;
DROP TABLE IF EXISTS user_responses CASCADE;
DROP TABLE IF EXISTS diagnostic_sessions CASCADE;
DROP TABLE IF EXISTS consultants CASCADE;
DROP TABLE IF EXISTS question_tags CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS grant_providers CASCADE;
DROP TABLE IF EXISTS provider_tags CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS grant_tags CASCADE;
DROP TABLE IF EXISTS grants CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;

-- -----------------------------------------------------------------------------
-- 1. sectors
-- Vocabulario controlado de industrias y sub-sectores.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sectors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  parent_id     uuid REFERENCES sectors(id) ON DELETE SET NULL,
  icon          text,
  description   text,
  is_active     boolean DEFAULT true,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. tags
-- Sistema de etiquetas compartido entre preguntas, grants y providers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  label         text NOT NULL,
  category      text NOT NULL,
  description   text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. grants
-- Catálogo de programas de apoyo disponibles.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grants (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  administering_body    text NOT NULL,
  url                   text,
  description           text,
  summary               text,

  program_type          text NOT NULL CHECK (program_type IN (
                          'monetary_grant',
                          'rebate',
                          'accreditation',
                          'loan',
                          'advisory_subsidy',
                          'tax_benefit',
                          'sponsorship'
                        )),
  support_type          text NOT NULL CHECK (support_type IN (
                          'funding',
                          'advisory',
                          'both'
                        )),
  delivery_mode         text CHECK (delivery_mode IN (
                          'competitive',
                          'non_competitive',
                          'rolling',
                          'merit_scored'
                        )),

  recipient_type        text NOT NULL CHECK (recipient_type IN (
                          'business',
                          'individual',
                          'service_provider',
                          'creative_entity',
                          'consortium'
                        )),

  status                text NOT NULL CHECK (status IN (
                          'open',
                          'coming_soon',
                          'closed',
                          'ongoing',
                          'archived'
                        )),
  open_date             date,
  close_date            date,
  is_rolling            boolean DEFAULT false,
  deadline_pattern      text CHECK (deadline_pattern IN (
                          'always_open',
                          'rolling_quarterly',
                          'rolling_monthly',
                          'single_window',
                          'annual_competitive'
                        )),
  deadline_dates        date[],

  amount_min            bigint,
  amount_max            bigint,
  total_pool            bigint,
  amount_notes          text,
  is_matched_funding    boolean DEFAULT false,

  eligible_structures   text[],
  employee_min          integer DEFAULT 0,
  employee_max          integer,
  turnover_min          bigint,
  turnover_max          bigint,
  business_age_min      integer,
  requires_abn          boolean DEFAULT true,
  requires_gst          boolean DEFAULT false,
  geographic_scope      text[],
  indigenous_focus      text CHECK (indigenous_focus IN (
                          'inclusive',
                          'exclusive',
                          'required'
                        )),

  eligibility_conditions jsonb,

  sector_tags           text[],
  objective_tags        text[],

  dml_min               integer DEFAULT 0,
  dml_max               integer DEFAULT 100,
  dml_level_tags        text[],
  trigger_tags          text[],
  operations_weight     float DEFAULT 0.35,
  digital_weight        float DEFAULT 0.40,
  market_weight         float DEFAULT 0.25,

  assessment_type       text CHECK (assessment_type IN (
                          'eligibility_only',
                          'merit_scored',
                          'competitive',
                          'no_assessment'
                        )),

  benefits              text[],
  eligible_expenses     text[],
  ineligible_expenses   text[],
  required_documents    text[],
  application_channel   text,
  application_steps     jsonb,

  contact_phone         text,
  contact_email         text,
  contact_url           text,

  is_featured           boolean DEFAULT false,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. grant_tags
-- Relación many-to-many entre grants y tags.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_tags (
  grant_id    uuid REFERENCES grants(id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (grant_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- 5. providers
-- Directorio de empresas proveedoras pre-aprobadas por DPIRD.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS providers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  description       text,
  summary           text,
  website           text,
  email             text,
  phone             text,
  logo_url          text,

  service_types     text[],
  sector_tags       text[],
  trigger_tags      text[],
  dml_levels        text[],

  location          text[],
  operates_online   boolean DEFAULT true,

  status            text DEFAULT 'active' CHECK (status IN ('active','inactive','pending_review')),
  dpird_approved    boolean DEFAULT false,
  approval_date     date,

  is_featured       boolean DEFAULT false,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. provider_tags
-- Relación many-to-many entre providers y tags.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_tags (
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (provider_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- 7. grant_providers
-- Asocia providers específicos a grants específicos.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_providers (
  grant_id      uuid REFERENCES grants(id) ON DELETE CASCADE,
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  notes         text,
  PRIMARY KEY   (grant_id, provider_id)
);

-- -----------------------------------------------------------------------------
-- 8. questions
-- Banco de preguntas del wizard de diagnóstico.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text                text NOT NULL,
  helper_text         text,
  dimension           text NOT NULL CHECK (dimension IN (
                        'profile',
                        'operations',
                        'digital',
                        'market'
                      )),
  dimension_weight    float DEFAULT 1.0,
  answer_type         text NOT NULL CHECK (answer_type IN (
                        'single_choice',
                        'multi_choice',
                        'scale_1_5',
                        'boolean',
                        'text_input',
                        'number_input'
                      )),
  options             jsonb,
  sector_filter       text[],
  show_if             jsonb,
  is_required         boolean DEFAULT true,
  is_active           boolean DEFAULT true,
  sort_order          integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. question_tags
-- Tags de contexto activados por preguntas.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_tags (
  question_id   uuid REFERENCES questions(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (question_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- 10. consultants
-- Usuarios autenticados de DPIRD.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  email           text UNIQUE NOT NULL,
  role            text DEFAULT 'advisor' CHECK (role IN (
                    'advisor',
                    'manager',
                    'admin'
                  )),
  region          text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 11. diagnostic_sessions
-- Sesiones de diagnóstico iniciadas por SME o consultor.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_mode          text NOT NULL CHECK (session_mode IN (
                          'self_service',
                          'consultant_guided'
                        )),
  consultant_id         uuid REFERENCES consultants(id) ON DELETE SET NULL,

  business_name         text,
  contact_name          text,
  contact_email         text,
  contact_phone         text,
  sector_id             uuid REFERENCES sectors(id) ON DELETE SET NULL,
  sub_sector_id         uuid REFERENCES sectors(id) ON DELETE SET NULL,
  business_structure    text,
  employee_count        integer,
  annual_turnover_range text,
  business_age_years    integer,
  location              text,
  has_abn               boolean,
  is_indigenous         boolean,

  operations_score      float,
  digital_score         float,
  market_score          float,
  total_score           float,
  dml_level             text CHECK (dml_level IN (
                          'foundational',
                          'emerging',
                          'established',
                          'advanced'
                        )),

  activated_tags        text[],

  status                text DEFAULT 'in_progress' CHECK (status IN (
                          'in_progress',
                          'completed',
                          'abandoned'
                        )),
  completed_at          timestamptz,
  email_sent_at         timestamptz,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 12. user_responses
-- Respuestas individuales registradas por sesión.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_value    text,
  answer_text     text,
  answer_number   float,
  tags_activated  text[],
  score_contribution float,
  created_at      timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 13. match_results
-- Recomendaciones generadas por el motor de matching.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  result_type       text NOT NULL CHECK (result_type IN ('grant', 'provider')),
  grant_id          uuid REFERENCES grants(id) ON DELETE CASCADE,
  provider_id       uuid REFERENCES providers(id) ON DELETE CASCADE,

  match_score       float NOT NULL,
  match_rank        integer,

  matched_tags      text[],
  reasoning_path    jsonb,
  eligibility_met   boolean DEFAULT true,
  eligibility_notes text,

  created_at        timestamptz DEFAULT now()
);
