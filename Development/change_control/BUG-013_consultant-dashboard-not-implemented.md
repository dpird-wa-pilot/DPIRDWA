# BUG-013: ConsultantDashboard Missing/Incomplete

**Date Reported:** August 21, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** OPEN (Ready for Implementation)  
**Component:** Consultant Mode → Main Dashboard  
**Route:** `/consultant/dashboard`  
**Spec Reference:** CC-005 §4  

---

## Summary

The ConsultantDashboard component (ConsultantDashboard.jsx) which displays 8 analytics views of completed diagnostic sessions has **not been implemented**. This is the core feature of the Consultant Mode analytics interface.

---

## What Needs to Be Implemented

### 1. File to Create
- **Path:** `src/pages/ConsultantDashboard.jsx`
- **Type:** React functional component (default export)
- **Route:** `/consultant/dashboard`
- **Protection:** Wrapped in ProtectedRoute

### 2. Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ TAB NAVIGATION                                          │
│ [Overview] [Opportunities]                              │
└─────────────────────────────────────────────────────────┘

TAB 1: OVERVIEW
┌──────────────────────────────────────────────────────┐
│ View 1: Coverage by Sector (Table)                  │
├──────────────────────────────────────────────────────┤
│ View 2: Top Grants & Trends (Bar Chart)             │
├──────────────────────────────────────────────────────┤
│ View 3: Resources Relevance (Bar Chart)              │
├──────────────────────────────────────────────────────┤
│ View 4: Unmet Needs (Cards)                          │
└──────────────────────────────────────────────────────┘

TAB 2: OPPORTUNITIES
┌──────────────────────────────────────────────────────┐
│ View 5: Tags Without Sufficient Coverage (Table)     │
├──────────────────────────────────────────────────────┤
│ View 6: Potential New Grants (Cards)                 │
├──────────────────────────────────────────────────────┤
│ View 7: Temporal Trends (Line Chart)                 │
├──────────────────────────────────────────────────────┤
│ View 8: Dimension Coverage (Bar Chart with Colors)   │
└──────────────────────────────────────────────────────┘

SIDEBAR: Session Summary
├─ In Progress: N
├─ Completed: N
└─ List of Completed Sessions (clickable)
```

### 3. Session Summary Section

**Display:**
- Count of "In Progress" sessions (status != 'completed')
- Count of "Completed" sessions (status = 'completed')
- List of completed sessions with:
  - Business name
  - Sector name
  - Completion date
  - Click → navigate to SessionDetail page

**Query:**
```javascript
const { data: sessions } = await supabase
  .from('diagnostic_sessions')
  .select(`id, business_name, created_at, completed_at, sectors(name)`)
  .order('completed_at', { ascending: false })
  .limit(20)
```

### 4. 8 Analytics Views (Summary)

The dashboard contains 8 distinct analytical views split across 2 tabs showing session analytics, trend data, and opportunity identification. All views require Supabase data aggregation and use Recharts for visualizations.

---

## Key Components Required

- **Tab Navigation:** Switch between Overview and Opportunities
- **Charts:** Bar charts, line charts using Recharts
- **Tables:** Session data tables with sortable columns  
- **Cards:** Summary cards for metrics
- **Analytics Functions:** Uses BUG-015 utilities

---

## Implementation Notes

- Depends on BUG-015 (analyticsEngine) for data aggregation
- Integrates with SessionDetail via session navigation
- Uses Recharts library for all visualizations
- All styling uses Tailwind CSS

---

**Status:** Ready for Implementation  
**Estimated Effort:** 8-12 hours  
**Dependencies:** BUG-015 must be completed first  
**Priority:** P1 (core feature)  
