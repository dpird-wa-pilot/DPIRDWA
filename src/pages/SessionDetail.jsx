// [CC-005] Consultant Session Detail
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
      // Load session details
      const { data: sessionData } = await supabase
        .from('diagnostic_sessions')
        .select(`*, sectors(name)`)
        .eq('id', sId)
        .single();
        
      setSession(sessionData);

      // Load tags map
      const { data: tagsData } = await supabase.from('tags').select('slug, name');
      if (tagsData) {
        const map = {};
        tagsData.forEach(t => { map[t.slug] = t.name; });
        setTagsMap(map);
      }

      // Load results
      const { data: matchResults } = await supabase
        .from('match_results')
        .select('*')
        .eq('session_id', sId)
        .order('match_score', { ascending: false });
        
      setResults(matchResults || []);

      // Load responses joined with questions to get dimension
      const { data: responsesData } = await supabase
        .from('user_responses')
        .select(`
          *,
          questions:question_id (
            question_text,
            dimension
          )
        `)
        .eq('session_id', sId);
        
      setResponses(responsesData || []);
    } catch (err) {
      console.error("Error loading session:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface p-8 text-center">
        <h2 className="text-xl text-error font-bold mb-4">Session not found</h2>
        <Link to="/consultant/dashboard" className="text-primary hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const renderScoreColor = (score) => {
    if (score < 50) return 'text-error';
    if (score < 70) return 'text-amber-500';
    return 'text-green-600';
  };

  const getResponsesByDimension = (dim) => {
    return responses.filter(r => r.questions?.dimension === dim);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-surface-container border-b border-outline-variant px-8 py-6">
        <Link to="/consultant/dashboard" className="text-primary hover:text-primary-hover font-medium flex items-center gap-1 mb-4 w-max">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">
              {session.business_name || 'Anonymous Business'}
            </h1>
            <p className="text-on-surface-variant mt-1 flex gap-3 items-center">
              <span>Sector: <strong className="text-on-surface">{session.sectors?.name || 'Unknown'}</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-on-surface">{new Date(session.completed_at || session.created_at).toLocaleString()}</strong></span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-on-surface-variant">DML Level</div>
            <div className="text-xl font-bold text-primary capitalize">{session.dml_level || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Dimension Scores</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>Operations</span>
                  <span className={renderScoreColor(session.score_operations)}>{session.score_operations}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className={`h-full ${session.score_operations >= 70 ? 'bg-green-500' : session.score_operations >= 50 ? 'bg-amber-500' : 'bg-error'}`} style={{ width: `${session.score_operations}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>Digital</span>
                  <span className={renderScoreColor(session.score_digital)}>{session.score_digital}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className={`h-full ${session.score_digital >= 70 ? 'bg-green-500' : session.score_digital >= 50 ? 'bg-amber-500' : 'bg-error'}`} style={{ width: `${session.score_digital}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span>Market</span>
                  <span className={renderScoreColor(session.score_market)}>{session.score_market}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div className={`h-full ${session.score_market >= 70 ? 'bg-green-500' : session.score_market >= 50 ? 'bg-amber-500' : 'bg-error'}`} style={{ width: `${session.score_market}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-outline-variant flex justify-between items-center">
              <span className="font-bold text-on-surface">Total Score</span>
              <span className={`text-2xl font-black ${renderScoreColor(session.total_score)}`}>{session.total_score}%</span>
            </div>
          </div>
          
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Responses Log</h2>
            <div className="space-y-6">
              {['operations', 'digital', 'market'].map(dim => (
                <div key={dim}>
                  <h3 className="font-bold text-sm text-on-surface-variant uppercase tracking-wider mb-3">{dim}</h3>
                  <div className="space-y-3">
                    {getResponsesByDimension(dim).map(r => (
                      <div key={r.id} className="bg-surface p-3 rounded-lg border border-outline-variant text-sm">
                        <p className="font-medium text-on-surface mb-1">{r.questions?.question_text || 'Unknown Question'}</p>
                        <p className="text-primary font-medium">{r.answer_value || 'Skipped'}</p>
                        {r.tags_activated && r.tags_activated.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags_activated.map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-mono rounded">
                                {tagsMap[t] || t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {getResponsesByDimension(dim).length === 0 && (
                      <p className="text-xs text-on-surface-variant italic">No responses recorded for this dimension.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Knowledge Graph & Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-1">Knowledge Graph</h2>
            <p className="text-sm text-on-surface-variant mb-4">Visual representation of how responses triggered tags and resulted in matches.</p>
            <KnowledgeGraph sessionId={sessionId} />
          </div>

          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h2 className="text-lg font-bold text-on-surface mb-4">Match Results</h2>
            
            {['grant', 'provider', 'resource'].map(type => {
              const typeResults = results.filter(r => r.result_type === type);
              if (typeResults.length === 0) return null;
              
              return (
                <div key={type} className="mb-6 last:mb-0">
                  <h3 className="font-bold text-md capitalize text-on-surface mb-3 border-b border-outline-variant pb-2">{type}s</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-on-surface-variant">
                        <tr>
                          <th className="py-2 pr-4 font-medium">Name</th>
                          <th className="py-2 pr-4 font-medium">Match</th>
                          <th className="py-2 font-medium">Matched Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {typeResults.map(r => (
                          <tr key={r.id} className="border-t border-outline-variant/50">
                            <td className="py-3 pr-4 font-medium text-on-surface max-w-[250px] truncate" title={r.result_name}>
                              {r.result_name}
                            </td>
                            <td className={`py-3 pr-4 font-bold ${r.match_score >= 0.7 ? 'text-green-600' : r.match_score >= 0.4 ? 'text-amber-500' : 'text-error'}`}>
                              {Math.round(r.match_score * 100)}%
                            </td>
                            <td className="py-3">
                              <div className="flex flex-wrap gap-1">
                                {(r.matched_tags || []).slice(0, 4).map(t => (
                                  <span key={t} className="px-1.5 py-0.5 bg-surface text-on-surface-variant text-[10px] font-mono rounded border border-outline-variant">
                                    {tagsMap[t] || t}
                                  </span>
                                ))}
                                {(r.matched_tags || []).length > 4 && (
                                  <span className="px-1.5 py-0.5 bg-surface text-on-surface-variant text-[10px] font-mono rounded border border-outline-variant">
                                    +{(r.matched_tags || []).length - 4}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            
            {results.length === 0 && (
              <p className="text-on-surface-variant text-center py-8 bg-surface rounded-lg">No match results found for this session.</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
