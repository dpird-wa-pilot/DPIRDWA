# Test Scenarios - Food Manufacturing (Combination 1)

**Business Profile:** Food Manufacturing in Perth Metro, Western Australia

---

## Scenario: Intermediate-Level Selections (DEFAULT TEST SCENARIO)

This is the standard test scenario used for QA iterations. It represents a mid-stage Food Manufacturing business with emerging digital maturity.

### Pantalla 1: Profile (FIXED - Same for all tests)

| Question | Selection | Ref ID |
|----------|-----------|--------|
| Main Sector | Food & Beverage | ref_9 |
| Sub-Sector | Food Manufacturing | ref_10 (UUID: 839e2e9d-2e32-47b0-b355-63058a86e12a) |
| Number of Employees | 20-49 | ref_11 |
| Business Age | 3-7 years | ref_12 |
| Business Location | Perth Metro (within 50km of CBD) | ref_13 |
| Has ABN | Yes | ref_14 |

**Form Navigation:** Click Continue button (ref_16)

---

### Pantalla 2: Operations Readiness (Dimension 1 of 3)

| # | Question | Selection | Ref ID | Expected Score |
|---|----------|-----------|--------|-----------------|
| 1 | Do you have documented processes for your key business operations? | Key processes partially documented | ref_25 | 40% |
| 2 | How does your business manage product or service quality? | Regular quality reviews | ref_30 | 40% |
| 3 | How does your business manage regulatory compliance? | All requirements met, some documentation | ref_35 | 40% |
| 4 | Which repetitive operational tasks have you automated or digitised? | Invoicing/accounting + Payroll | ref_38, ref_39 | 40% |

**Expected Operations Readiness Score:** 40%

**Form Navigation:** Click Next button (ref_45)

---

### Pantalla 3: Digital Readiness (Dimension 2 of 3)

| # | Question | Selection | Ref ID | Expected Score |
|---|----------|-----------|--------|-----------------|
| 1 | Does your business have a website? | Active website with contact/booking | ref_48 | 50% |
| 2 | How does your business use social media? | Regular posting and community engagement | ref_53 | 50% |
| 3 | How do you manage customer relationships and contact information? | Email platform only | ref_73 | 50% |
| 4 | Does your business use cloud-based software or services? | 2–3 cloud tools | ref_61 | 50% |
| 5 | How does your business manage cybersecurity and data protection? | Password policies + antivirus | ref_65 | 50% |
| 6 | Does your business use or plan to adopt Artificial Intelligence tools? | Using basic AI tools occasionally | ref_70 | 50% |

**Expected Digital Readiness Score:** 50%

**Form Navigation:** Click Next button (ref_45)

---

### Pantalla 4: Market Readiness (Dimension 3 of 3)

| # | Question | Selection | Ref ID | Expected Score |
|---|----------|-----------|--------|-----------------|
| 1 | Does your business currently sell products or services online? | Own website with online sales | ref_76 | 38% |
| 2 | Does your business export products or services internationally? | Occasional/ad-hoc exports | ref_80 | 38% |
| 3 | What is your primary method of acquiring new customers? | Own website/SEO | ref_85 | 38% |
| 4 | Do you have a documented digital marketing strategy? | Basic written plan | ref_93 | 38% |
| 5 | How would you describe your brand's digital presence? | Consistent branding across channels | ref_98 | 38% |

**Expected Market Readiness Score:** 38%

**Form Navigation:** Click "See Results" button (ref_45)

---

## Expected Results

### Digital Maturity Level Calculation

```
DML = (Operations × 0.35) + (Digital × 0.40) + (Market × 0.25)
DML = (40% × 0.35) + (50% × 0.40) + (38% × 0.25)
DML = 14% + 20% + 9.5%
DML = 43.5%
```

**Expected DML Level:** EMERGING (43.5%)

### Expected Recommendations

**Grants:** 2 recommended
- Digital Manufacturing on a Shoestring (84% match)
- Australian Trusted Trader (21% match)

**Providers:** 5+ recommended
- AgriFod Technology (95% match)
- AccuWeigh (90% match)
- Aco Australia (90% match)
- Adam Equipment (90% match)
- Adaptus Pty Ltd (90% match)

**Resources:** Multiple recommended
- Food Safety Compliance for Small Food Processors in Western Australia
- Electric weed control studies
- And others

---

## Test Iteration History

### Test 1
- **Date:** 2026-08-21
- **Operations:** 45% | **Digital:** 38% | **Market:** 30%
- **Calculated DML:** 38.45%
- **Results:** Multiple grants (no 0 results)
- **Status:** Form selections working, but lower scores

### Test 2
- **Date:** 2026-08-21
- **Operations:** 40% | **Digital:** 33% | **Market:** 30%
- **Calculated DML:** 34.7%
- **Results:** Potentially 0 grants
- **Status:** Form state bug observable - DML decreased

### Test 3
- **Date:** 2026-08-21
- **Operations:** 40% | **Digital:** 33% | **Market:** 30%
- **Calculated DML:** ~35-36%
- **Results:** Potentially 0 grants
- **Status:** Form state bug confirmed - inconsistent results

### Test 4 (CURRENT - BEST RESULTS)
- **Date:** 2026-08-21
- **Operations:** 40% | **Digital:** 50% | **Market:** 38%
- **Calculated DML:** 43.5%
- **Results:** 2 grants + 5+ providers + resources
- **Status:** **IMPROVED** - Digital Readiness selections driving better results

---

## Key Observations

1. **Form State Bug Impact:** Tests 2 and 3 showed degradation compared to Test 1, suggesting form state is not properly persisting data from Pantalla 1-3.

2. **Digital Readiness Critical:** Test 4's improved Digital Readiness score (50% vs 33%) resulted in:
   - +5.2% improvement in overall DML score
   - Grant results now appearing (vs. 0 results)
   - Higher provider match percentages

3. **Selection Consistency:** The same intermediate-level selections produce different results across test runs, indicating:
   - Form validation state synchronization issue
   - Possible component state reset on navigation
   - React state management bug in form transitions

4. **Scoring Formula Working:** When data IS properly captured, the DML calculation formula works correctly and returns appropriate recommendations.

---

## Recommendations for Future Tests

1. **Verify Digital Readiness Questions** - These appear most sensitive to the form state bug
2. **Monitor Operations Readiness** - Should remain stable at 40% with these selections
3. **Track Market Readiness Trending** - The 38% score is consistent but needs validation
4. **Repeat Test 4 Scenario** - To verify if 43.5% DML is reproducible or anomalous

---

## Bug Root Cause Summary

The form state persistence bug is likely located in:
- **React component state management** during Pantalla transitions
- **Form data not syncing** from Pantalla 2-3 sections to component state
- **Possible issue:** form_input method vs. direct click handling difference
- **Evidence:** Same selections produce different DML scores across iterations

**Status:** Blocking comprehensive testing - requires development team fix for component state persistence
