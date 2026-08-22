# DPIRD Digital Advisory Platform — Change Control Index
**Proyecto:** DPIRD Digital Advisory Platform  
**Cliente:** Department of Primary Industries and Regional Development — Western Australia  
**Preparado por:** Eleven June Consulting  
**Para:** Antigravity (implementación)  
**Última actualización:** Agosto 22, 2026

---

## Cómo usar este índice

Este archivo es el **registro central** de todos los change controls del proyecto. Cada cambio técnico aprobado recibe un ID único (`CC-XXX`) que:

1. **Identifica el documento** que describe el cambio en detalle
2. **Se anota en el código** como comentario en los bloques afectados
3. **Permite trazabilidad** entre decisiones de diseño y código implementado

---

## Convención de comentarios en código

Todo bloque de código que implementa un change control debe incluir un comentario con el ID correspondiente en la línea inmediatamente anterior al bloque:

```js
// [CC-001] Supabase integration — replace hardcoded grantsData array
const { data, error } = await supabase.from('grants').select(...)
```

```jsx
{/* [CC-001] Card button — single "Check Details" replacing dual buttons */}
<a href={grant.url} target="_blank" ...>Check Details</a>
```

**Reglas:**
- Un mismo bloque puede referenciar solo un CC (elegir el más específico)
- El comentario va en la línea inmediata anterior
- En JS/JSX: usar `// [CC-XXX]` o `{/* [CC-XXX] */}`

---

## Estados

| Estado | Significado |
|--------|------------|
| `Pendiente` | El documento está aprobado, Antigravity aún no implementó |
| `En progreso` | Antigravity está implementando actualmente |
| `Completado` | Implementado, revisado y cerrado |
| `Cancelado` | Cambio descartado — no implementar |

---

## Registro de Change Controls

| ID | Título | Archivo del documento | Archivos app afectados | Tablas BD afectadas | Estado | Fecha |
|----|--------|-----------------------|------------------------|---------------------|--------|-------|
| CC-001 | Grants Page — Dynamic Data Integration | `CC-001_grants-page-dynamic-integration.md` | `src/pages/Grants.jsx` · `src/lib/supabaseClient.js` | `grants` | ✅ Completado | Ago 2026 |
| CC-002 | Resources Page — Dynamic Data Integration | `CC-002_resources-page-integration.md` | `src/pages/Resources.jsx` | `resources` · `resource_tags` · `match_results` | Pendiente | Ago 2026 |
| CC-003 | Providers Page — New Page | `CC-003_providers-page.md` | `src/pages/Providers.jsx` *(nueva)* · `src/App.jsx` · NavBar | `providers` · `provider_tags` *(seed only)* | Pendiente | Ago 2026 |
| CC-004 | Advisor Page — Diagnostic Wizard & BFS Matching Engine | `CC-004_advisor-page.md` | `src/pages/Advisor.jsx` · `src/lib/matchingEngine.js` *(nuevo)* | `diagnostic_sessions` · `user_responses` · `match_results` · `questions` · `sectors` | Pendiente | Ago 2026 |
| CC-005 | Consultant Mode — Full Authentication & Advisor Dashboard | `CC-005_consultant-mode.md` | `src/pages/ConsultantDashboard.jsx` · `src/lib/auth.js` | `users` · `consultant_assignments` | Pendiente | Ago 2026 |
| CC-006 | Session Completion & Knowledge Graph Fix | `CC-006_advisor_recommendations.md` · `CC-006_session-completion-and-knowledge-graph-fix.md` | `src/pages/SessionDetail.jsx` · `src/lib/sessionService.js` | `diagnostic_sessions` · `match_results` | Pendiente | Ago 2026 |
| CC-007 | Session Detail — Knowledge Graph Visualization | `CC-007_session-detail-knowledge-graph.md` | `src/pages/SessionDetail.jsx` *(nueva)* · `src/lib/knowledgeGraph.js` *(nueva)* · `src/styles/knowledge-graph.css` *(nueva)* · `src/App.jsx` | `diagnostic_sessions` · `match_results` · `grants` · `resources` · `providers` | Pendiente | Ago 2026 |
| CC-008 | Chatbot MVP — Direct Gemini Integration | `CC-008_chatbot-gemini-integration.md` | `src/components/Chatbot.jsx` *(actualizar)* · `api/chat.js` *(nuevo)* · `package.json` | *Ninguna* (sin cambios DB) | ⏳ En progreso | Ago 22, 2026 |

---

## Próximos change controls previstos

Los siguientes cambios están identificados pero aún no tienen documento formal:

| ID reservado | Descripción tentativa | Dependencia |
|--------------|----------------------|-------------|
| CC-009 | Chatbot RAG Enhancement — Vector search + document indexing | Depende de CC-008 MVP |
| CC-010 | Chatbot Analytics — tracking de preguntas frecuentes | Depende de CC-008 MVP |
| CC-011 | Email Report — envío de resultados por email al SME | Depende de CC-006 |
| CC-012 | Analytics Engine — tracking y reporting de sesiones | Depende de CC-007 |

---

## Estructura de carpetas

```
change_control/
  CHANGE_CONTROL_INDEX.md                                  ← este archivo (índice maestro)
  CC-001_grants-page-dynamic-integration.md
  CC-002_resources-page-integration.md
  CC-003_professional-services-page.md
  CC-003_providers-page.md
  CC-004_advisor-page.md
  CC-005_consultant-mode.md
  CC-006_advisor_recommendations.md
  CC-006_session-completion-and-knowledge-graph-fix.md
  CC-007_session-detail-knowledge-graph.md
  CC-008_chatbot-gemini-integration.md                      ← nuevo (Aug 22, 2026)
  BUG-*.md                                                 ← bug reports
```

---

## Cómo agregar un nuevo CC

1. Asignar el próximo ID correlativo (`CC-009`, etc.)
2. Crear el documento siguiendo la estructura de CC-001 o CC-002
3. Agregar una fila a la tabla "Registro" arriba
4. Notificar a Antigravity con el documento

---

## Cambios recientes (Último 7 días)

| Fecha | ID | Título | Preparado por |
|-------|----|------------|---------------|
| Ago 22, 2026 | CC-008 | Chatbot MVP — Direct Gemini Integration | Claude Cowork |
| Ago 22, 2026 | CC-007 | Session Detail — Knowledge Graph Visualization | Antigravity Dev |

---

*Este índice debe mantenerse actualizado a medida que Antigravity implementa y cierra cada change control.*
