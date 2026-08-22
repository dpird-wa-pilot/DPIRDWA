# CC-003 — Providers Page: New Page Implementation
**Change Control ID:** CC-003  
**Document:** Technical Change Specification  
**Version:** 1.6  
**Date:** Agosto 2026  
**Status:** Pendiente  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementación)  
**Files affected:** `src/pages/Providers.jsx` *(nueva)* · `src/App.jsx` o router · `src/components/NavBar.jsx`  
**DB tables affected:** `providers` · `provider_tags` *(seed de datos — no se crean nuevas tablas)*  
**Depends on:** Database schema v2.0 (tabla `providers` ya definida)  
**Reference (card design):** Singapore SMEs Go Digital — https://smesgodigital.gov.sg/web/go-digital-advisor-result  
**Reference (data):** DPIRD Food & Beverage Directory — https://www.dpird.wa.gov.au/online-tools/food-and-beverage-directory/  
**Mockup aprobado:** `provider-card-mockup.html` *(diseño original, validado por Eleven June, Agosto 2026)*  
**Mockup rediseño:** `provider-card-redesign-v2.html` *(diseño mejorado con colores, validado por Eleven June, Agosto 2026 — referencia para §18)*

> **v1.6 — Cambios respecto a v1.5:**
> - **BUG-003 identificado:** Summary del card se renderiza en color azul/teal en lugar de gris oscuro — error de token CSS en `text-on-surface-variant`
> - **§18 agregado:** Mejoras visuales de diseño aprobadas — colores por service type, íconos de ubicación coloreados, panel derecho con tinte. Referencia: `provider-card-redesign-v2.html`
> - Mockup de rediseño actualizado como nueva referencia visual
> - Tabla QA actualizada con BUG-003

> **v1.5 — Cambios respecto a v1.4:**
> - **QA realizado** sobre `localhost:5173/providers` — 2 bugs identificados y documentados (§17)
> - Bug 1: panel derecho toma ancho completo del card (`md:w-56` no aplicado por Tailwind JIT)
> - Bug 2: botón "Contact" no renderiza porque todos los providers tienen `email: ""`
> - Fix documentado para cada bug con código concreto

> **v1.4 — Cambios respecto a v1.3:**
> - **Archivo feed SQL generado:** `seed_providers_v2.1.sql` — INSERT completo para tablas `providers` y `provider_tags`, listo para ejecutar en Supabase SQL Editor
> - Seed incluye los 15 providers con todos los campos schema v2.1 (`service_types`, `service_category`, `contact_name`, `operates_online`, etc.) y 33 filas en `provider_tags`
> - Script envuelto en `BEGIN / COMMIT` para ejecución atómica
> - Sección 3.2 y checklist actualizados para reflejar el archivo SQL como fuente de carga (en lugar del Excel)

> **v1.3 — Cambios respecto a v1.2:**
> - **Schema v2.1:** Tabla `providers` recibe 2 nuevos campos: `contact_name text` y `service_category text[]`
> - **`service_types` expandido** de 4 a 7 valores: agrega `logistics`, `marketing`, `facilities`
> - **Seed actualizado:** 15 providers reales del directorio DPIRD F&B (reemplaza los 7 prototipos de Excel v2)
> - Nuevos índices GIN: `idx_providers_service_types`, `idx_providers_service_category`

> **v1.2 — Cambios respecto a v1.1:**
> - Sección expandible ("View more") muestra únicamente **Industries served** — los service types ya aparecen como badges bajo el nombre del provider, por lo que no se repiten en el área expandible
> - Mockup interactivo (`provider-card-mockup.html`) aprobado como referencia definitiva de diseño para Antigravity

> **v1.1 — Cambios respecto a v1.0:**
> - Renombrado de "Professional Services" a **"Providers"** (uniformidad de nombres con la BD)
> - Diseño de card rediseñado siguiendo el patrón de **SMEs Go Digital (Singapore)**: layout split izquierda/derecha, secciones expandibles con checkmarks, panel lateral de acción

---

## 1. Contexto y Objetivo

Crear una **nueva página** llamada "Providers" que muestre el directorio de proveedores de servicios pre-aprobados por DPIRD, integrada con la base de datos de la plataforma.

La página tiene **panel de filtros izquierdo + grid de cards** (mismo layout que Grants y Resources), pero el **diseño interno de cada card** sigue el patrón de Singapore SMEs Go Digital: layout dividido con contenido expandible a la izquierda y panel de acción a la derecha.

**Datos de prototipo:** 7 providers cargados desde `DPIRD_Database_Prototype_v2.xlsx`. Cuando DPIRD entregue la lista oficial del directorio, se cargan en Supabase sin cambios de código.

---

## 2. Resumen de Cambios

| Aspecto | Estado actual | Estado objetivo |
|---------|--------------|-----------------|
| Página Providers | No existe | Nueva página `Providers.jsx` |
| Ruta | — | `/providers` |
| Ítem NavBar | Inexistente o placeholder | "Providers" activo |
| Fuente de datos | — | Query a tabla `providers` en Supabase |
| Filtros | — | 4 grupos: Búsqueda, Tipo de Servicio, Industria, Ubicación |
| Diseño de card | — | Split layout: contenido expandible izquierda + panel acción derecha (estilo SMEs Go Digital) |
| CTA principal | — | "Visit Website" en panel derecho |
| CTA secundario | — | "Contact" (mailto) si hay email |
| Nuevos campos BD | — | `contact_name text`, `service_category text[]` en tabla `providers` |
| `service_types` vocab | 4 valores | 7 valores: agrega `logistics`, `marketing`, `facilities` |
| Seed de datos | Tabla vacía | 15 providers reales del directorio DPIRD F&B |

