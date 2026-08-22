# DPIRD Digital Advisory Platform — Advisor Page: Diagnostic Wizard & Matching Engine
**Document:** Technical Change Specification  
**ID:** CC-004  
**Version:** 1.1  
**Date:** August 2026  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementation)  
**Files affected:** `src/pages/Advisor.jsx` · `src/components/DigitalAdvisor.jsx` *(deprecate)* · `src/lib/matchingEngine.js` *(new)* · `src/lib/supabaseClient.js`

---

## Control de cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Agosto 2026 | Documento inicial |
| 1.1 | Agosto 2026 | Addendum §18 — Respuestas a consultas de Antigravity: orden de ejecución SQL, estado de la tabla `resources` y estado del seed de preguntas |

---

## 1. Contexto y Objetivo

La página `Advisor.jsx` existe en el prototipo pero tiene dos problemas fundamentales:

1. **El contenido está hardcodeado.** Las áreas de negocio, desafíos y resultados son texto fijo sin conexión a la base de datos.
2. **El flujo no implementa el diagnóstico real.** El wizard actual no calcula Digital Maturity Level (DML), no activa tags, y no hace matching — simplemente muestra texto predefinido y redirige a `/resources`.

El objetivo de CC-004 es reemplazar completamente `Advisor.jsx` con un **wizard de diagnóstico funcional** de 5 pantallas, conectado a Supabase, que calcule el DML del negocio y entregue resultados reales de grants, providers y recursos usando el motor BFS definido en el schema de base de datos.

El componente `DigitalAdvisor.jsx` queda **deprecado** — no debe usarse ni mantenerse.

---

## 2. Resumen de cambios

| Aspecto | Estado actual | Estado objetivo |
|---------|--------------|-----------------|
| Datos | Hardcodeados en el componente | Preguntas desde Supabase, resultados en tiempo real |
| Flujo | 4 pasos genéricos (Área → Challenges → Features → Results) | 5 pantallas estructuradas (Profile → Operations → Digital → Market → Results) |
| Motor de matching | No existe | Motor BFS implementado como módulo JS puro |
| Resultados | Texto fijo + link a /resources | Grants + Providers + Resources rankeados por match_score |
| DML | No calculado | Calculado y mostrado (Foundational / Emerging / Established / Advanced) |
| Persistencia | Ninguna | Sesión guardada en `diagnostic_sessions` + `user_responses` + `match_results` |
| Modo Consultor | No existe | Capa visual adicional sobre el mismo wizard (reasoning path visible) |

---

## 3. Arquitectura del flujo

```
Pantalla 1          Pantalla 2          Pantalla 3          Pantalla 4
[PERFIL]     ──▶   [OPERATIONS]  ──▶   [DIGITAL]    ──▶   [MARKET]
Sector              3-4 preguntas       3-4 preguntas       2-3 preguntas
Tamaño              escala 1-5          escala 1-5          escala 1-5
Ubicación           o multi-choice      o multi-choice      o multi-choice
Estructura
Edad negocio
     │
     ▼
     Supabase: CREATE diagnostic_session
     Respuestas: INSERT user_responses + tags activados
                             │
                             ▼
                   Pantalla 5: [RESULTADOS]
                   ┌──────────────────────────────────┐
                   │ DML Level + Score visual          │
                   │ ─────────────────────────────     │
                   │ Grants  (match_score desc)        │
                   │ Providers (match_score desc)      │
                   │ Resources (match_score desc)      │
                   └──────────────────────────────────┘
                   Motor BFS corre en el cliente (JS puro)
                   Resultados guardados en match_results
```

---

## 4. Pantalla 1 — Perfil del Negocio

### 4.1 Propósito
Captura el contexto de elegibilidad. Esta información determina qué grants pueden aplicarse al negocio antes de evaluar madurez digital.

### 4.2 Campos

| Campo UI | DB field | Tipo | Valores |
|----------|----------|------|---------|
| Sector principal | `sector_id` | Select | Desde tabla `sectors` WHERE `parent_id IS NULL` |
| Sub-sector | `sub_sector_id` | Select condicional | Desde `sectors` WHERE `parent_id = sector_id` seleccionado |
| Tamaño (empleados) | `employee_count` | Radio group | 1–4 · 5–19 · 20–49 · 50+ |
| Facturación anual | `annual_turnover_range` | Radio group | <$250k · $250k–$1M · $1M–$5M · $5M+ |
| Ubicación | `location` | Radio group | Metro WA · Regional WA · Remote WA |
| Estructura legal | `business_structure` | Select | Sole Trader · Company · Trust · Partnership · Not-for-profit |
| Años en operación | `business_age_years` | Radio group | <1 año · 1–3 años · 3–7 años · 7+ años |
| ¿Tiene ABN? | `has_abn` | Toggle | Sí / No |

### 4.3 Carga de sectores desde Supabase

```js
// [CC-004] Load sectors for profile step
useEffect(() => {
  const loadSectors = async () => {
    const { data } = await supabase
      .from('sectors')
      .select('id, name, slug, parent_id, icon')
      .eq('is_active', true)
      .order('sort_order')
    setSectors(data || [])
  }
  loadSectors()
}, [])

const macroSectors = sectors.filter(s => s.parent_id === null)
const subSectors = sectors.filter(s => s.parent_id === profile.sectorId)
```

### 4.4 Acción al completar Pantalla 1

Crear la sesión en Supabase al avanzar de pantalla 1 a pantalla 2:

```js
// [CC-004] Create diagnostic session on profile completion
const createSession = async (profileData) => {
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .insert({
      session_mode: consultantMode ? 'consultant_guided' : 'self_service',
      consultant_id: consultantMode ? currentConsultant.id : null,
      sector_id: profileData.sectorId,
      sub_sector_id: profileData.subSectorId || null,
      business_structure: profileData.businessStructure,
      employee_count: profileData.employeeCount,
      annual_turnover_range: profileData.turnoverRange,
      business_age_years: profileData.businessAgeYears,
      location: profileData.location,
      has_abn: profileData.hasAbn,
      status: 'in_progress'
    })
    .select('id')
    .single()

  if (data) setSessionId(data.id)
}
```

---

