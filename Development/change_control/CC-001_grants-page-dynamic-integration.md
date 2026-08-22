# CC-001 — Grants Page: Dynamic Data Integration
**Change Control ID:** CC-001  
**Document:** Technical Change Specification  
**Version:** 1.1  
**Date:** August 2026  
**Prepared by:** Eleven June Consulting  
**For:** Antigravity (implementation)  
**File affected:** `src/pages/Grants.jsx`  
**Status:** Pendiente

---

## 1. Context and Objective

The `Grants.jsx` page currently displays a list of grants using **hardcoded data** inside the component itself (the `grantsData` array). The goal of this change is to replace that static array with a **real-time query to the Supabase database**, so that any updates to the grants catalogue in the DB are automatically reflected on the page without requiring code changes.

The visual structure of the page (card grid layout, left filter panel, hero section) **remains unchanged**.

---

## 2. Summary of Changes

| Aspect | Current state | Target state |
|---|---|---|
| Data source | Hardcoded array inside the component | Query to `grants` table in Supabase |
| Filters available | Search + Status + Category (3 filters) | 7 filters: Industry, Business Structure, Support Type, Objectives, Business Stage, Grant Status, Indigenous Businesses |
| "Category/Industry" filter | Static hardcoded categories | Dynamic sectors extracted from `sector_tags` in the DB |
| "Status" filter | Open / Closed only | Open / Coming Soon / Closed / Ongoing |
| Card buttons | "Guidelines" + "Check Eligibility" | Single "Check Details" button |
| Button behaviour | Check Eligibility visible on Open grants only | Check Details on ALL grants → opens external URL in new tab |
| URL field | Hardcoded `guidelinesUrl` | `url` field from the `grants` table in Supabase |

---

## 3. Supabase Integration

### 3.1 Client Setup

