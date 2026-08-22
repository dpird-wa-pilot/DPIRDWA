# BUG-004: Coverage by Sector Table — Empty (Depends on BUG-003)

**Severity:** 🟡 **HIGH**  
**Status:** 🔴 **OPEN** (blocked by BUG-003)  
**Component:** CC-005 Consultant Dashboard — View 1  
**Assigned to:** Antigravity Development Lead  
**Created:** August 21, 2026  
**Reported by:** Eleven June Consulting QA  
**Related CC:** CC-005

---

## Summary

The "Coverage by Sector" table in CC-005 Dashboard View 1 renders with headers but **no data rows**. This is a direct consequence of BUG-003: because `diagnostic_sessions` records are never marked `status = 'completed'`, the query that powers this view returns an empty result set.

---

## Reproduction Steps

1. Navigate to `http://localhost:5173/consultant/dashboard`
2. Authenticate as consultant
3. Observe the **"Coverage by Sector"** table (View 1)
4. Table shows column headers: Sector, Sessions, Avg DML, Grants Matched, Providers Matched
5. **No data rows are rendered**

---

## Expected vs Actual

| State | Expected | Actual |
|-------|----------|--------|
| Coverage by Sector table | Rows per sector with session counts | Empty — no rows |
| Avg DML column | Decimal values per sector | — |
| Grants Matched column | Count per sector | — |

---

## Root Cause

This view depends on `diagnostic_sessions` filtered by `status = 'completed'`. Since BUG-003 means no sessions are ever marked completed, the join:

```javascript
// CC-005 View 1 query (from CC-005 spec):
const { data } = await supabase
  .from('diagnostic_sessions')
  .select(`
    id, sector_id, dml_level, total_score,
    sectors(name),
    match_results(grant_id, provider_id, match_score)
  `)
  .eq('status', 'completed');
```

...returns `[]`, and the groupBy/aggregation logic produces no rows for the table.

---

## Fix

This bug resolves **automatically** when BUG-003 is fixed. No changes are required to CC-005 View 1 code — the query logic is correct. Retest after BUG-003 fix is deployed.

---

## Related

- **BUG-003:** Root cause — sessions never marked completed (fix required there)

---

## Acceptance Criteria

- [ ] BUG-003 is resolved first
- [ ] Coverage by Sector table renders at least one row per sector with data
- [ ] Avg DML, Grants Matched, Providers Matched columns show non-zero values
