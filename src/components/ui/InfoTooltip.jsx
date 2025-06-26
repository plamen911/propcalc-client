import React, { useState, useEffect } from 'react';
import { Tooltip, ClickAwayListener, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled tooltip to handle large content and be mobile-friendly
const LargeTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .MuiTooltip-tooltip`]: {
    backgroundColor: 'white',
    color: '#222',
    maxWidth: 800,
    fontSize: '15px',
    lineHeight: 1.7,
    padding: '16px 20px',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    overflow: 'auto',
    maxHeight: '80vh',
    width: 'auto',
    zIndex: 1600, // Higher z-index to ensure it appears above navigation
    [theme.breakpoints.up('lg')]: {
      maxWidth: '60vw',
    },
    [theme.breakpoints.down('lg')]: {
      maxWidth: '70vw',
    },
    [theme.breakpoints.down('md')]: {
      maxWidth: '80vw',
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: '90vw',
      fontSize: '14px',
      padding: '12px 16px',
    },
  },
  [`& .MuiTooltip-arrow`]: {
    color: 'white',
  },
}));

const InfoTooltip = ({ title, content, icon }) => {
  const [open, setOpen] = useState(false);
  // Use both media query and touch detection for better mobile detection
  const isMobileBySize = useMediaQuery('(max-width:600px)');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect touch devices
  useEffect(() => {
    const detectTouch = () => {
      setIsTouchDevice(true);
    };

    // Check if device supports touch
    const hasTouchSupport = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           navigator.msMaxTouchPoints > 0;

    setIsTouchDevice(hasTouchSupport);

    // Add listener for touch start to detect touch during interaction
    window.addEventListener('touchstart', detectTouch, { once: true });

    return () => {
      window.removeEventListener('touchstart', detectTouch);
    };
  }, []);

  // Determine if we should use mobile UI
  useEffect(() => {
    setIsMobile(isMobileBySize || isTouchDevice);
  }, [isMobileBySize, isTouchDevice]);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  // For mobile, we'll use a different behavior to ensure better usability
  if (isMobile) {
    return (
      <ClickAwayListener onClickAway={handleTooltipClose}>
        <div>
          <div 
            onClick={handleTooltipOpen} 
            onTouchStart={(e) => {
              // Prevent default to avoid any browser-specific touch behaviors
              e.preventDefault();
              handleTooltipOpen();
            }}
            style={{ cursor: 'pointer', display: 'inline-block' }}
            role="button"
            tabIndex={0}
            aria-label="Open information"
          >
            {icon}
          </div>
          {open && (
            <div 
              style={{
                position: 'fixed',
                top: 'calc(50% - 40vh)', // Position to ensure visibility within viewport
                left: '50%',
                transform: 'translate(-50%, 0)',
                zIndex: 1600, // Higher z-index to ensure it appears above navigation
                backgroundColor: 'white',
                color: '#222',
                padding: '16px 20px',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                width: '90vw',
                maxWidth: '90vw',
                maxHeight: '80vh',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                margin: '0 auto',
                touchAction: 'manipulation' // Better touch handling
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600, 
                fontSize: '18px', 
                marginBottom: '8px',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '8px'
              }}>
                <span>{title}</span>
                <button
                  onClick={handleTooltipClose}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleTooltipClose();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    lineHeight: 1,
                    padding: '0 0 0 16px',
                    color: '#888'
                  }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div 
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                  wordBreak: 'break-word',
                  overflow: 'auto',
                  flexGrow: 1,
                  WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
                }}
              />
            </div>
          )}
        </div>
      </ClickAwayListener>
    );
  }

  // For desktop, we'll use the tooltip
  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <div>
        <LargeTooltip
          PopperProps={{
            // Removed disablePortal to allow rendering at root level
            modifiers: [
              {
                name: 'preventOverflow',
                options: {
                  boundary: 'clippingParents',
                  altAxis: true,
                  padding: 16
                },
              },
              {
                name: 'offset',
                options: {
                  offset: [0, 10], // Adds some distance from the trigger element
                },
              },
            ],
          }}
          onClose={handleTooltipClose}
          open={open}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              maxHeight: 'calc(80vh - 40px)'
            }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '16px', 
                marginBottom: '8px',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '8px'
              }}>
                {title}
              </div>
              <div 
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.7',
                  wordBreak: 'break-word',
                  overflow: 'auto',
                  flexGrow: 1
                }}
              />
            </div>
          }
          arrow
          placement="auto"
        >
          <div 
            onClick={handleTooltipOpen}
            onTouchStart={(e) => {
              // Prevent default to avoid any browser-specific touch behaviors
              e.preventDefault();
              handleTooltipOpen();
            }}
            style={{ cursor: 'pointer', display: 'inline-block' }}
            role="button"
            tabIndex={0}
            aria-label="Open information"
          >
            {icon}
          </div>
        </LargeTooltip>
      </div>
    </ClickAwayListener>
  );
};

export default InfoTooltip;
