# CC-003 — Professional Services Page: New Page Implementation
**Change Control ID:** CC-003  
**Document:** Technical Change Specification  
**Version:** 1.0  
**Date:** Agosto 2026  
**Status:** Pendiente  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementación)  
**Files affected:** `src/pages/ProfessionalServices.jsx` *(nueva)* · `src/App.jsx` o router · `src/components/NavBar.jsx`  
**DB tables affected:** `providers` *(seed de datos — no se crean nuevas tablas)*  
**Depends on:** Database schema v2.0 (tabla `providers` ya definida)  
**Reference:** DPIRD Food & Beverage Professional Service Provider Directory — https://www.dpird.wa.gov.au/online-tools/food-and-beverage-directory/

---

## 1. Contexto y Objetivo

Crear una **nueva página** llamada "Professional Services" que muestre el directorio de proveedores de servicios pre-aprobados por DPIRD, replicando la estructura del directorio público de DPIRD pero integrada con la base de datos de la plataforma.

La página sigue el mismo patrón visual que `Resources.jsx` (grid de cards + panel de filtros izquierdo). Los datos se extraen de la tabla `providers` en Supabase.

**Datos de prototipo:** 7 providers cargados desde `DPIRD_Database_Prototype_v2.xlsx` (hoja `providers`). Cuando DPIRD entregue la lista oficial, se cargan en Supabase sin cambios de código.

---

## 2. Resumen de Cambios

| Aspecto | Estado actual | Estado objetivo |
|---------|--------------|-----------------|
| Página Professional Services | No existe | Nueva página `ProfessionalServices.jsx` |
| Fuente de datos | — | Query a tabla `providers` en Supabase |
| Navegación | Ítem inexistente o placeholder | Ítem "Professional Services" activo en NavBar |
| Ruta | — | `/professional-services` |
| Filtros | — | 4 filtros: Búsqueda, Tipo de Servicio, Industria, Ubicación |
| CTA de card | — | Botón "Visit Website" → abre `providers.website` en nueva pestaña |
| Seed de datos | Tabla `providers` vacía en Supabase | 7 providers cargados desde el Excel v2 |

---

## 3. Cambios en Base de Datos (Supabase)

### 3.1 No se crean nuevas tablas

La tabla `providers` ya fue definida en el database schema v2.0. Solo se requiere:
1. Confirmar que la tabla existe con todas sus columnas
2. Cargar el seed de 7 providers
3. Cargar las relaciones en `provider_tags`

### 3.2 Seed de datos — 7 providers del prototipo

Cargar desde `DPIRD_Database_Prototype_v2.xlsx`, hoja `providers`. Los 7 providers prototipo son:

| Nombre | Tipo de servicio | Sector | Ubicación |
|--------|-----------------|--------|-----------|
| Digital Farm Solutions | implementation, consulting | agriculture, food_beverage | regional_wa, metro_wa |
| FoodTech WA | consulting, training | food_beverage, food_manufacturing | metro_wa |
| AgriDigital Consulting | consulting, audit | agriculture, horticulture | regional_wa |
| WA Export Advisory | consulting | food_beverage, agriculture | metro_wa, national |
| Regional Business Hub | training, consulting | retail, professional_services | regional_wa |
| Cybersafe Business | consulting, audit | all sectors | metro_wa, national |
| Supply Chain Pro | implementation, consulting | agriculture, food_beverage | metro_wa, regional_wa |

### 3.3 Seed de `provider_tags`

Cargar también desde hoja `provider_tags` del Excel v2. Esta tabla vincula cada provider con sus tags del sistema BFS.

### 3.4 RLS policies para `providers`

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

## 4. Nueva Ruta y Navegación

### 4.1 Agregar ruta en el router

```jsx
// En src/App.jsx (o donde esté el router configurado)
import ProfessionalServices from './pages/ProfessionalServices'

// Dentro del <Routes>:
// [CC-003] Nueva ruta Professional Services
<Route path="/professional-services" element={<ProfessionalServices />} />
```

### 4.2 Actualizar NavBar

Agregar el ítem de navegación. Verificar si ya existe como placeholder y activarlo, o crearlo:

```jsx
// [CC-003] Ítem Professional Services en NavBar
<NavLink to="/professional-services">Professional Services</NavLink>
```

