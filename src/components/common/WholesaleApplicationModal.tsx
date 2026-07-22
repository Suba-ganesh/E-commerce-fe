import React, { useState, useEffect } from 'react';
import { wholesaleService } from '../../services/wholesaleService';
import type { WholesaleApplication } from '../../services/wholesaleService';
import { useToast } from '../../context/ToastContext';

interface WholesaleApplicationModalProps {
  onClose: () => void;
}

export const WholesaleApplicationModal: React.FC<WholesaleApplicationModalProps> = ({ onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<WholesaleApplication | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [companyRegistration, setCompanyRegistration] = useState('');
  const [businessType, setBusinessType] = useState('Retailer');
  const [estimatedVolume, setEstimatedVolume] = useState('Less than RM 5,000');
  const [notes, setNotes] = useState('');

  const fetchApplication = async () => {
    try {
      const res = await wholesaleService.getMyApplication();
      if (res.success && res.data) {
        setApplication(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching application status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyRegistration.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await wholesaleService.submitApplication({
        company_name: companyName,
        company_registration: companyRegistration,
        business_type: businessType,
        estimated_volume: estimatedVolume,
        notes,
      });

      if (res.success) {
        toast.success('Wholesale application submitted successfully! Our Admin will review it shortly.');
        fetchApplication();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0B2516]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full text-left shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-border-design animate-scale-up overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border-design flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-g1/10 text-g1 flex items-center justify-center">
              <i className="fa-solid fa-briefcase"></i>
            </div>
            <h3 className="text-[20px] font-black text-g3">Wholesale Application</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted transition-colors cursor-pointer border-none bg-transparent"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-g1/10 border-t-g1 rounded-full animate-spin"></div>
              <span className="text-[13.5px] font-bold text-muted">Checking application status...</span>
            </div>
          ) : application && application.status !== 'REJECTED' ? (
            /* Show Status card if pending or approved */
            <div className="flex flex-col items-center text-center py-8 px-4 gap-5">
              {application.status === 'PENDING' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#FEF9E7] text-[#F39C12] flex items-center justify-center text-3xl shadow-sm">
                    <i className="fa-solid fa-hourglass-half fa-pulse"></i>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[22px] font-black text-g3">Application Under Review</h4>
                    <p className="text-[14.5px] text-muted leading-relaxed">
                      We have received your application for <strong>{application.company_name}</strong> (SSM: {application.company_registration}). Our administrative team is currently reviewing your details.
                    </p>
                  </div>
                  <div className="w-full bg-[#FAFBF7] rounded-xl p-4 border border-border-design text-left text-[13.5px] text-muted">
                    <div className="flex justify-between py-1 border-b border-border-design/50">
                      <span className="font-bold">Business Type:</span>
                      <span>{application.business_type}</span>
                    </div>
                    <div className="flex justify-between py-1 pt-2">
                      <span className="font-bold">Submitted Date:</span>
                      <span>{new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={onClose} className="px-6 py-3 bg-g1 hover:bg-g3 text-white font-bold rounded-xl transition-all border-none cursor-pointer w-full text-[14.5px]">
                    Got it, Close
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#E8F5EC] text-g1 flex items-center justify-center text-3xl shadow-sm">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[22px] font-black text-g3">Welcome Wholesale Partner!</h4>
                    <p className="text-[14.5px] text-muted leading-relaxed">
                      Your business application for <strong>{application.company_name}</strong> has been fully approved. You now have access to our catalog's wholesale discounts and benefits.
                    </p>
                  </div>
                  <button onClick={onClose} className="px-6 py-3 bg-g1 hover:bg-g3 text-white font-bold rounded-xl transition-all border-none cursor-pointer w-full text-[14.5px]">
                    Start Shopping &rarr;
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Show form if no application or rejected */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
              {application && application.status === 'REJECTED' && (
                <div className="bg-[#FDEDEC] text-[#C0392B] p-4 rounded-xl border border-[#FADBD8] text-[13.5px] font-medium leading-relaxed flex items-start gap-2.5">
                  <i className="fa-solid fa-triangle-exclamation text-lg shrink-0 mt-0.5"></i>
                  <div>
                    <strong>Previous Application Rejected:</strong> Your previous wholesale request was declined. Please verify your company credentials and re-submit.
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wider">Company Legal Name <span className="text-[#C0392B]">*</span></label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Chennis Wholesale Sdn Bhd"
                  className="px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[14.5px] w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wider">SSM Registration Number <span className="text-[#C0392B]">*</span></label>
                <input
                  type="text"
                  required
                  value={companyRegistration}
                  onChange={(e) => setCompanyRegistration(e.target.value)}
                  placeholder="e.g. 202601014321"
                  className="px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[14.5px] w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-g3 uppercase tracking-wider">Business Type</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[14.5px] bg-white w-full"
                  >
                    <option value="Retailer">Retailer / Shop</option>
                    <option value="Spa/Hotel">Spa / Premium Hotel</option>
                    <option value="Construction">Construction / Contractor</option>
                    <option value="Distributor">Distributor / Supplier</option>
                    <option value="Cafe/Restaurant">Cafe / Restaurant</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-g3 uppercase tracking-wider">Estimated Volume (Monthly)</label>
                  <select
                    value={estimatedVolume}
                    onChange={(e) => setEstimatedVolume(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[14.5px] bg-white w-full"
                  >
                    <option value="Less than RM 5,000">Less than RM 5,000</option>
                    <option value="RM 5,000 - RM 15,000">RM 5,000 - RM 15,000</option>
                    <option value="RM 15,000 - RM 50,000">RM 15,000 - RM 50,000</option>
                    <option value="More than RM 50,000">More than RM 50,000</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wider">Additional Notes / Inquiry</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share details about your bulk requirements..."
                  className="px-4 py-3 rounded-xl border border-border-design focus:outline-none focus:border-g1 text-[14.5px] w-full resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full h-[54px] bg-g1 hover:bg-g3 text-white font-bold rounded-xl transition-all border-none flex items-center justify-center gap-2 cursor-pointer text-[15px]"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application &rarr;
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
