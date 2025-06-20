import React from 'react';

/**
 * ErrorIcon component displays a red exclamation mark icon for form validation errors
 * 
 * @param {Object} props - Component props
 * @param {string} [props.paddingRight='pr-3'] - Tailwind CSS padding-right class
 * @param {string} [props.className] - Optional className to override default positioning
 * @returns {JSX.Element} Error icon component
 */
const ErrorIcon = ({ paddingRight = 'pr-3', className }) => {
  const defaultClassName = `absolute top-1/2 transform -translate-y-1/2 right-0 ${paddingRight} flex items-center pointer-events-none`;

  return (
    <div className={className || defaultClassName}>
      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default ErrorIcon;
