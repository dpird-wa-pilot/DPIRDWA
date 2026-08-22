import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const BUSINESS_STRUCTURES = [
  { value: 'sole_trader', label: 'Sole Trader' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'company', label: 'Company' },
  { value: 'trust', label: 'Trust' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'nfp', label: 'Not for Profit (NFP)' },
];

const TURNOVER_RANGES = [
  { value: 'under_250k', label: 'Under $250,000' },
  { value: '250k_500k', label: '$250,000 - $500,000' },
  { value: '500k_1m', label: '$500,000 - $1,000,000' },
  { value: '1m_5m', label: '$1,000,000 - $5,000,000' },
  { value: '5m_10m', label: '$5,000,000 - $10,000,000' },
  { value: '10m_50m', label: '$10,000,000 - $50,000,000' },
  { value: 'over_50m', label: 'Over $50,000,000' },
];

export default function EmailSubmissionModal({ sessionId, recommendations, onSuccess, onError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    abn: '',
    businessStructure: '',
    annualTurnoverRange: '',
    contactName: '',
    contactEmail: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleOpen = () => setIsOpen(true);
  
  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      businessName: '',
      abn: '',
      businessStructure: '',
      annualTurnoverRange: '',
      contactName: '',
      contactEmail: ''
    });
    setErrors({});
    setSuccessMessage('');
    setGeneralError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setGeneralError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    
    const abnClean = formData.abn.replace(/\s+/g, '');
    if (!/^[0-9]{11}$/.test(abnClean)) newErrors.abn = 'ABN must be exactly 11 digits';
    
    if (!formData.businessStructure) newErrors.businessStructure = 'Business structure is required';
    if (!formData.annualTurnoverRange) newErrors.annualTurnoverRange = 'Annual turnover range is required';
    if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) newErrors.contactEmail = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError('');

    try {
      const summary = {
        totalItems: recommendations?.length || 0,
        items: recommendations?.map(r => r.title || r.name).filter(Boolean) || []
      };

      const { error } = await supabase
        .from('diagnostic_sessions')
        .update({
          business_name: formData.businessName.trim(),
          abn: formData.abn.replace(/\s+/g, ''),
          business_structure: formData.businessStructure,
          annual_turnover_range: formData.annualTurnoverRange,
          contact_name: formData.contactName.trim(),
          contact_email: formData.contactEmail.trim(),
          recommendations_count: recommendations?.length || 0,
          recommendations_summary: summary,
          recommendations_shared_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSuccessMessage('✅ Your recommendations have been sent successfully!');
      
      if (onSuccess) onSuccess(formData);

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Error saving recommendations:', err);
      setGeneralError('Failed to save your recommendations. Please try again.');
      if (onError) onError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-40 flex items-center justify-center w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)] hover:bg-primary-container hover:scale-110 transition-transform duration-200"
        title="Send Recommendations"
      >
        <span className="material-symbols-outlined text-2xl">mail</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          {/* Modal Container */}
          <div className="bg-surface w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex flex-col">
            
            {/* Header */}
            <div className="sticky top-0 bg-primary text-on-primary px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">send</span>
                <h2 className="text-xl font-bold">Send Recommendations</h2>
              </div>
              <button 
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-on-primary/80 hover:text-on-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {successMessage ? (
                <div className="bg-green-50 text-green-800 p-4 rounded-xl text-center font-medium border border-green-200">
                  {successMessage}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-on-surface-variant text-sm mb-6">
                    Please provide your details below to send your personalized diagnostic recommendations. 
                    This will allow a DPIRD advisor to follow up with you.
                  </p>

                  {generalError && (
                    <div className="bg-error-container text-on-error-container p-3 rounded-xl text-sm font-medium">
                      {generalError}
                    </div>
                  )}

                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      Business Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      placeholder="e.g. ABC Manufacturing Pty Ltd"
                      disabled={isSubmitting}
                    />
                    {errors.businessName && <p className="text-error text-xs mt-1">{errors.businessName}</p>}
                  </div>

                  {/* ABN */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      ABN (11 digits) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="abn"
                      value={formData.abn}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      placeholder="e.g. 12 345 678 901"
                      disabled={isSubmitting}
                    />
                    {errors.abn && <p className="text-error text-xs mt-1">{errors.abn}</p>}
                  </div>

                  {/* Business Structure */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      Business Structure <span className="text-error">*</span>
                    </label>
                    <select
                      name="businessStructure"
                      value={formData.businessStructure}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white"
                      disabled={isSubmitting}
                    >
                      <option value="">Select a structure...</option>
                      {BUSINESS_STRUCTURES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.businessStructure && <p className="text-error text-xs mt-1">{errors.businessStructure}</p>}
                  </div>

                  {/* Annual Turnover Range */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      Annual Turnover <span className="text-error">*</span>
                    </label>
                    <select
                      name="annualTurnoverRange"
                      value={formData.annualTurnoverRange}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white"
                      disabled={isSubmitting}
                    >
                      <option value="">Select turnover range...</option>
                      {TURNOVER_RANGES.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.annualTurnoverRange && <p className="text-error text-xs mt-1">{errors.annualTurnoverRange}</p>}
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      Contact Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      placeholder="e.g. Jane Doe"
                      disabled={isSubmitting}
                    />
                    {errors.contactName && <p className="text-error text-xs mt-1">{errors.contactName}</p>}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-semibold text-on-surface mb-1">
                      Contact Email <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      placeholder="e.g. jane@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.contactEmail && <p className="text-error text-xs mt-1">{errors.contactEmail}</p>}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-bold border border-outline text-on-surface hover:bg-surface-variant transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary-hover transition-colors flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
