# DPIRD Digital Advisory Platform — Database Schema Definition
**Version:** 2.1  
**Fecha:** Agosto 2026  
**Preparado por:** Eleven June Consulting  
**Para:** Antigravity (Diseño e implementación de base de datos)  
**Plataforma destino:** Supabase (PostgreSQL)

---

## Control de cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Agosto 2026 | Schema inicial: 13 tablas. Grants, providers, questions, sesiones de diagnóstico, matching. |
| 2.0 | Agosto 2026 | **Nueva tabla `resources`** — biblioteca DPIRD (libros, artículos, reportes). **Nueva tabla `resource_tags`** (unión resources ↔ tags). **`match_results` actualizado:** `result_type` agrega `'resource'`; reemplaza `grant_id`/`provider_id` por `result_id` genérico y agrega `result_name`. |
| 2.1 | Agosto 2026 | **Tabla `providers` actualizada:** nuevo campo `contact_name` (nombre del contacto principal), nuevo campo `service_category text[]` (categoría específica del servicio, más granular que `service_types`), vocabulario `service_types` expandido de 4 a 7 valores (`consulting`, `implementation`, `training`, `audit`, `logistics`, `marketing`, `facilities`). Seed actualizado a 15 providers reales del directorio DPIRD F&B. |

---

## Contexto del sistema

La plataforma DPIRD Digital Advisory es una herramienta de diagnóstico digital para SMEs de Western Australia. El sistema tiene dos modos de operación:

- **Modo SME (self-service):** El propietario de negocio responde un cuestionario wizard y recibe recomendaciones de programas, providers y recursos de aprendizaje.
- **Modo Consultor:** Un advisor de DPIRD guía la sesión y ve el razonamiento detrás de cada recomendación.

El motor de matching cruza el perfil del SME (capturado durante el wizard) contra la base de datos de programas, providers y recursos usando un sistema de tags compartidos y un algoritmo de traversal tipo grafo (BFS).

---

## Arquitectura general

```
CONTENIDO DEL DOMINIO          MOTOR                    OPERACIONAL
─────────────────────          ──────                   ───────────
grants                         matching_engine           diagnostic_sessions
providers          ──tags──▶   (BFS traversal)  ──▶     user_responses
resources                      (runs in app)             match_results
sectors
questions
tags
```

Las tablas de dominio son mantenidas por el equipo técnico de DPIRD.  
Las tablas operacionales se generan automáticamente durante cada sesión de diagnóstico.

---

## Tablas — Definición completa

---

### 1. `sectors`
**Propósito:** Vocabulario controlado de industrias y sub-sectores. Fuente de verdad compartida entre grants, providers y preguntas.

```sql
CREATE TABLE sectors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                    -- "Food & Beverage"
  slug          text UNIQUE NOT NULL,             -- "food_beverage"
  parent_id     uuid REFERENCES sectors(id),      -- NULL = sector macro, valor = sub-sector
  icon          text,                             -- nombre del ícono Material Symbols
  description   text,
  is_active     boolean DEFAULT true,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);
```

**Ejemplos de datos:**
```
slug: "agriculture"           parent: NULL      (macro sector)
slug: "food_beverage"         parent: NULL      (macro sector)
slug: "food_manufacturing"    parent: "food_beverage"  (sub-sector)
slug: "retail"                parent: NULL
slug: "construction"          parent: NULL
slug: "professional_services" parent: NULL
slug: "aquaculture"           parent: "agriculture"
slug: "horticulture"          parent: "agriculture"
```

**Relaciones:** Referenciada por `grants.sector_tags`, `providers.sector_tags`, `questions.sector_filter`.

---

### 2. `tags`
**Propósito:** Sistema de etiquetas compartido entre preguntas, grants, providers y resources. Son los "edges" del knowledge graph — conectan las respuestas del SME con los programas, providers y recursos relevantes.

```sql
CREATE TABLE tags (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                    -- "inventory_management"
  label         text NOT NULL,                    -- "Gestión de inventario"
  category      text NOT NULL,                    -- "digital" | "operations" | "market"
  description   text,                             -- qué representa este tag
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
```

**Categorías de tags:**

| category | Ejemplos |
|----------|---------| 
| `digital` | website, ecommerce, social_media, crm, inventory_software, pos_system, cybersecurity, ai_tools |
| `operations` | supply_chain, quality_control, compliance, certification, process_automation, fleet_management |
| `market` | export, import, b2b_sales, marketing_digital, brand_development, customer_retention |
| `eligibility` | abn_required, gst_registered, indigenous_business, financially_solvent, international_supply_chain |
| `sector_specific` | food_safety, fishing_license, creative_credits, construction_license |

**Relaciones:** Tabla pivote con `grants`, `providers`, `questions` y `resources` a través de tablas de unión.

