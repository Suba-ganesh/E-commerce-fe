import React, { useState, useEffect } from 'react';

export const CheckoutProcessingModal: React.FC = () => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Progressively update step for high-fidelity visual indication
    const timer1 = setTimeout(() => setStep(2), 1500);
    const timer2 = setTimeout(() => setStep(3), 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0B2516]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-border-design animate-scale-up">
        {/* Animated Green Spinner Ring */}
        <div className="w-16 h-16 border-4 border-[#0B8F3A]/10 border-t-[#0B8F3A] rounded-full animate-spin mx-auto mb-6"></div>
        
        <h3 className="text-[20px] font-black text-g3 mb-2">Processing Your Order</h3>
        <p className="text-[13.5px] text-muted mb-6">Please do not refresh or close this window.</p>
        
        {/* Milestone Steps */}
        <div className="text-left max-w-[210px] mx-auto flex flex-col gap-3.5">
          {/* Step 1: Inventory verification */}
          <div className="flex items-center gap-2.5 text-[13.5px]">
            {step > 1 ? (
              <i className="fa-solid fa-circle-check text-[#0B8F3A] text-[15px]"></i>
            ) : (
              <i className="fa-solid fa-circle-notch fa-spin text-[#0B8F3A] text-[15px]"></i>
            )}
            <span className={`font-semibold ${step >= 1 ? 'text-g3' : 'text-gray-400'}`}>
              Verifying inventory...
            </span>
          </div>

          {/* Step 2: Establish connection */}
          <div className="flex items-center gap-2.5 text-[13.5px]">
            {step > 2 ? (
              <i className="fa-solid fa-circle-check text-[#0B8F3A] text-[15px]"></i>
            ) : step === 2 ? (
              <i className="fa-solid fa-circle-notch fa-spin text-[#0B8F3A] text-[15px]"></i>
            ) : (
              <i className="fa-regular fa-circle text-gray-300 text-[15px]"></i>
            )}
            <span className={`font-semibold ${step >= 2 ? 'text-g3' : 'text-gray-400'}`}>
              Securing connection...
            </span>
          </div>

          {/* Step 3: Finalize transaction */}
          <div className="flex items-center gap-2.5 text-[13.5px]">
            {step === 3 ? (
              <i className="fa-solid fa-circle-notch fa-spin text-[#0B8F3A] text-[15px]"></i>
            ) : (
              <i className="fa-regular fa-circle text-gray-300 text-[15px]"></i>
            )}
            <span className={`font-semibold ${step >= 3 ? 'text-g3' : 'text-gray-400'}`}>
              Finalizing payment...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutProcessingModal;
