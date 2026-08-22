# 🟡 BUG REPORT: DML Eligibility Filter — Incomplete Form Responses Block Grant Matching
**Severity:** 🟡 **HIGH** (Related to BUG-001)  
**Component:** Advisor Page — Form Validation & DML Calculation  
**Reported by:** Eleven June Consulting (QA)  
**Date:** August 21, 2026  
**Status:** RESOLVED (v2) — Three-layer root cause identified and fully fixed  
**Resolved by:** Eleven June Consulting (Claude Code)  
**Assigned to:** Antigravity Development Lead  
**Related to:** [[BUG-001]] (may be root cause of grant matching failure)

---

## Executive Summary

When a user clicks **"See Results Anyway"** without completing all form fields, the DML score drops artificially (from 69% down to ~25%), triggering eligibility filters that exclude ALL grants. This suggests that grants may have `dml_min` and/or `dml_max` thresholds that prevent matching at lower DML levels.

**Key Discovery:** BUG-001 (grants returning 0 results) may actually be caused by BUG-002 (DML eligibility filters), not the matching logic itself.

**Impact:** Users cannot receive grant recommendations when form validation is bypassed, even if they have sufficient data for diagnosis.

**Status:** Requires verification with Antigravity — may be blocking issue preventing BUG-001 from resolving.

---

## Problem Statement

### Defect ID: BUG-002  
**Severity:** 🟡 HIGH  
**Component:** `src/lib/matchingEngine.js` — `calculateEligibilityFactor()` function  

### Symptom
1. User completes Pantalla 1-3 (Profile, Operations, Digital) fully
2. User partially completes Pantalla 4 (Market) — missing some questions
3. User clicks **"See Results Anyway"** button (bypassing validation)
4. Results page loads with **significantly lower DML scores**
5. **Recommended Grants:** "No grants matched your profile" (0 grants)
6. **Recommended Providers:** 5/5 ✓ (unaffected)
7. **Recommended Resources:** 5/5 ✓ (unaffected)

### Evidence: Before vs. After

#### Test 1: Complete Form (All Fields Answered)
```
DML Level: ESTABLISHED (69%)
  - Operations Readiness: 56%
  - Digital Readiness: 83%
  - Market Readiness: 66%

Results:
  - Grants: 0 (returned, but this is BUG-001)
  - Providers: 5/5 ✓
  - Resources: 5/5 ✓
```

#### Test 2: Incomplete Form ("See Results Anyway")
```
DML Level: EMERGING (~25%)
  - Operations Readiness: 46%
  - Digital Readiness: 11%
  - Market Readiness: 18%

Results:
  - Grants: 0 (no matches)
  - Providers: 5/5 ✓
  - Resources: 5/5 ✓
```

**Analysis:**
- ❌ DML dropped from 69% (Established) → ~25% (Emerging)
- ❌ Grants still 0 (but now might be due to eligibility, not matching)
- ✓ Providers still match (not affected by DML)
- ✓ Resources still match (not affected by DML)

---

## Root Cause Analysis

### Hypothesis 1: Grant Eligibility Thresholds (LIKELY)

**Theory:** Grants in seed data have `dml_min` and/or `dml_max` constraints that filter out Emerging-level businesses.

**Evidence from seed data:**
```sql
-- Digital Manufacturing on a Shoestring (from database-schema-v2.md)
{
  "name": "Digital Manufacturing on a Shoestring",
  "dml_min": 0,
  "dml_max": 49,  -- ⚠️ Max 49% = Emerging only
  "employee_max": 199
}

-- This grant matches Combination 1, but ONLY if DML < 50%!
-- At DML 69%, this grant is filtered OUT
```

### Hypothesis 2: "See Results Anyway" Bypasses Validation Leading to Incomplete Data

**Theory:** When validation is bypassed, some question responses may be missing or default values used, resulting in:
- Fewer tags activated
- Lower tag match scores
- Lower DML calculations

