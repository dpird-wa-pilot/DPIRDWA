# 🔴 BUG REPORT: BFS Matching Engine — Grant Matching Broken
**Bug ID:** BUG-001  
**Title:** Grant Matching Returns Zero Results for Viable Business Scenarios  
**Severity:** 🔴 **BLOCKER**  
**Component:** Advisor Page — BFS Matching Engine  
**Reported by:** Eleven June Consulting (QA)  
**Date:** August 21, 2026  
**Status:** OPEN — Requires immediate investigation  
**Assigned to:** Antigravity Development Lead  

---

## Executive Summary

The **BFS Matching Engine returns ZERO grants** for viable business scenarios that should match 2-3+ grants. Providers and resources match correctly, indicating selective failure in grant-specific matching logic.

**Impact:** Users cannot receive grant recommendations — a core feature of the Advisor platform. This completely blocks the diagnostic tool's value proposition.

**Urgency:** 🔴 **BLOCKER** — Cannot proceed with further testing or user acceptance until resolved.

---

## Defect Details

### PRIMARY DEFECT: No Grants Returned for Viable Scenarios

**Bug ID:** BUG-001  
**Severity:** 🔴 BLOCKER  
**Component:** `src/lib/matchingEngine.js` — `runBFSMatching()` function (grants branch)

#### Symptom
- User completes full diagnostic (all 4 dimensions, all questions answered)
- DML calculation works correctly (outputs accurate scores)
- Provider matching works (returns 5 providers with 80% match)
- Resource matching works (returns 5 resources with 100% match)
- **Grant matching fails (returns "No grants matched your profile")**

#### Test Case: Food Manufacturing Scenario
**Profile:**
- Sector: Food & Beverage
- Size: 5-19 employees  
- Age: 3-7 years
- Location: Regional WA

**Responses:**
- Operations: Documented processes, QC procedures, compliance systems, automation
- Digital: Website, social media, cloud tools, cybersecurity basics
- Market: Own website sales, no exports, social media marketing, documented strategy

**Expected Activated Tags:**
```
supply_chain, process_automation, compliance, certification, 
website, social_media, business_software, cybersecurity, 
digital_marketing, ecommerce
```

**Expected Matching Grants (from seed data):**
1. **Supply Chain Capacity Program**
   - trigger_tags: ['supply_chain', 'logistics', 'gst_registered']
   - Expected match: 60-70% (2 of 3 tags match)
   
2. **Digital Manufacturing on a Shoestring**
   - trigger_tags: ['no_digital_presence', 'inventory_software', 'process_automation', 'business_software', 'food_safety']
   - Expected match: 60-75% (3-4 of 5 tags match)
   
3. **ASBAS Digital Solutions Round 3** (possible)
   - trigger_tags: ['cybersecurity', 'ai_tools', 'digital_marketing', 'business_software']
   - Expected match: 50-65% (3 of 4 tags match)

**Actual Result:**
```
Recommended grants: "No grants matched your profile."
```

**Result:** ❌ 0 grants returned (expected: 2-3 grants)

#### Reproduction Steps
1. Navigate to http://localhost:5173/advisor
2. Complete Pantalla 1 (Profile):
   - Sector: Food & Beverage
   - Size: 5-19
   - Age: 3-7 years
3. Complete Pantalla 2 (Operations) - answer all 4 questions
4. Complete Pantalla 3 (Digital) - answer all 6 questions
5. Complete Pantalla 4 (Market) - answer all 5 questions
6. Click "See Results"
7. **Observe:** Grants section shows "No grants matched your profile"

---

## Secondary Defects

### DEFECT 2: Uniform Match Scores (Quality Issue)

**Bug ID:** BUG-001-B  
**Severity:** 🟡 MEDIUM  
**Component:** `calculateMatchScore()` function

**Symptom:**
- All providers showing exactly 80% match
- All resources showing exactly 100% match
- **Expected:** Variable scores (45%, 67%, 82%, etc.) based on tag intersection

**Evidence:**
- Provider 1 (AccuWeigh): 80%
- Provider 2 (Aco Australia): 80%
- Provider 3 (Adam Equipment): 80%
- Provider 4 (Adaptus): 80%
- Provider 5 (Adept Turkey): 80%

**Root Cause:** Match score calculation appears to be using a fallback or fixed value instead of actual formula.

### DEFECT 3: Strict Validation Blocks Partial Submission

**Bug ID:** BUG-001-C  
**Severity:** 🟡 MEDIUM (UX Issue)  
**Component:** Form validation in Pantalla 4 (Market)

**Symptom:**
- "See Results" button becomes DISABLED if any question in Market unanswered
- No field-level error messages
- Users don't know which fields are required

**Impact:** Users may abandon if they miss one question, even if they have enough data for diagnosis.

---

## Technical Analysis

### Investigation Points for Development Team

#### 1. Grant Trigger Tags Mismatch
**Hypothesis:** Tag names in grant records don't match activated tags from responses.

**Action Items:**
- [ ] Log all `activatedTags` array when See Results is clicked
- [ ] Log all grant `trigger_tags` being compared
- [ ] Check for case sensitivity issues (e.g., "supply_chain" vs "Supply Chain")
- [ ] Verify tag names in seed data match question tag mapping

**Query to run:**
```sql
SELECT name, trigger_tags FROM grants 
WHERE trigger_tags @> ARRAY['supply_chain'] OR 
      trigger_tags @> ARRAY['process_automation']
LIMIT 5;
```

#### 2. Grant Eligibility Filters Blocking All Matches
**Hypothesis:** Grant eligibility criteria (employee_count, business_age_min, requires_abn, requires_gst, dml_min/dml_max) filtering out all results.

