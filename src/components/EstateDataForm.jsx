import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner.jsx';
import ErrorDisplay from './ui/ErrorDisplay.jsx';
import { ArrowForward } from '@mui/icons-material';

const EstateDataForm = ({ formData, handleChange, nextStep }) => {
  const [showSettlementOptions, setShowSettlementOptions] = useState(false);
  const [filteredSettlements, setFilteredSettlements] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [settlementInput, setSettlementInput] = useState('');
  const [estateTypes, setEstateTypes] = useState([]);
  const [estateSubtypes, setEstateSubtypes] = useState([]);
  const [distanceToWater, setDistanceToWater] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const settlementRef = useRef(null);

  useEffect(() => {
    // Use the data from the global variable set by MultiStepForm
    if (window.initialFormData) {
      setEstateTypes(window.initialFormData.estate_types || []);
      setDistanceToWater(window.initialFormData.water_distances || []);
      setLoading(false);
    } else {
      // If initialFormData is not available, keep loading state true
      // This will show the loading indicator until the data is available
      setLoading(true);
      // Check again after a short delay
      const checkInterval = setInterval(() => {
        if (window.initialFormData) {
          setEstateTypes(window.initialFormData.estate_types || []);
          setDistanceToWater(window.initialFormData.water_distances || []);
          setLoading(false);
          clearInterval(checkInterval);
        }
      }, 100); // Check every 100ms

      // Clean up interval on component unmount
      return () => clearInterval(checkInterval);
    }
  }, []);

  useEffect(() => {
    if (formData.estate_type_id) {
      const fetchEstateSubtypes = async () => {
        try {
          const response = await api.get(`/api/v1/form-data/estate-subtypes/${formData.estate_type_id}`);
          // Ensure response.data is an array
          const data = Array.isArray(response.data) ? response.data : [];
          setEstateSubtypes(data);
        } catch (err) {
          console.error('Error fetching estate subtypes:', err);
          setError('Failed to load estate subtypes');
          setEstateSubtypes([]); // Ensure estateSubtypes is an array even on error
        }
      };

      fetchEstateSubtypes();
    } else {
      setEstateSubtypes([]);
    }
  }, [formData.estate_type_id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    nextStep();
  };

  const handleSettlementInputChange = (e) => {
    const value = e.target.value;
    setSettlementInput(value);

    if (value.trim() === '') {
      setFilteredSettlements([]);
      setShowSettlementOptions(false);
      return;
    }

    // Fetch settlements from API
    const fetchSettlements = async () => {
      try {
        const response = await api.get('/api/v1/form-data/settlements', {
          params: { query: value }
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setFilteredSettlements(data);
        setShowSettlementOptions(data.length > 0);
      } catch (err) {
        console.error('Error fetching settlements:', err);
        setFilteredSettlements([]);
        setShowSettlementOptions(false);
      }
    };

    fetchSettlements();
  };

  const handleSettlementSelect = (settlement) => {
    handleChange({ target: { name: 'settlement_id', value: settlement.id } });
    setSelectedSettlement(settlement);
    setSettlementInput(`${settlement.name}`);
    setShowSettlementOptions(false);
  };

  // Fetch selected settlement when settlement_id changes
  useEffect(() => {
    if (formData.settlement_id) {
      const fetchSelectedSettlement = async () => {
        try {
          const response = await api.get(`/api/v1/form-data/settlements`, {
            params: { id: formData.settlement_id }
          });
          const data = Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
          setSelectedSettlement(data);
          if (data) {
            setSettlementInput(`${data.name}, ${data.post_code}`);
          }
        } catch (err) {
          console.error('Error fetching selected settlement:', err);
          setSelectedSettlement(null);
        }
      };

      fetchSelectedSettlement();
    } else {
      setSelectedSettlement(null);
      setSettlementInput('');
    }
  }, [formData.settlement_id]);

  // Handle click outside to dismiss settlement options
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settlementRef.current && !settlementRef.current.contains(event.target)) {
        setShowSettlementOptions(false);
      }
    };

    if (showSettlementOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettlementOptions]);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Settlement autocomplete */}
        <div className="relative" ref={settlementRef}>
          <label htmlFor="settlement_id" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
            Населено място на имота <span className="text-red-300">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="settlement_input"
              value={settlementInput}
              onChange={handleSettlementInputChange}
              onFocus={() => setShowSettlementOptions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowSettlementOptions(false);
                }
              }}
              placeholder="Въведете населено място"
              className="pl-8 sm:pl-10 py-3.5 sm:py-2.5 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary focus:border-primary text-base sm:text-base text-black touch-manipulation"
              autoComplete="off"
              autoFocus={true}
              required
            />
            <input type="hidden" name="settlement_id" value={formData.settlement_id || ''} />
          </div>
          {showSettlementOptions && filteredSettlements.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-48 sm:max-h-60 rounded-md py-1 text-sm sm:text-base overflow-auto focus:outline-none text-black">
              {filteredSettlements.map(settlement => (
                <div
                  key={settlement.id}
                  onClick={() => handleSettlementSelect(settlement)}
                  className="cursor-pointer select-none relative py-4 sm:py-3 px-4 sm:pl-10 sm:pr-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation border-b border-gray-100 last:border-b-0 text-base"
                >
                  {settlement.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estate type dropdown */}
        {estateTypes.length > 0 && (
          <div>
            <label htmlFor="estate_type_id" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
              Tип имот <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <select
                id="estate_type_id"
                name="estate_type_id"
                value={formData.estate_type_id}
                onChange={handleChange}
                className="appearance-none mt-1 block w-full pl-3 pr-10 py-3.5 sm:py-2.5 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md text-black touch-manipulation"
                required
              >
                <option value="">Изберете тип имот</option>
                {estateTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>

            </div>
          </div>
        )}

        {/* Estate subtype dropdown */}
        {+formData.estate_type_id > 0 && estateTypes.length > 0 && (
          <div>
            <label htmlFor="estate_subtype_id" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
              Вид имот <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <select
                id="estate_subtype_id"
                name="estate_subtype_id"
                value={formData.estate_subtype_id}
                onChange={handleChange}
                className="appearance-none mt-1 block w-full pl-3 pr-10 py-3.5 sm:py-2.5 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md text-black touch-manipulation"
                required
              >
                <option value="">Изберете вид имот</option>
                {estateSubtypes.map(subtype => (
                  <option key={subtype.id} value={subtype.id}>
                    {subtype.name}
                  </option>
                ))}
              </select>

            </div>
          </div>
        )}

        {/* Distance to water dropdown */}
        <div>
          <label htmlFor="distance_to_water_id" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
            Отстояние от воден басейн <span className="text-red-300">*</span>
          </label>
          <div className="relative">
            <select
              id="distance_to_water_id"
              name="distance_to_water_id"
              value={formData.distance_to_water_id}
              onChange={handleChange}
              className="appearance-none mt-1 block w-full pl-3 pr-10 py-3.5 sm:py-2.5 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md text-black touch-manipulation"
              required
            >
              <option value="">Изберете отстояние</option>
              {distanceToWater.map(distance => (
                <option key={distance.id} value={distance.id}>
                  {distance.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Area with suffix */}
        <div>
          <label htmlFor="area_sq_meters" className="block text-sm sm:text-base font-medium text-white mb-1 sm:mb-2">
            РЗП <span className="text-red-300">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              id="area_sq_meters"
              name="area_sq_meters"
              value={formData.area_sq_meters}
              onChange={handleChange}
              placeholder="Въведете площ"
              min="1"
              max="1000000"
              className="block w-full pr-16 py-3.5 sm:py-2.5 text-base sm:text-base border-gray-300 rounded-md focus:ring-primary focus:border-primary text-black touch-manipulation"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-700 text-sm sm:text-base font-medium">кв.м.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-3 sm:pt-4">
        <button
          type="submit"
          className="inline-flex items-center justify-center py-4 sm:py-3 px-6 sm:px-6 border border-transparent shadow-md text-base sm:text-base font-medium rounded-full text-white bg-primary-dark hover:bg-primary-darker active:bg-primary-darkest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-200 hover:scale-105 touch-manipulation w-full sm:w-auto min-h-[56px] sm:min-h-0"
        >
          ПРОДЪЛЖИ <ArrowForward className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </form>
  );
};

export default EstateDataForm;