---

## 5. Integración con Supabase

### 5.1 Query principal

```js
// [CC-003] Supabase query — providers activos y aprobados por DPIRD
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
        service_types, sector_tags, dml_levels,
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

> Solo se muestran providers con `status = 'active'`. Providers con `status = 'inactive'` o `'pending_review'` no aparecen en la página pública.

---

## 6. Mapeo de Campos: BD → UI

| Campo BD (`providers`) | Uso en card | Notas |
|------------------------|-------------|-------|
| `name` | Título de la card (`<h2>`) | |
| `summary` | Descripción truncada (3 líneas) | Si `summary` es null, usar `description` |
| `service_types` | Badges de tipo de servicio | Mostrar todos los badges (máx. 3; el resto como "+N") |
| `sector_tags` | Badge de industria | Primer elemento → label legible |
| `location` | Badge de ubicación | Mostrar todos los valores del array |
| `dpird_approved` | Badge "DPIRD Approved" | Solo visible si `dpird_approved = true` |
| `operates_online` | Ícono/texto "Online available" | Solo si `operates_online = true` |
| `website` | Destino del botón "Visit Website" | Nueva pestaña. Disabled si null. |
| `email` | Link secundario "Contact" | Abre `mailto:`. Oculto si null. |
| `logo_url` | Imagen/logo de la card | Si null, usar ícono genérico de provider |
| `is_featured` | Posición destacada en grid | Featured providers aparecen primero |

### 6.1 Labels por `service_types`

| DB value | UI label |
|----------|---------|
| `implementation` | Implementation |
| `consulting` | Consulting |
| `training` | Training |
| `audit` | Audit & Review |

### 6.2 Labels por `location`

| DB value | UI label |
|----------|---------|
| `metro_wa` | Metro WA |
| `regional_wa` | Regional WA |
| `national` | National |
| `remote` | Remote WA |

---

## 7. Filtros

Panel de filtros con **4 grupos** — accordion independiente, mismo patrón que Grants y Resources.

**Estado por defecto al cargar:**
- "Service Type" → expandido
- "Industry" → expandido
- "Location" → colapsado
- Búsqueda → siempre visible

### 7.0 Estado accordion

```js
// [CC-003] Accordion state — Professional Services filters
const [openSections, setOpenSections] = useState({
  service_type: true,
  industry:     true,
  location:     false,
})

const toggleSection = (key) =>
  setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
