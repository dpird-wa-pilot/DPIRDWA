# CC-002 — Resources Page: Dynamic Data Integration
**Change Control ID:** CC-002  
**Document:** Technical Change Specification  
**Version:** 1.0  
**Fecha:** Agosto 2026  
**Status:** Pendiente  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementación)  
**Files affected:** `src/pages/Resources.jsx` · Supabase (tables `resources`, `resource_tags`, `match_results`)

---

## 1. Contexto y Objetivo

La página `Resources.jsx` actualmente muestra contenido con **datos hardcodeados**. El objetivo de este change control es:

1. **Crear en Supabase** las tablas `resources` y `resource_tags` (definidas en database-schema v2.0)
2. **Conectar la página** a esas tablas para que el contenido sea dinámico
3. **Configurar los filtros** relevantes para el catálogo de recursos (tipo de recurso, sector, nivel DML)
4. **Aplicar la política de acceso:** el botón siempre redirige a `library.dpird.wa.gov.au` — nunca a un PDF directo

La estructura visual de la página (layout de cards, panel de filtros) sigue el mismo patrón que `Grants.jsx`.

---

## 2. Resumen de Cambios

| Aspecto | Estado actual | Estado objetivo |
|---------|--------------|-----------------|
| Fuente de datos | Array hardcodeado en el componente | Query a tabla `resources` en Supabase |
| Tabla `resources` en BD | No existe | Crear con 23 columnas (ver sección 3) |
| Tabla `resource_tags` en BD | No existe | Crear junction table (ver sección 3) |
| Tipos de recursos | No diferenciados | 3 tipos: `book_chapter`, `journal_article`, `research_report` |
| Filtros disponibles | Sin filtros funcionales (o hardcodeados) | 4 filtros: Tipo de recurso, Industria, Nivel DML, Búsqueda |
| Botón de acceso | Sin comportamiento definido | Único botón "View in DPIRD Library" → abre `library_url` en nueva pestaña |
| URL destino | Hardcodeada o inexistente | Campo `library_url` de la tabla `resources` |
| `match_results` en BD | `result_type` solo acepta `grant` \| `provider` | Agregar `resource` al CHECK constraint (ver sección 3) |

---

## 3. Cambios en Base de Datos (Supabase)

### 3.1 Crear tabla `resources`

Ejecutar en el SQL Editor de Supabase:

```sql
CREATE TABLE resources (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad
  title                 text NOT NULL,
  slug                  text UNIQUE NOT NULL,
  resource_type         text NOT NULL CHECK (resource_type IN (
                          'book_chapter',
                          'journal_article',
                          'research_report'
                        )),

  -- Autoría
  authors               text[],
  author_affiliations   text[],

  -- Descripción
  abstract              text,
  summary               text,

  -- Publicación
  publication_date      date,
  publisher             text,
  journal_name          text,
  volume_issue          text,
  doi                   text,
  isbn                  text,
  report_number         text,

  -- Acceso — siempre vía biblioteca DPIRD
  library_url           text NOT NULL,

  -- Taxonomía dual
  raw_disciplines       text[],        -- taxonomía original de la biblioteca (no la usa el BFS)
  sector_tags           text[],        -- slugs de sectors
  trigger_tags          text[],        -- tags del sistema BFS (asignados manualmente)
  dml_levels            text[],        -- ['foundational','emerging','established','advanced']

  -- Admin
  is_featured           boolean DEFAULT false,
  is_active             boolean DEFAULT true,
  sort_order            integer DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

### 3.2 Crear tabla `resource_tags`

```sql
CREATE TABLE resource_tags (
  resource_id   uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id        uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY   (resource_id, tag_id)
);
```

### 3.3 Índices GIN para arrays

```sql
CREATE INDEX idx_resources_type          ON resources(resource_type);
CREATE INDEX idx_resources_is_active     ON resources(is_active);
CREATE INDEX idx_resources_trigger_tags  ON resources USING GIN(trigger_tags);
CREATE INDEX idx_resources_sector_tags   ON resources USING GIN(sector_tags);
CREATE INDEX idx_resources_dml_levels    ON resources USING GIN(dml_levels);
```

### 3.4 Trigger `updated_at`

```sql
CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

> Si la función `moddatetime` no existe en el proyecto, usar el mismo trigger pattern que ya se aplicó en `grants` y `providers`.

