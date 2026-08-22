# BUG-008: Tags Displayed as Slugs Instead of Human-Readable Labels

**Severity:** 🟢 **LOW**  
**Status:** 🔴 **OPEN**  
**Component:** CC-005 — SessionDetail.jsx / Dashboard Views  
**Assigned to:** Antigravity Development Lead  
**Created:** August 21, 2026  
**Reported by:** Eleven June Consulting QA  
**Related CC:** CC-005

---

## Summary

Throughout the Consultant Dashboard, tags are rendered using their database slug format (e.g., `quality_control`, `export_ready`, `digital_adoption`) instead of their human-readable labels stored in `tags.label` (e.g., "Quality Control", "Export Ready", "Digital Adoption"). This makes the interface harder to read for consultants.

---

## Reproduction Steps

1. Navigate to any view in the Consultant Dashboard that displays matched tags or activated tags
2. Observe tags rendered as lowercase underscored identifiers
3. Compare against `tags` table: each row has both `name` (slug) and `label` (human-readable)

---

## Example

| Database Field | Value | Displayed (Bug) | Expected |
|---------------|-------|-----------------|----------|
| `tags.name` | `quality_control` | quality_control | — |
| `tags.label` | `Quality Control` | — | **Quality Control** |
| `tags.name` | `digital_adoption` | digital_adoption | — |
| `tags.label` | `Digital Adoption` | — | **Digital Adoption** |

---

## Root Cause

Components displaying tags reference `tag.name` (the slug) instead of `tag.label`. This happens when:

1. Tags are stored as plain string arrays (`activated_tags text[]`, `matched_tags text[]`) containing slug values
2. The display layer renders these slug strings directly without a lookup to the `tags` table

---

## Fix

**Option A — Lookup at render time (recommended for small tag sets):**

```javascript
// In the component that displays tags, load the tags lookup once:
const [tagsMap, setTagsMap] = useState({});

useEffect(() => {
  supabase
    .from('tags')
    .select('name, label')
    .then(({ data }) => {
      const map = {};
      data.forEach(t => { map[t.name] = t.label; });
      setTagsMap(map);
    });
}, []);

// When rendering a tag slug:
const displayTag = (slug) => tagsMap[slug] || slug; // fallback to slug if not found
```

**Option B — Resolve labels in the Supabase query:**

If tags are already joined through `question_tags → tags` or `match_results → tags`, ensure `label` is selected:
```javascript
.select('tags(name, label)')
// Then render: tag.label instead of tag.name
```

**Option C — Utility formatter (quick fix):**

```javascript
// Simple slug-to-title formatter as fallback:
const slugToLabel = (slug) =>
  slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
// 'quality_control' → 'Quality Control'
```
Note: Option C doesn't use real labels from the DB — use only as temporary fallback.

---

## Affected Areas

- Session Detail view — "Activated Tags" list
- Match Results — "Matched Tags" chips
- View 8 (Diagnostic Coverage) — tag frequency chart axis labels

---

## Acceptance Criteria

- [ ] All tag displays show `tags.label` (human-readable) not `tags.name` (slug)
- [ ] Tags with no matching label in DB gracefully fall back to capitalized slug
- [ ] No additional DB queries per tag (batch lookup or join)
