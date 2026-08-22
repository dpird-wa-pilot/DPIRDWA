# CC-007 — Session Detail: Knowledge Graph Implementation
**Versión:** 1.0  
**Fecha:** August 22, 2026  
**Preparado por:** Eleven June Consulting  
**Destinatario:** Antigravity Development Lead  
**Estado:** 🔴 PENDIENTE DE IMPLEMENTACIÓN  
**Prioridad:** ALTA  
**Prerequisito:** CC-006 (BUG-003 resuelto — sesiones deben estar marcadas `status = 'completed'`)  
**Reemplaza spec:** BUG-012 (SessionDetail page)

---

## 1. Objetivo

Reemplazar la especificación original de `SessionDetail.jsx` (BUG-012) con una visualización interactiva de **Knowledge Graph**. La nueva implementación muestra los resultados de una sesión completada en un canvas animado de tres paneles que permite al consultor explorar visualmente los grants, recursos y providers matcheados.

El resultado final debe ser **visualmente idéntico** al prototipo en:  
`https://claude.ai/code/artifact/89ad67fa-f579-48ea-9389-b9bbdb00ca59`

---

## 2. Alcance

| # | Elemento | Acción |
|---|----------|--------|
| 1 | `src/pages/SessionDetail.jsx` | Reemplazar completamente (o crear si no existe) |
| 2 | `src/styles/knowledge-graph.css` (nuevo) | Crear — tokens CSS + estilos del grafo |
| 3 | `src/App.jsx` | Verificar que la ruta `/consultant/sessions/:sessionId` está protegida |
| 4 | `src/lib/knowledgeGraph.js` (nuevo) | Crear — utilidades de transformación de datos |

**No modifica:** schema de base de datos, BFS matching engine, otras páginas del dashboard.

---

## 3. Arquitectura visual

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER — Business name · Sector · DML · Match score · Date            │
├───────────────────┬──────────────────────────────┬──────────────────────┤
│  LEFT PANEL       │  CENTER — CANVAS             │  RIGHT PANEL         │
│  220px            │  flex: 1                     │  290px               │
│                   │                              │                      │
│  ┌─ Match Overview│  [DOT GRID BACKGROUND]       │  ┌─ Recommendations  │
│  │  Gauge SVG     │                              │  │  Grant cards       │
│  │  7 results     │      biz ──── area           │  │  Resource cards    │
│  │                │       │       │              │  └─────────────────  │
│  ├─ Area Scores   │       └─── grant             │  ┌─ Detail View      │
│  │  Ops  62% ████ │            │                 │  │  Score 44px       │
│  │  Dig  48% ████ │           prov               │  │  Info rows        │
│  │  Mkt  55% ████ │                              │  │  Weights grid     │
│  │                │  [LEGEND STRIP]              │  │  Tags chips       │
│  └─ Gaps          │                              │  │  Reasoning        │
│     +3 grants     │                              │  └─ Action box       │
└───────────────────┴──────────────────────────────┴──────────────────────┘
```

**5 tipos de nodo en canvas:**

| Tipo | Visual | Datos |
|------|--------|-------|
| `biz` | Círculo verde con iniciales | Nombre del negocio |
| `area` | Círculo con arco de score | Operations / Digital / Market |
| `grant` | Círculo sólido con % | Grants matcheados |
| `resource` | Círculo dashed + diamond | Resources matcheados |
| `prov` | Círculo violeta tenue | Providers |

**4 tipos de edge:**

| Tipo | Estilo | Conexión |
|------|--------|----------|
| `ba` | Sólido | biz → area |
| `ag` | Dashed animado | area → grant |
| `ar` | Dashed animado | area → resource |
| `gp` | Violeta dashed animado | grant → provider |

---

## 4. Queries Supabase

Ejecutar en `loadSessionData(sessionId)`. Todas las queries corren en paralelo con `Promise.all`.

```javascript
// ── QUERY 1: Datos de la sesión + sector
const { data: sessionData, error: e1 } = await supabase
  .from('diagnostic_sessions')
  .select(`
    id,
    business_name,
    contact_name,
    location,
    dml_level,
    operations_score,
    digital_score,
    market_score,
    total_score,
    activated_tags,
    completed_at,
    created_at,
    sectors!sector_id (name, slug)
  `)
  .eq('id', sessionId)
  .single();

// ── QUERY 2: Match results de la sesión
const { data: matchData, error: e2 } = await supabase
  .from('match_results')
  .select(`
    id,
    result_type,
    result_id,
    result_name,
    match_score,
    matched_tags,
    reasoning_path,
    eligibility_met,
    eligibility_notes
  `)
  .eq('session_id', sessionId)
  .order('match_score', { ascending: false });

// ── QUERY 3: Mapa de tags (name → label)
const { data: tagsData, error: e3 } = await supabase
  .from('tags')
  .select('name, label, category');

// ── QUERY 4: Detalle de grants matcheados
// Extraer IDs de grants de matchData antes de ejecutar
const grantIds = matchData
  ?.filter(r => r.result_type === 'grant')
  .map(r => r.result_id) || [];

const { data: grantsDetail, error: e4 } = grantIds.length > 0
  ? await supabase
      .from('grants')
      .select(`
        id,
        name,
        slug,
        status,
        close_date,
        operations_weight,
        digital_weight,
        market_weight,
        contact_phone,
        contact_email,
        contact_url,
        application_channel,
        url
      `)
      .in('id', grantIds)
  : { data: [], error: null };

// ── QUERY 5: Detalle de resources matcheados
const resourceIds = matchData
  ?.filter(r => r.result_type === 'resource')
  .map(r => r.result_id) || [];

const { data: resourcesDetail, error: e5 } = resourceIds.length > 0
  ? await supabase
      .from('resources')
      .select(`
        id,
        title,
        resource_type,
        abstract,
        summary,
        library_url
      `)
      .in('id', resourceIds)
  : { data: [], error: null };

// ── QUERY 6: Detalle de providers matcheados
const providerIds = matchData
  ?.filter(r => r.result_type === 'provider')
  .map(r => r.result_id) || [];

const { data: providersDetail, error: e6 } = providerIds.length > 0
  ? await supabase
      .from('providers')
      .select(`
        id,
        name,
        slug,
        summary,
        email,
        phone,
        website,
        contact_name
      `)
      .in('id', providerIds)
  : { data: [], error: null };

// ── QUERY 7: Relación grant ↔ provider
const { data: grantProvidersData, error: e7 } = grantIds.length > 0
  ? await supabase
      .from('grant_providers')
      .select('grant_id, provider_id')
      .in('grant_id', grantIds)
  : { data: [], error: null };
```

> **Nota de error handling:** Si cualquier query falla, loguear el error y continuar con array vacío. El grafo debe renderizarse con datos parciales antes que romperse completamente.

---

## 5. Transformación de datos (`src/lib/knowledgeGraph.js`)

Crear este archivo con las siguientes funciones puras. Reciben los datos de Supabase y devuelven los objetos que consume el canvas.

```javascript
// ── src/lib/knowledgeGraph.js

/**
 * Construye el array AREAS a partir de los scores de la sesión.
 * Los ángulos son fijos — definen la posición radial de cada dimensión.
 */
export function buildAreas(session) {
  return [
    {
      id: 'a1',
      name: 'Operations',
      score: Math.round((session.operations_score || 0) * 100),
      color: '#fbbf24',          // amber
      angle: -100 * Math.PI / 180
    },
    {
      id: 'a2',
      name: 'Digital',
      score: Math.round((session.digital_score || 0) * 100),
      color: '#7dd3fc',          // sky
      angle: 30 * Math.PI / 180
    },
    {
      id: 'a3',
      name: 'Market',
      score: Math.round((session.market_score || 0) * 100),
      color: '#c084fc',          // violet
      angle: 150 * Math.PI / 180
    }
  ];
}

/**
 * Determina el área dominante de un grant por mayor peso.
 * Retorna 'a1' | 'a2' | 'a3'
 */
function dominantArea(grant) {
  const ops = grant.operations_weight || 0.35;
  const dig = grant.digital_weight    || 0.40;
  const mkt = grant.market_weight     || 0.25;
  if (ops >= dig && ops >= mkt) return 'a1';
  if (dig >= ops && dig >= mkt) return 'a2';
  return 'a3';
}

/**
 * Asigna ángulos a grants agrupados por área.
 * Distribuye los grants de cada área en un arco de ±35° alrededor del ángulo del área.
 */
function assignGrantAngles(grantList, areas) {
  const SPREAD = 70; // grados totales del arco por área
  const byArea = { a1: [], a2: [], a3: [] };
  grantList.forEach(g => byArea[dominantArea(g)].push(g));

  const areaAngles = { a1: -100, a2: 30, a3: 150 }; // grados

  const result = {};
  Object.entries(byArea).forEach(([aId, grants]) => {
    const base = areaAngles[aId];
    grants.forEach((g, i) => {
      const offset = grants.length > 1
        ? (i / (grants.length - 1) - 0.5) * SPREAD
        : 0;
      result[g.id] = (base + offset) * Math.PI / 180;
    });
  });
  return result;
}

