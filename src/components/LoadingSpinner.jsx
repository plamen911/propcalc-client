import React from 'react';

const LoadingSpinner = ({ message = "Зареждане на данни..." }) => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;