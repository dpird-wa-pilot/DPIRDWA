# CC-006 — Session Completion & Knowledge Graph Fix
**Versión:** 1.0  
**Fecha:** August 21, 2026  
**Preparado por:** Eleven June Consulting  
**Destinatario:** Antigravity Development Lead  
**Estado:** 🔴 PENDIENTE DE IMPLEMENTACIÓN  
**Prioridad:** CRÍTICA  
**Bugs relacionados:** BUG-003, BUG-004, BUG-008

---

## 1. Contexto

Durante el QA del Consultant Dashboard (CC-005) se identificó que el dashboard muestra **Total Sessions: 0** a pesar de que existen registros en `match_results`. La causa raíz es que el Advisor Wizard (CC-004) **nunca actualiza** el campo `diagnostic_sessions.status` a `'completed'` al finalizar el flujo de diagnóstico.

Adicionalmente, se detectaron dos ajustes menores relacionados: el query del Knowledge Graph usa una columna que no existe en el schema, y los tags se renderizan como slugs en lugar de labels legibles.

---

## 2. Alcance

Este CC cubre tres ajustes en el código existente. **No agrega pantallas ni componentes nuevos.**

| # | Ajuste | Archivo | Bugs resueltos |
|---|--------|---------|----------------|
| 1 | Marcar sesión como `completed` al finalizar wizard | `Advisor.jsx` o equivalente | BUG-003, BUG-004 |
| 2 | Corregir query del Knowledge Graph | `SessionDetail.jsx` | — |
| 3 | Renderizar `tags.label` en lugar de `tags.name` | `SessionDetail.jsx`, componentes de dashboard | BUG-008 |

---

## 3. Ajuste 1 — Marcar sesión como `completed`

### 3.1 Problema

El campo `diagnostic_sessions.status` queda en `'in_progress'` indefinidamente. El Consultant Dashboard filtra por `status = 'completed'`, por lo que retorna cero sesiones.

### 3.2 Dónde aplicar

Localizar en el código del Advisor Wizard la función que se ejecuta al completar el diagnóstico. Existen **dos rutas** que deben cubrirse:

**Ruta A — Flujo normal:** El usuario responde todas las preguntas y hace clic en "Ver Resultados".

**Ruta B — Flujo parcial:** El usuario hace clic en "Ver Resultados de Todos Modos" sin completar todas las preguntas.

Ambas rutas deben ejecutar el update descrito en §3.3.

### 3.3 Código a agregar

Inmediatamente después del bloque que inserta en `match_results`, agregar:

```javascript
// Después del insert en match_results:
const { error: updateError } = await supabase
  .from('diagnostic_sessions')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', sessionId);

if (updateError) {
  console.error('Error marking session as completed:', updateError);
  // No interrumpir el flujo al usuario — loguear y continuar
}
```

> **Nota:** El update no debe interrumpir la experiencia del usuario si falla. Loguear el error y continuar mostrando los resultados igualmente.

### 3.4 Verificación

Después del deploy, ejecutar una sesión de prueba completa y confirmar en Supabase:

```sql
SELECT id, status, completed_at, created_at
FROM diagnostic_sessions
ORDER BY created_at DESC
LIMIT 5;
```

**Criterio de aceptación:**
- `status` = `'completed'`
- `completed_at` tiene un timestamp válido (no null)
- Aplica tanto para el flujo normal como para "Ver Resultados de Todos Modos"

---

## 4. Ajuste 2 — Corregir query del Knowledge Graph

### 4.1 Problema

En `SessionDetail.jsx`, el Knowledge Graph necesita cargar la relación entre preguntas y tags para construir los edges del grafo. El schema **no tiene** una columna `trigger_tags` en la tabla `questions`. Esa relación existe en la junction table `question_tags`.

Si el query actual es:
```javascript
// ❌ INCORRECTO — columna no existe
supabase.from('questions').select('id, trigger_tags')
```

Retornará error o campo vacío, y los edges pregunta↔tag no se renderizarán en el grafo.

### 4.2 Corrección

Reemplazar por el query correcto usando la junction table:

```javascript
// ✅ CORRECTO — usar junction table question_tags
const { data: questionTagsData } = await supabase
  .from('question_tags')
  .select(`
    question_id,
    tag_id,
    tags(name, label)
  `);
```

Este query retorna los pares `question_id ↔ tag` que permiten construir los edges del grafo de conocimiento.

### 4.3 Construcción de edges en el grafo

Con los datos de `question_tags`, los edges se construyen así:

```javascript
const questionTagEdges = questionTagsData.map(qt => ({
  source: `question-${qt.question_id}`,
  target: `tag-${qt.tag_id}`,
  type: 'activates'
}));
```

### 4.4 Verificación

