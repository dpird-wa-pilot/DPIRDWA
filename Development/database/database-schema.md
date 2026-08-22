# DPIRD Digital Advisory Platform — Database Schema Definition
**Version:** 2.0  
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
  is_rolling            boolean DEFAULT false,      -- true = múltiples deadlines durante el año
  deadline_pattern      text CHECK (deadline_pattern IN (
                          'always_open',
                          'rolling_quarterly',
                          'rolling_monthly',
                          'single_window',
                          'annual_competitive'
                        )),
  deadline_dates        date[],                     -- array para rolling deadlines múltiples

  -- Montos
  amount_min            bigint,                     -- en cents AUD (ej. $10,000 = 1000000)
  amount_max            bigint,                     -- en cents AUD
  total_pool            bigint,                     -- fondo total del programa
  amount_notes          text,                       -- "hasta $50 por persona", "matched 1:1"
  is_matched_funding    boolean DEFAULT false,

  -- Elegibilidad — Perfil del negocio
  eligible_structures   text[],                     -- ['company','sole_trader','trust','nfp','partnership']
  employee_min          integer DEFAULT 0,
  employee_max          integer,                    -- NULL = sin límite
  turnover_min          bigint,                     -- en cents AUD anuales
  turnover_max          bigint,
  business_age_min      integer,                    -- años mínimos de operación
  requires_abn          boolean DEFAULT true,
  requires_gst          boolean DEFAULT false,
  geographic_scope      text[],                     -- ['metro_wa','regional_wa','all_wa','national']
  indigenous_focus      text CHECK (indigenous_focus IN (
                          'inclusive',              -- abierto a todos incluyendo indígenas
                          'exclusive',              -- solo para negocios indígenas
                          'required'                -- identidad cultural requerida
                        )),

  -- Elegibilidad flexible (condiciones heterogéneas)
  eligibility_conditions jsonb,                    -- ver estructura abajo

  -- Sector & Objetivos
  sector_tags           text[],                    -- slugs de sectors ([] = todos los sectores)
  objective_tags        text[],                    -- ['digital','ai','cybersecurity','export',...]

  -- Matching con diagnóstico (knowledge graph)
  dml_min               integer DEFAULT 0,          -- Digital Maturity Level mínimo (0-100)
  dml_max               integer DEFAULT 100,        -- Digital Maturity Level máximo
  dml_level_tags        text[],                     -- ['foundational','emerging','established','advanced']
  trigger_tags          text[],                     -- tags de questions que activan este grant
  operations_weight     float DEFAULT 0.35,         -- relevancia dimensión Operaciones
  digital_weight        float DEFAULT 0.40,         -- relevancia dimensión Digital
  market_weight         float DEFAULT 0.25,         -- relevancia dimensión Mercado

  -- Assessment
  assessment_type       text CHECK (assessment_type IN (
                          'eligibility_only',
                          'merit_scored',
                          'competitive',
                          'no_assessment'
                        )),

  -- Contenido adicional
  benefits              text[],                    -- lista de beneficios (para acreditaciones)
  eligible_expenses     text[],                    -- qué cubre el programa
  ineligible_expenses   text[],                    -- qué NO cubre
  required_documents    text[],                    -- docs requeridos en la aplicación
  application_channel   text,                      -- 'business_grants_hub','smartygrants','servicewa_app','abf_portal'
  application_steps     jsonb,                     -- pasos del proceso de aplicación

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

**Estructura del campo `eligibility_conditions` (jsonb flexible):**
```json
// Ejemplo: Australian Trusted Trader
{
  "requires_abn": true,
  "years_in_supply_chain_min": 2,
  "financially_solvent": true,
  "recipient_activity": ["importer", "exporter", "service_provider"]
}

// Ejemplo: First Nations Feature Development
{
  "cultural_identity": ["first_nations"],
  "creative_credits_min": 3,
  "role_required": ["director", "writer", "writer_director"]
}

// Ejemplo: Tackle Shop Rebate
{
  "license_required": ["RFBL"],
  "geography": ["WA"],
  "recipient_type": "individual"
}

// Ejemplo: ASBAS Digital Solutions
{
  "employee_max": 19,
  "requires_abn": true,
  "business_status": "trading",
  "profit_type": "for_profit"
}
```

