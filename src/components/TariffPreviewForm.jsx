import React, { useState } from 'react';
import BackButton from './ui/BackButton.jsx';
import ProceedButton from './ui/ProceedButton.jsx';
import TariffPreview from "./ui/TariffPreview.jsx";
import {Typography, Button, Snackbar, Alert} from "@mui/material";
import api from '../services/api.js';

const TariffPreviewForm = ({
  nextStep,
  prevStep,
  selectedTariff,
  currencySymbol,
  promoCodeValid,
  promoDiscount
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  const handleSendToPdf = async () => {
    try {
      setLoading(true);

      // Prepare data for the API request
      const data = {
        selectedTariff,
        currencySymbol,
        promoCodeValid,
        promoDiscount
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
          <BackButton onClick={prevStep} className="py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base" />
          <Button
            variant="outlined"
            color="primary"
            onClick={handleSendToPdf}
            disabled={loading}
            className="py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base"
            sx={{
              borderColor: '#8b2131',
              color: '#8b2131',
              '&:hover': {
                borderColor: '#6b1021',
                backgroundColor: 'rgba(139, 33, 49, 0.04)'
              }
            }}
          >
            {loading ? 'Генериране...' : 'Изпрати на приятел'}
          </Button>
        </div>
        <ProceedButton
            type="submit"
            className="order-1 sm:order-2 py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base"
        />
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </form>
  );
};

export default TariffPreviewForm;