## 5. Pantallas 2, 3 y 4 — Diagnóstico por Dimensión

### 5.1 Estructura común de las pantallas de diagnóstico

Cada pantalla de dimensión sigue el mismo patrón:
- Header con el nombre de la dimensión y su peso en el score total
- Indicador de progreso (ej. "Dimension 2 of 3")
- Lista de preguntas cargadas desde Supabase (`questions` WHERE `dimension = X`)
- Cada pregunta puede ser `scale_1_5`, `single_choice`, `multi_choice` o `boolean`

### 5.2 Carga de preguntas por dimensión

```js
// [CC-004] Load questions for a given dimension from Supabase
const loadQuestions = async (dimension, sectorId) => {
  const { data } = await supabase
    .from('questions')
    .select(`
      id, text, helper_text, dimension, answer_type, options,
      sector_filter, is_required, sort_order,
      question_tags ( tag_id )
    `)
    .eq('dimension', dimension)
    .eq('is_active', true)
    .or(`sector_filter.is.null,sector_filter.cs.{${sectorId}}`)
    .order('sort_order')

  return data || []
}
```

### 5.3 Pantalla 2 — Operations Readiness (35%)

**Foco:** Cómo el negocio gestiona sus operaciones físicas y administrativas hoy.

Preguntas de referencia (el banco definitivo lo aprueba DPIRD):

| # | Pregunta | Tipo | Tags que activa |
|---|---------|------|-----------------|
| 1 | ¿Cómo gestionás actualmente tu inventario/stock? | scale_1_5 | `inventory_software`, `supply_chain` |
| 2 | ¿Tus procesos de producción o entrega están documentados y estandarizados? | scale_1_5 | `process_automation`, `quality_control` |
| 3 | ¿Usás algún sistema digital para gestión de calidad o compliance? | boolean | `compliance`, `certification` |
| 4 | ¿Podés rastrear tus productos a lo largo de toda la cadena de suministro? | scale_1_5 | `supply_chain`, `fleet_management` |

### 5.4 Pantalla 3 — Digital Readiness (40%)

**Foco:** Nivel de adopción de tecnología digital en el negocio.

| # | Pregunta | Tipo | Tags que activa |
|---|---------|------|-----------------|
| 1 | ¿Tenés presencia digital activa (sitio web, redes sociales)? | scale_1_5 | `website`, `social_media` |
| 2 | ¿Usás herramientas digitales para ventas o relación con clientes? | scale_1_5 | `crm`, `ecommerce` |
| 3 | ¿Tu negocio tiene protocolos básicos de ciberseguridad? | boolean | `cybersecurity` |
| 4 | ¿Usás datos o reportes digitales para tomar decisiones de negocio? | scale_1_5 | `ai_tools`, `inventory_software` |

### 5.5 Pantalla 4 — Market Readiness (25%)

**Foco:** Capacidad del negocio para acceder a nuevos mercados y clientes.

| # | Pregunta | Tipo | Tags que activa |
|---|---------|------|-----------------|
| 1 | ¿Exportás o tenés intención de exportar en los próximos 12 meses? | boolean | `export`, `international_supply_chain` |
| 2 | ¿Tenés canales de venta online (e-commerce, marketplaces)? | scale_1_5 | `ecommerce`, `marketing_digital` |
| 3 | ¿Cómo evaluarías tu estrategia de marca y diferenciación en el mercado? | scale_1_5 | `brand_development`, `customer_retention` |

### 5.6 Registro de respuestas y activación de tags

Cada vez que el usuario avanza de una pantalla de diagnóstico, se persisten las respuestas y se actualizan los tags activados:

```js
// [CC-004] Save responses for a dimension and accumulate activated tags
const saveResponses = async (dimensionAnswers, dimensionScore, activatedTags) => {
  const responses = dimensionAnswers.map(answer => ({
    session_id: sessionId,
    question_id: answer.questionId,
    answer_value: answer.value?.toString(),
    answer_number: typeof answer.value === 'number' ? answer.value : null,
    tags_activated: answer.tags,
    score_contribution: answer.scoreContribution
  }))

  await supabase.from('user_responses').insert(responses)

  // Accumulate tags in session
  const allTags = [...new Set([...currentActivatedTags, ...activatedTags])]
  setCurrentActivatedTags(allTags)
}
```

---

## 6. Motor BFS — Matching Engine

### 6.1 Descripción

El motor de matching es un módulo JavaScript puro (`src/lib/matchingEngine.js`) — no requiere llamadas adicionales al servidor. Recibe el perfil del SME y los tags activados, y retorna listas rankeadas de grants, providers y resources.

El motor corre **en el cliente**, después de que el usuario completa las 4 pantallas, usando los datos ya cargados de Supabase.

### 6.2 Fórmula de match_score

```
match_score = (|activatedTags ∩ trigger_tags_del_resultado|  /  |trigger_tags_del_resultado|)
              × geoFactor
              × eligibilityFactor
```

Donde:
- `geoFactor` = 1.0 si las ubicaciones coinciden, 0.8 si el resultado opera online, 0.0 si hay restricción geográfica incompatible
- `eligibilityFactor` = 1.0 si el negocio cumple todos los requisitos, 0.5 si cumple parcialmente, 0.0 si no cumple

### 6.3 Implementación del módulo