### 3.5 Row Level Security (RLS)

```sql
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Lectura pública (anon puede leer recursos activos)
CREATE POLICY "resources_public_read"
  ON resources FOR SELECT
  USING (is_active = true);

-- Solo admin puede modificar
CREATE POLICY "resources_admin_write"
  ON resources FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- resource_tags: lectura pública
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resource_tags_public_read"
  ON resource_tags FOR SELECT
  USING (true);
```

### 3.6 Actualizar `match_results` — agregar `'resource'` al CHECK

El campo `result_type` actual solo acepta `'grant'` y `'provider'`. Debe incluir `'resource'`.

**Opción A — Eliminar y recrear el constraint** (recomendada si la tabla está vacía o en staging):
```sql
ALTER TABLE match_results
  DROP CONSTRAINT match_results_result_type_check;

ALTER TABLE match_results
  ADD CONSTRAINT match_results_result_type_check
  CHECK (result_type IN ('grant', 'provider', 'resource'));
```

**Opción B — Si la tabla ya tiene datos en producción:**
```sql
-- Verificar nombre exacto del constraint primero:
SELECT conname FROM pg_constraint
WHERE conrelid = 'match_results'::regclass AND contype = 'c';

-- Luego ejecutar Opción A con el nombre correcto.
```

### 3.7 Columnas nuevas en `match_results`

La versión 2.0 del schema reemplaza `grant_id` / `provider_id` / `grant_or_provider_name` por un patrón genérico. Si la tabla `match_results` fue creada con el schema v1.0, ejecutar:

```sql
-- Agregar result_id genérico
ALTER TABLE match_results ADD COLUMN result_id uuid;
ALTER TABLE match_results ADD COLUMN result_name text;

-- Migrar datos existentes (si hay registros previos)
UPDATE match_results
  SET result_id = grant_id, result_name = (SELECT name FROM grants WHERE id = grant_id)
  WHERE result_type = 'grant' AND grant_id IS NOT NULL;

UPDATE match_results
  SET result_id = provider_id, result_name = (SELECT name FROM providers WHERE id = provider_id)
  WHERE result_type = 'provider' AND provider_id IS NOT NULL;

-- Marcar columnas antiguas como deprecated (no eliminar hasta confirmar migración)
-- ALTER TABLE match_results DROP COLUMN grant_id;
-- ALTER TABLE match_results DROP COLUMN provider_id;
-- ALTER TABLE match_results DROP COLUMN grant_or_provider_name;
```

> **Nota:** No eliminar las columnas antiguas hasta que el equipo de Antigravity confirme que ningún componente del frontend las referencia.

### 3.8 Seed de datos iniciales

Cargar los 15 recursos del prototipo desde el archivo `DPIRD_Database_Prototype_v2.xlsx`, hoja `resources`. El equipo técnico de DPIRD puede usar el **Supabase Table Editor** para importar el contenido fila por fila, o el equipo de Antigravity puede hacer el insert vía SQL exportado desde el Excel.

Los 15 recursos incluyen:
- 8 reales de la biblioteca DPIRD (libros técnicos, artículos sobre exportaciones WA, investigaciones agrícolas)
- 7 planificados enfocados en SME digitales (digital tools, export readiness, food safety, presencia digital rural)

---

## 4. Integración con Supabase (Aplicación)

### 4.1 Query principal

```js
const [resources, setResources] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select(`
        id, title, slug, resource_type,
        authors, summary, abstract,
        publication_date, publisher,
        journal_name, volume_issue, report_number,
        library_url,
        sector_tags, trigger_tags, dml_levels,
        is_featured, sort_order
      `)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('publication_date', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setResources(data)
    }
    setLoading(false)
  }
  fetchResources()
}, [])
```

> Solo se traen recursos con `is_active = true`. El orden prioriza featured, luego sort_order, luego más recientes.

---

## 5. Mapeo de Campos: BD → UI

