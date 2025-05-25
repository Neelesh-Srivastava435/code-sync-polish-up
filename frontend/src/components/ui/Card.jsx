
import React from 'react';

const Card = ({ children, className = '', padding = 'medium', shadow = 'medium', hover = false }) => {
  const paddingClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };
  
  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300' : '';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${shadowClasses[shadow]} ${paddingClasses[padding]} ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
