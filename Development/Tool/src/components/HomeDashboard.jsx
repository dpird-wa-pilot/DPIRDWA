import React from 'react'
import { Link } from 'react-router-dom'
import { Target, Map, BookOpen, Coins } from 'lucide-react'

export default function HomeDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Welcome to the Small Business Digital Advisory</h1>
        <p className="page-subtitle">
          Empowering WA's primary industries to thrive in the digital economy. Find tailored tools, read industry plans, and discover funding to support your business.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="dashboard-card-icon">
            <Target size={24} />
          </div>
          <h3>Go Digital Advisor</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Take a short self-assessment to identify your business challenges and get tailored digital solution recommendations.
          </p>
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <Link to="/advisor" className="btn btn-primary">Start Assessment</Link>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-icon">
            <Map size={24} />
          </div>
          <h3>Industry Digital Plans</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Explore step-by-step roadmaps on the technologies you should adopt at every stage of your business growth.
          </p>
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <Link to="/idp" className="btn btn-secondary">View Roadmaps</Link>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-icon">
            <BookOpen size={24} />
          </div>
          <h3>Solutions Directory</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Browse a marketplace of pre-approved digital tools and service providers, such as Carbon Farming consultants.
          </p>
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <Link to="/directory" className="btn btn-secondary">Explore Solutions</Link>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="dashboard-card-icon">
            <Coins size={24} />
          </div>
          <h3>Grants & Funding</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Find available DPIRD grants to subsidize the cost of your digital transformation journey.
          </p>
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <Link to="/grants" className="btn btn-secondary">Find Grants</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
