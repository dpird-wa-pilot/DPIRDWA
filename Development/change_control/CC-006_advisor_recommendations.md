# ✨ CHANGE CONTROL: Advisor Page — Save Recommendations Feature

**CC ID:** CC-006  
**Title:** Advisor Page — Save Recommendations with Contact Capture  
**Type:** 🟢 **FEATURE**  
**Component:** Advisor Page — Results Screen (Step 5)  
**Prepared by:** Esteban Torres / Eleven June Consulting  
**Date:** August 22, 2026  
**Status:** 🟡 **READY FOR IMPLEMENTATION**  
**Assigned to:** Antigravity Development Lead  

---

## Executive Summary

This change adds a **floating "Save Recommendations" button** to the Advisor diagnostic results page (Step 5). When clicked, it opens a modal form that captures the user's contact information and business details, then saves this data to the `diagnostic_sessions` table along with their personalized recommendations.

**Objective:** Enable users to preserve their diagnostic results and contact information for future reference and potential outreach by DPIRD advisors.

**Impact:** 
- ✅ Users can save and archive their diagnostic sessions
- ✅ DPIRD gains contact information for follow-up engagement
- ✅ No email sending (data persistence only)
- ✅ Full validation on email format, ABN format, required fields

**Urgency:** 🟡 **STANDARD** — Nice-to-have feature for user engagement

---

## Detailed Specification

### User Workflow

```
User completes diagnostic (Steps 1-5)
        ↓
Views recommendations on Step 5
        ↓
Clicks floating "Save" button (bottom-left, mail icon)
        ↓
Modal opens with contact form
        ↓
User fills 6 required fields:
  • Business Name
  • ABN (Australian Business Number)
  • Business Structure (dropdown, 6 options)
  • Annual Turnover Range (dropdown, 7 ranges)
  • Contact Name
  • Contact Email
        ↓
Form validates on submission (client-side)
        ↓
Confirmation info box appears
        ↓
User clicks "Save Recommendations"
        ↓
API validates on server (security check)
        ↓
Data saved to diagnostic_sessions table
        ↓
Success message shown ("✅ Your recommendations have been saved!")
        ↓
Modal auto-closes after 2 seconds
```

### Form Fields Specification

| Field | Type | Validation | Required | Options/Examples |
|-------|------|-----------|----------|------------------|
| **Business Name** | Text Input | Non-empty, trimmed | ✅ Yes | "ABC Manufacturing Pty Ltd" |
| **ABN** | Numeric Input | Exactly 11 digits | ✅ Yes | "12345678901" |
| **Business Structure** | Dropdown | One of 6 values | ✅ Yes | sole_trader, partnership, company, trust, cooperative, nfp |
| **Annual Turnover Range** | Dropdown | One of 7 ranges | ✅ Yes | under_250k, 250k_500k, 500k_1m, 1m_5m, 5m_10m, 10m_50m, over_50m |
| **Contact Name** | Text Input | Non-empty, trimmed | ✅ Yes | "John Smith" |
| **Contact Email** | Email Input | Valid email format | ✅ Yes | "john@example.com.au" |

### Annual Turnover Range Options

1. **under_250k** — Under $250,000
2. **250k_500k** — $250,000 - $500,000
3. **500k_1m** — $500,000 - $1,000,000
4. **1m_5m** — $1,000,000 - $5,000,000
5. **5m_10m** — $5,000,000 - $10,000,000
6. **10m_50m** — $10,000,000 - $50,000,000
7. **over_50m** — Over $50,000,000

---

## Component Specifications

### Frontend Component: EmailSubmissionModal.jsx

**Location:** `src/components/EmailSubmissionModal.jsx`

**Props:**
```javascript
{
  sessionId: string,              // Required: UUID from diagnostic_sessions
  recommendations: array,         // Required: Matched grants/providers/resources
  onSuccess?: (result) => void,  // Optional: Callback on success
  onError?: (error) => void      // Optional: Callback on error
}
```

**Floating Button:**
- Position: `fixed bottom-6 left-6 z-40`
- Icon: Material Symbols `mail`
- Color: Primary (default), Primary-container (hover)
- Size: 56px × 56px
- Shadow: `shadow-[0px_4px_12px_rgba(0,0,0,0.15)]`
- Hover: Scale 110%