---

### 4. `grant_tags` *(tabla de unión)*
**Propósito:** Relación many-to-many entre grants y tags.

```sql
CREATE TABLE grant_tags (
  grant_id    uuid REFERENCES grants(id) ON DELETE CASCADE,
  tag_id      uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (grant_id, tag_id)
);
```

---

### 5. `providers`
**Propósito:** Directorio de empresas proveedoras de servicios pre-aprobadas por DPIRD.

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

  -- Clasificación
  service_types     text[],                  -- ['implementation','consulting','training','audit']
  sector_tags       text[],                  -- sectores en los que opera
  trigger_tags      text[],                  -- tags que activan este provider
  dml_levels        text[],                  -- niveles DML a los que sirve

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

---

### 6. `provider_tags` *(tabla de unión)*
**Propósito:** Relación many-to-many entre providers y tags.

```sql
CREATE TABLE provider_tags (
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (provider_id, tag_id)
);
```

---

### 7. `grant_providers` *(tabla de unión)*
**Propósito:** Asocia providers específicos a grants específicos ("si calificás para este grant, estos providers pueden ayudarte a ejecutarlo").

```sql
CREATE TABLE grant_providers (
  grant_id      uuid REFERENCES grants(id) ON DELETE CASCADE,
  provider_id   uuid REFERENCES providers(id) ON DELETE CASCADE,
  notes         text,                        -- contexto de la relación
  PRIMARY KEY   (grant_id, provider_id)
);
```

---

### 8. `questions`
**Propósito:** Banco de preguntas del wizard de diagnóstico. Las preguntas están predefinidas con lógica de ramificación dinámica — cuáles se muestran depende del sector y respuestas anteriores del SME.

```sql
CREATE TABLE questions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text                text NOT NULL,               -- texto de la pregunta
  helper_text         text,                        -- explicación adicional bajo la pregunta
  dimension           text NOT NULL CHECK (dimension IN (
                        'profile',                 -- preguntas base (sector, tamaño, etc.)
                        'operations',              -- dimensión Operaciones (peso 35%)
                        'digital',                 -- dimensión Digital (peso 40%)
                        'market'                   -- dimensión Mercado (peso 25%)
                      )),
  dimension_weight    float DEFAULT 1.0,           -- peso de esta pregunta dentro de la dimensión
  answer_type         text NOT NULL CHECK (answer_type IN (
                        'single_choice',
                        'multi_choice',
                        'scale_1_5',
                        'boolean',
                        'text_input',
                        'number_input'
                      )),
  options             jsonb,                       -- ver estructura abajo
  sector_filter       text[],                      -- [] = todos los sectores ven esta pregunta
  show_if             jsonb,                       -- condición para mostrar esta pregunta
  is_required         boolean DEFAULT true,
  is_active           boolean DEFAULT true,
  sort_order          integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

**Estructura del campo `options` (jsonb):**
```json
// Pregunta de opción única con tags
{
  "choices": [
    {
      "value": "no_website",
      "label": "No tengo sitio web ni presencia online",
      "tags": ["no_digital_presence", "foundational"],
      "score_contribution": 0
    },
    {
      "value": "basic_website",
      "label": "Tengo un sitio web básico informativo",
      "tags": ["website", "emerging"],
      "score_contribution": 25
    },
    {
      "value": "ecommerce",
      "label": "Tengo tienda online con ventas activas",
      "tags": ["ecommerce", "established"],
      "score_contribution": 75
    }
  ]
}
```

**Estructura del campo `show_if` (jsonb — branching logic):**
```json
// Mostrar solo si el sector es food_beverage O food_manufacturing
{
  "operator": "OR",
  "conditions": [
    { "field": "sector", "operator": "IN", "value": ["food_beverage", "food_manufacturing"] }
  ]
}

