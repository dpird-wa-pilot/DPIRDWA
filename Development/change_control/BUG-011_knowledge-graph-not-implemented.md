# BUG-011: Knowledge Graph Component Not Implemented

**Date Reported:** August 21, 2026  
**Severity:** 🔴 CRITICAL  
**Status:** OPEN (Ready for Implementation)  
**Component:** Consultant Dashboard → SessionDetail  
**Spec Reference:** CC-005 §6.3  

---

## Summary

The Knowledge Graph component (KnowledgeGraph.jsx) required for visualizing the response → tag → result flow in SessionDetail page has **not been implemented**. This component is essential for post-session analysis.

---

## What Needs to Be Implemented

### 1. File to Create
- **Path:** `src/components/KnowledgeGraph.jsx`
- **Type:** React functional component
- **Library:** `react-force-graph-2d` (already in package.json: v1.29.1)

### 2. Component Interface

```jsx
export function KnowledgeGraph({ sessionId }) {
  // Props:
  // - sessionId: string - the diagnostic session ID to visualize
  
  // Should render a force-directed graph visualization
}
```

### 3. Visual Requirements

#### Node Types (5 types with specific colors)
| Node Type | Color | Hex | Meaning |
|-----------|-------|-----|---------| 
| Response | Blue | #3B82F6 | User diagnostic response |
| Tag | Green | #22C55E | Activated tag from response |
| Grant | Red | #EF4444 | Matched grant result |
| Provider | Orange | #F97316 | Matched provider result |
| Resource | Yellow | #EAB308 | Matched resource result |

#### Features Required
- [ ] Force-directed graph layout (physics-based node positioning)
- [ ] Responsive sizing (adapts to container width/height)
- [ ] Interactive node selection (click node → show details)
- [ ] Legend showing all 5 node types
- [ ] Detail panel showing:
  - Node type
  - Node name/label
  - Match score (for result nodes)
  - Reasoning path (if available)
- [ ] Edge visualization with thickness proportional to match_score
- [ ] Smooth animations and transitions

### 4. Data Flow

#### Nodes to Create
```javascript
// From user_responses table
Nodes: Response nodes
- id: `response-{response_id}`
- type: "response"
- label: First 35 chars of answer_value
- color: #3B82F6 (blue)
- val: 1 (size factor)

// Derived from responses.tags_activated
Nodes: Tag nodes
- id: `tag-{tag_name}`
- type: "tag"
- label: tags.label (from tags table, not slug)
- color: #22C55E (green)
- val: 1.5 (size factor)

// From match_results table
Nodes: Result nodes (grant/provider/resource)
- id: `result-{result_type}-{result_id}`
- type: result_type ("grant", "provider", "resource")
- label: result_name
- score: match_score (0-1)
- color: NODE_COLORS[result_type]
- val: 2 + (match_score * 2) (size based on score)
```

#### Links/Edges to Create
```javascript
// Response → Tag connections
Links: From user_responses.tags_activated
- source: `response-{response_id}`
- target: `tag-{tag_name}`
- width: 1 (thin line)

// Tag → Result connections
Links: From match_results.matched_tags
- source: `tag-{matched_tag}`
- target: `result-{result_type}-{result_id}`
- width: Math.max(1, match_score * 4) (thicker for higher scores)
- strength: match_score (for physics simulation)
```

### 5. Database Queries Required

```javascript
// Query 1: Get user responses with activated tags
const { data: responses } = await supabase
  .from('user_responses')
  .select('id, answer_value, tags_activated')
  .eq('session_id', sessionId)

// Query 2: Get match results
const { data: results } = await supabase
  .from('match_results')
  .select('result_id, result_name, result_type, match_score, matched_tags, reasoning_path')
  .eq('session_id', sessionId)

// Query 3: Get tag labels
const { data: tags } = await supabase
  .from('tags')
  .select('name, label')
```

### 6. UI Layout Requirements

**Container:**
- CSS Class: `h-96` (height: 24rem / 384px)
- Background: `bg-surface-container`
- Border: `border border-outline-variant`
- Rounded: `rounded-lg`
- Overflow: `overflow-hidden`

**Legend (top-left):**
```
Response  [blue dot]
Tag       [green dot]
Grant     [red dot]
Provider  [orange dot]
Resource  [yellow dot]
```
- Background: `bg-surface/80` (semi-transparent)
- Padding: `p-2`
- Rounded: `rounded`
- Backdrop blur: `backdrop-blur-sm`

**Detail Panel (bottom-left, on node click):**
- Show node type, name, score, reasoning
- Click close (X) button to hide
- Background: `bg-surface`
- Padding: `p-4`
- Border: `border border-outline-variant`
- Max height: `max-h-40` with scroll