**Modal:**
- Width: 100% on mobile, max-w-[500px] on desktop
- Height: Max 90vh with scroll
- Backdrop: Semi-transparent (bg-black/50)
- z-index: 50

**Header:**
- Background: Primary color
- Text: On-primary color
- Icon + Title + Close button
- Sticky: Stays visible on scroll

**Form Validation (Client-side):**
- Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- ABN: `/^[0-9]{11}$/` (exactly 11 digits)
- All fields: Non-empty after trim
- Business Structure: Must be selected (dropdown)
- Annual Turnover Range: Must be selected (dropdown)

**Error Handling:**
- Display field-level errors below each input
- Clear errors when user starts typing
- Show general error message if API fails
- User can retry without reloading

**Success State:**
- Show green success message: "✅ Your recommendations have been saved successfully!"
- Clear all form fields
- Auto-close modal after 2 seconds
- Call optional `onSuccess` callback

### Backend API: POST /api/advisor/save-recommendations

**Endpoint:** `/api/advisor/save-recommendations`  
**Method:** POST  
**Content-Type:** application/json  
**Authentication:** None (public endpoint)

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "businessName": "ABC Manufacturing Pty Ltd",
  "abn": "12345678901",
  "businessStructure": "company",
  "annualTurnoverRange": "1m_5m",
  "contactName": "John Smith",
  "contactEmail": "john@abc-manufacturing.com.au",
  "recommendationsCount": 8,
  "recommendationsSummary": "[...]"
}
```

**Server-side Validation:**

1. **Required Fields:** All 6 fields must be present
   - Response: `400 Bad Request`
   - Message: Lists missing fields

2. **Email Format:** Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Response: `400 Bad Request`
   - Message: "Invalid email format"

3. **ABN Format:** Must match `/^[0-9]{11}$/`
   - Response: `400 Bad Request`
   - Message: "ABN must be exactly 11 digits"

4. **Business Structure:** Must be one of 6 valid values
   - Response: `400 Bad Request`
   - Message: "Invalid business structure"

5. **Annual Turnover Range:** Must be one of 7 valid ranges
   - Response: `400 Bad Request`
   - Message: "Invalid annual turnover range"

6. **Session Exists:** sessionId must exist in `diagnostic_sessions`
   - Response: `404 Not Found`
   - Message: "Session not found. Please ensure you complete the diagnostic first."

**Success Response (200 OK):**
```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "savedAt": "2026-08-22T14:30:00.000Z",
  "message": "Your recommendations have been saved successfully!"
}
```

**Database Update:**
- Table: `diagnostic_sessions`
- Operation: UPDATE
- Fields updated:
  - `business_name` (text)
  - `abn` (text)
  - `business_structure` (text)
  - `annual_turnover_range` (text)
  - `contact_name` (text)
  - `contact_email` (text)
  - `recommendations_count` (integer)
  - `recommendations_summary` (jsonb)
  - `recommendations_shared_at` (timestamp)
  - `updated_at` (timestamp)

---

## Integration Points

### Advisor.jsx Modifications

**Import:**
```jsx
import EmailSubmissionModal from '../components/EmailSubmissionModal';
```

**Usage (in Step 5 JSX):**
```jsx
{/* Floating Save Button — appears on Step 5 results */}
{currentStep === 5 && sessionId && (
  <EmailSubmissionModal
    sessionId={sessionId}
    recommendations={[
      ...matchedGrants,
      ...matchedProviders,
      ...matchedResources
    ]}
    onSuccess={(result) => {
      console.log('Recommendations saved:', result);
    }}
    onError={(error) => {
      console.error('Failed to save recommendations:', error);
    }}
  />
)}
```

### Database Schema Changes

**SQL to add columns (if missing):**
```sql
ALTER TABLE diagnostic_sessions
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS abn TEXT,
ADD COLUMN IF NOT EXISTS business_structure TEXT,
ADD COLUMN IF NOT EXISTS annual_turnover_range TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS recommendations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recommendations_summary JSONB,
ADD COLUMN IF NOT EXISTS recommendations_shared_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

**Recommended Constraints:**
```sql
-- Validate ABN format
ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_abn_format 
CHECK (abn IS NULL OR (abn ~ '^[0-9]{11}$'));

-- Validate business structure
ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_business_structure 
CHECK (business_structure IS NULL OR business_structure IN 
  ('sole_trader', 'partnership', 'company', 'trust', 'cooperative', 'nfp'));

-- Validate turnover range
ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_annual_turnover_range 
CHECK (annual_turnover_range IS NULL OR annual_turnover_range IN 
  ('under_250k', '250k_500k', '500k_1m', '1m_5m', '5m_10m', '10m_50m', 'over_50m'));
```

