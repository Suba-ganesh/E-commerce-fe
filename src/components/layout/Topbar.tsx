import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-g3 text-white text-[12px] py-[7px] px-4 md:px-20 flex justify-between items-center flex-wrap gap-2">
      <span className="opacity-85 flex items-center">
        <i className="fa-solid fa-leaf mr-1.5 text-g2"></i>
        Welcome to Chenni's Ecosystem - 100% Certified Organic & Sustainable
      </span>
      <div className="flex items-center gap-5">
        <a href="tel:+60123456789" className="text-white opacity-85 hover:opacity-100 flex items-center">
          <i className="fa-solid fa-phone mr-1.5"></i>+60 12-345 6789
        </a>
        <button 
          onClick={() => navigate('/about')} 
          className="bg-transparent border-none text-white opacity-85 hover:opacity-100 cursor-pointer flex items-center text-[12px]"
        >
          <i className="fa-solid fa-circle-info mr-1.5"></i>About Us
        </button>
        <button 
          onClick={() => navigate('/blog')} 
          className="bg-transparent border-none text-white opacity-85 hover:opacity-100 cursor-pointer flex items-center text-[12px]"
        >
          <i className="fa-solid fa-newspaper mr-1.5"></i>Blog
        </button>
      </div>
    </div>
  );
};

export default Topbar;
