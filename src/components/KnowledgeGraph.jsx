// [CC-005] Knowledge graph — post-session analysis
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
    
    // Responsive width
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 384
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [sessionId]);

  const loadGraphData = async (sId) => {
    try {
      const [{ data: responses }, { data: results }] = await Promise.all([
        supabase
          .from('user_responses')
          .select('id, answer_value, tags_activated')
          .eq('session_id', sId),
        supabase
          .from('match_results')
          .select('result_id, result_name, result_type, match_score, matched_tags, reasoning_path')
          .eq('session_id', sId)
      ]);

      const allTags = [...new Set((responses ?? []).flatMap(r => r.tags_activated ?? []))];

      const nodes = [
        ...(responses ?? []).map(r => ({
          id:    `response-${r.id}`,
          type:  'response',
          label: (r.answer_value ?? '').slice(0, 35) + ((r.answer_value?.length > 35) ? '...' : ''),
          color: NODE_COLORS.response,
          val: 1
        })),
        ...allTags.map(t => ({
          id:    `tag-${t}`,
          type:  'tag',
          label: t,
          color: NODE_COLORS.tag,
          val: 1.5
        })),
        ...(results ?? []).map(r => ({
          id:        `result-${r.result_type}-${r.result_id}`,
          type:      r.result_type,
          label:     r.result_name,
          score:     r.match_score,
          reasoning: r.reasoning_path,
          color:     NODE_COLORS[r.result_type],
          val: 2 + (r.match_score * 2)
        }))
      ];

      const links = [
        ...(responses ?? []).flatMap(r =>
          (r.tags_activated ?? []).map(t => ({
            source: `response-${r.id}`,
            target: `tag-${t}`,
            width:  1
          }))
        ),
        ...(results ?? []).flatMap(r =>
          (r.matched_tags ?? []).slice(0, 3).map(tag => ({  // max 3 edges por resultado para no saturar
            source:   `tag-${tag}`,
            target:   `result-${r.result_type}-${r.result_id}`,
            width:    Math.max(1, (r.match_score || 0) * 4),
            strength: r.match_score
          }))
        )
      ];

      setGraphData({ nodes, links });
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
          nodeLabel={node =>
            `${node.label}${node.score ? ` (${Math.round(node.score * 100)}%)` : ''}`
          }
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

      {/* Legend */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 bg-surface/80 p-2 rounded border border-outline-variant backdrop-blur-sm">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-on-surface font-medium capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="absolute bottom-2 left-2 right-2 bg-surface p-4 rounded-lg shadow-md border border-outline-variant text-sm z-10 animate-fade-in max-h-40 overflow-y-auto">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-2 right-2 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          
          <div className="pr-6">
            <strong className="capitalize text-primary">{selectedNode.type}:</strong>{' '}
            <span className="font-medium text-on-surface">{selectedNode.label}</span>
            
            {selectedNode.score !== undefined && selectedNode.score !== null && (
              <div className="mt-1 font-bold text-green-600">
                Match Score: {Math.round(selectedNode.score * 100)}%
              </div>
            )}
            
            {selectedNode.reasoning && (
              <div className="mt-2 text-on-surface-variant text-xs bg-surface-container p-2 rounded">
                <strong>Reasoning:</strong>{' '}
                {typeof selectedNode.reasoning === 'string' 
                  ? selectedNode.reasoning 
                  : selectedNode.reasoning.explanation || JSON.stringify(selectedNode.reasoning)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