/**
 * Asigna ángulos a resources agrupados por área.
 * Similar a grants pero con arco de ±25° para no superponerse.
 */
function assignResourceAngles(resourceList, areaAngles) {
  const SPREAD = 50;
  const byArea = { a1: [], a2: [], a3: [] };
  resourceList.forEach(r => byArea[r._areaId || 'a2'].push(r));

  const result = {};
  Object.entries(byArea).forEach(([aId, items]) => {
    const base = areaAngles[aId];
    items.forEach((r, i) => {
      const offset = items.length > 1
        ? (i / (items.length - 1) - 0.5) * SPREAD
        : 0;
      // Offset adicional para no colisionar con grants del mismo área
      result[r.id] = (base + offset + 25) * Math.PI / 180;
    });
  });
  return result;
}

/**
 * Formatea el status del grant para display.
 */
function formatGrantStatus(grant) {
  if (grant.status === 'open') return 'Open';
  if (grant.status === 'ongoing') return 'Ongoing';
  if (grant.status === 'coming_soon') return 'Coming Soon';
  if (grant.status === 'closed') {
    const year = grant.close_date
      ? new Date(grant.close_date).getFullYear()
      : null;
    return year ? `Closed — ${year}` : 'Closed';
  }
  return grant.status || 'Unknown';
}

/**
 * Genera un tag de display corto para el grant (primera palabra del nombre).
 */
function grantShortName(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length <= 4) return name;
  return words.slice(0, 4).join(' ');
}

/**
 * Genera abreviatura de provider (primeras letras de cada palabra, max 4 chars).
 */
function provAbbr(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(w => w.length > 2)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 4);
}

/**
 * Construye el array GRANTS a partir de match_results + grants detalle.
 * @param {Array} matchData - Filas de match_results con result_type='grant'
 * @param {Array} grantsDetail - Filas de la tabla grants
 * @param {Array} tagsData - Filas de tags para label mapping
 * @returns {Array} Array de objetos GRANT listos para el canvas
 */
export function buildGrants(matchData, grantsDetail, tagsData) {
  const tagsMap = {};
  (tagsData || []).forEach(t => { tagsMap[t.name] = t.label || t.name; });

  const grantMap = {};
  (grantsDetail || []).forEach(g => { grantMap[g.id] = g; });

  const grantMatches = (matchData || []).filter(r => r.result_type === 'grant');

  const grantObjects = grantMatches.map(mr => {
    const g = grantMap[mr.result_id] || {};
    return {
      id: mr.result_id,
      short: grantShortName(mr.result_name || g.name || ''),
      name: mr.result_name || g.name || '',
      match: Math.round((mr.match_score || 0) * 100),
      status: formatGrantStatus(g),
      tags: (mr.matched_tags || []).map(t => tagsMap[t] || t),
      weights: {
        ops: g.operations_weight || 0.35,
        dig: g.digital_weight    || 0.40,
        mkt: g.market_weight     || 0.25
      },
      reason: mr.eligibility_notes || 'Tag-based match via BFS traversal.',
      action: g.contact_url
        ? `Contact the administering body at: ${g.contact_url}`
        : g.application_channel
          ? `Apply via: ${g.application_channel}`
          : 'Contact DPIRD for application details.',
      url: g.url || null
    };
  });

  // Asignar ángulos
  const angles = assignGrantAngles(grantObjects.map(g => ({
    id: g.id,
    operations_weight: g.weights.ops,
    digital_weight: g.weights.dig,
    market_weight: g.weights.mkt
  })), null);

  return grantObjects.map(g => ({
    ...g,
    area: (() => {
      const w = g.weights;
      if (w.ops >= w.dig && w.ops >= w.mkt) return 'a1';
      if (w.dig >= w.ops && w.dig >= w.mkt) return 'a2';
      return 'a3';
    })(),
    angle: angles[g.id] || 0
  }));
}

/**
 * Construye el array RESOURCES a partir de match_results + resources detalle.
 */
export function buildResources(matchData, resourcesDetail, tagsData) {
  const tagsMap = {};
  (tagsData || []).forEach(t => { tagsMap[t.name] = t.label || t.name; });

  const resMap = {};
  (resourcesDetail || []).forEach(r => { resMap[r.id] = r; });

  const resourceMatches = (matchData || []).filter(r => r.result_type === 'resource');

  const AREA_ANGLES = { a1: -100, a2: 30, a3: 150 };
  const SPREAD = 50;

  const objects = resourceMatches.map((mr, i) => {
    const r = resMap[mr.result_id] || {};
    // Asignar área por tags — si matched_tags tiene 'digital' → a2, etc.
    const tags = mr.matched_tags || [];
    let areaId = 'a2';  // default: Digital
    if (tags.some(t => ['supply_chain','quality_control','compliance','process_automation'].includes(t))) areaId = 'a1';
    if (tags.some(t => ['export','import','b2b_sales','marketing_digital','brand_development'].includes(t))) areaId = 'a3';

    return {
      id: mr.result_id,
      short: (r.title || mr.result_name || '').split(' ').slice(0, 5).join(' '),
      name: r.title || mr.result_name || '',
      match: Math.round((mr.match_score || 0) * 100),
      type: formatResourceType(r.resource_type),
      tags: tags.map(t => tagsMap[t] || t),
      desc: r.summary || r.abstract || 'DPIRD library resource.',
      url: r.library_url || null,
      _areaId: areaId
    };
  });

  // Asignar ángulos
  const byArea = { a1: [], a2: [], a3: [] };
  objects.forEach(r => byArea[r._areaId].push(r));
  objects.forEach(r => {
    const group = byArea[r._areaId];
    const base = AREA_ANGLES[r._areaId] || 30;
    const i = group.indexOf(r);
    const offset = group.length > 1
      ? (i / (group.length - 1) - 0.5) * SPREAD
      : 0;
    r.angle = (base + offset + 25) * Math.PI / 180;
  });

  return objects;
}

function formatResourceType(type) {
  if (!type) return 'Resource';
  const map = {
    book_chapter: 'Book Chapter',
    journal_article: 'Journal Article',
    research_report: 'Research Report'
  };
  return map[type] || type;
}

/**
 * Construye el array PROVS a partir de match_results + providers detalle + grant_providers.
 * @param {Array} matchData - Filas de match_results
 * @param {Array} providersDetail - Filas de la tabla providers
 * @param {Array} grantProvidersData - Filas de grant_providers
 * @param {Array} grants - El array GRANTS ya construido (con angles)
 */
export function buildProviders(matchData, providersDetail, grantProvidersData, grants) {
  const provMap = {};
  (providersDetail || []).forEach(p => { provMap[p.id] = p; });

  // Construir mapa grant → providers
  const grantToProvs = {};
  (grantProvidersData || []).forEach(gp => {
    if (!grantToProvs[gp.grant_id]) grantToProvs[gp.grant_id] = [];
    grantToProvs[gp.grant_id].push(gp.provider_id);
  });

  // Construir mapa provider → grants (inverso)
  const provToGrants = {};
  Object.entries(grantToProvs).forEach(([grantId, provIds]) => {
    provIds.forEach(pid => {
      if (!provToGrants[pid]) provToGrants[pid] = [];
      provToGrants[pid].push(grantId);
    });
  });

  // Providers matcheados desde match_results (result_type = 'provider')
  const providerMatches = (matchData || []).filter(r => r.result_type === 'provider');

  // Si no hay providers en match_results, inferir desde grant_providers
  let providerIds = providerMatches.map(r => r.result_id);
  if (providerIds.length === 0) {
    // Usar providers vinculados a grants matcheados
    const matchedGrantIds = new Set(
      (matchData || []).filter(r => r.result_type === 'grant').map(r => r.result_id)
    );
    const inferredProvIds = new Set();
    matchedGrantIds.forEach(gid => {
      (grantToProvs[gid] || []).forEach(pid => inferredProvIds.add(pid));
    });
    providerIds = [...inferredProvIds];
  }

  // Construir array de grants para lookup de ángulos
  const grantAngleMap = {};
  (grants || []).forEach(g => { grantAngleMap[g.id] = g.angle; });

  return providerIds.map(pid => {
    const p = provMap[pid] || {};
    const linkedGrants = provToGrants[pid] || [];

    return {
      id: pid,
      name: p.name || 'Unknown Provider',
      abbr: provAbbr(p.name || ''),
      grants: linkedGrants,
      email: p.email,
      phone: p.phone,
      website: p.website,
      contactName: p.contact_name
    };
  });
}

