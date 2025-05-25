
import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 shadow-lg`}></div>
      {message && (
        <p className="mt-4 text-sm text-gray-600 font-medium animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
