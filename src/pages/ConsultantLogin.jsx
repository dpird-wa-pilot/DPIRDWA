// [CC-005] Consultant login form
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useConsultant } from '../lib/consultantContext';

export default function ConsultantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { currentConsultant, setCurrentConsultant, setConsultantMode } = useConsultant();

  // [BUG-006] Redirect if already authenticated
  useEffect(() => {
    if (currentConsultant) {
      navigate('/consultant/dashboard', { replace: true });
    }
  }, [currentConsultant, navigate]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    const { data: consultant, error: profileError } = await supabase
      .from('consultants')
      .select('id, name, role, region')
      .eq('auth_user_id', data.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (profileError || !consultant) {
      await supabase.auth.signOut();
      setError('Consultant profile not found or inactive.');
      setIsSubmitting(false);
      return;
    }

    setConsultantMode(true);
    setCurrentConsultant(consultant);
    navigate('/consultant/dashboard');
  };

  // [BUG-007] Forgot Password Flow
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset instructions have been sent to your email.');
    }
    setIsSubmitting(false);
  };


  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container rounded-2xl shadow-sm border border-outline-variant p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Consultant Portal</h1>
          <p className="text-on-surface-variant mt-2">Sign in to access analytics and sessions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm border border-error/20 flex gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg text-sm border border-green-200 flex gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {message}
          </div>
        )}


        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full h-12 bg-surface border border-outline rounded-lg px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. s.mitchell@dpird.wa.gov.au"
              disabled={isSubmitting}
            />
          </div>

            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-on-surface">Password</label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              className="w-full h-12 bg-surface border border-outline rounded-lg px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-primary text-on-primary rounded-full font-medium hover:bg-primary-hover active:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
            {!isSubmitting && <span className="material-symbols-outlined text-[20px]">login</span>}
          </button>
        </form>
      </div>
    </main>
  );
}
