import React, { useState } from 'react'
import { Rocket, TrendingUp, Zap } from 'lucide-react'

const PHASES = [
  {
    id: 'stage1',
    title: 'Stage 1: Getting Ready',
    description: 'Optimize basic operations and digitize manual processes.',
    icon: <Rocket size={24} />,
    color: '#3b82f6',
    solutions: ['Basic Accounting Software', 'Digital Inventory Tracking', 'Social Media Presence']
  },
  {
    id: 'stage2',
    title: 'Stage 2: Growing',
    description: 'Enhance productivity and expand customer reach.',
    icon: <TrendingUp size={24} />,
    color: 'var(--primary-color)',
    solutions: ['E-commerce Platform Integration', 'Farm Management Systems (FMS)', 'CRM Tools']
  },
  {
    id: 'stage3',
    title: 'Stage 3: Advanced',
    description: 'Data-driven decision making and automation.',
    icon: <Zap size={24} />,
    color: 'var(--accent-color)',
    solutions: ['IoT Sensors & Automation', 'Predictive Analytics for Yield', 'Blockchain for Traceability']
  }
]

export default function IndustryDigitalPlans() {
  const [activeSector, setActiveSector] = useState('Agriculture')

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Industry Digital Plans (IDPs)</h1>
        <p className="page-subtitle">
          Step-by-step guides on the digital solutions to adopt at each stage of your business growth.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {['Agriculture', 'Aquaculture', 'Food & Beverage'].map(sector => (
          <button
            key={sector}
            className={`btn ${activeSector === sector ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSector(sector)}
            style={{ borderRadius: '9999px' }}
          >
            {sector}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '3rem 2rem', backgroundColor: '#f8fafc' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Digital Roadmap for {activeSector}</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px', 
                backgroundColor: phase.color 
              }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', color: phase.color }}>
                <div style={{ padding: '0.5rem', backgroundColor: `${phase.color}15`, borderRadius: '8px' }}>
                  {phase.icon}
                </div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{phase.title}</h3>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', minHeight: '45px' }}>
                {phase.description}
              </p>
              
              <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                {phase.solutions.map(sol => (
                  <li key={sol}>{sol}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
