# BUG-016: Critical Issues - Score Calculations & Spanish Tags

**Date Reported:** August 22, 2026  
**Severity:** 🔴 **CRITICAL**  
**Status:** OPEN  
**Component:** SessionDetail → Score Calculations & Localization  
**Affected Areas:** Overall Score, Area Scores, Grant Scores, Resource Scores, Tag Display  

---

## Summary

The SessionDetail page has **systematic errors** affecting:
1. **Score calculations** - All percentages are incorrect (overall, areas, grants, resources)
2. **Tag localization** - Tags displaying in Spanish instead of English

Both issues compromise data integrity and UI consistency.

---

## Session Tested
- **Business:** ANC manufacturing (Food & Beverage)
- **Session ID:** 1da96408-8a2e-476c-a18a-8ec9c5469164
- **Test Date:** August 22, 2026

---

## ISSUE #1: Score Calculation Errors

### Error #1: Overall Score Mismatch

**Displayed Values:**
- Header Score Chip: **19%**
- Gauge Score: **19%**
- Area Scores: **28% (Ops) + 17% (Digital) + 28% (Market) = 73% total**

**Problem:** Overall score of 19% does not correspond to area scores
- If averaged: (28 + 17 + 28) / 3 = **24.3%** (not 19%)
- Calculation logic appears broken

**Impact:** Overall score is fundamentally incorrect

---

### Error #2: Area Score Inconsistency

**Location:** Area Scores panel vs Improvement Areas descriptions

**Area Scores Panel Shows:**
- Operations: 28%
- Digital: 17%
- Market: 28%

**Improvement Areas Shows:**
- Operations: 20% ❌ (conflicts with 28%)
- Digital: 17% ✓ (matches)
- Market: 20% ❌ (conflicts with 28%)

**Problem:** Same data shows different values in different sections
- Indicates multiple queries or calculation methods
- Data inconsistency throughout the page

---

### Error #3: Grant #1 Match Score Completely Wrong

**Grant:** "Digital Manufacturing on a Shoestring"
- **Displayed Score: 1%**
- **Area Weights:** Operations 35% | Digital 50% | Market 15%

**Expected Calculation:**
```
Match = (28% × 35%) + (17% × 50%) + (28% × 15%) = 22.5%
```

**Actual Score:** 1% ❌
**Error Magnitude:** ~95% underreported

---

### Error #4: Grant #2 Match Score Completely Wrong

**Grant:** "Australian Trusted Trader"
- **Displayed Score: 0%**
- **Area Weights:** Operations 35% | Digital 20% | Market 45%

**Expected Calculation:**
```
Match = (28% × 35%) + (17% × 20%) + (28% × 45%) = 25.8%
```

**Actual Score:** 0% ❌
**Error Magnitude:** ~100% underreported

---

### Error #5: Resource Scores (Suspected Same Issue)

**Observation:** All 5 resources showing identical 1% score
- Statistically improbable
- Suggests default/fallback values being used
- Same root cause as grant scores

---

## ISSUE #2: Spanish Tags Instead of English

### Problem Description

**Location:** Grant detail views → MATCHED TAGS section

**Tags Displayed in Spanish:**
- "Automation de procesos" ❌ (should be: "Process automation")
- "Seguridad alimentaria" ❌ (should be: "Food safety")
- "Sin presentis digital" ❌ (should be: "Digital presence")
- "Software de gestion" ❌ (should be: "Management software")

### Tag Source Issue

**Root Cause:** Tags being fetched from `tags` table with Spanish values instead of English labels

**Database Check Needed:**
- [ ] Are tag labels stored in Spanish in the database?
- [ ] Should there be a language selector?
- [ ] Are tag translations available?
- [ ] Should default be English globally?

### Affected Components

- Grant detail view: MATCHED TAGS section
- Resource detail view: MATCHED TAGS section (likely same issue)
- Tag data coming from Supabase query

---

## Root Cause Analysis - Scores

### Probable Issues

**Issue A: Incorrect Score Calculation Function**
1. **Wrong formula** in `overallScore()` function in `knowledgeGraph.js`
2. **Weight application error** - weights not being applied correctly
3. **Data type error** - percentages treated as decimals (0.28 vs 28)
4. **Rounding error** - scores being truncated/rounded incorrectly
5. **Null/undefined handling** - certain scores set to 0 or 1 as defaults

**Issue B: Multiple Calculations for Same Data**
- Area scores calculated one way (shows 28%, 28%, 17%)
- Improvement areas with different values (shows 20%, 20%, 17%)
- Suggests two different data sources

**Issue C: Supabase Query Calculation**
- `match_results` query calculating scores incorrectly
- Grant weights not being multiplied by area scores
- Resource calculation using wrong methodology

---

## Root Cause Analysis - Tags

### Probable Issues

**Issue A: Database Content**
- Tags table contains Spanish values instead of English
- Need to check if translation layer exists
- Default language set to Spanish?

**Issue B: Query Not Filtering by Language**
- Tag query should filter by language = 'en'
- Currently returning default language (Spanish)

**Issue C: Missing Translation Mapping**
- Tags fetched but not translated
- Should have language-aware lookup

---

## Code Files to Review

### Score Issues

1. **`src/lib/knowledgeGraph.js`**
   - Function: `overallScore(session)` 
   - Function: `buildAreas(session)` 
   - Check: Consistent calculation logic

2. **`src/pages/SessionDetail.jsx`**
   - Check: Data source consistency
   - Check: Multiple query sources

3. **Supabase Queries**
   - `match_results` calculation
   - Weight application logic

### Tag Issues

1. **`src/pages/SessionDetail.jsx`**
   - Tags query: check language filter
   - Tags display: check translation logic

2. **Supabase Queries**
   - Tags table query
   - Language filtering logic

---

## Validation Criteria - After Fix

### Scores
- [ ] Overall score matches area scores (24-25%)
- [ ] Area scores consistent everywhere
- [ ] Grant #1 score: 1% → ~22-23%
- [ ] Grant #2 score: 0% → ~25-26%
- [ ] Resource scores vary appropriately (not all 1%)
- [ ] All calculations use same methodology

### Tags
- [ ] All tags display in English
- [ ] No Spanish text in tag displays
- [ ] Tag consistency across grant and resource detail views
- [ ] Matched tags section properly localized

---

## Impact Assessment

**Severity:** CRITICAL
- Users cannot trust dashboard numbers
- Recommendations appear baseless (1% vs actual ~22%)
- Bilingual display breaks UI consistency
- Business decision-making compromised

**Scope:** All SessionDetail pages with matches

**User Facing:** YES - affects all consultants

---

## Recommendations for Antigravity

### Priority: IMMEDIATE (blocks production)

**Score Calculation Fix:**
1. Locate and fix `overallScore()` function
2. Verify weight application logic
3. Ensure consistent calculations across UI
4. Test with manual calculations provided above

**Tag Localization Fix:**
1. Check tags table for language field
2. Add English language filter to query
3. Ensure all tags display in English
4. Test across all detail views

**Testing:**
- [ ] Grant #1 shows ~22.5% (not 1%)
- [ ] Grant #2 shows ~25.8% (not 0%)
- [ ] All tags in English
- [ ] Consistent data across sections

---

**Status:** 🔴 OPEN  
**Assigned To:** Antigravity Development  
**Estimated Fix Time:** 3-5 hours (scores 2-3 hrs, tags 1-2 hrs)
