# DPIRD Digital Advisory Platform — Consultant Mode: Analytics Dashboard & Knowledge Graph
**Document:** Technical Change Specification  
**ID:** CC-005  
**Version:** 2.0  
**Date:** August 2026  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementation)  
**Depends on:** CC-004 completado  
**Files affected:** `src/pages/ConsultantLogin.jsx` *(new)* · `src/pages/ConsultantDashboard.jsx` *(new)* · `src/pages/SessionDetail.jsx` *(new)* · `src/components/KnowledgeGraph.jsx` *(new)* · `src/components/ProtectedRoute.jsx` *(new)* · `src/lib/analyticsEngine.js` *(new)* · `src/lib/supabaseClient.js` · `src/App.jsx`

---

## Control de cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | Agosto 2026 | Documento inicial |
| 1.1 | Agosto 2026 | Correcciones técnicas (queries, imports, helpers) |
| 2.0 | Agosto 2026 | Alcance reducido: CC-005 es solo herramienta de análisis. Se elimina la vista de consultor en tiempo real durante el wizard. Knowledge Graph se mantiene como análisis post-sesión. |

---

## 1. Contexto y Objetivo

CC-005 implementa una **herramienta de análisis** para consultores de DPIRD. Su propósito es permitir que el equipo de DPIRD entienda patrones de uso del sistema, identifique gaps en el catálogo de grants, y tome decisiones informadas sobre nuevos programas de apoyo.

**No incluye en esta versión:**
- Vista en tiempo real durante el wizard del SME
- Guía activa del consultor al SME (el SME completa el wizard de forma autónoma)
- Cierre de sesión por parte del consultor
- Envío de emails (CC-006)

---

## 2. Resumen de cambios

| Aspecto | Estado actual | Estado objetivo |
|---------|--------------|-----------------|
| Autenticación consultor | No existe | Supabase Auth (email + password) |
| Dashboard analytics | No existe | 8 vistas de BI sobre sesiones completadas |
| Detalle de sesión | No existe | Vista individual con Knowledge Graph post-sesión |
| Knowledge Graph | No existe | Análisis de una sesión completada: cómo sus respuestas generaron los resultados |

---

## 3. Autenticación de Consultores

### 3.1 Login Page (`/login`)

```jsx
// [CC-005] Consultant login form
const handleLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setError(error.message)
    return
  }

  const { data: consultant, error: profileError } = await supabase
    .from('consultants')
    .select('id, name, role, region')
    .eq('auth_user_id', data.user.id)
    .eq('is_active', true)
    .single()

  if (profileError || !consultant) {
    await supabase.auth.signOut()
    setError('Consultant profile not found or inactive.')
    return
  }

  setCurrentConsultant(consultant)
  navigate('/consultant/dashboard')
}
```

### 3.2 Session Persistence

En `App.jsx`, verificar sesión activa al cargar:

```js
// [CC-005] Check consultant session on app load
useEffect(() => {
  const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: consultant } = await supabase
      .from('consultants')
      .select('id, name, role, region')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single()

    if (consultant) {
      setConsultantMode(true)
      setCurrentConsultant(consultant)
    }
  }
  checkSession()
}, [])
```

### 3.3 Rutas en App.jsx

```jsx
// [CC-005] Consultant routes — add inside <Routes> in App.jsx
<Route path="/login" element={<ConsultantLogin />} />

<Route path="/consultant/dashboard" element={
  <ProtectedRoute><ConsultantDashboard /></ProtectedRoute>
} />

<Route path="/consultant/sessions/:sessionId" element={
  <ProtectedRoute><SessionDetail /></ProtectedRoute>
} />
```

### 3.4 ProtectedRoute Component

```jsx
// [CC-005] ProtectedRoute — redirect to /login if not authenticated
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useConsultant } from '../lib/consultantContext'

export function ProtectedRoute({ children }) {
  const { currentConsultant, loading } = useConsultant()
  if (loading) return <div>Loading…</div>
  if (!currentConsultant) return <Navigate to="/login" replace />
  return children
}
```

---

## 4. Dashboard del Consultor (`/consultant/dashboard`)

### 4.1 Estructura General