**Likelihood:** MEDIUM-HIGH

**Grants in seed data with restrictive filters:**
- Supply Chain Capacity Program: `requires_gst = true` — might be blocking
- Value Add Investment Grants: `employee_max = NULL`, `dml_min = 25`, `dml_max = 74` — DML 69% should match
- Digital Manufacturing: `employee_max = 199`, `dml_min = 0`, `dml_max = 49` — DML 69% exceeds max!

**Action Items:**
- [ ] Check if DML eligibility factors (`dml_min`, `dml_max`) are filtering out Combination 1 (DML 69% = "Established")
- [ ] Review grant eligibility thresholds in seed data
- [ ] Verify eligibility calculation logic in `calculateEligibilityFactor()`

#### 3. Grant Matching Score Calculation
**Hypothesis:** Grant matching uses different logic than provider/resource matching.

**Possible issues:**
- Different formula for grants (e.g., all-or-nothing vs. percentage)
- Filtering `match_score > 0` removing marginal matches
- Grant-specific filters applied before scoring

**Action Items:**
- [ ] Compare `runBFSMatching()` grant branch vs. provider/resource branches
- [ ] Check if grants have additional filtering logic not present in provider/resource code
- [ ] Verify `geoFactor` and `eligibilityFactor` calculations for grants

#### 4. Missing Tag Activation
**Hypothesis:** Tags might not be activating correctly from responses.

**Likelihood:** LOW (providers/resources ARE matching, so tags appear to activate)

**Action Items:**
- [ ] Log `activatedTags` array at time of matching
- [ ] Verify each question maps to expected tag
- [ ] Check if Operations Q4 (checkboxes) tags are captured correctly

---

## Proposed Solutions

### Solution 1: Debug Grant Matching (Recommended)
**Effort:** 2-4 hours  
**Steps:**
1. Add console.log() statements to log:
   - `activatedTags` array before BFS matching
   - Each grant's `trigger_tags` during iteration
   - `tagScore` and `eligibilityFactor` calculations
   - `match_score` final value before filter
   
2. Rerun Combination 1 scenario and check console

3. Identify why `match_score` returns 0 for expected grants

4. Fix root cause (tag mismatch, eligibility filtering, or score calculation)

**Code locations to instrument:**
- `src/lib/matchingEngine.js` line ~95-120 (runBFSMatching grants section)
- `calculateMatchScore()` function
- `calculateEligibilityFactor()` function

### Solution 2: Add Field-Level Validation (Quick Win)
**Effort:** 1 hour  
**Changes:**
- Replace generic button disable with field-specific error messages
- Show "This field is required" under each empty question
- Allow partial submission with data warning

### Solution 3: Investigate Match Score Uniformity
**Effort:** 1-2 hours  
**Diagnosis:**
- All scores at 80%/100% suggests hardcoded values or fallback logic
- Search codebase for hardcoded "80" and "100" in score calculations
- Trace actual `calculateMatchScore()` execution

---

## Resolution Tracking

**When Antigravity fixes this bug, create:**
- Change Control: **CC-XXXX** (reference BUG-001 in description)
- Code commit message must include: `Fixes BUG-001`
- PR description should reference BUG-001 and this document

**QA will re-test with:**
- All 3 matching combinations
- BUG-001 resolution as pass/fail criteria

---

## Business Impact

### User-Facing Impact
- ❌ Grants feature completely broken
- ❌ Users cannot access grant opportunities (core value proposition)
- ❌ Diagnostic tool outputs incomplete recommendations
- ❌ User trust in platform severely damaged

### Testing Impact
- ❌ Cannot validate any of the 3 viable matching combinations
- ❌ Cannot proceed with UAT (User Acceptance Testing)
- ❌ Blocks all remaining QA cycles

### Timeline Impact
- 🔴 **BLOCKER:** Cannot release Advisor to production
- Must resolve before: Any user-facing deployment

---

## Evidence Artifacts

**QA Test Report:** `qa-report-3-combinations.md`
- Full test scenario details
- Actual vs. expected results
- DML score breakdown
- Provider/Resource results (for comparison)

**Matching Analysis:** `bfs-matching-analysis.md`
- 3 viable matching combinations with expected tags
- Seed data analysis
- Which grants should match which combinations

**Technical Spec:** `CC-004_advisor-page.md` (§6 — BFS Engine)
- Original BFS matching engine specification
- Match score formula
- Expected behavior

---

## Next Steps

### For Development Lead:
1. ✅ Review this bug report (BUG-001)
2. ✅ Run debugging steps in "Investigation Points" section
3. ✅ Identify root cause
4. ✅ Create CC-XXXX with reference to BUG-001
5. ✅ Update code with commit message "Fixes BUG-001"

### For QA (Eleven June):
- ⏸️ Paused testing Combinations 2 & 3 until BUG-001 is fixed
- ⏸️ Ready to re-test all combinations once fix is deployed
- ✅ Prepared detailed test cases for validation

### Success Criteria for BUG-001 Resolution:
- [ ] Supply Chain Capacity Program matches Combination 1 scenario
- [ ] Digital Manufacturing on a Shoestring matches Combination 1 scenario
- [ ] Match scores are variable (not uniform 80%/100%)
- [ ] All 3 combinations can be tested end-to-end
- [ ] DML scores correct for all combinations
- [ ] Change Control CC-XXXX created referencing BUG-001

---

*Bug Report prepared August 21, 2026 — Eleven June Consulting QA Team*  
*Location: Initial Protoype/Development/change_control/BUG-001_advisor-grant-matching.md*
