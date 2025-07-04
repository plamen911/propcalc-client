import React, { useState } from 'react';
import BackButton from './ui/BackButton.jsx';
import ProceedButton from './ui/ProceedButton.jsx';
import TariffPreview from "./ui/TariffPreview.jsx";
import {Typography, Button, Snackbar, Alert} from "@mui/material";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import api from '../services/api.js';

const TariffPreviewForm = ({
  nextStep,
  prevStep,
  selectedTariff,
  currencySymbol,
  promoCodeValid,
  promoDiscount,
  formData
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  const handleSendToPdf = () => {
    // Open the email dialog
    setEmailDialogOpen(true);
    setFriendEmail('');
    setEmailError('');
  };

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);

      // Prepare data for the API request
      const data = {
        selectedTariff,
        currencySymbol,
        promoCodeValid,
        promoDiscount,
        estateData: formData
      };

      // Make API request to generate PDF
      const response = await api.post('/api/v1/tariff/pdf', data, {
        responseType: 'blob' // Important for handling binary data
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tariff-${selectedTariff.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: 'PDF успешно генериран и изтеглен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: 'Грешка при генериране на PDF',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setEmailError('');
    setFriendEmail('');
  };

  const handleEmailChange = (e) => {
    setFriendEmail(e.target.value);
    // Clear error when user types
    if (emailError) setEmailError('');
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSendEmail = async () => {
    // Validate email
    if (!friendEmail.trim()) {
      setEmailError('Моля, въведете имейл адрес');
      return;
    }

    if (!validateEmail(friendEmail)) {
      setEmailError('Моля, въведете валиден имейл адрес');
      return;
    }

    try {
      setLoading(true);
      setEmailDialogOpen(false);

      // Prepare data for the API request
      const data = {
        selectedTariff,
        currencySymbol,
        promoCodeValid,
        promoDiscount,
        recipientEmail: friendEmail,
        estateData: formData
      };

      // Make API request to send PDF via email
      await api.post('/api/v1/tariff/pdf/email', data);

      setSnackbar({
        open: true,
        message: 'PDF успешно изпратен на ' + friendEmail,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error sending PDF via email:', error);
      setSnackbar({
        open: true,
        message: 'Грешка при изпращане на PDF',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 'medium', mb: 3 }}>
        Преглед пакет
      </Typography>
      <TariffPreview
          selectedTariff={selectedTariff}
          currencySymbol={currencySymbol}
          promoCodeValid={promoCodeValid}
          promoDiscount={promoDiscount}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-6 sm:mt-6">
        <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-1">
          <BackButton onClick={prevStep} className="py-4 sm:py-2.5 min-h-[56px] sm:min-h-0 text-base" />
          <Button
            variant="outlined"
            color="primary"
            onClick={handleDownloadPdf}
            disabled={loading}
            className="inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 rounded-full text-base touch-manipulation transition-all duration-200 hover:scale-105 min-h-[56px] sm:min-h-0"
            sx={{
              borderColor: '#8b2131',
              color: 'white',
              '&:hover': {
                borderColor: '#6b1021',
                backgroundColor: 'rgba(139, 33, 49, 0.04)'
              }
            }}
          >
            <PictureAsPdfIcon className="mr-2 sm:mr-1.5" fontSize="small" />
            {loading ? 'Генериране...' : <span className="hidden sm:inline">Изтегли PDF</span>}
            {loading ? '' : <span className="sm:hidden">PDF</span>}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSendToPdf}
            disabled={loading}
            className="inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 rounded-full text-base touch-manipulation transition-all duration-200 hover:scale-105 min-h-[56px] sm:min-h-0"
            sx={{
              borderColor: '#8b2131',
              color: 'white',
              '&:hover': {
                borderColor: '#6b1021',
                backgroundColor: 'rgba(139, 33, 49, 0.04)'
              }
            }}
          >
            <SendIcon className="mr-2 sm:mr-1.5" fontSize="small" />
            {loading ? 'Генериране...' : <span className="hidden sm:inline">Изпрати на приятел</span>}
            {loading ? '' : <span className="sm:hidden">Изпрати</span>}
          </Button>
        </div>
        <ProceedButton
            type="submit"
            className="order-1 sm:order-2 py-4 sm:py-2.5 min-h-[56px] sm:min-h-0 text-base"
        />
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Email Dialog */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${emailDialogOpen ? 'flex' : 'hidden'}`} onClick={handleCloseEmailDialog}>
        <div className="relative bg-[#1a1a1a] text-white rounded-xl border border-[rgba(255,255,255,0.2)] shadow-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.1)]">
            <h2 className="text-lg font-medium">Изпрати на приятел</h2>
            <button 
              type="button"
              onClick={handleCloseEmailDialog}
              className="text-white bg-[rgba(255,255,255,0.1)] p-1 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                Имейл адрес <span className="text-red-300">*</span>
              </label>
              <input
                autoFocus
                id="email"
                type="email"
                value={friendEmail}
                onChange={handleEmailChange}
                className={`appearance-none block w-full pl-3 pr-3 py-3.5 sm:py-2 text-base sm:text-base border ${emailError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-[#8b2131] focus:border-[#8b2131] rounded-md bg-[#2a2a2a] text-white touch-manipulation`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-3 p-4 border-t border-[rgba(255,255,255,0.1)]">
            <button
              type="button"
              onClick={handleCloseEmailDialog}
              className="inline-flex items-center justify-center py-2.5 px-5 rounded-full text-base touch-manipulation transition-all duration-200 hover:scale-105 border border-[#8b2131] text-white hover:bg-[rgba(139,33,49,0.04)]"
            >
              Отказ
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="inline-flex items-center justify-center py-2.5 px-5 rounded-full text-base touch-manipulation transition-all duration-200 hover:scale-105 bg-[#8b2131] text-white hover:bg-[#6b1021]"
            >
              Изпрати
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TariffPreviewForm;