// Mostrar solo si ya respondió que NO tiene presencia digital
{
  "operator": "AND",
  "conditions": [
    { "question_id": "uuid-de-la-pregunta-anterior", "answer_value": "no_website" }
  ]
}
```

---

### 9. `question_tags` *(tabla de unión)*
**Propósito:** Tags que una pregunta puede activar, independientemente de la respuesta (tags de contexto).

```sql
CREATE TABLE question_tags (
  question_id   uuid REFERENCES questions(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (question_id, tag_id)
);
```

---

### 10. `diagnostic_sessions`
**Propósito:** Cada vez que un SME (o consultor) inicia el wizard se crea una sesión. Registra el perfil completo del negocio, los scores por dimensión, el nivel DML resultante, y el modo de operación.

```sql
CREATE TABLE diagnostic_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Modo de operación
  session_mode          text NOT NULL CHECK (session_mode IN (
                          'self_service',           -- SME completó el wizard solo
                          'consultant_guided'       -- consultor de DPIRD guió la sesión
                        )),
  consultant_id         uuid REFERENCES consultants(id),  -- NULL si self_service

  -- Perfil del negocio capturado
  business_name         text,
  contact_name          text,
  contact_email         text,
  contact_phone         text,
  sector_id             uuid REFERENCES sectors(id),
  sub_sector_id         uuid REFERENCES sectors(id),
  business_structure    text,                       -- 'company','sole_trader','trust','nfp','partnership'
  employee_count        integer,
  annual_turnover_range text,                       -- '$0-$250k', '$250k-$1M', '$1M-$5M', '$5M+'
  business_age_years    integer,
  location              text,                       -- 'metro_wa', 'regional_wa'
  has_abn               boolean,
  is_indigenous         boolean,

  -- Scores del diagnóstico
  operations_score      float,                      -- 0-100
  digital_score         float,                      -- 0-100
  market_score          float,                      -- 0-100
  total_score           float,                      -- weighted: ops*0.35 + dig*0.40 + mkt*0.25
  dml_level             text CHECK (dml_level IN (
                          'foundational',            -- 0-24
                          'emerging',                -- 25-49
                          'established',             -- 50-74
                          'advanced'                 -- 75-100
                        )),

  -- Tags activados durante la sesión
  activated_tags        text[],                     -- todos los tags generados por las respuestas

  -- Estado de la sesión
  status                text DEFAULT 'in_progress' CHECK (status IN (
                          'in_progress',
                          'completed',
                          'abandoned'
                        )),
  completed_at          timestamptz,
  email_sent_at         timestamptz,               -- Phase 3: cuando se envió el email con resultados

  -- Admin
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

---

### 11. `user_responses`
**Propósito:** Respuestas individuales dentro de una sesión. Permite reconstruir y auditar el diagnóstico completo.

```sql
CREATE TABLE user_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id),
  answer_value    text,                            -- valor de la respuesta seleccionada
  answer_text     text,                            -- texto libre (para answer_type = 'text_input')
  answer_number   float,                           -- valor numérico (para 'number_input', 'scale_1_5')
  tags_activated  text[],                          -- tags que activó esta respuesta específica
  score_contribution float,                        -- cuánto aportó al score de su dimensión
  created_at      timestamptz DEFAULT now()
);
```

---

### 12. `resources` *(nuevo en v2.0)*
**Propósito:** Biblioteca de recursos curados — libros, artículos de investigación y reportes técnicos de DPIRD. Tratados como una tercera fuente de recomendaciones junto a grants y providers. El sistema siempre redirige al usuario a la URL de la biblioteca DPIRD (nunca a PDFs directos).

```sql
CREATE TABLE resources (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  title                 text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  resource_type         text NOT NULL CHECK (resource_type IN (
                          'book_chapter',           -- libros y capítulos de libros
                          'journal_article',        -- artículos en revistas científicas
                          'research_report'         -- reportes de investigación DPIRD
                        )),

  -- Autoría
  authors               text[],                    -- ['Smith, J.', 'Jones, M.']
  author_affiliations   text[],                    -- ['DPIRD WA', 'Curtin University']

  -- Descripción
  abstract              text,                      -- abstract original del recurso
  summary               text,                      -- resumen en lenguaje SME (para cards)

  -- Publicación
  publication_date      date,
  publisher             text,                      -- editorial o institución
  journal_name          text,                      -- NULL si no es journal_article
  volume_issue          text,                      -- "Vol. 12, No. 3 (2023)"
  doi                   text,                      -- Digital Object Identifier
  isbn                  text,                      -- para libros
  report_number         text,                      -- código interno DPIRD (ej. "DPIRD Report 2023-14")

  -- Acceso — siempre vía biblioteca DPIRD
  library_url           text NOT NULL,             -- URL en library.dpird.wa.gov.au (NUNCA PDF directo)

  -- Taxonomía dual (ver nota abajo)
  raw_disciplines       text[],                    -- taxonomía original de Digital Commons / biblioteca
  sector_tags           text[],                    -- slugs de sectors relevantes
  trigger_tags          text[],                    -- tags del sistema BFS (asignados manualmente por admin)
  dml_levels            text[],                    -- niveles DML a los que aplica este recurso

  -- Admin
  is_featured           boolean DEFAULT false,
  is_active             boolean DEFAULT true,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

**Nota sobre taxonomía dual:**

| Campo | Fuente | Uso |
|-------|--------|-----|
| `raw_disciplines` | Taxonomía original de la biblioteca DPIRD (Digital Commons) | Solo trazabilidad / auditoría |
| `trigger_tags` | Sistema interno — mismo vocabulario que grants y providers | Alimenta el motor BFS |

El equipo técnico de DPIRD asigna los `trigger_tags` manualmente vía Supabase Table Editor. El campo `raw_disciplines` se copia tal como aparece en la ficha de la biblioteca y no se modifica.

**Política de acceso:** El campo `library_url` siempre apunta a la página de la biblioteca (`library.dpird.wa.gov.au`). Incluso si el PDF está alojado en otro dominio, el sistema nunca expone esa URL directamente — el usuario hace clic en "Ver en biblioteca DPIRD" y accede desde allí.

---

### 13. `resource_tags` *(nuevo en v2.0 — tabla de unión)*
**Propósito:** Relación many-to-many entre resources y tags. Complementa el array `trigger_tags` en `resources` con referencias normalizadas para queries relacionales.

```sql
CREATE TABLE resource_tags (
  resource_id   uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (resource_id, tag_id)
);
```

---

### 14. `match_results` *(actualizado en v2.0)*
**Propósito:** Output del motor de matching para cada sesión. Almacena qué grants, providers y recursos se recomendaron, con qué score de compatibilidad, y el razonamiento (path del grafo).

**Cambios v2.0:** `result_type` agrega `'resource'`; se introduce `result_id` (referencia genérica al elemento recomendado) y `result_name` (nombre denormalizado para display); se eliminan los campos separados `grant_id` y `provider_id` en favor del patrón genérico.

```sql
CREATE TABLE match_results (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        uuid NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,

  -- Resultado recomendado
  result_type       text NOT NULL CHECK (result_type IN (
                      'grant',
                      'provider',
                      'resource'         -- ← nuevo en v2.0
                    )),
  result_id         uuid NOT NULL,       -- UUID del grant, provider o resource recomendado
                                         -- No lleva FK constraint: referencia 3 tablas distintas
                                         -- según result_type. Verificar en app layer.
  result_name       text NOT NULL,       -- nombre denormalizado para display rápido sin JOIN

  -- Scoring
  match_score       float NOT NULL,      -- 0.0 a 1.0 (ej. 0.94 = 94% compatibilidad)
  match_rank        integer,             -- posición en el ranking de resultados

  -- Razonamiento (path del knowledge graph)
  matched_tags      text[],             -- tags en común entre sesión y el resultado
  reasoning_path    jsonb,              -- ver estructura abajo
  eligibility_met   boolean DEFAULT true,
  eligibility_notes text,               -- por qué no aplica si eligibility_met = false

  created_at        timestamptz DEFAULT now()
);
```

**Fórmula de match_score:**
```
match_score = (|intersect(activated_tags, trigger_tags)| / |trigger_tags|) × geo_factor × eligibility_factor
```

Donde:
- `activated_tags` = tags activados por las respuestas del SME en esta sesión
- `trigger_tags` = tags configurados en el grant / provider / resource
- `geo_factor` = 1.0 si el resultado cubre la ubicación del SME, 0.0 si no (filtro duro)
- `eligibility_factor` = 1.0 si pasa el pre-filtro de elegibilidad, 0.0 si no

**Resolución de `result_id` por `result_type`:**

| result_type | Tabla origen | Query de resolución |
|-------------|-------------|---------------------|
| `grant` | `grants` | `SELECT * FROM grants WHERE id = result_id` |
| `provider` | `providers` | `SELECT * FROM providers WHERE id = result_id` |
| `resource` | `resources` | `SELECT * FROM resources WHERE id = result_id` |

**Estructura del campo `reasoning_path` (jsonb):**
```json
{
  "path": [
    { "node_type": "sector", "node": "food_beverage", "label": "Food & Beverage" },
    { "node_type": "challenge", "node": "no_digital_presence", "label": "Sin presencia digital" },
    { "node_type": "dimension", "node": "digital", "label": "Digital Readiness (score: 18/100)" },
    { "node_type": "dml", "node": "foundational", "label": "Nivel Fundacional (0-24)" },
    { "node_type": "grant", "node": "digital_shoestring", "label": "Digital Shoestring Program" }
  ],
  "trigger_tags_matched": ["no_digital_presence", "foundational", "food_manufacturing"],
  "summary": "Recomendado porque el negocio es Food & Beverage en nivel digital Fundacional — exactamente el perfil objetivo de este programa."
}
```

---

### 15. `consultants`
**Propósito:** Usuarios autenticados de DPIRD que pueden iniciar sesiones en modo consultor.

```sql
CREATE TABLE consultants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid UNIQUE,                    -- referencia a auth.users de Supabase
  name            text NOT NULL,
  email           text UNIQUE NOT NULL,
  role            text DEFAULT 'advisor' CHECK (role IN (
                    'advisor',                    -- consultor de campo
                    'manager',                    -- puede ver todas las sesiones
                    'admin'                       -- acceso al panel de administración
                  )),
  region          text,                           -- área geográfica que cubre
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
-- Búsqueda rápida por estado y fechas
CREATE INDEX idx_grants_status ON grants(status);
CREATE INDEX idx_grants_close_date ON grants(close_date);

-- Matching por arrays (GIN para búsqueda en arrays)
CREATE INDEX idx_grants_sector_tags ON grants USING GIN(sector_tags);
CREATE INDEX idx_grants_trigger_tags ON grants USING GIN(trigger_tags);
CREATE INDEX idx_grants_objective_tags ON grants USING GIN(objective_tags);
CREATE INDEX idx_grants_dml ON grants(dml_min, dml_max);
CREATE INDEX idx_providers_trigger_tags ON providers USING GIN(trigger_tags);

-- Resources (v2)
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_trigger_tags ON resources USING GIN(trigger_tags);
CREATE INDEX idx_resources_sector_tags ON resources USING GIN(sector_tags);
CREATE INDEX idx_resources_dml_levels ON resources USING GIN(dml_levels);
CREATE INDEX idx_resources_is_active ON resources(is_active);

-- Sesiones por estado y fecha
CREATE INDEX idx_sessions_status ON diagnostic_sessions(status);
CREATE INDEX idx_sessions_created ON diagnostic_sessions(created_at);

-- Respuestas por sesión
CREATE INDEX idx_responses_session ON user_responses(session_id);

-- Resultados por sesión y score
CREATE INDEX idx_match_session ON match_results(session_id, match_score DESC);
CREATE INDEX idx_match_result_type ON match_results(result_type);   -- v2: filtrar por tipo
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
Todas las tablas listadas en este documento (1–15, incluyendo `resources` y `resource_tags` de v2.0).

### Phase 3 — Extensiones
```sql
-- Email tracking
ALTER TABLE diagnostic_sessions ADD COLUMN email_delivered boolean DEFAULT false;
ALTER TABLE diagnostic_sessions ADD COLUMN email_opened_at timestamptz;

-- PDF generation tracking  
ALTER TABLE diagnostic_sessions ADD COLUMN pdf_url text;
ALTER TABLE diagnostic_sessions ADD COLUMN pdf_generated_at timestamptz;

-- Feedback post-sesión
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
-- pgvector para búsqueda semántica
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE grants ADD COLUMN embedding vector(1536);
ALTER TABLE questions ADD COLUMN embedding vector(1536);
ALTER TABLE resources ADD COLUMN embedding vector(1536);   -- v2: resources también

-- Analytics de matching
CREATE TABLE matching_analytics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_type     text,                          -- 'grant' | 'provider' | 'resource'
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

1. **Plataforma:** Supabase (PostgreSQL 15+). Usar el dashboard de Supabase para crear tablas — el equipo no técnico de DPIRD usará el Table Editor para administrar contenido.

2. **Auth:** Usar Supabase Auth integrado. Los consultores se autentican via email/password o SSO. Los SMEs no requieren cuenta — la sesión se identifica por `session_id` en localStorage.

3. **Row Level Security (RLS):** Habilitar RLS en todas las tablas. Los SMEs solo pueden leer su propia sesión. Los consultores pueden ver todas las sesiones. Solo `admin` puede modificar grants, providers, questions y resources.

4. **Timestamps:** Todas las tablas tienen `created_at`. Las tablas de contenido (grants, providers, questions, resources) tienen también `updated_at` — implementar con trigger automático.

5. **Arrays con GIN:** Los campos `text[]` (sector_tags, trigger_tags, objective_tags, dml_levels) requieren índices GIN para que las queries de matching con operador `&&` sean performantes.

6. **JSONB:** Los campos `eligibility_conditions`, `options`, `show_if`, `reasoning_path` son JSONB. No requieren schema fijo — permiten agregar nuevos tipos de condiciones sin migración.

7. **Montos en cents:** Todos los montos monetarios se almacenan en cents (AUD) como `bigint` para evitar errores de punto flotante. La conversión a dólares se hace en el frontend.

8. **UUID vs SERIAL:** Usar UUID para todos los primary keys — Supabase genera UUIDs automáticamente y son seguros para exponer en URLs.

9. **`match_results.result_id` sin FK constraint (v2):** El campo `result_id` referencia grants, providers o resources según `result_type`. PostgreSQL no permite FK a múltiples tablas, así que la integridad referencial se verifica en el application layer. Alternativa: usar un trigger CHECK si se requiere validación a nivel base de datos.

10. **Recursos: nunca exponer URL de PDF directa (v2):** La columna `library_url` en `resources` debe apuntar siempre a la página de la biblioteca DPIRD. El frontend nunca debe construir un link directo al PDF — el usuario siempre llega al recurso a través de `library.dpird.wa.gov.au`.