---

## 3. Cambios en Base de Datos (Supabase)

### 3.1 Cambios en la tabla `providers` (schema v2.1)

No se crean nuevas tablas. Se agregan dos columnas a `providers` y se actualizan los índices.

```sql
-- [CC-003] Schema v2.1 — Nuevas columnas en providers
ALTER TABLE providers
  ADD COLUMN contact_name     text,
  ADD COLUMN service_category text[];

-- [CC-003] Índices GIN para los nuevos campos de array
CREATE INDEX idx_providers_service_types    ON providers USING GIN(service_types);
CREATE INDEX idx_providers_service_category ON providers USING GIN(service_category);
```

**Vocabulario `service_types` expandido (v2.1):**

| Valor | UI label | Descripción |
|-------|----------|-------------|
| `consulting` | Consulting | Asesoría estratégica y advisory |
| `implementation` | Implementation | Instalación y despliegue de equipos/sistemas |
| `training` | Training | Talleres y programas educativos |
| `audit` | Audit & Review | Testing, certificación, compliance |
| `logistics` | Logistics | Cadena de frío, freight, supply chain |
| `marketing` | Marketing & Design | Branding, diseño gráfico, fotografía |
| `facilities` | Facilities | Espacios compartidos (cocinas comerciales, etc.) |

**Vocabulario `service_category` (granular):**

`factory_equipment` · `waste_management` · `management_consulting` · `carbon_management` · `branding_design` · `food_testing` · `cold_chain_logistics` · `freight_forwarding` · `commercial_kitchen` · `food_photography`

### 3.2 Seed — 15 providers del directorio DPIRD F&B

**Archivo de carga:** `seed_providers_v2.1.sql` — ejecutar en Supabase SQL Editor **después** de aplicar las migraciones de §3.1. El script está envuelto en `BEGIN / COMMIT` para ejecución atómica e incluye comentarios de verificación al final.

```sql
-- Verificación post-carga (incluida al final del archivo seed)
-- SELECT COUNT(*) FROM providers WHERE dpird_approved = true;       -- → 15
-- SELECT COUNT(*) FROM provider_tags pt
--   JOIN providers p ON p.id = pt.provider_id
--   WHERE p.dpird_approved = true;                                   -- → 33
```

Fuente original: `WA_Food_Beverage_Providers_15.xlsx` (directorio DPIRD). Todos con `dpird_approved = true`, `operates_online = true`, `status = 'active'`.

| Nombre | service_types | service_category | location | contact_name |
|--------|--------------|-----------------|----------|-------------|
| AccuWeigh | implementation | factory_equipment | metro_wa | Phyllis Dodley |
| Aco Australia | implementation | waste_management | metro_wa | — |
| Adam Equipment | implementation | factory_equipment | metro_wa | — |
| Adapt | consulting | management_consulting | metro_wa | Adam Wilce |
| Adaptus Pty Ltd | consulting | carbon_management | metro_wa | Jerome Bowen |
| Adept Turkey | implementation | factory_equipment | metro_wa | — |
| Aeozo Australia Pty Ltd | marketing | branding_design | metro_wa | Abhishek Jha |
| Agknowledge | consulting | management_consulting | metro_wa | Peter Cooke |
| AgriFood Technology | audit | food_testing | metro_wa | — |
| Agristart | consulting | management_consulting | regional_wa, south_west | — |
| AHG Refrigerated Logistics | logistics | cold_chain_logistics | metro_wa | — |
| Albany Business Centre | facilities | commercial_kitchen | regional_wa, great_southern | — |
| Allen Air and Refrigeration | implementation, logistics | cold_chain_logistics | metro_wa | Kim Allen |
| AMAC Customs and Logistics | logistics | freight_forwarding | metro_wa | Aaron |
| Amplify Creative Lab | marketing | food_photography | metro_wa | Stefano Meoni |

**Tags sugeridos por provider** (para carga manual en Supabase por el admin):

| Nombre | trigger_tags | dml_levels | objective_tags |
|--------|-------------|------------|---------------|
| AccuWeigh | equipment_selection, process_automation | foundational, emerging | reduce_waste, increase_productivity |
| Aco Australia | waste_management, sustainability | foundational, emerging | reduce_waste, improve_compliance |
| Adam Equipment | equipment_selection | foundational, emerging | increase_productivity, reduce_costs |
| Adapt | business_strategy, digital_strategy | emerging, established | increase_productivity, access_new_markets |
| Adaptus Pty Ltd | sustainability, carbon_reporting | established, advanced | improve_compliance, reduce_costs |
| Adept Turkey | process_automation, quality_control | emerging, established | increase_productivity, improve_traceability |
| Aeozo Australia | digital_marketing, brand_identity | foundational, emerging | access_new_markets |
| Agknowledge | business_strategy, retail_engagement | emerging, established | access_new_markets, increase_productivity |
| AgriFood Technology | food_safety, certification, compliance | foundational, emerging, established | improve_compliance, improve_traceability |
| Agristart | business_strategy, agtech, innovation | emerging, established | access_new_markets, increase_productivity |
| AHG Refrigerated Logistics | cold_chain, supply_chain | foundational, emerging | reduce_waste, improve_traceability |
| Albany Business Centre | shared_facilities, production_space | foundational | reduce_costs |
| Allen Air and Refrigeration | cold_chain, refrigeration | foundational, emerging | reduce_costs, improve_compliance |
| AMAC Customs and Logistics | export_logistics, supply_chain | emerging, established | access_new_markets, reduce_costs |
| Amplify Creative Lab | digital_marketing, content_creation | foundational, emerging | access_new_markets |

