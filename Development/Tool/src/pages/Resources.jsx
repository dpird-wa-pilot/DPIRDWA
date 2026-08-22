import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format ISO date string (YYYY-MM-DD) → "2026" (Just year for resources) */
const formatYear = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).getFullYear().toString();
};

const formatAuthors = (authors) => {
  if (!authors || authors.length === 0) return 'DPIRD Western Australia';
  if (authors.length <= 2) return authors.join(', ');
  return `${authors[0]}, ${authors[1]} +${authors.length - 2} more`;
};

/** Labels and colors for resource types */
const typeLabels = {
  book_chapter: { label: 'Book / Chapter', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  journal_article: { label: 'Journal Article', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  research_report: { label: 'Research Report', color: 'bg-green-100 text-green-800 border-green-200' }
};

/** Labels for DML levels */
const dmlLabels = {
  foundational: 'Foundational',
  emerging: 'Emerging',
  established: 'Established',
  advanced: 'Advanced'
};

const formatDmlBadge = (dmlLevels) => {
  if (!dmlLevels || dmlLevels.length === 0) return null;
  if (dmlLevels.length === 1) return dmlLabels[dmlLevels[0]];
  // If multiple, show range (e.g. "Foundational - Emerging") 
  // Assuming they are ordered by enum in the DB or we can just join them. 
  // We'll just show the first and last
  const levels = ['foundational', 'emerging', 'established', 'advanced'];
  const present = levels.filter(l => dmlLevels.includes(l));
  if (present.length <= 1) return dmlLabels[present[0]];
  return `${dmlLabels[present[0]]} – ${dmlLabels[present[present.length-1]]}`;
};

/** Return human-readable category label from sector_tags using the sectors map */
const getCategoryLabel = (sectorTags, sectorsMap) => {
  if (!sectorTags || sectorTags.length === 0) return 'General';
  const slug = sectorTags[0];
  return sectorsMap[slug] || slug;
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

export default function Resources() {
  // --- Data state ---
  const [resources, setResources] = useState([]);
  const [sectorsMap, setSectorsMap] = useState({}); // { slug: name }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter state ---
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedTypes, setSelectedTypes] = useState({});
  const [selectedIndustries, setSelectedIndustries] = useState({});
  const [selectedDmlLevels, setSelectedDmlLevels] = useState({});

  const [openSections, setOpenSections] = useState({
    resource_type: true,
    industry: true,
    dml_level: false,
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
      const [resourcesResult, sectorsResult] = await Promise.all([
        supabase
          .from('resources')
          .select('id, title, slug, resource_type, authors, summary, abstract, publication_date, publisher, journal_name, volume_issue, report_number, library_url, sector_tags, trigger_tags, dml_levels, is_featured, sort_order')
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('sort_order', { ascending: true })
          .order('publication_date', { ascending: false }),
        supabase
          .from('sectors')
          .select('slug, name')
          .eq('is_active', true),
      ]);

      if (resourcesResult.error) {
        setError(resourcesResult.error.message);
        setLoading(false);
        return;
      }

      // Build slug → name map from sectors table
      const map = {};
      if (!sectorsResult.error && sectorsResult.data) {
        sectorsResult.data.forEach(s => { map[s.slug] = s.name; });
      }

      setResources(resourcesResult.data || []);
      setSectorsMap(map);
      setLoading(false);
    };

    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // Derived: available industries
  // ---------------------------------------------------------------------------
  const availableIndustries = useMemo(() => {
    const slugs = new Set();
    resources.forEach(r => (r.sector_tags || []).forEach(s => slugs.add(s)));
    return Array.from(slugs).sort();
  }, [resources]);

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleTypeChange = (val) => setSelectedTypes(prev => ({ ...prev, [val]: !prev[val] }));
  const handleIndustryChange = (slug) => setSelectedIndustries(prev => ({ ...prev, [slug]: !prev[slug] }));
  const handleDmlChange = (val) => setSelectedDmlLevels(prev => ({ ...prev, [val]: !prev[val] }));

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTypes({});
    setSelectedIndustries({});
    setSelectedDmlLevels({});
    setOpenSections({
      resource_type: true,
      industry: true,
      dml_level: false,
    });
  };

  const activeFiltersCount = 
    Object.values(selectedTypes).filter(Boolean).length +
    Object.values(selectedIndustries).filter(Boolean).length +
    Object.values(selectedDmlLevels).filter(Boolean).length;
    
  const hasAnyFilterActive = activeFiltersCount > 0 || searchQuery.trim() !== '';

  // ---------------------------------------------------------------------------
  // Apply filtering
  // ---------------------------------------------------------------------------
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      // 1. Search keyword (matches title, summary, authors)
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.summary && r.summary.toLowerCase().includes(q)) ||
        (r.authors && r.authors.some(a => a.toLowerCase().includes(q)))
      );

      // 2. Resource Type (OR within group)
      const activeTypes = Object.keys(selectedTypes).filter(k => selectedTypes[k]);
      const matchesType = activeTypes.length === 0 || activeTypes.includes(r.resource_type);

      // 3. Industry (OR within group)
      const activeIndustries = Object.keys(selectedIndustries).filter(k => selectedIndustries[k]);
      const matchesIndustry = activeIndustries.length === 0 || 
        (r.sector_tags && r.sector_tags.some(tag => activeIndustries.includes(tag)));

      // 4. DML Level (OR within group)
      const activeDml = Object.keys(selectedDmlLevels).filter(k => selectedDmlLevels[k]);
      const matchesDml = activeDml.length === 0 || 
        (r.dml_levels && r.dml_levels.some(level => activeDml.includes(level)));

      return matchesSearch && matchesType && matchesIndustry && matchesDml;
    });
  }, [resources, searchQuery, selectedTypes, selectedIndustries, selectedDmlLevels]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Main Directory Layout */}
      <main className="flex-1 max-w-container-max mx-auto w-full px-gutter py-xl flex flex-col gap-xl relative">
        {/* Hero Section */}
        <section className="bg-primary-container text-on-primary rounded-xl p-xl relative overflow-hidden shadow-sm" style={{ minHeight: '200px' }}>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl mb-md">Digital Resources</h1>
            <p className="font-body-lg text-body-lg opacity-90">Explore curated industry digital plans, research reports, and technical publications designed to accelerate the growth of your business.</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
        </section>

        <div className="flex flex-col md:flex-row gap-xl relative">
        {/* Left Sidebar: Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-lg">
          
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Filters</h2>
            {hasAnyFilterActive && (
              <button 
                onClick={handleClearFilters}
                className="text-primary font-label-sm text-label-sm hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm">
            {/* Search */}
            <div className="mb-md">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-container-lowest"
                  placeholder="Search resources..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {/* Filter Group: Resource Type */}
            <FilterGroup
              label="Resource Type"
              sectionKey="resource_type"
              activeCount={Object.values(selectedTypes).filter(Boolean).length}
              openSections={openSections}
              toggleSection={toggleSection}
            >
              {[
                { value: 'book_chapter', label: 'Book / Chapter' },
                { value: 'journal_article', label: 'Journal Article' },
                { value: 'research_report', label: 'Research Report' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    checked={!!selectedTypes[opt.value]}
                    onChange={() => handleTypeChange(opt.value)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </FilterGroup>

            {/* Filter Group: Industry */}
            <FilterGroup
              label="Industry"
              sectionKey="industry"
              activeCount={Object.values(selectedIndustries).filter(Boolean).length}
              openSections={openSections}
              toggleSection={toggleSection}
            >
              {availableIndustries.length === 0 && (
                <span className="text-on-surface-variant text-sm italic">Loading...</span>
              )}
              {availableIndustries.map(slug => (
                <label key={slug} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    checked={!!selectedIndustries[slug]}
                    onChange={() => handleIndustryChange(slug)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                    {sectorsMap[slug] || slug}
                  </span>
                </label>
              ))}
            </FilterGroup>

            {/* Filter Group: DML */}
            <FilterGroup
              label="Digital Maturity Level"
              sectionKey="dml_level"
              activeCount={Object.values(selectedDmlLevels).filter(Boolean).length}
              openSections={openSections}
              toggleSection={toggleSection}
            >
              {[
                { value: 'foundational', label: 'Foundational (0–24)' },
                { value: 'emerging',     label: 'Emerging (25–49)' },
                { value: 'established',  label: 'Established (50–74)' },
                { value: 'advanced',     label: 'Advanced (75–100)' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    checked={!!selectedDmlLevels[opt.value]}
                    onChange={() => handleDmlChange(opt.value)}
                    className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-surface-container-lowest" 
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </FilterGroup>
          </div>
        </aside>

        {/* Right Content: Grid */}
        <section className="flex-1 flex flex-col gap-lg">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-surface-container-lowest p-sm px-md rounded-lg border border-outline-variant shadow-sm">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Showing <strong className="text-on-surface">{filteredResources.length}</strong> of <strong className="text-on-surface">{resources.length}</strong> resources
            </span>
            <div className="flex items-center gap-sm w-full sm:w-auto">
              <span className="font-body-md text-body-md text-on-surface-variant whitespace-nowrap">Sort by:</span>
              <select className="border border-outline-variant rounded-lg bg-surface-container-lowest text-body-md font-body-md py-xs pl-sm pr-xl focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto">
                <option>Newest Published</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>

          {/* States (Loading / Error / Empty) */}
          {loading && (
             <div className="flex justify-center items-center py-2xl">
               <span className="material-symbols-outlined animate-spin text-primary text-4xl">
                 progress_activity
               </span>
             </div>
          )}

          {!loading && error && (
            <div className="bg-error-container text-on-error-container rounded-lg p-lg text-center">
              <p className="font-body-md">Could not load resources. Please try again. ({error})</p>
            </div>
          )}

          {!loading && !error && filteredResources.length === 0 && (
            <div className="text-center py-2xl">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                search_off
              </span>
              <p className="font-body-lg text-on-surface-variant mt-md">
                No resources match your current filters.
              </p>
              {hasAnyFilterActive && (
                <button onClick={handleClearFilters} className="text-primary font-label-md mt-sm hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Bento Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-lg">
            {!loading && !error && filteredResources.map((resource) => {
              // Extract UI properties
              const typeConfig = typeLabels[resource.resource_type] || { label: resource.resource_type, color: 'bg-gray-100 text-gray-800 border-gray-200' };
              const categoryLabel = getCategoryLabel(resource.sector_tags, sectorsMap);
              const summaryText = resource.summary || (resource.abstract ? resource.abstract.substring(0, 400) + '...' : '');
              const dmlBadge = formatDmlBadge(resource.dml_levels);
              
              return (
                <article key={resource.id} className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col hover:shadow-md transition-shadow duration-300 group p-lg">
                  {/* Card Header: Badges */}
                  <div className="flex flex-wrap items-center gap-xs mb-sm">
                    <span className={`font-label-sm text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                    <span className="font-label-sm text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-outline-variant text-on-surface-variant bg-surface-variant">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  {/* [CC-002] Título del recurso, autores y año */}
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-xs group-hover:text-primary transition-colors line-clamp-2">
                    {resource.title}
                  </h3>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mb-md flex items-center gap-xs flex-wrap">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>{formatAuthors(resource.authors)}</span>
                    <span>•</span>
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <span>{formatYear(resource.publication_date)}</span>
                  </div>

                  {/* Summary */}
                  <p className="font-body-md text-body-md text-on-surface-variant mb-lg flex-1 line-clamp-6">
                    {summaryText}
                  </p>

                  {/* Optional Details (Journal / Report Num / DML) */}
                  {(dmlBadge || resource.journal_name || resource.report_number) && (
                    <div className="bg-surface-container-low rounded p-sm mb-lg flex flex-col gap-xs">

                      {resource.journal_name && (
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
                          <span className="font-body-xs text-body-xs font-semibold text-on-surface-variant">Journal:</span>
                          <span className="font-body-xs text-body-xs text-on-surface">{resource.journal_name} {resource.volume_issue ? `(${resource.volume_issue})` : ''}</span>
                        </div>
                      )}
                      {resource.report_number && (
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[14px] text-primary">article</span>
                          <span className="font-body-xs text-body-xs font-semibold text-on-surface-variant">Report #:</span>
                          <span className="font-body-xs text-body-xs text-on-surface">{resource.report_number}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {/* [CC-002] Botón de acceso a biblioteca color navy DPIRD */}
                  <div className="mt-auto">
                    <a
                      href={resource.library_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center font-label-md text-label-md py-2 px-4 rounded font-bold shadow-sm transition-colors bg-[#003D7B] text-white hover:bg-[#002a57] cursor-pointer"
                    >
                      View in DPIRD Library
                      <span className="material-symbols-outlined text-sm ml-1 align-middle">open_in_new</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        
        {/* SideNavBar (Shared Component - Help Widget) */}
        <div className="hidden xl:flex fixed right-0 top-1/4 h-fit z-40 flex-col w-72 rounded-l-xl shadow-md bg-surface-container-high border-y border-l border-outline-variant overflow-hidden">
          <div className="p-md bg-primary text-on-primary flex flex-col gap-xs">
            <span className="font-headline-md text-headline-md">Need Help?</span>
            <span className="font-body-md text-body-md text-on-primary/90">We're here to guide you.</span>
          </div>
          <div className="flex flex-col py-sm">
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-variant transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-primary">support_agent</span>
              <span className="font-label-md text-label-md">Help Center</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-variant transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-primary">chat</span>
              <span className="font-label-md text-label-md">Contact Advisor</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-variant transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-primary">description</span>
              <span className="font-label-md text-label-md">Quick Guides</span>
            </a>
            <a className="flex items-center gap-md px-md py-sm text-on-surface-variant hover:bg-surface-variant transition-colors group" href="#">
              <span className="material-symbols-outlined group-hover:text-primary">rate_review</span>
              <span className="font-label-md text-label-md">Feedback</span>
            </a>
          </div>
          <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
            <button className="w-full bg-secondary text-on-secondary py-sm rounded-lg font-label-md text-label-md hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm">
              Check Eligibility
            </button>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