```
┌─────────────────────────────────────────────┐
│ Consultant Dashboard                        │
│ Welcome, {Name} · {Region}                  │
│                                             │
│  ┌─────────────┬─────────────┐              │
│  │ In Progress │ Completed   │              │
│  │ 12 sessions │ 45 sessions │              │
│  └─────────────┴─────────────┘              │
│                                             │
│  [TAB: Overview]  [TAB: Opportunities]      │
│                                             │
│  Overview:                                  │
│    View 1 — Coverage by Sector              │
│    View 2 — Top Grants & Trends             │
│    View 3 — Resources Relevance             │
│    View 4 — Unmet Needs                     │
│                                             │
│  Opportunities:                             │
│    View 5 — Tags Without Coverage           │
│    View 6 — Potential New Grants            │
│    View 7 — Temporal Trends                 │
│    View 8 — Dimension Coverage              │
│                                             │
│  [Lista de sesiones recientes]              │
│  → Click en sesión → /consultant/sessions/:id │
└─────────────────────────────────────────────┘
```

---

### 4.2 Tab 1: Overview

#### View 1 — Coverage by Sector (Matriz)

Tabla cruzada: Sector × (Grants | Providers | Resources) con match_score promedio por tipo de resultado.

```jsx
// [CC-005] Coverage by Sector — single query with nested join
const getCoverageBySector = async () => {
  const { data: sessions } = await supabase
    .from('diagnostic_sessions')
    .select(`
      id,
      sector_id,
      sectors ( name, slug ),
      match_results ( result_type, match_score )
    `)
    .eq('status', 'completed')

  const bySector = {}
  for (const s of sessions) {
    const key = s.sector_id
    if (!bySector[key]) {
      bySector[key] = { name: s.sectors?.name ?? 'Unknown', grants: [], providers: [], resources: [] }
    }
    for (const r of s.match_results ?? []) {
      if (r.result_type === 'grant')    bySector[key].grants.push(r.match_score)
      if (r.result_type === 'provider') bySector[key].providers.push(r.match_score)
      if (r.result_type === 'resource') bySector[key].resources.push(r.match_score)
    }
  }

  return Object.values(bySector).map(sector => ({
    sector:             sector.name,
    grants_count:       sector.grants.length,
    grants_coverage:    avg(sector.grants),
    providers_count:    sector.providers.length,
    providers_coverage: avg(sector.providers),
    resources_count:    sector.resources.length,
    resources_coverage: avg(sector.resources)
  })).sort((a, b) => a.grants_coverage - b.grants_coverage)
}
```

**Renderizado:** Tabla. Celdas coloreadas: rojo <50%, amarillo 50–70%, verde >70%.

---

#### View 2 — Top Grants & Trends

```jsx
// [CC-005] Top grants by activation frequency
const getTopGrants = async () => {
  const { data } = await supabase
    .from('match_results')
    .select('result_id, result_name, match_score, created_at')
    .eq('result_type', 'grant')

  const grouped = groupBy(data, 'result_id')

  return Object.entries(grouped)
    .map(([grantId, results]) => ({
      grant_id:         grantId,
      grant_name:       results[0].result_name,
      activation_count: results.length,
      avg_match_score:  avg(results.map(r => r.match_score)),
      trend_week:       weeklyTrend(results, 'created_at')
    }))
    .sort((a, b) => b.activation_count - a.activation_count)
    .slice(0, 10)
}
```

**Renderizado:** Bar chart (activation_count) + tabla con columna trend (↑ / → / ↓).

---

#### View 3 — Resources Relevance

```jsx
// [CC-005] Top resources by matching frequency
const getTopResources = async () => {
  const { data } = await supabase
    .from('match_results')
    .select('result_id, result_name, match_score, created_at')
    .eq('result_type', 'resource')

  const grouped = groupBy(data, 'result_id')

  return Object.entries(grouped)
    .map(([id, results]) => ({
      resource_id:      id,
      resource_name:    results[0].result_name,
      match_count:      results.length,
      avg_match_score:  avg(results.map(r => r.match_score)),
      trend_week:       weeklyTrend(results, 'created_at')
    }))
    .sort((a, b) => b.match_count - a.match_count)
    .slice(0, 10)
}
```

**Renderizado:** Bar chart (match_count) + tabla con avg_score y trend.

---

#### View 4 — Unmet Needs

Sesiones completadas donde ningún resultado supera el umbral mínimo de match (0.4).

