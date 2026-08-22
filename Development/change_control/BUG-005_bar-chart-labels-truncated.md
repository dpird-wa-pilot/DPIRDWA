# BUG-005: Bar Chart Y-Axis Labels Truncated and Overlapping

**Severity:** 🟠 **MEDIUM**  
**Status:** 🔴 **OPEN**  
**Component:** CC-005 Consultant Dashboard — Views 2 & 3  
**Assigned to:** Antigravity Development Lead  
**Created:** August 21, 2026  
**Reported by:** Eleven June Consulting QA  
**Related CC:** CC-005

---

## Summary

In the Consultant Dashboard, bar charts in Views 2 (Top Matched Grants) and View 3 (Top Matched Providers/Resources) render with Y-axis labels that are **truncated mid-word** and **overlap each other** when grant/provider names exceed ~20 characters. This makes the chart unreadable when longer names are present.

---

## Reproduction Steps

1. Navigate to `http://localhost:5173/consultant/dashboard`
2. Observe **View 2** — "Top Matched Grants" horizontal bar chart
3. Observe **View 3** — "Top Matched Resources" horizontal bar chart
4. Y-axis labels (grant/resource names) are clipped or overlap adjacent labels

---

## Expected vs Actual

| State | Expected | Actual |
|-------|----------|--------|
| Y-axis labels | Full name visible or elegantly truncated with tooltip | Labels clipped mid-character or overlapping |
| Chart readability | User can identify which grant/resource each bar represents | Bars ambiguous — label cut off |

---

## Root Cause

The recharts `<YAxis>` component has a fixed `width` that is insufficient for longer strings. When names exceed the allocated pixel width, recharts clips them without ellipsis. Additionally, with many items, the tick interval can cause overlapping.

Example problematic config (likely current):
```jsx
<YAxis dataKey="name" type="category" width={120} />
```

For grant names like "Digital Transformation Accelerator Grant" (43 chars), 120px is insufficient.

---

## Fix

**Option A — Increase width and add truncation (recommended):**

```jsx
// Utility: truncate long names for display
const truncate = (str, max = 28) =>
  str.length > max ? str.slice(0, max) + '…' : str;

// In the chart:
<YAxis
  dataKey="name"
  type="category"
  width={180}
  tick={{ fontSize: 12 }}
  tickFormatter={(value) => truncate(value, 28)}
/>

// Add tooltip to show full name on hover:
<Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
```

**Option B — Horizontal scroll container:**
Wrap the chart in a scrollable container if many items are expected:
```jsx
<div style={{ overflowX: 'auto' }}>
  <BarChart width={600} height={items.length * 36} layout="vertical" ...>
```

---

## Impact

- 🟠 **Usability:** Consultants cannot identify grants/resources from the chart
- Low data risk — underlying data is correct, display only

---

## Acceptance Criteria

- [ ] All grant/provider names are either fully readable or truncated with `…` and full name shown on hover
- [ ] No label overlap on charts with 5–10 items
- [ ] Charts remain legible at 1280px viewport width