**Evidence:**
- Digital Readiness: 11% (very low) — suggests missing responses
- Market Readiness: 18% (very low) — suggests missing responses
- Form showed warning: "Some required fields are missing"

### Hypothesis 3: Interaction Effect

**Most Likely Scenario:**
1. User clicks "See Results Anyway" with incomplete fields
2. Some responses are null/undefined
3. DML calculation uses default/fallback values → artificially low scores
4. Low DML triggers eligibility filters (`dml_max < 50`)
5. All grants filtered out by eligibility criteria
6. Matching engine never gets to the tag-based scoring step

**Result:** 0 grants returned — but this is a **validation/eligibility issue, not a matching issue**

---

## Technical Analysis

### Investigation Points for Development Team

#### 1. Grant Eligibility Thresholds in Database
**Action Items:**
- [ ] Query all grants to identify `dml_min` and `dml_max` values
- [ ] Identify which grants have restrictive thresholds
- [ ] Verify if "Digital Manufacturing on a Shoestring" has `dml_max: 49`

**Query to run:**
```sql
SELECT name, dml_min, dml_max, employee_min, employee_max 
FROM grants 
WHERE dml_min IS NOT NULL OR dml_max IS NOT NULL;
```

#### 2. Check Eligibility Factor Calculation
**Action Items:**
- [ ] Review `calculateEligibilityFactor()` function
- [ ] Verify DML thresholds are being applied correctly
- [ ] Check if eligibility factor returns 0 for out-of-range DML

**Code location:**
- `src/lib/matchingEngine.js` → `calculateEligibilityFactor()` function

#### 3. Form Validation & "See Results Anyway" Logic
**Action Items:**
- [ ] Check what happens when validation is bypassed
- [ ] Identify which fields become optional/have defaults
- [ ] Verify DML calculation handles null/undefined responses

**Code location:**
- `src/components/AdvisorForm.jsx` or similar
- Look for "See Results Anyway" button click handler

#### 4. Compare DML Calculations (Complete vs. Incomplete)
**Expected behavior:** 
- Complete form (all questions answered) → Accurate DML
- Incomplete form (some questions missing) → Warning or re-prompt

**Actual behavior:**
- Incomplete form allowed → DML calculated with defaults/nulls → Artificially low scores

---

## Key Questions for Antigravity

1. **Do grants have DML eligibility thresholds?** (e.g., `dml_min`, `dml_max`)
   - If YES → This explains why grants disappear at low DML levels
   - If NO → Issue is elsewhere in grant matching logic

2. **What happens in DML calculation when fields are null/missing?**
   - Are they treated as 0%?
   - Are they skipped?
   - Are they assigned defaults?

3. **Is "See Results Anyway" intended to allow incomplete submissions?**
   - If YES → Expected behavior needs clarification
   - If NO → Validation should not allow this

4. **Did Antigravity's BUG-001 fix address grant matching OR eligibility?**
   - Fix location will determine if BUG-002 explains BUG-001

---

## Proposed Testing Strategy

### To Isolate Root Cause

**Test A: Complete the form properly (no "See Results Anyway")**
1. Navigate to advisor
2. Complete ALL questions in Pantalla 1-4
3. Click "See Results" (proper validation)
4. **Expected:** DML ~69% (Established), Grants should match (if BUG-001 is fixed)

**Test B: Use "See Results Anyway" with incomplete Market section**
1. Navigate to advisor
2. Complete ALL questions in Pantalla 1-3
3. Partially complete Pantalla 4 (skip 2-3 questions)
4. Click "See Results Anyway"
5. **Expected:** DML drops to ~25% (Emerging), Grants: 0 (due to eligibility filter)

**Test C: Query database grants for DML thresholds**
```sql
SELECT name, trigger_tags, dml_min, dml_max FROM grants;
-- Identify which grants match Combination 1 tags
-- Check if their dml_max < current DML score
```

---

## Relationship to BUG-001

