# BUG-003: Diagnostic Sessions Not Marked as Completed

**Severity:** 🔴 **CRITICAL**  
**Status:** 🔴 **OPEN**  
**Component:** CC-004 Advisor Wizard / Consultant Dashboard  
**Assigned to:** Antigravity Development Lead  
**Created:** August 21, 2026  
**Reported by:** Eleven June Consulting QA  
**Related CC:** CC-004 (Advisor Wizard), CC-005 (Consultant Dashboard)

---

## Summary

The Consultant Dashboard (CC-005) shows **Total Sessions: 0** despite the platform having active match results. Network inspection confirms `diagnostic_sessions` records exist but none have `status = 'completed'`. Sessions remain in `status = 'in_progress'` even after the BFS matching engine runs and populates `match_results`.

This is the **root cause** for BUG-004 (empty sector coverage table) and blocks all dashboard metrics that depend on completed sessions.

---

## Reproduction Steps

1. Navigate to `http://localhost:5173/consultant/dashboard`
2. Authenticate as consultant (e.g., Sarah Mitchell — All WA, admin)
3. Observe **View 1**: "Total Sessions" metric shows **0**
4. Open browser DevTools → Network tab
5. Filter by `diagnostic_sessions`
6. Observe the request: `diagnostic_sessions?status=eq.completed&select=...`
7. Response returns HTTP 200 with **empty array `[]`**

---

## Expected vs Actual

| Metric | Expected | Actual |
|--------|----------|--------|
| Total Sessions | > 0 (e.g., 10+) | **0** |
| Sessions with Unmet Needs | Subset of total | 10 (data exists in match_results) |
| Coverage by Sector table | Populated rows | Empty |
| Network: `status=eq.completed` | Returns rows | Returns `[]` |

---

## Root Cause Analysis

In CC-004 (Advisor Wizard), when the user completes the wizard and the BFS engine generates `match_results`, the `diagnostic_sessions` record is **never updated** from `status = 'in_progress'` to `status = 'completed'`.

The schema (`01_schema.sql`) defines:
```sql
status text DEFAULT 'in_progress' CHECK (status IN (
  'in_progress',
  'completed',
  'abandoned'
)),
completed_at timestamptz,
```

The `completed_at` and `status` update is missing from the wizard's final submission logic.

---

## Evidence

- **Network request:** `GET /rest/v1/diagnostic_sessions?status=eq.completed` → HTTP 200, body `[]`
- **Indirect evidence:** `match_results` has data (Sessions with Unmet Needs = 10 renders correctly, sourced from match_results directly)
- **Schema confirmation:** `diagnostic_sessions.status` defaults to `'in_progress'`

---

## Fix Required (CC-004 — Advisor Wizard)

In the wizard's final step (after BFS matching completes and `match_results` are inserted), add the following Supabase update:

```javascript
// After match_results are inserted:
const { error } = await supabase
  .from('diagnostic_sessions')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString()
  })
  .eq('id', sessionId);
```

This should be called in the same transaction/sequence as `match_results` inserts.

---

## Impact

- 🔴 **Blocks** all CC-005 dashboard metrics that filter by `status = 'completed'`
- 🔴 **Blocks** BUG-004 (Coverage by Sector)
- 🟡 **Affects** Session List view (may show 0 sessions or only in-progress sessions)
- 🟡 **Affects** Knowledge Graph (no completed sessions to load)

---

## Related

- **BUG-004:** Empty sector coverage table (direct consequence)
- **CC-004:** Root cause is in the Advisor Wizard completion logic
- **CC-005 §4 View 1:** Dashboard query filters `status = 'completed'`

---

## Acceptance Criteria

- [ ] After completing a wizard session, `diagnostic_sessions.status` = `'completed'`
- [ ] `diagnostic_sessions.completed_at` is populated with a valid timestamp
- [ ] Dashboard "Total Sessions" > 0 after re-testing
- [ ] View 1 (Coverage by Sector) shows populated data