/**
 * Calcula los "Improvement Areas" (gaps) a partir de los scores de la sesión.
 * Lógica: si un área está bajo umbral, es un gap con impacto estimado.
 */
export function buildGaps(session, grants) {
  const gaps = [];
  const opsScore  = Math.round((session.operations_score || 0) * 100);
  const digScore  = Math.round((session.digital_score    || 0) * 100);
  const mktScore  = Math.round((session.market_score     || 0) * 100);

  // Contar grants no alcanzados por área (match_score < 0.60 o sin match)
  // Para simplificar: contar grants en cada área con match < 70%
  const lowOps = (grants || []).filter(g => g.area === 'a1' && g.match < 70).length;
  const lowDig = (grants || []).filter(g => g.area === 'a2' && g.match < 70).length;
  const lowMkt = (grants || []).filter(g => g.area === 'a3' && g.match < 70).length;

  if (digScore < 60) {
    gaps.push({
      name: 'Digital Adoption',
      reason: `Digital score ${digScore}% — 60% threshold for premium programs`,
      impact: lowDig > 0 ? `+${lowDig} grants` : '+grants'
    });
  }
  if (mktScore < 65) {
    gaps.push({
      name: 'Market Profiling',
      reason: `Market score ${mktScore}% — export and market tags incomplete`,
      impact: lowMkt > 0 ? `+${lowMkt} grants` : '+grants'
    });
  }
  if (opsScore < 70) {
    gaps.push({
      name: 'Operations Readiness',
      reason: `Operations score ${opsScore}% — supply chain or compliance gap`,
      impact: lowOps > 0 ? `+${lowOps} grants` : '+grants'
    });
  }

  // Siempre mostrar al menos un gap si todos están por encima de umbral
  if (gaps.length === 0) {
    gaps.push({
      name: 'Environmental Certification',
      reason: 'Organic or ISO certification not documented on record',
      impact: '+2 grants'
    });
  }

  return gaps.slice(0, 3); // máximo 3 gaps en el panel
}

/**
 * Calcula el score overall de la sesión para el gauge.
 * Usa total_score de la sesión o recalcula.
 */
export function overallScore(session) {
  if (session.total_score !== null && session.total_score !== undefined) {
    return Math.round(session.total_score * 100);
  }
  const ops = (session.operations_score || 0) * 0.35;
  const dig = (session.digital_score    || 0) * 0.40;
  const mkt = (session.market_score     || 0) * 0.25;
  return Math.round((ops + dig + mkt) * 100);
}

/**
 * Formatea la fecha para el header chip.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formatea el DML level para display.
 */
export function formatDmlLevel(level) {
  const map = {
    foundational: 'Foundational',
    emerging: 'Emerging',
    established: 'Established',
    advanced: 'Advanced'
  };
  return map[level] || level || 'Unknown';
}
```

---

## 6. Archivo CSS global — `src/styles/knowledge-graph.css`

Agregar al `src/index.css` (o importar desde `SessionDetail.jsx`) antes que cualquier regla de componente. Estos tokens CSS son leídos en tiempo de ejecución por el canvas con `getComputedStyle`.

```css
/* ── KNOWLEDGE GRAPH TOKENS (dark-first) ─────────── */
:root {
  --kg-bg:        #0c1410;
  --kg-surface:   #131b16;
  --kg-surf2:     #1b2620;
  --kg-surf3:     #253229;
  --kg-border:    #2c3e33;
  --kg-bord2:     #3c5244;
  --kg-text:      #d0e4d5;
  --kg-text2:     #8aaa90;
  --kg-text3:     #536a59;
  --kg-green:     #4ade80;
  --kg-green-bg:  #0e2a18;
  --kg-green-bd:  #1a4a2a;
  --kg-amber:     #fbbf24;
  --kg-amber-bg:  #2a1c06;
  --kg-amber-bd:  #6b4208;
  --kg-rose:      #fb7185;
  --kg-rose-bg:   #280c10;
  --kg-rose-bd:   #7a1c24;
  --kg-violet:    #c084fc;
  --kg-violet-bg: #1e1030;
  --kg-violet-bd: #5b28a0;
  --kg-sky:       #7dd3fc;
  --kg-sky-bg:    #061e30;
  --kg-sky-bd:    #0c4870;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --kg-bg:        #edf5ef;
    --kg-surface:   #ffffff;
    --kg-surf2:     #f3faf4;
    --kg-surf3:     #e8f2ea;
    --kg-border:    #ccddd2;
    --kg-bord2:     #aeccb6;
    --kg-text:      #182c1e;
    --kg-text2:     #4c7258;
    --kg-text3:     #7e9e88;
    --kg-green-bg:  #e4f9eb;
    --kg-green-bd:  #b0e4c2;
    --kg-amber-bg:  #fefae6;
    --kg-amber-bd:  #f8d48a;
    --kg-rose-bg:   #fee6ea;
    --kg-rose-bd:   #f9bcc6;
    --kg-violet-bg: #f4ecff;
    --kg-violet-bd: #d8b0fc;
    --kg-sky-bg:    #e6f5fe;
    --kg-sky-bd:    #b0dcf8;
  }
}
:root[data-theme="dark"] {
  --kg-bg:#0c1410; --kg-surface:#131b16; --kg-surf2:#1b2620; --kg-surf3:#253229;
  --kg-border:#2c3e33; --kg-bord2:#3c5244; --kg-text:#d0e4d5; --kg-text2:#8aaa90;
  --kg-text3:#536a59; --kg-green:#4ade80; --kg-green-bg:#0e2a18; --kg-green-bd:#1a4a2a;
  --kg-amber:#fbbf24; --kg-amber-bg:#2a1c06; --kg-amber-bd:#6b4208;
  --kg-rose:#fb7185; --kg-rose-bg:#280c10; --kg-rose-bd:#7a1c24;
  --kg-violet:#c084fc; --kg-violet-bg:#1e1030; --kg-violet-bd:#5b28a0;
  --kg-sky:#7dd3fc; --kg-sky-bg:#061e30; --kg-sky-bd:#0c4870;
}
:root[data-theme="light"] {
  --kg-bg:#edf5ef; --kg-surface:#ffffff; --kg-surf2:#f3faf4; --kg-surf3:#e8f2ea;
  --kg-border:#ccddd2; --kg-bord2:#aeccb6; --kg-text:#182c1e; --kg-text2:#4c7258;
  --kg-text3:#7e9e88; --kg-green-bg:#e4f9eb; --kg-green-bd:#b0e4c2;
  --kg-amber-bg:#fefae6; --kg-amber-bd:#f8d48a; --kg-rose-bg:#fee6ea; --kg-rose-bd:#f9bcc6;
  --kg-violet-bg:#f4ecff; --kg-violet-bd:#d8b0fc; --kg-sky-bg:#e6f5fe; --kg-sky-bd:#b0dcf8;
}

/* ── FUENTES ─────────────────────────────────────── */
/* Agregar al <head> del index.html: */
/*
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
*/

/* ── LAYOUT ──────────────────────────────────────── */
.kg-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--kg-bg);
  color: var(--kg-text);
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

/* Header */
.kg-hdr {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 18px;
  height: 52px;
  border-bottom: 1px solid var(--kg-border);
  background: var(--kg-surface);
  flex-shrink: 0;
}
.kg-hdr-mark {
  width: 30px; height: 30px;
  background: var(--kg-green);
  border-radius: 4px;
  display: grid; place-items: center;
  font-family: 'Libre Franklin', sans-serif;
  font-weight: 700; font-size: 10px;
  color: #0c1410;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.kg-hdr-biz { flex: 1; min-width: 0; }
.kg-hdr-name {
  font-family: 'Libre Franklin', sans-serif;
  font-weight: 600; font-size: 14px;
  color: var(--kg-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kg-hdr-sub { font-size: 11px; color: var(--kg-text2); margin-top: 1px; }
.kg-chips { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.kg-chip {
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 500;
  white-space: nowrap; border: 1px solid;
  font-variant-numeric: tabular-nums;
}
.kg-chip-amber { color: var(--kg-amber); background: var(--kg-amber-bg); border-color: var(--kg-amber-bd); }
.kg-chip-green { color: var(--kg-green); background: var(--kg-green-bg); border-color: var(--kg-green-bd); }
.kg-chip-muted { color: var(--kg-text2); background: var(--kg-surf2); border-color: var(--kg-border); }

/* Back button */
.kg-back-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--kg-sky);
  background: none; border: none; cursor: pointer;
  padding: 4px 8px; border-radius: 4px;
  font-family: 'DM Sans', sans-serif;
  transition: background 0.12s;
  text-decoration: none;
}
.kg-back-btn:hover { background: var(--kg-sky-bg); }

/* Main 3-panel */
.kg-main { flex: 1; display: flex; overflow: hidden; }

/* Left panel */
.kg-pnl-l {
  width: 220px; flex-shrink: 0;
  border-right: 1px solid var(--kg-border);
  overflow-y: auto; background: var(--kg-surface);
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px 12px;
}
.kg-pnl-l::-webkit-scrollbar { width: 3px; }
.kg-pnl-l::-webkit-scrollbar-thumb { background: var(--kg-border); border-radius: 2px; }

/* Center panel */
.kg-pnl-c {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.kg-canvas { display: block; width: 100%; flex: 1; outline: none; }

/* Right panel */
.kg-pnl-r {
  width: 290px; flex-shrink: 0;
  border-left: 1px solid var(--kg-border);
  overflow-y: auto; background: var(--kg-surface);
  display: flex; flex-direction: column;
}
.kg-pnl-r::-webkit-scrollbar { width: 3px; }
.kg-pnl-r::-webkit-scrollbar-thumb { background: var(--kg-border); border-radius: 2px; }

/* Cards */
.kg-card {
  background: var(--kg-surf2);
  border: 1px solid var(--kg-border);
  border-radius: 8px;
  padding: 14px 12px;
}
.kg-sec-lbl {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--kg-text3); margin-bottom: 10px;
}

/* Legend */
.kg-legend {
  display: flex; justify-content: center;
  flex-wrap: wrap; gap: 6px 16px;
  padding: 6px 16px;
  border-top: 1px solid var(--kg-border);
  background: var(--kg-surface); flex-shrink: 0;
}
.kg-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--kg-text2); }
.kg-leg-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.kg-leg-dash { width: 14px; height: 0; border-top: 1.5px dashed var(--kg-violet); flex-shrink: 0; }
.kg-leg-dot-dashed { width: 8px; height: 8px; border-radius: 50%; border: 1.5px dashed var(--kg-amber); flex-shrink: 0; }

