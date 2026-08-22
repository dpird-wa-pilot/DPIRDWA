import React, { useState } from 'react'
import { Search, ExternalLink, Filter } from 'lucide-react'

const SOLUTIONS = [
  { id: 1, name: 'AgriTrack Farm Management', category: 'Farm Management', provider: 'AgriTech WA', approved: true },
  { id: 2, name: 'CarbonSense Auditing', category: 'Carbon Farming', provider: 'EcoAudit Ltd', approved: true },
  { id: 3, name: 'FreshSupply Blockchain', category: 'Supply Chain', provider: 'FreshSupply Co', approved: true },
  { id: 4, name: 'Livestock IoT Collars', category: 'IoT Sensors', provider: 'SmartHerd', approved: true },
  { id: 5, name: 'Shopify Setup Package', category: 'E-commerce', provider: 'Digital WA Agency', approved: true }
]

export default function SolutionsDirectory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', ...new Set(SOLUTIONS.map(s => s.category))]

  const filteredSolutions = SOLUTIONS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.provider.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Solutions Directory</h1>
        <p className="page-subtitle">
          Discover pre-approved digital solutions and service providers tailored for WA primary industries.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search solutions or providers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} color="var(--text-secondary)" />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '1rem', backgroundColor: 'white' }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredSolutions.map(sol => (
          <div key={sol.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{sol.name}</h3>
              {sol.approved && (
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontWeight: 600 }}>
                  Pre-Approved
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <strong>Provider:</strong> {sol.provider}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              <strong>Category:</strong> {sol.category}
            </p>
            
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}>View Details</button>
              <button className="btn btn-primary" style={{ padding: '0.5rem' }} title="Visit Website">
                <ExternalLink size={20} />
              </button>
            </div>
          </div>
        ))}
        {filteredSolutions.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No solutions found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
