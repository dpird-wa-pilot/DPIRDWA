import React, { useState, useMemo, useEffect } from 'react';

const grantsData = [
  {
    id: 1,
    title: `Community Stewardship Grants`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '12 March 2026',
    endDate: '29 April 2026',
    closes: '2026-04-29',
    eligibility: [
      'Must be a community-based organization.',
      'Project must be located in Western Australia.',
      'Must demonstrate stewardship of natural resources.',
      'Minimum matching funding of 25% required.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/community-stewardship-guidelines',
    description: `Detailed information regarding the Community Stewardship Grants. This funding opportunity opens on 12 March 2026 and closes on 29 April 2026. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 2,
    title: `Feral Cat Management Grants`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '12 March 2026',
    endDate: '29 April 2026',
    closes: '2026-04-29',
    eligibility: [
      'Local government authorities or recognized biosecurity groups.',
      'Project must align with the WA Feral Cat Strategy.',
      'Partnership with environmental groups encouraged.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/feral-cat-management-guidelines',
    description: `Detailed information regarding the Feral Cat Management Grants. This funding opportunity opens on 12 March 2026 and closes on 29 April 2026. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 3,
    title: `WaterSmart Farms voucher program`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '7 March 2026',
    endDate: '3 May 2026',
    closes: '2026-05-03',
    eligibility: [
      'Primary producers in the Gnangara groundwater areas.',
      'Must have a valid water license.',
      'Willingness to implement water efficiency measures.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/watersmart-farms-guidelines',
    description: `Detailed information regarding the WaterSmart Farms voucher program. This funding opportunity opens on 7 March 2026 and closes on 3 May 2026. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 4,
    title: `Supply Chain Capacity Program`,
    category: 'Regional',
    status: 'Closed',
    startDate: '27 February 2026',
    endDate: '24 April 2026',
    closes: '2026-04-24',
    eligibility: [
      'Regional businesses in the food and beverage sector.',
      'Must be registered for GST.',
      'Project must increase processing or logistics capacity.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/supply-chain-capacity-guidelines',
    description: `Detailed information regarding the Supply Chain Capacity Program. This funding opportunity opens on 27 February 2026 and closes on 24 April 2026. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 5,
    title: `Noongar Regional Corporations Economic Foundations Grants`,
    category: 'Regional',
    status: 'Open',
    startDate: '16 February 2026',
    endDate: '30 June 2026',
    closes: '2026-06-30',
    eligibility: [
      'Limited to the 6 Noongar Regional Corporations identified by the South West Native Title Settlement.',
      'Project must focus on economic and business development planning.',
      'Corporate governance training must be a core component.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/siteassets/documents/aed/nrcefg-round2-guidelines.pdf',
    applyUrl: 'https://dpird.smartygrants.com.au/NRCEFG2',
    description: `The Noongar Regional Corporations Economic Foundations Grants will support the 6 Noongar Regional Corporations to undertake economic and business development planning and corporate governance training, empowering them to take advantage of economic opportunities in their regions.`
  },
  {
    id: 6,
    title: `Building Better Aboriginal Business Supply Chain Voucher`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '3 December 2025',
    endDate: '2 February 2026',
    closes: '2026-02-02',
    eligibility: [
      'Aboriginal-owned businesses (50% or more ownership).',
      'Operating in the primary industry or related supply chain.',
      'Must have been trading for at least 12 months.'
    ],
    guidelinesUrl: 'https://www.dpird.wa.gov.au/bbab-supply-chain-voucher-guidelines',
    description: `Detailed information regarding the Building Better Aboriginal Business Supply Chain Voucher. This funding opportunity opens on 3 December 2025 and closes on 2 February 2026. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 26,
    title: `Value Add Investment Grants program - Capital Investment Stream`,
    category: 'Regional',
    status: 'Closed',
    startDate: '22 March 2024',
    endDate: '3 May 2024',
    closes: '3 May 2024',
    description: `Detailed information regarding the Value Add Investment Grants program - Capital Investment Stream. This funding opportunity opens on 22 March 2024 and closes on 3 May 2024. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 27,
    title: `Carbon Farming and Land Restoration Program`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '7 March 2024',
    endDate: '20 May 2024',
    closes: '20 May 2024',
    description: `Detailed information regarding the Carbon Farming and Land Restoration Program. This funding opportunity opens on 7 March 2024 and closes on 20 May 2024. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 28,
    title: `Native Seed and Nursery Development Program Grants`,
    category: 'Agriculture',
    status: 'Closed',
    startDate: '28 October 2022',
    endDate: '9 December 2022',
    closes: '9 December 2022',
    description: `Detailed information regarding the Native Seed and Nursery Development Program Grants. This funding opportunity opens on 28 October 2022 and closes on 9 December 2022. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  },
  {
    id: 29,
    title: `Building Better Aboriginal Businesses Goldfields Grant`,
    category: 'Regional',
    status: 'Closed',
    startDate: '4 March 2022',
    endDate: '28 April 2022',
    closes: '28 April 2022',
    description: `Detailed information regarding the Building Better Aboriginal Businesses Goldfields Grant. This funding opportunity opens on 4 March 2022 and closes on 28 April 2022. Eligibility criteria apply. Please refer to the official DPIRD guidelines for full application requirements, matching funding ratios, and submission procedures.`
  }
];

export default function Grants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState({
    Open: true,
    Closed: false
  });
  
  const [categoryFilter, setCategoryFilter] = useState({
    'Agriculture': false,
    'Regional': false,
    'Emergencies': false,
    'Food and beverage': false,
    'Sustainability': false
  });

  const handleStatusChange = (status) => {
    setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const filteredGrants = useMemo(() => {
    return grantsData.filter(grant => {
      // Search filter
      const searchMatch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          grant.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter[grant.status];

      // Category filter (if none selected, show all. If some selected, must match one)
      const activeCategories = Object.keys(categoryFilter).filter(k => categoryFilter[k]);
      const categoryMatch = activeCategories.length === 0 || activeCategories.includes(grant.category);

      return searchMatch && statusMatch && categoryMatch;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

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
        <section className="bg-primary-container text-on-primary rounded-xl p-xl relative overflow-hidden shadow-sm" style={{minHeight: '200px'}}>
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl mb-md">Grants and Support for WA Businesses</h1>
            <p className="font-body-lg text-body-lg opacity-90">Discover funding opportunities and expert support tailored to Western Australian primary industries and regional development.</p>
          </div>
          {/* Decorative background pattern could go here, using CSS gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-surface-tint opacity-80 z-0"></div>
        </section>

        <div className="flex flex-col md:flex-row gap-xl">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-lg">
            <div className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant shadow-sm sticky top-xl">
              <h3 className="font-headline-md text-headline-md mb-md text-on-surface">Filters</h3>
              {/* Search */}
              <div className="mb-lg">
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
              {/* Status */}
              <div className="mb-lg border-t border-outline-variant pt-md">
                <h4 className="font-label-md text-label-md text-on-surface mb-sm">Status</h4>
                <div className="flex flex-col gap-sm">
                  {Object.keys(statusFilter).map(status => (
                    <label key={status} className="flex items-center gap-sm cursor-pointer">
                      <input 
                        className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" 
                        type="checkbox"
                        checked={statusFilter[status]}
                        onChange={() => handleStatusChange(status)}
                      />
                      <span className="font-body-md text-body-md text-on-surface-variant">{status}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Category */}
              <div className="mb-lg border-t border-outline-variant pt-md">
                <h4 className="font-label-md text-label-md text-on-surface mb-sm">Category</h4>
                <div className="flex flex-col gap-sm">
                  {Object.keys(categoryFilter).map(category => (
                    <label key={category} className="flex items-center gap-sm cursor-pointer">
                      <input 
                        className="form-checkbox text-primary rounded border-outline-variant focus:ring-primary" 
                        type="checkbox"
                        checked={categoryFilter[category]}
                        onChange={() => handleCategoryChange(category)}
                      />
                      <span className="font-body-md text-body-md text-on-surface-variant">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          
          {/* Grants List */}
          <div className="flex-grow flex flex-col gap-md">
            <div className="flex justify-between items-end mb-sm">
              <p className="font-body-md text-body-md text-on-surface-variant">Showing {filteredGrants.length} opportunit{filteredGrants.length === 1 ? 'y' : 'ies'}</p>
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
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter({Open: true, Closed: true});
                    setCategoryFilter({'Agriculture': false, 'Regional': false, 'Emergencies': false, 'Food and beverage': false, 'Sustainability': false});
                  }}
                  className="mt-md font-label-md text-label-md text-primary hover:underline cursor-pointer">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-md">
                {(() => {
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
                    "https://images.unsplash.com/photo-1684154739620-ef7b1e078d4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  ];
                  return filteredGrants.map((grant) => (
                    <article 
                      key={grant.id} 
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                    >
                      <img 
                        alt={grant.title} 
                        className="w-full h-48 object-cover" 
                        src={agricultureImages[grant.id % agricultureImages.length]} 
                      />
                      
                      <div className="p-md flex flex-col flex-grow">
                        <div className="flex items-center gap-sm mb-sm flex-wrap">
                          <span className="font-label-sm text-label-sm bg-tertiary-fixed text-on-tertiary-fixed-variant px-2 py-1 rounded">{grant.category}</span>
                        </div>
                        
                        <h2 className="font-headline-md text-headline-md text-primary mb-sm">{grant.title}</h2>
                        
                        {/* Truncated Description */}
                        <p className="font-body-md text-body-md text-on-surface-variant mb-md line-clamp-3">
                          {grant.description}
                        </p>
                        
                        <div className="flex flex-col gap-xs mb-md mt-auto">
                          <div className="flex items-center gap-sm text-on-surface-variant font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>Start Date: {grant.startDate}</span>
                          </div>
                          <div className="flex items-center gap-sm text-on-surface-variant font-label-sm text-label-sm">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>End Date: {grant.endDate}</span>
                          </div>
                          <div className={`flex items-center gap-sm font-label-sm text-label-sm mt-xs font-semibold ${grant.status === 'Open' ? 'text-[#1b5e20]' : 'text-error'}`}>
                            <span className="material-symbols-outlined text-[16px]">info</span>
                            <span>Status: {grant.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-md pt-0 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-sm bg-surface-container-lowest mt-auto">
                        <button className="font-label-md text-label-md text-primary hover:bg-primary-container py-2 px-3 rounded transition-colors flex items-center gap-xs cursor-pointer">
                          Guidelines <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                        {grant.status === 'Open' && (
                          <button className="bg-[#b58500] text-on-primary font-label-md text-label-md py-2 px-4 rounded hover:bg-secondary transition-colors font-bold shadow-sm cursor-pointer whitespace-nowrap">
                            Check Eligibility
                          </button>
                        )}
                      </div>
                    </article>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