/* Gauge */
.kg-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.kg-gauge-track { fill: none; stroke: var(--kg-surf3); stroke-width: 7; }
.kg-gauge-fill  {
  fill: none; stroke-width: 7; stroke-linecap: round;
  stroke: var(--kg-amber);
  stroke-dasharray: 0 238.76;
  transform-origin: 50px 50px;
  transform: rotate(-90deg);
  transition: stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Area score bars */
.kg-area-row { padding: 7px 0; border-bottom: 1px solid var(--kg-border); }
.kg-area-row:last-child { border-bottom: none; }
.kg-area-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
.kg-area-name { font-weight: 500; font-size: 12px; color: var(--kg-text); }
.kg-area-pct { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-variant-numeric: tabular-nums; }
.kg-bar-track { height: 3px; border-radius: 2px; background: var(--kg-surf3); overflow: hidden; }
.kg-bar-fill  { height: 100%; border-radius: 2px; transition: width 1.2s cubic-bezier(.4,0,.2,1); }

/* Gaps */
.kg-gap-row { padding: 8px 0; border-bottom: 1px solid var(--kg-border); }
.kg-gap-row:last-child { border-bottom: none; }
.kg-gap-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
.kg-gap-name { font-weight: 500; font-size: 12px; color: var(--kg-text); }
.kg-gap-impact { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--kg-amber); }
.kg-gap-reason { font-size: 10px; color: var(--kg-text3); line-height: 1.5; }

/* Right panel - result cards */
.kg-r-hdr {
  display: flex; align-items: center; gap: 6px;
  padding: 13px 14px;
  border-bottom: 1px solid var(--kg-border);
  flex-shrink: 0;
}
.kg-r-title {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--kg-text2);
}
.kg-r-list { padding: 10px; display: flex; flex-direction: column; gap: 4px; }
.kg-r-sec {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--kg-text3); padding: 8px 0 4px;
}
.kg-r-card {
  border: 1px solid var(--kg-border);
  border-radius: 8px; padding: 11px;
  cursor: pointer; background: var(--kg-surf2);
  transition: border-color 0.12s, background 0.12s;
}
.kg-r-card:hover { border-color: var(--kg-sky-bd); background: var(--kg-surf3); }
.kg-r-card.kg-sel { border-color: var(--kg-sky); background: var(--kg-sky-bg); }
.kg-rc-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 5px; }
.kg-rc-name { font-weight: 500; font-size: 12px; color: var(--kg-text); line-height: 1.35; }
.kg-rc-pct { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 500; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.kg-rc-bar-wrap { height: 3px; background: var(--kg-surf3); border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
.kg-rc-bar { height: 100%; border-radius: 2px; width: 0; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }
.kg-rc-meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
.kg-rc-area { color: var(--kg-text2); }
.kg-hint { padding: 10px 14px; font-size: 11px; color: var(--kg-text3); text-align: center; }

/* Detail view */
.kg-detail { padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.kg-d-score-row { display: flex; align-items: baseline; gap: 8px; }
.kg-d-score {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 44px; font-weight: 500;
  line-height: 1; font-variant-numeric: tabular-nums;
}
.kg-d-score-lbl { font-size: 12px; color: var(--kg-text2); }
.kg-d-blk-title {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--kg-text3); margin-bottom: 8px;
}
.kg-d-row {
  display: flex; justify-content: space-between;
  padding: 5px 0; border-bottom: 1px solid var(--kg-border);
  font-size: 12px; gap: 8px;
}
.kg-d-row:last-child { border-bottom: none; }
.kg-d-row-k { color: var(--kg-text2); flex-shrink: 0; }
.kg-d-row-v { font-weight: 500; text-align: right; }
.kg-tags-row { display: flex; flex-wrap: wrap; gap: 5px; }
.kg-t-chip {
  padding: 3px 8px; border-radius: 3px;
  font-size: 10px; font-weight: 500;
  background: var(--kg-green-bg);
  color: var(--kg-green);
  border: 1px solid var(--kg-green-bd);
}
.kg-reasoning { font-size: 12px; color: var(--kg-text2); line-height: 1.7; }
.kg-wt-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 5px; margin-top: 2px; }
.kg-wt-cell { background: var(--kg-surf2); border: 1px solid var(--kg-border); border-radius: 5px; padding: 6px 4px; text-align: center; }
.kg-wt-lbl { font-size: 9px; color: var(--kg-text3); margin-bottom: 2px; }
.kg-wt-val { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 500; }
.kg-wt-bar-wrap { margin-top: 4px; }
.kg-wt-bar-lbl { display: flex; justify-content: space-between; font-size: 10px; color: var(--kg-text3); margin-bottom: 3px; }
.kg-wt-bar-track { height: 4px; border-radius: 2px; background: var(--kg-surf3); overflow: hidden; }
.kg-wt-bar-fill  { height: 100%; border-radius: 2px; }
.kg-action-box {
  background: var(--kg-sky-bg);
  border: 1px solid var(--kg-sky-bd);
  border-radius: 8px; padding: 12px;
}
.kg-action-title {
  font-family: 'Libre Franklin', sans-serif;
  font-size: 10px; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--kg-sky); margin-bottom: 6px;
}
.kg-action-text { font-size: 12px; color: var(--kg-text); line-height: 1.65; }

/* Tooltip */
.kg-tt {
  position: fixed; z-index: 999;
  background: var(--kg-surf3);
  border: 1px solid var(--kg-bord2);
  border-radius: 6px; padding: 8px 12px;
  pointer-events: none; opacity: 0;
  transition: opacity 0.12s;
  max-width: 220px; min-width: 130px;
}
.kg-tt.kg-tt-v { opacity: 1; }
.kg-tt-n { font-weight: 500; font-size: 12px; color: var(--kg-text); margin-bottom: 2px; }
.kg-tt-s { font-size: 11px; color: var(--kg-text2); }

@media (prefers-reduced-motion: reduce) {
  .kg-bar-fill, .kg-rc-bar, .kg-gauge-fill { transition: none !important; }
}
```

---

## 7. Componente React — `src/pages/SessionDetail.jsx`

La implementación completa. Copiar exactamente.

```jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  buildAreas, buildGrants, buildResources, buildProviders, buildGaps,
  overallScore, formatDate, formatDmlLevel
} from '../lib/knowledgeGraph';
import '../styles/knowledge-graph.css';

// ── CANVAS UTILITIES ──────────────────────────────────────────────────────

