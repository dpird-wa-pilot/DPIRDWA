import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format ISO date string (YYYY-MM-DD) → "7 March 2026" */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Map DB status value → UI label */
const statusLabel = {
  open: 'Open',
  coming_soon: 'Coming Soon',
  closed: 'Closed',
  ongoing: 'Ongoing',
};

/** Map DB status value → Tailwind color classes */
const statusColor = {
  open: 'text-[#1b5e20]',
  coming_soon: 'text-blue-700',
  closed: 'text-error',
  ongoing: 'text-teal-700',
};

/** Return human-readable category label from sector_tags using the sectors map */
const getCategoryLabel = (sectorTags, sectorsMap) => {
  if (!sectorTags || sectorTags.length === 0) return 'General';
  const slug = sectorTags[0];
  return sectorsMap[slug] || slug;
};

// Unsplash image pool for grant cards (indexed by grant.id % pool.length)
const agricultureImages = [
  "https://plus.unsplash.com/premium_photo-1661962692059-55d5a4319814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1710563159928-83611beece71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1674624682288-085eff4f98da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1620200423727-8127f75d7f53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1594771804886-a933bb2d609b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1661907005604-cec7ffb6a042?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1492496913980-501348b61469?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1627920769541-daa658ed6b59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1678344170545-c3edef92a16e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1656407410275-e63e689bcd90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1674019234994-eceabbdd091d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1508175688576-0c076b47b5b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1663945779302-b46b12b6d811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1524486361537-8ad15938e1a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1483871788521-4f224a86e166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1661902195336-996462e0d1d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1564417947365-8dbc9d0e718e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1627920768905-575535d6dd2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1661963506575-cadb507b2aaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1527847263472-aa5338d178b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1518994603110-1912b3272afd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1663945778994-11b3201882a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1591647620471-cffbb4ec2242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1500595046743-cd271d694d30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1529313780224-1a12b68bed16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://plus.unsplash.com/premium_photo-1661904674420-d01a68b8965b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1557234195-bd9f290f0e4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1684154739620-ef7b1e078d4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

// Default initial status filter state
const defaultStatusFilter = {
  open: true,
  coming_soon: true,
  closed: false,
  ongoing: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FilterGroup = ({ label, sectionKey, activeCount, openSections, toggleSection, children }) => {
  const isOpen = openSections[sectionKey];
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
  );
};

export default function Grants() {
  // --- Data state ---
  const [grants, setGrants] = useState([]);
  const [sectorsMap, setSectorsMap] = useState({}); // { slug: name }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter state ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [sectorFilter, setSectorFilter] = useState({}); // { slug: boolean }
  const [selectedStructures, setSelectedStructures] = useState({});
  const [selectedSupportTypes, setSelectedSupportTypes] = useState({});
  const [selectedObjectives, setSelectedObjectives] = useState({});
  const [stageFilters, setStageFilters] = useState({
    starting: false,
    growing: false,
    established: false,
  });
  const [indigenousOnly, setIndigenousOnly] = useState(false);

  const [openSections, setOpenSections] = useState({
    industry: true,
    business_structure: false,
    support_type: false,
    objectives: false,
    business_stage: false,
    grant_status: true,
    indigenous: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Run both queries in parallel
      const [grantsResult, sectorsResult] = await Promise.all([
        supabase
          .from('grants')
          .select('id, name, slug, url, summary, description, status, open_date, close_date, sector_tags, program_type, administering_body, amount_min, amount_max, is_featured, eligible_structures, support_type, objective_tags, business_age_min, indigenous_focus')
          .not('status', 'eq', 'archived')
          .order('status', { ascending: true })
          .order('close_date', { ascending: true }),
        supabase
          .from('sectors')
          .select('slug, name')
          .eq('is_active', true),
      ]);

      if (grantsResult.error) {
        setError(grantsResult.error.message);
        setLoading(false);
        return;
      }

      // Build slug → name map from sectors table
      const map = {};
      if (!sectorsResult.error && sectorsResult.data) {
        sectorsResult.data.forEach(s => { map[s.slug] = s.name; });
      }

      setGrants(grantsResult.data || []);
      setSectorsMap(map);
      setLoading(false);
    };

    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // Derived: available sectors and objectives (only those present in loaded grants)
  // ---------------------------------------------------------------------------
  const availableSectors = useMemo(() => {
    const slugs = new Set();
    grants.forEach(g => (g.sector_tags || []).forEach(s => slugs.add(s)));
    return Array.from(slugs).sort();
  }, [grants]);

  const availableObjectives = useMemo(() => {
    const tags = new Set();
    grants.forEach(g => (g.objective_tags || []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [grants]);

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleStatusChange = (status) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleSectorChange = (slug) => {
    setSectorFilter(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const handleStructureChange = (val) => setSelectedStructures(prev => ({ ...prev, [val]: !prev[val] }));
  const handleSupportTypeChange = (val) => setSelectedSupportTypes(prev => ({ ...prev, [val]: !prev[val] }));
  const handleObjectiveChange = (val) => setSelectedObjectives(prev => ({ ...prev, [val]: !prev[val] }));
  const handleStageChange = (val) => setStageFilters(prev => ({ ...prev, [val]: !prev[val] }));

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter(defaultStatusFilter);
    setSectorFilter({});
    setSelectedStructures({});
    setSelectedSupportTypes({});
    setSelectedObjectives({});
    setStageFilters({ starting: false, growing: false, established: false });
    setIndigenousOnly(false);
    setOpenSections({
      industry: true,
      business_structure: false,
      support_type: false,
      objectives: false,
      business_stage: false,
      grant_status: true,
      indigenous: false,
    });
  };

  // ---------------------------------------------------------------------------
  // Filter logic helpers
  // ---------------------------------------------------------------------------
  const matchesStage = (grant, selectedStages) => {
    if (Object.values(selectedStages).every(v => !v)) return true; // none selected
    const age = grant.business_age_min ?? 0;
    if (selectedStages.starting && age === 0) return true;
    if (selectedStages.growing && age <= 2) return true;
    if (selectedStages.established) return true;
    return false;
  };

  const matchesIndigenous = (grant) => {
    if (!indigenousOnly) return true;
    return grant.indigenous_focus === 'exclusive' || grant.indigenous_focus === 'required';
  };

  // ---------------------------------------------------------------------------
  // Filtered grants
  // ---------------------------------------------------------------------------
  const filteredGrants = useMemo(() => {
    return grants.filter(grant => {
      const searchMatch = (grant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (grant.summary || grant.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const statusMatch = !!statusFilter[grant.status];
      
      const activeIndustries = Object.keys(sectorFilter).filter(k => sectorFilter[k]);
      const industryMatch = activeIndustries.length === 0 || (grant.sector_tags || []).some(tag => activeIndustries.includes(tag));
      
      const activeStructures = Object.keys(selectedStructures).filter(k => selectedStructures[k]);
      const structureMatch = activeStructures.length === 0 || (grant.eligible_structures || []).some(tag => activeStructures.includes(tag));

      const activeSupportTypes = Object.keys(selectedSupportTypes).filter(k => selectedSupportTypes[k]);
      const supportTypeMatch = activeSupportTypes.length === 0 || activeSupportTypes.includes(grant.support_type);
      
      const activeObjectives = Object.keys(selectedObjectives).filter(k => selectedObjectives[k]);
      const objectiveMatch = activeObjectives.length === 0 || (grant.objective_tags || []).some(tag => activeObjectives.includes(tag));
      
      return searchMatch && 
             statusMatch && 
             industryMatch && 
             structureMatch && 
             supportTypeMatch && 
             objectiveMatch &&
             matchesStage(grant, stageFilters) &&
             matchesIndigenous(grant);
    });
  }, [grants, searchQuery, statusFilter, sectorFilter, selectedStructures, selectedSupportTypes, selectedObjectives, stageFilters, indigenousOnly]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <>
        {/* SideNavBar */}
        <aside className="fixed right-0 top-1/4 h-fit z-40 flex-col bg-surface-container-high shadow-md docked w-72 rounded-l-xl hidden xl:flex">
          <div className="p-lg border-b border-outline-variant">
            <h2 className="font-headline-md text-headline-md text-primary font-bold">Need Help?</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">We're here to guide you.</p>
          </div>
          <nav className="flex flex-col p-sm gap-sm">
            <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
              <span className="material-symbols-outlined">support_agent</span>
              Help Center
            </a>
            <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
              <span className="material-symbols-outlined">chat</span>
              Contact Advisor
            </a>
            <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
              <span className="material-symbols-outlined">description</span>
              Quick Guides
            </a>
            <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
              <span className="material-symbols-outlined">rate_review</span>
              Feedback
            </a>
          </nav>
          <div className="p-md mt-auto">
            <button className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-sm px-md rounded-lg font-bold hover:opacity-90 transition-opacity">
              Check Eligibility
            </button>
          </div>
        </aside>

        <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-xl flex flex-col gap-xl">
          <section className="bg-primary-container text-on-primary rounded-xl p-xl relative overflow-hidden shadow-sm" style={{ minHeight: '200px' }}>
            <div className="relative z-10 max-w-2xl">
              <h1 className="font-headline-xl text-headline-xl mb-md">Grants and Support for WA Businesses</h1>
              <p className="font-body-lg text-body-lg opacity-90">Discover funding opportunities and expert support tailored to Western Australian primary industries and regional development.</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
          </section>

          <div className="flex justify-center items-center py-2xl">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        </main>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-xl flex flex-col gap-xl">
        <section className="bg-primary-container text-on-primary rounded-xl p-xl relative overflow-hidden shadow-sm" style={{ minHeight: '200px' }}>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl mb-md">Grants and Support for WA Businesses</h1>
            <p className="font-body-lg text-body-lg opacity-90">Discover funding opportunities and expert support tailored to Western Australian primary industries and regional development.</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
        </section>

        <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
          <p className="font-body-md">Could not load grants. Please try again.</p>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* SideNavBar */}
      <aside className="fixed right-0 top-1/4 h-fit z-40 flex-col bg-surface-container-high shadow-md docked w-72 rounded-l-xl hidden xl:flex">
        <div className="p-lg border-b border-outline-variant">
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Need Help?</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">We're here to guide you.</p>
        </div>
        <nav className="flex flex-col p-sm gap-sm">
          <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
            <span className="material-symbols-outlined">support_agent</span>
            Help Center
          </a>
          <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
            <span className="material-symbols-outlined">chat</span>
            Contact Advisor
          </a>
          <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
            <span className="material-symbols-outlined">description</span>
            Quick Guides
          </a>
          <a className="flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-variant rounded-lg font-label-md text-label-md transition-colors" href="#">
            <span className="material-symbols-outlined">rate_review</span>
            Feedback
          </a>
        </nav>
        <div className="p-md mt-auto">
          <button className="w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md py-sm px-md rounded-lg font-bold hover:opacity-90 transition-opacity">
            Check Eligibility
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-xl flex flex-col gap-xl">
        {/* Hero Section */}
        <section className="bg-primary-container text-on-primary rounded-xl p-xl relative overflow-hidden shadow-sm" style={{ minHeight: '200px' }}>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl mb-md">Grants and Support for WA Businesses</h1>
            <p className="font-body-lg text-body-lg opacity-90">Discover funding opportunities and expert support tailored to Western Australian primary industries and regional development.</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
        </section>

        <div className="flex flex-col md:flex-row gap-xl">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-lg">
            <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant shadow-sm sticky top-xl flex flex-col">
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-headline-md text-headline-md text-on-surface">Filters</h3>
                {(searchQuery ||
                  Object.keys(sectorFilter).some(k => sectorFilter[k]) ||
                  Object.keys(selectedStructures).some(k => selectedStructures[k]) ||
                  Object.keys(selectedSupportTypes).some(k => selectedSupportTypes[k]) ||
                  Object.keys(selectedObjectives).some(k => selectedObjectives[k]) ||
                  Object.values(stageFilters).some(v => v) ||
                  statusFilter.closed ||
                  indigenousOnly) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-primary font-label-sm text-label-sm hover:underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-md">
                <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Search</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                  <input
                    className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                    placeholder="Keywords..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <FilterGroup label="Grant Status" sectionKey="grant_status" activeCount={Object.keys(statusFilter).filter(k => statusFilter[k]).length} openSections={openSections} toggleSection={toggleSection}>
                {Object.keys(statusFilter).map(status => (
                  <label key={status} className="flex items-center gap-sm cursor-pointer">
                    <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={statusFilter[status]} onChange={() => handleStatusChange(status)} />
                    <span className="font-body-md text-body-md text-on-surface-variant">{statusLabel[status] || status}</span>
                  </label>
                ))}
              </FilterGroup>

              {availableSectors.length > 0 && (
                <FilterGroup label="Industry" sectionKey="industry" activeCount={Object.keys(sectorFilter).filter(k => sectorFilter[k]).length} openSections={openSections} toggleSection={toggleSection}>
                  {availableSectors.map(slug => (
                    <label key={slug} className="flex items-center gap-sm cursor-pointer">
                      <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={!!sectorFilter[slug]} onChange={() => handleSectorChange(slug)} />
                      <span className="font-body-md text-body-md text-on-surface-variant">{sectorsMap[slug] || slug}</span>
                    </label>
                  ))}
                </FilterGroup>
              )}

              <FilterGroup label="Business Structure" sectionKey="business_structure" activeCount={Object.keys(selectedStructures).filter(k => selectedStructures[k]).length} openSections={openSections} toggleSection={toggleSection}>
                {['company', 'sole_trader', 'trust', 'nfp', 'partnership'].map(val => (
                  <label key={val} className="flex items-center gap-sm cursor-pointer">
                    <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={!!selectedStructures[val]} onChange={() => handleStructureChange(val)} />
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {{'company': 'Company', 'sole_trader': 'Sole Trader', 'trust': 'Trust', 'nfp': 'Not-for-profit', 'partnership': 'Partnership'}[val] || val}
                    </span>
                  </label>
                ))}
              </FilterGroup>

              <FilterGroup label="Support Type" sectionKey="support_type" activeCount={Object.keys(selectedSupportTypes).filter(k => selectedSupportTypes[k]).length} openSections={openSections} toggleSection={toggleSection}>
                {['funding', 'advisory', 'both'].map(val => (
                  <label key={val} className="flex items-center gap-sm cursor-pointer">
                    <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={!!selectedSupportTypes[val]} onChange={() => handleSupportTypeChange(val)} />
                    <span className="font-body-md text-body-md text-on-surface-variant">
                      {{'funding': 'Funding', 'advisory': 'Advisory', 'both': 'Funding + Advisory'}[val] || val}
                    </span>
                  </label>
                ))}
              </FilterGroup>

              {availableObjectives.length > 0 && (
                <FilterGroup label="Objectives" sectionKey="objectives" activeCount={Object.keys(selectedObjectives).filter(k => selectedObjectives[k]).length} openSections={openSections} toggleSection={toggleSection}>
                  {availableObjectives.map(val => (
                    <label key={val} className="flex items-center gap-sm cursor-pointer">
                      <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={!!selectedObjectives[val]} onChange={() => handleObjectiveChange(val)} />
                      <span className="font-body-md text-body-md text-on-surface-variant">{val}</span>
                    </label>
                  ))}
                </FilterGroup>
              )}

              <FilterGroup label="Business Stage" sectionKey="business_stage" activeCount={Object.values(stageFilters).filter(Boolean).length} openSections={openSections} toggleSection={toggleSection}>
                <label className="flex items-center gap-sm cursor-pointer">
                  <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={stageFilters.starting} onChange={() => handleStageChange('starting')} />
                  <span className="font-body-md text-body-md text-on-surface-variant">Starting out (0-1 yr)</span>
                </label>
                <label className="flex items-center gap-sm cursor-pointer">
                  <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={stageFilters.growing} onChange={() => handleStageChange('growing')} />
                  <span className="font-body-md text-body-md text-on-surface-variant">Growing (1-3 yrs)</span>
                </label>
                <label className="flex items-center gap-sm cursor-pointer">
                  <input className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" type="checkbox" checked={stageFilters.established} onChange={() => handleStageChange('established')} />
                  <span className="font-body-md text-body-md text-on-surface-variant">Established (3+ yrs)</span>
                </label>
              </FilterGroup>

              <FilterGroup label="Indigenous Businesses" sectionKey="indigenous" activeCount={indigenousOnly ? 1 : 0} openSections={openSections} toggleSection={toggleSection}>
                <label className="flex items-center gap-sm cursor-pointer mt-sm">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={indigenousOnly} onChange={(e) => setIndigenousOnly(e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${indigenousOnly ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${indigenousOnly ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="font-body-md text-body-md text-on-surface-variant ml-2">Show Indigenous-specific grants only</span>
                </label>
              </FilterGroup>

            </div>
          </aside>

          {/* Grants List */}
          <div className="flex-grow flex flex-col gap-md">
            <div className="flex justify-between items-end mb-sm">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Showing {filteredGrants.length} opportunit{filteredGrants.length === 1 ? 'y' : 'ies'}
              </p>
              <select className="border border-outline-variant rounded py-1 px-3 bg-surface-container-lowest font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Sort by: Closing Soon</option>
                <option>Sort by: Newest</option>
                <option>Sort by: A-Z</option>
              </select>
            </div>

            {filteredGrants.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-xl text-center">
                <p className="font-body-lg text-body-lg text-on-surface-variant">No grants match your current filters.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-md font-label-md text-label-md text-primary hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-md">
                {filteredGrants.map((grant) => {
                  // Use a numeric hash of the UUID for stable image assignment
                  const imageIndex = grant.id
                    ? grant.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
                    : 0;
                  const cardImage = agricultureImages[imageIndex % agricultureImages.length];
                  const cardLabel = getCategoryLabel(grant.sector_tags, sectorsMap);
                  const displayText = grant.summary || grant.description || '';
                  const hasUrl = grant.url && grant.url.trim() !== '';

                  return (
                    <article
                      key={grant.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                    >
                      <img
                        alt={grant.name}
                        className="w-full h-48 object-cover"
                        src={cardImage}
                      />

                      <div className="p-md flex flex-col flex-grow">
                        <div className="flex items-center gap-sm mb-sm flex-wrap">
                          <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-1 rounded">
                            {cardLabel}
                          </span>
                        </div>

                        <h2 className="font-headline-md text-headline-md text-primary mb-sm">{grant.name}</h2>

                        {/* Truncated description */}
                        <p className="font-body-md text-body-md text-on-surface-variant mb-md line-clamp-3">
                          {displayText}
                        </p>

                        <div className="flex flex-col gap-xs mb-md mt-auto">
                          <div className="flex items-center gap-sm text-on-surface-variant font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>Start Date: {formatDate(grant.open_date)}</span>
                          </div>
                          <div className="flex items-center gap-sm text-on-surface-variant font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>End Date: {formatDate(grant.close_date)}</span>
                          </div>
                          <div className={`flex items-center gap-sm font-label-sm text-label-sm mt-xs font-semibold ${statusColor[grant.status] || 'text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            <span>Status: {statusLabel[grant.status] || grant.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Single "Check Details" button */}
                      <div className="p-md pt-0 border-t border-outline-variant bg-surface-container-lowest mt-auto">
                        <a
                          href={hasUrl ? grant.url : '#'}
                          target={hasUrl ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          onClick={!hasUrl ? (e) => e.preventDefault() : undefined}
                          className={`w-full block text-center font-label-md text-label-md py-2 px-4 rounded font-bold shadow-sm transition-colors
                            ${hasUrl
                              ? 'bg-[#b58500] text-white hover:bg-secondary cursor-pointer'
                              : 'bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-50'
                            }`}
                        >
                          Check Details
                          <span className="material-symbols-outlined text-sm ml-1 align-middle">open_in_new</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
