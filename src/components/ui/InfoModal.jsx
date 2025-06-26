import React, { useState, cloneElement } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const InfoModal = ({ title, content, icon, maxWidth = 'sm' }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Check if icon is an element that accepts onClick prop
  const iconElement = icon && React.isValidElement(icon) 
    ? cloneElement(icon, { onClick: handleOpen }) 
    : <div onClick={handleOpen} style={{ cursor: 'pointer', display: 'inline-block', touchAction: 'manipulation' }}>{icon}</div>;

  return (
    <>
      {iconElement}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '14px',
            backgroundColor: '#fff',
            color: '#222',
            margin: '16px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }
        }}
      >
        <DialogTitle 
          style={{ 
            padding: '20px 24px 0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '8px',
            background: 'white',
            color: '#1a1a1a',
            fontWeight: 700
          }}
        >
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            color: '#1a1a1a'
          }}>
            {title}
          </span>
          <IconButton
            onClick={handleClose}
            style={{ 
              color: '#888',
              padding: '4px',
              marginLeft: '8px',
              flexShrink: 0
            }}
            size="small"
            aria-label="Затвори"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent 
          style={{ 
            padding: '16px 24px 24px 24px',
            fontSize: '15px',
            lineHeight: '1.7',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 80px)',
            background: 'white',
            color: '#222'
          }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: content }}
            style={{
              color: '#222',
              wordBreak: 'break-word',
              fontSize: '15px',
              lineHeight: '1.7'
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InfoModal; 
