# BUG-015: analyticsEngine Utilities Not Implemented

**Date Reported:** August 21, 2026  
**Severity:** 🟡 HIGH  
**Status:** OPEN (Ready for Implementation)  
**Component:** Analytics → Utility Functions  
**File:** `src/lib/analyticsEngine.js`  
**Spec Reference:** CC-005 §7  

---

## Summary

The analyticsEngine utility library which provides 5 essential analytics functions for the ConsultantDashboard has **not been implemented**. These utility functions are required for data aggregation and trend analysis.

---

## What Needs to Be Implemented

### 1. File to Create
- **Path:** `src/lib/analyticsEngine.js`
- **Type:** Utility/helper functions (no React)
- **Exports:** 5 named exports (no default export)

### 2. The 5 Functions to Implement

#### Function 1: `avg(arr)`

**Purpose:** Calculate average of array values

**Signature:**
```javascript
export const avg = (arr) => { /* implementation */ }
```

**Parameters:**
- `arr`: Array of numbers (can be empty)

**Returns:**
- Number: Average of array values
- Returns 0 if array is empty

**Implementation Logic:**
```javascript
export const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
```

#### Function 2: `groupBy(arr, key)`

**Purpose:** Group array of objects by a specific property value

**Signature:**
```javascript
export const groupBy = (arr, key) => { /* implementation */ }
```

**Parameters:**
- `arr`: Array of objects to group
- `key`: Property name to group by

**Returns:**
- Object: `{ groupValue: [item1, item2, ...], ... }`
- Each key maps to array of matching items

**Implementation Logic:**
```javascript
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
```

#### Function 3: `countFrequency(arr)`

**Purpose:** Count occurrences of each value in array

**Signature:**
```javascript
export const countFrequency = (arr) => { /* implementation */ }
```

**Parameters:**
- `arr`: Array of values (strings, numbers, etc.)

**Returns:**
- Object: `{ value: count, ... }`
- Each unique value maps to occurrence count

**Implementation Logic:**
```javascript
export const countFrequency = (arr) =>
  arr.reduce((acc, val) => {
    acc[val] = (acc[val] ?? 0) + 1
    return acc
  }, {})
```

#### Function 4: `weeklyTrend(results, dateField)`

**Purpose:** Compare last 7 days vs previous 7 days to determine trend

**Signature:**
```javascript
export const weeklyTrend = (results, dateField) => { /* implementation */ }
```

**Parameters:**
- `results`: Array of objects with date field
- `dateField`: Name of date property (e.g., 'created_at')

**Returns:**
- String: `'up'` | `'stable'` | `'down'`

**Logic:**
1. Get current date
2. Calculate date ranges
3. Compare period counts
4. Return trend based on ±10% threshold

#### Function 5: `getISOWeekLabel(dateStr)`

**Purpose:** Convert date to ISO 8601 week format

**Signature:**
```javascript
export const getISOWeekLabel = (dateStr) => { /* implementation */ }
```

**Parameters:**
- `dateStr`: Date string (e.g., '2026-08-21' or timestamp)

**Returns:**
- String: ISO week label format (e.g., '2026-W34')

**Format:** `{YEAR}-W{WEEK_NUMBER}` (zero-padded week)

---

### 3. File Template

```javascript
// [CC-005] analyticsEngine.js — Utility functions for dashboard analytics

/**
 * Calculate average of array values
 * @param {number[]} arr - Array of numbers
 * @returns {number} - Average value (0 if empty)
 */
export const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

/**
 * Group array of objects by key value
 * @param {object[]} arr - Array of objects
 * @param {string} key - Property to group by
 * @returns {object} - Grouped object: { groupValue: [items...] }
 */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})

/**
 * Count occurrences of values in array
 * @param {array} arr - Array of values
 * @returns {object} - Frequency map: { value: count }
 */
export const countFrequency = (arr) =>
  arr.reduce((acc, val) => {
    acc[val] = (acc[val] ?? 0) + 1
    return acc
  }, {})

/**
 * Compare last 7 days vs previous 7 days trend
 * @param {object[]} results - Array of items with dates
 * @param {string} dateField - Date field name
 * @returns {string} - 'up' | 'stable' | 'down'
 */
export const weeklyTrend = (results, dateField) => {
  const now = new Date()
  const oneWeekAgo = new Date(now)
  oneWeekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(now.getDate() - 14)

  const thisWeek = results.filter(r => new Date(r[dateField]) >= oneWeekAgo).length
  const lastWeek = results.filter(r => {
    const d = new Date(r[dateField])
    return d >= twoWeeksAgo && d < oneWeekAgo
  }).length

  if (thisWeek > lastWeek * 1.1) return 'up'
  if (thisWeek < lastWeek * 0.9) return 'down'
  return 'stable'
}

/**
 * Convert date to ISO week label
 * @param {string} dateStr - Date string or timestamp
 * @returns {string} - ISO week format: 'YYYY-W##'
 */
export const getISOWeekLabel = (dateStr) => {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const week = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
```

---

**Status:** Ready for Implementation  
**Estimated Effort:** 2-3 hours  
**Complexity:** Low  
**Priority:** P1 (required by BUG-013)  
**Dependencies:** None  
