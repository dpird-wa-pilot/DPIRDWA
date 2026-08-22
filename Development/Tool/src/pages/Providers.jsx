import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// ---------------------------------------------------------------------------
// Helpers & Vocab
// ---------------------------------------------------------------------------

// [CC-003] service_types filter options — vocab v2.1
const serviceTypeOptions = [
  { value: 'consulting',      label: 'Consulting' },
  { value: 'implementation',  label: 'Implementation' },
  { value: 'training',        label: 'Training' },
  { value: 'audit',           label: 'Audit & Review' },
  { value: 'logistics',       label: 'Logistics' },
  { value: 'marketing',       label: 'Marketing & Design' },
  { value: 'facilities',      label: 'Facilities' },
];

const serviceTypeLabels = serviceTypeOptions.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

// [CC-003] Labels por location
const locationOptions = [
  { value: 'metro_wa',    label: 'Metro WA' },
  { value: 'regional_wa', label: 'Regional WA' },
  { value: 'national',    label: 'National' },
  { value: 'remote',      label: 'Remote WA' },
];

const locationLabels = locationOptions.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

/** Return human-readable category label from sector_tags using the sectors map */
const getCategoryLabel = (slug, sectorsMap) => {
  return sectorsMap[slug] || slug;
};

// [CC-003 §18] Visual improvements maps
const SERVICE_ACCENT_COLORS = {
  consulting:      'bg-blue-500',
  implementation:  'bg-teal-500',
  training:        'bg-violet-500',
  audit:           'bg-orange-500',
  logistics:       'bg-amber-500',
  marketing:       'bg-pink-500',
  facilities:      'bg-green-500',
};

const SERVICE_BADGE_COLORS = {
  consulting:      'bg-blue-100 text-blue-800',
  implementation:  'bg-teal-100 text-teal-800',
  training:        'bg-violet-100 text-violet-800',
  audit:           'bg-orange-100 text-orange-800',
  logistics:       'bg-amber-100 text-amber-800',
  marketing:       'bg-pink-100 text-pink-800',
  facilities:      'bg-green-100 text-green-800',
};

const SERVICE_PANEL_BG = {
  consulting:      'bg-blue-50',
  implementation:  'bg-teal-50',
  training:        'bg-violet-50',
  audit:           'bg-orange-50',
  logistics:       'bg-amber-50',
  marketing:       'bg-pink-50',
  facilities:      'bg-green-50',
};

const SERVICE_ICON_COLORS = {
  consulting:      'bg-blue-100 text-blue-600',
  implementation:  'bg-teal-100 text-teal-600',
  training:        'bg-violet-100 text-violet-600',
  audit:           'bg-orange-100 text-orange-600',
  logistics:       'bg-amber-100 text-amber-600',
  marketing:       'bg-pink-100 text-pink-600',
  facilities:      'bg-green-100 text-green-600',
};

// ---------------------------------------------------------------------------
// Components
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