| Campo BD (`resources`) | Uso en card | Notas |
|------------------------|-------------|-------|
| `title` | Título de la card (`<h2>`) | |
| `resource_type` | Badge de tipo | Ver tabla de labels y colores §5.1 |
| `authors` | Subtítulo de la card | Mostrar primeros 2 autores. Si hay más: "+ N more" |
| `publication_date` | Año de publicación | Mostrar solo el año: `new Date(date).getFullYear()` |
| `summary` | Descripción truncada (3 líneas) | Si `summary` es null, usar los primeros 200 chars del `abstract` |
| `journal_name` | Detalle secundario | Solo si `resource_type = 'journal_article'` |
| `report_number` | Detalle secundario | Solo si `resource_type = 'research_report'` |
| `sector_tags` | Badge de industria | Primer elemento del array → label legible (mismo mapping que Grants) |
| `dml_levels` | Badge de nivel DML | Primer elemento del array → label (§5.2) |
| `library_url` | Destino del botón "View in DPIRD Library" | Siempre nueva pestaña. Nunca construir URL alternativa. |
| `is_featured` | Posición destacada en grid | Featured resources aparecen primero |

### 5.1 Labels y colores por `resource_type`

| DB value | UI label | Color badge sugerido |
|----------|---------|---------------------|
| `book_chapter` | Book / Chapter | Azul claro (`bg-blue-100 text-blue-800`) |
| `journal_article` | Journal Article | Violeta (`bg-purple-100 text-purple-800`) |
| `research_report` | Research Report | Verde (`bg-green-100 text-green-800`) |

### 5.2 Labels por `dml_levels`

| DB value | UI label |
|----------|---------|
| `foundational` | Foundational |
| `emerging` | Emerging |
| `established` | Established |
| `advanced` | Advanced |

Si el array tiene múltiples valores, mostrar el rango: `"Foundational – Emerging"`.

### 5.3 Formateo de autores

```js
const formatAuthors = (authors) => {
  if (!authors || authors.length === 0) return 'DPIRD Western Australia'
  if (authors.length <= 2) return authors.join(', ')
  return `${authors[0]}, ${authors[1]} +${authors.length - 2} more`
}
```

---

## 6. Filtros

El panel de filtros tiene **4 grupos**, todos con comportamiento accordion (mismo patrón que Grants).

**Estado por defecto al cargar:**
- "Resource Type" → expandido
- "Industry" → expandido
- "Digital Maturity Level" → colapsado
- Búsqueda → siempre visible (no es accordion)

---

### 6.0 Comportamiento accordion

Mismo patrón implementado en Grants: cabecera clickeable, chevron que rota 180°, badge de conteo cuando hay selecciones activas y el grupo está colapsado, "Clear all filters" cuando hay al menos un filtro activo.

```js
const [openSections, setOpenSections] = useState({
  resource_type: true,
  industry: true,
  dml_level: false,
})

const toggleSection = (key) =>
  setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
```

---

### 6.1 Búsqueda (keyword)

Busca contra `title`, `summary` y `authors`:

```js
const searchMatch =
  resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (resource.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
  (resource.authors || []).some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
```

---

### 6.2 Tipo de Recurso

**Campo BD:** `resource_type` (text)

Opciones fijas (no dinámicas — siempre hay exactamente 3 tipos):

```js
const [selectedTypes, setSelectedTypes] = useState([])

const resourceTypeOptions = [
  { value: 'book_chapter',    label: 'Book / Chapter' },
  { value: 'journal_article', label: 'Journal Article' },
  { value: 'research_report', label: 'Research Report' },
]
```

Lógica: mostrar resource si su `resource_type` está entre los seleccionados. Sin selección = mostrar todos.

---

### 6.3 Industria

**Campo BD:** `sector_tags` (text[])

Igual que en Grants — extraídas dinámicamente de los recursos cargados:

```js
const availableIndustries = useMemo(() => {
  const slugs = new Set()
  resources.forEach(r => (r.sector_tags || []).forEach(s => slugs.add(s)))
  return Array.from(slugs).sort()
}, [resources])
```

Lógica: OR — mostrar si `sector_tags` contiene al menos uno de los seleccionados. Sin selección = mostrar todos.

Labels: mismo `sectorLabels` mapping de la página Grants.

---

### 6.4 Nivel de Madurez Digital (DML)

**Campo BD:** `dml_levels` (text[])

```js
const dmlOptions = [
  { value: 'foundational', label: 'Foundational (0–24)' },
  { value: 'emerging',     label: 'Emerging (25–49)' },
  { value: 'established',  label: 'Established (50–74)' },
  { value: 'advanced',     label: 'Advanced (75–100)' },
]
```

Lógica: mostrar resource si su `dml_levels` array contiene al menos uno de los seleccionados. Sin selección = mostrar todos.