```js
// src/lib/matchingEngine.js
// [CC-004] BFS Matching Engine — pure JS module, no server calls

/**
 * Calculate match score between SME activated tags and a result's trigger tags
 */
export function calculateMatchScore(activatedTags, result, businessProfile) {
  const triggerTags = result.trigger_tags || []
  if (triggerTags.length === 0) return 0

  const intersection = activatedTags.filter(tag => triggerTags.includes(tag))
  const tagScore = intersection.length / triggerTags.length

  const geoFactor = calculateGeoFactor(result, businessProfile.location)
  const eligibilityFactor = calculateEligibilityFactor(result, businessProfile)

  return tagScore * geoFactor * eligibilityFactor
}

/**
 * Geographic compatibility factor
 */
function calculateGeoFactor(result, businessLocation) {
  const resultLocations = result.location || result.geographic_scope || []
  if (resultLocations.length === 0) return 1.0 // No restriction = applies everywhere

  if (resultLocations.includes(businessLocation)) return 1.0
  if (result.operates_online || resultLocations.includes('national')) return 0.8
  return 0.0
}

/**
 * Eligibility factor for grants
 */
function calculateEligibilityFactor(result, profile) {
  if (result.result_type !== 'grant') return 1.0

  const grant = result
  let score = 1.0

  // Business age check
  if (grant.business_age_min && profile.businessAgeYears < grant.business_age_min) {
    score *= 0.3 // Still show but with low score
  }

  // ABN requirement
  if (grant.requires_abn && !profile.hasAbn) return 0.0

  // Employee count check
  if (grant.employee_max && profile.employeeCount > grant.employee_max) {
    score *= 0.4
  }

  // DML range check
  if (grant.dml_min && profile.dmlScore < grant.dml_min) score *= 0.5
  if (grant.dml_max && profile.dmlScore > grant.dml_max) score *= 0.5

  return score
}

/**
 * Main matching function — returns ranked results for all three types
 */
export function runBFSMatching(activatedTags, { grants, providers, resources }, businessProfile) {
  const scoreAndRank = (items, type) =>
    items
      .map(item => ({
        ...item,
        result_type: type,
        match_score: calculateMatchScore(activatedTags, item, businessProfile),
        matched_tags: activatedTags.filter(tag => (item.trigger_tags || []).includes(tag)),
        reasoning_path: buildReasoningPath(activatedTags, item)
      }))
      .filter(item => item.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5) // Top 5 per type

  return {
    grants: scoreAndRank(grants, 'grant'),
    providers: scoreAndRank(providers, 'provider'),
    resources: scoreAndRank(resources, 'resource')
  }
}

/**
 * Build reasoning path — explains WHY this result matched
 */
function buildReasoningPath(activatedTags, result) {
  const matchedTags = activatedTags.filter(tag => (result.trigger_tags || []).includes(tag))
  return {
    matched_tags: matchedTags,
    total_trigger_tags: (result.trigger_tags || []).length,
    match_count: matchedTags.length,
    explanation: matchedTags.map(tag => TAG_EXPLANATIONS[tag] || tag)
  }
}

// Human-readable explanations for each tag
const TAG_EXPLANATIONS = {
  inventory_software: 'Inventory management needs identified',
  supply_chain: 'Supply chain challenges identified',
  compliance: 'Compliance and certification needs identified',
  process_automation: 'Process automation opportunities identified',
  website: 'Website and online presence gap identified',
  ecommerce: 'E-commerce capability gap identified',
  crm: 'Customer management needs identified',
  cybersecurity: 'Cybersecurity baseline needs identified',
  export: 'Export readiness interest identified',
  brand_development: 'Brand development needs identified',
  marketing_digital: 'Digital marketing needs identified',
  quality_control: 'Quality control improvement needs identified',
  social_media: 'Social media presence gap identified',
  ai_tools: 'Data and analytics adoption potential identified',
  customer_retention: 'Customer retention improvement needs identified',
  international_supply_chain: 'International supply chain potential identified',
  certification: 'Certification pathway needs identified',
  fleet_management: 'Fleet or logistics management needs identified'
}
```

### 6.4 Carga de datos para el motor

Antes de correr el motor, cargar los tres catálogos desde Supabase:

```js
// [CC-004] Load all matching data before running BFS engine
const loadMatchingData = async () => {
  const [grantsRes, providersRes, resourcesRes] = await Promise.all([
    supabase
      .from('grants')
      .select('id, name, slug, url, summary, status, trigger_tags, sector_tags, location, geographic_scope, requires_abn, employee_max, business_age_min, dml_min, dml_max, program_type, amount_min, amount_max, is_featured')
      .not('status', 'eq', 'archived'),
    supabase
      .from('providers')
      .select('id, name, slug, summary, website, service_types, trigger_tags, sector_tags, location, operates_online, logo_url, is_featured'),
    supabase
      .from('resources')
      .select('id, title, slug, summary, resource_type, library_url, trigger_tags, sector_tags, dml_levels, is_featured')
      .eq('is_active', true)
  ])

  return {
    grants: grantsRes.data || [],
    providers: providersRes.data || [],
    resources: resourcesRes.data || []
  }
}
```

---

## 7. Cálculo del DML

### 7.1 Scores por dimensión

```js
// [CC-004] Calculate DML scores from responses
const calculateDimensionScore = (answers, dimension) => {
  const dimensionAnswers = answers.filter(a => a.dimension === dimension)
  if (dimensionAnswers.length === 0) return 0

  const maxPossible = dimensionAnswers.length * 5 // Scale 1-5, max 5 per question
  const actual = dimensionAnswers.reduce((sum, a) => sum + (a.answer_number || 0), 0)
  return (actual / maxPossible) * 100
}

const operationsScore = calculateDimensionScore(allAnswers, 'operations')
const digitalScore = calculateDimensionScore(allAnswers, 'digital')
const marketScore = calculateDimensionScore(allAnswers, 'market')

// Weighted total
const totalScore = (operationsScore * 0.35) + (digitalScore * 0.40) + (marketScore * 0.25)
```

### 7.2 Determinación del nivel DML

```js
// [CC-004] Determine DML level from total score
const getDMLLevel = (score) => {
  if (score < 25) return { level: 'foundational', label: 'Foundational', color: 'error' }
  if (score < 50) return { level: 'emerging',     label: 'Emerging',     color: 'warning' }
  if (score < 75) return { level: 'established',  label: 'Established',  color: 'primary' }
  return             { level: 'advanced',          label: 'Advanced',     color: 'success' }
}
```

### 7.3 Actualización de la sesión con scores finales

```js
// [CC-004] Update session with final DML scores and activated tags
await supabase
  .from('diagnostic_sessions')
  .update({
    operations_score: operationsScore,
    digital_score: digitalScore,
    market_score: marketScore,
    total_score: totalScore,
    dml_level: dml.level,
    activated_tags: activatedTags,
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', sessionId)
```

---

## 8. Pantalla 5 — Resultados

### 8.1 Estructura visual

La pantalla de resultados se divide en cuatro bloques:

**Bloque A — DML Summary**

