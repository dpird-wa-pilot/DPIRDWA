# BUG-014: ProtectedRoute Component Not Implemented

**Date Reported:** August 21, 2026  
**Severity:** 🟡 HIGH  
**Status:** OPEN (Ready for Implementation)  
**Component:** Consultant Mode → Route Protection  
**Spec Reference:** CC-005 §3.4  

---

## Summary

The ProtectedRoute component which guards consultant-only routes (dashboard, session detail) has **not been implemented**. This component is essential for securing the consultant dashboard from unauthorized access.

---

## What Needs to Be Implemented

### 1. File to Create
- **Path:** `src/components/ProtectedRoute.jsx`
- **Type:** React wrapper component
- **Export:** Named export `ProtectedRoute`

### 2. Component Purpose

The ProtectedRoute component is a wrapper that:
1. Checks if user is authenticated (via ConsultantContext)
2. If not authenticated → redirects to `/login`
3. If loading → shows loading spinner
4. If authenticated → renders the protected page

**Usage in App.jsx:**
```jsx
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
```

### 3. Component Interface

```jsx
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useConsultant } from '../lib/consultantContext'

export function ProtectedRoute({ children }) {
  const { currentConsultant, loading } = useConsultant()
  
  // Logic:
  // 1. If loading → show spinner
  // 2. If not authenticated → redirect to /login
  // 3. If authenticated → show children
}
```

### 4. Implementation Logic

**Step 1: Get auth state from context**
```javascript
const { currentConsultant, loading } = useConsultant()
```

**Step 2: Handle loading state**
```javascript
if (loading) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      {/* Loading spinner */}
    </div>
  )
}
```

**Step 3: Handle unauthenticated**
```javascript
if (!currentConsultant) {
  return <Navigate to="/login" replace />
}
```

**Step 4: Render protected content**
```javascript
return children
```

### 5. Loading Spinner UI

**Requirements:**
- Center spinner on screen
- Show "Verifying credentials..." text
- Use theme colors
- Full screen height

**HTML/Tailwind:**
```jsx
<div className="flex h-screen w-full items-center justify-center bg-surface">
  <div className="flex flex-col items-center gap-4">
    {/* Spinner animation */}
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    {/* Text */}
    <p className="text-on-surface-variant font-medium">Verifying credentials...</p>
  </div>
</div>
```

### 6. Code Template

```jsx
// [CC-005] ProtectedRoute — redirect to /login if not authenticated
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useConsultant } from '../lib/consultantContext'

export function ProtectedRoute({ children }) {
  const { currentConsultant, loading } = useConsultant()
  
  // While auth is being verified
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-on-surface-variant font-medium">Verifying credentials...</p>
        </div>
      </div>
    )
  }
  
  // Not authenticated, redirect to login
  if (!currentConsultant) {
    return <Navigate to="/login" replace />
  }
  
  // Authenticated, render protected page
  return children
}
```

### 7. Integration Points

**In App.jsx:**
```jsx
import { ProtectedRoute } from './components/ProtectedRoute'
import ConsultantDashboard from './pages/ConsultantDashboard'
import SessionDetail from './pages/SessionDetail'

function App() {
  return (
    <ConsultantProvider>
      <Routes>
        <Route path="/login" element={<ConsultantLogin />} />
        
        {/* Protected routes */}
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
    </ConsultantProvider>
  )
}
```

### 8. Behavior Specifications

**State: Loading**
- Condition: `loading === true`
- Visual: Full-screen spinner with text
- Action: Wait for auth check to complete

**State: Not Authenticated**
- Condition: `loading === false && !currentConsultant`
- Visual: Redirect to `/login`
- Action: Use React Router's `<Navigate>` component
- Behavior: `replace={true}` so back button doesn't loop

**State: Authenticated**
- Condition: `loading === false && currentConsultant`
- Visual: Render children (protected page)
- Action: Show ConsultantDashboard or SessionDetail

---

**Status:** Ready for Implementation  
**Estimated Effort:** 1-2 hours  
**Complexity:** Low  
**Priority:** P1 (security critical)  
**Dependencies:** None (ConsultantContext already exists)  