---

### 3. `grants`
**Propósito:** Catálogo de todos los programas de apoyo disponibles — grants monetarios, rebates, acreditaciones, subsidios, advisory programs.

```sql
CREATE TABLE grants (
  -- Identidad
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  administering_body    text NOT NULL,             -- "DPIRD", "DISR", "ABF", "Screen Australia"
  url                   text,                      -- página oficial del programa
  description           text,
  summary               text,                      -- versión corta para cards

  -- Tipo de programa
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
                          'rolling'
                        )),

  -- Destinatario
  recipient_type        text NOT NULL CHECK (recipient_type IN (
                          'business',
                          'individual',
                          'service_provider',
                          'creative_entity',
                          'consortium'
                        )),

  -- Estado y fechas
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

  -- Montos
  amount_min            bigint,
  amount_max            bigint,
  total_pool            bigint,
  amount_notes          text,
  is_matched_funding    boolean DEFAULT false,

  -- Elegibilidad — Perfil del negocio
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

  -- Sector & Objetivos
  sector_tags           text[],
  objective_tags        text[],

  -- Matching con diagnóstico (knowledge graph)
  dml_min               integer DEFAULT 0,
  dml_max               integer DEFAULT 100,
  dml_level_tags        text[],
  trigger_tags          text[],
  operations_weight     float DEFAULT 0.35,
  digital_weight        float DEFAULT 0.40,
  market_weight         float DEFAULT 0.25,

  -- Assessment
  assessment_type       text CHECK (assessment_type IN (
                          'eligibility_only',
                          'merit_scored',
                          'competitive',
                          'no_assessment'
                        )),

  -- Contenido adicional
  benefits              text[],
  eligible_expenses     text[],
  ineligible_expenses   text[],
  required_documents    text[],
  application_channel   text,
  application_steps     jsonb,

  -- Contacto
  contact_phone         text,
  contact_email         text,
  contact_url           text,

  -- Admin
  is_featured           boolean DEFAULT false,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

---

### 4. `grant_tags` *(tabla de unión)*

```sql
CREATE TABLE grant_tags (
  grant_id    uuid REFERENCES grants(id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (grant_id, tag_id)
);
```

---

### 5. `providers` *(actualizado en v2.1)*
**Propósito:** Directorio de empresas proveedoras de servicios pre-aprobadas por DPIRD.

**Cambios v2.1:** Nuevos campos `contact_name` y `service_category`. Vocabulario `service_types` expandido de 4 a 7 valores.

```sql
CREATE TABLE providers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text UNIQUE NOT NULL,
  description       text,
  summary           text,                    -- versión corta para cards
  website           text,
  email             text,
  phone             text,
  logo_url          text,

  -- Clasificación (v2.1)
  contact_name      text,                    -- nombre del contacto principal
  service_types     text[],                  -- vocab expandido v2.1: ['consulting','implementation',
                                             --   'training','audit','logistics','marketing','facilities']
  service_category  text[],                  -- categoría específica (más granular que service_types)
                                             -- vocab: ['factory_equipment','waste_management',
                                             --   'management_consulting','carbon_management',
                                             --   'branding_design','food_testing',
                                             --   'cold_chain_logistics','freight_forwarding',
                                             --   'commercial_kitchen','food_photography',...]
  sector_tags       text[],                  -- sectores en los que opera
  trigger_tags      text[],                  -- tags que activan este provider
  dml_levels        text[],                  -- niveles DML a los que sirve
  objective_tags    text[],                  -- objetivos que este provider aborda

  -- Ubicación
  location          text[],                  -- ['metro_wa','regional_wa','national','remote']
  operates_online   boolean DEFAULT true,

  -- Estado y validación DPIRD
  status            text DEFAULT 'active' CHECK (status IN ('active','inactive','pending_review')),
  dpird_approved    boolean DEFAULT false,
  approval_date     date,

  -- Admin
  is_featured       boolean DEFAULT false,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```

**Vocabulario `service_types` (v2.1 — 7 valores):**

| Valor | Descripción | Ejemplos de proveedores |
|-------|-------------|------------------------|
| `consulting` | Asesoría estratégica y advisory | Management consulting, carbon strategy |
| `implementation` | Instalación y despliegue | Factory equipment, refrigeration systems |
| `training` | Talleres y programas educativos | Digital skills workshops |
| `audit` | Testing, certificación, compliance | Food testing labs, compliance audits |
| `logistics` | Cadena de frío, freight, supply chain | Cold chain, freight forwarding |
| `marketing` | Branding, diseño, contenido visual | Graphic design, food photography |
| `facilities` | Espacios compartidos | Commercial kitchens, co-working |

**Vocabulario `service_category` (granular):**

`factory_equipment` · `waste_management` · `management_consulting` · `carbon_management` · `branding_design` · `food_testing` · `cold_chain_logistics` · `freight_forwarding` · `commercial_kitchen` · `food_photography`

---

### 6. `provider_tags` *(tabla de unión)*

```sql
CREATE TABLE provider_tags (
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (provider_id, tag_id)
);
```

---

### 7. `grant_providers` *(tabla de unión)*

```sql
CREATE TABLE grant_providers (
  grant_id      uuid REFERENCES grants(id) ON DELETE CASCADE,
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  notes         text,
  PRIMARY KEY   (grant_id, provider_id)
);
```

---

### 8. `questions`

```sql
CREATE TABLE questions (
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
```

---

### 9. `question_tags` *(tabla de unión)*

```sql
CREATE TABLE question_tags (
  question_id   uuid REFERENCES questions(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (question_id, tag_id)
);
```

---

### 10. `diagnostic_sessions`

```sql
CREATE TABLE diagnostic_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_mode          text NOT NULL CHECK (session_mode IN (
                          'self_service',
                          'consultant_guided'
                        )),
  consultant_id         uuid REFERENCES consultants(id),
  business_name         text,
  contact_name          text,
  contact_email         text,
  contact_phone         text,
  sector_id             uuid REFERENCES sectors(id),
  sub_sector_id         uuid REFERENCES sectors(id),
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
```

---

### 11. `user_responses`

```sql
CREATE TABLE user_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id),
  answer_value    text,
  answer_text     text,
  answer_number   float,
  tags_activated  text[],
  score_contribution float,
  created_at      timestamptz DEFAULT now()
);
```

---

### 12. `resources` *(nuevo en v2.0)*

```sql
CREATE TABLE resources (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  resource_type         text NOT NULL CHECK (resource_type IN (
                          'book_chapter',
                          'journal_article',
                          'research_report'
                        )),
  authors               text[],
  author_affiliations   text[],
  abstract              text,
  summary               text,
  publication_date      date,
  publisher             text,
  journal_name          text,
  volume_issue          text,
  doi                   text,
  isbn                  text,
  report_number         text,
  library_url           text NOT NULL,             -- URL en library.dpird.wa.gov.au (NUNCA PDF directo)
  raw_disciplines       text[],
  sector_tags           text[],
  trigger_tags          text[],
  dml_levels            text[],
  is_featured           boolean DEFAULT false,
  is_active             boolean DEFAULT true,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

**Nota:** `library_url` siempre apunta a `library.dpird.wa.gov.au`. Nunca exponer PDF directo.

---

### 13. `resource_tags` *(nuevo en v2.0— tabla de unión)*

```sql
CREATE TABLE resource_tags (
  resource_id   uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (resource_id, tag_id)
);
```

---

### 14. `match_results` *(actualizado en v2.0)*

```sql
CREATE TABLE match_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  result_type       text NOT NULL CHECK (result_type IN (
                      'grant',
                      'provider',
                      'resource'
                    )),
  result_id         uuid NOT NULL,       -- sin FK constraint: referencia 3 tablas distintas
  result_name       text NOT NULL,       -- denormalizado para display rápido sin JOIN
  match_score       float NOT NULL,      -- 0.0 a 1.0
  match_rank        integer,
  matched_tags      text[],
  reasoning_path    jsonb,
  eligibility_met   boolean DEFAULT true,
  eligibility_notes text,
  created_at        timestamptz DEFAULT now()
);
```

**Fórmula de match_score:**
```
match_score = (|intersect(activated_tags, trigger_tags)| / |trigger_tags|) × geo_factor × eligibility_factor
```

---

### 15. `consultants`

```sql
CREATE TABLE consultants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid UNIQUE,
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
```

---

## Relaciones entre tablas (ERD simplificado)

```
sectors ──────────────────────────────────────────┐
  │ (parent_id)                                   │
  └──► sectors (sub-sectores)                     │
                                                  │
tags ◄──── grant_tags ────► grants ───────────────┤
 │                            │                   │
 ├──── provider_tags ──► providers                │
 │                            │                   │
 ├──── question_tags ──► questions                │
 │                                                │
 └──── resource_tags ──► resources  [v2]          │
                                                  │
diagnostic_sessions ◄─────────────────────────────┘
  │ (sector_id)
  ├──► user_responses
  │      └──► questions
  └──► match_results ──► result_id (grant | provider | resource)  [v2]

consultants ──► diagnostic_sessions

grant_providers: grants ↔ providers (muchos a muchos)
```

---

## Índices recomendados

```sql
-- Grants
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_grants_close_date ON grants(close_date);
CREATE INDEX idx_grants_sector_tags ON grants USING GIN(sector_tags);
CREATE INDEX idx_grants_trigger_tags ON grants USING GIN(trigger_tags);
CREATE INDEX idx_grants_objective_tags ON grants USING GIN(objective_tags);
CREATE INDEX idx_grants_dml ON grants(dml_min, dml_max);

-- Providers (v2.1: nuevos índices para service_types y service_category)
CREATE INDEX idx_providers_trigger_tags ON providers USING GIN(trigger_tags);
CREATE INDEX idx_providers_service_types ON providers USING GIN(service_types);
CREATE INDEX idx_providers_service_category ON providers USING GIN(service_category);

-- Resources (v2.0)
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_trigger_tags ON resources USING GIN(trigger_tags);
CREATE INDEX idx_resources_sector_tags ON resources USING GIN(sector_tags);
CREATE INDEX idx_resources_dml_levels ON resources USING GIN(dml_levels);
CREATE INDEX idx_resources_is_active ON resources(is_active);

-- Sesiones
CREATE INDEX idx_sessions_status ON diagnostic_sessions(status);
CREATE INDEX idx_sessions_created ON diagnostic_sessions(created_at);
CREATE INDEX idx_responses_session ON user_responses(session_id);
CREATE INDEX idx_match_session ON match_results(session_id, match_score DESC);
CREATE INDEX idx_match_result_type ON match_results(result_type);
```

---

## Datos de referencia — Digital Maturity Levels (DML)

| Nivel | Slug | Score total | Descripción |
|-------|------|-------------|-------------|
| Fundacional | `foundational` | 0–24 | Operaciones manuales, sin herramientas digitales |
| Emergente | `emerging` | 25–49 | Primeras herramientas digitales, uso inconsistente |
| Establecido | `established` | 50–74 | Digital integrado en operaciones clave |
| Avanzado | `advanced` | 75–100 | Digital como ventaja competitiva, datos y automatización |

---

## Pesos del diagnóstico por dimensión

| Dimensión | Peso en score total |
|-----------|---------------------|
| Operations Readiness | 35% |
| Digital Readiness | 40% |
| Market Readiness | 25% |

---

## Fases de implementación

### Phase 2 — MVP (implementar ahora)
Todas las tablas listadas en este documento (1–15).

### Phase 3 — Extensiones
```sql
ALTER TABLE diagnostic_sessions ADD COLUMN email_delivered boolean DEFAULT false;
ALTER TABLE diagnostic_sessions ADD COLUMN email_opened_at timestamptz;
ALTER TABLE diagnostic_sessions ADD COLUMN pdf_url text;
ALTER TABLE diagnostic_sessions ADD COLUMN pdf_generated_at timestamptz;

CREATE TABLE session_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES diagnostic_sessions(id),
  rating        integer CHECK (rating BETWEEN 1 AND 5),
  comments      text,
  created_at    timestamptz DEFAULT now()
);
```

### Phase 4 — Semántica y analytics
```sql
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE grants ADD COLUMN embedding vector(1536);
ALTER TABLE questions ADD COLUMN embedding vector(1536);
ALTER TABLE resources ADD COLUMN embedding vector(1536);

CREATE TABLE matching_analytics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_type     text,
  result_id       uuid,
  match_count     integer DEFAULT 0,
  apply_count     integer DEFAULT 0,
  sector_slug     text,
  dml_level       text,
  period_month    date,
  created_at      timestamptz DEFAULT now()
);
```

---

## Notas para Antigravity

1. **Plataforma:** Supabase (PostgreSQL 15+). Usar el dashboard de Supabase para crear tablas.

2. **Auth:** Supabase Auth integrado. Los SMEs no requieren cuenta — la sesión se identifica por `session_id` en localStorage.

3. **Row Level Security (RLS):** Habilitar RLS en todas las tablas. Los SMEs solo pueden leer su propia sesión. Solo `admin` puede modificar grants, providers, questions y resources.

4. **Timestamps:** Todas las tablas tienen `created_at`. Las tablas de contenido tienen también `updated_at` — implementar con trigger automático.

5. **Arrays con GIN:** Los campos `text[]` (sector_tags, trigger_tags, service_types, service_category, dml_levels) requieren índices GIN para queries de matching con operador `&&`.

6. **JSONB:** Los campos `eligibility_conditions`, `options`, `show_if`, `reasoning_path` son JSONB. No requieren schema fijo.

7. **Montos en cents:** Todos los montos monetarios se almacenan en cents (AUD) como `bigint`.

8. **UUID vs SERIAL:** Usar UUID para todos los primary keys.

9. **`match_results.result_id` sin FK constraint (v2):** La integridad referencial se verifica en el application layer.

10. **Recursos: nunca exponer URL de PDF directa (v2):** El frontend nunca debe construir un link directo al PDF.
