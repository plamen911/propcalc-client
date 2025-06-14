import React from 'react';
import ArrowBack from '@mui/icons-material/ArrowBack';

/**
 * Reusable back button component
 * @param {Object} props - Component props
 * @param {Function} props.onClick - Function to call when the button is clicked
 * @param {string} [props.className] - Additional CSS classes to apply to the button
 * @returns {JSX.Element} - Rendered component
 */
const BackButton = ({ onClick, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 border border-white rounded-full text-primary bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 hover:scale-105 text-base sm:text-base min-h-[56px] sm:min-h-0 touch-manipulation ${className}`}
    >
      <ArrowBack className="mr-2 sm:mr-1.5" fontSize="small" /> НАЗАД
    </button>
  );
};

export default BackButton;