| Aspect | BUG-001 | BUG-002 |
|--------|---------|---------|
| **Issue** | Grants not returned | Eligibility filter blocks grants |
| **Root Cause** | Unknown (matching logic?) | DML thresholds in seed data |
| **Affected Component** | `runBFSMatching()` grants branch | `calculateEligibilityFactor()` |
| **Affected Users** | All users completing form | Users who click "See Results Anyway" |
| **Providers/Resources** | ✓ Both still work | ✓ Both still work |
| **Relationship** | Separate issue | **Possible root cause of BUG-001** |

### Theory: BUG-002 May Explain BUG-001

If the seed data grants all have `dml_max` thresholds that don't match Combination 1 (DML 69%), then:
- BUG-001 = Grants filtered by eligibility before matching
- BUG-002 = Why eligibility filters all grants
- Fix = Either adjust grant `dml_max` values OR improve DML calculation

---

## Proposed Solutions

### Solution 1: Verify Grant Eligibility Thresholds (IMMEDIATE)
**Effort:** 30 minutes  
**Steps:**
1. Query database for all grants with `dml_min`/`dml_max`
2. Check if thresholds prevent Combination 1 (DML 69%) from matching
3. Report findings to confirm if BUG-002 explains BUG-001

### Solution 2: Enforce Form Completion Before Results
**Effort:** 1-2 hours  
**Changes:**
- Remove or disable "See Results Anyway" button
- Require all fields to be completed
- Show field-specific validation messages
- This prevents artificially low DML scores

### Solution 3: Adjust Grant Eligibility Thresholds
**Effort:** 1-2 hours (if thresholds are wrong)  
**Changes:**
- Review `dml_max` values for all grants
- Expand ranges to include viable business scenarios
- Example: Change `dml_max: 49` to `dml_max: 100` if overly restrictive

---

## Success Criteria

- [ ] Confirm whether grants have `dml_min`/`dml_max` eligibility thresholds
- [ ] Identify if Combination 1 (DML 69%) is filtered by eligibility
- [ ] Determine if "See Results Anyway" intentionally allows incomplete submissions
- [ ] Verify DML calculation handles null/missing fields consistently
- [ ] Food Manufacturing scenario returns 2-3 grants when form is complete

---

---

## Resolution — August 21, 2026

**Resolved by:** Eleven June Consulting (Claude Code review)  
**Files modified:**  
- `src/lib/matchingEngine.js`  
- `src/pages/Advisor.jsx`

### Root Cause #1 (Primary — explains 0 grants): `calculateGeoFactor` — `all_wa` not treated as WA wildcard

The geo factor checked `resultLocations.includes(businessLocation)`. For a grant with `geographic_scope = ['all_wa']` and a user with `businessLocation = 'metro_wa'`, this returns `false`. Since the fallback `operates_online || includes('national')` also fails for `all_wa`-only grants, `geoFactor = 0.0`. This makes `match_score = 0` → grant filtered out.

**Affected grants in seed data:** Digital Manufacturing on a Shoestring, Carbon Farming, Native Seed, Tackle Shop Rebate, Community Stewardship, Feral Cat Management, BBAB Supply Chain Voucher.

**Fix applied:**
```javascript
const WA_LOCATIONS = ['metro_wa', 'regional_wa', 'remote_wa'];
// ...
if (resultLocations.includes('all_wa') && WA_LOCATIONS.includes(businessLocation)) return 1.0;
```

### Root Cause #2 (Secondary): `calculateEligibilityFactor` — empty string coercion in numeric comparisons

`profile.businessAgeYears` and `profile.employeeCount` arrive as strings from form `<select>` elements. An unselected field has value `''`. In JS, `'' < 2` coerces to `0 < 2 = true`, silently triggering `score *= 0.3` for users who left Business Age blank.

Also, the previous DML check `if (grant.dml_min && ...)` used falsy evaluation — semantically correct but unclear. Replaced with explicit `> 0` / `< 100` guards that align with database defaults (`dml_min DEFAULT 0` = no minimum; `dml_max DEFAULT 100` = no maximum).