```

### 7.1 Búsqueda (keyword)

```js
const searchMatch =
  provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (provider.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
```

### 7.2 Tipo de Servicio

**Campo BD:** `service_types` (text[])

Opciones fijas:

```js
const serviceTypeOptions = [
  { value: 'implementation', label: 'Implementation' },
  { value: 'consulting',     label: 'Consulting' },
  { value: 'training',       label: 'Training' },
  { value: 'audit',          label: 'Audit & Review' },
]
```

Lógica: mostrar provider si su `service_types` contiene al menos uno de los seleccionados (OR). Sin selección = mostrar todos.

### 7.3 Industria

**Campo BD:** `sector_tags` (text[])

Extraídas dinámicamente de los providers cargados:

```js
const availableIndustries = useMemo(() => {
  const slugs = new Set()
  providers.forEach(p => (p.sector_tags || []).forEach(s => slugs.add(s)))
  return Array.from(slugs).sort()
}, [providers])
```

Mismo `sectorLabels` mapping que en Grants y Resources.

### 7.4 Ubicación

**Campo BD:** `location` (text[])

Opciones fijas:

```js
const locationOptions = [
  { value: 'metro_wa',    label: 'Metro WA' },
  { value: 'regional_wa', label: 'Regional WA' },
  { value: 'national',    label: 'National' },
  { value: 'remote',      label: 'Remote WA' },
]
```

Lógica: mostrar provider si su `location` contiene al menos uno de los seleccionados (OR). Sin selección = mostrar todos.

> **Nota:** Providers con `operates_online = true` son accesibles desde cualquier ubicación. Si el usuario filtra por "Regional WA" y el provider solo tiene `location: ['metro_wa']` pero `operates_online = true`, mostrarlo igual.

```js
// [CC-003] Location filter — considera operates_online como cobertura universal
const matchesLocation = (provider, selectedLocations) => {
  if (selectedLocations.length === 0) return true
  if (provider.operates_online) return true
  return (provider.location || []).some(loc => selectedLocations.includes(loc))
}
```

### 7.5 Lógica combinada

```js
// [CC-003] Combined filter — AND entre grupos, OR dentro de cada grupo
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

## 8. Diseño de la Card

Mismo patrón visual que Resources. Diferencias específicas para providers:

### 8.1 Estructura

```
┌─────────────────────────────────────────────┐
│  [Logo / ícono provider]    [✓ DPIRD]        │
│                                              │
│  Nombre del provider                         │
│  [Badge servicio] [Badge servicio] [+N]      │
│                                              │
│  Summary (3 líneas truncadas)                │
│                                              │
│  📍 Metro WA · Regional WA  🌐 Online        │
│  🏭 Food & Beverage · Agriculture            │
│─────────────────────────────────────────────│
│  [ Visit Website ↗ ]   [ Contact → ]        │
└─────────────────────────────────────────────┘
```

### 8.2 Badge "DPIRD Approved"

```jsx
{/* [CC-003] DPIRD Approved badge — solo si dpird_approved = true */}
{provider.dpird_approved && (
  <span className="inline-flex items-center gap-1 text-xs font-semibold
                   bg-[#003D7B] text-white px-2 py-0.5 rounded-full">
    <span className="material-symbols-outlined text-xs">verified</span>
    DPIRD Approved
  </span>
)}
```

### 8.3 Botones de acción

```jsx
{/* [CC-003] Primary CTA — Visit Website */}
<a
  href={provider.website || '#'}
  target="_blank"
  rel="noopener noreferrer"
  onClick={!provider.website ? (e) => e.preventDefault() : undefined}
  className={`flex-1 block text-center font-label-md py-2 px-4 rounded
              font-bold shadow-sm transition-colors
    ${provider.website
      ? 'bg-[#003D7B] text-white hover:bg-[#002a57] cursor-pointer'
      : 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-50'
    }`}
>
  Visit Website
  <span className="material-symbols-outlined text-sm ml-1 align-middle">open_in_new</span>
</a>

{/* [CC-003] Secondary CTA — Contact (solo si tiene email) */}
{provider.email && (
  <a
    href={`mailto:${provider.email}`}
    className="flex-1 block text-center font-label-md py-2 px-4 rounded
               font-bold border border-[#003D7B] text-[#003D7B]
               hover:bg-[#003D7B] hover:text-white transition-colors"
  >
    Contact
    <span className="material-symbols-outlined text-sm ml-1 align-middle">mail</span>
  </a>
)}
```

> El botón principal usa navy DPIRD (`#003D7B`), igual que Resources — diferente al gold de Grants.

### 8.4 Logo / imagen del provider

```jsx
{provider.logo_url ? (
  <img
    src={provider.logo_url}
    alt={provider.name}
    className="h-12 w-auto object-contain"
  />
) : (
  <span className="material-symbols-outlined text-4xl text-on-surface-variant">
    business
  </span>
)}
```

---

## 9. Hero Section

Siguiendo el mismo patrón que Grants y Resources:

```
Título:      Professional Services
Subtítulo:   Find DPIRD-approved service providers to help your business grow
Descripción: Connect with pre-approved consultants, trainers, and specialists
             across Western Australia — matched to your industry and needs.
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
      <p className="font-body-md">Could not load service providers. Please try again.</p>
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

- Layout general de la plataforma (NavBar, footer, design system)
- Estilos Tailwind existentes
- Tablas de base de datos (ninguna nueva — solo seed en `providers` y `provider_tags`)
- Páginas existentes (Grants, Resources, Home, etc.)

---

## 13. Diferencias clave respecto a Resources.jsx y Grants.jsx

| Aspecto | Grants.jsx | Resources.jsx | ProfessionalServices.jsx |
|---------|-----------|---------------|--------------------------|
| Fuente | `grants` | `resources` | `providers` |
| Color botón | Gold `#b58500` | Navy `#003D7B` | Navy `#003D7B` |
| Filtros únicos | Business Stage, Status, Indigenous | Resource Type, DML | Service Type, Location |
| Filtros compartidos | Industry, Search | Industry, Search | Industry, Search |
| URL destino | `grants.url` | `resources.library_url` | `providers.website` |
| Badge especial | Status (open/closed) | Resource type color | DPIRD Approved (verified) |
| Logo/imagen | Unsplash pool | Ícono por tipo | Logo del provider o ícono `business` |
| CTA secundario | — | — | Contact (`mailto:`) si hay email |
| Imagen de contacto | — | — | `operates_online` badge |

---

## 14. Orden de ejecución

```
FASE 1 — BASE DE DATOS
──────────────────────────────────────────
1. Confirmar que tabla `providers` existe (del schema v2.0)
2. Habilitar RLS policies en `providers` (§3.4)
3. Cargar seed de 7 providers desde Excel v2 (§3.2)
4. Cargar seed de `provider_tags` desde Excel v2 (§3.3)

FASE 2 — APLICACIÓN
──────────────────────────────────────────
5. Crear ProfessionalServices.jsx con query Supabase (§5)
6. Implementar mapeo de campos BD → UI (§6)
7. Implementar 4 filtros con accordion (§7)
8. Implementar card con logo, badges y botones (§8)
9. Implementar hero section (§9)
10. Implementar estados loading / error / empty (§10)
11. Agregar ruta /professional-services en el router (§4.1)
12. Activar ítem en NavBar (§4.2)
```

---

## 15. Checklist de Entrega para Antigravity

### Base de Datos
- [ ] RLS habilitado en `providers` (lectura pública, escritura solo admin)
- [ ] 7 providers cargados desde `DPIRD_Database_Prototype_v2.xlsx` (hoja `providers`)
- [ ] Registros de `provider_tags` cargados (hoja `provider_tags`)
- [ ] Query de prueba en Supabase devuelve los 7 providers activos

### Aplicación
- [ ] Ruta `/professional-services` registrada en el router
- [ ] Ítem "Professional Services" activo en NavBar
- [ ] Datos cargados dinámicamente desde Supabase (sin errores en consola)
- [ ] Solo providers con `status = 'active'` aparecen
- [ ] Hero section con título, subtítulo y descripción
- [ ] Panel de filtros renderiza 4 grupos (Search, Service Type, Industry, Location)
- [ ] Cada grupo accordion se expande/colapsa independientemente
- [ ] Chevron rota 180° al expandir
- [ ] Estado por defecto: Service Type + Industry expandidos, Location colapsado
- [ ] Selecciones activas se mantienen al colapsar un grupo
- [ ] Badge de conteo en grupos colapsados con selecciones activas
- [ ] "Clear all filters" visible cuando hay filtros activos
- [ ] Filtro "Service Type" funciona con los 4 valores
- [ ] Filtro "Industry" muestra sectores reales del BD (dinámico)
- [ ] Filtro "Location" funciona con los 4 valores + respeta `operates_online`
- [ ] Búsqueda filtra por `name` y `summary`
- [ ] Lógica combinada: AND entre grupos, OR dentro de cada grupo
- [ ] Cards muestran: nombre, logo/ícono, service badges, summary, ubicación, sector
- [ ] Badge "DPIRD Approved" visible solo si `dpird_approved = true`
- [ ] Botón "Visit Website" abre `website` en nueva pestaña
- [ ] Botón "Visit Website" deshabilitado si `website` es null
- [ ] Botón "Contact" visible solo si provider tiene `email`
- [ ] Estado loading (spinner) visible mientras carga
- [ ] Estado error visible si falla la query
- [ ] Estado vacío con "No providers match" + "Clear all filters"
- [ ] Conteo "Showing X of Y providers" visible sobre el grid
- [ ] Probado con los 7 providers reales en Supabase
- [ ] Código anotado con comentarios `// [CC-003]` en secciones clave

---

## 16. Nota sobre datos futuros

Los 7 providers actuales son datos de prototipo. Cuando DPIRD entregue la lista oficial del directorio (extraída de Power BI), se cargan directamente en la tabla `providers` en Supabase via Table Editor — **sin necesidad de cambios en el código**. El diseño de la página soporta cualquier cantidad de providers.
