import React from 'react';

/**
 * CheckIcon component displays a checkmark icon
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Optional className for styling
 * @returns {JSX.Element} Checkmark icon component
 * 
 * @example
 * // Basic usage
 * import CheckIcon from '../components/ui/CheckIcon';
 * 
 * function MyComponent() {
 *   return <CheckIcon />;
 * }
 * 
 * @example
 * // With custom styling
 * import CheckIcon from '../components/ui/CheckIcon';
 * 
 * function MyComponent() {
 *   return <CheckIcon className="h-8 w-8 text-green-500" />;
 * }
 */
const CheckIcon = ({ className }) => {
  return (
    <svg 
      className={className || "h-5 w-5"} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path 
        fillRule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  );
};

export default CheckIcon;