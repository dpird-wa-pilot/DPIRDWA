import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { runBFSMatching } from '../lib/matchingEngine';

const STEPS = [
  { id: 1, label: 'Profile', icon: 'business' },
  { id: 2, label: 'Operations', icon: 'manufacturing' },
  { id: 3, label: 'Digital', icon: 'devices' },
  { id: 4, label: 'Market', icon: 'storefront' },
  { id: 5, label: 'Results', icon: 'task_alt' }
];

export default function Advisor() {
  const [wizardState, setWizardState] = useState({
    currentStep: 1,
    sessionId: null,
    consultantMode: false,
    currentConsultant: null,
    profile: {
      sectorId: null, subSectorId: null, employeeCount: '',
      turnoverRange: '', location: '', businessStructure: '',
      businessAgeYears: '', hasAbn: true
    },
    answers: [],
    activatedTags: [],
    scores: { operations: 0, digital: 0, market: 0, total: 0 },
    dml: null,
    matchResults: { grants: [], providers: [], resources: [] },
    loading: false,
    error: null
  });

  const [sectors, setSectors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showErrors, setShowErrors] = useState(false);

  const locationMapping = {
    'Perth Metro (within 50km of CBD)': 'metro_wa',
    'Regional WA': 'regional_wa',
    'Remote WA': 'remote_wa'
  };

  // [CC-004] Detect consultant mode from Supabase auth session
  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: consultant } = await supabase
          .from('consultants')
          .select('id, name, role, region')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (consultant) {
          setWizardState(prev => ({
            ...prev,
            consultantMode: true,
            currentConsultant: consultant
          }));
        }
      }
    };
    initAuth();
  }, []);

  // [CC-004] Load sectors for profile step
  useEffect(() => {
    const loadSectors = async () => {
      const { data } = await supabase
        .from('sectors')
        .select('id, name, slug, parent_id, icon')
        .eq('is_active', true)
        .order('sort_order');
      setSectors(data || []);
    };
    loadSectors();
  }, []);

  const macroSectors = sectors.filter(s => s.parent_id === null);
  const subSectors = sectors.filter(s => s.parent_id === wizardState.profile.sectorId);

  const handleProfileChange = (field, value) => {
    setWizardState(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  };

  const getStepDimension = (step) => {
    if (step === 2) return 'operations';
    if (step === 3) return 'digital';
    if (step === 4) return 'market';
    return null;
  };

  // [CC-004] Load questions for a given dimension from Supabase
  const loadQuestions = async (dimension, sectorId) => {
    setWizardState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id, text, helper_text, dimension, answer_type, options,
          sector_filter, is_required, sort_order,
          question_tags ( tag_id, tags (name) )
        `)
        .eq('dimension', dimension)
        .eq('is_active', true)
        .or(`sector_filter.is.null,sector_filter.cs.{${sectorId}}`)
        .order('sort_order');
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (e) {
      console.error(e);
      setWizardState(prev => ({ ...prev, error: e.message }));
    } finally {
      setWizardState(prev => ({ ...prev, loading: false }));
    }
  };

  // [CC-004] Parse options from seed data format (options.summary)
  const parseOptions = (options) => {
    if (Array.isArray(options)) return options;
    if (options && typeof options.summary === 'string') {
      return options.summary.split('|').map(s => {
        const text = s.trim();
        const scoreMatch = text.match(/\(score:\s*(\d+)\)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        const label = text.replace(/\(score:\s*\d+\)/i, '').trim();
        return { label, value: label, score };
      });
    }
    return [];
  };

  const calculateQuestionScoreAndTags = (q, answerValue) => {
    let scoreContribution = 0;
    let tags = [];
    
    // Always include question-level tags if any answer is provided
    const questionTags = (q.question_tags || []).map(qt => qt.tags?.name).filter(Boolean);

    const parsedOptions = parseOptions(q.options);

    if (q.answer_type === 'scale_1_5') {
      scoreContribution = parseInt(answerValue) || 0;
      if (scoreContribution >= 3) tags = [...questionTags];
    } else if (q.answer_type === 'boolean') {
      scoreContribution = answerValue === 'yes' ? 5 : 0;
      if (answerValue === 'yes') tags = [...questionTags];
    } else if (q.answer_type === 'single_choice' && parsedOptions.length > 0) {
      const selectedOption = parsedOptions.find(opt => opt.value === answerValue || opt.label === answerValue);
      if (selectedOption) {
        // If score is 0-100 scale in seed data, normalize to 1-5 scale for dimension calculation
        scoreContribution = selectedOption.score > 5 ? selectedOption.score / 20 : selectedOption.score;
        tags = [...questionTags, ...(selectedOption.tags || [])];
      }
    } else if (q.answer_type === 'multi_choice' && parsedOptions.length > 0 && Array.isArray(answerValue)) {
      answerValue.forEach(val => {
        const selectedOption = parsedOptions.find(opt => opt.value === val || opt.label === val);
        if (selectedOption) {
          scoreContribution += selectedOption.score > 5 ? selectedOption.score / 20 : selectedOption.score;
          tags = [...tags, ...(selectedOption.tags || [])];
        }
      });
      scoreContribution = Math.min(scoreContribution, 5);
      if (answerValue.length > 0) tags = [...tags, ...questionTags];
    } else if (q.answer_type === 'text_input' || q.answer_type === 'number_input') {
      if (answerValue) {
        scoreContribution = 5;
        tags = [...questionTags];
      }
    }

    return {
      scoreContribution,
      tags: [...new Set(tags)]
    };
  };

  const advanceStep = async () => {
    if (!isStepValid() && !showErrors) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);

    const { currentStep, profile, consultantMode, currentConsultant, sessionId, activatedTags, answers } = wizardState;

    if (currentStep === 1) {
      // [CC-004] Create diagnostic session on profile completion
      setWizardState(prev => ({ ...prev, loading: true }));
      try {
        const { data, error } = await supabase
          .from('diagnostic_sessions')
          .insert({
            session_mode: consultantMode ? 'consultant_guided' : 'self_service',
            consultant_id: consultantMode ? currentConsultant.id : null,
            sector_id: profile.sectorId,
            sub_sector_id: profile.subSectorId || null,
            business_structure: profile.businessStructure,
            employee_count: parseInt(profile.employeeCount) || 0,
            annual_turnover_range: profile.turnoverRange,
            business_age_years: parseInt(profile.businessAgeYears) || 0,
            location: locationMapping[profile.location] || profile.location,
            has_abn: profile.hasAbn,
            status: 'in_progress'
          })
          .select('id')
          .single();

        if (error) throw error;
        setWizardState(prev => ({ ...prev, sessionId: data.id, currentStep: 2 }));
        await loadQuestions('operations', profile.sectorId);
      } catch (e) {
        console.error(e);
        setWizardState(prev => ({ ...prev, error: e.message, loading: false }));
      }
      return;
    }

    if (currentStep >= 2 && currentStep <= 4) {
      const dimension = getStepDimension(currentStep);
      
      const dimensionAnswers = questions.map(q => {
        const ans = answers.find(a => a.questionId === q.id);
        const { scoreContribution, tags } = calculateQuestionScoreAndTags(q, ans?.value);
        return {
          questionId: q.id,
          dimension,
          value: ans?.value || '',
          tags,
          scoreContribution
        };
      });

      const dimScore = calculateDimensionScore(dimensionAnswers, dimension);
      const newTags = dimensionAnswers.flatMap(a => a.tags);
      
      setWizardState(prev => ({ ...prev, loading: true }));
      try {
        // [CC-004] Save responses for a dimension and accumulate activated tags
        const responsesToInsert = dimensionAnswers.filter(a => a.value !== '').map(answer => ({
          session_id: sessionId,
          question_id: answer.questionId,
          answer_value: Array.isArray(answer.value) ? answer.value.join(',') : answer.value?.toString(),
          answer_number: typeof answer.value === 'number' ? answer.value : null,
          tags_activated: answer.tags,
          score_contribution: answer.scoreContribution
        }));

        if (responsesToInsert.length > 0) {
          await supabase.from('user_responses').insert(responsesToInsert);
        }

        const allTags = [...new Set([...activatedTags, ...newTags])];
        
        setWizardState(prev => ({
          ...prev,
          activatedTags: allTags,
          scores: { ...prev.scores, [dimension]: dimScore }
        }));

        if (currentStep < 4) {
          const nextDim = getStepDimension(currentStep + 1);
          setWizardState(prev => ({ ...prev, currentStep: currentStep + 1 }));
          await loadQuestions(nextDim, profile.sectorId);
        } else {
          // Go to Results (Step 5)
          await finalizeResults(allTags, { ...wizardState.scores, [dimension]: dimScore });
        }
      } catch (e) {
        console.error(e);
        setWizardState(prev => ({ ...prev, error: e.message, loading: false }));
      }
    }
  };

  // [CC-004] Calculate DML scores from responses
  const calculateDimensionScore = (dimensionAnswers, dimension) => {
    const answered = dimensionAnswers.filter(a => 
      a.value !== '' && 
      a.value !== undefined && 
      (!Array.isArray(a.value) || a.value.length > 0)
    );
    if (answered.length === 0) return 0;
    const maxPossible = answered.length * 5; // Scale 1-5, max 5 per answered question
    const actual = answered.reduce((sum, a) => sum + (a.scoreContribution || 0), 0);
    return maxPossible > 0 ? (actual / maxPossible) * 100 : 0;
  };

  // [CC-004] Determine DML level from total score
  const getDMLLevel = (score) => {
    if (score < 25) return { level: 'foundational', label: 'Foundational', color: 'error' };
    if (score < 50) return { level: 'emerging',     label: 'Emerging',     color: 'warning' };
    if (score < 75) return { level: 'established',  label: 'Established',  color: 'primary' };
    return             { level: 'advanced',          label: 'Advanced',     color: 'success' };
  };

  const finalizeResults = async (finalTags, finalScores) => {
    const totalScore = (finalScores.operations * 0.35) + (finalScores.digital * 0.40) + (finalScores.market * 0.25);
    const dmlLevel = getDMLLevel(totalScore);

    try {
      // [CC-004] Load all matching data before running BFS engine
      const [grantsRes, providersRes, resourcesRes] = await Promise.all([
        supabase.from('grants').select('id, name, slug, url, summary, status, trigger_tags, sector_tags, geographic_scope, requires_abn, employee_max, business_age_min, dml_min, dml_max, program_type, amount_min, amount_max, is_featured').not('status', 'eq', 'archived'),
        supabase.from('providers').select('id, name, slug, summary, website, service_types, trigger_tags, sector_tags, location, operates_online, logo_url, is_featured'),
        supabase.from('resources').select('id, title, slug, summary, resource_type, library_url, trigger_tags, sector_tags, dml_levels, is_featured').eq('is_active', true)
      ]);

      // Log Supabase query errors so they surface instead of silently returning []
      if (grantsRes.error) console.error('[BFS] grants query failed:', grantsRes.error.message);
      if (providersRes.error) console.error('[BFS] providers query failed:', providersRes.error.message);
      if (resourcesRes.error) console.error('[BFS] resources query failed:', resourcesRes.error.message);

      const matchingData = {
        grants: grantsRes.data || [],
        providers: providersRes.data || [],
        resources: resourcesRes.data || []
      };

      const normalizedProfile = {
        ...wizardState.profile,
        location: locationMapping[wizardState.profile.location] || wizardState.profile.location,
        dmlScore: totalScore
      };

      const results = runBFSMatching(finalTags, matchingData, normalizedProfile);

      // [CC-004] Update session with final DML scores and activated tags
      await supabase
        .from('diagnostic_sessions')
        .update({
          operations_score: finalScores.operations,
          digital_score: finalScores.digital,
          market_score: finalScores.market,
          total_score: totalScore,
          dml_level: dmlLevel.level,
          activated_tags: finalTags,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', wizardState.sessionId);

      // [CC-004] Save match results to Supabase
      const insertResults = [
        ...results.grants.map((g, i) => ({
          session_id: wizardState.sessionId,
          result_type: 'grant', result_id: g.id, result_name: g.name,
          match_score: g.match_score, match_rank: i + 1, matched_tags: g.matched_tags,
          reasoning_path: g.reasoning_path, eligibility_met: g.match_score > 0.3
        })),
        ...results.providers.map((p, i) => ({
          session_id: wizardState.sessionId,
          result_type: 'provider', result_id: p.id, result_name: p.name,
          match_score: p.match_score, match_rank: i + 1, matched_tags: p.matched_tags,
          reasoning_path: p.reasoning_path, eligibility_met: true
        })),
        ...results.resources.map((r, i) => ({
          session_id: wizardState.sessionId,
          result_type: 'resource', result_id: r.id, result_name: r.title,
          match_score: r.match_score, match_rank: i + 1, matched_tags: r.matched_tags,
          reasoning_path: r.reasoning_path, eligibility_met: true
        }))
      ];

      if (insertResults.length > 0) {
        await supabase.from('match_results').insert(insertResults);
      }

      setWizardState(prev => ({
        ...prev,
        currentStep: 5,
        scores: { ...finalScores, total: totalScore },
        dml: dmlLevel,
        matchResults: results,
        loading: false
      }));

    } catch (e) {
      console.error(e);
      setWizardState(prev => ({ ...prev, error: e.message, loading: false }));
    }
  };

  const setAnswer = (questionId, value) => {
    setWizardState(prev => {
      const existing = prev.answers.filter(a => a.questionId !== questionId);
      return { ...prev, answers: [...existing, { questionId, value }] };
    });
  };

  const getAnswer = (questionId) => {
    const ans = wizardState.answers.find(a => a.questionId === questionId);
    return ans ? ans.value : '';
  };

  const isStepValid = () => {
    if (wizardState.currentStep === 1) {
      return !!wizardState.profile.sectorId && !!wizardState.profile.location;
    }
    if (wizardState.currentStep >= 2 && wizardState.currentStep <= 4) {
      return questions.every(q => {
        if (!q.is_required) return true;
        const val = getAnswer(q.id);
        if (q.answer_type === 'multi_choice') {
          return Array.isArray(val) && val.length > 0;
        }
        return val !== '' && val !== null && val !== undefined;
      });
    }
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* [CC-004] Consultant mode banner */}
      {wizardState.consultantMode && (
        <div className="w-full bg-secondary-container text-on-secondary-container px-lg py-sm flex items-center gap-sm rounded-t-xl mb-4">
          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
          <span className="font-label-md text-label-md font-bold">
            Consultant Mode — {wizardState.currentConsultant?.name}
          </span>
          <span className="text-on-secondary-container/60 font-label-sm text-label-sm ml-auto">
            Session will be saved to your dashboard
          </span>
        </div>
      )}

      {/* [CC-004] 5-step progress stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
              wizardState.currentStep >= step.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'
            }`}>
              {wizardState.currentStep > step.id ? (
                <span className="material-symbols-outlined">check</span>
              ) : (
                <span className="material-symbols-outlined">{step.icon}</span>
              )}
            </div>
            <span className={`font-label-sm mt-2 text-center ${wizardState.currentStep >= step.id ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
              {step.label} {step.weight && <span className="hidden sm:inline">({step.weight})</span>}
            </span>
            {idx < STEPS.length - 1 && (
              <div className={`absolute top-5 left-[50%] right-[-50%] h-1 -z-0 ${
                wizardState.currentStep > step.id ? 'bg-primary' : 'bg-surface-variant'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* [CC-004] Error state */}
      {wizardState.error && (
        <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center mb-6">
          <p className="font-body-md">{wizardState.error}</p>
          <button onClick={() => setWizardState(prev => ({...prev, error: null}))} className="mt-md font-label-md text-label-md underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 relative min-h-[400px]">
        {/* [CC-004] Loading overlay during BFS calculation */}
        {wizardState.loading && (
          <div className="absolute inset-0 bg-surface/80 flex flex-col items-center justify-center gap-4 rounded-2xl z-20">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Analysing your profile and finding matches…
            </p>
          </div>
        )}

        {/* STEP 1: PROFILE */}
        {wizardState.currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-on-surface mb-6">Business Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Main Sector <span className="text-error">*</span></label>
                <select 
                  className="w-full p-3 border border-outline rounded-lg bg-surface"
                  value={wizardState.profile.sectorId || ''}
                  onChange={(e) => handleProfileChange('sectorId', e.target.value)}
                >
                  <option value="">Select a sector...</option>
                  {macroSectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {subSectors.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Sub-Sector</label>
                  <select 
                    className="w-full p-3 border border-outline rounded-lg bg-surface"
                    value={wizardState.profile.subSectorId || ''}
                    onChange={(e) => handleProfileChange('subSectorId', e.target.value)}
                  >
                    <option value="">Select a sub-sector...</option>
                    {subSectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Number of Employees</label>
                <select 
                  className="w-full p-3 border border-outline rounded-lg bg-surface"
                  value={wizardState.profile.employeeCount}
                  onChange={(e) => handleProfileChange('employeeCount', e.target.value)}
                >
                  <option value="">Select size...</option>
                  <option value="4">1-4</option>
                  <option value="19">5-19</option>
                  <option value="49">20-49</option>
                  <option value="50">50+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Business Age (Years)</label>
                <select
                  className="w-full p-3 border border-outline rounded-lg bg-surface"
                  value={wizardState.profile.businessAgeYears}
                  onChange={(e) => handleProfileChange('businessAgeYears', e.target.value)}
                >
                  <option value="">Select age...</option>
                  <option value="0">Less than 1 year</option>
                  <option value="2">1-3 years</option>
                  <option value="5">3-7 years</option>
                  <option value="8">7+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Business Location <span className="text-error">*</span></label>
                <select
                  className="w-full p-3 border border-outline rounded-lg bg-surface"
                  value={wizardState.profile.location}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                >
                  <option value="">Select location...</option>
                  <option value="metro_wa">Perth Metro (within 50km of CBD)</option>
                  <option value="regional_wa">Regional WA</option>
                  <option value="remote_wa">Remote WA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Has ABN?</label>
                <div className="flex gap-4 p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hasAbn" value="yes" checked={wizardState.profile.hasAbn === true} onChange={() => handleProfileChange('hasAbn', true)} className="w-4 h-4 text-primary" />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hasAbn" value="no" checked={wizardState.profile.hasAbn === false} onChange={() => handleProfileChange('hasAbn', false)} className="w-4 h-4 text-primary" />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button 
                onClick={advanceStep} 
                disabled={!isStepValid()}
                className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                Continue <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEPS 2, 3, 4: DIAGNOSTIC DIMENSIONS */}
        {wizardState.currentStep >= 2 && wizardState.currentStep <= 4 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-on-surface capitalize">
                {getStepDimension(wizardState.currentStep)} Readiness
              </h2>
              <span className="text-on-surface-variant font-label-md">
                Dimension {wizardState.currentStep - 1} of 3
              </span>
            </div>

            {questions.map((q, idx) => {
              const currentAnswer = getAnswer(q.id);
              return (
                <div key={q.id} className="p-4 border border-outline-variant rounded-lg bg-surface-container-lowest">
                  <p className="font-bold text-on-surface mb-2">
                    {idx + 1}. {q.text} {q.is_required && <span className="text-error">*</span>}
                  </p>
                  {q.helper_text && <p className="text-sm text-on-surface-variant mb-4">{q.helper_text}</p>}
                  
                  {q.answer_type === 'scale_1_5' && (
                    <div className="flex justify-between items-center bg-surface-container-low rounded-lg p-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <label key={num} className="flex flex-col items-center cursor-pointer">
                          <input 
                            type="radio" 
                            name={`q_${q.id}`} 
                            value={num} 
                            checked={currentAnswer === num.toString()} 
                            onChange={(e) => setAnswer(q.id, e.target.value)} 
                            className="w-5 h-5 mb-1 text-primary" 
                          />
                          <span className="text-xs">{num}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {q.answer_type === 'boolean' && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value="yes" checked={currentAnswer === 'yes'} onChange={(e) => setAnswer(q.id, e.target.value)} className="w-4 h-4 text-primary" />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`q_${q.id}`} value="no" checked={currentAnswer === 'no'} onChange={(e) => setAnswer(q.id, e.target.value)} className="w-4 h-4 text-primary" />
                        <span>No</span>
                      </label>
                    </div>
                  )}

                  {q.answer_type === 'single_choice' && parseOptions(q.options).length > 0 && (
                    <div className="flex flex-col gap-2">
                      {parseOptions(q.options).map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name={`q_${q.id}`} 
                            value={opt.value || opt.label} 
                            checked={currentAnswer === (opt.value || opt.label)} 
                            onChange={() => setAnswer(q.id, opt.value || opt.label)} 
                            className="w-4 h-4 text-primary" 
                          />
                          <span>{opt.label || opt.value}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.answer_type === 'multi_choice' && parseOptions(q.options).length > 0 && (
                    <div className="flex flex-col gap-2">
                      {parseOptions(q.options).map((opt, i) => {
                        const optVal = opt.value || opt.label;
                        const isChecked = Array.isArray(currentAnswer) && currentAnswer.includes(optVal);
                        return (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={(e) => {
                                let newAns = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                                if (e.target.checked) newAns.push(optVal);
                                else newAns = newAns.filter(v => v !== optVal);
                                setAnswer(q.id, newAns);
                              }} 
                              className="w-4 h-4 text-primary rounded" 
                            />
                            <span>{opt.label || opt.value}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {q.answer_type === 'text_input' && (
                    <textarea 
                      className="w-full p-3 border border-outline rounded-lg bg-surface"
                      rows={3}
                      value={currentAnswer}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                    />
                  )}

                  {q.answer_type === 'number_input' && (
                    <input 
                      type="number"
                      className="w-full md:w-1/3 p-3 border border-outline rounded-lg bg-surface"
                      value={currentAnswer}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder="Enter a number"
                    />
                  )}

                  {showErrors && q.is_required && (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) && (
                    <p className="text-error text-sm mt-2 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      This field is required
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex flex-col items-end gap-2 mt-8">
              {showErrors && (
                <div className="text-warning text-sm font-bold flex items-center gap-2 mb-2 bg-warning-container text-on-warning-container px-3 py-2 rounded-lg">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Some required fields are missing. This may affect the accuracy of your results.
                </div>
              )}
              <div className="flex justify-between w-full">
                <button
                  onClick={async () => {
                    const prevStep = wizardState.currentStep - 1;
                    setWizardState(prev => ({ ...prev, currentStep: prevStep, error: null }));
                    const prevDimension = getStepDimension(prevStep);
                    if (prevDimension) {
                      await loadQuestions(prevDimension, wizardState.profile.sectorId);
                    }
                  }}
                  className="text-primary px-6 py-2 rounded-full font-bold border border-primary hover:bg-primary-container"
                >
                  Back
                </button>
                <button 
                  onClick={advanceStep}
                  className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                >
                  {wizardState.currentStep === 4 ? (showErrors ? 'See Results Anyway' : 'See Results') : (showErrors ? 'Proceed Anyway' : 'Next')} <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: RESULTS */}
        {wizardState.currentStep === 5 && wizardState.dml && (
          <div className="space-y-8">
            {/* [CC-004] DML Summary block */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface">Your Digital Maturity Level</h2>
                  <p className="text-on-surface-variant mt-1">Based on your responses across three dimensions</p>
                </div>
                <div className={`px-4 py-2 rounded-full bg-${wizardState.dml.color}-container text-on-${wizardState.dml.color}-container font-bold text-lg`}>
                  {wizardState.dml.label}
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                {[
                  { label: 'Operations Readiness', score: wizardState.scores.operations, weight: '35%' },
                  { label: 'Digital Readiness',    score: wizardState.scores.digital,    weight: '40%' },
                  { label: 'Market Readiness',     score: wizardState.scores.market,     weight: '25%' }
                ].map(dim => (
                  <div key={dim.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-on-surface-variant">{dim.label}</span>
                      <span className="text-sm font-bold text-on-surface">{Math.round(dim.score)}%</span>
                    </div>
                    <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Helper renderer for results */}
            {['grants', 'providers', 'resources'].map(type => (
              <div key={type}>
                <h3 className="text-xl font-bold text-on-surface capitalize mb-4">Recommended {type}</h3>
                {wizardState.matchResults[type].length === 0 ? (
                  <p className="text-on-surface-variant italic">No {type} matched your profile.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wizardState.matchResults[type].map(result => (
                      <div key={result.id} className="border border-outline-variant rounded-xl p-4 bg-surface flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-on-surface mb-2">{result.name || result.title}</h4>
                          <p className="text-sm text-on-surface-variant mb-4 line-clamp-3">{result.summary}</p>
                          
                          {/* [CC-004] Match score visual indicator on result cards */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-1.5 flex-1 bg-surface-variant rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `${Math.round(result.match_score * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-on-surface-variant whitespace-nowrap font-bold">
                              {Math.round(result.match_score * 100)}% match
                            </span>
                          </div>
                        </div>

                        {/* [CC-004] Reasoning panel — consultant mode only */}
                        {wizardState.consultantMode && result.reasoning_path && (
                          <div className="mt-2 mb-4 p-3 bg-surface-container rounded-lg border border-outline-variant">
                            <p className="text-xs font-bold text-on-surface-variant mb-2">Why this match:</p>
                            <ul className="flex flex-col gap-1">
                              {result.reasoning_path.explanation.map((reason, i) => (
                                <li key={i} className="flex items-start gap-1 text-xs text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[14px] text-primary">arrow_right</span>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-on-surface-variant/60 mt-2">
                              {result.reasoning_path.match_count} of {result.reasoning_path.total_trigger_tags} tags matched
                            </p>
                          </div>
                        )}

                        <a 
                          href={result.url || result.website || result.library_url || '#'} 
                          target="_blank" rel="noopener noreferrer"
                          className="w-full py-2 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-sm text-center hover:bg-secondary hover:text-on-secondary transition-colors"
                        >
                          View Details
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