```jsx
{/* [CC-004] DML Summary block */}
<div className="bg-surface-container-low rounded-xl border border-outline-variant p-xl">
  <div className="flex items-center justify-between mb-md">
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
        Your Digital Maturity Level
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
        Based on your responses across three dimensions
      </p>
    </div>
    <div className={`px-lg py-sm rounded-full bg-${dml.color}-container text-on-${dml.color}-container font-label-lg font-bold`}>
      {dml.label}
    </div>
  </div>

  {/* Score bars by dimension */}
  <div className="flex flex-col gap-sm mt-md">
    {[
      { label: 'Operations Readiness', score: operationsScore, weight: '35%' },
      { label: 'Digital Readiness',    score: digitalScore,    weight: '40%' },
      { label: 'Market Readiness',     score: marketScore,     weight: '25%' }
    ].map(dim => (
      <div key={dim.label}>
        <div className="flex justify-between mb-xs">
          <span className="font-label-md text-label-md text-on-surface-variant">{dim.label}</span>
          <span className="font-label-md text-label-md text-on-surface font-bold">{Math.round(dim.score)}%</span>
        </div>
        <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${dim.score}%` }}
          />
        </div>
      </div>
    ))}
  </div>
</div>
```

**Bloque B — Grants Recomendados**

Muestra hasta 3 grants con mayor match_score. Cada card muestra: nombre, resumen, match percentage, estado (badge), y botón "Check Details" que abre `grant.url`.

**Bloque C — Providers Recomendados**

Muestra hasta 3 providers con mayor match_score. Cada card muestra: nombre, summary, tipos de servicio (badges), y botón "View Provider".

**Bloque D — Recursos de Aprendizaje**

Muestra hasta 3 resources con mayor match_score. Cada card muestra: título, tipo (book_chapter / journal_article / research_report), resumen, y botón "Read Resource" que abre `library_url`. Nunca exponer PDF directo.

### 8.2 Match percentage display

```jsx
{/* [CC-004] Match score visual indicator on result cards */}
<div className="flex items-center gap-xs">
  <div className="h-1.5 flex-1 bg-surface-variant rounded-full overflow-hidden">
    <div
      className="h-full bg-secondary rounded-full"
      style={{ width: `${Math.round(result.match_score * 100)}%` }}
    />
  </div>
  <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
    {Math.round(result.match_score * 100)}% match
  </span>
</div>
```

### 8.3 Persistencia de resultados

```js
// [CC-004] Save match results to Supabase
const saveMatchResults = async (matchedGrants, matchedProviders, matchedResources) => {
  const results = [
    ...matchedGrants.map((g, i) => ({
      session_id: sessionId,
      result_type: 'grant',
      result_id: g.id,
      result_name: g.name,
      match_score: g.match_score,
      match_rank: i + 1,
      matched_tags: g.matched_tags,
      reasoning_path: g.reasoning_path,
      eligibility_met: g.match_score > 0.3
    })),
    ...matchedProviders.map((p, i) => ({
      session_id: sessionId,
      result_type: 'provider',
      result_id: p.id,
      result_name: p.name,
      match_score: p.match_score,
      match_rank: i + 1,
      matched_tags: p.matched_tags,
      reasoning_path: p.reasoning_path,
      eligibility_met: true
    })),
    ...matchedResources.map((r, i) => ({
      session_id: sessionId,
      result_type: 'resource',
      result_id: r.id,
      result_name: r.title,
      match_score: r.match_score,
      match_rank: i + 1,
      matched_tags: r.matched_tags,
      reasoning_path: r.reasoning_path,
      eligibility_met: true
    }))
  ]

  await supabase.from('match_results').insert(results)
}
```

---

## 9. Modo Consultor

### 9.1 Activación

El modo consultor se activa cuando el advisor de DPIRD está autenticado. La detección del modo se hace al cargar el componente:

```js
// [CC-004] Detect consultant mode from Supabase auth session
const { data: { user } } = await supabase.auth.getUser()

let consultantMode = false
let currentConsultant = null

if (user) {
  const { data: consultant } = await supabase
    .from('consultants')
    .select('id, name, role, region')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single()

  if (consultant) {
    consultantMode = true
    currentConsultant = consultant
  }
}
```

### 9.2 Diferencias visuales en modo Consultor

Cuando `consultantMode === true`, la UI agrega las siguientes capas:

**Banner de modo consultor** — Visible en la parte superior del wizard durante toda la sesión:

```jsx
{/* [CC-004] Consultant mode banner */}
{consultantMode && (
  <div className="w-full bg-secondary-container text-on-secondary-container px-lg py-sm flex items-center gap-sm rounded-t-xl">
    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
    <span className="font-label-md text-label-md font-bold">
      Consultant Mode — {currentConsultant.name}
    </span>
    <span className="text-on-secondary-container/60 font-label-sm text-label-sm ml-auto">
      Session will be saved to your dashboard
    </span>
  </div>
)}
```

**Reasoning panel en resultados** — En modo consultor, cada resultado muestra el reasoning path expandido:

```jsx
{/* [CC-004] Reasoning panel — consultant mode only */}
{consultantMode && result.reasoning_path && (
  <div className="mt-sm p-sm bg-surface-container rounded-lg border border-outline-variant">
    <p className="font-label-sm text-label-sm text-on-surface-variant font-bold mb-xs">
      Why this match:
    </p>
    <ul className="flex flex-col gap-xs">
      {result.reasoning_path.explanation.map((reason, i) => (
        <li key={i} className="flex items-start gap-xs font-body-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px] text-primary mt-px">arrow_right</span>
          {reason}
        </li>
      ))}
    </ul>
    <p className="font-label-xs text-label-xs text-on-surface-variant/60 mt-xs">
      {result.reasoning_path.match_count} of {result.reasoning_path.total_trigger_tags} tags matched
    </p>
  </div>
)}
```

**Score breakdown** — En modo consultor, el bloque DML muestra el score exacto por dimensión en lugar del porcentaje redondeado.

### 9.3 Autenticación

Para la pantalla de login del consultor, usar Supabase Auth con email + password. Esta pantalla no es parte de este CC — se documenta en CC-006. Para el MVP, el modo consultor puede detectarse simplemente chequeando si hay sesión activa de Supabase Auth.

---

## 10. Stepper de progreso

El stepper actual (4 pasos) se reemplaza por uno de 5 pasos:

| Step | Label | Dimensión |
|------|-------|-----------|
| 1 | Profile | — |
| 2 | Operations | 35% |
| 3 | Digital | 40% |
| 4 | Market | 25% |
| 5 | Results | — |

```jsx
{/* [CC-004] 5-step progress stepper */}
const STEPS = [
  { id: 1, label: 'Profile', icon: 'business' },
  { id: 2, label: 'Operations', icon: 'manufacturing', weight: '35%' },
  { id: 3, label: 'Digital', icon: 'devices', weight: '40%' },
  { id: 4, label: 'Market', icon: 'storefront', weight: '25%' },
  { id: 5, label: 'Results', icon: 'task_alt' }
]
```

---

## 11. Estado global del wizard

Usar `useState` con un objeto de estado centralizado para todo el wizard:

```js
// [CC-004] Central wizard state
const [wizardState, setWizardState] = useState({
  currentStep: 1,
  sessionId: null,
  profile: {
    sectorId: null, subSectorId: null, employeeCount: null,
    turnoverRange: null, location: null, businessStructure: null,
    businessAgeYears: null, hasAbn: true
  },
  answers: [],          // Array of { questionId, dimension, value, tags, scoreContribution }
  activatedTags: [],    // Accumulated tags from all dimensions
  scores: { operations: 0, digital: 0, market: 0, total: 0 },
  dml: null,
  matchResults: { grants: [], providers: [], resources: [] },
  loading: false,
  error: null
})
```

---

## 12. Estados de carga y error

```jsx
{/* [CC-004] Loading overlay during BFS calculation */}
{wizardState.loading && (
  <div className="absolute inset-0 bg-surface/80 flex flex-col items-center justify-center gap-md rounded-xl z-10">
    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    <p className="font-body-md text-body-md text-on-surface-variant">
      Analysing your profile and finding matches…
    </p>
  </div>
)}

