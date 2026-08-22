# BUG-010: Consultant Dashboard - Chart Bars Display in Black Instead of Styled Colors

**Date Reported:** August 21, 2026  
**Severity:** MEDIUM  
**Status:** OPEN  
**Component:** Consultant Dashboard → Chart Visualization  
**Affected Views:** View 2 (Top Grants), View 3 (Resources Relevance)

---

## Summary

Charts on the Consultant Dashboard are rendering bar chart bars in **solid black** color instead of theme-styled colors. While the data is correct and visible, the visual presentation is broken, making it impossible to distinguish between different bars at a glance and degrading the visual appeal of the dashboard.

---

## Issue Details

### What's Visible

✅ **Working Correctly:**
- Chart structure and layout (bars are properly sized according to data)
- Data accuracy (bar lengths correctly represent values)
- Labels and legend text
- Table view (View 1: Coverage by Sector) displays correctly with proper color coding
- Console errors are minimal (only 3 extension-related message channel errors)

❌ **Broken:**
- **View 2: Top Grants** - All bars display as **solid black**
- **View 3: Resources Relevance** - All bars display as **solid black**

---

## Expected Behavior

- Each bar should display in a distinct, styled color that matches the application theme
- Colors should differentiate between grants/resources for easy visual scanning

---

## Actual Behavior

- All horizontal bars render as **solid black rectangles**
- No color differentiation between bars
- Visual hierarchy is lost

---

## Root Cause Analysis (Hypothesis)

### Likely Causes

1. **Recharts Theme Configuration Issue**
   - Bar fill color property may be hardcoded to black
   - Theme provider not properly applying colors to Bar components

2. **Missing CSS Styling**
   - Chart library CSS may not be fully loaded
   - Tailwind or custom CSS overriding bar colors with black

3. **Color Palette Not Loaded**
   - Application color theme/palette not being passed to chart component
   - Fallback to black due to missing color configuration

4. **Component State Issue**
   - Color props not being properly passed from parent component
   - Chart component defaulting to black when color prop is undefined/null

---

## Code Areas to Investigate

### Files to Check

1. **Chart Component**
   - Look for: Horizontal bar chart component (likely using Recharts)
   - Check: Bar component `fill` property, color configuration

2. **Dashboard Component**
   - Look for: Chart rendering logic, color prop assignment
   - Check: Theme provider, color constants usage

3. **Theme/Styling**
   - Check: Global CSS or Tailwind configuration
   - Verify: Chart library CSS is imported

4. **Data Transformation**
   - Check: Data mapping that prepares chart data
   - Verify: Color metadata is not being lost

---

## Reproduction Steps

1. Navigate to: Consultant Dashboard
2. Scroll down to "View 2: Top Grants"
3. **Observe:** All bars display in black instead of theme colors
4. Scroll down further to "View 3: Resources Relevance"
5. **Observe:** All bars display in black instead of theme colors

---

## Impact Assessment

### User Experience Impact
- **Severity:** MEDIUM
- **Visual Clarity:** Reduced - no color differentiation
- **Usability:** Functional but aesthetically broken

### Business Impact
- Dashboard looks unfinished/broken
- Consultant users may question data integrity

---

## Testing Checklist

**Development Team:**
- [ ] Identify chart component library and version
- [ ] Check Bar component fill property assignment
- [ ] Verify theme provider wrapping charts
- [ ] Test color constant/palette import
- [ ] Check for CSS overrides setting fill to black
- [ ] Verify Recharts defaultProps or theme configuration

**QA Validation (after fix):**
- [ ] View 2 bars display in distinct colors
- [ ] View 3 bars display in distinct colors
- [ ] Colors match application theme
- [ ] Colors differentiate between bars
- [ ] No console errors related to rendering

---

## Recommendations

### Immediate Fix
1. Check Recharts Bar component `fill` property
2. Verify theme colors are being passed correctly
3. Add explicit color mapping for each bar
4. Test with color picker to verify hex values

### Short-term
1. Add color differentiation test to QA checklist
2. Create visual regression test for dashboard charts
3. Document expected chart color scheme

### Long-term
1. Implement design system tokens for chart colors
2. Create reusable themed chart component
3. Add visual testing to CI/CD pipeline

---

## Related Issues

- [[BUG-009]] - Bar chart labels truncated (related to bar chart component)
- [[BUG-004]] - Coverage by Sector empty (table view)

---

**Priority:** Fix before dashboard goes to production  
**Estimate:** Low effort (likely 1-2 hour fix)  
**Status:** Ready for investigation and fix
