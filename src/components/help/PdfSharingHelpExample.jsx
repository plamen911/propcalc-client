import React, { useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PdfSharingHelp from './PdfSharingHelp';

/**
 * Example component showing how to integrate the PdfSharingHelp dialog
 * This can be used as a reference for adding the help functionality to the TariffPreviewForm
 */
const PdfSharingHelpExample = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  const handleOpenHelp = () => {
    setHelpOpen(true);
  };

  const handleCloseHelp = () => {
    setHelpOpen(false);
  };

  return (
    <>
      <Tooltip title="Помощ за споделяне на PDF">
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<HelpOutlineIcon />}
          onClick={handleOpenHelp}
          sx={{ ml: 1 }}
        >
          Помощ
        </Button>
      </Tooltip>
      
      <PdfSharingHelp open={helpOpen} onClose={handleCloseHelp} />
    </>
  );
};

export default PdfSharingHelpExample;