{/* [CC-004] Error state */}
{wizardState.error && (
  <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
    <p className="font-body-md">Something went wrong. Please try again.</p>
    <button onClick={retryLastStep} className="mt-md font-label-md text-label-md underline">
      Retry
    </button>
  </div>
)}
```

---

## 13. Archivos a crear o modificar

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Reemplazar | `src/pages/Advisor.jsx` | Wizard completo de 5 pasos |
| Crear | `src/lib/matchingEngine.js` | Motor BFS — módulo JS puro |
| Usar (existente) | `src/lib/supabaseClient.js` | Cliente Supabase (ya existe desde CC-001) |
| Deprecar | `src/components/DigitalAdvisor.jsx` | No eliminar aún — dejar pero no usar |

---

## 14. Dependencias

- `@supabase/supabase-js` — ya instalado (CC-001)
- Variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — ya configuradas (CC-001)
- **Requiere datos en Supabase:** tablas `questions`, `question_tags`, `sectors` deben tener datos seed antes de que el wizard funcione
- **No requiere backend adicional** — el motor BFS corre en el cliente

---

## 15. Delivery Checklist para Antigravity

### Módulo matchingEngine.js
- [ ] `calculateMatchScore()` implementada y testeada con datos reales
- [ ] `calculateGeoFactor()` retorna 1.0 / 0.8 / 0.0 correctamente
- [ ] `calculateEligibilityFactor()` evalúa ABN, employee count, business age y DML range
- [ ] `runBFSMatching()` retorna top 5 por tipo, ordenados por match_score desc
- [ ] `buildReasoningPath()` retorna tags coincidentes con explicaciones legibles
- [ ] Score 0.0 no aparece en resultados (filtrado aplicado)

### Wizard — Pantalla 1 (Profile)
- [ ] Sectores cargados dinámicamente desde Supabase
- [ ] Sub-sectores aparecen sólo después de seleccionar sector macro
- [ ] Todos los campos de perfil capturados correctamente
- [ ] Sesión creada en `diagnostic_sessions` al avanzar a pantalla 2

### Wizard — Pantallas 2, 3 y 4 (Diagnóstico)
- [ ] Preguntas cargadas desde Supabase por dimensión
- [ ] Preguntas filtradas por `sector_filter` si aplica
- [ ] Respuestas guardadas en `user_responses` al avanzar
- [ ] Tags acumulados correctamente en `activatedTags`
- [ ] Score por dimensión calculado correctamente (0–100)

### Pantalla 5 (Resultados)
- [ ] Score total calculado con pesos: Ops 35%, Digital 40%, Market 25%
- [ ] Nivel DML determinado correctamente según rangos
- [ ] Barras de score animadas con transition-all
- [ ] Grants: top 3, ordenados por match_score, con match % visible
- [ ] Providers: top 3, ordenados por match_score, con service_types como badges
- [ ] Resources: top 3, ordenados por match_score, link abre library_url (nunca PDF directo)
- [ ] Resultados guardados en `match_results` con reasoning_path
- [ ] Sesión actualizada a `status: 'completed'` en `diagnostic_sessions`

### Modo Consultor
- [ ] Banner de modo consultor visible cuando hay sesión Supabase Auth activa
- [ ] Reasoning panel visible en cada resultado en modo consultor
- [ ] `session_mode` guardado como `'consultant_guided'` cuando hay consultor activo
- [ ] `consultant_id` referenciado correctamente en `diagnostic_sessions`

### Stepper
- [ ] 5 pasos visibles (Profile / Operations / Digital / Market / Results)
- [ ] Paso activo resaltado
- [ ] Pasos completados muestran check
- [ ] Pesos de dimensión visibles en pasos 2, 3, 4 (35% / 40% / 25%)

### General
- [ ] Loading overlay visible durante carga de datos y cálculo BFS
- [ ] Error state visible si Supabase falla
- [ ] `DigitalAdvisor.jsx` no está importado en ningún lado
- [ ] Todos los bloques relevantes comentados con `// [CC-004]`
- [ ] Testeado con datos reales en Supabase

---

## 16. Lo que NO cambia

