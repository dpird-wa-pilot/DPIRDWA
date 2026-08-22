import React from 'react'
import { ExternalLink, DollarSign, Calendar, FileText } from 'lucide-react'

const GRANTS = [
  {
    id: 'g1',
    title: 'Value Add Agribusiness Investment Grants',
    description: 'Funding to support agriculture and food and beverage businesses to invest in new manufacturing capabilities and technology.',
    amount: 'Up to $250,000',
    deadline: 'Closes 30 Nov 2026',
    status: 'Open'
  },
  {
    id: 'g2',
    title: 'Carbon Farming and Land Restoration Program',
    description: 'Financial assistance for farmers to plan and implement carbon farming projects, including digital monitoring tools.',
    amount: 'Varies',
    deadline: 'Rolling',
    status: 'Open'
  },
  {
    id: 'g3',
    title: 'Digital Transformation Subsidy (Pilot)',
    description: 'Co-funding for small businesses in primary industries to adopt pre-approved digital solutions from the Solutions Directory.',
    amount: 'Up to $10,000',
    deadline: 'Closes 15 Dec 2026',
    status: 'Open'
  }
]

export default function GrantsSection() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Grants & Support</h1>
        <p className="page-subtitle">
          Find funding opportunities to accelerate your digital adoption and business growth. Apply online via SmartyGrants.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        {GRANTS.map(grant => (
          <div key={grant.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>{grant.title}</h2>
              <span style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '9999px', fontWeight: 600 }}>
                {grant.status}
              </span>
            </div>
            
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>
              {grant.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <DollarSign size={18} />
                <span><strong>Funding:</strong> {grant.amount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Calendar size={18} />
                <span><strong>Deadline:</strong> {grant.deadline}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary">
                <FileText size={18} /> Guidelines
              </button>
              <a href="https://dpird.smartygrants.com.au" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginLeft: 'auto' }}>
                Apply via SmartyGrants <ExternalLink size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
