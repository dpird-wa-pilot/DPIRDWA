# Fixes Applied — August 21, 2026

## BUG-002 Resolution (v2)

### Files Modified
- `src/lib/matchingEngine.js`
- `src/pages/Advisor.jsx`

### Changes

#### 1. matchingEngine.js — Fixed Geographic Factor
**Problem:** Grants with `geographic_scope = ['all_wa']` were being filtered out for all WA users
**Fix:** Added fallback for `all_wa` to treat it as a wildcard for any WA location (metro_wa, regional_wa, remote_wa)

```javascript
// Now handles all_wa correctly
if (resultLocations.includes('all_wa') && WA_LOCATIONS.includes(businessLocation)) return 1.0;
// Also handles missing location gracefully
if (!businessLocation) return 1.0;
```

#### 2. matchingEngine.js — Fixed Eligibility Factor
**Problem:** Empty profile fields (businessAgeYears, employeeCount as `''`) were triggering false penalties via string coercion
**Fix:** Explicitly parse strings to integers and only penalize when both values are known

```javascript
const businessAgeYears = profile.businessAgeYears !== '' && profile.businessAgeYears != null
  ? parseInt(profile.businessAgeYears, 10) : null;
// Only penalize when both values are known
if (grant.business_age_min > 0 && businessAgeYears !== null && businessAgeYears < grant.business_age_min) {
  score *= 0.3;
}
```

#### 3. Advisor.jsx — Added Missing Location & Has ABN Fields (Step 1)
**Problem:** CC-004 requires 8 profile fields but only 4 were implemented. Missing location meant `profile.location` was always `''`, preventing geographic filtering
**Fix:** Added Location select and Has ABN toggle to Step 1

```javascript
// New Location field
<select value={wizardState.profile.location} onChange={(e) => handleProfileChange('location', e.target.value)}>
  <option value="metro_wa">Perth Metro (within 50km of CBD)</option>
  <option value="regional_wa">Regional WA</option>
  <option value="remote_wa">Remote WA</option>
</select>

// New Has ABN field (was hardcoded to true before)
<label>
  <input type="radio" value="yes" checked={wizardState.profile.hasAbn === true} 
    onChange={() => handleProfileChange('hasAbn', true)} />
  Yes
</label>
```

#### 4. Advisor.jsx — Fixed Grants Query
**Problem:** Query selected `location` column which doesn't exist in grants table (schema uses `geographic_scope`)
**Fix:** Removed invalid `location` from select; kept `geographic_scope`

```javascript
// Was: .select('... location, geographic_scope ...')  ❌ INVALID
// Now: .select('... geographic_scope ...')  ✅ CORRECT
```

#### 5. Advisor.jsx — Added Supabase Query Error Logging
**Problem:** Query errors were swallowed silently by `grantsRes.data || []`, making debugging impossible
**Fix:** Added explicit error logging before fallback

```javascript
if (grantsRes.error) console.error('[BFS] grants query failed:', grantsRes.error.message);
if (providersRes.error) console.error('[BFS] providers query failed:', providersRes.error.message);
if (resourcesRes.error) console.error('[BFS] resources query failed:', resourcesRes.error.message);
```

#### 6. Advisor.jsx — Updated isStepValid
**Fix:** Made location required in Step 1 validation

```javascript
if (wizardState.currentStep === 1) {
  return !!wizardState.profile.sectorId && !!wizardState.profile.location;
}
```

---

## CC-005 Knowledge Graph Fix

### File Modified
- `src/components/KnowledgeGraph.jsx`

### Changes

#### 1. Removed Unnecessary Query
**Problem:** Component was querying entire `tags` table unnecessarily
**Fix:** Removed third query; tags are already in `tags_activated` from `user_responses`

#### 2. Added Comprehensive Error Handling
**Before:**
```javascript
catch (err) {
  console.error("Error loading graph data:", err);
}
```

**After:**
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// ... in loadGraphData:
if (respError) {
  console.error('[KnowledgeGraph] user_responses query failed:', respError.message);
  setError(`Failed to load responses: ${respError.message}`);
  return;
}
```

#### 3. Fixed ForceGraph2D Rendering
**Problems:**
- Component showed "Loading graph data..." indefinitely if queries failed
- No visual indication of errors
- Used incorrect prop `cooldownTicks` instead of `warmupTicks`

**Fixes:**
- Added separate `loading` and `error` states
- Shows error panel with message if queries fail
- Shows loading spinner while fetching
- Shows "No graph data" message if session has no data
- Changed `cooldownTicks` → `warmupTicks`

#### 4. Added Debugging Logs
```javascript
console.log('[KnowledgeGraph] Loading data for session:', sId);
console.log('[KnowledgeGraph] Loaded responses:', responses?.length || 0);
console.log('[KnowledgeGraph] Loaded results:', results?.length || 0);
console.log('[KnowledgeGraph] Unique tags:', allTags.length);
console.log('[KnowledgeGraph] Graph data created:', { nodes: nodes.length, links: links.length });
```

These logs will appear in browser console under the `[KnowledgeGraph]` prefix, making it easy to diagnose future issues.

---

## Testing Checklist

### BUG-002 Fixes
- [ ] Build and deploy code
- [ ] Test Step 1: Location field is visible and required
- [ ] Test Step 1: Has ABN field is visible and toggles correctly
- [ ] Test Results: Grants appear (not 0)
- [ ] Open DevTools Console: No `[BFS]` error messages
- [ ] If no grants, check console for `[KnowledgeGraph]` logs

### CC-005 Knowledge Graph
- [ ] Navigate to consultant dashboard
- [ ] Click a session → Session detail page loads
- [ ] Knowledge Graph appears (shows loading spinner first)
- [ ] Check browser console for `[KnowledgeGraph]` logs
- [ ] If graph doesn't appear, note the error message from error panel
- [ ] Click a node → Detail panel shows score and reasoning

---

**Deployed:** August 21, 2026  
**Status:** Ready for testing
