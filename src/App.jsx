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

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/providers" element={<Providers />} />
      </Routes>
      <Chatbot />
      <Footer />
    </>
  )
}

export default App
