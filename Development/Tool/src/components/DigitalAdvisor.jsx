// [DEPRECATED CC-004] This component is deprecated. Use the new Advisor wizard in pages/Advisor.jsx instead.
import React, { useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronRight, Check } from 'lucide-react'

const INDUSTRIES = ['Plant and Crop Farming', 'Livestock Farming', 'Aquaculture', 'Food and Beverage']

const CHALLENGES = [
  'Tracking farm yield and inventory',
  'Managing supply chain and logistics',
  'Compliance and reporting (e.g., Carbon emissions)',
  'Finding new buyers / E-commerce',
  'Automating manual farm operations'
]

export default function DigitalAdvisor() {
  const [step, setStep] = useState(1)
  const [industry, setIndustry] = useState('')
  const [selectedChallenges, setSelectedChallenges] = useState([])

  const toggleChallenge = (c) => {
    setSelectedChallenges(prev => 
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <h2>Step 1: Tell us about your business</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Select your primary industry sector to get tailored advice.</p>
      
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        {INDUSTRIES.map(ind => (
          <div 
            key={ind} 
            className={`card ${industry === ind ? 'selected' : ''}`}
            style={{ 
              cursor: 'pointer', 
              borderColor: industry === ind ? 'var(--primary-color)' : 'var(--border-color)',
              backgroundColor: industry === ind ? '#f0fdfa' : 'var(--surface-color)'
            }}
            onClick={() => setIndustry(ind)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>{ind}</span>
              {industry === ind && <CheckCircle2 color="var(--primary-color)" size={20} />}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-primary" 
          disabled={!industry}
          onClick={() => setStep(2)}
        >
          Next Step <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="animate-fade-in">
      <h2>Step 2: Identify your challenges</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>What are the biggest operational challenges you face today?</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {CHALLENGES.map(c => (
          <label 
            key={c}
            className="card"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              cursor: 'pointer',
              padding: '1rem',
              borderColor: selectedChallenges.includes(c) ? 'var(--primary-color)' : 'var(--border-color)',
              backgroundColor: selectedChallenges.includes(c) ? '#f0fdfa' : 'var(--surface-color)'
            }}
          >
            <div style={{ 
              width: '24px', height: '24px', borderRadius: '4px', 
              border: `2px solid ${selectedChallenges.includes(c) ? 'var(--primary-color)' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: selectedChallenges.includes(c) ? 'var(--primary-color)' : 'transparent'
            }}>
              {selectedChallenges.includes(c) && <Check color="white" size={16} />}
            </div>
            <span style={{ fontWeight: 500 }}>{c}</span>
          </label>
        ))}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
        <button 
          className="btn btn-primary" 
          disabled={selectedChallenges.length === 0}
          onClick={() => setStep(3)}
        >
          Get Recommendations <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', backgroundColor: '#f0fdfa', color: 'var(--primary-color)', marginBottom: '1rem' }}>
          <CheckCircle2 size={48} />
        </div>
        <h2>Your Digital Recommendations</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Based on your profile as a <strong>{industry}</strong> business.</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Recommended Solutions</h3>
          <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Cloud-based Farm Management System (FMS)</li>
            <li>IoT Sensors for Soil & Moisture tracking</li>
            <li>Digital Carbon Auditing Tools</li>
          </ul>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Eligible Grants</h3>
          <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>Digital Transformation Grant (Up to $10,000)</li>
            <li>Carbon Farming Tech Subsidy</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => { setStep(1); setIndustry(''); setSelectedChallenges([]); }}>Start Over</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Digital Advisor</h1>
        <p className="page-subtitle">Find the right digital tools for your business in just a few clicks.</p>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
        {[1, 2, 3].map(num => (
          <React.Fragment key={num}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              backgroundColor: step >= num ? 'var(--primary-color)' : 'var(--border-color)',
              color: step >= num ? 'white' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              {num}
            </div>
            {num < 3 && <div style={{ width: '40px', height: '4px', backgroundColor: step > num ? 'var(--primary-color)' : 'var(--border-color)', borderRadius: '2px' }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  )
}
