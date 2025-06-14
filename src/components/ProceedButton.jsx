import React from 'react';
import ArrowForward from '@mui/icons-material/ArrowForward';

/**
 * Reusable proceed button component
 * @param {Object} props - Component props
 * @param {Function} [props.onClick] - Function to call when the button is clicked (for type="button")
 * @param {string} [props.className] - Additional CSS classes to apply to the button
 * @param {string} [props.type="button"] - Button type (button or submit)
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @param {string} [props.text="ПРОДЪЛЖИ"] - Button text
 * @param {boolean} [props.showIcon=true] - Whether to show the arrow icon
 * @param {string} [props.iconPosition="right"] - Position of the icon (left or right)
 * @param {React.ReactNode} [props.children] - Children elements to render inside the button
 * @returns {JSX.Element} - Rendered component
 */
const ProceedButton = ({ 
  onClick, 
  className = '', 
  type = 'button', 
  disabled = false, 
  text = 'ПРОДЪЛЖИ', 
  showIcon = true,
  iconPosition = 'right',
  children
}) => {
  const baseClasses = "inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 border border-transparent shadow-sm text-base sm:text-base font-medium rounded-full text-white bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105 min-h-[56px] sm:min-h-0 touch-manipulation";
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const combinedClasses = `${baseClasses} ${disabledClasses} ${className}`;

  const renderContent = () => {
    if (children) {
      return children;
    }
    
    if (showIcon) {
      if (iconPosition === 'right') {
        return (
          <>
            {text} <ArrowForward className="ml-2 sm:ml-1.5" fontSize="small" />
          </>
        );
      } else {
        return (
          <>
            <ArrowForward className="mr-2 sm:mr-1.5" fontSize="small" /> {text}
          </>
        );
      }
    }
    
    return text;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
    >
      {renderContent()}
    </button>
  );
};

export default ProceedButton;