function hexToRgba(hex, a) {
  hex = (hex || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function tok(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function matchColor(pct) {
  if (pct > 80) return tok('--kg-green') || '#4ade80';
  if (pct >= 60) return tok('--kg-amber') || '#fbbf24';
  return tok('--kg-rose') || '#fb7185';
}

function circularMean(angles) {
  const sinS = angles.reduce((s, a) => s + Math.sin(a), 0) / angles.length;
  const cosS = angles.reduce((s, a) => s + Math.cos(a), 0) / angles.length;
  return Math.atan2(sinS, cosS);
}

function radialLabel(nd, CX, CY, offsetDist) {
  const dx = nd.x - CX, dy = nd.y - CY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const lx = nd.x + ux * offsetDist;
  const ly = nd.y + uy * offsetDist;
  return {
    lx, ly,
    align: ux > 0.4 ? 'left' : ux < -0.4 ? 'right' : 'center',
    base: uy > 0.55 ? 'top' : uy < -0.55 ? 'bottom' : 'middle'
  };
}

// ── CANVAS GRAPH BUILDER ──────────────────────────────────────────────────

function buildGraphNodes(canvas, AREAS, GRANTS, RESOURCES, PROVS) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  const CX = W * 0.5;
  const CY = H * 0.5;
  const sz = Math.min(W, H);
  const AR = sz * 0.115;
  const GR = sz * 0.250;
  const PR = sz * 0.375;

  const nodes = [];
  const edges = [];

  // Business center
  nodes.push({ id: 'biz', type: 'biz', x: CX, y: CY, r: 28, angle: 0 });

  // Area nodes
  AREAS.forEach(a => {
    nodes.push({
      id: a.id, type: 'area',
      x: CX + AR * Math.cos(a.angle),
      y: CY + AR * Math.sin(a.angle),
      r: 16, angle: a.angle, ad: a
    });
    edges.push({ a: 'biz', b: a.id, kind: 'ba', color: a.color });
  });

  // Grant nodes
  GRANTS.forEach(g => {
    nodes.push({
      id: g.id, type: 'grant',
      x: CX + GR * Math.cos(g.angle),
      y: CY + GR * Math.sin(g.angle),
      r: 22, angle: g.angle, gd: g
    });
    const aColor = AREAS.find(a => a.id === g.area)?.color || '#4ade80';
    edges.push({ a: g.area, b: g.id, kind: 'ag', color: aColor });
  });

  // Resource nodes
  RESOURCES.forEach(r => {
    nodes.push({
      id: r.id, type: 'resource',
      x: CX + GR * Math.cos(r.angle),
      y: CY + GR * Math.sin(r.angle),
      r: 15, angle: r.angle, rd: r
    });
    const aColor = AREAS.find(a => a.id === r._areaId)?.color || '#fbbf24';
    edges.push({ a: r._areaId || 'a2', b: r.id, kind: 'ar', color: aColor });
  });

  // Provider nodes
  PROVS.forEach(p => {
    const allItems = [...GRANTS, ...RESOURCES];
    const gAngles = p.grants
      .map(gid => allItems.find(x => x.id === gid)?.angle || 0);
    const angle = gAngles.length > 0 ? circularMean(gAngles) : 0;
    nodes.push({
      id: p.id, type: 'prov',
      x: CX + PR * Math.cos(angle),
      y: CY + PR * Math.sin(angle),
      r: 14, angle, pd: p
    });
    p.grants.forEach(gid => edges.push({ a: gid, b: p.id, kind: 'gp' }));
  });

  return { nodes, edges, CX, CY };
}

// ── CANVAS DRAW FUNCTION ──────────────────────────────────────────────────

function drawScene(canvas, ctx, ts, nodes, edges, CX, CY, hovN, selId, bizLabel) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, W * (window.devicePixelRatio || 1), H * (window.devicePixelRatio || 1));
  ctx.save();
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  // Background
  const bgC = tok('--kg-bg') || '#0c1410';
  ctx.fillStyle = bgC;
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = hexToRgba(tok('--kg-border') || '#2c3e33', 0.4);
  for (let x = 36; x < W; x += 36)
    for (let y = 36; y < H; y += 36) {
      ctx.beginPath(); ctx.arc(x, y, 0.75, 0, Math.PI * 2); ctx.fill();
    }

  // Radial vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.68);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, hexToRgba(bgC, 0.6));
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── Edges
  for (const e of edges) {
    const A = nodes.find(nd => nd.id === e.a);
    const B = nodes.find(nd => nd.id === e.b);
    if (!A || !B) continue;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d < 1) continue;
    const arA = A.r + 4, arB = B.r + 4;
    const sx = A.x + (dx / d) * arA, sy = A.y + (dy / d) * arA;
    const ex = B.x - (dx / d) * arB, ey = B.y - (dy / d) * arB;
    const isSel = selId && (e.a === selId || e.b === selId);
    let defA, selA;
    if (e.kind === 'ba')                   { defA = 0.55; selA = 0.9; }
    else if (e.kind === 'ag' || e.kind === 'ar') { defA = 0.40; selA = 0.85; }
    else                                   { defA = 0.30; selA = 0.75; }
    const alpha = selId ? (isSel ? selA : 0.05) : defA;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    if (e.kind === 'ba') {
      ctx.strokeStyle = e.color; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    } else if (e.kind === 'ag' || e.kind === 'ar') {
      ctx.strokeStyle = e.color; ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -(ts * 0.008) % 8;
    } else {
      ctx.strokeStyle = tok('--kg-violet') || '#c084fc';
      ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -(ts * 0.016) % 8;
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  // ── Nodes
  for (const nd of nodes) {
    const hov = hovN === nd.id, sel = selId === nd.id;
    const pulse = sel ? 1 + Math.sin(ts * 0.0038) * 0.028 : 1;
    const r = nd.r * pulse;
    ctx.save();

    if (nd.type === 'biz') {
      const gc = tok('--kg-green') || '#4ade80';
      if (hov || sel) { ctx.shadowBlur = 14; ctx.shadowColor = gc; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(gc, 0.08); ctx.fill();
      ctx.strokeStyle = hexToRgba(gc, sel || hov ? 0.9 : 0.5);
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = gc;
      ctx.font = 'bold 9px "Libre Franklin", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // Iniciales del negocio (ej: "GOW" para Greenfields Organics WA)
      ctx.fillText(bizLabel.abbr, nd.x, nd.y - 4);
      ctx.fillStyle = tok('--kg-text2') || '#8aaa90';
      ctx.font = '8px "DM Sans", sans-serif';
      ctx.fillText(bizLabel.short, nd.x, nd.y + 6);

    } else if (nd.type === 'area') {
      const a = nd.ad;
      if (hov) { ctx.shadowBlur = 12; ctx.shadowColor = a.color; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(a.color, 0.12); ctx.fill();
      ctx.strokeStyle = hexToRgba(a.color, hov ? 0.9 : 0.6);
      ctx.lineWidth = 2; ctx.stroke();
      // Score arc
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r + 5, -Math.PI / 2, -Math.PI / 2 + (a.score / 100) * Math.PI * 2);
      ctx.strokeStyle = a.color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = a.color;
      ctx.font = 'bold 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.score + '%', nd.x, nd.y);
      // Label
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 14);
      ctx.fillStyle = a.color;
      ctx.font = 'bold 10px "Libre Franklin", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      ctx.fillText(a.name, lx, ly);

    } else if (nd.type === 'grant') {
      const g = nd.gd;
      const c = matchColor(g.match);
      if (hov || sel) { ctx.shadowBlur = 12; ctx.shadowColor = c; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(c, 0.1); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = hov || sel ? 2.5 : 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.fillStyle = c;
      ctx.font = 'bold 8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.match + '%', nd.x, nd.y);
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 9);
      ctx.fillStyle = hov || sel ? tok('--kg-text') || '#d0e4d5' : tok('--kg-text2') || '#8aaa90';
      ctx.font = (hov || sel ? '500 ' : '') + '9px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      const words = g.short.split(' ');
      if (words.length <= 2) { ctx.fillText(g.short, lx, ly); }
      else {
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), lx, ly - 5);
        ctx.fillText(words.slice(mid).join(' '), lx, ly + 5);
      }

    } else if (nd.type === 'resource') {
      const res = nd.rd;
      if (hov || sel) { ctx.shadowBlur = 10; ctx.shadowColor = tok('--kg-amber') || '#fbbf24'; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(tok('--kg-amber') || '#fbbf24', 0.08); ctx.fill();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = tok('--kg-amber') || '#fbbf24';
      ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(nd.x, nd.y); ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.rect(-4, -4, 8, 8);
      ctx.fillStyle = tok('--kg-amber') || '#fbbf24'; ctx.fill();
      ctx.restore();
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 9);
      ctx.fillStyle = hov || sel ? tok('--kg-amber') || '#fbbf24' : tok('--kg-text2') || '#8aaa90';
      ctx.font = '9px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      const words = res.short.split(' ');
      if (words.length <= 2) { ctx.fillText(res.short, lx, ly); }
      else {
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), lx, ly - 5);
        ctx.fillText(words.slice(mid).join(' '), lx, ly + 5);
      }

    } else if (nd.type === 'prov') {
      const p = nd.pd;
      if (hov) { ctx.shadowBlur = 10; ctx.shadowColor = tok('--kg-violet') || '#c084fc'; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(tok('--kg-violet') || '#c084fc', 0.1); ctx.fill();
      ctx.strokeStyle = hexToRgba(tok('--kg-violet') || '#c084fc', hov ? 0.9 : 0.45);
      ctx.lineWidth = 1.5; ctx.stroke();
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 7);
      ctx.fillStyle = tok('--kg-text3') || '#536a59';
      ctx.font = '8px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      ctx.fillText(p.abbr, lx, ly);
    }
    ctx.restore();
  }
  ctx.restore();
}

