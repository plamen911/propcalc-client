import { useState, useEffect, useRef } from 'react';
import EstateDataForm from './EstateDataForm';
import CoveredRisksForm from './CoveredRisksForm';
import InsurerForm from './InsurerForm';
import OrderPreviewForm from './OrderPreviewForm';
import api from '../services/api';
import AuthService from '../services/auth';
import LoadingSpinner from './ui/LoadingSpinner.jsx';
import ErrorDisplay from './ui/ErrorDisplay.jsx';
import TariffPreviewForm from "./TariffPreviewForm.jsx";

const MultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [animating, setAnimating] = useState(false);
  const formContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    settlement_id: '',
    estate_type_id: '',
    estate_subtype_id: '',
    distance_to_water_id: '',
    area_sq_meters: '',
  });
  const [lastOpenedAccordion, setLastOpenedAccordion] = useState(null);
  const [customClauseAmounts, setCustomClauseAmounts] = useState({});
  const [selectedRisks, setSelectedRisks] = useState({});
  const [isCustomPackageSelected, setIsCustomPackageSelected] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('');

  // State for InsurerForm
  const [insurerData, setInsurerData] = useState({
    full_name: '',
    id_number: '',
    id_number_type_id: '1',
    insurer_settlement_id: '',
    permanent_address: '',
    phone: '',
    email: '',
    person_role_id: '',
    birth_date: '',
    insurer_nationality_id: '',
    gender: '',
    property_owner_id_number_type_id: '1',
    property_owner_name: '',
    property_owner_id_number: '',
    property_owner_birth_date: '',
    property_owner_nationality_id: '',
    property_owner_gender: '',
    property_address: ''
  });
  const [checkedItems, setCheckedItems] = useState({});

  // State for clause checkboxes (for clauses 14 and 16)
  const [clauseCheckboxes, setClauseCheckboxes] = useState({
    14: false,
    16: false
  });

  // State for promotional code
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValid, setPromoCodeValid] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(null);
  const [promoDiscountedAmount, setPromoDiscountedAmount] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoCodeId, setPromoCodeId] = useState(null);

  // State for tracking loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch all initial data and perform silent authentication when the component mounts
  useEffect(() => {
    const initializeForm = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // First, perform silent authentication
        await AuthService.loginAnonymous();

        // Then fetch all initial data in a single API call
        const response = await api.get('/api/v1/form-data/initial-data');

        // Set currency symbol
        setCurrencySymbol(response.data.currency_symbol);

        // Store the initial data in a global variable to be used by child components
        window.initialFormData = response.data;

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing form:', error);

        // Handle authentication errors specifically
        if (error.isAuthError) {
          setLoadError(error.authErrorMessage || 'Authentication error. Please refresh the page.');
        } else if (error.response && error.response.status === 401) {
          setLoadError('Your session has expired. Please refresh the page to continue.');
        } else {
          setLoadError('Failed to load form data. Please try again later.');
        }

        setIsLoading(false);
      }
    };

    initializeForm();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const nextStep = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('forward');
    setPreviousStep(currentStep);
    setTimeout(() => {
      setCurrentStep(prevStep => prevStep + 1);
      setTimeout(() => {
        setAnimating(false);
      }, 700); // Match this with the CSS transition duration
    }, 50);
  };

  const prevStep = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('backward');
    setPreviousStep(currentStep);
    setTimeout(() => {
      setCurrentStep(prevStep => prevStep - 1);
      setTimeout(() => {
        setAnimating(false);
      }, 700); // Match this with the CSS transition duration
    }, 50);
  };

  const resetForm = () => {
    // Reset animation state first
    setAnimating(false);
    setDirection('forward');
    setPreviousStep(0);

    // Reset all form state to initial values
    setCurrentStep(0);
    setFormData({
      settlement_id: '',
      estate_type_id: '',
      estate_subtype_id: '',
      distance_to_water_id: '',
      area_sq_meters: '',
    });
    setLastOpenedAccordion(null);
    setCustomClauseAmounts({});
    setSelectedRisks({});
    setIsCustomPackageSelected(false);
    setSelectedTariff(null);
    setInsurerData({
      full_name: '',
      id_number: '',
      id_number_type_id: '1',
      insurer_settlement_id: '',
      permanent_address: '',
      phone: '',
      email: '',
      person_role_id: '',
      birth_date: '',
      insurer_nationality_id: '',
      gender: '',
      property_owner_id_number_type_id: '1',
      property_owner_name: '',
      property_owner_id_number: '',
      property_owner_birth_date: '',
      property_owner_nationality_id: '',
      property_owner_gender: '',
      property_address: ''
    });
    setCheckedItems({});
    setClauseCheckboxes({
      14: false,
      16: false
    });

    // Reset promotional code state
    setPromoCode('');
    setPromoCodeValid(false);
    setPromoCodeError('');
    setPromoDiscount(null);
    setPromoDiscountedAmount(null);
    setValidatingPromo(false);
  };

  const renderStep = () => {
    // Show loading indicator while data is being fetched
    if (isLoading) {
      return <LoadingSpinner />;
    }

    // Show an error message if there was an error loading data
    if (loadError) {
      return (
        <ErrorDisplay 
          error={loadError} 
          centered={true} 
          className="h-64" 
          showRefreshButton={true}
          iconSize="large"
        />
      );
    }

    // Render the appropriate step if data is loaded successfully
    switch (currentStep) {
      case 0:
        return (
          <EstateDataForm 
            formData={formData} 
            handleChange={handleChange} 
            nextStep={nextStep} 
          />
        );
      case 1:
        return (
            <CoveredRisksForm
                formData={formData}
                nextStep={nextStep}
                prevStep={prevStep}
                lastOpenedAccordion={lastOpenedAccordion}
                setLastOpenedAccordion={setLastOpenedAccordion}
                customClauseAmounts={customClauseAmounts}
                setCustomClauseAmounts={setCustomClauseAmounts}
                selectedRisks={selectedRisks}
                setSelectedRisks={setSelectedRisks}
                isCustomPackageSelected={isCustomPackageSelected}
                setIsCustomPackageSelected={setIsCustomPackageSelected}
                setSelectedTariff={setSelectedTariff}
                currencySymbol={currencySymbol}
                clauseCheckboxes={clauseCheckboxes}
                setClauseCheckboxes={setClauseCheckboxes}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                promoCodeValid={promoCodeValid}
                setPromoCodeValid={setPromoCodeValid}
                promoCodeError={promoCodeError}
                setPromoCodeError={setPromoCodeError}
                promoDiscount={promoDiscount}
                setPromoDiscount={setPromoDiscount}
                promoDiscountedAmount={promoDiscountedAmount}
                setPromoDiscountedAmount={setPromoDiscountedAmount}
                validatingPromo={validatingPromo}
                setValidatingPromo={setValidatingPromo}
                setPromoCodeId={setPromoCodeId}
            />
        );
      case 2:
        return (
            <TariffPreviewForm
                nextStep={nextStep}
                prevStep={prevStep}
                selectedTariff={selectedTariff}
                currencySymbol={currencySymbol}
                promoCodeValid={promoCodeValid}
                promoDiscount={promoDiscount}
                formData={formData}
            />
        );
      case 3:
        return (
          <InsurerForm 
            nextStep={nextStep} 
            prevStep={prevStep}
            selectedTariff={selectedTariff}
            insurerData={insurerData}
            setInsurerData={setInsurerData}
            checkedItems={checkedItems}
            setCheckedItems={setCheckedItems}
            currencySymbol={currencySymbol}
            formData={formData}
            promoCodeValid={promoCodeValid}
            promoDiscount={promoDiscount}
            promoDiscountedAmount={promoDiscountedAmount}
          />
        );
      case 4:
        return (
          <OrderPreviewForm 
            prevStep={prevStep}
            selectedTariff={selectedTariff}
            insurerData={insurerData}
            checkedItems={checkedItems}
            formData={formData}
            currencySymbol={currencySymbol}
            resetForm={resetForm}
            promoCodeValid={promoCodeValid}
            promoDiscount={promoDiscount}
            promoDiscountedAmount={promoDiscountedAmount}
            promoCodeId={promoCodeId}
          />
        );
      default:
        return null;
    }
  };

  const steps = [
    'Данни за имота',
    'Покрити рискове',
    'Преглед пакет',
    'Допълнит. данни',
    'Преглед поръчка'
  ];

  // Define custom animation styles with enhanced effects
  const slideLeftEnter = 'translate-x-0 opacity-100 scale-100';
  const slideLeftExit = '-translate-x-full opacity-0 scale-95';
  const slideRightEnter = 'translate-x-0 opacity-100 scale-100';
  const slideRightExit = 'translate-x-full opacity-0 scale-95';

  // Get animation classes based on direction and previous/current step
  const getAnimationClasses = () => {
    if (!animating) return 'translate-x-0 opacity-100 scale-100';

    if (direction === 'forward') {
      return previousStep < currentStep ? slideLeftEnter : slideLeftExit;
    } else {
      return previousStep > currentStep ? slideRightEnter : slideRightExit;
    }
  };

  return (
    <div className="bg-primary text-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header with title and step indicator - improved for mobile */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-primary/30 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-medium text-center sm:text-left">
          ЗАСТРАХОВКА ИМУЩЕСТВО
        </h2>
        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-primary rounded-full border-2 border-white text-sm sm:text-base font-medium whitespace-nowrap">
          Стъпка {currentStep + 1} от {steps.length}
        </span>
      </div>

      {/* Stepper - improved for mobile */}
      <div className="p-4 sm:p-6 md:p-8 bg-primary/90 border-b border-primary/30">
        <div className="flex items-center">
          {steps.map((label, index) => (
            <div key={label} className="flex flex-col items-center w-1/5">
              <div className="relative flex items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  currentStep > index || (index === 3 && currentStep === 3)
                    ? 'bg-white text-primary' 
                    : currentStep === index 
                      ? 'bg-white text-primary' 
                      : 'bg-white/30 text-white'
                }`}>
                  {currentStep > index || (index === 3 && currentStep === 3) ? (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm sm:text-base font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`absolute top-4 sm:top-5 h-0.5 left-8 right-0 sm:left-10 sm:right-0 ${
                    currentStep > index ? 'bg-primary' : 'bg-white/30'
                  }`} style={{ width: 'calc(100% - 8px)' }}></div>
                )}
              </div>
              <span className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-white text-center max-w-[60px] sm:max-w-none truncate">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form content - improved for mobile with fancy animation */}
      <div className="p-4 sm:p-6 md:p-8 bg-primary relative overflow-hidden">
        <div 
          ref={formContainerRef}
          className={`transform transition-all duration-700 ease-out ${getAnimationClasses()}`}
          style={{ 
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform, opacity, scale'
          }}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;
