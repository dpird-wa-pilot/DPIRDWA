import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'

import Home from './pages/Home'
import Advisor from './pages/Advisor'
import Resources from './pages/Resources'
import Grants from './pages/Grants'
import Providers from './pages/Providers'
import Chatbot from './components/Chatbot'

// [CC-005] Consultant Auth & Routing
import { ConsultantProvider } from './lib/consultantContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import ConsultantLogin from './pages/ConsultantLogin'
import ConsultantDashboard from './pages/ConsultantDashboard'
import SessionDetail from './pages/SessionDetail'

function App() {
  return (
    <ConsultantProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/providers" element={<Providers />} />
        
        {/* [CC-005] Consultant Routes */}
        <Route path="/login" element={<ConsultantLogin />} />
        <Route path="/consultant/dashboard" element={
          <ProtectedRoute>
            <ConsultantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/consultant/sessions/:sessionId" element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        } />
      </Routes>
      <Chatbot />
      <Footer />
    </ConsultantProvider>
  )
}

export default App
