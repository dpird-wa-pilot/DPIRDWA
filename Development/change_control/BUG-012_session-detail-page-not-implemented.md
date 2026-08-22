# BUG-012: SessionDetail Page Not Implemented

**Date Reported:** August 21, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** OPEN (Ready for Implementation)  
**Component:** Consultant Dashboard → SessionDetail Page  
**Route:** `/consultant/sessions/:sessionId`  
**Spec Reference:** CC-005 §6  

---

## Summary

The SessionDetail page (SessionDetail.jsx) which displays the analysis of a completed diagnostic session has **not been implemented**. This page is essential for consultants to review session results, dimension scores, and the knowledge graph visualization.

---

## What Needs to Be Implemented

### 1. File to Create
- **Path:** `src/pages/SessionDetail.jsx`
- **Type:** React functional component (default export)
- **Route:** `/consultant/sessions/:sessionId`
- **Protection:** Wrapped in ProtectedRoute

### 2. Component Structure

```jsx
export default function SessionDetail() {
  // Extract sessionId from URL params
  // Load session data from Supabase
  // Render full session analysis page
}
```

### 3. Page Layout

```
┌─────────────────────────────────────────────────┐
│ HEADER                                          │
│ ← Back to Dashboard                             │
│ Business Name | Sector | Date | DML Level      │
└─────────────────────────────────────────────────┘

┌────────────────────────┐  ┌──────────────────────┐
│ LEFT COLUMN (1/3)      │  │ RIGHT COLUMN (2/3)   │
│                        │  │                      │
│ ├─ Dimension Scores    │  │ ├─ Knowledge Graph   │
│ │  ├─ Operations %     │  │ │  Force-directed    │
│ │  ├─ Digital %        │  │ │  visualization     │
│ │  ├─ Market %         │  │ │  (BUG-011)         │
│ │  └─ Total Score      │  │ │                    │
│ │                      │  │ ├─ Match Results     │
│ └─ Responses Log       │  │ │  ├─ Grants table   │
│    ├─ Operations      │  │ │  ├─ Providers table │
│    ├─ Digital         │  │ │  └─ Resources table │
│    └─ Market          │  │
└────────────────────────┘  └──────────────────────┘
```

### 4. Header Section

**Required Information:**
- Business name (from session.business_name)
- Sector name (from session.sectors.name)
- Completion date (from session.completed_at or created_at)
- DML Level badge (from session.dml_level)
- Back button → navigate to `/consultant/dashboard`

**Styling:**
- Background: `bg-surface-container`
- Border: `border-b border-outline-variant`
- Padding: `px-8 py-6`
- Title: `text-2xl font-bold`
- Metadata: `text-on-surface-variant`

### 5. Left Column: Dimension Scores

**Section 1: Dimension Scores Card**
- Title: "Dimension Scores"
- Display 3 dimensions with progress bars:
  1. Operations: `session.score_operations`
  2. Digital: `session.score_digital`
  3. Market: `session.score_market`
- Each dimension shows:
  - Name (label)
  - Percentage (number)
  - Progress bar (width = percentage)
  - Color-coded by score:
    - Green: ≥ 70%
    - Yellow: 50-70%
    - Red: < 50%

**Section 2: Total Score**
- Display composite score: `session.total_score`
- Formula: (Operations × 0.35) + (Digital × 0.40) + (Market × 0.25)
- Text size: Large/bold
- Color: Same as individual scores (≥70% green, 50-70% yellow, <50% red)