- Visual general de la página (layout, sidebar "Need Help?", colores del sistema de diseño)
- Sistema de routing — `/advisor` sigue siendo la ruta
- La estructura de la base de datos — todas las tablas referenciadas ya existen en el schema v2.1

---

## 17. Nota sobre el banco de preguntas

Las preguntas de diagnóstico incluidas en la sección 5 de este documento son **preguntas de referencia** para orientar el desarrollo. El banco definitivo debe ser **aprobado por DPIRD** antes de hacer el seed en Supabase. Antigravity puede hacer seed con las preguntas de referencia para desarrollo y testing, pero el contenido final queda pendiente de validación.

---

---

## 18. Addendum v1.1 — Respuestas a consultas de Antigravity

Esta sección responde las tres consultas técnicas planteadas por Antigravity al revisar CC-004 v1.0.

---

### 18.1 Tabla `resources` — ¿Existe o hay que crearla?

**La tabla `resources` ya existe.** Está definida en el archivo `database/04_resources_schema.sql`, que es un script de migración separado del schema base (`01_schema.sql`). Antigravity debe ejecutar este archivo para que la tabla esté disponible en Supabase.

**Este archivo también crea:**
- La tabla `resource_tags` (junction table)
- Todos los índices GIN necesarios para el matching (`trigger_tags`, `sector_tags`, `dml_levels`)
- Las políticas RLS correspondientes
- **El fix del constraint de `match_results`** (ver punto 18.2)

**No hay que crear nada manualmente.** Solo ejecutar el archivo.

---

### 18.2 Constraint en `match_results` — ¿Cómo agregar `'resource'`?

**El fix ya está incluido en `04_resources_schema.sql`** (líneas 99–104 del archivo). Al ejecutar ese script, las siguientes instrucciones corren automáticamente:

```sql
-- [CC-002] Update match_results check constraint to include 'resource'
ALTER TABLE match_results
  DROP CONSTRAINT match_results_result_type_check;

ALTER TABLE match_results
  ADD CONSTRAINT match_results_result_type_check
  CHECK (result_type IN ('grant', 'provider', 'resource'));
```

También agrega las columnas `result_id` y `result_name` a `match_results` si no existen (`ADD COLUMN IF NOT EXISTS`), que son los campos genéricos que usa el motor BFS para los tres tipos de resultado.

**No es necesario ningún cambio manual al schema.**

---

### 18.3 Seed data — ¿Existen preguntas y sectores en la DB?

**Sí. El archivo `database/04_seed_data.sql` ya contiene seed completo para:**

**Sectores (13 registros):** Agriculture, Food & Beverage, Food Manufacturing, Aquaculture, Horticulture, Retail & Wholesale, Construction & Trade, Professional Services, Regional Development, Indigenous Business, Environmental & Sustainability, Fishing & Recreation, Creative Industries.

**Tags (todos los del sistema BFS):** `website`, `ecommerce`, `social_media`, `crm`, `inventory_software`, `cybersecurity`, `ai_tools`, `supply_chain`, `quality_control`, `compliance`, `export`, `brand_development`, y más.

**Preguntas (25 registros):** Distribuidas en las dimensiones `profile`, `digital`, `operations` y `market`. Incluyen `answer_type`, `options` con scoring, `sector_filter` para preguntas específicas por industria, y `dimension_weight`. Son suficientes para hacer funcionar el wizard completo durante desarrollo y testing.

> ⚠️ **Nota:** El banco de preguntas final debe ser validado y aprobado por DPIRD antes de ir a producción. Las 25 preguntas del seed son de referencia para desarrollo. El seed puede ejecutarse sin riesgo — usa `ON CONFLICT DO UPDATE` en todas las inserciones.

---

### 18.4 Orden correcto de ejecución de los scripts SQL

Antigravity debe ejecutar los archivos en este orden exacto en Supabase:

| # | Archivo | Descripción | Depende de |
|---|---------|-------------|------------|
| 1 | `01_schema.sql` | Schema base: todas las tablas principales | — |
| 2 | `02_indexes_and_triggers.sql` | Índices y triggers de `updated_at` | `01_schema.sql` |
| 3 | `03_rls_policies.sql` | Row Level Security para todas las tablas | `01_schema.sql` |
| 4 | `04_seed_data.sql` | Sectores, tags, preguntas, grants, providers | `01_schema.sql` |
| 5 | `04_resources_schema.sql` | Tabla `resources` + fix constraint `match_results` | `01_schema.sql` ejecutado |
| 6 | `05_resources_seed.sql` | 15 registros de recursos de la biblioteca DPIRD | `04_resources_schema.sql` |

> ⚠️ **Importante:** `04_resources_schema.sql` debe ejecutarse DESPUÉS de `01_schema.sql` porque hace `ALTER TABLE` sobre `match_results`. Si se ejecuta antes, fallará porque la tabla no existe aún.

> ⚠️ **Nota sobre `05_resources_seed.sql`:** 8 de los 15 recursos tienen URLs específicas correctas de la biblioteca DPIRD. Los otros 7 tienen URLs genéricas (`library.dpird.wa.gov.au/reports/`) — son datos de prototipo y serán actualizados con URLs reales en una iteración posterior.

---

*CC-004 v1.1 — Eleven June Consulting para DPIRD / Antigravity — Agosto 2026*

---

---

## 19. QA Validation Report — Advisor Page Implementation Status (August 21, 2026)

**Prepared by:** Eleven June Consulting (QA Automation)  
**Test Date:** August 21, 2026  
**Test Environment:** localhost:5173/advisor  
**Specification Reference:** CC-004 v1.1  
**Overall Status:** ❌ **IMPLEMENTATION INCOMPLETE — 35% CONFORMITY**

---

### 19.1 Executive Summary

A comprehensive QA audit of the Advisor page implementation against CC-004 specification reveals **partial completion**. The Business Profile step (Pantalla 1) is fully functional, but **critical response fields are missing from Diagnostic Steps 2-4**, blocking the core diagnostic workflow.

**Key Finding:** The implementation renders the visual structure of all 5 screens correctly, but **lacks input fields (scales, checkboxes, radio buttons, textareas) required to capture user responses** on Operations, Digital, and Market Readiness dimensions.