```jsx
// [CC-005] Detect unmet needs — single query, no N+1
const getUnmetNeeds = async () => {
  const { data: sessions } = await supabase
    .from('diagnostic_sessions')
    .select(`
      id,
      match_results ( result_type, match_score )
    `)
    .eq('status', 'completed')

  const THRESHOLD = 0.4

  const getBest = (session, type) => {
    const results = (session.match_results ?? []).filter(r => r.result_type === type)
    if (!results.length) return null
    return results.reduce((best, r) => r.match_score > best.match_score ? r : best)
  }

  const unmet = sessions.filter(s =>
    (!getBest(s, 'grant')    || getBest(s, 'grant').match_score    < THRESHOLD) ||
    (!getBest(s, 'provider') || getBest(s, 'provider').match_score < THRESHOLD) ||
    (!getBest(s, 'resource') || getBest(s, 'resource').match_score < THRESHOLD)
  )

  return {
    total_unmet:        unmet.length,
    without_grant:      unmet.filter(s => !getBest(s, 'grant')).length,
    without_provider:   unmet.filter(s => !getBest(s, 'provider')).length,
    without_resource:   unmet.filter(s => !getBest(s, 'resource')).length,
  }
}
```

**Renderizado:** Cards con número grande por tipo. Link "Ver sesiones" filtra la lista de sesiones por condición.

---

### 4.3 Tab 2: Opportunities

#### View 5 — Tags Without Sufficient Coverage

```jsx
// [CC-005] Tags activated but underserved
const getUndercoveredTags = async () => {
  const { data: responses } = await supabase
    .from('user_responses')
    .select('tags_activated')

  const allTags = responses.flatMap(r => r.tags_activated ?? [])
  const tagFreq = countFrequency(allTags)

  const { data: grants } = await supabase
    .from('grants')
    .select('trigger_tags')
    .eq('status', 'open')

  const { data: matchResults } = await supabase
    .from('match_results')
    .select('matched_tags, match_score')
    .eq('result_type', 'grant')

  return Object.entries(tagFreq)
    .filter(([, freq]) => freq >= 3)
    .map(([tag, freq]) => {
      const grantsCovering = grants.filter(g => (g.trigger_tags ?? []).includes(tag)).length
      const relevantMatches = matchResults.filter(r => (r.matched_tags ?? []).includes(tag))
      const avgScore = relevantMatches.length ? avg(relevantMatches.map(r => r.match_score)) : 0

      return {
        tag,
        frequency:         freq,
        grants_covering:   grantsCovering,
        avg_match_score:   avgScore,
        opportunity_score: freq * (1 - avgScore)
      }
    })
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
}
```

**Renderizado:** Tabla. Columnas: Tag | Frequency | Grants Covering | Avg Match | Opportunity Score. Celdas de Opportunity Score coloreadas (rojo = alta oportunidad).

---

#### View 6 — Potential New Grants

```jsx
// [CC-005] Estimate impact of a potential new grant
const estimateGrantImpact = async (topUndercoveredTags) => {
  const { data: sessions } = await supabase
    .from('diagnostic_sessions')
    .select('id, activated_tags, employee_count, annual_turnover_range')
    .eq('status', 'completed')

  const impacted = sessions.filter(s =>
    topUndercoveredTags.some(tag => (s.activated_tags ?? []).includes(tag))
  )

  return {
    impacted_sessions:     impacted.length,
    coverage_percentage:   ((impacted.length / sessions.length) * 100).toFixed(1),
    tags_covered:          topUndercoveredTags,
    recommended_amount_min: 5000,
    recommended_amount_max: 50000,
    roi_indicator: impacted.length > 10 ? 'High' : impacted.length > 5 ? 'Medium' : 'Low'
  }
}
```

> **Nota:** El botón "Request New Grant" abre un modal con el análisis de impacto que el consultor puede copiar para elevar a DPIRD. No envía datos automáticamente.

**Renderizado:** Cards por cluster de tags. Cada card muestra: tags involucrados, sesiones impactadas (%), rango de monto recomendado, indicador ROI.

---

#### View 7 — Temporal Trends

```jsx
// [CC-005] Weekly tag activation trends — last 8 weeks
const getWeeklyTrends = async (weeksBack = 8) => {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (weeksBack * 7))

  const { data: responses } = await supabase
    .from('user_responses')
    .select('tags_activated, created_at')
    .gte('created_at', startDate.toISOString())

  const byWeek = {}
  for (const r of responses) {
    const week = getISOWeekLabel(r.created_at)
    if (!byWeek[week]) byWeek[week] = []
    byWeek[week].push(...(r.tags_activated ?? []))
  }

  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, tags]) => ({
      week,
      tag_counts:        countFrequency(tags),
      total_activations: tags.length
    }))
}
```