Abrir el detalle de una sesión completada (disponible después del fix de §3) y confirmar que el grafo renderiza edges entre nodos de tipo "pregunta" y nodos de tipo "tag". Si los edges no aparecen, el query sigue incorrecto.

---

## 5. Ajuste 3 — Renderizar `tags.label` en lugar de `tags.name`

### 5.1 Problema

Los tags se muestran como slugs de base de datos (`quality_control`, `export_ready`) en lugar de sus labels legibles (`Quality Control`, `Export Ready`). La tabla `tags` tiene ambos campos:

| Campo | Valor | Uso correcto |
|-------|-------|--------------|
| `tags.name` | `quality_control` | Identificador interno — no mostrar al usuario |
| `tags.label` | `Quality Control` | Texto de display — usar siempre en UI |

### 5.2 Archivos afectados

- `SessionDetail.jsx` — lista de "Activated Tags" y nodos del Knowledge Graph
- Cualquier componente del dashboard que renderice `matched_tags` o `activated_tags`

### 5.3 Solución recomendada

**Opción A — Lookup map (recomendada):** Cargar todos los tags una vez y construir un mapa `name → label`:

```javascript
// Cargar una vez al montar el componente
const { data: allTags } = await supabase
  .from('tags')
  .select('name, label');

const tagsMap = {};
allTags.forEach(t => { tagsMap[t.name] = t.label; });

// Al renderizar cualquier tag slug:
const displayTag = (slug) => tagsMap[slug] || slug;
// 'quality_control' → 'Quality Control'
// Si no existe en el mapa, muestra el slug como fallback
```

**Opción B — Join en el query:** Si los tags ya vienen como join desde Supabase (ej: `question_tags → tags`), asegurarse de seleccionar `label` y usar `tag.label` en el render, no `tag.name`.

### 5.4 Nodos del Knowledge Graph

Los nodos de tipo "tag" en el grafo deben mostrar `tag.label` como su `name` en el objeto de nodo:

```javascript
// ✅ Correcto
{ id: `tag-${tag.name}`, name: tag.label, type: 'tag' }

// ❌ Incorrecto
{ id: `tag-${tag.name}`, name: tag.name, type: 'tag' }
```

### 5.5 Verificación

Abrir cualquier vista del dashboard que muestre tags y confirmar que aparecen en formato legible (primera letra mayúscula, palabras separadas por espacio). Ningún tag debe mostrar guion bajo.

---

## 6. Orden de implementación recomendado

```
1. Ajuste 1 (§3) — status: completed
   └─ Deploy + verificar en DB con SQL query
   └─ Ejecutar sesión de prueba completa

2. Ajuste 2 (§4) — Knowledge Graph query
   └─ Verificar edges pregunta↔tag en grafo
   └─ Requiere sesiones completadas del paso anterior

3. Ajuste 3 (§5) — tags.label
   └─ Verificar en dashboard y en nodos del grafo
   └─ Puede hacerse en paralelo con Ajuste 2
```

---

## 7. Archivos a modificar

| Archivo | Ajuste |
|---------|--------|
| `Advisor.jsx` (o el componente que maneja la finalización del wizard) | Agregar update `status = 'completed'` post-insert |
| `SessionDetail.jsx` | Corregir query `question_tags`, usar `tags.label` en nodos |
| Componentes del dashboard que rendericen tags | Usar `tagsMap[slug]` o `tag.label` |

> Antigravity debe confirmar el nombre exacto del archivo que contiene la lógica de finalización del wizard. En CC-004 se referenció como `Advisor.jsx`, pero puede estar en un archivo separado de lógica (ej: `useAdvisorSession.js`, `matchingEngine.js`).

---

## 8. Criterios de aceptación completos

- [ ] Ejecutar sesión de diagnóstico completa → `diagnostic_sessions.status = 'completed'` en DB
- [ ] Ejecutar sesión con "Ver Resultados de Todos Modos" → también marca `completed`
- [ ] Consultant Dashboard muestra Total Sessions > 0
- [ ] Coverage by Sector (View 1) muestra filas de datos
- [ ] Knowledge Graph en SessionDetail renderiza nodos y edges (incluidos pregunta↔tag)
- [ ] Todos los tags en dashboard y grafo muestran labels legibles (sin guion bajo)

---

## 9. Notas adicionales

- Este CC **no modifica** la lógica del BFS matching engine ni el schema de base de datos
- El campo `completed_at` en `diagnostic_sessions` ya existe en el schema — no requiere migración
- BUG-004 (Coverage by Sector vacío) se resolverá automáticamente con el Ajuste 1, sin trabajo adicional
- Priorizar Ajuste 1 ya que desbloquea las pruebas de los ajustes 2 y 3

---

**Preparado por:** Eleven June Consulting — QA Team  
**Fecha:** August 21, 2026
