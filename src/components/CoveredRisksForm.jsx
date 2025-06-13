import React, { useState, useEffect, useCallback } from 'react';
import BackButton from './BackButton';
import ProceedButton from './ProceedButton';
import api from '../services/api';
import { debounce } from 'lodash';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { formatCurrency } from '../utils/formatters';
import ArrowForward from "@mui/icons-material/ArrowForward";

const CoveredRisksForm = ({ formData, nextStep, prevStep, lastOpenedAccordion, setLastOpenedAccordion, customClauseAmounts, setCustomClauseAmounts, selectedRisks, setSelectedRisks, isCustomPackageSelected, setIsCustomPackageSelected, setSelectedTariff, currencySymbol, clauseCheckboxes, setClauseCheckboxes }) => {
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

    const fetchTariffPresets = async () => {
      try {
        const response = await api.get('/api/v1/insurance-policies/admin/tariff-presets', {
          params: {
            settlement_id: formData.settlement_id,
            distance_to_water_id: formData.distance_to_water_id
          }
        });

        const data = Array.isArray(response.data) ? response.data : [];
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
          data.forEach(preset => {
            initialSelectedRisks[preset.id] = false;
          });
          setSelectedRisks(initialSelectedRisks);
        }

        // Extract all unique clauses from all presets
        const uniqueClauses = [];
        const clauseMap = {};

        data.forEach(preset => {
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

        // Log the clauses to check if allow_custom_amount is present
        console.log('All unique clauses:', uniqueClauses);

        setAllClauses(uniqueClauses);

        // Initialize custom clause amounts only if they're empty
        if (Object.keys(customClauseAmounts).length === 0) {
          const initialCustomAmounts = {};
          uniqueClauses.forEach(clause => {
            // All clauses should be empty by default
            initialCustomAmounts[clause.id] = '';
          });
          setCustomClauseAmounts(initialCustomAmounts);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching tariff presets:', err);
        setError('Failed to load tariff presets');
        setLoading(false);
      }
    };

    fetchTariffPresets();
  }, [formData, customClauseAmounts, setCustomClauseAmounts, selectedRisks, setSelectedRisks]);

  const toggleAccordion = (id) => {
    setExpandedItems(prev => {
      // If the clicked item is already expanded, collapse it
      if (prev[id]) {
        setLastOpenedAccordion(null);
        return {};
      }
      // Otherwise, collapse all items and expand only the clicked one
      setLastOpenedAccordion(id);
      return { [id]: true };
    });
    // Close custom package when opening a preset
    setIsCustomPackageExpanded(false);
  };

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
    // Deselect custom package when selecting a preset
    setIsCustomPackageSelected(false);

    // Find the selected tariff preset
    const selectedPreset = tariffPresets.find(preset => preset.id === presetId);
    if (selectedPreset) {
      setSelectedTariff(selectedPreset);
    }

    // Go directly to the next step without changing the button state
    nextStep();
  };


  // Function to calculate statistics for custom package
  const calculateCustomPackageStatistics = async () => {
    try {
      // Only call API if custom package is expanded
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

  // Call API when custom clause amounts change
  useEffect(() => {
    debouncedCalculate();

    // Cleanup function
    return () => {
      debouncedCalculate.cancel();
    };
  }, [debouncedCalculate]);

  const handleClauseAmountChange = (clauseId, value) => {
    // Only allow numeric values (digits and decimal point)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Update the value for the current clause
      setCustomClauseAmounts(prev => {
        const updatedAmounts = {
          ...prev,
          [clauseId]: value
        };

        // If clause 1 or 2 was changed and clause 6 checkbox is checked, update clause 6 value
        if ((clauseId === 1 || clauseId === 2) && clauseCheckboxes[6]) {
          const clause1Value = clauseId === 1 ? value : prev[1];
          const clause2Value = clauseId === 2 ? value : prev[2];

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
    }
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
    // Check if-clause id = 1 has a valid value between 100,000 and 600,000
    const clause1Value = customClauseAmounts[1];
    const clause1ValueNum = parseFloat(clause1Value);

    if (!clause1Value || clause1Value === '' || clause1Value === '0' || isNaN(clause1ValueNum) || clause1ValueNum < 100000 || clause1ValueNum > 2000000) {
      setValidationError('Клауза "Пожар и щети - Недвижимо имущество" е задължителна и стойността трябва да бъде между 100000 и 2000000.');
      return; // Don't proceed if validation fails
    }

    // Check if clause 6 is filled when its checkbox is checked
    if (clauseCheckboxes[6]) {
      const clause6Value = customClauseAmounts[6];

      if (!clause6Value || clause6Value === '' || clause6Value === '0') {
        setValidationError('Моля, попълнете стойност за клауза 6.');
        return; // Don't proceed if validation fails
      }
    }

    // Check if clauses 14 and 16 are filled when both checkboxes are checked
    if (clauseCheckboxes[14] && clauseCheckboxes[16]) {
      const clause14Value = customClauseAmounts[14];
      const clause16Value = customClauseAmounts[16];

      if (!clause14Value || clause14Value === '' || clause14Value === '0' || 
          !clause16Value || clause16Value === '' || clause16Value === '0') {
        setValidationError('Моля, попълнете стойности за клаузи 14 и 16.');
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
          // If checkbox is checked, include with value (which should be 150)
          // If checkbox is unchecked, include with empty value
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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <style>
        {`
          @keyframes colorPulse {
            0%, 100% { color: white; }
            50% { color: #ffcc00; }
          }
        `}
      </style>
      <div className="bg-white/10 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 border border-white/20">
        <h3 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">
          Покрити рискове
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {tariffPresets.map((preset) => (
            <div key={preset.id} className="border border-white/20 rounded-lg overflow-hidden shadow-sm">
              {/* Accordion Header - enhanced for mobile */}
              <div 
                className="flex items-center justify-between p-3 sm:p-4 bg-white/10 cursor-pointer hover:bg-white/15 active:bg-white/20 transition-colors duration-150 rounded-t-lg"
                onClick={() => toggleAccordion(preset.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-white font-medium text-base sm:text-lg sm:mr-3">{preset.name}</span>
                    <div className="flex items-center mt-1 sm:mt-0">
                      <span className="text-white text-md font-semibold whitespace-nowrap">
                        {formatCurrency(preset.tariff_preset_clauses.find(clause => clause.insurance_clause.id === 1)?.tariff_amount || "0")} {currencySymbol}
                      </span>
                      <ArrowForward className="mx-2 text-white" fontSize="small" />
                      <span className="text-white text-md font-semibold whitespace-nowrap">{formatCurrency(preset.statistics.total_amount)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-full p-1.5 ml-2">
                  <svg 
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform flex-shrink-0 ${expandedItems[preset.id] ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Accordion Content */}
              {expandedItems[preset.id] && (
                <div className="p-3 bg-white/5">
                  {/* Header - hidden on mobile */}
                  <div className="hidden sm:flex justify-between border-b border-white/10 py-1 mb-1">
                    <div className="font-medium text-white text-sm sm:text-base">Клаузи</div>
                    <div className="font-medium text-white text-sm sm:text-base">Застрахователна сума</div>
                  </div>

                  {/* Clause rows - mobile optimized */}
                  <div className="space-y-1">
                    {preset.tariff_preset_clauses
                      .filter(clause => parseFloat(clause.tariff_amount) !== 0)
                      .map((clause) => (
                      <div key={clause.id} className="flex justify-between items-center border-b border-white/10 py-2">
                        <div className="text-white text-sm sm:text-base pr-2 flex-1">{clause.insurance_clause.name}</div>
                        <div className="text-white text-sm sm:text-base text-right font-semibold text-[#ffcc00] whitespace-nowrap" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>
                          {formatCurrency(clause.tariff_amount)} {currencySymbol}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Statistics section - enhanced for mobile */}
                  {preset.statistics && (
                    <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden border border-white/20 shadow-md">
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex items-center mb-1 sm:mb-0">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(preset.statistics.total_premium)} {currencySymbol}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex items-center mb-1 sm:mb-0">
                            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия след отстъпка от {preset.discount_percent}%</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(preset.statistics.discounted_premium)} {currencySymbol}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10 bg-white/5 p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex items-center mb-1 sm:mb-0">
                            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="uppercase text-white text-xs sm:text-sm font-medium">{preset.tax_percent}% данък върху застрахователната премия</span>
                          </div>
                          <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(preset.statistics.tax_amount)} {currencySymbol}</div>
                        </div>
                      </div>
                      <div className="bg-[#8b2131]/70 p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex items-center mb-1 sm:mb-0">
                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse flex-shrink-0"></span>
                            <span className="uppercase text-white text-sm sm:text-base font-bold">Общо дължима сума за една година</span>
                          </div>
                          <div className="text-white font-bold text-lg sm:text-xl sm:ml-2 self-end sm:self-auto" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>{formatCurrency(preset.statistics.total_amount)} {currencySymbol}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Choose button - enhanced for mobile */}
                  <div className="flex w-full sm:justify-center mt-5">
                    <ProceedButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRiskChange(preset.id);
                      }}
                      text={selectedRisks[preset.id] ? 'ИЗБРАНО ✓' : 'ИЗБЕРИ'}
                      showIcon={!selectedRisks[preset.id]}
                      className={`w-full sm:w-auto px-6 sm:px-8 ${selectedRisks[preset.id] ? 'border-white text-primary bg-white' : ''} shadow-md min-h-[52px] sm:min-h-0`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Custom Package Accordion */}
          <div className="border border-white/20 rounded-lg overflow-hidden shadow-sm mt-4">
            {/* Custom Package Accordion Header */}
            <div 
              className="flex items-center justify-between p-3 sm:p-4 bg-white/10 cursor-pointer hover:bg-white/15 active:bg-white/20 transition-colors duration-150 rounded-t-lg"
              onClick={toggleCustomPackage}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="text-white font-medium text-base sm:text-lg">Пакет по избор</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-full p-1.5 ml-2">
                <svg 
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform flex-shrink-0 ${isCustomPackageExpanded ? 'transform rotate-180' : ''}`} 
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
              <div className="p-3 bg-white/5">
                {/* Header - hidden on mobile */}
                <div className="hidden sm:flex justify-between border-b border-white/10 py-1 mb-1">
                  <div className="font-medium text-white text-sm sm:text-base">Клаузи</div>
                  <div className="font-medium text-white text-sm sm:text-base">Застрахователна сума</div>
                </div>

                {/* Clause rows with input fields - mobile optimized */}
                <div className="space-y-1">
                  {allClauses.map((clause) => (
                    // Hide clause with id = 3 if estate_type_id is not 4
                    (clause.id !== 3 || formData.estate_type_id === '4') ? (
                    <div key={clause.id} className="flex justify-between items-center border-b border-white/10 py-2">
                      <div className="text-white text-sm sm:text-base pr-2 flex-1">{clause.name}</div>
                      <div className="w-full sm:w-40">
                        {clause.allow_custom_amount && (
                          <div className="relative rounded-md shadow-sm">
                            {(clause.id === 6 || clause.id === 14 || clause.id === 16) && (
                              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2.5 sm:pl-2 z-10">
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
                            <input
                              type="text"
                              value={customClauseAmounts[clause.id]}
                              onChange={(e) => handleClauseAmountChange(clause.id, e.target.value)}
                              placeholder={(clause.id === 14 || clause.id === 16) ? "150" : "Сума"}
                              className={`w-full pr-12 ${(clause.id === 6 || clause.id === 14 || clause.id === 16) ? 'pl-10 sm:pl-8' : 'px-3'} py-3.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#8B2131] focus:border-[#8B2131] text-black text-base sm:text-base touch-manipulation ${(clause.id === 6 || clause.id === 14 || clause.id === 16) ? 'bg-gray-100' : ''}`}
                              readOnly={clause.id === 6 || clause.id === 14 || clause.id === 16}
                              {...(clause.id === 1 ? {
                                min: "100000",
                                max: "2000000",
                                required: true
                              } : clause.id === 2 ? {
                                min: "0",
                                max: "100000"
                              } : clause.id === 3 ? {
                                min: "0",
                                max: "15000"
                              } : clause.id === 6 && clauseCheckboxes[6] ? {
                                required: true
                              } : (clause.id === 14 || clause.id === 16) && clauseCheckboxes[14] && clauseCheckboxes[16] ? {
                                required: true
                              } : {})}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-700 text-sm sm:text-base font-medium">{currencySymbol}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    ) : null
                  ))}
                </div>

                {/* Statistics section - same design as tariff presets */}
                <div className="mt-4 sm:mt-6 rounded-lg overflow-hidden border border-white/20 shadow-md">
                  <div className="border-b border-white/10 bg-white/5 p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 flex-shrink-0"></span>
                        <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия</span>
                      </div>
                      <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(customPackageStatistics.statistics.total_premium)} {currencySymbol}</div>
                    </div>
                  </div>
                  <div className="border-b border-white/10 bg-white/5 p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
                        <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия след отстъпка от {customPackageStatistics.discount_percent}%</span>
                      </div>
                      <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(customPackageStatistics.statistics.discounted_premium)} {currencySymbol}</div>
                    </div>
                  </div>
                  <div className="border-b border-white/10 bg-white/5 p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2 flex-shrink-0"></span>
                        <span className="uppercase text-white text-xs sm:text-sm font-medium">{customPackageStatistics.tax_percent}% данък върху застрахователната премия</span>
                      </div>
                      <div className="text-[#ffcc00] font-semibold text-base sm:text-lg sm:ml-2 self-end sm:self-auto">{formatCurrency(customPackageStatistics.statistics.tax_amount)} {currencySymbol}</div>
                    </div>
                  </div>
                  <div className="bg-[#8b2131]/70 p-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse flex-shrink-0"></span>
                        <span className="uppercase text-white text-sm sm:text-base font-bold">Общо дължима сума за една година</span>
                      </div>
                      <div className="text-white font-bold text-lg sm:text-xl sm:ml-2 self-end sm:self-auto" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>{formatCurrency(customPackageStatistics.statistics.total_amount)} {currencySymbol}</div>
                    </div>
                  </div>
                </div>

                {/* Choose button for custom package */}
                <div className="flex w-full sm:justify-center mt-5">
                  {validationError && (
                    <div className="mb-3 text-red-300 text-sm text-center w-full">
                      {validationError}
                    </div>
                  )}
                  <ProceedButton
                    onClick={handleCustomPackageSelect}
                    text={isCustomPackageSelected ? 'ИЗБРАНО ✓' : 'ИЗБЕРИ'}
                    showIcon={!isCustomPackageSelected}
                    className={`w-full sm:w-auto px-6 sm:px-8 ${isCustomPackageSelected ? 'border-white text-primary bg-white' : ''} shadow-md min-h-[52px] sm:min-h-0`}
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