Use the Supabase client already configured in the project. If it does not exist, create `src/lib/supabaseClient.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Required environment variables in `.env`:
```
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_ANON_KEY=<public anon key>
```

### 3.2 Main Query

Replace the `grantsData` array with a `useEffect` that queries Supabase when the component mounts:

```js
// [CC-001] Replace hardcoded grantsData with Supabase query
const [grants, setGrants] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchGrants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('grants')
      .select('id, name, slug, url, summary, description, status, open_date, close_date, sector_tags, program_type, administering_body, amount_min, amount_max, is_featured')
      .not('status', 'eq', 'archived')
      .order('status', { ascending: true })     // open first
      .order('close_date', { ascending: true }) // then by closing date

    if (error) {
      setError(error.message)
    } else {
      setGrants(data)
    }
    setLoading(false)
  }

  fetchGrants()
}, [])
```

> **Note:** Grants with `status = 'archived'` are excluded from the public listing and must not appear on the page.

---

## 4. Field Mapping: DB → UI

| DB field (`grants`) | Usage in card | Notes |
|---|---|---|
| `name` | Card title (`<h2>`) | Replaces `grant.title` |
| `summary` | Truncated description (3 lines) | Replaces `grant.description`. If `summary` is null, fall back to `description` |
| `status` | Status badge + filter | See values table below |
| `open_date` | "Start Date" on card | Format as "7 March 2026" (current format) |
| `close_date` | "End Date" on card | Format as "3 May 2026" |
| `sector_tags` | Sector/category badge | Array `text[]`. Display first element only. Convert slug → label (see section 5) |
| `url` | Destination of "Check Details" button | Open in `target="_blank" rel="noopener noreferrer"` |

### 4.1 `status` Values in DB and UI Labels

| DB value | UI label | Suggested colour |
|---|---|---|
| `open` | Open | Green (`text-[#1b5e20]`) — same as current |
| `coming_soon` | Coming Soon | Blue / Informational |
| `closed` | Closed | Red / Error (`text-error`) — same as current |
| `ongoing` | Ongoing | Dark green or teal |

### 4.2 Date Formatting

Convert `open_date` and `close_date` (ISO format `YYYY-MM-DD`) to the current display format:

```js
const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
}
```

### 4.3 sector_tags → Category Label

Convert the first element of the `sector_tags` array (slug) to a human-readable label:

```js
const sectorLabels = {
  agriculture: 'Agriculture',
  food_beverage: 'Food & Beverage',
  food_manufacturing: 'Food & Beverage',
  retail: 'Retail',
  construction: 'Construction',
  professional_services: 'Professional Services',
  aquaculture: 'Aquaculture',
  horticulture: 'Horticulture',
}

const getCategoryLabel = (sectorTags) => {
  if (!sectorTags || sectorTags.length === 0) return 'General'
  return sectorLabels[sectorTags[0]] || sectorTags[0]
}
```

---

## 5. Filter Changes

The filter panel is expanded from 3 filters to **7 filters**, aligned with the structure used by business.gov.au/grants-and-programs. All filters use checkbox groups (multi-select). No filter selected within a group = show all grants for that dimension.

---

### 5.0 Collapsible Filter Groups (Accordion Behaviour)

Each filter group must be independently expandable and collapsible. This is the primary UX interaction for the filter panel.

**Default state on page load:**
- **Grant Status** → expanded (most commonly used filter)
- **Industry** → expanded
- All other groups (Business Structure, Support Type, Objectives, Business Stage, Indigenous Businesses) → collapsed

**Behaviour:**
- Clicking the group header toggles its expanded/collapsed state
- Only the clicked group is affected — other groups keep their current state (independent accordion, not exclusive)
- A **chevron icon** (`expand_more` / `expand_less` from Material Symbols) rotates 180° when the group expands, indicating the current state
- Collapsing a group does **not** clear its active selections — filters remain applied even when the group is visually collapsed
- If a group has active selections and is collapsed, show a **count badge** next to the group title (e.g. "Industry · 2") so the user knows filters are active

**Implementation pattern — shared hook:**

```js
// [CC-001] Accordion state for 7 filter groups
const [openSections, setOpenSections] = useState({
  industry: true,
  business_structure: false,
  support_type: false,
  objectives: false,
  business_stage: false,
  grant_status: true,
  indigenous: false,
})

const toggleSection = (key) => {
  setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
}
```

**Filter group header component pattern:**

```jsx
const FilterGroup = ({ label, sectionKey, activeCount, children }) => {
  const isOpen = openSections[sectionKey]
  return (
    <div className="border-b border-outline-variant">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-md px-0 text-left hover:bg-surface-variant transition-colors"
      >
        <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-sm">
          {label}
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-on-primary rounded-full px-1.5 py-0.5 font-bold">
              {activeCount}
            </span>
          )}
        </span>
        <span
          className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200
            ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          expand_more
        </span>
      </button>
      {isOpen && (
        <div className="pb-md flex flex-col gap-sm">
          {children}
        </div>
      )}
    </div>
  )
}
```

**"Clear all filters" button:**

```jsx
const hasActiveFilters =
  searchQuery ||
  selectedIndustries.length > 0 ||
  selectedStructures.length > 0 ||
  selectedSupportTypes.length > 0 ||
  selectedObjectives.length > 0 ||
  Object.values(stageFilters).some(v => v) ||
  statusFilter.closed ||
  indigenousOnly

{hasActiveFilters && (
  <button
    onClick={clearAllFilters}
    className="text-primary font-label-sm text-label-sm hover:underline self-end"
  >
    Clear all filters
  </button>
)}
```

---

### 5.1 Search (keyword)

Keep as-is. Search against `name` and `summary` instead of `title` and `description`:

```js
const searchMatch =
  grant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (grant.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
```

---

### 5.2 Industry

**DB field:** `sector_tags` (text[])

```js
const availableIndustries = useMemo(() => {
  const slugs = new Set()
  grants.forEach(g => (g.sector_tags || []).forEach(s => slugs.add(s)))
  return Array.from(slugs).sort()
}, [grants])
```

Filter logic: show grant if its `sector_tags` array contains at least one of the selected industry slugs (OR logic). No industry selected = show all.

---

### 5.3 Business Structure

**DB field:** `eligible_structures` (text[])

| DB value | UI label |
|---|---|
| `company` | Company |
| `sole_trader` | Sole Trader |
| `trust` | Trust |
| `nfp` | Not-for-profit |
| `partnership` | Partnership |

Filter logic: show grant if its `eligible_structures` array contains at least one of the selected values. If `eligible_structures` is empty or null, the grant is always shown.

---

### 5.4 Support Type

**DB field:** `support_type` (text)

| DB value | UI label |
|---|---|
| `funding` | Funding |
| `advisory` | Advisory |
| `both` | Funding + Advisory |

---

### 5.5 Objectives

**DB field:** `objective_tags` (text[])

```js
const availableObjectives = useMemo(() => {
  const tags = new Set()
  grants.forEach(g => (g.objective_tags || []).forEach(t => tags.add(t)))
  return Array.from(tags).sort()
}, [grants])
```

| DB slug | UI label |
|---|---|
| `digital` | Digital Adoption |
| `ai` | Artificial Intelligence |
| `cybersecurity` | Cybersecurity |
| `export` | Export & Trade |
| `sustainability` | Sustainability |
| `supply_chain` | Supply Chain |
| `workforce` | Workforce Development |

---

### 5.6 Business Stage

**DB field:** `business_age_min` (integer) — **no new DB field needed**

| Stage | UI label | Logic |
|---|---|---|
| Starting | Starting out (0–1 yr) | `business_age_min = 0` OR `IS NULL` |
| Growing | Growing (1–3 yrs) | `business_age_min <= 2` OR `IS NULL` |
| Established | Established (3+ yrs) | Show all grants |

```js
const matchesStage = (grant, selectedStages) => {
  if (Object.values(selectedStages).every(v => !v)) return true
  const age = grant.business_age_min ?? 0
  if (selectedStages.starting && age === 0) return true
  if (selectedStages.growing && age <= 2) return true
  if (selectedStages.established) return true
  return false
}
```

---

### 5.7 Grant Status

**DB field:** `status` (text)

```js
// [CC-001] Status filter — 4 values; "Closed" unchecked by default
const [statusFilter, setStatusFilter] = useState({
  open: true,
  coming_soon: true,
  closed: false,
  ongoing: true,
})
```

---

### 5.8 Indigenous Businesses

**DB field:** `indigenous_focus` (text)

```js
const [indigenousOnly, setIndigenousOnly] = useState(false)

const matchesIndigenous = (grant) => {
  if (!indigenousOnly) return true
  return grant.indigenous_focus === 'exclusive' || grant.indigenous_focus === 'required'
}
```

---

### 5.9 Combined Filter Logic

```js
// [CC-001] Combined filter — AND across groups, OR within groups
const filteredGrants = useMemo(() => {
  return grants.filter(grant =>
    matchesSearch(grant, searchQuery) &&
    matchesIndustry(grant, selectedIndustries) &&
    matchesStructure(grant, selectedStructures) &&
    matchesSupportType(grant, selectedSupportTypes) &&
    matchesObjectives(grant, selectedObjectives) &&
    matchesStage(grant, stageFilters) &&
    matchesStatus(grant, statusFilter) &&
    matchesIndigenous(grant)
  )
}, [grants, searchQuery, selectedIndustries, selectedStructures,
    selectedSupportTypes, selectedObjectives, stageFilters,
    statusFilter, indigenousOnly])
```

---

## 6. Card Button Changes

```jsx
{/* [CC-001] Single "Check Details" button — replaces "Guidelines" + "Check Eligibility" */}
<a
  href={grant.url || '#'}
  target="_blank"
  rel="noopener noreferrer"
  onClick={!grant.url ? (e) => e.preventDefault() : undefined}
  className={`w-full block text-center font-label-md text-label-md py-2 px-4 rounded font-bold shadow-sm transition-colors
    ${grant.url
      ? 'bg-[#b58500] text-white hover:bg-secondary cursor-pointer'
      : 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-50'
    }`}
>
  Check Details
  <span className="material-symbols-outlined text-sm ml-1 align-middle">open_in_new</span>
</a>
```

---

## 7. Loading and Error States

```jsx
if (loading) {
  return (
    <div className="flex justify-center items-center py-2xl">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )
}

if (error) {
  return (
    <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
      <p className="font-body-md">Could not load grants. Please try again.</p>
    </div>
  )
}
```

---

## 8. Card Images

Keep current behaviour: assign a random image from the Unsplash pool using `grant.id % pool.length` as the index. No change required.

---

## 9. Sort Order

Implement "Closing Soon" as the default sort in the query (section 3.2). Other sort options deferred to future iteration.

---

## 10. What Does NOT Change

- Visual structure of the page (hero section, card grid layout, left filter panel)
- "Need Help?" panel (right sidebar)
- Number of grid columns (1/2/3 depending on breakpoint)
- Card images (Unsplash pool)
- Existing Tailwind styles
- `GrantsSection.jsx` component (not used on this page — do not modify)

---

## 11. Delivery Checklist for Antigravity

- [ ] Environment variables configured and working locally
- [ ] Data loaded dynamically from Supabase (no console errors)
- [ ] All 7 filter groups render correctly in the filter panel
- [ ] Each filter group expands and collapses independently on header click
- [ ] Chevron icon rotates 180° when group is expanded
- [ ] Default state on load: Grant Status + Industry expanded, rest collapsed
- [ ] Active selections are preserved when a group is collapsed
- [ ] Active count badge appears on collapsed groups that have selections
- [ ] "Clear all filters" button appears when any filter is active and resets everything
- [ ] Industry filter shows real sectors from the DB (dynamic, from `sector_tags`)
- [ ] Business Structure filter works with all 5 values
- [ ] Support Type filter works with all 3 values
- [ ] Objectives filter shows real tags from the DB (dynamic, from `objective_tags`)
- [ ] Business Stage filter derives correctly from `business_age_min` (no new DB field)
- [ ] Grant Status filter works with all 4 DB values ("Closed" unchecked by default)
- [ ] Indigenous Businesses toggle works correctly
- [ ] Combined filter logic: AND across groups, OR within each group
- [ ] Search filter works against `name` and `summary`
- [ ] Dates formatted correctly ("7 March 2026")
- [ ] Category badge shows the correct label (not the slug)
- [ ] "Check Details" button replaces both previous buttons
- [ ] Clicking "Check Details" opens `url` in a new tab
- [ ] Button is disabled when `url` is null
- [ ] Loading state (spinner) visible while querying Supabase
- [ ] Error state visible if query fails
- [ ] Grants with `status = 'archived'` do not appear in the listing
- [ ] Tested with real data from the `grants` table in Supabase
- [ ] Code blocks annotated with `// [CC-001]` comments in key sections

---

## 12. Dependencies

- `@supabase/supabase-js` — should already be installed. If not: `npm install @supabase/supabase-js`
- Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — share via secure channel (do not commit to repo)