---

## Testing Requirements

### Functional Tests

✅ Floating button visible on Step 5  
✅ Button has correct icon, color, position  
✅ Click button opens modal  
✅ Modal displays all 6 form fields  
✅ Business Structure dropdown shows 6 options  
✅ Annual Turnover Range dropdown shows 7 options  
✅ ABN field only accepts digits (non-digits stripped)  
✅ X button closes modal  
✅ Click outside modal closes it  
✅ Cancel button closes modal  
✅ Success message appears after save  
✅ Modal auto-closes 2 seconds after success  

### Validation Tests

✅ Valid email accepted: `john@example.com`, `jane.doe@company.co.uk`  
✅ Invalid email rejected: `john@`, `john.com`, `@example.com`  
✅ Valid ABN accepted: `12345678901` (11 digits)  
✅ Invalid ABN rejected: `1234567890` (10 digits), `123456789012` (12 digits)  
✅ All fields required (none can be empty)  
✅ All dropdowns require selection  
✅ Field errors clear when user types  

### API Tests

✅ Valid request returns 200 OK  
✅ Missing field returns 400 with field list  
✅ Invalid email returns 400 with error message  
✅ Invalid ABN returns 400 with error message  
✅ Invalid structure returns 400 with valid options  
✅ Invalid turnover range returns 400 with valid options  
✅ Non-existent session returns 404  
✅ Data persists to database correctly  
✅ `recommendations_shared_at` timestamp set correctly  

### E2E Flow

1. Complete Advisor Steps 1-5
2. Click floating Save button
3. Fill form with valid data
4. Click Save Recommendations
5. Verify success message
6. Verify modal closes
7. Query database: Data is present and correct

---

## Success Criteria

Feature is **COMPLETE** when:

- [ ] Floating button visible on Step 5, correct styling
- [ ] Modal opens/closes correctly on all interactions
- [ ] All 6 form fields render with correct labels
- [ ] Client-side validation works for all fields
- [ ] API endpoint returns 200 on valid data
- [ ] API returns proper error codes (400, 404, 500)
- [ ] Data persists to `diagnostic_sessions` table
- [ ] All database columns created/verified
- [ ] Success message displays and modal auto-closes
- [ ] Error handling is graceful (user sees message, can retry)
- [ ] Mobile responsive (works on 375px+ width)
- [ ] No console errors during normal operation
- [ ] All test cases pass

---

## Implementation Checklist

- [ ] Create `src/components/EmailSubmissionModal.jsx`
- [ ] Create `api/advisor/save-recommendations.js`
- [ ] Import component in `src/pages/Advisor.jsx`
- [ ] Add JSX to Step 5 in Advisor.jsx
- [ ] Run database migrations (add columns)
- [ ] Test all validation scenarios
- [ ] Test E2E flow on multiple browsers
- [ ] Verify mobile responsiveness
- [ ] Check console for errors
- [ ] Test error scenarios (network, invalid data)
- [ ] Deploy to staging environment
- [ ] Final UAT with stakeholders

---

## Estimated Effort

- **Implementation Time:** 3-4 hours
- **Testing Time:** 2-3 hours
- **Total:** 5-7 hours

**Dependencies:**
- Supabase client (already configured)
- React hooks (useState, useEffect, useRef)
- Tailwind CSS (already available)
- Material Symbols icons (already available)

**No blocking issues identified**

---

## Files to Deliver

1. ✅ `src/components/EmailSubmissionModal.jsx` — React component
2. ✅ `api/advisor/save-recommendations.js` — Backend API route
3. ✅ Modified `src/pages/Advisor.jsx` — Integration point (code snippet provided)
4. ✅ `database-migration.sql` — Schema changes script
5. ✅ This CC-006 document

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Prepared by | Esteban Torres | 2026-08-22 | ✅ |
| Reviewed by | — | — | ⏳ |
| Approved for Implementation | — | — | ⏳ |
| Implementation Complete | — | — | ⏳ |

---

**Document Version History:**
- **v1.0** (2026-08-22): Initial specification with annual_turnover_range field

**Questions/Issues:** Contact Esteban Torres (estebane.torresc@gmail.com)