// [CC-003] Provider card — exact match to provider-card-mockup.html (versión "Actual" aprobada)
const ProviderCard = ({ provider, sectorsMap }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-shadow overflow-hidden flex flex-col md:flex-row">

      {/* ── Columna izquierda: contenido ── */}
      <div className="flex-1 px-[24px] py-[20px] border-b md:border-b-0 md:border-r border-[#E2E8F0] flex flex-col gap-[10px]">

        {/* Título */}
        <div className="text-[17px] font-bold text-[#1a1a2e] leading-[1.3]">
          {provider.name}
        </div>

        {/* Badges de service types */}
        <div className="flex flex-wrap gap-[6px]">
          {(provider.service_types || []).map(type => (
            <span key={type} className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-1 rounded whitespace-nowrap">
              {serviceTypeLabels[type] || type}
            </span>
          ))}
        </div>

        {/* Summary */}
        <p className="text-[13px] text-[#4B5563] leading-[1.55] line-clamp-2">
          {provider.summary || provider.description}
        </p>

        {/* Industries Served (Expandable) */}
        {expanded && (provider.sector_tags || []).length > 0 && (
          <div className="pt-[4px] border-t border-[#F1F5F9]">
            <h4 className="text-[11px] font-bold text-[#374151] uppercase tracking-[0.07em] mb-[8px]">
              Industries served
            </h4>
            <div className="flex flex-col gap-[5px]">
              {(provider.sector_tags || []).map(s => (
                <div key={s} className="flex items-center gap-[6px] text-[12.5px] text-[#4B5563]">
                  <span className="material-symbols-outlined text-[15px] text-[#003D7B]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  {getCategoryLabel(s, sectorsMap)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Button */}
        {(provider.sector_tags || []).length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-[4px] text-[12.5px] font-semibold text-[#003D7B] mt-[2px] hover:underline"
            >
              <span>{expanded ? 'View less' : 'View more'}</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Panel derecho: acción ── */}
      <div className="flex-shrink-0 flex flex-col items-center px-[16px] py-[20px] bg-[#F8FAFC] gap-[12px]"
           style={{ width: '192px', minWidth: '192px' }}>

        {/* Logo o ícono */}
        <div className="w-[56px] h-[56px] rounded-[10px] bg-[#E2E8F0] flex items-center justify-center flex-shrink-0">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-contain rounded-[10px]" />
          ) : (
            <span className="material-symbols-outlined text-[30px] text-[#94A3B8]">business</span>
          )}
        </div>

        {/* DPIRD Approved */}
        {provider.dpird_approved && (
          <span className="inline-flex items-center gap-[4px] bg-[#003D7B] text-white text-[10.5px] font-bold px-[10px] py-[4px] rounded-full text-center">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            DPIRD Approved
          </span>
        )}

        {/* Ubicación */}
        <div className="flex flex-col gap-[4px] w-full">
          {(provider.location || []).map(loc => (
            <div key={loc} className="flex items-center gap-[5px] text-[11.5px] text-[#4B5563]">
              <span className="material-symbols-outlined text-[14px] text-[#64748B]">location_on</span>
              {locationLabels[loc] || loc}
            </div>
          ))}

          {provider.operates_online && (
            <div className="flex items-center gap-[5px] text-[11.5px] text-[#4B5563]">
              <span className="material-symbols-outlined text-[14px] text-[#64748B]">language</span>
              Available online
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-[7px] w-full mt-auto">
          <a
            href={provider.website || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={!provider.website ? (e) => e.preventDefault() : undefined}
            className={`flex items-center justify-center gap-[4px] w-full py-[8px] px-[12px] text-[12px] font-bold rounded-[6px] transition-colors
              ${provider.website
                ? 'bg-[#003D7B] text-white hover:bg-[#002a57] cursor-pointer'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            Visit Website
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
          </a>

          {(provider.email || provider.phone) && (
            <a
              href={provider.email ? `mailto:${provider.email}` : `tel:${provider.phone}`}
              className="flex items-center justify-center gap-[4px] w-full py-[7px] px-[12px] text-[12px] font-bold rounded-[6px] border-[1.5px] border-[#b58500] bg-[#b58500] text-white hover:bg-[#9a7100] hover:border-[#9a7100] transition-colors"
            >
              Contact
              <span className="material-symbols-outlined text-[13px]">
                {provider.email ? 'mail' : 'phone'}
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};


export default function Providers() {
  // --- Data state ---
  const [providers, setProviders] = useState([]);
  const [sectorsMap, setSectorsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Filter state ---
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedServiceTypes, setSelectedServiceTypes] = useState({});
  const [selectedIndustries, setSelectedIndustries] = useState({});
  const [selectedLocations, setSelectedLocations] = useState({});

  // [CC-003] Accordion state — Providers filters
  const [openSections, setOpenSections] = useState({
    service_type: true,
    industry: true,
    location: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  // [CC-003] Query providers activos desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const [providersResult, sectorsResult] = await Promise.all([
        supabase
          .from('providers')
          .select(`
            id, name, slug, summary, description,
            website, email, phone, logo_url,
            contact_name, service_types, service_category,
            sector_tags, dml_levels, objective_tags,
            location, operates_online,
            dpird_approved, approval_date,
            is_featured, sort_order
          `)
          .eq('status', 'active')
          .order('is_featured', { ascending: false })
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('sectors')
          .select('slug, name')
          .eq('is_active', true),
      ]);

      if (providersResult.error) {
        setError(providersResult.error.message);
        setLoading(false);
        return;
      }

      // Build slug → name map
      const map = {};
      if (!sectorsResult.error && sectorsResult.data) {
        sectorsResult.data.forEach(s => { map[s.slug] = s.name; });
      }

      setProviders(providersResult.data || []);
      setSectorsMap(map);
      setLoading(false);
    };

    fetchData();
  }, []);

  // ---------------------------------------------------------------------------
  // Derived Filters
  // ---------------------------------------------------------------------------
  const availableIndustries = useMemo(() => {
    const slugs = new Set();
    providers.forEach(p => (p.sector_tags || []).forEach(s => slugs.add(s)));
    return Array.from(slugs).sort();
  }, [providers]);

  // ---------------------------------------------------------------------------
  // Filter handlers
  // ---------------------------------------------------------------------------
  const handleServiceTypeChange = (val) => setSelectedServiceTypes(prev => ({ ...prev, [val]: !prev[val] }));
  const handleIndustryChange = (slug) => setSelectedIndustries(prev => ({ ...prev, [slug]: !prev[slug] }));
  const handleLocationChange = (val) => setSelectedLocations(prev => ({ ...prev, [val]: !prev[val] }));

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedServiceTypes({});
    setSelectedIndustries({});
    setSelectedLocations({});
    setOpenSections({
      service_type: true,
      industry: true,
      location: false,
    });
  };

  const activeFiltersCount = 
    Object.values(selectedServiceTypes).filter(Boolean).length +
    Object.values(selectedIndustries).filter(Boolean).length +
    Object.values(selectedLocations).filter(Boolean).length;
    
  const hasAnyFilterActive = activeFiltersCount > 0 || searchQuery.trim() !== '';

  // ---------------------------------------------------------------------------
  // Apply filtering
  // ---------------------------------------------------------------------------
  // [CC-003] Location filter — providers online son visibles desde cualquier ubicación
  const matchesLocation = (provider, selectedLocs) => {
    if (selectedLocs.length === 0) return true;
    if (provider.operates_online) return true;
    return (provider.location || []).some(loc => selectedLocs.includes(loc));
  };

  const filteredProviders = useMemo(() => {
    return providers.filter(p => {
      // 1. Search keyword
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.summary && p.summary.toLowerCase().includes(q))
      );

      // 2. Service Type
      const activeTypes = Object.keys(selectedServiceTypes).filter(k => selectedServiceTypes[k]);
      const matchType = activeTypes.length === 0 || 
        (p.service_types && p.service_types.some(t => activeTypes.includes(t)));

      // 3. Industry
      const activeInd = Object.keys(selectedIndustries).filter(k => selectedIndustries[k]);
      const matchInd = activeInd.length === 0 || 
        (p.sector_tags && p.sector_tags.some(tag => activeInd.includes(tag)));

      // 4. Location
      const activeLoc = Object.keys(selectedLocations).filter(k => selectedLocations[k]);
      const matchLoc = matchesLocation(p, activeLoc);

      return matchesSearch && matchType && matchInd && matchLoc;
    });
  }, [providers, searchQuery, selectedServiceTypes, selectedIndustries, selectedLocations]);

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
            <h1 className="font-headline-xl text-headline-xl mb-md">Providers</h1>
            <p className="font-body-lg text-body-lg opacity-90">Find pre-approved consultants, trainers, and specialists across Western Australia — matched to your industry and digital maturity level.</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
        </section>

        <div className="flex flex-col md:flex-row gap-xl relative">
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-lg">
            <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Filters</h2>
            {hasAnyFilterActive && (
              <button 
                onClick={clearAllFilters}
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
                  placeholder="Keywords..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {/* Filter Group: Service Type */}
            <FilterGroup
              label="Service Type"
              sectionKey="service_type"
              activeCount={Object.values(selectedServiceTypes).filter(Boolean).length}
              openSections={openSections}
              toggleSection={toggleSection}
            >
              {serviceTypeOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    checked={!!selectedServiceTypes[opt.value]}
                    onChange={() => handleServiceTypeChange(opt.value)}
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

            {/* Filter Group: Location */}
            <FilterGroup
              label="Location"
              sectionKey="location"
              activeCount={Object.values(selectedLocations).filter(Boolean).length}
              openSections={openSections}
              toggleSection={toggleSection}
            >
              {locationOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    checked={!!selectedLocations[opt.value]}
                    onChange={() => handleLocationChange(opt.value)}
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

        {/* Right Content: Feed */}
        <section className="flex-1 flex flex-col gap-lg">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm bg-surface-container-lowest p-sm px-md rounded-lg border border-outline-variant shadow-sm">
            <span className="font-body-md text-body-md text-on-surface-variant">
              Showing <strong className="text-on-surface">{filteredProviders.length}</strong> of <strong className="text-on-surface">{providers.length}</strong> providers
            </span>
            <div className="flex items-center gap-sm w-full sm:w-auto">
              <span className="font-body-md text-body-md text-on-surface-variant whitespace-nowrap">Sort by:</span>
              <select className="border border-outline-variant rounded-lg bg-surface-container-lowest text-body-md font-body-md py-xs pl-sm pr-xl focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto">
                <option>Featured</option>
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
              <p className="font-body-md">Could not load providers. Please try again. ({error})</p>
            </div>
          )}

          {!loading && !error && filteredProviders.length === 0 && (
            <div className="text-center py-2xl">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                search_off
              </span>
              <p className="font-body-lg text-on-surface-variant mt-md">
                No providers match your current filters.
              </p>
              {hasAnyFilterActive && (
                <button onClick={clearAllFilters} className="text-primary font-label-md mt-sm hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* List of Cards */}
          <div className="flex flex-col gap-lg">
            {!loading && !error && filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} sectorsMap={sectorsMap} />
            ))}
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