**Renderizado:** Line chart. Series = top 5 tags globales. X = semana (ISO), Y = activaciones. Usar recharts `<LineChart>`.

---

#### View 8 — Dimension Coverage

> **Nota importante:** La tabla `questions` no tiene columna `trigger_tags`. Los tags se obtienen a través de la tabla junction `question_tags`. Usar el join correcto:

```jsx
// [CC-005] Coverage by dimension — via question_tags junction (NOT questions.trigger_tags)
const getDimensionCoverage = async () => {
  const dimensions = ['operations', 'digital', 'market']

  const { data: questionTagsData } = await supabase
    .from('question_tags')
    .select(`
      tag_id,
      questions!inner ( dimension ),
      tags ( name )
    `)
    .in('questions.dimension', dimensions)

  const { data: grants } = await supabase
    .from('grants')
    .select('trigger_tags')
    .in('status', ['open', 'ongoing'])

  const allGrantTags = new Set(grants.flatMap(g => g.trigger_tags ?? []))

  return dimensions.map(dim => {
    const dimTags = [...new Set(
      questionTagsData
        .filter(qt => qt.questions.dimension === dim)
        .map(qt => qt.tags?.name)
        .filter(Boolean)
    )]

    const covered = dimTags.filter(tag => allGrantTags.has(tag))

    return {
      dimension:           dim,
      total_tags:          dimTags.length,
      covered_tags:        covered.length,
      coverage_percentage: dimTags.length
        ? Math.round((covered.length / dimTags.length) * 100)
        : 0,
      uncovered_tags:      dimTags.filter(tag => !allGrantTags.has(tag))
    }
  })
}
```

**Renderizado:** Bar chart horizontal. % de cobertura por dimensión. Colores: rojo <60%, amarillo 60–80%, verde >80%. Tooltip muestra los tags sin cobertura.

---

## 5. Lista de Sesiones (dentro del Dashboard)

Al final del dashboard, mostrar una tabla de sesiones completadas que actúa como punto de entrada al detalle de cada sesión:

```jsx
// [CC-005] Completed sessions list
const getSessions = async () => {
  const { data } = await supabase
    .from('diagnostic_sessions')
    .select(`
      id,
      business_name,
      contact_name,
      created_at,
      completed_at,
      dml_level,
      total_score,
      sectors ( name )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(50)

  return data
}
```

**Renderizado:** Tabla. Columnas: Business Name | Sector | DML Level | Score | Date. Click en fila → navega a `/consultant/sessions/:id`.

---

## 6. Detalle de Sesión + Knowledge Graph (`/consultant/sessions/:sessionId`)

### 6.1 Propósito

Vista de análisis post-sesión. El consultor puede explorar cómo las respuestas de un SME activaron tags y qué resultados se generaron, para entender el reasoning del sistema.

### 6.2 Layout

```
┌───────────────────────────────────────────────────┐
│ ← Back to Dashboard                               │
│ Session: {business_name} · {sector} · {date}      │
│ DML Level: Emerging · Score: 42/100               │
├─────────────────────────┬─────────────────────────┤
│  Summary                │  Knowledge Graph        │
│  ─────────────────────  │  ───────────────────── │
│  Ops:     65%           │  [Grafo interactivo]    │
│  Digital: 35%           │                         │
│  Market:  40%           │  Hover nodo = detalles  │
│                         │  Click = ver reasoning  │
├─────────────────────────┴─────────────────────────┤
│  Match Results                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Grants matched · Providers · Resources       │ │
│  │ (tabla con score, tags matched, reasoning)   │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  Responses log (acordeón por dimensión)           │
└───────────────────────────────────────────────────┘
```

### 6.3 Componente `KnowledgeGraph.jsx`

Analiza una sesión completada y visualiza el flujo: Respuesta → Tag → Resultado.

```jsx
// [CC-005] Knowledge graph — post-session analysis
// src/components/KnowledgeGraph.jsx
import { useEffect, useState, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'  // npm install react-force-graph
import { supabase } from '../lib/supabaseClient'

const NODE_COLORS = {
  response: '#3B82F6',  // blue
  tag:      '#22C55E',  // green
  grant:    '#EF4444',  // red
  provider: '#F97316',  // orange
  resource: '#EAB308'   // yellow
}

export function KnowledgeGraph({ sessionId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)

  useEffect(() => {
    if (sessionId) loadGraphData(sessionId)
  }, [sessionId])

  const loadGraphData = async (sId) => {
    const [{ data: responses }, { data: results }] = await Promise.all([
      supabase
        .from('user_responses')
        .select('id, answer_value, tags_activated')
        .eq('session_id', sId),
      supabase
        .from('match_results')
        .select('result_id, result_name, result_type, match_score, matched_tags, reasoning_path')
        .eq('session_id', sId)
    ])

    const allTags = [...new Set((responses ?? []).flatMap(r => r.tags_activated ?? []))]

    const nodes = [
      ...(responses ?? []).map(r => ({
        id:    `response-${r.id}`,
        type:  'response',
        label: (r.answer_value ?? '').slice(0, 35),
        color: NODE_COLORS.response
      })),
      ...allTags.map(t => ({
        id:    `tag-${t}`,
        type:  'tag',
        label: t,
        color: NODE_COLORS.tag
      })),
      ...(results ?? []).map(r => ({
        id:        `result-${r.result_type}-${r.result_id}`,
        type:      r.result_type,
        label:     r.result_name,
        score:     r.match_score,
        reasoning: r.reasoning_path,
        color:     NODE_COLORS[r.result_type]
      }))
    ]

    const links = [
      ...(responses ?? []).flatMap(r =>
        (r.tags_activated ?? []).map(t => ({
          source: `response-${r.id}`,
          target: `tag-${t}`,
          width:  1
        }))
      ),
      ...(results ?? []).flatMap(r =>
        (r.matched_tags ?? []).slice(0, 3).map(tag => ({  // max 3 edges por resultado
          source:   `tag-${tag}`,
          target:   `result-${r.result_type}-${r.result_id}`,
          width:    r.match_score * 4,
          strength: r.match_score
        }))
      )
    ]

    setGraphData({ nodes, links })
  }

  return (
    <div className="relative h-96 bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
      <ForceGraph2D
        graphData={graphData}
        nodeColor={node => node.color}
        nodeLabel={node =>
          `${node.label}${node.score ? ` (${Math.round(node.score * 100)}%)` : ''}`
        }
        linkWidth={link => link.width ?? 1}
        linkColor={() => '#94A3B8'}
        onNodeClick={useCallback(node => setSelectedNode(node), [])}
        width={560}
        height={384}
      />

      {/* Legend */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-on-surface capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="absolute bottom-2 left-2 right-2 bg-surface p-2 rounded shadow text-xs">
          <strong className="capitalize">{selectedNode.type}:</strong> {selectedNode.label}
          {selectedNode.score && (
            <span className="ml-2 text-primary font-bold">
              Match: {Math.round(selectedNode.score * 100)}%
            </span>
          )}
          {selectedNode.reasoning?.explanation && (
            <p className="text-on-surface-variant mt-1">{selectedNode.reasoning.explanation}</p>
          )}
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-1 right-2 text-on-surface-variant"
          >✕</button>
        </div>
      )}
    </div>
  )
}
```

---

## 7. analyticsEngine.js — Utility Functions

Implementar todas estas funciones en `src/lib/analyticsEngine.js`:

```js
// [CC-005] analyticsEngine.js

/** Promedio de un array de números. Retorna 0 si vacío. */
export const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

/** Agrupa array de objetos por clave. */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})

/** Cuenta frecuencia de cada valor en array de strings. */
export const countFrequency = (arr) =>
  arr.reduce((acc, val) => {
    acc[val] = (acc[val] ?? 0) + 1
    return acc
  }, {})

/**
 * Trend semanal: compara última semana vs semana anterior.
 * Retorna 'up' | 'stable' | 'down'.
 */
export const weeklyTrend = (results, dateField) => {
  const now         = new Date()
  const oneWeekAgo  = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)

  const thisWeek = results.filter(r => new Date(r[dateField]) >= oneWeekAgo).length
  const lastWeek = results.filter(r => {
    const d = new Date(r[dateField])
    return d >= twoWeeksAgo && d < oneWeekAgo
  }).length

  if (thisWeek > lastWeek * 1.1) return 'up'
  if (thisWeek < lastWeek * 0.9) return 'down'
  return 'stable'
}

