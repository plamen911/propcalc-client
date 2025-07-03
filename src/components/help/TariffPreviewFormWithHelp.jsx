import React, { useState } from 'react';
import BackButton from '../ui/BackButton.jsx';
import ProceedButton from '../ui/ProceedButton.jsx';
import TariffPreview from "../ui/TariffPreview.jsx";
import { Typography, Button, Menu, MenuItem, Snackbar, Alert, Tooltip } from "@mui/material";
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PdfSharingHelp from './PdfSharingHelp';

/**
 * Example of TariffPreviewForm with integrated help functionality
 * This shows how to modify the existing TariffPreviewForm to include a help button
 */
const TariffPreviewFormWithHelp = ({
  nextStep,
  prevStep,
  selectedTariff,
  currencySymbol,
  promoCodeValid,
  promoDiscount
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [helpOpen, setHelpOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  const handleShareClick = (event) => {
    // Check if Web Share API is supported
    if (navigator.share) {
      const totalAmount = selectedTariff.statistics ? 
        selectedTariff.statistics.total_premium : 'N/A';

      // Create PDF URL if tariff ID is available
      const pdfUrl = selectedTariff && selectedTariff.id 
        ? `${window.location.origin}/api/pdf/tariff/${selectedTariff.id}` 
        : window.location.href;

      navigator.share({
        title: `Оферта за застраховка: ${selectedTariff.name}`,
        text: `Пакет: ${selectedTariff.name}\nОбща сума: ${totalAmount} ${currencySymbol}\nВижте PDF версия на офертата:`,
        url: pdfUrl,
      })
      .then(() => showSnackbar('Успешно споделяне'))
      .catch((error) => {
        // If user cancels share, don't show error
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fall back to menu if sharing fails
          setAnchorEl(event.currentTarget);
        }
      });
    } else {
      // Fall back to menu if Web Share API is not supported
      setAnchorEl(event.currentTarget);
    }
  };

  const handleShareClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCopyLink = () => {
    const tariffInfo = `${selectedTariff.name} - ${selectedTariff.statistics.total_premium} ${currencySymbol}`;
    navigator.clipboard.writeText(tariffInfo)
      .then(() => {
        showSnackbar('Информацията за тарифата е копирана в клипборда');
      })
      .catch(() => {
        showSnackbar('Неуспешно копиране на информацията', 'error');
      });
    handleShareClose();
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Оферта за застраховка: ${selectedTariff.name}`);
    const totalAmount = selectedTariff.statistics ? 
      selectedTariff.statistics.total_premium : 'N/A';
    const body = encodeURIComponent(`Здравейте,\n\nИзпращам ви информация за застрахователна оферта:\n\nПакет: ${selectedTariff.name}\nОбща сума: ${totalAmount} ${currencySymbol}\n\nПоздрави,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    handleShareClose();
  };

  const handleViewPdf = () => {
    // Open PDF in a new tab
    if (selectedTariff && selectedTariff.id) {
      window.open(`/api/pdf/tariff/${selectedTariff.id}`, '_blank');
    } else {
      showSnackbar('Не може да се генерира PDF за тази оферта', 'error');
    }
    handleShareClose();
  };

  // Help dialog handlers
  const handleOpenHelp = () => {
    setHelpOpen(true);
  };

  const handleCloseHelp = () => {
    setHelpOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 'medium', mb: 3 }}>
          Преглед пакет
        </Typography>
        <div className="flex items-center">
          {/* Help button */}
          <Tooltip title="Помощ за споделяне на PDF">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<HelpOutlineIcon />}
              onClick={handleOpenHelp}
              sx={{ mr: 2, mb: 3 }}
            >
              Помощ
            </Button>
          </Tooltip>
          
          {/* Share button */}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<ShareIcon />}
            onClick={handleShareClick}
            sx={{ mb: 3 }}
          >
            Сподели
          </Button>
        </div>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleShareClose}
        >
          <MenuItem onClick={handleCopyLink}>
            <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
            Копирай информация
          </MenuItem>
          <MenuItem onClick={handleEmailShare}>
            <EmailIcon fontSize="small" sx={{ mr: 1 }} />
            Сподели по имейл
          </MenuItem>
          <MenuItem onClick={handleViewPdf}>
            <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
            Виж като PDF
          </MenuItem>
        </Menu>
      </div>

      <TariffPreview
          selectedTariff={selectedTariff}
          currencySymbol={currencySymbol}
          promoCodeValid={promoCodeValid}
          promoDiscount={promoDiscount}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-6 sm:mt-6">
        <BackButton onClick={prevStep} className="order-2 sm:order-1 py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base" />
        <ProceedButton
            type="submit"
            className="order-1 sm:order-2 py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base"
        />
      </div>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* Help dialog */}
      <PdfSharingHelp open={helpOpen} onClose={handleCloseHelp} />
    </form>
  );
};

export default TariffPreviewFormWithHelp;