### 7. Implementation Checklist

**Data Handling:**
- [ ] Load responses with tags_activated array
- [ ] Load match_results with matched_tags array
- [ ] Load tags table for label mapping
- [ ] Handle empty/null data gracefully
- [ ] Create tagsMap: { tag_name: tag_label }

**Graph Construction:**
- [ ] Build nodes array with 3 types: responses, tags, results
- [ ] Build links array with proper connections
- [ ] Apply correct colors to nodes
- [ ] Set node sizes based on val property
- [ ] Limit edges per result to max 3 (to avoid saturation)

**Rendering:**
- [ ] Import ForceGraph2D from 'react-force-graph-2d'
- [ ] Configure graph dimensions and physics
- [ ] Render legend in top-left
- [ ] Render detail panel on node click
- [ ] Handle responsive sizing with window resize listener

**Error Handling:**
- [ ] Show loading state while fetching data
- [ ] Show "Loading graph data..." message if no data
- [ ] Log errors to console (console.error)
- [ ] Graceful fallback if Supabase query fails

### 8. Code Template

```jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { supabase } from '../lib/supabaseClient';

const NODE_COLORS = {
  response: '#3B82F6',  // blue
  tag:      '#22C55E',  // green
  grant:    '#EF4444',  // red
  provider: '#F97316',  // orange
  resource: '#EAB308'   // yellow
};

export function KnowledgeGraph({ sessionId }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 560, height: 384 });

  useEffect(() => {
    if (sessionId) loadGraphData(sessionId);
    // TODO: Add resize listener
  }, [sessionId]);

  const loadGraphData = async (sId) => {
    try {
      // TODO: Fetch responses, results, tags from Supabase
      // TODO: Build nodes array
      // TODO: Build links array
      // TODO: Set graph data
    } catch (err) {
      console.error("Error loading graph data:", err);
    }
  };

  return (
    <div ref={containerRef} className="relative h-96 bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
      {graphData.nodes.length > 0 ? (
        <ForceGraph2D
          graphData={graphData}
          nodeColor={node => node.color}
          nodeLabel={node => /* TODO: format label with score */}
          nodeVal={node => node.val}
          linkWidth={link => link.width ?? 1}
          linkColor={() => '#94A3B8'}
          onNodeClick={useCallback(node => setSelectedNode(node), [])}
          width={dimensions.width}
          height={dimensions.height}
          cooldownTicks={100}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
          Loading graph data...
        </div>
      )}

      {/* TODO: Legend */}
      {/* TODO: Detail Panel */}
    </div>
  );
}
```

### 9. Testing Requirements

**Functional Testing:**
- [ ] Component renders without errors
- [ ] Graph loads data from Supabase correctly
- [ ] Nodes appear for responses, tags, and results
- [ ] Node colors match specification
- [ ] Node sizes vary based on match_score
- [ ] Links connect nodes appropriately
- [ ] Legend displays all 5 node types
- [ ] Clicking node shows detail panel
- [ ] Detail panel shows correct information
- [ ] Closing detail panel works

**Performance Testing:**
- [ ] Graph renders within 1 second
- [ ] No memory leaks on component unmount
- [ ] Smooth animations (60 fps)
- [ ] Responsive to window resize

**Edge Cases:**
- [ ] Handle session with no responses
- [ ] Handle session with no results
- [ ] Handle missing tag labels
- [ ] Handle null/undefined fields gracefully

---

## Acceptance Criteria

✅ **Must Have:**
- Force-directed graph visualization renders
- 5 node types with correct colors
- Interactive node selection
- Legend showing all types
- Detail panel with node information
- Links proportional to match_score
- Responsive sizing

✅ **Should Have:**
- Smooth animations
- Good performance (< 1s render)
- Fallback for empty data

---

## Related Issues

- [[BUG-012]] - SessionDetail page (depends on this)
- [[BUG-004]] - Coverage by Sector (different visualization)

---

## Notes for Development

- **Library:** `react-force-graph-2d` is already installed (v1.29.1)
- **Integration:** Will be used in SessionDetail.jsx component
- **Styling:** Use Tailwind CSS classes (not inline CSS)
- **Tags:** Must display labels from tags.label, not slugs
- **Scoring:** Match scores range 0-1, display as percentage

---

**Status:** Ready for Implementation  
**Estimated Effort:** 4-6 hours  
**Dependencies:** BUG-003 (sessions marked completed) must be fixed first  
**Priority:** P2 (depends on other components)  