---

### 6.5 Lógica combinada de filtros

```js
const filteredResources = useMemo(() => {
  return resources.filter(r =>
    matchesSearch(r, searchQuery) &&
    matchesType(r, selectedTypes) &&
    matchesIndustry(r, selectedIndustries) &&
    matchesDml(r, selectedDmlLevels)
  )
}, [resources, searchQuery, selectedTypes, selectedIndustries, selectedDmlLevels])
```

AND entre grupos, OR dentro de cada grupo.

---

## 7. Diseño de la Card

Seguir el mismo patrón visual que las cards de Grants. Diferencias específicas para resources:

### 7.1 Estructura de la card

```
┌─────────────────────────────────────────────┐
│  [BADGE tipo]  [BADGE industria]             │
│                                              │
│  Título del recurso (2 líneas máx)           │
│  Autores · Año de publicación                │
│                                              │
│  Summary (3 líneas truncadas)                │
│                                              │
│  [BADGE DML nivel]                           │
│  Journal: Journal of X, Vol. Y / Rpt #Z     │
│─────────────────────────────────────────────│
│  [ View in DPIRD Library  ↗ ]               │
└─────────────────────────────────────────────┘
```

### 7.2 Botón de acceso

**Un único botón** por card. Siempre visible. Siempre activo (todos los resources tienen `library_url`).

```jsx
<a
  href={resource.library_url}
  target="_blank"
  rel="noopener noreferrer"
  className="w-full block text-center font-label-md text-label-md py-2 px-4
             rounded font-bold shadow-sm transition-colors
             bg-[#003D7B] text-white hover:bg-[#002a57] cursor-pointer"
>
  View in DPIRD Library
  <span className="material-symbols-outlined text-sm ml-1 align-middle">open_in_new</span>
</a>
```

> Color primario DPIRD navy (`#003D7B`) — diferencia visual respecto al botón gold de Grants.

**Política crítica:** Nunca construir una URL a un PDF directamente. El campo `library_url` es la única URL autorizada. Si por error el campo apuntara a un PDF, el componente igual lo usa — la política de redirección es responsabilidad del contenido cargado en BD, no del código.

---

## 8. Estados de Carga y Error

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
      <p className="font-body-md">Could not load resources. Please try again.</p>
    </div>
  )
}

if (filteredResources.length === 0) {
  return (
    <div className="text-center py-2xl">
      <span className="material-symbols-outlined text-on-surface-variant text-5xl">
        search_off
      </span>
      <p className="font-body-lg text-on-surface-variant mt-md">
        No resources match your current filters.
      </p>
      <button onClick={clearAllFilters} className="text-primary font-label-md mt-sm hover:underline">
        Clear all filters
      </button>
    </div>
  )
}
```

---

## 9. Conteo de resultados

Mostrar el conteo de resultados filtrados en el encabezado del grid:

```jsx
<p className="font-body-sm text-on-surface-variant mb-md">
  Showing {filteredResources.length} of {resources.length} resources
</p>
```

---

## 10. Lo que NO cambia

- Estructura visual de la página (hero section, layout del grid, panel izquierdo de filtros)
- Panel "Need Help?" (sidebar derecho, si existe)
- Número de columnas del grid según breakpoint
- Estilos Tailwind existentes
- Componentes de navegación y footer

---

## 11. Resumen de Dependencias por Orden de Ejecución

Las tareas de base de datos deben completarse **antes** que las tareas de aplicación.

```
FASE 1 — BASE DE DATOS (Supabase)
─────────────────────────────────────────────────────
 1. Crear tabla resources (§3.1)
 2. Crear tabla resource_tags (§3.2)
 3. Crear índices GIN (§3.3)
 4. Crear trigger updated_at (§3.4)
 5. Configurar RLS policies (§3.5)
 6. Actualizar CHECK constraint en match_results (§3.6)
 7. Agregar columnas result_id / result_name a match_results (§3.7)
 8. Cargar seed de 15 recursos desde el Excel v2 (§3.8)

FASE 2 — APLICACIÓN (Resources.jsx)
─────────────────────────────────────────────────────
 9.  Configurar query Supabase (§4.1)
10. Implementar mapeo de campos BD → UI (§5)
11. Implementar 4 grupos de filtros con accordion (§6)
12. Implementar card con botón "View in DPIRD Library" (§7)
13. Implementar estados loading / error / empty (§8)
14. Agregar conteo de resultados (§9)