// ── BIZ LABEL HELPER ──────────────────────────────────────────────────────

function bizLabelFromName(name) {
  if (!name) return { abbr: '?', short: '' };
  const words = name.trim().split(/\s+/);
  const abbr = words
    .filter(w => w.length > 2)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 3);
  const short = words[0].slice(0, 8);
  return { abbr: abbr || '?', short };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function SessionDetail() {
  const { sessionId } = useParams();
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const nodesRef  = useRef([]);
  const edgesRef  = useRef([]);
  const CXRef     = useRef(0);
  const CYRef     = useRef(0);
  const hovNRef   = useRef(null);
  const selIdRef  = useRef(null);
  const tooltipRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Graph data
  const [session,   setSession]   = useState(null);
  const [AREAS,     setAREAS]     = useState([]);
  const [GRANTS,    setGRANTS]    = useState([]);
  const [RESOURCES, setRESOURCES] = useState([]);
  const [PROVS,     setPROVS]     = useState([]);
  const [GAPS,      setGAPS]      = useState([]);
  const [overall,   setOverall]   = useState(0);

  // UI state
  const [selId, setSelId]       = useState(null);
  const [selKind, setSelKind]   = useState(null); // 'grant' | 'resource'
  const [gaugeAnim, setGaugeAnim] = useState(false);

  // ── DATA LOADING
  useEffect(() => {
    if (!sessionId) return;
    loadSessionData(sessionId);
  }, [sessionId]);

  async function loadSessionData(sId) {
    setLoading(true);
    try {
      // ── Query 1: Sesión
      const { data: sessionData, error: e1 } = await supabase
        .from('diagnostic_sessions')
        .select('id, business_name, contact_name, location, dml_level, operations_score, digital_score, market_score, total_score, activated_tags, completed_at, created_at, sectors!sector_id(name, slug)')
        .eq('id', sId)
        .single();
      if (e1) throw e1;

      // ── Query 2: Match results
      const { data: matchData = [] } = await supabase
        .from('match_results')
        .select('id, result_type, result_id, result_name, match_score, matched_tags, reasoning_path, eligibility_met, eligibility_notes')
        .eq('session_id', sId)
        .order('match_score', { ascending: false });

      // ── Query 3: Tags map
      const { data: tagsData = [] } = await supabase
        .from('tags')
        .select('name, label, category');

      // ── Queries 4-7: Details (en paralelo)
      const grantIds    = (matchData || []).filter(r => r.result_type === 'grant').map(r => r.result_id);
      const resourceIds = (matchData || []).filter(r => r.result_type === 'resource').map(r => r.result_id);
      const providerIds = (matchData || []).filter(r => r.result_type === 'provider').map(r => r.result_id);

      const [grantsRes, resourcesRes, providersRes, gpRes] = await Promise.all([
        grantIds.length > 0
          ? supabase.from('grants').select('id, name, slug, status, close_date, operations_weight, digital_weight, market_weight, contact_url, application_channel, url').in('id', grantIds)
          : Promise.resolve({ data: [] }),
        resourceIds.length > 0
          ? supabase.from('resources').select('id, title, resource_type, abstract, summary, library_url').in('id', resourceIds)
          : Promise.resolve({ data: [] }),
        providerIds.length > 0
          ? supabase.from('providers').select('id, name, slug, summary, email, phone, website, contact_name').in('id', providerIds)
          : Promise.resolve({ data: [] }),
        grantIds.length > 0
          ? supabase.from('grant_providers').select('grant_id, provider_id').in('grant_id', grantIds)
          : Promise.resolve({ data: [] })
      ]);

      // ── Transform
      const areas     = buildAreas(sessionData);
      const grants    = buildGrants(matchData, grantsRes.data, tagsData);
      const resources = buildResources(matchData, resourcesRes.data, tagsData);
      const provs     = buildProviders(matchData, providersRes.data, gpRes.data, grants);
      const gaps      = buildGaps(sessionData, grants);
      const score     = overallScore(sessionData);

      setSession(sessionData);
      setAREAS(areas);
      setGRANTS(grants);
      setRESOURCES(resources);
      setPROVS(provs);
      setGAPS(gaps);
      setOverall(score);

      // Trigger gauge animation after data loads
      setTimeout(() => setGaugeAnim(true), 400);

    } catch (err) {
      console.error('SessionDetail load error:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  // ── CANVAS SETUP + ANIMATION LOOP
  const buildAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || AREAS.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    const { nodes, edges, CX, CY } = buildGraphNodes(canvas, AREAS, GRANTS, RESOURCES, PROVS);
    nodesRef.current = nodes;
    edgesRef.current = edges;
    CXRef.current = CX;
    CYRef.current = CY;

    const bizLabel = bizLabelFromName(session?.business_name);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = (ts) => {
      drawScene(
        canvas, ctx, ts, nodes, edges, CX, CY,
        hovNRef.current, selIdRef.current, bizLabel
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [AREAS, GRANTS, RESOURCES, PROVS, session]);

  useEffect(() => {
    buildAndDraw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [buildAndDraw]);

  // ResizeObserver para el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => buildAndDraw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [buildAndDraw]);

  // ── CANVAS INTERACTION
  function nodeAt(x, y) {
    return [...nodesRef.current].reverse().find(
      nd => Math.hypot(x - nd.x, y - nd.y) <= nd.r + 8
    ) || null;
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nd = nodeAt(mx, my);
    hovNRef.current = nd?.id || null;
    canvas.style.cursor = nd ? 'pointer' : 'default';
    const tt = tooltipRef.current;
    if (!tt) return;
    if (nd && nd.type !== 'biz') {
      let name = '', sub = '';
      if (nd.type === 'area')     { name = nd.ad.name + ' Area';  sub = 'Score: ' + nd.ad.score + '%'; }
      if (nd.type === 'grant')    { name = nd.gd.name;            sub = 'Match: ' + nd.gd.match + '%  ·  ' + nd.gd.status; }
      if (nd.type === 'resource') { name = nd.rd.name;            sub = 'Relevance: ' + nd.rd.match + '%  ·  ' + nd.rd.type; }
      if (nd.type === 'prov')     { name = nd.pd.name;            sub = 'Provider'; }
      tt.querySelector('.kg-tt-n').textContent = name;
      tt.querySelector('.kg-tt-s').textContent = sub;
      tt.style.left = (e.clientX + 12) + 'px';
      tt.style.top  = (e.clientY - 8)  + 'px';
      tt.classList.add('kg-tt-v');
    } else {
      tt.classList.remove('kg-tt-v');
    }
  }

  function handleMouseLeave() {
    hovNRef.current = null;
    tooltipRef.current?.classList.remove('kg-tt-v');
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nd = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (!nd) return;
    if (nd.type === 'grant') {
      if (selIdRef.current === nd.id) { clearSelection(); return; }
      openDetail(nd.id, 'grant');
    }
    if (nd.type === 'resource') {
      if (selIdRef.current === nd.id) { clearSelection(); return; }
      openDetail(nd.id, 'resource');
    }
  }

  function openDetail(id, kind) {
    selIdRef.current = id;
    setSelId(id);
    setSelKind(kind);
  }

  function clearSelection() {
    selIdRef.current = null;
    setSelId(null);
    setSelKind(null);
  }

  // ── GAUGE ANIMATION
  useEffect(() => {
    if (!gaugeAnim) return;
    const fill = document.getElementById('kg-gauge-fill');
    const lbl  = document.getElementById('kg-gauge-pct');
    if (!fill || !lbl) return;
    const circ = 2 * Math.PI * 38;
    const target = overall / 100;
    let cur = 0;
    const step = () => {
      cur = Math.min(cur + 0.013, target);
      fill.setAttribute('stroke-dasharray', `${cur * circ} ${circ}`);
      lbl.textContent = Math.round(cur * 100) + '%';
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [gaugeAnim, overall]);

  // ── AREA BAR ANIMATION
  useEffect(() => {
    if (!AREAS.length) return;
    requestAnimationFrame(() => {
      AREAS.forEach(a => {
        setTimeout(() => {
          const b = document.getElementById('kg-abar-' + a.id);
          if (b) b.style.width = a.score + '%';
        }, 300);
      });
    });
  }, [AREAS]);

  // ── CARD BAR ANIMATION
  useEffect(() => {
    if (!GRANTS.length && !RESOURCES.length) return;
    requestAnimationFrame(() => {
      [...GRANTS, ...RESOURCES].forEach(item => {
        setTimeout(() => {
          const b = document.getElementById('kg-bar-' + item.id);
          if (b) b.style.width = item.match + '%';
        }, 250);
      });
    });
  }, [GRANTS, RESOURCES]);

  // ── LOADING / ERROR STATES
  if (loading) {
    return (
      <div className="kg-wrapper" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ color: 'var(--kg-green)', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          Loading session…
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="kg-wrapper" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ color: 'var(--kg-rose)', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          {error || 'Session not found.'}
        </div>
        <Link to="/consultant/dashboard" className="kg-back-btn">← Back to Dashboard</Link>
      </div>
    );
  }

  const sector = session.sectors?.name || '';
  const location = session.location || '';
  const sectorSub = [sector, location].filter(Boolean).join(' · ');
  const dmlLabel = formatDmlLevel(session.dml_level);
  const dateLabel = formatDate(session.completed_at || session.created_at);
  const grantCount = GRANTS.length;
  const resCount = RESOURCES.length;

  // Detail data
  const selectedGrant    = selKind === 'grant'    ? GRANTS.find(g => g.id === selId) : null;
  const selectedResource = selKind === 'resource' ? RESOURCES.find(r => r.id === selId) : null;
  const selectedProv     = selectedGrant
    ? PROVS.find(p => p.grants.includes(selectedGrant.id))
    : null;
  const selectedArea     = selectedGrant
    ? AREAS.find(a => a.id === selectedGrant.area)
    : selectedResource
      ? AREAS.find(a => a.id === selectedResource._areaId)
      : null;

  return (
    <div className="kg-wrapper">

      {/* Tooltip */}
      <div ref={tooltipRef} className="kg-tt">
        <div className="kg-tt-n"></div>
        <div className="kg-tt-s"></div>
      </div>

      {/* Header */}
      <header className="kg-hdr">
        <Link to="/consultant/dashboard" className="kg-back-btn" style={{ marginRight: 4 }}>←</Link>
        <div className="kg-hdr-mark">WA</div>
        <div className="kg-hdr-biz">
          <div className="kg-hdr-name">{session.business_name || 'Unknown Business'}</div>
          {sectorSub && <div className="kg-hdr-sub">{sectorSub}</div>}
        </div>
        <div className="kg-chips">
          <span className="kg-chip kg-chip-amber">DML: {dmlLabel}</span>
          <span className="kg-chip kg-chip-amber">Score: {overall}%</span>
          <span className="kg-chip kg-chip-muted">{dateLabel}</span>
        </div>
      </header>

      <div className="kg-main">

        {/* ── LEFT PANEL ── */}
        <aside className="kg-pnl-l">

          {/* Gauge */}
          <div className="kg-card">
            <div className="kg-sec-lbl">Match Overview</div>
            <div className="kg-gauge-wrap">
              <svg width="100" height="100" viewBox="0 0 100 100"
                   role="img" aria-label={`${overall} percent overall match score`}>
                <circle className="kg-gauge-track" cx="50" cy="50" r="38" />
                <circle className="kg-gauge-fill" id="kg-gauge-fill" cx="50" cy="50" r="38" />
                <text id="kg-gauge-pct" x="50" y="47" textAnchor="middle"
                  fontFamily="'IBM Plex Mono', monospace" fontSize="16" fontWeight="500"
                  fill="var(--kg-text)">0%</text>
                <text x="50" y="60" textAnchor="middle"
                  fontFamily="'DM Sans', sans-serif" fontSize="8"
                  fill="var(--kg-text3)">overall</text>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 500, color: 'var(--kg-amber)', display: 'block' }}>
                  {grantCount + resCount}
                </span>
                <span style={{ fontSize: 11, color: 'var(--kg-text2)' }}>results matched</span>
                <div style={{ fontSize: 10, color: 'var(--kg-text3)', marginTop: 2 }}>
                  {grantCount} grants · {resCount} resources
                </div>
              </div>
            </div>
          </div>

          {/* Area Scores */}
          <div className="kg-card">
            <div className="kg-sec-lbl">Area Scores</div>
            {AREAS.map(a => (
              <div key={a.id} className="kg-area-row">
                <div className="kg-area-top">
                  <span className="kg-area-name">{a.name}</span>
                  <span className="kg-area-pct" style={{ color: a.color }}>{a.score}%</span>
                </div>
                <div className="kg-bar-track">
                  <div className="kg-bar-fill" id={`kg-abar-${a.id}`}
                       style={{ background: a.color, width: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Gaps */}
          <div className="kg-card" style={{ flex: 1 }}>
            <div className="kg-sec-lbl">Improvement Areas</div>
            {GAPS.map((g, i) => (
              <div key={i} className="kg-gap-row">
                <div className="kg-gap-top">
                  <span className="kg-gap-name">{g.name}</span>
                  <span className="kg-gap-impact">{g.impact}</span>
                </div>
                <div className="kg-gap-reason">{g.reason}</div>
              </div>
            ))}
          </div>

        </aside>

        {/* ── CENTER PANEL (Canvas) ── */}
        <div className="kg-pnl-c">
          <canvas
            ref={canvasRef}
            className="kg-canvas"
            tabIndex={0}
            aria-label="DPIRD knowledge graph showing business areas, matched grants, resources and providers"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
          />
          <div className="kg-legend">
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-green)' }} />Business</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-amber)' }} />Operations</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-sky)' }} />Digital</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-violet)' }} />Market</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: '#4ade80' }} />Grant ≥80%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-amber)' }} />Grant 60–80%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-rose)' }} />Grant &lt;60%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot-dashed" />Resource</div>
            <div className="kg-leg-item"><div className="kg-leg-dash" />Provider</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <aside className="kg-pnl-r">

          {/* LIST VIEW */}
          {!selId && (
            <>
              <div className="kg-r-hdr">
                <div className="kg-r-title">Recommendations</div>
              </div>
              <div className="kg-r-list">
                {GRANTS.length > 0 && (
                  <>
                    <div className="kg-r-sec">Grants · {GRANTS.length} matched</div>
                    {GRANTS.map(g => {
                      const a = AREAS.find(x => x.id === g.area);
                      const p = PROVS.find(x => x.grants.includes(g.id));
                      const c = matchColor(g.match);
                      return (
                        <div key={g.id} className={`kg-r-card${selId === g.id ? ' kg-sel' : ''}`}
                             tabIndex={0}
                             onClick={() => openDetail(g.id, 'grant')}
                             onKeyDown={e => e.key === 'Enter' && openDetail(g.id, 'grant')}>
                          <div className="kg-rc-top">
                            <div className="kg-rc-name">{g.name}</div>
                            <div className="kg-rc-pct" style={{ color: c }}>{g.match}%</div>
                          </div>
                          <div className="kg-rc-bar-wrap">
                            <div className="kg-rc-bar" id={`kg-bar-${g.id}`} style={{ background: c }} />
                          </div>
                          <div className="kg-rc-meta">
                            <span className="kg-rc-area" style={{ color: a?.color }}>{a?.name}</span>
                            <span style={{ color: 'var(--kg-violet)', fontSize: 11 }}>{p?.abbr || ''}</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {RESOURCES.length > 0 && (
                  <>
                    <div className="kg-r-sec">Resources · {RESOURCES.length} matched</div>
                    {RESOURCES.map(r => {
                      const a = AREAS.find(x => x.id === r._areaId);
                      const c = matchColor(r.match);
                      return (
                        <div key={r.id} className={`kg-r-card${selId === r.id ? ' kg-sel' : ''}`}
                             tabIndex={0}
                             onClick={() => openDetail(r.id, 'resource')}
                             onKeyDown={e => e.key === 'Enter' && openDetail(r.id, 'resource')}>
                          <div className="kg-rc-top">
                            <div className="kg-rc-name">{r.name}</div>
                            <div className="kg-rc-pct" style={{ color: c }}>{r.match}%</div>
                          </div>
                          <div className="kg-rc-bar-wrap">
                            <div className="kg-rc-bar" id={`kg-bar-${r.id}`} style={{ background: c }} />
                          </div>
                          <div className="kg-rc-meta">
                            <span className="kg-rc-area" style={{ color: a?.color }}>{a?.name}</span>
                            <span style={{ color: 'var(--kg-amber)', fontSize: 11 }}>{r.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <div className="kg-hint">Click a card or graph node for full details</div>
            </>
          )}

          {/* DETAIL VIEW — GRANT */}
          {selId && selKind === 'grant' && selectedGrant && (
            <>
              <div className="kg-r-hdr">
                <button className="kg-back-btn" onClick={clearSelection}>← All</button>
                <div className="kg-r-title">Grant Detail</div>
              </div>
              <div className="kg-detail">
                <div className="kg-d-score-row">
                  <div className="kg-d-score" style={{ color: matchColor(selectedGrant.match) }}>
                    {selectedGrant.match}%
                  </div>
                  <div className="kg-d-score-lbl">match score</div>
                </div>
                <div>
                  <div className="kg-d-blk-title">Grant Info</div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Name</span>
                    <span className="kg-d-row-v">{selectedGrant.name}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Status</span>
                    <span className="kg-d-row-v" style={{ color: 'var(--kg-amber)' }}>{selectedGrant.status}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Area</span>
                    <span className="kg-d-row-v" style={{ color: selectedArea?.color }}>{selectedArea?.name}</span>
                  </div>
                  {selectedProv && (
                    <div className="kg-d-row">
                      <span className="kg-d-row-k">Provider</span>
                      <span className="kg-d-row-v" style={{ color: 'var(--kg-violet)' }}>{selectedProv.name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="kg-d-blk-title">Area Weights</div>
                  <div className="kg-wt-grid">
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Ops</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-amber)' }}>
                        {Math.round(selectedGrant.weights.ops * 100)}%
                      </div>
                    </div>
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Dig</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-sky)' }}>
                        {Math.round(selectedGrant.weights.dig * 100)}%
                      </div>
                    </div>
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Mkt</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-violet)' }}>
                        {Math.round(selectedGrant.weights.mkt * 100)}%
                      </div>
                    </div>
                  </div>
                  {[
                    { label: 'Operations', val: selectedGrant.weights.ops, color: 'var(--kg-amber)' },
                    { label: 'Digital',    val: selectedGrant.weights.dig, color: 'var(--kg-sky)' },
                    { label: 'Market',     val: selectedGrant.weights.mkt, color: 'var(--kg-violet)' }
                  ].map(wt => (
                    <div key={wt.label} className="kg-wt-bar-wrap">
                      <div className="kg-wt-bar-lbl">
                        <span>{wt.label}</span>
                        <span style={{ color: wt.color }}>{Math.round(wt.val * 100)}%</span>
                      </div>
                      <div className="kg-wt-bar-track">
                        <div className="kg-wt-bar-fill" style={{ width: `${wt.val * 100}%`, background: wt.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                {selectedGrant.tags.length > 0 && (
                  <div>
                    <div className="kg-d-blk-title">Matched Tags</div>
                    <div className="kg-tags-row">
                      {selectedGrant.tags.map(t => <span key={t} className="kg-t-chip">{t}</span>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="kg-d-blk-title">Match Reasoning</div>
                  <p className="kg-reasoning">{selectedGrant.reason}</p>
                </div>
                <div className="kg-action-box">
                  <div className="kg-action-title">Recommended Action</div>
                  <div className="kg-action-text">{selectedGrant.action}</div>
                </div>
              </div>
            </>
          )}

          {/* DETAIL VIEW — RESOURCE */}
          {selId && selKind === 'resource' && selectedResource && (
            <>
              <div className="kg-r-hdr">
                <button className="kg-back-btn" onClick={clearSelection}>← All</button>
                <div className="kg-r-title">Resource Detail</div>
              </div>
              <div className="kg-detail">
                <div className="kg-d-score-row">
                  <div className="kg-d-score" style={{ color: matchColor(selectedResource.match) }}>
                    {selectedResource.match}%
                  </div>
                  <div className="kg-d-score-lbl">relevance score</div>
                </div>
                <div>
                  <div className="kg-d-blk-title">Resource Info</div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Title</span>
                    <span className="kg-d-row-v">{selectedResource.name}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Type</span>
                    <span className="kg-d-row-v" style={{ color: 'var(--kg-amber)' }}>{selectedResource.type}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Area</span>
                    <span className="kg-d-row-v" style={{ color: selectedArea?.color }}>{selectedArea?.name}</span>
                  </div>
                  {selectedResource.url && (
                    <div className="kg-d-row">
                      <span className="kg-d-row-k">Library</span>
                      <a className="kg-d-row-v" href={selectedResource.url} target="_blank" rel="noopener noreferrer"
                         style={{ color: 'var(--kg-sky)' }}>View in DPIRD Library ↗</a>
                    </div>
                  )}
                </div>
                {selectedResource.tags.length > 0 && (
                  <div>
                    <div className="kg-d-blk-title">Matched Tags</div>
                    <div className="kg-tags-row">
                      {selectedResource.tags.map(t => <span key={t} className="kg-t-chip">{t}</span>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="kg-d-blk-title">Description</div>
                  <p className="kg-reasoning">{selectedResource.desc}</p>
                </div>
              </div>
            </>
          )}

        </aside>
      </div>
    </div>
  );
}
```

---

## 8. Fuentes — `public/index.html`

Agregar en el `<head>` del archivo HTML principal del proyecto:

```html
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 9. Routing — `src/App.jsx`

Verificar que la ruta existe y está protegida:

```jsx
// En App.jsx (o el router principal)
import SessionDetail from './pages/SessionDetail';

// Dentro del router:
<Route path="/consultant/sessions/:sessionId" element={
  <ProtectedRoute>
    <SessionDetail />
  </ProtectedRoute>
} />
```

La ruta `:sessionId` debe usar el mismo nombre de parámetro que usa `useParams()` en el componente.

---

## 10. Archivos a crear / modificar

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/pages/SessionDetail.jsx` | CREAR o REEMPLAZAR | Reemplaza spec BUG-012 |
| `src/lib/knowledgeGraph.js` | CREAR | Funciones puras de transformación |
| `src/styles/knowledge-graph.css` | CREAR | Tokens CSS + estilos del layout |
| `public/index.html` | MODIFICAR | Agregar `<link>` de Google Fonts |
| `src/App.jsx` | VERIFICAR | Confirmar ruta protegida con `:sessionId` |

---

## 11. Notas de implementación

**1. `match_score` en la DB es 0.0–1.0 → el componente trabaja en 0–100.**  
Todas las funciones de transformación ya hacen `Math.round(mr.match_score * 100)`.

**2. El canvas usa `devicePixelRatio` para pantallas retina.**  
`canvas.width = canvas.offsetWidth * dpr` — no cambiar esta lógica.

**3. Las fuentes deben estar cargadas antes del primer frame del canvas.**  
El timeout de 400ms en `setGaugeAnim` da tiempo suficiente. Si las fuentes fallan, el canvas usa fallbacks del sistema.

**4. El `requestAnimationFrame` loop se cancela en el `return` del `useEffect`.**  
Esto evita memory leaks cuando el usuario navega a otra página.

**5. El tooltip usa `position: fixed` en el DOM, no dentro del canvas.**  
Funciona con el event `clientX/clientY` del mouse.

**6. Si `PROVS` está vacío** (no hay providers en match_results ni en grant_providers), el grafo renderiza sin nodos de tipo `prov` — no rompe nada.

**7. `selIdRef` y `selId` son paralelos:**  
`selIdRef.current` es leído por el loop del canvas (sin re-render). `setSelId` es el state React que controla el panel derecho.

**8. ResizeObserver reemplaza `window.addEventListener('resize', ...)`**  
Más preciso: detecta cuando el panel cambia de tamaño aunque el viewport no cambie.

---

## 12. Criterios de aceptación

- [ ] La ruta `/consultant/sessions/:sessionId` carga sin errores
- [ ] Header muestra: business name, sector · location, DML chip, Score chip, fecha
- [ ] Panel izquierdo: gauge SVG anima al score correcto, area bars animan, gaps muestran
- [ ] Canvas renderiza los 5 tipos de nodo correctamente
- [ ] Edges: solid (biz→area), dashed animated (area→grant/resource), violet dashed (grant→prov)
- [ ] Hover en nodo: tooltip aparece con nombre y score
- [ ] Click en grant: panel derecho muestra detail view con score 44px, weights grid, tags, reasoning, action box
- [ ] Click en resource: panel derecho muestra detail view con score 44px, tipo, tags, descripción
- [ ] "← All" en detail view vuelve al list view
- [ ] Click en nodo ya seleccionado: deselecciona y vuelve al list view
- [ ] El grafo resiste redimensionado de ventana sin artefactos
- [ ] Funciona en modo claro y oscuro (tokens CSS)
- [ ] Ningún error en consola durante uso normal

---

## 13. Dependencias previas

| CC / Bug | Descripción | Estado requerido |
|----------|-------------|-----------------|
| **CC-006 / BUG-003** | Sesiones marcadas como `completed` | ✅ Debe estar resuelto antes del QA |
| **BUG-001** | BFS matching engine funciona | ✅ Resuelto |
| **BUG-002** | DML eligibility filter funciona | ✅ Resuelto |

---

## 14. Referencia visual

El prototipo interactivo del resultado esperado está publicado en:  
**`https://claude.ai/code/artifact/89ad67fa-f579-48ea-9389-b9bbdb00ca59`**

Este prototipo usa datos de muestra de "Greenfields Organics WA". La implementación final debe verse **idéntica** a este prototipo pero alimentada con datos reales de Supabase según la sesión cargada.

---

**Preparado por:** Eleven June Consulting — Product & QA Team  
**Fecha:** August 22, 2026