**Fix applied:**
```javascript
const businessAgeYears = profile.businessAgeYears !== '' && profile.businessAgeYears != null
  ? parseInt(profile.businessAgeYears, 10) : null;
// Only penalise when both values are known:
if (grant.business_age_min > 0 && businessAgeYears !== null && businessAgeYears < grant.business_age_min) score *= 0.3;
// DML with explicit range guards:
if (grant.dml_min > 0 && profile.dmlScore < grant.dml_min) score *= 0.5;
if (grant.dml_max < 100 && profile.dmlScore > grant.dml_max) score *= 0.5;
```

### Root Cause #3 (Latent): Back button in `Advisor.jsx` doesn't reload questions

The Back button only decremented `currentStep` without calling `loadQuestions` for the previous dimension. Going back from Step 4 (Market) to Step 3 (Digital) left `questions` state containing Market questions, which corrupts the Digital score calculation if the user then proceeds forward again.

**Fix applied:** Back button now calls `loadQuestions(prevDimension, sectorId)` after decrementing step.

### Why the DML Eligibility Filter Appeared to Be the Cause

The eligibility factor uses `score *= 0.5` (soft penalty), never `return 0.0` for DML mismatch. DML alone cannot produce `match_score = 0`. The actual 0-grants result was always the geo factor bug eliminating the most relevant grants before the tag intersection check could run. The DML drop observed in Test 2 is a consequence of different answer quality (lower scores), not a calculation defect.

### Impact of Fix

After these changes, a WA user (metro, regional, or remote) will correctly receive matches for grants with `all_wa` in `geographic_scope`. Combined with the eligibility fix, profile edge cases (missing age/employee fields) no longer generate false penalties.

---

---

## Re-investigation — August 21, 2026 (v2)

**Why the first fix didn't resolve the bug:**

After the first fix (v1), the `all_wa` wildcard was correctly handled in `calculateGeoFactor` — but only when `businessLocation` is a non-empty WA code like `metro_wa`. The Location field was **never implemented in the Step 1 UI**, so `profile.location` was always `''`. The guard `WA_LOCATIONS.includes('')` evaluates to `false`, so the fix had no effect for real users.

**Root Cause #4 (PRIMARY — explains persistent 0 grants after v1 fix): Invalid column in grants Supabase query**

The `finalizeResults()` function selects `location` from the `grants` table:
```javascript
supabase.from('grants').select('... location, geographic_scope ...')
```

The `grants` table schema (`01_schema.sql`) has `geographic_scope text[]` but **no `location` column**. Supabase/PostgREST returns a 400 error for unknown columns. Since the code does `grantsRes.data || []` without checking `grantsRes.error`, the error is swallowed silently and `grants = []` always.

**This is why 0 grants persisted across multiple Antigravity fix attempts** — the matching engine was never receiving grant data.

**Fix applied:** Removed `location` from grants select; kept `geographic_scope`.

**Root Cause #5 (secondary): Location field missing from Step 1 UI**

CC-004 §4.2 specifies 8 profile fields including `Ubicación` (Location). Antigravity implemented only 4 of them. Since `profile.location` was always `''`, the `all_wa` geo fix (Root Cause #1) could never activate.

**Fix applied:**
- Added Location select field to Step 1 (options: Metro WA / Regional WA / Remote WA)
- Added Has ABN toggle (was hardcoded `true` in state, never captured from user)
- Updated `isStepValid()` to require location before advancing
- Updated `calculateGeoFactor` fallback: when `businessLocation` is empty, return `1.0` (no geographic exclusion) instead of `0.0`

**Fix applied (geo fallback):**
```javascript
// Location not captured yet — cannot determine incompatibility, so don't exclude
if (!businessLocation) return 1.0;
```

**Added Supabase error logging in `finalizeResults`:**
```javascript
if (grantsRes.error) console.error('[BFS] grants query failed:', grantsRes.error.message);
```
This prevents future silent failures from being diagnosed as matching logic bugs.

---

**🟢 RESOLVED (v2)** — Deploy `matchingEngine.js` and `Advisor.jsx` from the `Tool/src/` directory.