### 3.3 RLS policies

```sql
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Lectura pública de providers activos
CREATE POLICY "providers_public_read"
  ON providers FOR SELECT
  USING (status = 'active');

-- Solo admin puede modificar
CREATE POLICY "providers_admin_write"
  ON providers FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 4. Ruta y Navegación

### 4.1 Router

```jsx
// [CC-003] Nueva ruta Providers
import Providers from './pages/Providers'

<Route path="/providers" element={<Providers />} />
```

### 4.2 NavBar

```jsx
// [CC-003] Ítem Providers en NavBar
<NavLink to="/providers">Providers</NavLink>
```

---

## 5. Integración con Supabase

### 5.1 Query principal

```js
// [CC-003] Query providers activos desde Supabase
const [providers, setProviders] = useState([])
const [loading, setLoading]     = useState(true)
const [error, setError]         = useState(null)

useEffect(() => {
  const fetchProviders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('providers')
      .select(`
        id, name, slug, summary, description,
        website, email, phone, logo_url,
        contact_name, service_types, service_category,
        sector_tags, dml_levels, objective_tags,
        location, operates_online,
        dpird_approved, approval_date,
        is_featured, sort_order
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('sort_order',  { ascending: true })
      .order('name',        { ascending: true })

    if (error) setError(error.message)
    else       setProviders(data)
    setLoading(false)
  }
  fetchProviders()
}, [])
```

---

## 6. Mapeo de Campos: BD → UI

| Campo BD | Posición en card | Notas |
|----------|-----------------|-------|
| `name` | Título principal (izquierda) | `<h2>` |
| `summary` | Descripción corta visible siempre | 2 líneas |
| `service_types` | Badges de categoría bajo el título | Estilo chips (como "AI-enabled", "Loyalty Management" en ref.) |
| `description` | Sección expandible "About" | Visible al hacer clic en "View more" |
| `sector_tags` | Sección expandible "Industries served" | Lista con checkmarks |
| `dml_levels` | Sección expandible "Suitable for" | DML levels con checkmarks |
| `logo_url` | Panel derecho — logo del provider | Si null, ícono `business` |
| `dpird_approved` | Panel derecho — badge destacado | Solo si `true` |
| `location` | Panel derecho — ubicación | Array → badges |
| `operates_online` | Panel derecho | "Available online" si true |
| `website` | Panel derecho — botón principal | "Visit Website" |
| `email` | Panel derecho — botón secundario | "Contact" (mailto) |

### 6.1 Labels por `service_types` (vocabulario v2.1 — 7 valores)

| DB value | UI label (badge) |
|----------|-----------------|
| `consulting` | Consulting |
| `implementation` | Implementation |
| `training` | Training |
| `audit` | Audit & Review |
| `logistics` | Logistics |
| `marketing` | Marketing & Design |
| `facilities` | Facilities |

### 6.2 Labels por `service_category` (granular — no se muestra en badge, solo en filtro)

| DB value | UI label |
|----------|---------|
| `factory_equipment` | Factory Equipment |
| `waste_management` | Waste Management |
| `management_consulting` | Management Consulting |
| `carbon_management` | Carbon Management |
| `branding_design` | Branding & Design |
| `food_testing` | Food Testing |
| `cold_chain_logistics` | Cold Chain Logistics |
| `freight_forwarding` | Freight Forwarding |
| `commercial_kitchen` | Commercial Kitchen |
| `food_photography` | Food Photography |

### 6.2 Labels por `location`

| DB value | UI label |
|----------|---------|
| `metro_wa` | Metro WA |
| `regional_wa` | Regional WA |
| `national` | National |
| `remote` | Remote WA |

---

## 7. Filtros

Panel izquierdo con **4 grupos accordion**, mismo patrón que Grants y Resources.

**Estado por defecto al cargar:**
- "Service Type" → expandido
- "Industry" → expandido
- "Location" → colapsado
- Búsqueda → siempre visible (fuera del accordion)

### 7.0 Estado accordion

```js
// [CC-003] Accordion state — Providers filters
const [openSections, setOpenSections] = useState({
  service_type: true,
  industry:     true,
  location:     false,
})
```

### 7.1 Búsqueda

```js
const searchMatch =
  provider.name.toLowerCase().includes(query.toLowerCase()) ||
  (provider.summary || '').toLowerCase().includes(query.toLowerCase())
```

### 7.2 Tipo de Servicio (`service_types`)

Opciones fijas — OR dentro del grupo. Vocabulario v2.1 (7 valores):

```js
// [CC-003] service_types filter options — vocab v2.1
const serviceTypeOptions = [
  { value: 'consulting',      label: 'Consulting' },
  { value: 'implementation',  label: 'Implementation' },
  { value: 'training',        label: 'Training' },
  { value: 'audit',           label: 'Audit & Review' },
  { value: 'logistics',       label: 'Logistics' },
  { value: 'marketing',       label: 'Marketing & Design' },
  { value: 'facilities',      label: 'Facilities' },
]
```

### 7.3 Industria (`sector_tags`)

Extraída dinámicamente de los providers cargados. Mismo `sectorLabels` mapping que Grants y Resources.

### 7.4 Ubicación (`location`) — con `operates_online`

```js
// [CC-003] Location filter — providers online son visibles desde cualquier ubicación
const matchesLocation = (provider, selectedLocations) => {
  if (selectedLocations.length === 0) return true
  if (provider.operates_online) return true
  return (provider.location || []).some(loc => selectedLocations.includes(loc))
}
```

### 7.5 Lógica combinada

```js
// [CC-003] Combined filter — AND entre grupos, OR dentro de grupos
const filteredProviders = useMemo(() => {
  return providers.filter(p =>
    matchesSearch(p, searchQuery) &&
    matchesServiceType(p, selectedServiceTypes) &&
    matchesIndustry(p, selectedIndustries) &&
    matchesLocation(p, selectedLocations)
  )
}, [providers, searchQuery, selectedServiceTypes, selectedIndustries, selectedLocations])
```

---

## 8. Diseño de Card — Split Layout (estilo SMEs Go Digital)

### 8.1 Estructura general

```
┌────────────────────────────────────────────────────────┐
│                                           │            │
│  CONTENIDO (izquierda)                    │  PANEL     │
│  ─────────────────────                    │  DERECHO   │
│  Nombre del provider            70%       │   30%      │
│  [Badge] [Badge] [Badge]  ← service_types │            │
│                                           │  [Logo]    │
│  Summary (2 líneas siempre visible)       │            │
│                                           │  ✓ DPIRD   │
│  ─ ─ ─ ─ (expandido) ─ ─ ─ ─ ─ ─ ─ ─   │  Approved  │
│  INDUSTRIES SERVED                        │            │
│    ✓ Food & Beverage                      │  📍 Metro  │
│    ✓ Agriculture                          │  📍 Regional│
│    ✓ Food Manufacturing                   │  🌐 Online  │
│                                           │            │
│  [View more ∨] / [View less ∧]           │  [Visit    │
│                                           │  Website ↗]│
│                                           │            │
│                                           │  [Contact →]│
└────────────────────────────────────────────────────────┘
```

> **Nota de diseño (aprobado v1.2):** La sección expandible muestra únicamente **Industries served**. Los `service_types` ya aparecen como badges bajo el nombre — no se repiten abajo. Ver `provider-card-mockup.html` como referencia definitiva.

### 8.2 Implementación JSX

```jsx
{/* [CC-003] Provider card — split layout estilo SMEs Go Digital */}
const ProviderCard = ({ provider }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-surface-container-lowest rounded-lg border border-outline-variant
                    shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex">

        {/* ── Columna izquierda: contenido ── */}
        <div className="flex-1 p-lg border-r border-outline-variant">

          {/* Título y badges */}
          <h2 className="font-title-md text-title-md text-on-surface font-bold mb-xs">
            {provider.name}
          </h2>

          <div className="flex flex-wrap gap-xs mb-sm">
            {(provider.service_types || []).map(type => (
              <span key={type}
                className="text-xs font-semibold px-2 py-0.5 rounded-full
                           bg-[#EEF4FB] text-[#003D7B] border border-[#003D7B]/20">
                {serviceTypeLabels[type] || type}
              </span>
            ))}
          </div>

          {/* Summary siempre visible */}
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-md line-clamp-2">
            {provider.summary || provider.description}
          </p>

          {/* Sección expandible — solo Industries served (diseño aprobado v1.2) */}
          {expanded && (provider.sector_tags || []).length > 0 && (
            <div className="pt-sm mt-sm border-t border-outline-variant">
              <p className="font-label-sm text-label-sm text-on-surface
                            font-semibold mb-xs uppercase tracking-wide text-xs">
                Industries served
              </p>
              <ul className="flex flex-col gap-xs">
                {(provider.sector_tags || []).map(s => (
                  <li key={s} className="flex items-center gap-xs
                                         font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-[#003D7B]"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    {sectorLabels[s] || s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Toggle View more / View less */}
          <button
            onClick={() => setExpanded(prev => !prev)}
            className="mt-md text-[#003D7B] font-label-sm text-label-sm
                       hover:underline flex items-center gap-xs"
          >
            {expanded ? 'View less' : 'View more'}
            <span className={`material-symbols-outlined text-sm transition-transform
                              ${expanded ? 'rotate-180' : 'rotate-0'}`}>
              expand_more
            </span>
          </button>
        </div>

        {/* ── Panel derecho: acción ── */}
        <div className="w-48 flex-shrink-0 p-md flex flex-col items-center gap-md
                        bg-surface-container">

          {/* Logo o ícono */}
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.name}
                 className="h-14 w-auto object-contain" />
          ) : (
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              business
            </span>
          )}

          {/* DPIRD Approved */}
          {provider.dpird_approved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold
                             bg-[#003D7B] text-white px-2 py-1 rounded-full text-center">
              <span className="material-symbols-outlined text-xs">verified</span>
              DPIRD Approved
            </span>
          )}

          {/* Ubicación */}
          <div className="flex flex-col gap-xs w-full">
            {(provider.location || []).map(loc => (
              <span key={loc}
                className="flex items-center gap-xs font-body-sm text-body-sm
                           text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {locationLabels[loc] || loc}
              </span>
            ))}
            {provider.operates_online && (
              <span className="flex items-center gap-xs font-body-sm text-body-sm
                               text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">language</span>
                Available online
              </span>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-xs w-full mt-auto">
            <a
              href={provider.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={!provider.website ? (e) => e.preventDefault() : undefined}
              className={`w-full block text-center font-label-md py-2 px-3 rounded
                          font-bold transition-colors text-sm
                ${provider.website
                  ? 'bg-[#003D7B] text-white hover:bg-[#002a57] cursor-pointer'
                  : 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-50'
                }`}
            >
              Visit Website
              <span className="material-symbols-outlined text-xs ml-1 align-middle">
                open_in_new
              </span>
            </a>

            {provider.email && (
              <a
                href={`mailto:${provider.email}`}
                className="w-full block text-center font-label-md py-2 px-3 rounded
                           font-bold border border-[#003D7B] text-[#003D7B] text-sm
                           hover:bg-[#003D7B] hover:text-white transition-colors"
              >
                Contact
                <span className="material-symbols-outlined text-xs ml-1 align-middle">mail</span>
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
```

### 8.3 Adaptaciones respecto al card de referencia (SMEs Go Digital)

| Elemento de referencia | Adaptación DPIRD |
|------------------------|-----------------|
| Rating ⭐ + reviews | Reemplazado por badge "DPIRD Approved" |
| Precio "Starting from $8,200" | Reemplazado por ubicación (Metro WA / Regional WA) |
| "Estimated grant" | Reemplazado por "Available online" si aplica |
| Categorías "AI-enabled / Loyalty Mgmt" | `service_types` badges (Consulting, Training, etc.) |
| "Additional features" | Columna "Industries served" (sector_tags) |
| "Core features" (checkmarks 2 col) | "Core services" (service_types expandidos) |
| "View details" button | "Visit Website" + "Contact" |

---

## 9. Hero Section

```
Título:      Providers
Subtítulo:   DPIRD-approved service providers for WA businesses
Descripción: Find pre-approved consultants, trainers, and specialists
             across Western Australia — matched to your industry and digital maturity level.
```

---

## 10. Estados de Carga, Error y Vacío

```jsx
if (loading) {
  return (
    <div className="flex justify-center items-center py-2xl">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">
        progress_activity
      </span>
    </div>
  )
}

if (error) {
  return (
    <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
      <p className="font-body-md">Could not load providers. Please try again.</p>
    </div>
  )
}

if (filteredProviders.length === 0) {
  return (
    <div className="text-center py-2xl">
      <span className="material-symbols-outlined text-on-surface-variant text-5xl">
        search_off
      </span>
      <p className="font-body-lg text-on-surface-variant mt-md">
        No providers match your current filters.
      </p>
      <button onClick={clearAllFilters} className="text-primary font-label-md mt-sm hover:underline">
        Clear all filters
      </button>
    </div>
  )
}
```

---

## 11. Conteo de resultados

```jsx
<p className="font-body-sm text-on-surface-variant mb-md">
  Showing {filteredProviders.length} of {providers.length} providers
</p>
```

---

## 12. Lo que NO cambia

- Layout general (NavBar, footer, design system Tailwind)
- Páginas existentes (Grants, Resources, Home, etc.)
- Tablas de base de datos (ninguna nueva — solo seed)

---

## 13. Comparación entre páginas del módulo de contenido

| Aspecto | Grants | Resources | Providers |
|---------|--------|-----------|-----------|
| Archivo | `Grants.jsx` | `Resources.jsx` | `Providers.jsx` |
| Ruta | `/grants` | `/resources` | `/providers` |
| Tabla BD | `grants` | `resources` | `providers` |
| Color botón | Gold `#b58500` | Navy `#003D7B` | Navy `#003D7B` |
| Layout card | Vertical simple | Vertical simple | **Split: izquierda + panel derecho** |
| Expand/collapse | No | No | **Sí — "View more / View less"** |
| Badge especial | Status (open/closed) | Resource type | DPIRD Approved |
| Filtros únicos | Business Stage, Status, Indigenous | Resource Type, DML | Service Type, Location |
| Filtros comunes | Industry, Search | Industry, Search | Industry, Search |

---

## 14. Orden de ejecución

```
FASE 1 — BASE DE DATOS
─────────────────────────────────────────────
1. Confirmar que tabla `providers` existe (schema v2.0)
2. Ejecutar migraciones schema v2.1: ALTER TABLE + índices GIN (§3.1)
3. Habilitar RLS en `providers` (§3.3)
4. Ejecutar seed SQL: `seed_providers_v2.1.sql` en Supabase SQL Editor (§3.2)
   → carga 15 providers + 33 filas en provider_tags en una sola transacción

FASE 2 — APLICACIÓN
─────────────────────────────────────────────
5. Crear Providers.jsx con query Supabase (§5)
6. Implementar split-layout card con expand/collapse (§8)
7. Implementar 4 filtros con accordion (§7)
8. Implementar hero section (§9)
9. Implementar estados loading / error / empty (§10)
10. Agregar ruta /providers en el router (§4.1)
11. Activar ítem "Providers" en NavBar (§4.2)
```

---

## 15. Checklist de Entrega para Antigravity

### Base de Datos
- [ ] Migraciones schema v2.1 aplicadas: `contact_name`, `service_category`, índices GIN (§3.1)
- [ ] RLS habilitado en `providers` (§3.3)
- [ ] `seed_providers_v2.1.sql` ejecutado en Supabase SQL Editor (§3.2)
- [ ] Query de prueba devuelve 15 providers activos: `SELECT COUNT(*) FROM providers WHERE dpird_approved = true;`
- [ ] `provider_tags` cargados: `SELECT COUNT(*) FROM provider_tags;` → 33 filas

### Aplicación
- [ ] Ruta `/providers` registrada en el router
- [ ] Ítem "Providers" activo en NavBar
- [ ] Datos cargados dinámicamente desde Supabase
- [ ] Solo `status = 'active'` aparece
- [ ] Hero section correcta
- [ ] Card usa split layout: columna izquierda (70%) + panel derecho (30%)
- [ ] Panel derecho muestra: logo/ícono, DPIRD Approved, ubicación, botones
- [ ] Badges de `service_types` visibles bajo el título
- [ ] Summary visible siempre (2 líneas)
- [ ] "View more" expande sección "Industries served" con checkmarks *(nota: "Core services" fue eliminado del diseño aprobado v1.2 — no debe aparecer)*
- [ ] "View less" colapsa las secciones expandidas
- [ ] "View more/less" funciona de forma independiente por card
- [ ] Badge "DPIRD Approved" visible solo si `dpird_approved = true`
- [ ] "Available online" visible solo si `operates_online = true`
- [ ] "Visit Website" abre `website` en nueva pestaña
- [ ] "Visit Website" deshabilitado si `website` es null
- [ ] "Contact" visible solo si hay `email` → abre mailto
- [ ] Panel de filtros: 4 grupos accordion (Search, Service Type, Industry, Location)
- [ ] Filtro Location respeta `operates_online` (providers online pasan todos los filtros de ubicación)
- [ ] "Clear all filters" visible cuando hay filtros activos
- [ ] Estados loading / error / empty implementados
- [ ] Conteo "Showing X of Y providers" visible
- [ ] Probado con los 15 providers en Supabase
- [ ] Código anotado con `// [CC-003]` en secciones clave

---

## 16. Nota sobre datos futuros

Cuando DPIRD entregue la lista oficial del directorio, los providers se cargan directamente en Supabase via Table Editor — **sin cambios de código**. El campo `dpird_approved` permite marcar cuáles están pre-aprobados oficialmente.

---

## 17. Bugs identificados en QA — Agosto 2026

QA realizado sobre `http://localhost:5173/providers` con los 15 providers del seed v2.1.

### BUG-001 — Panel derecho toma ancho completo del card (Alta prioridad)

**Síntoma:** El panel derecho del card (logo, DPIRD Approved, ubicación, botones) ocupa el 99% del ancho del card. La columna izquierda (nombre, badges, summary, "View more") queda aplastada a ~139px.

**Causa raíz:** La clase `md:w-56` no está siendo generada por el compilador Tailwind JIT. Solo aplica la clase base `w-full`, que en un contenedor flex le da el 100% del ancho al panel derecho.

**Medición:** Card width = 864px · Columna izquierda = 139px · Panel derecho = 862px.

**Fix — opción A (recomendada): `style` inline**

En `Providers.jsx`, buscar el div del panel derecho y reemplazar:

```jsx
// ❌ ANTES
<div className="w-full md:w-56 flex-shrink-0 p-md flex flex-col items-center gap-md bg-surface-container-low justify-between">

// ✅ DESPUÉS
<div className="flex-shrink-0 p-md flex flex-col items-center gap-md bg-surface-container-low justify-between"
     style={{ width: '224px', minWidth: '224px' }}>
```

**Fix — opción B: safelist en `tailwind.config.js`**

```js
// tailwind.config.js
module.exports = {
  // ...
  safelist: [
    'md:w-56',
    'md:flex-row',
    'md:border-r',
    'md:border-b-0',
  ],
}
```

---

### BUG-002 — Botón "Contact" no aparece en ningún card (Media prioridad)

**Síntoma:** El botón "Contact" no se renderiza en ninguno de los 15 providers.

**Causa raíz:** El botón está condicionado a `provider.email`. Todos los providers del seed v2.1 tienen `email: null` — la condición evalúa `false` y el botón no aparece.

**Opciones de fix:**

**Opción A — Usar `phone` como fallback (recomendada mientras DPIRD entrega emails):**

```jsx
// ✅ FIX en Providers.jsx — sección de botones del panel derecho
{(provider.email || provider.phone) && (
  <a
    href={provider.email ? `mailto:${provider.email}` : `tel:${provider.phone}`}
    className="w-full block text-center font-label-md py-2 px-3 rounded
               font-bold border border-[#003D7B] text-[#003D7B] text-sm
               hover:bg-[#003D7B] hover:text-white transition-colors"
  >
    Contact
    <span className="material-symbols-outlined text-xs ml-1 align-middle">
      {provider.email ? 'mail' : 'phone'}
    </span>
  </a>
)}
```

**Opción B — Agregar emails reales en Supabase:** Cuando DPIRD entregue emails, cargarlos via Table Editor en la columna `email` de la tabla `providers`. Sin cambio de código.

**Opción recomendada:** Implementar fix A ahora (muestra teléfono) + actualizar a email cuando DPIRD lo entregue.

---

### Resumen QA — Items aprobados

| Ítem | Estado |
|------|--------|
| Hero section (título + subtítulo) | ✅ |
| NavBar "Providers" activo | ✅ |
| 15 providers cargados desde Supabase | ✅ |
| Contador "Showing X of Y providers" | ✅ |
| Filtro Service Type — 7 opciones expandido por defecto | ✅ |
| Filtro Industry — dinámico, expandido por defecto | ✅ |
| Filtro Location — colapsado por defecto | ✅ |
| Filtro Service Type funcional (Consulting → 4 resultados) | ✅ |
| Bypass `operates_online` en filtro Location | ✅ |
| Búsqueda por nombre funcional (Enter key) | ✅ |
| Card split layout `flex-col md:flex-row` | ✅ (código correcto) |
| Badges `service_types` bajo el nombre | ✅ |
| Multi-badge (Allen Air: Implementation + Logistics) | ✅ |
| Summary `line-clamp-2` | ✅ |
| "View more" → muestra "Industries served" con checkmarks | ✅ |
| "View less" al colapsar | ✅ |
| Sin "Core services" en sección expandible (diseño aprobado v1.2) | ✅ |
| Badge "DPIRD Approved" | ✅ |
| Ubicación + "Available online" en panel derecho | ✅ |
| "Visit Website" con link correcto | ✅ |
| Split layout visual 70/30 | ❌ BUG-001 |
| Botón "Contact" visible | ❌ BUG-002 |
| Color del summary text (gris oscuro) | ❌ BUG-003 |

---

### BUG-003 — Summary text se renderiza en azul/teal en lugar de gris oscuro (Alta prioridad)

**Síntoma:** El texto del summary del provider (la descripción de 2 líneas) aparece en color azul-teal en lugar de gris oscuro como define el mockup aprobado. Reproducible en todos los cards.

**Causa raíz probable:** El token de color `text-on-surface-variant` en el design system de Tailwind del proyecto está mapeado a un valor azul/teal en lugar de gris. El mockup original usa `color: #4B5563` (gray-600).

**Fix:**

En `Providers.jsx`, buscar la clase del summary y reemplazar el token por el valor literal:

```jsx
// ❌ ANTES (token que resuelve a azul)
<p className="font-body-sm text-body-sm text-on-surface-variant mb-md line-clamp-2">
  {provider.summary || provider.description}
</p>

// ✅ DESPUÉS (gris oscuro correcto)
<p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
  {provider.summary || provider.description}
</p>
```

**Alternativa:** Verificar en `tailwind.config.js` el valor del token `on-surface-variant` y corregirlo a `#4B5563` si está mal mapeado — esto corregiría el color en todos los componentes que usen ese token.

---

## 18. Mejoras visuales aprobadas (Rediseño v1) — Agosto 2026

QA de la implementación actual reveló que el card, aunque correcto en estructura, carece de identidad visual. Se aprueba la siguiente mejora basada en el mockup `provider-card-redesign-v2.html`.

**Referencia visual:** `provider-card-redesign-v2.html` *(Eleven June Consulting, Agosto 2026)*

### 18.1 Accent bar lateral por service type

Agregar un div de 5-6px de ancho al inicio del card (antes de `.card-body`) con el color del `service_types[0]` del provider.

```jsx
// [CC-003 §18] Accent bar lateral — color según service type
const SERVICE_ACCENT_COLORS = {
  consulting:      'bg-blue-500',
  implementation:  'bg-teal-500',
  training:        'bg-violet-500',
  audit:           'bg-orange-500',
  logistics:       'bg-amber-500',
  marketing:       'bg-pink-500',
  facilities:      'bg-green-500',
}

// En el JSX del card, antes de card-body:
<div className={`w-1.5 flex-shrink-0 ${SERVICE_ACCENT_COLORS[provider.service_types?.[0]] || 'bg-gray-300'}`} />
```

### 18.2 Badges de service_type con color por categoría

Reemplazar el badge neutro (gris/azul navy) por badges con colores específicos por tipo.

```jsx
// [CC-003 §18] Badge colors por service_type
const SERVICE_BADGE_COLORS = {
  consulting:      'bg-blue-100 text-blue-800',
  implementation:  'bg-teal-100 text-teal-800',
  training:        'bg-violet-100 text-violet-800',
  audit:           'bg-orange-100 text-orange-800',
  logistics:       'bg-amber-100 text-amber-800',
  marketing:       'bg-pink-100 text-pink-800',
  facilities:      'bg-green-100 text-green-800',
}

// En el JSX:
{(provider.service_types || []).map(type => (
  <span key={type}
    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                ${SERVICE_BADGE_COLORS[type] || 'bg-gray-100 text-gray-700'}`}>
    {serviceTypeLabels[type] || type}
  </span>
))}
```

### 18.3 Panel derecho — fondo tintado + ícono con color

El panel derecho pasa de fondo blanco/neutro a un fondo sutilmente tintado con el color del service type primario. El ícono de edificio pasa de gris genérico a un cuadro con fondo y color del tipo.

```jsx
// [CC-003 §18] Panel derecho tintado
const SERVICE_PANEL_BG = {
  consulting:      'bg-blue-50',
  implementation:  'bg-teal-50',
  training:        'bg-violet-50',
  audit:           'bg-orange-50',
  logistics:       'bg-amber-50',
  marketing:       'bg-pink-50',
  facilities:      'bg-green-50',
}

