import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="absolute top-[120px] left-6 md:left-[80px] z-50 flex items-center justify-center w-[40px] h-[40px] bg-transparent border-none text-[#1F2937] hover:text-[var(--g1)] active:scale-95 transition-all duration-200 cursor-pointer"
      aria-label="Go back"
    >
      <i className="fa-solid fa-arrow-left text-[20px]"></i>
    </button>
  );
};
