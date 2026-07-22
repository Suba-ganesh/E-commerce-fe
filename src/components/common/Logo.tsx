import React from 'react';
import logoImg from '../../assets/logo.png';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className, style, onClick }) => {
  return (
    <img 
      src={logoImg} 
      alt="Chenni's Logo" 
      className={className}
      style={style}
      onClick={onClick}
    />
  );
};
