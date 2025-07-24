import React, { useState, useEffect, useCallback } from 'react';
import BackButton from './ui/BackButton.jsx';
import ProceedButton from './ui/ProceedButton.jsx';
import { debounce } from 'lodash';
import LoadingSpinner from './ui/LoadingSpinner.jsx';
import ErrorDisplay from './ui/ErrorDisplay.jsx';
import EyeIcon from './ui/EyeIcon';
import { LocalOffer, CheckCircle } from '@mui/icons-material';
import InfoModal from './ui/InfoModal.jsx';
import ErrorIcon from './ui/ErrorIcon.jsx';
import api from '../services/api';
import CalcStatisticsService from '../services/calc-statistics';
import { formatCurrency, formatDescription } from '../utils/formatters.jsx';
import { Typography, Slider } from "@mui/material";

const CoveredRisksForm = ({ 
  formData, 
  nextStep, 
  prevStep, 
  lastOpenedAccordion, 
  setLastOpenedAccordion, 
  customClauseAmounts, 
  setCustomClauseAmounts, 
  selectedRisks, 
  setSelectedRisks, 
  isCustomPackageSelected, 
  setIsCustomPackageSelected, 
  setSelectedTariff, 
  currencySymbol, 
  clauseCheckboxes, 
  setClauseCheckboxes,
  promoCode,
  setPromoCode,
  promoCodeValid,
  setPromoCodeValid,
  promoCodeError,
  setPromoCodeError,
  promoDiscount,
  setPromoDiscount,
  setPromoDiscountedAmount,
  validatingPromo,
  setValidatingPromo,
  setPromoCodeId
}) => {
  // State for API data
  const [tariffPresets, setTariffPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for expanded accordion items
  const [expandedItems, setExpandedItems] = useState({});
  const [isCustomPackageExpanded, setIsCustomPackageExpanded] = useState(false);
  const [validationError, setValidationError] = useState('');

  // State for all unique clauses
  const [allClauses, setAllClauses] = useState([]);

  // State for the promotional code success message
  const [showPromoSuccess, setShowPromoSuccess] = useState(false);

  // State for clause configuration values (min, max, step)
  const [clauseConfig, setClauseConfig] = useState({});

  // State for custom package statistics
  const [customPackageStatistics, setCustomPackageStatistics] = useState({
    discount_percent: 0,
    tax_percent: 0,
    statistics: {
      total_premium: '0.00',
      discounted_premium: '0.00',
      tax_amount: '0.00',
      total_amount: '0.00'
    }
  });

  useEffect(() => {
    // Only fetch if both settlement_id and distance_to_water_id are available
    if (!formData.settlement_id || !formData.distance_to_water_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch tariff presets
        const tariffResponse = await api.get('/api/v1/insurance-policies/admin/tariff-presets', {
          params: {
            settlement_id: formData.settlement_id,
            distance_to_water_id: formData.distance_to_water_id
          }
        });

        // Fetch clause configuration values
        const clauseConfigResponse = await api.get('/api/v1/form-data/clause-config');
        
        // Set clause configuration state
        setClauseConfig(clauseConfigResponse.data);

        const data = Array.isArray(tariffResponse.data) ? tariffResponse.data : [];
        setTariffPresets(data);

        // Use lastOpenedAccordion if available, otherwise all items will be collapsed by default
        if (lastOpenedAccordion) {
          if (lastOpenedAccordion === 'custom') {
            setIsCustomPackageExpanded(true);
          } else {
            setExpandedItems({ [lastOpenedAccordion]: true });
          }
        }

        // Initialize selected risks only if they're empty
        if (Object.keys(selectedRisks).length === 0) {
          const initialSelectedRisks = {};
          data.filter(preset => preset.active).forEach(preset => {
            initialSelectedRisks[preset.id] = false;
          });
          setSelectedRisks(initialSelectedRisks);
        }

        // Extract all unique clauses from all presets (active only)
        const uniqueClauses = [];
        const clauseMap = {};

        data.filter(preset => preset.active).forEach(preset => {
          preset.tariff_preset_clauses.forEach(clause => {
            if (!clauseMap[clause.insurance_clause.id]) {
              clauseMap[clause.insurance_clause.id] = true;
              uniqueClauses.push(clause.insurance_clause);
            }
          });
        });

        // Sort clauses by their position or id
        uniqueClauses.sort((a, b) => {
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          return a.id - b.id;
        });

        setAllClauses(uniqueClauses);

        // Initialize custom clause amounts only if they're empty
        if (Object.keys(customClauseAmounts).length === 0) {
          const initialCustomAmounts = {};
          uniqueClauses.forEach(clause => {
            // Set default values to min values for each clause
            if (clause.id === 1) {
              // Use configuration value if available, otherwise fallback to hardcoded value
              const minValue = clauseConfigResponse.data[1]?.min || 100000;
              initialCustomAmounts[clause.id] = minValue.toString();
            } else if (clause.id === 6 || clause.id === 14 || clause.id === 16) {
              initialCustomAmounts[clause.id] = ''; // Special clauses with checkboxes
            } else {
              // Use configuration value if available, otherwise fallback to 0
              const minValue = clauseConfigResponse.data[clause.id]?.min || 0;
              initialCustomAmounts[clause.id] = minValue.toString();
            }
          });
          setCustomClauseAmounts(initialCustomAmounts);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [formData, customClauseAmounts, setCustomClauseAmounts, selectedRisks, setSelectedRisks]);

  const toggleCustomPackage = () => {
    const newExpandedState = !isCustomPackageExpanded;
    setIsCustomPackageExpanded(newExpandedState);
    // Close all other accordions when opening custom package
    if (newExpandedState) {
      setExpandedItems({});
      setLastOpenedAccordion('custom');
    } else {
      setLastOpenedAccordion(null);
    }
  };

  const handleRiskChange = (presetId) => {
    // Deselect a custom package when selecting a preset
    setIsCustomPackageSelected(false);

    // Update selectedRisks to mark the selected preset
    setSelectedRisks(prev => {
      const updatedRisks = {};
      // Set all presets to false
      Object.keys(prev).forEach(key => {
        updatedRisks[key] = false;
      });
      // Set the selected preset to true
      updatedRisks[presetId] = true;
      return updatedRisks;
    });

    // Find the selected tariff preset
    const selectedPreset = tariffPresets.find(preset => preset.id === presetId);
    if (selectedPreset) {
      setSelectedTariff(selectedPreset);
    }

    // Go directly to the next step without changing the button state
    nextStep();
  };


  // Function to calculate statistics for a custom package
  const calculateCustomPackageStatistics = async () => {
    try {
      // Only call API if a custom package is expanded
      if (!isCustomPackageExpanded) {
        return;
      }

      // Prepare data for API call
      const data = {
        custom_clause_amounts: customClauseAmounts,
        settlement_id: formData.settlement_id,
        distance_to_water_id: formData.distance_to_water_id
      };

      // Call API
      const response = await api.post('/api/v1/form-data/custom-package-statistics', data);

      // Update state with response data
      setCustomPackageStatistics(response.data);
    } catch (err) {
      console.error('Error calculating custom package statistics:', err);
    }
  };

  // Debounce function to avoid too many API calls
  const debouncedCalculate = useCallback(
    debounce(() => {
      calculateCustomPackageStatistics();
    }, 500),
    [customClauseAmounts, formData.settlement_id, formData.distance_to_water_id, isCustomPackageExpanded]
  );

  // Handle promotional code input change
  const handlePromoCodeChange = (e) => {
    setPromoCode(e.target.value);
    // Reset validation state when the code changes
    if (promoCodeValid) {
      setPromoCodeValid(false);
      setPromoDiscount(null);
      setPromoDiscountedAmount(null);
    }
    if (promoCodeError) {
      setPromoCodeError('');
    }
    // Hide the success message when the code changes
    setShowPromoSuccess(false);
  };

  // Validate promotional code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Моля, въведете промоционален код');
      return;
    }

    setValidatingPromo(true);
    setPromoCodeError('');

    try {
      const response = await api.post('/api/v1/promotional-codes/validate', { code: promoCode });

      if (response.data.valid) {
        setPromoCodeValid(true);
        setPromoDiscount(response.data.discountPercentage);
        setPromoCodeId(response.data.id);
        setShowPromoSuccess(true);

        // Update tariff presets with the promotional discount
        if (tariffPresets.length > 0) {
          const updatedTariffPresets = tariffPresets.map(preset => {
            if (preset.statistics && preset.statistics.total_premium) {
              // Get the original premium
              const originalPremium = preset.statistics.total_premium;
              // Calculate promo discount amount based on the original premium
              const promoDiscountAmount = Math.round((originalPremium * (response.data.discountPercentage / 100)) * 100) / 100;
              // Calculate premium after both discounts
              const premiumAfterBothDiscounts = preset.statistics.discounted_premium - promoDiscountAmount;
              // Calculate tax on the premium after both discounts
              const taxAmount = Math.round((premiumAfterBothDiscounts * (preset.tax_percent / 100)) * 100) / 100;
              // Calculate total amount (premium after both discounts + tax)
              const totalAmount = premiumAfterBothDiscounts + taxAmount;

              // Create a new statistics object with updated values
              const updatedStatistics = {
                ...preset.statistics,
                discounted_premium: premiumAfterBothDiscounts,
                tax_amount: taxAmount,
                total_amount: totalAmount
              };

              // Return updated preset
              return {
                ...preset,
                statistics: updatedStatistics
              };
            }
            return preset;
          });

          setTariffPresets(updatedTariffPresets);
        }

        // Also update custom package statistics if available
        if (customPackageStatistics.statistics && customPackageStatistics.statistics.total_premium) {
          const originalPremium = customPackageStatistics.statistics.total_premium;
          const promoDiscountAmount = Math.round((originalPremium * (response.data.discountPercentage / 100)) * 100) / 100;
          const premiumAfterBothDiscounts = customPackageStatistics.statistics.discounted_premium - promoDiscountAmount;
          const taxAmount = Math.round((premiumAfterBothDiscounts * (customPackageStatistics.tax_percent / 100)) * 100) / 100;
          const totalAmount = premiumAfterBothDiscounts + taxAmount;

          setCustomPackageStatistics(prev => ({
            ...prev,
            statistics: {
              ...prev.statistics,
              discounted_premium: premiumAfterBothDiscounts,
              tax_amount: taxAmount,
              total_amount: totalAmount
            }
          }));
        }
      } else {
        setPromoCodeValid(false);
        setPromoCodeError(response.data.message || 'Невалиден промоционален код');
      }
    } catch (error) {
      console.error('Error validating promotional code:', error);
      setPromoCodeError('Грешка при валидиране на кода. Моля, опитайте отново.');
      setPromoCodeValid(false);
    } finally {
      setValidatingPromo(false);
    }
  };

  // Call API when custom clause amounts change
  useEffect(() => {
    debouncedCalculate();

    // Cleanup function
    return () => {
      debouncedCalculate.cancel();
    };
  }, [debouncedCalculate]);

  const handleClauseAmountChange = (clauseId, value) => {
    // For input fields, we need to validate the value
    if (clauseId === 6 || clauseId === 14 || clauseId === 16) {
      // Only allow numeric values (digits and decimal point)
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        // Update the value for the current clause
        setCustomClauseAmounts(prev => {
          const updatedAmounts = {
            ...prev,
            [clauseId]: value
          };
          return updatedAmounts;
        });
        
        // Call the debounced function directly to ensure immediate update
        debouncedCalculate();
      }
      return;
    }
    
    // For slider values, we get a number directly
    const stringValue = value.toString();
    
    // Update the value for the current clause
    setCustomClauseAmounts(prev => {
      const updatedAmounts = {
        ...prev,
        [clauseId]: stringValue
      };

      // If clause 1 or 2 was changed and clause 6 checkbox is checked, update clause 6 value
      if ((clauseId === 1 || clauseId === 2) && clauseCheckboxes[6]) {
        const clause1Value = clauseId === 1 ? stringValue : prev[1];
        const clause2Value = clauseId === 2 ? stringValue : prev[2];

        // If both clause 1 and clause 2 have values, calculate their sum
        if (clause1Value && clause2Value && 
            clause1Value !== '' && clause2Value !== '' && 
            !isNaN(parseFloat(clause1Value)) && !isNaN(parseFloat(clause2Value))) {
          // Calculate the sum of clause 1 and clause 2
          const sum = parseFloat(clause1Value) + parseFloat(clause2Value);
          updatedAmounts[6] = sum.toString();
        }
        // If only clause 1 has a value, use that value
        else if (clause1Value && clause1Value !== '' && !isNaN(parseFloat(clause1Value))) {
          updatedAmounts[6] = clause1Value;
        }
        // If only clause 2 has a value, use that value
        else if (clause2Value && clause2Value !== '' && !isNaN(parseFloat(clause2Value))) {
          updatedAmounts[6] = clause2Value;
        }
      }

      return updatedAmounts;
    });

    // Call the debounced function directly to ensure immediate update
    debouncedCalculate();
  };

  const handleClauseCheckboxChange = (clauseId) => {
    // Get the current state of the clicked checkbox
    const newCheckedState = !clauseCheckboxes[clauseId];

    if (clauseId === 6) {
      // Only update checkbox 6
      setClauseCheckboxes(prev => ({
        ...prev,
        6: newCheckedState
      }));

      // If checking checkbox 6, calculate sum of clause 1 and 2
      if (newCheckedState) {
        let clause6Value = '';
        const clause1Value = customClauseAmounts[1];
        const clause2Value = customClauseAmounts[2];

        // If both clause 1 and clause 2 have values, calculate their sum
        if (clause1Value && clause2Value && 
            clause1Value !== '' && clause2Value !== '' && 
            !isNaN(parseFloat(clause1Value)) && !isNaN(parseFloat(clause2Value))) {
          // Calculate the sum of clause 1 and clause 2
          const sum = parseFloat(clause1Value) + parseFloat(clause2Value);
          clause6Value = sum.toString();
        } 
        // If only clause 1 has a value, use that value
        else if (clause1Value && clause1Value !== '' && !isNaN(parseFloat(clause1Value))) {
          clause6Value = clause1Value;
        }
        // If only clause 2 has a value, use that value
        else if (clause2Value && clause2Value !== '' && !isNaN(parseFloat(clause2Value))) {
          clause6Value = clause2Value;
        }

        setCustomClauseAmounts(prev => ({
          ...prev,
          6: clause6Value
        }));
      } else {
        // If unchecking, clear the value of clause 6
        setCustomClauseAmounts(prev => ({
          ...prev,
          6: ''
        }));
      }
    } else {
      // For checkboxes 14 and 16, update both to the same state
      setClauseCheckboxes(prev => ({
        ...prev,
        14: newCheckedState,
        16: newCheckedState
      }));

      // If checking, set the input values for clauses 14 and 16
      if (newCheckedState) {
        setCustomClauseAmounts(prev => ({
          ...prev,
          14: '150',
          16: '150'
        }));
      } else {
        // If unchecking, clear the values for clauses 14 and 16
        setCustomClauseAmounts(prev => ({
          ...prev,
          14: '',
          16: ''
        }));
      }
    }
  };

  const handleCustomPackageSelect = () => {
    // Validate the required clause and that at least one field is filled in
    // Check if-clause id = 1 has a valid value between min and max
    const clause1Value = customClauseAmounts[1];
    const clause1ValueNum = parseFloat(clause1Value);
    const clause1Min = clauseConfig[1]?.min || 100000;
    const clause1Max = clauseConfig[1]?.max || 2000000;

    if (!clause1Value || clause1Value === '' || clause1Value === '0' || isNaN(clause1ValueNum) || clause1ValueNum < clause1Min || clause1ValueNum > clause1Max) {
      setValidationError(`Клауза "Пожар и щети - Недвижимо имущество" е задължителна и стойността трябва да бъде между ${clause1Min.toLocaleString()} и ${clause1Max.toLocaleString()} ${currencySymbol}`);
      return; // Don't proceed if validation fails
    }

    // Пожари и щети на имущество - Соларни инсталации
    if (formData.estate_type_id === '4' && customClauseAmounts[3]) {
      const clause3Value = customClauseAmounts[3];
      const clause3ValueNum = parseFloat(clause3Value);
      const clause3Max = clauseConfig[3]?.max || 15000;

      if (!isNaN(clause1ValueNum) && clause3ValueNum > clause3Max) {
        setValidationError(`Клауза "Пожари и щети на имущество - Соларни инсталации" е задължителна и стойността трябва да бъде до ${clause3Max.toLocaleString()} ${currencySymbol}`);
        return; // Don't proceed if validation fails
      }
    }

    // Check if-clause id = 7 has a valid value between min and max
    const clause7Value = customClauseAmounts[7];
    const clause7ValueNum = parseFloat(clause7Value);
    const clause7Min = clauseConfig[7]?.min || 0;
    const clause7Max = clauseConfig[7]?.max || 20000;

    if (clause7Value && +clause7Value > 0 && (clause7ValueNum < clause7Min || clause7ValueNum > clause7Max)) {
      setValidationError(`Стойността на клауза "Кражба чрез взлом, кражба с техническо средство и грабеж" трябва да бъде между ${clause7Min.toLocaleString()} и ${clause7Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 8 has a valid value between min and max
    const clause8Value = customClauseAmounts[8];
    const clause8ValueNum = parseFloat(clause8Value);
    const clause8Min = clauseConfig[8]?.min || 0;
    const clause8Max = clauseConfig[8]?.max || 50000;

    if (clause8Value && +clause8Value > 0 && (clause8ValueNum < clause8Min || clause8ValueNum > clause8Max)) {
      setValidationError(`Стойността на клауза "Гражданска отговорност към трети лица" трябва да бъде между ${clause8Min.toLocaleString()} и ${clause8Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 9 has a valid value between min and max
    const clause9Value = customClauseAmounts[9];
    const clause9ValueNum = parseFloat(clause9Value);
    const clause9Min = clauseConfig[9]?.min || 0;
    const clause9Max = clauseConfig[9]?.max || 15000;

    if (clause9Value && +clause9Value > 0 && (clause9ValueNum < clause9Min || clause9ValueNum > clause9Max)) {
      setValidationError(`Стойността на клауза "Наем за алтернативно настаняване" трябва да бъде между ${clause9Min.toLocaleString()} и ${clause9Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 10 has a valid value between min and max
    const clause10Value = customClauseAmounts[10];
    const clause10ValueNum = parseFloat(clause10Value);
    const clause10Min = clauseConfig[10]?.min || 0;
    const clause10Max = clauseConfig[10]?.max || 50000;

    if (clause10Value && +clause10Value > 0 && (clause10ValueNum < clause10Min || clause10ValueNum > clause10Max)) {
      setValidationError(`Стойността на клауза "Злополука на член от семейството/домакинството" трябва да бъде между ${clause10Min.toLocaleString()} и ${clause10Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 11 has a valid value between min and max
    const clause11Value = customClauseAmounts[11];
    const clause11ValueNum = parseFloat(clause11Value);
    const clause11Min = clauseConfig[11]?.min || 0;
    const clause11Max = clauseConfig[11]?.max || 15000;

    if (clause11Value && +clause11Value > 0 && (clause11ValueNum < clause11Min || clause11ValueNum > clause11Max)) {
      setValidationError(`Стойността на клауза "Загуба на доход от наем" трябва да бъде между ${clause11Min.toLocaleString()} и ${clause11Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 12 has a valid value between min and max
    const clause12Value = customClauseAmounts[12];
    const clause12ValueNum = parseFloat(clause12Value);
    const clause12Min = clauseConfig[12]?.min || 0;
    const clause12Max = clauseConfig[12]?.max || 2000000;

    if (clause12Value && +clause12Value > 0 && (clause12ValueNum < clause12Min || clause12ValueNum > clause12Max)) {
      setValidationError(`Стойността на клауза "Късо съединение и токов удар на ел. инсталации и/или уреди" трябва да бъде между ${clause12Min.toLocaleString()} и ${clause12Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 13 has a valid value between min and max
    const clause13Value = customClauseAmounts[13];
    const clause13ValueNum = parseFloat(clause13Value);
    const clause13Min = clauseConfig[13]?.min || 0;
    const clause13Max = clauseConfig[13]?.max || 50000;

    if (clause13Value && +clause13Value > 0 && (clause13ValueNum < clause13Min || clause13ValueNum > clause13Max)) {
      setValidationError(`Стойността на клауза "Щети вследствие на опит за кражба чрез взлом или грабеж" трябва да бъде между ${clause13Min.toLocaleString()} и ${clause13Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if-clause id = 15 has a valid value between min and max
    const clause15Value = customClauseAmounts[15];
    const clause15ValueNum = parseFloat(clause15Value);
    const clause15Min = clauseConfig[15]?.min || 0;
    const clause15Max = clauseConfig[15]?.max || 500;

    if (clause15Value && +clause15Value > 0 && (clause15ValueNum < clause15Min || clause15ValueNum > clause15Max)) {
      setValidationError(`Стойността на клауза "Гражданска отговорност за вреди, причинени от домашни любимци и злополука на домашен любимец" трябва да бъде между ${clause15Min.toLocaleString()} и ${clause15Max.toLocaleString()} ${currencySymbol}`);
      return;
    }

    // Check if clause 6 is filled when its checkbox is checked
    if (clauseCheckboxes[6]) {
      const clause6Value = customClauseAmounts[6];

      if (!clause6Value || clause6Value === '' || clause6Value === '0') {
        setValidationError('Моля, попълнете стойност за клауза Земетресение.');
        return; // Don't proceed if validation fails
      }
    }

    // Check if clauses 14 and 16 are filled when both checkboxes are checked
    if (clauseCheckboxes[14] && clauseCheckboxes[16]) {
      const clause14Value = customClauseAmounts[14];
      const clause16Value = customClauseAmounts[16];

      if (!clause14Value || clause14Value === '' || clause14Value === '0' || 
          !clause16Value || clause16Value === '' || clause16Value === '0') {
        setValidationError('Моля, попълнете стойности за клаузи "Разходи за отключване на брава" и "Разходи за издаване на документи".');
        return; // Don't proceed if validation fails
      }
    }

    // Check if at least one input field has a valid value
    const hasValidInput = Object.values(customClauseAmounts).some(
      value => value !== '' && value !== '0' && parseFloat(value) > 0
    );

    if (!hasValidInput) {
      setValidationError('Моля, въведете поне една стойност преди да продължите.');
      return; // Don't proceed if validation fails
    } else {
      setValidationError(''); // Clear any previous error
    }

    // Mark custom package as selected
    setIsCustomPackageSelected(true);

    // Deselect all presets
    const resetSelectedRisks = {};
    Object.keys(selectedRisks).forEach(key => {
      resetSelectedRisks[key] = false;
    });
    setSelectedRisks(resetSelectedRisks);

    // Create a custom clauses array for the selected tariff
    const customClauses = [];
    Object.entries(customClauseAmounts).forEach(([clauseId, amount]) => {
      const clauseIdInt = parseInt(clauseId);

      // Special handling for clauses 6, 14 and 16
      if (clauseIdInt === 6 || clauseIdInt === 14 || clauseIdInt === 16) {
        // Find the clause in allClauses
        const clause = allClauses.find(c => c.id === clauseIdInt);
        if (clause) {
          // If the checkbox is checked, include with value (which should be 150)
          // If the checkbox is unchecked, include with empty value
          customClauses.push({
            id: `custom-${clauseId}`,
            insurance_clause: clause,
            tariff_amount: clauseCheckboxes[clauseIdInt] ? amount : ''
          });
        }
      }
      // For all other clauses, only include those with non-zero amounts
      else if (amount && parseFloat(amount) > 0) {
        // Find the clause in allClauses
        const clause = allClauses.find(c => c.id === clauseIdInt);
        if (clause) {
          customClauses.push({
            id: `custom-${clauseId}`,
            insurance_clause: clause,
            tariff_amount: amount
          });
        }
      }
    });

    // Set the selected tariff for the custom package
    setSelectedTariff({
      name: 'Пакет по избор',
      statistics: customPackageStatistics.statistics,
      discount_percent: customPackageStatistics.discount_percent,
      tax_percent: customPackageStatistics.tax_percent,
      tariff_preset_clauses: customClauses
    });

    // Go directly to the next step without changing the button state
    nextStep();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        centered={true} 
        className="p-4 sm:p-6 min-h-[10rem] sm:h-64" 
      />
    );
  }

  if (!formData.settlement_id || !formData.distance_to_water_id) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Please complete the previous step to view available tariff presets.</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Typography variant="h5" gutterBottom color="white" sx={{ fontWeight: 'medium', mb: 3 }}>
        Покрити рискове
      </Typography>
      {/* Promotional Code Section */}
      <div>
        <label htmlFor="promotional_code" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
          Имате промоционален код?
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-grow relative">
              <div className="relative w-full">
                <input
                    type="text"
                    value={promoCode}
                    onChange={handlePromoCodeChange}
                    placeholder="Въведете промоционален код"
                    className={`w-full p-2 rounded-md border ${promoCodeError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-primary focus:border-primary text-black`}
                    disabled={promoCodeValid || validatingPromo}
                />
                {promoCodeError && (
                    <ErrorIcon />
                )}
              </div>
              {promoCodeError && <div className="text-sm sm:text-base text-red-300 mt-1">{promoCodeError}</div>}
            </div>
            <div>
              <button
                  onClick={validatePromoCode}
                  disabled={promoCodeValid || validatingPromo || !promoCode.trim()}
                  className={`inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 border border-transparent shadow-sm text-base sm:text-base font-medium rounded-full text-white ${promoCodeValid ? 'bg-green-600' : 'bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105'} disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto touch-manipulation min-h-[56px] sm:min-h-0`}
              >
                {validatingPromo ? 'Проверка...' : promoCodeValid ? 'Приложен' : 'Приложи'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-3">
          Изберете пакет
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {tariffPresets.filter(preset => preset.active).map((preset) => (
            <div key={preset.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
              {/* Accordion Header - enhanced for mobile */}
              <div 
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 rounded-t-lg"
                onClick={() => handleRiskChange(preset.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col w-full">
                    <div className="flex items-baseline">
                      <span className="text-gray-800 font-medium text-base sm:text-lg mr-1.5 sm:mr-3">
                        {preset.name}
                      </span>
                      <span className="text-gray-700 text-sm sm:text-md font-semibold whitespace-nowrap mr-1.5 sm:mr-2">
                        {formatCurrency(preset.tariff_preset_clauses.find(clause => clause.insurance_clause.id === 1)?.tariff_amount || "0", 0)} {currencySymbol}
                      </span>
                      {!isCustomPackageSelected && selectedRisks[preset.id] && (
                        <CheckCircle className="text-primary ml-1" fontSize="medium" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center mt-1.5 sm:mt-1">
                      <div className="flex items-center">
                        {preset.statistics.total_premium > preset.statistics.total_amount && (
                          <span className="text-gray-500 text-sm sm:text-md font-semibold whitespace-nowrap line-through mr-1.5 sm:mr-2">
                            {formatCurrency(
                                CalcStatisticsService.calculate(
                                    preset.statistics.total_premium,
                                    preset.tax_percent,
                                    preset.discount_percent,
                                    promoDiscount
                                ).totalAmountWithoutDiscount
                            )} {currencySymbol}
                          </span>
                        )}
                        <span className="text-primary text-sm sm:text-md font-semibold whitespace-nowrap pulse">
                          {formatCurrency(
                              CalcStatisticsService.calculate(
                                  preset.statistics.total_premium,
                                  preset.tax_percent,
                                  preset.discount_percent,
                                  promoDiscount
                              ).totalAmount
                          )} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span
                  className="bg-gray-200 rounded-full p-1.5 ml-2 flex-shrink-0"
                  tabIndex={-1}
                  aria-label="Избери този пакет"
                >
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 transition-transform flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          ))}

          {/* Custom Package Accordion */}
          <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm mt-4">
            {/* Custom Package Accordion Header */}
            <div 
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors duration-150 rounded-t-lg"
              onClick={toggleCustomPackage}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col w-full">
                  <div className="flex items-center">
                    <span className="text-gray-800 font-medium text-base sm:text-lg">
                      Пакет по избор
                    </span>
                    {isCustomPackageSelected && (
                      <CheckCircle className="text-primary ml-1" fontSize="medium" />
                    )}
                  </div>
                  <span className="text-primary-darker text-xs sm:text-sm mt-1 blink-text">
                    Създайте свой собствен пакет
                  </span>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full p-1.5 ml-2 flex-shrink-0">
                <svg 
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-700 transition-transform flex-shrink-0 ${isCustomPackageExpanded ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Custom Package Accordion Content */}
            {isCustomPackageExpanded && (
              <div className="p-3 bg-gray-50">
                {/* Header - hidden on mobile */}
                <div className="hidden sm:flex justify-between border-b border-gray-300 py-1 mb-1">
                  <div className="font-medium text-gray-800 text-sm sm:text-base">Клаузи</div>
                  <div className="font-medium text-gray-800 text-sm sm:text-base">Застрахователна сума</div>
                </div>

                {/* Clause rows with input fields - mobile optimized */}
                <div className="space-y-1">
                  {allClauses.map((clause) => (
                    // Hide the clause with id = 3 if estate_type_id is not 4
                    (clause.id !== 3 || formData.estate_type_id === '4') ? (
                    <div key={clause.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 py-2.5 sm:py-2">
                      <div className="flex items-start sm:items-center text-gray-800 text-sm sm:text-base pr-2 flex-1 mb-1.5 sm:mb-0">
                        <span className="leading-tight">{clause.name}</span>
                        {clause.description && (
                          <InfoModal
                            title={clause.name}
                            content={formatDescription(clause.description)}
                            icon={<EyeIcon className="ml-1 text-primary flex-shrink-0 h-5 w-5" />}
                          />
                        )}
                      </div>
                      <div className="w-full sm:w-40">
                        {clause.allow_custom_amount && (
                          <div className="relative rounded-md">
                            {(clause.id === 6 || clause.id === 14 || clause.id === 16) && (
                              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 sm:pl-2 z-10">
                                <div className="p-1.5 sm:p-0.5 -m-1.5 sm:-m-0.5">
                                  <input
                                    type="checkbox"
                                    checked={clauseCheckboxes[clause.id]}
                                    onChange={() => handleClauseCheckboxChange(clause.id)}
                                    className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus:ring-primary border-gray-300 rounded touch-manipulation"
                                  />
                                </div>
                              </div>
                            )}
                            {(clause.id === 6 || clause.id === 14 || clause.id === 16) ? (
                              // Original input field implementation for clauses 6, 14, 16
                              <>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={customClauseAmounts[clause.id]}
                                  onChange={(e) => handleClauseAmountChange(clause.id, e.target.value)}
                                  placeholder={(clause.id === 14 || clause.id === 16) ? "150" : "Сума"}
                                  className={`w-full pr-12 ${(clause.id === 6 || clause.id === 14 || clause.id === 16) ? 'pl-11 sm:pl-8' : 'px-3'} py-4 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-black text-base touch-manipulation ${(clause.id === 6 || clause.id === 14 || clause.id === 16) ? 'bg-gray-100' : ''}`}
                                  readOnly={clause.id === 6 || clause.id === 14 || clause.id === 16}
                                  {...(clause.id === 6 && clauseCheckboxes[6] ? {
                                    required: true
                                  } : (clause.id === 14 || clause.id === 16) && clauseCheckboxes[14] && clauseCheckboxes[16] ? {
                                    required: true
                                  } : {})}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <span className="text-gray-700 text-sm sm:text-base font-medium">{currencySymbol}</span>
                                </div>
                              </>
                            ) : (
                              // Slider implementation for other clauses
                              <div className="p-0">
                                {/* Display the current value above slider */}
                                <div className="flex justify-between mb-0">
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {(clauseConfig[clause.id]?.min !== undefined 
                                      ? clauseConfig[clause.id].min.toLocaleString() 
                                      : (clause.id === 1 ? "100,000" : "0"))}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {(clauseConfig[clause.id]?.max !== undefined 
                                      ? clauseConfig[clause.id].max.toLocaleString() 
                                      : (clause.id === 1 ? "2,000,000" : 
                                         clause.id === 2 ? "100,000" : 
                                         clause.id === 3 ? "15,000" : 
                                         clause.id === 7 ? "20,000" : 
                                         clause.id === 8 ? "50,000" : 
                                         clause.id === 9 ? "15,000" : 
                                         clause.id === 10 ? "50,000" : 
                                         clause.id === 11 ? "15,000" : 
                                         clause.id === 12 ? "2,000,000" : 
                                         clause.id === 13 ? "50,000" : 
                                         clause.id === 15 ? "500" : "150"))}
                                  </Typography>
                                </div>
                                
                                {/* Slider with +/- buttons */}
                                <div className="flex items-center mt-0">
                                  {/* Minus button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = customClauseAmounts[clause.id] 
                                        ? parseFloat(customClauseAmounts[clause.id]) 
                                        : (clauseConfig[clause.id]?.min || (clause.id === 1 ? 100000 : 0));
                                      const step = clauseConfig[clause.id]?.step !== undefined 
                                        ? clauseConfig[clause.id].step 
                                        : (clause.id === 1 ? 10000 : 
                                           clause.id === 2 ? 5000 : 
                                           clause.id === 3 ? 1000 : 
                                           clause.id === 7 ? 1000 : 
                                           clause.id === 8 ? 1000 : 
                                           clause.id === 9 ? 1000 : 
                                           clause.id === 10 ? 1000 : 
                                           clause.id === 11 ? 1000 : 
                                           clause.id === 12 ? 10000 : 
                                           clause.id === 13 ? 1000 : 
                                           clause.id === 15 ? 50 : 10);
                                      const min = clauseConfig[clause.id]?.min !== undefined 
                                        ? clauseConfig[clause.id].min 
                                        : (clause.id === 1 ? 100000 : 0);
                                      const newValue = Math.max(currentValue - step, min);
                                      handleClauseAmountChange(clause.id, newValue);
                                    }}
                                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-full text-gray-700 font-bold text-lg sm:text-base focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation mr-2"
                                    aria-label="Decrease value"
                                  >
                                    -
                                  </button>
                                  
                                  {/* Slider component */}
                                  <div className="flex-1 mx-2">
                                    <Slider
                                      value={customClauseAmounts[clause.id] ? parseFloat(customClauseAmounts[clause.id]) : 
                                             (clauseConfig[clause.id]?.min || (clause.id === 1 ? 100000 : 0))}
                                      onChange={(_, newValue) => handleClauseAmountChange(clause.id, newValue)}
                                      min={clauseConfig[clause.id]?.min !== undefined ? clauseConfig[clause.id].min : (clause.id === 1 ? 100000 : 0)}
                                      max={clauseConfig[clause.id]?.max !== undefined ? clauseConfig[clause.id].max : 
                                           (clause.id === 1 ? 2000000 : 
                                           clause.id === 2 ? 100000 : 
                                           clause.id === 3 ? 15000 : 
                                           clause.id === 7 ? 20000 : 
                                           clause.id === 8 ? 50000 : 
                                           clause.id === 9 ? 15000 : 
                                           clause.id === 10 ? 50000 : 
                                           clause.id === 11 ? 15000 : 
                                           clause.id === 12 ? 2000000 : 
                                           clause.id === 13 ? 50000 : 
                                           clause.id === 15 ? 500 : 150)}
                                      step={clauseConfig[clause.id]?.step !== undefined ? clauseConfig[clause.id].step : 
                                            (clause.id === 1 ? 10000 : 
                                            clause.id === 2 ? 5000 : 
                                            clause.id === 3 ? 1000 : 
                                            clause.id === 7 ? 1000 : 
                                            clause.id === 8 ? 1000 : 
                                            clause.id === 9 ? 1000 : 
                                            clause.id === 10 ? 1000 : 
                                            clause.id === 11 ? 1000 : 
                                            clause.id === 12 ? 10000 : 
                                            clause.id === 13 ? 1000 : 
                                            clause.id === 15 ? 50 : 10)}
                                      valueLabelDisplay="auto"
                                      valueLabelFormat={(value) => `${value.toLocaleString()} ${currencySymbol}`}
                                      sx={{
                                        color: 'primary.main',
                                        padding: '10px 0', // Reduced padding (default is 13px)
                                        '& .MuiSlider-thumb': {
                                          height: 14,
                                          width: 14,
                                        },
                                        '& .MuiSlider-rail': {
                                          height: 3,
                                          border: 'none',
                                          boxShadow: 'none',
                                        },
                                        '& .MuiSlider-track': {
                                          height: 3,
                                          border: 'none',
                                          boxShadow: 'none',
                                        },
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Plus button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = customClauseAmounts[clause.id] 
                                        ? parseFloat(customClauseAmounts[clause.id]) 
                                        : (clauseConfig[clause.id]?.min || (clause.id === 1 ? 100000 : 0));
                                      const step = clauseConfig[clause.id]?.step !== undefined 
                                        ? clauseConfig[clause.id].step 
                                        : (clause.id === 1 ? 10000 : 
                                           clause.id === 2 ? 5000 : 
                                           clause.id === 3 ? 1000 : 
                                           clause.id === 7 ? 1000 : 
                                           clause.id === 8 ? 1000 : 
                                           clause.id === 9 ? 1000 : 
                                           clause.id === 10 ? 1000 : 
                                           clause.id === 11 ? 1000 : 
                                           clause.id === 12 ? 10000 : 
                                           clause.id === 13 ? 1000 : 
                                           clause.id === 15 ? 50 : 10);
                                      const max = clauseConfig[clause.id]?.max !== undefined 
                                        ? clauseConfig[clause.id].max 
                                        : (clause.id === 1 ? 2000000 : 
                                           clause.id === 2 ? 100000 : 
                                           clause.id === 3 ? 15000 : 
                                           clause.id === 7 ? 20000 : 
                                           clause.id === 8 ? 50000 : 
                                           clause.id === 9 ? 15000 : 
                                           clause.id === 10 ? 50000 : 
                                           clause.id === 11 ? 15000 : 
                                           clause.id === 12 ? 2000000 : 
                                           clause.id === 13 ? 50000 : 
                                           clause.id === 15 ? 500 : 150);
                                      const newValue = Math.min(currentValue + step, max);
                                      handleClauseAmountChange(clause.id, newValue);
                                    }}
                                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 active:bg-gray-400 rounded-full text-gray-700 font-bold text-lg sm:text-base focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation ml-2"
                                    aria-label="Increase value"
                                  >
                                    +
                                  </button>
                                </div>
                                
                                {/* Current value display */}
                                <div className="text-center" style={{ marginTop: '-8px' }}>
                                  <Typography className="text-primary font-semibold whitespace-nowrap" fontWeight="medium" sx={{ lineHeight: 1.1 }}>
                                    <span className="text-sm font-semibold">
                                      {customClauseAmounts[clause.id] ?
                                        parseInt(customClauseAmounts[clause.id]).toLocaleString() :
                                        (clause.id === 1 ? "100,000" : "0")} {currencySymbol}
                                      </span>
                                  </Typography>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    ) : null
                  ))}
                </div>

                {/* Statistics section - same design as tariff presets */}
                <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden border border-gray-300 shadow-md">
                  <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                          Застрахователна премия
                        </span>
                      </div>
                      <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                        {formatCurrency(
                            CalcStatisticsService.calculate(
                                customPackageStatistics.statistics.total_premium,
                                customPackageStatistics.tax_percent,
                                customPackageStatistics.discount_percent,
                                promoDiscount
                            ).insurancePremiumAmount
                        )} {currencySymbol}
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                          Застрахователна премия след отстъпка {customPackageStatistics.discount_percent}%
                        </span>
                      </div>
                      <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                        {formatCurrency(
                            CalcStatisticsService.calculate(
                                customPackageStatistics.statistics.total_premium,
                                customPackageStatistics.tax_percent,
                                customPackageStatistics.discount_percent,
                                promoDiscount
                            ).regularDiscountAmount
                        )} {currencySymbol}
                      </div>
                    </div>
                  </div>

                  {/* Show premium after promo code if a valid promo code is applied */}
                  {promoCodeValid && promoDiscount && customPackageStatistics.statistics.discounted_premium && (
                      <div className="border-b border-gray-200 bg-gray-100 p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium">
                              Застрахователна премия след приложен промо код {promoDiscount}%
                            </span>
                          </div>
                          <div className="font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                            <span className="text-primary">
                              {formatCurrency(
                                  CalcStatisticsService.calculate(
                                      customPackageStatistics.statistics.total_premium,
                                      customPackageStatistics.tax_percent,
                                      customPackageStatistics.discount_percent,
                                      promoDiscount
                                  ).promoDiscountAmount
                              )} {currencySymbol}
                            </span>
                          </div>
                        </div>
                      </div>
                  )}

                  <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-start sm:items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 mt-1 sm:mt-0 flex-shrink-0"></span>
                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                          Данък върху застрахователната премия {customPackageStatistics.tax_percent}%
                        </span>
                      </div>
                      <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto">
                        {formatCurrency(
                            CalcStatisticsService.calculate(
                                customPackageStatistics.statistics.total_premium,
                                customPackageStatistics.tax_percent,
                                customPackageStatistics.discount_percent,
                                promoDiscount
                            ).taxAmount
                        )} {currencySymbol}
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 bg-gray-100 p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-start sm:items-center mb-1.5 sm:mb-0">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 mt-0.5 sm:mt-0 flex-shrink-0"></span>
                        <span className="uppercase text-gray-800 text-xs sm:text-sm font-medium leading-tight">
                          Общо дължима сума за една година
                        </span>
                      </div>
                      <div className="text-primary font-semibold text-sm sm:text-base sm:ml-2 self-end sm:self-auto pulse">
                        {formatCurrency(
                            CalcStatisticsService.calculate(
                                customPackageStatistics.statistics.total_premium,
                                customPackageStatistics.tax_percent,
                                customPackageStatistics.discount_percent,
                                promoDiscount
                            ).totalAmount
                        )} {currencySymbol}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Choose button for custom package */}
                <div className="flex flex-col w-full sm:items-center mt-5">
                  {validationError && (
                    <div className="mb-3 text-red-600 text-sm text-center w-full bg-red-100 p-2 rounded-md border border-red-300">
                      {validationError}
                    </div>
                  )}
                  <ProceedButton
                    onClick={handleCustomPackageSelect}
                    text={isCustomPackageSelected ? 'ИЗБРАНО ✓' : 'ИЗБЕРИ'}
                    showIcon={!isCustomPackageSelected}
                    className={`w-full sm:w-auto px-6 sm:px-8 shadow-md min-h-[56px] sm:min-h-0`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
        <BackButton onClick={prevStep} className="shadow-md" />
      </div>
    </form>
  );
};

export default CoveredRisksForm;
