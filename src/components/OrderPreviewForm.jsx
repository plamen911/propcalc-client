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
import BackButton from './ui/BackButton.jsx';
import ProceedButton from './ui/ProceedButton.jsx';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckIcon from './ui/CheckIcon.jsx';
import api from '../services/api';
import ErrorDisplay from './ui/ErrorDisplay.jsx';
// import { formatCurrency } from '../utils/formatters';
import TariffPreview from "./ui/TariffPreview.jsx";
import CalcStatisticsService from "../services/calc-statistics.js";

// Styled Paper component for the preview section§
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
  color: theme.palette.primary.main,
  border: '1px solid rgba(139, 33, 49, 0.3)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(2),
  },
  '& .MuiAlert-icon': {
    color: theme.palette.primary.main,
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

const OrderPreviewForm = ({ prevStep, selectedTariff, insurerData, checkedItems, formData, currencySymbol, resetForm, promoCodeValid, promoDiscount, promoDiscountedAmount, promoCodeId }) => {
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
  const [propertyOwnerSettlementData, setPropertyOwnerSettlementData] = useState(null);
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [documentLinks, setDocumentLinks] = useState([]);

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

  // Helper function to get the property owner ID number type text based on the ID
  const getPropertyOwnerIdNumberTypeText = () => {
    if (!insurerData || !insurerData.property_owner_id_number_type_id || idNumberTypeOptions.length === 0) {
      return "ЕГН/ЛНЧ/Паспорт №:"; // Default fallback
    }

    // Convert both IDs to strings before comparing to avoid type mismatch
    const selectedType = idNumberTypeOptions.find(type => String(type.id) === String(insurerData.property_owner_id_number_type_id));
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
          setDocumentLinks(window.initialFormData.document_links || []);
        } else {
          // If initialFormData is not available, show error
          console.error('Initial form data not available');
          setError('Неуспешно зареждане на данните. Моля, обновете страницата.');
          setPersonRoleOptions([]);
          setIdNumberTypeOptions([]);
          setPropertyChecklistItems([]);
          setEstateTypes([]);
          setDistanceToWater([]);
          setDocumentLinks([]);
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

        // Fetch property owner settlement data if property_owner_settlement_id is available
        if (insurerData && insurerData.property_owner_settlement_id) {
          const propertyOwnerSettlementResponse = await api.get('/api/v1/form-data/settlements', {
            params: { id: insurerData.property_owner_settlement_id }
          });
          const propertyOwnerSettlementData = Array.isArray(propertyOwnerSettlementResponse.data) && propertyOwnerSettlementResponse.data.length > 0
            ? propertyOwnerSettlementResponse.data[0]
            : null;
          setPropertyOwnerSettlementData(propertyOwnerSettlementData);
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

        // Fetch nationality options
        const nationalityResponse = await api.get('/api/v1/form-data/nationalities');
        const nationalityData = Array.isArray(nationalityResponse.data) ? nationalityResponse.data : [];
        setNationalityOptions(nationalityData);
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
        setPropertyOwnerSettlementData(null);
        setNationalityOptions([]);
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
          property_address: insurerData.property_address,
          property_additional_info: insurerData.property_additional_info,

          // Insurer data
          person_role_id: insurerData.person_role_id,
          id_number_type_id: insurerData.id_number_type_id,
          insurer_nationality_id: insurerData.insurer_nationality_id,
          insurer_settlement_id: insurerData.insurer_settlement_id,
          full_name: insurerData.full_name,
          id_number: insurerData.id_number,
          birth_date: insurerData.birth_date,
          gender: insurerData.gender,
          permanent_address: insurerData.permanent_address,
          phone: insurerData.phone,
          email: insurerData.email,

          // Property owner data
          property_owner_name: insurerData.property_owner_name,
          property_owner_id_number: insurerData.property_owner_id_number,
          property_owner_id_number_type_id: insurerData.property_owner_id_number_type_id,
          property_owner_birth_date: insurerData.property_owner_birth_date,
          property_owner_nationality_id: insurerData.property_owner_nationality_id,
          property_owner_gender: insurerData.property_owner_gender,
          property_owner_settlement_id: insurerData.property_owner_settlement_id,
          property_owner_permanent_address: insurerData.property_owner_permanent_address,

          // Property checklist items
          property_checklist_items: checkedItems
        };

        const stats = CalcStatisticsService.calculate(
            selectedTariff.statistics.total_premium,
            selectedTariff.tax_percent,
            selectedTariff.discount_percent,
            promoDiscount
        );

        // Add tariff data and financial data if a tariff is selected
        if (selectedTariff) {
          policyData.tariff_preset_id = selectedTariff.id;
          policyData.subtotal = stats.insurancePremiumAmount;
          policyData.discount = selectedTariff.discount_percent || 0;
          policyData.subtotal_tax = stats.taxAmount;
          policyData.total = stats.totalAmount;

          // Add promotional code data if a valid promo code is applied
          if (promoCodeValid && promoDiscount && promoCodeId) {
            policyData.promotional_code_id = promoCodeId;
            policyData.promotional_code_discount = promoDiscount;
            // If a promo discount is applied, update the total
            if (promoDiscountedAmount) {
              policyData.total = promoDiscountedAmount;
            }
          }
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
        <Box sx={{ mb: { xs: 3, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', px: { xs: 1, sm: 3 } }}>
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
              mb: 3,
              py: { xs: 3, sm: 3 },
              px: { xs: 2, sm: 4 }
            }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-3">
                <CheckCircleOutlineIcon style={{ color: '#4caf50', fontSize: '3rem' }} />
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-3 sm:mb-2 text-white leading-tight">ВАШАТА ПОРЪЧКА Е ПРИЕТА УСПЕШНО!</div>
              <div className="bg-white/10 py-3 sm:py-2 px-3 sm:px-4 rounded-lg inline-block mb-4 sm:mb-3 border border-white/20">
                <span className="text-base sm:text-lg font-medium text-white block sm:inline">НОМЕР НА ПОРЪЧКАТА:</span>
                <span className="text-xl sm:text-xl font-bold sm:ml-2 text-white block sm:inline mt-1 sm:mt-0 pulse">{policyData.code}</span>
              </div>
              <div className="text-sm sm:text-base mb-5 sm:mb-4 leading-relaxed bg-white/5 p-4 sm:p-3 rounded-lg border border-white/10">
                <p className="mb-3 text-white">Екипът на ЗБ "Дженерал Брокер Клуб" ООД Ви благодари за направения избор.</p>
                <p className="text-white">Нашите експерти ще обработят заявката и ще се свържат с Вас по телефон или имейл за уточняване на плащане и доставка на полицата.</p>
              </div>
              <button
                onClick={() => {
                  if (typeof resetForm === 'function') {
                    resetForm();
                  }
                }}
                className="inline-flex items-center justify-center py-4 sm:py-3 px-8 sm:px-6 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105 min-h-[60px] sm:min-h-[56px] w-full sm:w-auto touch-manipulation"
              >
                ГОТОВО
              </button>
            </div>
          </SuccessAlert>
        </Box>
      )}

      {!isSubmitted && (
          <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 'medium', mb: 3 }}>
            Преглед на поръчката
          </Typography>
      )}

      {!isSubmitted && (
        <>
          <TariffPreview
              selectedTariff={selectedTariff}
              currencySymbol={currencySymbol}
              promoCodeValid={promoCodeValid}
              promoDiscount={promoDiscount}
          />

          {formData && (
            <div className="mb-5 sm:mb-4">
              <div className="bg-white p-4 sm:p-4 rounded-xl mb-4 sm:mb-4 border border-gray-200 shadow-sm">
                <h3 className="text-lg sm:text-lg font-medium text-gray-800 mb-3 sm:mb-3">
                  Данни за имота
                </h3>
                <div className="p-4 sm:p-3 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                  <div className="space-y-3 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                      <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Населено място:</div>
                      <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{estateSettlementData ? estateSettlementData.name : 'Не е посочено'}</div>
                    </div>
                    {/* Property Address */}
                    {insurerData && insurerData.property_address && (
                      <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                        <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Точен адрес на имота:</div>
                        <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{insurerData.property_address}</div>
                      </div>
                    )}
                    {insurerData.property_additional_info && (
                      <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                        <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Допълнителни пояснения:</div>
                        <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{insurerData.property_additional_info}</div>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                      <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Тип имот:</div>
                      <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{getEstateTypeName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                      <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Вид имот:</div>
                      <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{getEstateSubtypeName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                      <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">Отстояние от воден басейн:</div>
                      <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{getDistanceToWaterName()}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-3 sm:py-2">
                      <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:w-1/3">РЗП:</div>
                      <div className="text-gray-800 text-base sm:text-base font-semibold sm:w-2/3">{formData.area_sq_meters ? `${formData.area_sq_meters} кв.м.` : 'Не е посочено'}</div>
                    </div>
                  </div>
                </div>

                {propertyChecklistItems.length > 0 && checkedItems && Object.keys(checkedItems).length > 0 && (
                  <div className="p-4 sm:p-3 bg-gray-50 rounded-lg mt-4 sm:mt-4 border border-gray-200">
                    {/* Property checklist rows - mobile optimized */}
                    <div className="space-y-3 sm:space-y-2">
                      {propertyChecklistItems.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 py-3 sm:py-2">
                          <div className="text-gray-800 text-base sm:text-base pr-2 font-medium mb-1 sm:mb-0 sm:flex-1">{item.name}</div>
                          <div className="text-primary text-base sm:text-base text-left sm:text-right font-semibold">
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

          {insurerData && insurerData.property_owner_name && (
            <div className="mb-4">
              <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-gray-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">
                  Собственик
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Property Owner Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Име:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.property_owner_name}</div>
                    </div>
                    {/* Property Owner ID Number */}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getPropertyOwnerIdNumberTypeText()}</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.property_owner_id_number}</div>
                    </div>
                    {/* Show additional fields for ЛНЧ (id = 2) or Паспорт № (id = 3) */}
                    {(insurerData.property_owner_id_number_type_id === '2' || insurerData.property_owner_id_number_type_id === '3') && (
                      <>
                        {/* Birth Date */}
                        {insurerData.property_owner_birth_date && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Дата на раждане:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {new Date(insurerData.property_owner_birth_date).toLocaleDateString('bg-BG')}
                            </div>
                          </div>
                        )}
                        {/* Nationality */}
                        {insurerData.property_owner_nationality_id && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Националност:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {nationalityOptions.find(n => String(n.id) === String(insurerData.property_owner_nationality_id))?.name || 'Не е посочено'}
                            </div>
                          </div>
                        )}
                        {/* Gender */}
                        {insurerData.property_owner_gender && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Пол:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {insurerData.property_owner_gender === 'male' ? 'Мъж' : 'Жена'}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Property Owner Settlement */}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Населено място:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{propertyOwnerSettlementData ? propertyOwnerSettlementData.name : 'Не е посочено'}</div>
                    </div>
                    {/* Property Owner Address */}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Постоянен адрес:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.property_owner_permanent_address || 'Не е посочено'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {insurerData && (
            <div className="mb-4">
              <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-gray-200 shadow-sm">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">
                  Застраховащ
                </h3>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getPersonRoleText()}</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.full_name}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getIdNumberTypeText()}</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.id_number}</div>
                    </div>
                    {/* Show additional fields for ЛНЧ (id = 2) or Паспорт № (id = 3) */}
                    {(insurerData.id_number_type_id === '2' || insurerData.id_number_type_id === '3') && (
                      <>
                        {/* Birth Date */}
                        {insurerData.birth_date && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Дата на раждане:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {new Date(insurerData.birth_date).toLocaleDateString('bg-BG')}
                            </div>
                          </div>
                        )}
                        {/* Nationality */}
                        {insurerData.insurer_nationality_id && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Националност:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {nationalityOptions.find(n => String(n.id) === String(insurerData.insurer_nationality_id))?.name || 'Не е посочено'}
                            </div>
                          </div>
                        )}
                        {/* Gender */}
                        {insurerData.gender && (
                          <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                            <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Пол:</div>
                            <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">
                              {insurerData.gender === 'male' ? 'Мъж' : 'Жена'}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Населено място:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{settlementData ? settlementData.name : ''}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">{getSettlementText()}</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3 break-words">{insurerData.permanent_address}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Телефон:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3">{insurerData.phone}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 py-2">
                      <div className="text-gray-800 text-sm sm:text-base pr-2 font-medium mb-0.5 sm:mb-0 sm:w-1/3">Имейл:</div>
                      <div className="text-gray-800 text-sm sm:text-base font-semibold sm:w-2/3 break-words">{insurerData.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document links section - always visible before the agree section */}
          <div className="mb-4">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2">
                {documentLinks.map((doc) => (
                  <a
                    key={doc.uri}
                    href={doc.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center py-3 sm:py-2 text-primary hover:text-primary-dark transition-colors duration-150 text-sm sm:text-base break-words"
                  >
                    <CheckIcon className="text-primary mr-3 flex-shrink-0 h-6 w-6 sm:h-5 sm:w-5" />
                    <span className="underline">{doc.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start mb-5 sm:mb-4 px-1 sm:px-0">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={termsAccepted}
              onChange={handleTermsChange}
              className="mt-0.5 sm:mt-1 mr-3 sm:mr-3 h-6 w-6 sm:h-4 sm:w-4 text-primary border-white/50 rounded focus:ring-primary"
            />
            <label htmlFor="terms-checkbox" className="text-white text-sm sm:text-base leading-tight -mt-1 sm:mt-0">
              Декларирам, че съм съгласен/а предоставените от мен лични данни по смисъла на чл.2 от Закона за защита на личните данни, да бъдат обработвани от ЗБ "Дженерал Брокер Клуб" ООД за предоставяне на застрахователни услуги, предоставяни на Асоциацията на българските застрахователи и Комисията за финансов надзор.
            </label>
          </div>

          {error && (
            <div className="mb-5 sm:mb-4 px-1 sm:px-0">
              <ErrorDisplay error={error} />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-5 sm:gap-3 mt-6 sm:mt-6">
            <BackButton 
              onClick={prevStep} 
              className="order-2 sm:order-1 py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base" 
            />
            <ProceedButton
              type="submit"
              disabled={isSubmitted}
              text={isSubmitted ? 'Изпратено' : 'ЗАВЪРШИ'}
              className="order-1 sm:order-2 py-4 sm:py-3 min-h-[60px] sm:min-h-[48px] text-base"
            />
          </div>
        </>
      )}
    </form>
  );
};

export default OrderPreviewForm;
