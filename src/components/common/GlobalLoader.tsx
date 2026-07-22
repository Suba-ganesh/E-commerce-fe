import React from 'react';
import { Logo } from './Logo';

export const GlobalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-md z-[9999]">
      <div className="relative flex flex-col items-center">
        {/* Spinner Ring */}
        <div className="w-24 h-24 rounded-full border-4 border-[#0B8F3A]/10 border-t-[#0B8F3A] animate-spin mb-6"></div>
        {/* Pulsing Logo inside Spinner */}
        <div className="absolute top-[28px] animate-pulse">
          <Logo style={{ height: '40px', width: 'auto' }} />
        </div>
        <p className="text-g3 font-extrabold text-[14px] tracking-wide animate-pulse">
          Connecting to Chennis...
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;