**Result Impact:**
- ✅ Step 1 (Business Profile): 100% functional
- ❌ Steps 2-4 (Diagnostics): 5% functional (questions only, no response fields)
- ⚠️ Step 5 (Results): Renders correctly but with incorrect data (0% scores across all dimensions)
- ❌ BFS Matching Engine: Exists but receives no input data
- ❌ Consultant Mode: Not implemented

---

### 19.2 Conformity Matrix — CC-004 Sections

| Section | Requirement | Status | Completeness |
|---------|-------------|--------|---|
| §1 | Replace Advisor.jsx with functional wizard | ⚠️ PARTIAL | 60% |
| §2 | 5-screen architecture | ⚠️ PARTIAL | 60% |
| §3 | Architecture flow diagram | ✅ OK | 100% |
| §4 | Screen 1 — Business Profile with 8 fields | ✅ COMPLETE | 100% |
| §4.3 | Load sectors from Supabase | ✅ IMPLEMENTED | 100% |
| §4.4 | Create session on Profile completion | ✅ IMPLEMENTED | 100% |
| §5.1 | Common diagnostic screen structure | ⚠️ PARTIAL | 40% |
| §5.2 | Load questions by dimension from Supabase | ❌ MISSING | 0% |
| §5.3 | Screen 2 — Operations (4 questions) | ❌ MISSING | 5% |
| §5.4 | Screen 3 — Digital (6 questions) | ❌ MISSING | 5% |
| §5.5 | Screen 4 — Market (3 questions) | ❌ MISSING | 5% |
| §5.6 | Save responses + accumulate tags | ❌ MISSING | 0% |
| §6 | BFS Matching Engine (pure JS) | ⚠️ EXISTS | 50% |
| §6.2 | Match score formula | ✅ CODE EXISTS | 100% |
| §6.3 | Module implementation | ✅ CODE EXISTS | 100% |
| §6.4 | Load matching data | ⚠️ PARTIAL | 50% |
| §7 | DML Calculation | ❌ INCORRECT | 0% |
| §7.1 | Dimension scores | ❌ RETURNS 0% | 0% |
| §7.2 | DML level determination | ⚠️ RENDERS | 50% |
| §7.3 | Update session with scores | ⚠️ PARTIAL | 50% |
| §8 | Screen 5 — Results | ⚠️ PARTIAL | 70% |
| §8.1 | DML Summary block | ✅ RENDERS | 100% |
| §8.2 | Match percentage display | ✅ RENDERS | 100% |
| §8.3 | Persist match results | ⚠️ PARTIAL | 50% |
| §9 | Consultant Mode | ❌ NOT IMPLEMENTED | 0% |
| §10 | 5-step progress stepper | ✅ IMPLEMENTED | 100% |
| §11 | Central wizard state management | ✅ IMPLEMENTED | 100% |
| §12 | Loading & error states | ⚠️ PARTIAL | 50% |
| §13 | Files to create/modify | ⚠️ PARTIAL | 50% |
| **TOTAL** | | **❌ 35%** | |

---

### 19.3 Critical Defects (Blockers)

#### **Defect #1: Missing Response Fields in Steps 2-4**
- **Severity:** 🔴 BLOCKER
- **CC-004 Reference:** §5.3, §5.4, §5.5
- **Specification Requirement:** 
  - Step 2 (Operations): 4 questions with `scale_1_5` and `boolean` response types
  - Step 3 (Digital): 6 questions with `scale_1_5` and `boolean` response types
  - Step 4 (Market): 3 questions with `scale_1_5` and `boolean` response types
- **Actual Implementation:** Questions render as static text with no input fields
- **Test Evidence:** Manual navigation through Steps 2-4; no interactive form controls found
- **User Impact:** Users cannot respond to diagnostic questions; diagnosis cannot be completed
- **Data Flow Impact:** No data flows to `user_responses` table; no tags activate; BFS engine receives empty input

#### **Defect #2: No Validation of Required Fields**
- **Severity:** 🔴 BLOCKER
- **CC-004 Reference:** §5.6
- **Specification Requirement:** Prevent advancement without completed responses
- **Actual Implementation:** "Next" button allows advancing from Steps 2-4 without any responses
- **Test Evidence:** Clicked "Next" without answering any questions; page advanced to next step
- **User Impact:** Users skip entire diagnostic dimensions; profile incomplete
- **Data Integrity Impact:** `diagnostic_sessions` created but missing critical response data

