import React from 'react';
import './Card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
  borderGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glass = false,
  borderGlow = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`card ${hoverEffect ? 'card-hover' : ''} ${glass ? 'card-glass' : ''} ${
        borderGlow ? 'card-glow' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
