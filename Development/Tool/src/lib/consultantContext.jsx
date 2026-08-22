// [CC-005] Consultant Auth Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const ConsultantContext = createContext();

export function ConsultantProvider({ children }) {
  const [currentConsultant, setCurrentConsultant] = useState(null);
  const [consultantMode, setConsultantMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setLoading(false);
          return;
        }

        const { data: consultant, error: dbError } = await supabase
          .from('consultants')
          .select('id, name, role, region')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

        if (consultant && !dbError) {
          setConsultantMode(true);
          setCurrentConsultant(consultant);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentConsultant(null);
          setConsultantMode(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <ConsultantContext.Provider
      value={{
        currentConsultant,
        setCurrentConsultant,
        consultantMode,
        setConsultantMode,
        loading
      }}
    >
      {children}
    </ConsultantContext.Provider>
  );
}

export const useConsultant = () => useContext(ConsultantContext);
