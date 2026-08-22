// [CC-005] ProtectedRoute — redirect to /login if not authenticated
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useConsultant } from '../lib/consultantContext';

export function ProtectedRoute({ children }) {
  const { currentConsultant, loading } = useConsultant();
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-on-surface-variant font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }
  
  if (!currentConsultant) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
