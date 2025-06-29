import React from 'react';
import BackButton from './ui/BackButton.jsx';
import ProceedButton from './ui/ProceedButton.jsx';
import TariffPreview from "./ui/TariffPreview.jsx";

const TariffPreviewForm = ({
  nextStep, 
  prevStep, 
  selectedTariff,
  currencySymbol,
  promoCodeValid,
  promoDiscount
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

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
    </form>
  );
};

export default TariffPreviewForm;
