import React from 'react';
import './EyeIcon.css';

/**
 * EyeIcon component displays an eye icon that is mobile and touch friendly
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className] - Optional className for styling
 * @param {Function} [props.onClick] - Optional onClick handler
 * @returns {JSX.Element} Eye icon component
 * 
 * @example
 * // Basic usage
 * import EyeIcon from '../components/ui/EyeIcon';
 * 
 * function MyComponent() {
 *   return <EyeIcon />;
 * }
 * 
 * @example
 * // With custom styling
 * import EyeIcon from '../components/ui/EyeIcon';
 * 
 * function MyComponent() {
 *   return <EyeIcon className="h-8 w-8 text-blue-500" />;
 * }
 * 
 * @example
 * // With click handler
 * import EyeIcon from '../components/ui/EyeIcon';
 * 
 * function MyComponent() {
 *   const handleClick = () => {
 *     console.log('Icon clicked');
 *   };
 *   
 *   return <EyeIcon onClick={handleClick} />;
 * }
 */
const EyeIcon = ({ className, onClick }) => {
  // Handle click and touch events
  const handleInteraction = (e) => {
    if (onClick) {
      // For touch events, prevent default to avoid any browser-specific behaviors
      if (e.type === 'touchstart') {
        e.preventDefault();
      }
      onClick(e);
    }
  };

  // Default styles for touch-friendly target size
  const touchFriendlyStyles = {
    minWidth: '44px',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation', // Better touch handling
    cursor: 'pointer'
  };

  return (
    <div 
      style={onClick ? touchFriendlyStyles : undefined}
      onClick={onClick ? handleInteraction : undefined}
      onTouchStart={onClick ? handleInteraction : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? "View details" : undefined}
      className={onClick ? "touch-target" : undefined}
    >
      <svg 
        className={className || "h-6 w-6"} 
        xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink" 
        version="1.1" 
        viewBox="0 0 256 256" 
        xmlSpace="preserve"
      >
        <g 
          style={{ 
            stroke: "none", 
            strokeWidth: 0, 
            strokeDasharray: "none", 
            strokeLinecap: "butt", 
            strokeLinejoin: "miter", 
            strokeMiterlimit: 10, 
            fill: "none", 
            fillRule: "nonzero", 
            opacity: 1 
          }} 
          transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)"
        >
          <path 
            d="M 45 73.264 c -14.869 0 -29.775 -8.864 -44.307 -26.346 c -0.924 -1.112 -0.924 -2.724 0 -3.836 C 15.225 25.601 30.131 16.737 45 16.737 c 14.868 0 29.775 8.864 44.307 26.345 c 0.925 1.112 0.925 2.724 0 3.836 C 74.775 64.399 59.868 73.264 45 73.264 z M 6.934 45 C 19.73 59.776 32.528 67.264 45 67.264 c 12.473 0 25.27 -7.487 38.066 -22.264 C 70.27 30.224 57.473 22.737 45 22.737 C 32.528 22.737 19.73 30.224 6.934 45 z" 
            style={{ 
              stroke: "none", 
              strokeWidth: 1, 
              strokeDasharray: "none", 
              strokeLinecap: "butt", 
              strokeLinejoin: "miter", 
              strokeMiterlimit: 10, 
              fill: "currentColor", 
              fillRule: "nonzero", 
              opacity: 1 
            }} 
            transform=" matrix(1 0 0 1 0 0) " 
            strokeLinecap="round"
          />
          <path 
            d="M 45 62 c -9.374 0 -17 -7.626 -17 -17 s 7.626 -17 17 -17 s 17 7.626 17 17 S 54.374 62 45 62 z M 45 34 c -6.065 0 -11 4.935 -11 11 s 4.935 11 11 11 s 11 -4.935 11 -11 S 51.065 34 45 34 z" 
            style={{ 
              stroke: "none", 
              strokeWidth: 1, 
              strokeDasharray: "none", 
              strokeLinecap: "butt", 
              strokeLinejoin: "miter", 
              strokeMiterlimit: 10, 
              fill: "currentColor", 
              fillRule: "nonzero", 
              opacity: 1 
            }} 
            transform=" matrix(1 0 0 1 0 0) " 
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default EyeIcon;