const SERVICE_ICON_COLORS = {
  consulting:      'bg-blue-100 text-blue-600',
  implementation:  'bg-teal-100 text-teal-600',
  training:        'bg-violet-100 text-violet-600',
  audit:           'bg-orange-100 text-orange-600',
  logistics:       'bg-amber-100 text-amber-600',
  marketing:       'bg-pink-100 text-pink-600',
  facilities:      'bg-green-100 text-green-600',
}

const primaryType = provider.service_types?.[0]

// Panel derecho:
<div className={`flex-shrink-0 flex flex-col items-center p-4 gap-3
                 border-l border-gray-100
                 ${SERVICE_PANEL_BG[primaryType] || 'bg-gray-50'}`}
     style={{ width: '200px', minWidth: '200px' }}>

  {/* Ícono con color de categoría */}
  <div className={`w-14 h-14 rounded-xl flex items-center justify-center
                   ${SERVICE_ICON_COLORS[primaryType] || 'bg-gray-100 text-gray-500'}`}>
    <span className="material-symbols-outlined text-3xl">domain</span>
  </div>
```

### 18.4 Íconos de ubicación con color

Cambiar los íconos de `location_on` y `language` de gris neutro a colores que indican su función.

```jsx
// [CC-003 §18] Íconos de ubicación coloreados
// location_on → text-red-400 (pin de mapa)
// language    → text-teal-500 (globo = online)

