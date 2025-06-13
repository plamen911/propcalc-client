import React from 'react';

/**
 * A reusable component for displaying error messages
 * 
 * @param {Object} props
 * @param {string|string[]} props.error - Error message or array of error messages
 * @param {boolean} props.centered - Whether to center the error display
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showRefreshButton - Whether to show a refresh button
 * @param {string} props.title - Optional title for the error message list
 * @param {string} props.iconSize - Size of the error icon ('small', 'medium', 'large')
 * @returns {JSX.Element}
 */
const ErrorDisplay = ({ 
  error, 
  centered = false, 
  className = '', 
  showRefreshButton = false,
  title = '',
  iconSize = 'small'
}) => {
  if (!error) return null;
  
  // Determine if error is a single message or an array of messages
  const isErrorArray = Array.isArray(error);
  
  // Determine icon size classes
  let iconClasses = 'text-red-300 flex-shrink-0';
  switch (iconSize) {
    case 'large':
      iconClasses += ' w-12 h-12 mx-auto mb-3';
      break;
    case 'medium':
      iconClasses += ' w-6 h-6 mr-3';
      break;
    default: // small
      iconClasses += ' w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3';
  }
  
  // Container classes
  const containerClasses = centered 
    ? `flex justify-center items-center ${className}` 
    : className;
  
  // Inner container classes
  const innerContainerClasses = centered && iconSize === 'large'
    ? 'bg-red-900/20 border border-red-300/30 rounded-lg p-4 max-w-md text-center'
    : 'bg-red-900/20 border border-red-300/30 rounded-lg p-3 sm:p-4 max-w-full';
  
  return (
    <div className={containerClasses}>
      <div className={innerContainerClasses}>
        {isErrorArray ? (
          <>
            <div className="flex items-center mb-2">
              <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm sm:text-base text-red-300 font-medium">{title || 'Моля, коригирайте следните грешки:'}</span>
            </div>
            <ul className="list-disc pl-10 space-y-1">
              {error.map((errorItem, index) => (
                <li key={index} className="text-sm sm:text-base text-red-300">{errorItem}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex items-center">
            <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-sm sm:text-base text-red-300">{error}</span>
          </div>
        )}
        
        {showRefreshButton && (
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 mt-4 bg-white text-[#8b2131] rounded-full hover:bg-gray-100 transition-colors"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;