**Section 3: Responses Log**
- Title: "Responses Log"
- Show all responses grouped by dimension
- For each dimension (operations, digital, market):
  - Display responses for that dimension
  - Show:
    - Question text
    - Answer value (user's response)
    - Activated tags (as green badges)
  - Each response card with light background

**Card Styling:**
- Background: `bg-surface-container`
- Padding: `p-6`
- Rounded: `rounded-2xl`
- Border: `border border-outline-variant`
- Space between cards: `gap-6`

### 6. Right Column: Knowledge Graph & Results

**Section 1: Knowledge Graph**
- Title: "Knowledge Graph"
- Subtitle: "Visual representation of how responses triggered tags and resulted in matches."
- Render: `<KnowledgeGraph sessionId={sessionId} />` (BUG-011)
- Container: `rounded-2xl`, `border-outline-variant`

**Section 2: Match Results Table**
- Title: "Match Results"
- Group results by type: Grants, Providers, Resources
- For each type (if results exist):
  - Subheading: "{Type}s" (e.g., "Grants", "Providers", "Resources")
  - Table columns:
    1. **Name** - result_name
    2. **Match** - match_score as percentage (formatted: "75%")
    3. **Matched Tags** - display up to 4 tags, show "+N" if more

**Table Styling:**
- Header row: `text-on-surface-variant`
- Body rows: alternate with light background
- Tags: Gray background pills/badges
- Score color-coded:
  - Green: ≥ 70%
  - Yellow: 40-70%
  - Red: < 40%

### 7. Data Loading Requirements

**Queries to Execute:**

```javascript
// Query 1: Get session with sector info
const { data: sessionData } = await supabase
  .from('diagnostic_sessions')
  .select(`*, sectors(name)`)
  .eq('id', sessionId)
  .single()

// Query 2: Get tags for label mapping
const { data: tagsData } = await supabase
  .from('tags')
  .select('name, label')

// Query 3: Get match results
const { data: matchResults } = await supabase
  .from('match_results')
  .select('*')
  .eq('session_id', sessionId)
  .order('match_score', { ascending: false })

// Query 4: Get responses with question dimension info
const { data: responsesData } = await supabase
  .from('user_responses')
  .select(`
    *,
    questions:question_id (
      question_text,
      dimension
    )
  `)
  .eq('session_id', sessionId)
```

### 8. State Management

```javascript
const [session, setSession] = useState(null)        // Session data
const [results, setResults] = useState([])          // Match results
const [responses, setResponses] = useState([])      // User responses
const [tagsMap, setTagsMap] = useState({})          // Tag name → label mapping
const [loading, setLoading] = useState(true)        // Loading state
```

### 9. Helper Functions

```javascript
// Render score color
const renderScoreColor = (score) => {
  if (score < 50) return 'text-error'
  if (score < 70) return 'text-amber-500'
  return 'text-green-600'
}

// Get responses by dimension
const getResponsesByDimension = (dim) => {
  return responses.filter(r => r.questions?.dimension === dim)
}
```

### 10. Implementation Checklist

**Loading & Error Handling:**
- [ ] Load session data on component mount
- [ ] Load tags for label mapping
- [ ] Load match results
- [ ] Load responses with dimensions
- [ ] Show loading spinner while fetching
- [ ] Handle "session not found" error
- [ ] Log errors to console

**Header Section:**
- [ ] Display business name
- [ ] Display sector name
- [ ] Display completion date (formatted)
- [ ] Display DML level badge
- [ ] Show back button with correct styling
- [ ] Back button navigates to dashboard

**Dimension Scores:**
- [ ] Show Operations score with progress bar
- [ ] Show Digital score with progress bar
- [ ] Show Market score with progress bar
- [ ] Display total score (composite calculation)
- [ ] Color-code bars by threshold

**Responses Log:**
- [ ] Group responses by dimension
- [ ] Show dimension name as header
- [ ] Display each response with:
  - Question text
  - Answer value
  - Activated tags as badges
- [ ] Show "No responses" if dimension empty

**Knowledge Graph:**
- [ ] Import KnowledgeGraph component
- [ ] Pass sessionId prop
- [ ] Display with correct styling

**Match Results:**
- [ ] Filter results by type
- [ ] Display only types with results
- [ ] Show table for each type
- [ ] Format match score as percentage
- [ ] Color-code scores
- [ ] Display matched tags
- [ ] Show "+N more" if tags exceed 4
- [ ] Handle empty results

**Responsive Design:**
- [ ] Grid layout: 1 col on mobile, 3 cols on desktop
- [ ] Use `lg:grid-cols-3` for layout
- [ ] Left column `lg:col-span-1`
- [ ] Right column `lg:col-span-2`
- [ ] Proper spacing and padding

### 11. Code Template

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { KnowledgeGraph } from '../components/KnowledgeGraph';

export default function SessionDetail() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);
  const [responses, setResponses] = useState([]);
  const [tagsMap, setTagsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    }
  }, [sessionId]);

  const loadSessionData = async (sId) => {
    setLoading(true);
    try {
      // TODO: Execute all 4 queries
      // TODO: Set state with data
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    // TODO: Loading spinner
  }

  if (!session) {
    // TODO: Session not found message
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* TODO: Header section */}
      {/* TODO: Left column with scores and responses */}
      {/* TODO: Right column with knowledge graph and results */}
    </div>
  );
}
```

### 12. Testing Requirements

**Functional Testing:**
- [ ] Page loads without errors
- [ ] Session data displays correctly
- [ ] All dimension scores show correct values
- [ ] Total score calculation is correct
- [ ] Responses appear grouped by dimension
- [ ] Knowledge Graph renders
- [ ] Match results table displays all results
- [ ] Results grouped by type
- [ ] Tags display with labels (not slugs)
- [ ] Navigation works (back button)

**Data Validation:**
- [ ] Score values are 0-100
- [ ] Total score formula: (Ops×0.35) + (Digital×0.40) + (Market×0.25)
- [ ] Tags mapped correctly
- [ ] Match results ordered by score

**Edge Cases:**
- [ ] Session with no responses
- [ ] Session with no results
- [ ] Missing sector info
- [ ] Invalid session ID
- [ ] Null/undefined fields

**UI/UX:**
- [ ] Responsive on mobile (1 column)
- [ ] Responsive on tablet (mixed layout)
- [ ] Responsive on desktop (3 columns)
- [ ] Color contrast meets WCAG standards
- [ ] Proper spacing and alignment

---

## Acceptance Criteria

✅ **Must Have:**
- Page renders session data correctly
- Dimension scores display with progress bars
- Responses organized by dimension
- Knowledge Graph integrates
- Match results table displays
- Back navigation works
- Responsive layout

✅ **Should Have:**
- Good performance (< 2s load)
- Color-coded scores
- Tag labels (not slugs)
- Error handling

---

## Dependencies

- **BUG-011:** Knowledge Graph component (required)
- **BUG-003:** Sessions must be marked `status='completed'` (prerequisite)

---

## Related Issues

- [[BUG-011]] - Knowledge Graph (imported into this page)
- [[BUG-013]] - ConsultantDashboard (links to this page)
- [[BUG-003]] - Completed sessions (data prerequisite)

---

## Notes for Development

- **Route Protection:** Wrapped in ProtectedRoute in App.jsx
- **Styling:** All Tailwind CSS (no inline styles)
- **Error Handling:** Show clear messages for missing data
- **Performance:** Optimize Supabase queries
- **Accessibility:** Use semantic HTML, proper labels

---

**Status:** Ready for Implementation  
**Estimated Effort:** 4-6 hours  
**Dependencies:** BUG-011 must be completed first  
**Priority:** P2 (depends on BUG-011)  