{(provider.location || []).map(loc => (
  <span key={loc} className="flex items-center gap-1.5 text-sm text-gray-600">
    <span className="material-symbols-outlined text-base text-red-400">location_on</span>
    {locationLabels[loc] || loc}
  </span>
))}
{provider.operates_online && (
  <span className="flex items-center gap-1.5 text-sm text-gray-600">
    <span className="material-symbols-outlined text-base text-teal-500">language</span>
    Available online
  </span>
)}
```

### 18.5 "Available online" como status pill (estilo grants)

Opcional: si el provider es 100% online (sin ubicación física), mostrar como pill verde en lugar de solo texto.

```jsx
// [CC-003 §18] Status pill para providers solo-online
{provider.operates_online && (provider.location || []).length === 0 && (
  <span className="flex items-center gap-1.5 text-xs font-semibold
                   bg-green-100 text-green-700 px-3 py-1.5 rounded-full w-full justify-center">
    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
    Available online
  </span>
)}
```

### 18.6 Botón "Visit Website" en dorado (alineación con Grants)

Para unificar el lenguaje visual con los grants cards (que usan gold `#b58500`), cambiar el botón primario de navy a dorado.

```jsx
// [CC-003 §18] Botón Visit Website — dorado (alineación con Grants cards)
// ANTES: bg-[#003D7B] text-white
// DESPUÉS: bg-amber-400 text-gray-900 hover:bg-amber-500

<a className="w-full block text-center text-sm font-bold py-2 px-3 rounded
              bg-amber-400 text-gray-900 hover:bg-amber-500 transition-colors">
  Visit Website
  <span className="material-symbols-outlined text-xs ml-1 align-middle">open_in_new</span>
</a>
```

> **Nota CC-003 §13 update:** La columna "Color botón" de la tabla de comparación entre páginas debe actualizarse: Providers pasa de `Navy #003D7B` a `Gold #f59e0b` (amber-400), mismo lenguaje que Grants.

### 18.7 Resumen de cambios para Antigravity

| Elemento | Estado actual | Cambio requerido |
|----------|--------------|-----------------|
| Summary text color | Azul/teal (bug) | `text-gray-600` — fix urgente |
| Badge service_type | Gris neutro | Color según tipo (§18.2) |
| Accent bar | No existe | Div 6px color según tipo (§18.1) |
| Ícono de edificio | Gris genérico | Cuadro tintado con color del tipo (§18.3) |
| Ícono de ubicación | Gris | Pin rojo, globo teal (§18.4) |
| Fondo panel derecho | Blanco/gris neutro | Tinte sutil del color del tipo (§18.3) |
| Botón "Visit Website" | Navy `#003D7B` | Gold `amber-400` (§18.6) |

**Prioridad:** BUG-003 (summary color) es correctivo urgente. §18.1–18.6 son mejoras de diseño que pueden hacerse en un mismo PR.