/** Etiqueta ISO week a partir de timestamp. Ej: "2026-W33". */
export const getISOWeekLabel = (dateStr) => {
  const d    = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const week  = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

---

## 8. Dependencias

| Package | Uso | Instalar |
|---------|-----|---------|
| `@supabase/supabase-js` | Ya instalado | — |
| `react-force-graph` | Knowledge Graph | `npm install react-force-graph` |
| `recharts` | Charts del dashboard | `npm install recharts` |

---

## 9. Archivos a Crear / Modificar

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `src/pages/ConsultantLogin.jsx` | Nuevo | Login con Supabase Auth |
| `src/pages/ConsultantDashboard.jsx` | Nuevo | Dashboard con 8 vistas analíticas + lista de sesiones |
| `src/pages/SessionDetail.jsx` | Nuevo | Detalle de sesión + Knowledge Graph |
| `src/components/KnowledgeGraph.jsx` | Nuevo | Grafo interactivo post-sesión |
| `src/components/ProtectedRoute.jsx` | Nuevo | Guard de rutas autenticadas |
| `src/lib/analyticsEngine.js` | Nuevo | Funciones helper para analytics |
| `src/App.jsx` | Modificar | Agregar 3 rutas (ver §3.3) |
| `src/lib/supabaseClient.js` | Modificar | Context/hook para consultant state |

**No se modifica:** `src/pages/Advisor.jsx` — el wizard SME no cambia en este CC.

---

## 10. Delivery Checklist para Antigravity

### Autenticación
- [ ] `/login` page funcional con Supabase Auth
- [ ] Session persistence al recargar app
- [ ] Logout button en navbar (solo visible en consultant mode)
- [ ] `ProtectedRoute` redirige a `/login` si no autenticado

### Dashboard (`/consultant/dashboard`)
- [ ] Tab "Overview" — 4 vistas correctas
  - [ ] View 1: Coverage by Sector (query con join anidado, colores por %)
  - [ ] View 2: Top Grants (bar chart + trend ↑/→/↓)
  - [ ] View 3: Resources Relevance (bar chart + tabla)
  - [ ] View 4: Unmet Needs (cards, sin N+1 queries)
- [ ] Tab "Opportunities" — 4 vistas correctas
  - [ ] View 5: Tags Without Coverage (tabla, ordenada por opportunity_score)
  - [ ] View 6: Potential New Grants (cards con impact % y ROI)
  - [ ] View 7: Temporal Trends (line chart, last 8 weeks)
  - [ ] View 8: Dimension Coverage (query via `question_tags` — NO `questions.trigger_tags`)
- [ ] Lista de sesiones completadas al final (tabla, click → detalle)
- [ ] Performance < 2s load time

### Detalle de Sesión (`/consultant/sessions/:id`)
- [ ] Summary: scores por dimensión, DML level, fecha
- [ ] Knowledge Graph renderiza con `ForceGraph2D` de `react-force-graph`
- [ ] Nodos coloreados por tipo con leyenda visible
- [ ] Edges con espesor proporcional a match_score
- [ ] Click en nodo muestra score + reasoning
- [ ] Tabla de match results (grants / providers / resources)
- [ ] Log de respuestas del SME (acordeón por dimensión)

### analyticsEngine.js
- [ ] `avg()`, `groupBy()`, `countFrequency()`, `weeklyTrend()`, `getISOWeekLabel()` implementadas y exportadas

### General
- [ ] Todos los bloques comentados con `// [CC-005]`
- [ ] Sin console errors
- [ ] Testeado con datos reales en Supabase staging

---

## 11. Lo que NO incluye CC-005

- Vista en tiempo real durante el wizard (el consultor no observa al SME en vivo)
- Modificación del wizard Advisor.jsx
- Email al SME — es CC-006
- PDF export — es Phase 3
- Admin panel para gestionar grants/questions — es Phase 3

---

## 12. Orden de Implementación Recomendado

1. `ProtectedRoute` + Rutas en App.jsx + `ConsultantLogin.jsx`
2. `analyticsEngine.js` (helpers base)
3. `ConsultantDashboard.jsx` Tab Overview (Views 1–4)
4. `ConsultantDashboard.jsx` Tab Opportunities (Views 5–8)
5. Lista de sesiones en dashboard
6. `KnowledgeGraph.jsx`
7. `SessionDetail.jsx` (layout completo con grafo + resultados + respuestas)

---

*CC-005 v2.0 — Eleven June Consulting para DPIRD / Antigravity — Agosto 2026*