#### **Defect #3: BFS Engine Receives No Input Data**
- **Severity:** 🔴 BLOCKER (consequence of #1 and #2)
- **CC-004 Reference:** §6
- **Specification Requirement:** Engine receives `activatedTags` array and calculates matches
- **Actual Implementation:** Engine code exists but `activatedTags` array remains empty
- **Test Evidence:** Step 5 shows 0% scores; no grants/providers/resources matched
- **Cause:** No responses captured → no tags activated → `activatedTags = []`
- **Impact:** Matching engine produces empty results

#### **Defect #4: DML Scores All Zeros**
- **Severity:** 🔴 CRITICAL
- **CC-004 Reference:** §7.1, §7.2
- **Specification Requirement:** 
  - Operations Score = (sum_answers / max_possible) × 100
  - Digital Score = (sum_answers / max_possible) × 100
  - Market Score = (sum_answers / max_possible) × 100
  - Total = (Ops × 0.35) + (Digital × 0.40) + (Market × 0.25)
- **Actual Implementation:**
  - Operations Readiness: **0%**
  - Digital Readiness: **0%**
  - Market Readiness: **0%**
  - DML Level: **Foundational** (0-24 range)
- **Root Cause:** No answers to dimensions → sum = 0 → score = 0%
- **Test Evidence:** Screenshot of Step 5 Results showing all three bars at 0%
- **Impact:** Incorrect DML level assignment; results meaningless to user

#### **Defect #5: Empty Recommendations**
- **Severity:** 🔴 CRITICAL
- **CC-004 Reference:** §8.1, §8.2, §8.3
- **Specification Requirement:** Display top 3-5 grants, providers, resources ranked by match_score
- **Actual Implementation:**
  - Recommended Grants: "No grants matched your profile."
  - Recommended Providers: "No providers matched your profile."
  - Recommended Resources: "No resources matched your profile."
- **Root Cause:** match_score calculation: `intersection.length / triggerTags.length` when intersection = 0 → score = 0.0; filtered by `filter(item => item.match_score > 0)` → no items pass
- **Impact:** User receives no actionable recommendations; wizard provides no value

#### **Defect #6: Consultant Mode Not Implemented**
- **Severity:** 🟠 HIGH
- **CC-004 Reference:** §9
- **Specification Requirement:**
  - Detect Supabase Auth session to identify consultant
  - Display consultant mode banner (§9.2)
  - Show reasoning panel on result cards (§9.2)
- **Actual Implementation:** Not implemented
- **Impact:** Advisors cannot guide client sessions; reasoning for matches not visible

---

### 19.4 Test Scenario Execution

**Test Profile:**
```
Main Sector:        Agriculture
Sub-Sector:         Aquaculture
Number of Employees: 1-4
Business Age:       Less than 1 year
```

**Results:**
| Dimension | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Operations Score | Varies (based on answers) | 0% | ❌ INCORRECT |
| Digital Score | Varies (based on answers) | 0% | ❌ INCORRECT |
| Market Score | Varies (based on answers) | 0% | ❌ INCORRECT |
| Total Score | Varies (weighted) | 0% | ❌ INCORRECT |
| DML Level | Varies (Foundational-Advanced) | Foundational | ⚠️ TECHNICALLY CORRECT (for 0%) but INCORRECT result |
| Grants Recommended | 3-5 matches | None | ❌ INCORRECT |
| Providers Recommended | 3-5 matches | None | ❌ INCORRECT |
| Resources Recommended | 3-5 matches | None | ❌ INCORRECT |

---

### 19.5 Components Not Rendered

**Missing Components (required by CC-004 §5):**

1. **ScaleQuestion Component** 
   - Type: `scale_1_5` slider
   - Used in: Steps 2, 3, 4
   - Not Found: ✗

2. **BooleanQuestion Component**
   - Type: `yes/no` toggle
   - Used in: Steps 2, 3, 4
   - Not Found: ✗

3. **ChoiceQuestion Component**
   - Type: `single_choice` or `multi_choice`
   - Used in: Steps 2, 3, 4
   - Not Found: ✗

4. **ConsultantModeBanner Component**
   - Required by: CC-004 §9.2
   - Not Found: ✗

5. **ReasoningPanel Component**
   - Required by: CC-004 §9.2
   - Not Found: ✗

---

### 19.6 Database Connectivity Status

| Query | Expected | Status |
|-------|----------|--------|
| Load sectors from `sectors` table | ✅ Works | ✅ OK |
| Create `diagnostic_sessions` record | ✅ Works | ✅ OK |
| Load questions from `questions` table | ❌ Not attempted | — |
| Insert `user_responses` | ❌ Not attempted | — |
| Load `grants` for matching | ❌ Not attempted | — |
| Load `providers` for matching | ❌ Not attempted | — |
| Load `resources` for matching | ❌ Not attempted | — |
| Insert `match_results` | ❌ Not attempted | — |
| Update `diagnostic_sessions` with scores | ❌ Not attempted | — |

**Conclusion:** Only Supabase queries for Step 1 (Profile) are active. Queries for Steps 2-5 are blocked by missing UI components.

---

### 19.7 Estimation of Work Required

| Defect | Component | Hours | Priority |
|--------|-----------|-------|----------|
| #1 | Response field components (Scale, Boolean, Choice, Text) | 40-60 | 🔴 BLOCKER |
| #2 | Validation logic + error messages | 10-15 | 🔴 BLOCKER |
| #3 | Tag accumulation logic | 10-15 | 🔴 BLOCKER |
| #4 | Score calculation (§7) | 5-10 | 🔴 BLOCKER |
| #5 | BFS matching data flow | 5-10 | 🔴 BLOCKER |
| #6 | Consultant mode detection + UI (§9) | 20-30 | 🟠 HIGH |
| **TOTAL** | | **90-130 hours** | |

---

### 19.8 Recommendation

**PAUSE** additional testing. The Advisor page is **not functional** as a diagnostic tool in its current state. 

**Required Actions Before Next QA:**

1. ✏️ **Implement response field components** (Scale, Boolean, Choice)
2. ✔️ **Add validation** to prevent advancement without responses
3. 💾 **Wire data flow** to capture responses in `user_responses` and accumulate tags
4. 📊 **Verify score calculation** produces values > 0%
5. 🎯 **Test BFS matching** produces non-empty results

**Success Criteria for Re-Test:**
- All three dimensions show scores > 0%
- DML level matches calculated score
- At least 1 grant/provider/resource appears in recommendations
- Matching explanations visible in consultant mode

---

### 19.9 Defect Summary

```
🔴 CRITICAL (Blockers):        5 defects — wizard non-functional
🟠 HIGH (Important):            1 defect  — consultant mode missing
🟢 MEDIUM (Nice-to-have):       0 defects
🔵 LOW (Cosmetic):              0 defects
────────────────────────────────────────
TOTAL:                          6 defects
```

**Blockers prevent user stories from being realized.**

---

### 19.10 Test Coverage

| Area | Coverage | Evidence |
|------|----------|----------|
| UI Navigation | 100% | All 5 steps accessible |
| Database Connectivity | 25% | Only Step 1 queries work |
| Data Capture | 0% | No form inputs to capture |
| Matching Logic | 0% | No data input to BFS engine |
| Results Display | 50% | Renders but with null/zero data |
| Consultant Mode | 0% | Not implemented |
| Error Handling | 25% | Loading overlay exists but never triggered |

**Overall Coverage:** 20%

---

### 19.11 Conclusion

The Advisor page implementation is **structurally complete** but **functionally incomplete**. It successfully demonstrates the intended layout and navigation pattern, but fails to implement the core diagnostic workflow.

**Status:** ❌ **NOT READY FOR PRODUCTION**  
**Recommendation:** Complete Blockers #1-5 before next QA cycle.

---

**QA Report Completed:** August 21, 2026 23:45 UTC  
**Tester:** Eleven June Consulting (QA Automation)  
**Next Review:** After defect remediation (estimated 2-3 weeks)