FASE 3 — INTEGRACIÓN CON MATCHING ENGINE (futuro)
─────────────────────────────────────────────────────
15. El motor BFS ya puede escribir a match_results con result_type = 'resource'
    usando result_id → uuid del resource recomendado
    y result_name → resource.title
    (no requiere cambios adicionales en la BD una vez completada Fase 1)
```

---

## 12. Checklist de Entrega para Antigravity

### Base de Datos
- [ ] Tabla `resources` creada con todas las columnas
- [ ] Tabla `resource_tags` creada
- [ ] Índices GIN creados en `trigger_tags`, `sector_tags`, `dml_levels`
- [ ] Trigger `updated_at` activo en `resources`
- [ ] RLS habilitado: lectura pública (anon), escritura solo admin
- [ ] CHECK constraint de `match_results.result_type` actualizado para incluir `'resource'`
- [ ] Columnas `result_id` y `result_name` existentes en `match_results`
- [ ] 15 recursos de seed cargados desde DPIRD_Database_Prototype_v2.xlsx (hoja `resources`)
- [ ] Los 15 registros de `resource_tags` correspondientes cargados (hoja `resource_tags`)

### Aplicación
- [ ] Datos cargados dinámicamente desde Supabase (sin errores en consola)
- [ ] Solo recursos con `is_active = true` aparecen en la página
- [ ] Panel de filtros renderiza 4 grupos (Resource Type, Industry, DML, Search)
- [ ] Cada grupo se expande y colapsa independientemente al hacer clic en el header
- [ ] Chevron rota 180° al expandir
- [ ] Estado por defecto: Resource Type + Industry expandidos, DML colapsado
- [ ] Las selecciones activas se mantienen al colapsar un grupo
- [ ] Badge de conteo aparece en grupos colapsados con selecciones
- [ ] "Clear all filters" visible cuando hay al menos un filtro activo
- [ ] Filtro "Resource Type" funciona con los 3 valores
- [ ] Filtro "Industry" muestra sectores reales de la BD (dinámico desde `sector_tags`)
- [ ] Filtro "DML" funciona con los 4 niveles
- [ ] Búsqueda filtra por `title`, `summary` y `authors`
- [ ] Lógica combinada: AND entre grupos, OR dentro de cada grupo
- [ ] Cards muestran: título, tipo (badge), autores, año, summary truncado, sector, DML
- [ ] Botón "View in DPIRD Library" abre `library_url` en nueva pestaña
- [ ] Botón usa color navy DPIRD (`#003D7B`), diferente al gold de Grants
- [ ] Estado de loading (spinner) visible mientras carga Supabase
- [ ] Estado de error visible si falla la query
- [ ] Estado vacío con "No resources match" + "Clear all filters" si no hay resultados
- [ ] Conteo "Showing X of Y resources" visible sobre el grid
- [ ] Probado con datos reales de la tabla `resources` en Supabase

---

## 13. Diferencias Clave respecto a Grants.jsx

| Aspecto | Grants.jsx | Resources.jsx |
|---------|-----------|---------------|
| Tipos de item | Grants (monetary, advisory…) | Book chapters, Journal articles, Reports |
| Color del botón | Gold / Amber (`#b58500`) | Navy DPIRD (`#003D7B`) |
| Filtros específicos | Business Stage, Business Structure, Support Type, Status, Indigenous, Objectives | DML Level, Resource Type |
| Filtros compartidos | Industry, Search | Industry, Search |
| URL destino | `grants.url` (programa oficial) | `resources.library_url` (siempre biblioteca DPIRD) |
| Fecha mostrada | Open date / Close date (rango) | Solo año de publicación |
| Metadatos secundarios | Monto ($min – $max), Administering body | Autores, journal/report number |
| Estado del item | `open / closed / ongoing / coming_soon` | Solo `is_active` (sin states visibles) |
| Imágenes | Pool Unsplash por `id % pool` | Ícono por tipo de recurso (book, article, report) — no imágenes |

---

## 14. Dependencias Técnicas

- `@supabase/supabase-js` — ya instalado si Grants.jsx está funcionando
- Variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — ya configuradas
- Material Symbols (`open_in_new`, `expand_more`, `search_off`, `progress_activity`) — ya disponibles
- No se requieren nuevas dependencias npm
