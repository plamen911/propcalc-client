import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Paper, 
  Typography, 
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BackButton from './BackButton';
import ProceedButton from './ProceedButton';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../services/api';
import ErrorDisplay from './ErrorDisplay';
import { formatCurrency } from '../utils/formatters';

// Styled Paper component for the preview section
const PreviewPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: theme.shape.borderRadius * 2,
  marginBottom: theme.spacing(4),
  border: '1px solid rgba(255, 255, 255, 0.2)'
}));

// Styled Alert component for success messages
const SuccessAlert = styled(Alert)(({ theme }) => ({
  backgroundColor: 'rgba(139, 33, 49, 0.2)',
  color: '#8b2131',
  border: '1px solid rgba(139, 33, 49, 0.3)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  '& .MuiAlert-icon': {
    color: '#8b2131',
    marginRight: theme.spacing(1.5),
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing(2),
    },
  },
  '& .MuiAlert-message': {
    fontSize: '0.875rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1rem',
    },
  }
}));

const OrderPreviewForm = ({ prevStep, selectedTariff, insurerData, checkedItems, formData, currencySymbol, resetForm, promoCodeValid, promoDiscount, promoDiscountedAmount }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [policyData, setPolicyData] = useState(null);
  const [personRoleOptions, setPersonRoleOptions] = useState([]);
  const [idNumberTypeOptions, setIdNumberTypeOptions] = useState([]);
  const [settlementData, setSettlementData] = useState(null);
  const [propertyChecklistItems, setPropertyChecklistItems] = useState([]);
  const [estateTypes, setEstateTypes] = useState([]);
  const [estateSubtypes, setEstateSubtypes] = useState([]);
  const [distanceToWater, setDistanceToWater] = useState([]);
  const [estateSettlementData, setEstateSettlementData] = useState(null);

  // Helper function to get the person role text based on the ID
  const getPersonRoleText = () => {
    if (!insurerData || !insurerData.person_role_id || personRoleOptions.length === 0) {
      return "Име:"; // Default fallback
    }

    // Convert both IDs to strings before comparing to avoid type mismatch
    const selectedRole = personRoleOptions.find(role => String(role.id) === String(insurerData.person_role_id));
    return selectedRole ? `${selectedRole.name}:` : "Име:";
  };

  // Helper function to get the ID number type text based on the ID
  const getIdNumberTypeText = () => {
    if (!insurerData || !insurerData.id_number_type_id || idNumberTypeOptions.length === 0) {
      return "ЕГН/ЛНЧ/Паспорт №:"; // Default fallback
    }

    // Convert both IDs to strings before comparing to avoid type mismatch
    const selectedType = idNumberTypeOptions.find(type => String(type.id) === String(insurerData.id_number_type_id));
    return selectedType ? `${selectedType.name}:` : "ЕГН/ЛНЧ/Паспорт №:";
  };

  // Helper function to get the settlement text
  const getSettlementText = () => {
    if (!settlementData) {
      return "Адрес:"; // Default fallback
    }

    return "Адрес:";
  };

  // Helper function to get the estate type name based on the ID
  const getEstateTypeName = () => {
    if (!formData || !formData.estate_type_id || estateTypes.length === 0) {
      return "Не е посочено"; // Default fallback
    }

    const selectedType = estateTypes.find(type => String(type.id) === String(formData.estate_type_id));
    return selectedType ? selectedType.name : "Не е посочено";
  };

  // Helper function to get the estate subtype name based on the ID
  const getEstateSubtypeName = () => {
    if (!formData || !formData.estate_subtype_id || estateSubtypes.length === 0) {
      return "Не е посочено"; // Default fallback
    }

    const selectedSubtype = estateSubtypes.find(subtype => String(subtype.id) === String(formData.estate_subtype_id));
    return selectedSubtype ? selectedSubtype.name : "Не е посочено";
  };

  // Helper function to get the distance to water name based on the ID
  const getDistanceToWaterName = () => {
    if (!formData || !formData.distance_to_water_id || distanceToWater.length === 0) {
      return "Не е посочено"; // Default fallback
    }

    const selectedDistance = distanceToWater.find(distance => String(distance.id) === String(formData.distance_to_water_id));
    return selectedDistance ? selectedDistance.name : "Не е посочено";
  };

  // Fetch person role options, ID number type options, settlement data, and property checklist items when the component mounts
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Use the data from the global variable set by MultiStepForm
        if (window.initialFormData) {
          setPersonRoleOptions(window.initialFormData.person_role_options || []);
          setIdNumberTypeOptions(window.initialFormData.id_number_type_options || []);
          setPropertyChecklistItems(window.initialFormData.property_checklist_items || []);
          setEstateTypes(window.initialFormData.estate_types || []);
          setDistanceToWater(window.initialFormData.water_distances || []);
        } else {
          // If initialFormData is not available, show error
          console.error('Initial form data not available');
          setError('Failed to load form data. Please refresh the page.');
          setPersonRoleOptions([]);
          setIdNumberTypeOptions([]);
          setPropertyChecklistItems([]);
          setEstateTypes([]);
          setDistanceToWater([]);
        }

        // Fetch settlement data if insurer_settlement_id is available
        if (insurerData && insurerData.insurer_settlement_id) {
          const settlementResponse = await api.get('/api/v1/form-data/settlements', {
            params: { id: insurerData.insurer_settlement_id }
          });
          const settlementData = Array.isArray(settlementResponse.data) && settlementResponse.data.length > 0 
            ? settlementResponse.data[0] 
            : null;
          setSettlementData(settlementData);
        }

        // Fetch estate settlement data if settlement_id is available
        if (formData && formData.settlement_id) {
          const estateSettlementResponse = await api.get('/api/v1/form-data/settlements', {
            params: { id: formData.settlement_id }
          });
          const estateSettlementData = Array.isArray(estateSettlementResponse.data) && estateSettlementResponse.data.length > 0 
            ? estateSettlementResponse.data[0] 
            : null;
          setEstateSettlementData(estateSettlementData);
        }

        // Fetch estate subtypes if estate_type_id is available
        if (formData && formData.estate_type_id) {
          const estateSubtypesResponse = await api.get(`/api/v1/form-data/estate-subtypes/${formData.estate_type_id}`);
          const estateSubtypesData = Array.isArray(estateSubtypesResponse.data) ? estateSubtypesResponse.data : [];
          setEstateSubtypes(estateSubtypesData);
        }
      } catch (err) {
        console.error('Error fetching options:', err);
        setPersonRoleOptions([]);
        setIdNumberTypeOptions([]);
        setPropertyChecklistItems([]);
        setSettlementData(null);
        setEstateTypes([]);
        setEstateSubtypes([]);
        setDistanceToWater([]);
        setEstateSettlementData(null);
      }
    };

    fetchOptions();
  }, [insurerData, formData]);

  const handleTermsChange = (event) => {
    setTermsAccepted(event.target.checked);
    if (event.target.checked && error) {
      setError(null);
    }
  };

  const validateForm = () => {
    if (!termsAccepted) {
      setError('Моля, приемете общите условия, за да продължите');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    if (validateForm()) {
      try {
        // Prepare the data to be sent to the API
        const policyData = {
          // Estate data
          settlement_id: formData.settlement_id,
          estate_type_id: formData.estate_type_id,
          estate_subtype_id: formData.estate_subtype_id,
          distance_to_water_id: formData.distance_to_water_id,
          area_sq_meters: formData.area_sq_meters,

          // Insurer data
          person_role_id: insurerData.person_role_id,
          id_number_type_id: insurerData.id_number_type_id,
          insurer_nationality_id: insurerData.insurer_nationality_id,
          insurer_settlement_id: insurerData.insurer_settlement_id,
          full_name: insurerData.full_name,
          id_number: insurerData.id_number,
          permanent_address: insurerData.permanent_address,
          phone: insurerData.phone,
          email: insurerData.email,

          // Property checklist items
          property_checklist_items: checkedItems
        };

        // Add tariff data and financial data if a tariff is selected
        if (selectedTariff) {
          policyData.tariff_preset_id = selectedTariff.id;
          policyData.subtotal = selectedTariff.statistics?.total_premium || 0;
          policyData.discount = selectedTariff.discount_percent || 0;
          policyData.subtotal_tax = selectedTariff.statistics?.tax_amount || 0;
          policyData.total = selectedTariff.statistics?.total_amount || 0;
        } else {
          // Set default financial values for custom offers
          policyData.subtotal = 0;
          policyData.discount = 0;
          policyData.subtotal_tax = 0;
          policyData.total = 0;
        }

        // Submit the data to the API
        const response = await api.post('/api/v1/insurance-policies', policyData);

        // If successful, set isSubmitted to true and store the response data
        if (response.status === 201) {
          setPolicyData(response.data);
          setIsSubmitted(true);
        }
      } catch (err) {
        console.error('Error submitting insurance policy:', err);

        // Check if the error response contains specific error messages
        if (err.response && err.response.data && err.response.data.errors) {
          // If there are specific error messages, display them
          const errorMessages = err.response.data.errors.join(', ');
          setError(errorMessages);
        } else {
          // If no specific error messages, display the generic error
          setError('Възникна грешка при изпращането на поръчката. Моля, опитайте отново.');
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isSubmitted && policyData && (
        <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', px: { xs: 2, sm: 3 } }}>
          <style>
            {`
              @keyframes colorPulse {
                0%, 100% { color: white; }
                50% { color: #ffcc00; }
              }
            `}
          </style>
          <SuccessAlert 
            severity="success" 
            icon={false}
            sx={{ 
              maxWidth: '100%',
              width: '100%',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              '& .MuiAlert-icon': {
                display: 'none'
              },
              mb: 2,
              py: { xs: 2, sm: 3 },
              px: { xs: 3, sm: 4 }
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <CheckCircleOutlineIcon style={{ color: '#4caf50', fontSize: '2.5rem' }} />
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-2 text-white">ВАШАТА ПОРЪЧКА Е ПРИЕТА УСПЕШНО!</div>
              <div className="bg-white/10 py-2 px-4 rounded-lg inline-block mb-3 border border-white/20">
                <span className="text-base sm:text-lg font-medium text-white">НОМЕР НА ПОРЪЧКАТА:</span>
                <span className="text-lg sm:text-xl font-bold ml-2 text-white" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>{policyData.code}</span>
              </div>
              <div className="text-base sm:text-lg mb-4 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="mb-3 text-white">Екипът на ЗБ "Дженерал Брокер Клуб" ООД Ви благодари за направения избор.</p>
                <p className="text-white">Нашите експерти ще обработят заявката и ще се свържат с Вас по телефон или имейл за уточняване на плащане и доставка на полицата.</p>
              </div>
              <button
                onClick={() => {
                  if (typeof resetForm === 'function') {
                    resetForm();
                  }
                }}
                className="inline-flex items-center justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105 min-h-[56px] touch-manipulation"
              >
                ГОТОВО
              </button>
            </div>
          </SuccessAlert>
        </Box>
      )}

      {!isSubmitted && (
        <>
          <style>
            {`
              @keyframes colorPulse {
                0%, 100% { color: white; }
                50% { color: #ffcc00; }
              }
            `}
          </style>

          <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 'medium', mb: 3 }}>
            Преглед на поръчката
          </Typography>
        </>
      )}

      {!isSubmitted && (
        <>
          {selectedTariff && (
            <Box sx={{ mb: 4 }}>
              <div className="bg-white/10 p-4 sm:p-6 rounded-xl border border-white/20">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
                  Вие избрахте покритие "{selectedTariff.name}" за Вашето имущество
                </h3>

                {/* Display clauses if available */}
                {selectedTariff.tariff_preset_clauses && (
                  <div className="p-2 sm:p-3 bg-white/5 rounded-lg mb-3 sm:mb-4">
                    {/* Header - hidden on mobile */}
                    <div className="hidden sm:flex justify-between border-b border-white/10 py-1 mb-1">
                      <div className="font-medium text-white text-sm sm:text-base">Клаузи</div>
                      <div className="font-medium text-white text-sm sm:text-base">Застрахователна сума</div>
                    </div>

                    {/* Clause rows - mobile optimized */}
                    <div className="space-y-1">
                      {selectedTariff.tariff_preset_clauses
                        .filter(clause => parseFloat(clause.tariff_amount) !== 0)
                        .map((clause) => (
                        <div key={clause.id} className="flex justify-between items-center border-b border-white/10 py-2">
                          <div className="text-white text-sm sm:text-base pr-2 flex-1">{clause.insurance_clause.name}</div>
                          <div className="text-white text-sm sm:text-base text-right font-semibold text-[#ffcc00] whitespace-nowrap" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>{formatCurrency(clause.tariff_amount)} {currencySymbol}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics section */}
                {selectedTariff.statistics && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-white/20 shadow-md">
                    {selectedTariff.statistics.total_premium && (
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                            <span className="uppercase text-white text-sm sm:text-base font-medium">Застрахователна премия</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg ml-2">{formatCurrency(selectedTariff.statistics.total_premium)} {currencySymbol}</div>
                        </div>
                      </div>
                    )}

                    {selectedTariff.statistics.discounted_premium && selectedTariff.discount_percent && (
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                            <span className="uppercase text-white text-sm sm:text-base font-medium">Застрахователна премия след отстъпка от {selectedTariff.discount_percent}%</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg ml-2">{formatCurrency(selectedTariff.statistics.discounted_premium)} {currencySymbol}</div>
                        </div>
                      </div>
                    )}

                    {/* Show premium after promo code if a valid promo code is applied */}
                    {promoCodeValid && promoDiscount && selectedTariff.statistics.discounted_premium && (
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                            <span className="uppercase text-white text-sm sm:text-base font-medium">Застрахователна премия след приложен промо код {promoDiscount}%</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg ml-2">
                            {formatCurrency(selectedTariff.statistics.discounted_premium - (selectedTariff.statistics.total_premium * promoDiscount / 100))} {currencySymbol}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTariff.statistics.tax_amount && selectedTariff.tax_percent && (
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                            <span className="uppercase text-white text-sm sm:text-base font-medium">{selectedTariff.tax_percent}% данък върху застрахователната премия</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg ml-2">
                            {promoCodeValid && promoDiscount 
                              ? formatCurrency((selectedTariff.statistics.discounted_premium - (selectedTariff.statistics.total_premium * promoDiscount / 100)) * (selectedTariff.tax_percent / 100)) 
                              : formatCurrency(selectedTariff.statistics.tax_amount)} 
                            {currencySymbol}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#8b2131]/70 p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                          <span className="uppercase text-white text-sm sm:text-base font-bold">Общо дължима сума за една година</span>
                        </div>
                        <div className="text-white font-bold text-lg sm:text-xl ml-2" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>
                          {promoCodeValid && promoDiscount 
                            ? formatCurrency(promoDiscountedAmount)
                            : formatCurrency(selectedTariff.statistics.total_amount)} 
                          {currencySymbol}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Box>
          )}

          {formData && (
            <div className="mb-4">
              <div className="bg-white/10 p-4 sm:p-6 rounded-xl border border-white/20">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
                  Данни за имота
                </h3>
                <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Населено място:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{estateSettlementData ? estateSettlementData.name : 'Не е посочено'}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Тип имот:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{getEstateTypeName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Вид имот:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{getEstateSubtypeName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Отстояние от воден басейн:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{getDistanceToWaterName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">РЗП:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{formData.area_sq_meters ? `${formData.area_sq_meters} кв.м.` : 'Не е посочено'}</div>
                    </div>
                  </div>
                </div>

                {propertyChecklistItems.length > 0 && checkedItems && Object.keys(checkedItems).length > 0 && (
                  <div className="p-2 sm:p-3 bg-white/5 rounded-lg mt-3 sm:mt-4">
                    {/* Property checklist rows - mobile optimized */}
                    <div className="space-y-1.5">
                      {propertyChecklistItems.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                          <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:flex-1">{item.name}:</div>
                          <div className="text-white text-sm sm:text-base text-left sm:text-right font-semibold text-[#ffcc00]" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>
                            {checkedItems[item.id] === true ? 'Да' : checkedItems[item.id] === false ? 'Не' : 'Не е посочено'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {insurerData && (
            <div className="mb-4">
              <div className="bg-white/10 p-4 sm:p-6 rounded-xl border border-white/20">
                <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
                  Данни за застраховащия
                </h3>
                <div className="p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getPersonRoleText()}</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{insurerData.full_name}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getIdNumberTypeText()}</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{insurerData.id_number}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Населено място:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{settlementData ? settlementData.name : ''}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getSettlementText()}</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3 break-words">{insurerData.permanent_address}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Телефон:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3">{insurerData.phone}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-white/10 py-1.5 sm:py-2">
                      <div className="text-white text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Имейл:</div>
                      <div className="text-white text-sm sm:text-base font-bold sm:w-2/3 break-words">{insurerData.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 my-4 sm:my-6"></div>

          <div className="flex items-start mb-4">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={handleTermsChange}
              className="mt-1 mr-2 sm:mr-3 h-5 w-5 sm:h-4 sm:w-4 text-primary border-white/50 rounded focus:ring-primary"
            />
            <label htmlFor="terms-checkbox" className="text-white text-sm sm:text-base leading-tight">
              Декларирам, че съм съгласен/а предоставените от мен лични данни по смисъла на чл.2 от Закона за защита на личните данни, да бъдат обработвани от ЗБ "Дженерал Брокер Клуб" ООД за предоставяне на застрахователни услуги, предоставяни на Асоциацията на българските застрахователи и Комисията за финансов надзор.
            </label>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorDisplay error={error} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-3 mt-5 sm:mt-6">
            <BackButton onClick={prevStep} className="order-2 sm:order-1" />
            <ProceedButton
              type="submit"
              disabled={isSubmitted}
              text={isSubmitted ? 'Изпратено' : 'ЗАВЪРШИ'}
              className="order-1 sm:order-2"
            />
          </div>
        </>
      )}
    </form>
  );
};

export default OrderPreviewForm;
