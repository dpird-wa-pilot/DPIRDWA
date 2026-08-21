// [CC-005] Consultant Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useConsultant } from '../lib/consultantContext';
import { avg, groupBy, countFrequency, weeklyTrend, getISOWeekLabel } from '../lib/analyticsEngine';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function ConsultantDashboard() {
  const { currentConsultant, setConsultantMode, setCurrentConsultant } = useConsultant();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [coverageBySector, setCoverageBySector] = useState([]);
  const [topGrants, setTopGrants] = useState([]);
  const [topResources, setTopResources] = useState([]);
  const [unmetNeeds, setUnmetNeeds] = useState({ total_unmet: 0, without_grant: 0, without_provider: 0, without_resource: 0 });
  const [undercoveredTags, setUndercoveredTags] = useState([]);
  const [potentialGrants, setPotentialGrants] = useState(null);
  const [temporalTrends, setTemporalTrends] = useState([]);
  const [dimensionCoverage, setDimensionCoverage] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCoverageBySector(),
        fetchTopGrants(),
        fetchTopResources(),
        fetchUnmetNeeds(),
        fetchUndercoveredTagsAndPotential(),
        fetchTemporalTrends(),
        fetchDimensionCoverage(),
        fetchSessions()
      ]);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // [CC-005] Data Fetching Logic (View 1 - 8 + Sessions)
  // ---------------------------------------------------------

  const fetchCoverageBySector = async () => {
    const { data: sessions } = await supabase
      .from('diagnostic_sessions')
      .select(`
        id, sector_id,
        sectors ( name, slug ),
        match_results ( result_type, match_score )
      `)
      .eq('status', 'completed');

    if (!sessions) return;
    
    const bySector = {};
    for (const s of sessions) {
      const key = s.sector_id;
      if (!bySector[key]) {
        bySector[key] = { name: s.sectors?.name ?? 'Unknown', grants: [], providers: [], resources: [] };
      }
      for (const r of s.match_results ?? []) {
        if (r.result_type === 'grant')    bySector[key].grants.push(r.match_score);
        if (r.result_type === 'provider') bySector[key].providers.push(r.match_score);
        if (r.result_type === 'resource') bySector[key].resources.push(r.match_score);
      }
    }

    const coverage = Object.values(bySector).map(sector => ({
      sector:             sector.name,
      grants_count:       sector.grants.length,
      grants_coverage:    avg(sector.grants),
      providers_count:    sector.providers.length,
      providers_coverage: avg(sector.providers),
      resources_count:    sector.resources.length,
      resources_coverage: avg(sector.resources)
    })).sort((a, b) => a.grants_coverage - b.grants_coverage);
    
    setCoverageBySector(coverage);
  };

  const fetchTopGrants = async () => {
    const { data } = await supabase
      .from('match_results')
      .select('result_id, result_name, match_score, created_at')
      .eq('result_type', 'grant');

    if (!data) return;
    const grouped = groupBy(data, 'result_id');
    const top = Object.entries(grouped)
      .map(([grantId, results]) => ({
        grant_id:         grantId,
        grant_name:       results[0].result_name,
        activation_count: results.length,
        avg_match_score:  avg(results.map(r => r.match_score)),
        trend_week:       weeklyTrend(results, 'created_at')
      }))
      .sort((a, b) => b.activation_count - a.activation_count)
      .slice(0, 10);
      
    setTopGrants(top);
  };

  const fetchTopResources = async () => {
    const { data } = await supabase
      .from('match_results')
      .select('result_id, result_name, match_score, created_at')
      .eq('result_type', 'resource');

    if (!data) return;
    const grouped = groupBy(data, 'result_id');
    const top = Object.entries(grouped)
      .map(([id, results]) => ({
        resource_id:      id,
        resource_name:    results[0].result_name,
        match_count:      results.length,
        avg_match_score:  avg(results.map(r => r.match_score)),
        trend_week:       weeklyTrend(results, 'created_at')
      }))
      .sort((a, b) => b.match_count - a.match_count)
      .slice(0, 10);
      
    setTopResources(top);
  };

  const fetchUnmetNeeds = async () => {
    const { data: sessions } = await supabase
      .from('diagnostic_sessions')
      .select(`id, match_results ( result_type, match_score )`)
      .eq('status', 'completed');

    if (!sessions) return;
    const THRESHOLD = 0.4;

    const getBest = (session, type) => {
      const results = (session.match_results ?? []).filter(r => r.result_type === type);
      if (!results.length) return null;
      return results.reduce((best, r) => r.match_score > best.match_score ? r : best);
    };

    const unmet = sessions.filter(s =>
      (!getBest(s, 'grant')    || getBest(s, 'grant').match_score    < THRESHOLD) ||
      (!getBest(s, 'provider') || getBest(s, 'provider').match_score < THRESHOLD) ||
      (!getBest(s, 'resource') || getBest(s, 'resource').match_score < THRESHOLD)
    );

    setUnmetNeeds({
      total_unmet:        unmet.length,
      without_grant:      unmet.filter(s => !getBest(s, 'grant')).length,
      without_provider:   unmet.filter(s => !getBest(s, 'provider')).length,
      without_resource:   unmet.filter(s => !getBest(s, 'resource')).length,
    });
  };

  const fetchUndercoveredTagsAndPotential = async () => {
    const { data: responses } = await supabase.from('user_responses').select('tags_activated');
    if (!responses) return;
    
    const allTags = responses.flatMap(r => r.tags_activated ?? []);
    const tagFreq = countFrequency(allTags);

    const { data: grants } = await supabase.from('grants').select('trigger_tags').eq('status', 'open');
    const { data: matchResults } = await supabase.from('match_results').select('matched_tags, match_score').eq('result_type', 'grant');

    const undercovered = Object.entries(tagFreq)
      .filter(([, freq]) => freq >= 3)
      .map(([tag, freq]) => {
        const grantsCovering = (grants ?? []).filter(g => (g.trigger_tags ?? []).includes(tag)).length;
        const relevantMatches = (matchResults ?? []).filter(r => (r.matched_tags ?? []).includes(tag));
        const avgScore = relevantMatches.length ? avg(relevantMatches.map(r => r.match_score)) : 0;

        return {
          tag,
          frequency:         freq,
          grants_covering:   grantsCovering,
          avg_match_score:   avgScore,
          opportunity_score: freq * (1 - avgScore)
        };
      })
      .sort((a, b) => b.opportunity_score - a.opportunity_score);
      
    setUndercoveredTags(undercovered);

    // View 6: Potential New Grants (impact of top 3 undercovered tags)
    if (undercovered.length > 0) {
      const topTags = undercovered.slice(0, 3).map(t => t.tag);
      const { data: sessions } = await supabase.from('diagnostic_sessions').select('id, activated_tags').eq('status', 'completed');
      
      const impacted = (sessions ?? []).filter(s => topTags.some(tag => (s.activated_tags ?? []).includes(tag)));
      
      setPotentialGrants({
        impacted_sessions:     impacted.length,
        coverage_percentage:   sessions?.length ? ((impacted.length / sessions.length) * 100).toFixed(1) : 0,
        tags_covered:          topTags,
        recommended_amount_min: 5000,
        recommended_amount_max: 50000,
        roi_indicator: impacted.length > 10 ? 'High' : impacted.length > 5 ? 'Medium' : 'Low'
      });
    }
  };

  const fetchTemporalTrends = async () => {
    const weeksBack = 8;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (weeksBack * 7));

    const { data: responses } = await supabase
      .from('user_responses')
      .select('tags_activated, created_at')
      .gte('created_at', startDate.toISOString());

    if (!responses) return;
    
    const byWeek = {};
    for (const r of responses) {
      const week = getISOWeekLabel(r.created_at);
      if (!byWeek[week]) byWeek[week] = [];
      byWeek[week].push(...(r.tags_activated ?? []));
    }

    const trends = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, tags]) => {
        const counts = countFrequency(tags);
        return {
          week,
          total_activations: tags.length,
          ...counts // Spread tag counts for recharts lines
        };
      });
      
    setTemporalTrends(trends);
  };

  const fetchDimensionCoverage = async () => {
    const dimensions = ['operations', 'digital', 'market'];

    const { data: questionTagsData } = await supabase
      .from('question_tags')
      .select(`tag_id, questions!inner ( dimension ), tags ( name )`)
      .in('questions.dimension', dimensions);

    const { data: grants } = await supabase
      .from('grants')
      .select('trigger_tags')
      .in('status', ['open', 'ongoing']);

    if (!questionTagsData || !grants) return;

    const allGrantTags = new Set(grants.flatMap(g => g.trigger_tags ?? []));

    const coverage = dimensions.map(dim => {
      const dimTags = [...new Set(
        questionTagsData
          .filter(qt => qt.questions.dimension === dim)
          .map(qt => qt.tags?.name)
          .filter(Boolean)
      )];

      const covered = dimTags.filter(tag => allGrantTags.has(tag));

      return {
        dimension:           dim,
        total_tags:          dimTags.length,
        covered_tags:        covered.length,
        coverage_percentage: dimTags.length ? Math.round((covered.length / dimTags.length) * 100) : 0,
        uncovered_tags:      dimTags.filter(tag => !allGrantTags.has(tag))
      };
    });
    
    setDimensionCoverage(coverage);
  };

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('diagnostic_sessions')
      .select(`id, business_name, contact_name, created_at, completed_at, dml_level, total_score, sectors ( name )`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50);
      
    if (data) setRecentSessions(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setConsultantMode(false);
    setCurrentConsultant(null);
    navigate('/');
  };

  // ---------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------
  
  const renderScoreColor = (score) => {
    if (score < 0.5) return 'text-error';
    if (score < 0.7) return 'text-amber-500';
    return 'text-green-600';
  };
  
  const getTrendIcon = (trend) => {
    if (trend === 'up') return <span className="material-symbols-outlined text-green-600 text-[18px]">trending_up</span>;
    if (trend === 'down') return <span className="material-symbols-outlined text-error text-[18px]">trending_down</span>;
    return <span className="material-symbols-outlined text-on-surface-variant text-[18px]">trending_flat</span>;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-surface-container border-b border-outline-variant px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Consultant Dashboard</h1>
          <p className="text-on-surface-variant mt-1">
            Welcome, {currentConsultant?.name} · {currentConsultant?.region} ({currentConsultant?.role})
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-error-container text-on-error-container rounded-full text-sm font-medium hover:bg-error hover:text-on-error transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-8">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h3 className="text-sm font-medium text-on-surface-variant">Total Sessions</h3>
            <p className="text-3xl font-bold text-on-surface mt-2">{recentSessions.length}</p>
          </div>
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
            <h3 className="text-sm font-medium text-on-surface-variant">Sessions with Unmet Needs</h3>
            <p className="text-3xl font-bold text-error mt-2">{unmetNeeds.total_unmet}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-outline-variant flex gap-8">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 font-medium text-sm transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('opportunities')}
            className={`pb-4 font-medium text-sm transition-colors relative ${activeTab === 'opportunities' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Opportunities
            {activeTab === 'opportunities' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-fade-in">
            {/* View 1: Coverage by Sector */}
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-4">View 1: Coverage by Sector</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-outline-variant text-on-surface-variant">
                    <tr>
                      <th className="p-3 font-medium">Sector</th>
                      <th className="p-3 font-medium">Grants (Avg Score)</th>
                      <th className="p-3 font-medium">Providers (Avg Score)</th>
                      <th className="p-3 font-medium">Resources (Avg Score)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageBySector.map((row, i) => (
                      <tr key={i} className="border-b border-outline-variant/50">
                        <td className="p-3 font-medium text-on-surface">{row.sector}</td>
                        <td className={`p-3 font-bold ${renderScoreColor(row.grants_coverage)}`}>
                          {(row.grants_coverage * 100).toFixed(1)}%
                        </td>
                        <td className={`p-3 font-bold ${renderScoreColor(row.providers_coverage)}`}>
                          {(row.providers_coverage * 100).toFixed(1)}%
                        </td>
                        <td className={`p-3 font-bold ${renderScoreColor(row.resources_coverage)}`}>
                          {(row.resources_coverage * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* View 2: Top Grants */}
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
                <h2 className="text-lg font-bold text-on-surface mb-4">View 2: Top Grants</h2>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topGrants} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="grant_name" type="category" width={150} tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="activation_count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3">
                  {topGrants.slice(0,5).map(g => (
                    <li key={g.grant_id} className="flex justify-between items-center text-sm">
                      <span className="truncate pr-4 text-on-surface">{g.grant_name}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold">{(g.avg_match_score * 100).toFixed(0)}% Avg</span>
                        {getTrendIcon(g.trend_week)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* View 3: Top Resources */}
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
                <h2 className="text-lg font-bold text-on-surface mb-4">View 3: Resources Relevance</h2>
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topResources} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="resource_name" type="category" width={150} tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="match_count" fill="var(--tertiary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-3">
                  {topResources.slice(0,5).map(r => (
                    <li key={r.resource_id} className="flex justify-between items-center text-sm">
                      <span className="truncate pr-4 text-on-surface">{r.resource_name}</span>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold">{(r.avg_match_score * 100).toFixed(0)}% Avg</span>
                        {getTrendIcon(r.trend_week)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* View 4: Unmet Needs */}
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-4">View 4: Unmet Needs (No matches &gt; 40%)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-error-container text-on-error-container rounded-xl">
                  <div className="text-sm font-medium opacity-80">Without Grants</div>
                  <div className="text-3xl font-bold mt-1">{unmetNeeds.without_grant}</div>
                </div>
                <div className="p-4 bg-error-container text-on-error-container rounded-xl">
                  <div className="text-sm font-medium opacity-80">Without Providers</div>
                  <div className="text-3xl font-bold mt-1">{unmetNeeds.without_provider}</div>
                </div>
                <div className="p-4 bg-error-container text-on-error-container rounded-xl">
                  <div className="text-sm font-medium opacity-80">Without Resources</div>
                  <div className="text-3xl font-bold mt-1">{unmetNeeds.without_resource}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* View 5: Tags Without Sufficient Coverage */}
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
              <h2 className="text-lg font-bold text-on-surface mb-4">View 5: Tags Without Sufficient Coverage</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface border-b border-outline-variant text-on-surface-variant">
                    <tr>
                      <th className="p-3 font-medium">Tag</th>
                      <th className="p-3 font-medium">Activation Freq</th>
                      <th className="p-3 font-medium">Grants Covering</th>
                      <th className="p-3 font-medium">Avg Match Score</th>
                      <th className="p-3 font-medium">Opp Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {undercoveredTags.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-outline-variant/50">
                        <td className="p-3 font-medium text-on-surface">{row.tag}</td>
                        <td className="p-3 text-on-surface-variant">{row.frequency}</td>
                        <td className="p-3 text-on-surface-variant">{row.grants_covering}</td>
                        <td className="p-3 text-on-surface-variant">{(row.avg_match_score * 100).toFixed(1)}%</td>
                        <td className={`p-3 font-bold ${row.opportunity_score > 5 ? 'text-error' : 'text-on-surface'}`}>
                          {row.opportunity_score.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* View 6: Potential New Grants */}
            {potentialGrants && (
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
                <h2 className="text-lg font-bold text-on-surface mb-4">View 6: Potential New Grant Impact</h2>
                <p className="text-sm text-on-surface-variant mb-4">
                  Based on the top 3 undercovered tags: <span className="font-mono text-xs bg-surface px-2 py-1 rounded">{potentialGrants.tags_covered.join(', ')}</span>
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border border-outline-variant rounded-xl">
                    <div className="text-sm text-on-surface-variant">Impacted Sessions</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{potentialGrants.impacted_sessions}</div>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-xl">
                    <div className="text-sm text-on-surface-variant">Coverage</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{potentialGrants.coverage_percentage}%</div>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-xl">
                    <div className="text-sm text-on-surface-variant">Recommended Amt</div>
                    <div className="text-2xl font-bold mt-1 text-primary">${potentialGrants.recommended_amount_min/1000}k - ${potentialGrants.recommended_amount_max/1000}k</div>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-xl">
                    <div className="text-sm text-on-surface-variant">ROI Indicator</div>
                    <div className={`text-2xl font-bold mt-1 ${potentialGrants.roi_indicator === 'High' ? 'text-green-600' : 'text-amber-500'}`}>
                      {potentialGrants.roi_indicator}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* View 7: Temporal Trends */}
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
                <h2 className="text-lg font-bold text-on-surface mb-4">View 7: Temporal Trends (Activations)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={temporalTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="total_activations" stroke="var(--primary)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* View 8: Dimension Coverage */}
              <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant">
                <h2 className="text-lg font-bold text-on-surface mb-4">View 8: Dimension Coverage (Tags)</h2>
                <div className="space-y-6 mt-6">
                  {dimensionCoverage.map(dim => (
                    <div key={dim.dimension}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold capitalize text-on-surface">{dim.dimension}</span>
                        <span className="text-on-surface-variant">{dim.covered_tags} / {dim.total_tags} tags ({dim.coverage_percentage}%)</span>
                      </div>
                      <div className="w-full h-3 bg-surface rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${dim.coverage_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant mt-12">
          <h2 className="text-xl font-bold text-on-surface mb-4">Recent Completed Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface border-b border-outline-variant text-on-surface-variant">
                <tr>
                  <th className="p-4 font-medium">Business Name</th>
                  <th className="p-4 font-medium">Sector</th>
                  <th className="p-4 font-medium">DML Level</th>
                  <th className="p-4 font-medium">Score</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map(session => (
                  <tr key={session.id} className="border-b border-outline-variant/50 hover:bg-surface transition-colors">
                    <td className="p-4 font-bold text-on-surface">{session.business_name || 'Anonymous Business'}</td>
                    <td className="p-4 text-on-surface-variant">{session.sectors?.name || 'Unknown'}</td>
                    <td className="p-4 capitalize">
                      <span className="px-2 py-1 bg-surface rounded-md text-xs font-medium border border-outline-variant">
                        {session.dml_level || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{session.total_score}%</td>
                    <td className="p-4 text-on-surface-variant">
                      {new Date(session.completed_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/consultant/sessions/${session.id}`)}
                        className="text-primary hover:text-primary-hover font-medium flex items-center justify-end gap-1"
                      >
                        Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {recentSessions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-on-surface-variant">
                      No completed sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
