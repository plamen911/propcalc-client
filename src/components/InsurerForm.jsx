import React, { useState, useEffect, useRef } from 'react';
import {ArrowForward, CalendarMonth, CheckCircle, Close, LocalOffer} from '@mui/icons-material';
import BackButton from './BackButton';
import ProceedButton from './ProceedButton';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { formatCurrency } from '../utils/formatters';

const InsurerForm = ({ 
  nextStep, 
  prevStep, 
  selectedTariff, 
  insurerData, 
  setInsurerData, 
  checkedItems, 
  setCheckedItems,
  currencySymbol,
  promoCode,
  setPromoCode,
  promoCodeValid,
  setPromoCodeValid,
  promoCodeError,
  setPromoCodeError,
  promoDiscount,
  setPromoDiscount,
  promoDiscountedAmount,
  setPromoDiscountedAmount,
  validatingPromo,
  setValidatingPromo,
  promoCodeId,
  setPromoCodeId,
  formData
}) => {
  const [showPromoSuccess, setShowPromoSuccess] = useState(false);
  const [propertyChecklistItems, setPropertyChecklistItems] = useState([]);
  const [personRoleOptions, setPersonRoleOptions] = useState([]);
  const [idNumberTypeOptions, setIdNumberTypeOptions] = useState([]);
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [showSettlementOptions, setShowSettlementOptions] = useState(false);
  const [filteredSettlements, setFilteredSettlements] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [propertySettlement, setPropertySettlement] = useState(null);
  const [settlementInput, setSettlementInput] = useState('');
  const [errors, setErrors] = useState([]);
  const [invalidFields, setInvalidFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  const settlementRef = useRef(null);

  // Initialize tempDate when birth_date changes
  useEffect(() => {
    if (insurerData.birth_date) {
      const date = new Date(insurerData.birth_date);
      setTempDate({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      });
    }
  }, [insurerData.birth_date]);

  // Hide promo success message after 5 seconds
  useEffect(() => {
    if (showPromoSuccess) {
      const timer = setTimeout(() => {
        setShowPromoSuccess(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showPromoSuccess]);

  // Recalculate promoDiscountedAmount when selectedTariff changes
  useEffect(() => {
    if (promoCodeValid && promoDiscount && selectedTariff && selectedTariff.statistics && selectedTariff.statistics.total_premium) {
      // Get the original premium
      const originalPremium = selectedTariff.statistics.total_premium;
      // Calculate promo discount amount based on the original premium
      const promoDiscountAmount = Math.round((originalPremium * (promoDiscount / 100)) * 100) / 100;
      // Calculate premium after both discounts
      const premiumAfterBothDiscounts = selectedTariff.statistics.discounted_premium - promoDiscountAmount;
      // Calculate tax on the premium after both discounts
      const taxAmount = Math.round((premiumAfterBothDiscounts * (selectedTariff.tax_percent / 100)) * 100) / 100;
      // Calculate total amount (premium after both discounts + tax)
      const totalAmount = premiumAfterBothDiscounts + taxAmount;
      setPromoDiscountedAmount(totalAmount);
    }
  }, [selectedTariff, promoCodeValid, promoDiscount]);

  // Fetch form data when the component mounts
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Fetch person role options
        const personRoleResponse = await api.get('/api/v1/form-data/person-role');
        const personRoleData = Array.isArray(personRoleResponse.data) ? personRoleResponse.data : [];
        // Add empty option with label "Изберете"
        setPersonRoleOptions([{ id: "", name: "Изберете" }, ...personRoleData]);

        // Fetch id number type options
        const idNumberTypeResponse = await api.get('/api/v1/form-data/id-number-type');
        const idNumberTypeData = Array.isArray(idNumberTypeResponse.data) ? idNumberTypeResponse.data : [];
        setIdNumberTypeOptions(idNumberTypeData);

        // Fetch property checklist items
        const propertyChecklistResponse = await api.get('/api/v1/form-data/property-checklist');
        const propertyChecklistData = Array.isArray(propertyChecklistResponse.data) ? propertyChecklistResponse.data : [];
        setPropertyChecklistItems(propertyChecklistData);

        // Fetch nationality options
        try {
          const nationalityResponse = await api.get('/api/v1/form-data/nationalities');
          const nationalityData = Array.isArray(nationalityResponse.data) ? nationalityResponse.data : [];
          setNationalityOptions(nationalityData);
        } catch (nationalityErr) {
          console.error('Error fetching nationality data:', nationalityErr);
          setNationalityOptions([]);
        }

        // Initialize checkedItems with undefined values (no selection) only if they are empty
        if (Object.keys(checkedItems).length === 0) {
          const initialCheckedItems = {};
          propertyChecklistData.forEach(item => {
            initialCheckedItems[item.id] = undefined;
          });
          setCheckedItems(initialCheckedItems);
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setErrors(['Failed to load form data']);
        setPersonRoleOptions([]);
        setIdNumberTypeOptions([]);
        setPropertyChecklistItems([]);
        setNationalityOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, []);

  // Handle settlement input change
  const handleSettlementInputChange = (e) => {
    const value = e.target.value;
    setSettlementInput(value);

    if (value.trim() === '') {
      setFilteredSettlements([]);
      setShowSettlementOptions(false);
      return;
    }

    // Clear the field from invalidFields when the user changes its value
    if (invalidFields.includes('insurer_settlement_id')) {
      setInvalidFields(prev => prev.filter(field => field !== 'insurer_settlement_id'));
      if (invalidFields.length === 1) {
        setErrors([]); // Clear error messages if this was the last invalid field
      }
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

  // Handle settlement selection
  const handleSettlementSelect = (settlement) => {
    setInsurerData(prev => ({
      ...prev,
      insurer_settlement_id: settlement.id
    }));
    setSelectedSettlement(settlement);
    setSettlementInput(`${settlement.name}`);
    setShowSettlementOptions(false);

    // Clear the field from invalidFields when the user selects a settlement
    if (invalidFields.includes('insurer_settlement_id')) {
      setInvalidFields(prev => prev.filter(field => field !== 'insurer_settlement_id'));
      if (invalidFields.length === 1) {
        setErrors([]); // Clear error messages if this was the last invalid field
      }
    }
  };

  // Fetch selected settlement when insurer_settlement_id changes
  useEffect(() => {
    const fetchSelectedSettlement = async (settlementId) => {
      try {
        const response = await api.get(`/api/v1/form-data/settlements`, {
          params: { id: settlementId }
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

    if (insurerData.insurer_settlement_id) {
      fetchSelectedSettlement(insurerData.insurer_settlement_id);
    } else {
      setSelectedSettlement(null);
      setSettlementInput('');
    }
  }, [insurerData.insurer_settlement_id]);

  // Fetch property settlement when formData.settlement_id changes
  useEffect(() => {
    const fetchPropertySettlement = async (settlementId) => {
      try {
        const response = await api.get(`/api/v1/form-data/settlements`, {
          params: { id: settlementId }
        });
        const data = Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null;
        setPropertySettlement(data);
      } catch (err) {
        console.error('Error fetching property settlement:', err);
        setPropertySettlement(null);
      }
    };

    if (formData && formData.settlement_id) {
      fetchPropertySettlement(formData.settlement_id);
    } else {
      setPropertySettlement(null);
    }
  }, [formData]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Create a new state object with the updated field
    const newState = {
      ...insurerData,
      [name]: value
    };

    // If the person_role_id is changed to "1" and certain fields are empty, copy values from property owner
    if (name === 'person_role_id' && value === '1') {
      // Check if the fields are empty
      const isFullNameEmpty = !insurerData.full_name || insurerData.full_name.trim() === '';
      const isIdNumberEmpty = !insurerData.id_number || insurerData.id_number.trim() === '';
      const isSettlementEmpty = !insurerData.insurer_settlement_id;
      const isPhoneEmpty = !insurerData.phone || insurerData.phone.trim() === '';
      const isEmailEmpty = !insurerData.email || insurerData.email.trim() === '';

      // If all fields are empty, copy values from property owner
      if (isFullNameEmpty && isIdNumberEmpty && isSettlementEmpty && isPhoneEmpty && isEmailEmpty) {
        // Copy property_owner_name to full_name if available
        if (insurerData.property_owner_name && insurerData.property_owner_name.trim() !== '') {
          newState.full_name = insurerData.property_owner_name;
        }

        // Copy property_owner_id_number to id_number if available
        if (insurerData.property_owner_id_number && insurerData.property_owner_id_number.trim() !== '') {
          newState.id_number = insurerData.property_owner_id_number;
        }

        // Copy property_owner_id_number_type_id to id_number_type_id if available
        if (insurerData.property_owner_id_number_type_id) {
          newState.id_number_type_id = insurerData.property_owner_id_number_type_id;
        }

        // Copy property_settlement to settlement_input if available
        if (propertySettlement) {
          setSettlementInput(`${propertySettlement.name}, ${propertySettlement.post_code}`);
          newState.insurer_settlement_id = formData.settlement_id;
        }

        // Copy property_address to permanent_address if available
        if (insurerData.property_address && insurerData.property_address.trim() !== '') {
          newState.permanent_address = insurerData.property_address;
        }
      }
    }

    // Update the state with the new values
    setInsurerData(newState);

    // Clear the field from invalidFields when the user changes its value
    if (invalidFields.includes(name)) {
      setInvalidFields(prev => prev.filter(field => field !== name));
      if (invalidFields.length === 1) {
        setErrors([]); // Clear error messages if this was the last invalid field
      }
    }
  };

  // Handle opening the date picker dialog
  const handleOpenDatePicker = () => {
    // Initialize tempDate with current birth_date or today's date minus 18 years
    if (insurerData.birth_date) {
      const date = new Date(insurerData.birth_date);
      setTempDate({
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
      });
    } else {
      const today = new Date();
      setTempDate({
        year: today.getFullYear() - 18,
        month: today.getMonth(),
        day: today.getDate()
      });
    }
    setDatePickerOpen(true);
  };

  // Handle closing the date picker dialog
  const handleCloseDatePicker = () => {
    setDatePickerOpen(false);
  };

  // Handle selecting a date in the date picker
  const handleDateSelect = () => {
    const { year, month, day } = tempDate;
    const newDate = new Date(year, month, day);
    const formattedDate = newDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Update insurerData with the new date
    handleChange({ target: { name: 'birth_date', value: formattedDate } });

    // Close the dialog
    setDatePickerOpen(false);
  };

  // Handle changing the year, month, or day in the date picker
  const handleDateChange = (type, value) => {
    setTempDate(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleChecklistChange = (id, value) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: value
    }));
  };

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
    // Hide success message when the code changes
    setShowPromoSuccess(false);
  };

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

        // Calculate discounted amount
        if (selectedTariff && selectedTariff.statistics && selectedTariff.statistics.total_premium) {
          // Get the original premium
          const originalPremium = selectedTariff.statistics.total_premium;
          // Calculate promo discount amount based on the original premium
          const promoDiscountAmount = Math.round((originalPremium * (response.data.discountPercentage / 100)) * 100) / 100;
          // Calculate premium after both discounts
          const premiumAfterBothDiscounts = selectedTariff.statistics.discounted_premium - promoDiscountAmount;
          // Calculate tax on the premium after both discounts
          const taxAmount = Math.round((premiumAfterBothDiscounts * (selectedTariff.tax_percent / 100)) * 100) / 100;
          // Calculate total amount (premium after both discounts + tax)
          const totalAmount = premiumAfterBothDiscounts + taxAmount;
          setPromoDiscountedAmount(totalAmount);
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

  const areAllItemsChecked = () => {
    return propertyChecklistItems.length > 0 && 
      propertyChecklistItems.every(item => checkedItems[item.id] === true || checkedItems[item.id] === false);
  };

  // Validate that full_name contains at least two Cyrillic names
  const validateFullName = (name) => {
    // Check if the name contains at least two words with Cyrillic characters
    const cyrillicRegex = /^[\u0400-\u04FF\s]+$/; // Cyrillic characters and spaces
    if (!cyrillicRegex.test(name)) {
      return false;
    }

    // Check if there are at least two words (names)
    const names = name.trim().split(/\s+/);
    return names.length >= 2;
  };

  // Validate Bulgarian Personal Identification Number (ЕГН)
  const validateEGN = (egn) => {
    if (!/^\d{10}$/.test(egn)) {
      return false;
    }

    // Extract date components
    const year = parseInt(egn.substring(0, 2));
    let month = parseInt(egn.substring(2, 4));
    const day = parseInt(egn.substring(4, 6));

    // Adjust month and determine century
    let fullYear;
    if (month > 40) {
      fullYear = 2000 + year;
      month -= 40;
    } else if (month > 20) {
      fullYear = 1800 + year;
      month -= 20;
    } else {
      fullYear = 1900 + year;
    }

    // Check if date is valid
    try {
      const date = new Date(fullYear, month - 1, day);
      if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // Check checksum
    const weights = [2, 4, 8, 5, 10, 9, 7, 3, 6];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(egn[i]) * weights[i];
    }

    const checksum = sum % 11 % 10;
    return checksum === parseInt(egn[9]);
  };

  // Validate Foreigner's Personal Identification Number (ЛНЧ)
  const validateLNCh = (lnch) => {
    return /^\d{10}$/.test(lnch);
  };

  // Validate permanent address according to the specified requirements
  const validatePermanentAddress = (address) => {
    // Allowed characters:
    // - Cyrillic letters
    // - Latin letters I, V, X
    // - Digits 0-9
    // - Punctuation marks: period, colon, semicolon, quotes
    // - Symbols: №, (, ), /
    const regex = /^[\u0400-\u04FF0-9IVXivx.,:;"№()/\s]+$/;
    return regex.test(address);
  };

  // Validate if user is at least 18 years old
  const validateAge = (birthDate) => {
    if (!birthDate) return false;

    const today = new Date();
    const birth = new Date(birthDate);

    // Calculate age
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 18;
  };

  const validateForm = () => {
    const newInvalidFields = [];
    const errorMessages = [];

    // Field labels mapping
    const fieldLabels = {
      'person_role_id': 'В качеството на',
      'full_name': 'Имена по документи за самоличност',
      'id_number_type_id': 'Тип на документ за самоличност',
      'id_number': 'Номер на документ за самоличност',
      'birth_date': 'Дата на раждане',
      'insurer_nationality_id': 'Националност',
      'gender': 'Пол',
      'insurer_settlement_id': 'Населено място',
      'permanent_address': 'Постоянен адрес',
      'phone': 'Телефон',
      'email': 'Имейл',
      'property_owner_name': 'Имена на собственика по документи за самоличност',
      'property_owner_id_number_type_id': 'Тип на документ за самоличност на собственика',
      'property_owner_id_number': 'ЕГН/ЛНЧ/Паспорт №',
      'property_address': 'Точен адрес на имота',
      'property_additional_info': 'Допълнителни данни за имота'
    };

    // Validate person_role_id
    if (!insurerData.person_role_id) {
      newInvalidFields.push('person_role_id');
      errorMessages.push(`Моля, изберете ${fieldLabels['person_role_id'].toLowerCase()}`);
    }

    // Validate full_name
    if (!insurerData.full_name.trim()) {
      newInvalidFields.push('full_name');
      errorMessages.push(`Моля, въведете ${fieldLabels['full_name'].toLowerCase()}`);
    } else if (!validateFullName(insurerData.full_name)) {
      newInvalidFields.push('full_name');
      errorMessages.push(`Полето "${fieldLabels['full_name']}" трябва да съдържа две или повече имена на кирилица.`);
    }

    // Validate id_number_type_id
    if (!insurerData.id_number_type_id) {
      newInvalidFields.push('id_number_type_id');
      errorMessages.push(`Моля, изберете ${fieldLabels['id_number_type_id'].toLowerCase()}`);
    }

    // Validate id_number based on type
    if (!insurerData.id_number.trim()) {
      newInvalidFields.push('id_number');
      errorMessages.push(`Моля, въведете ${fieldLabels['id_number'].toLowerCase()}`);
    } else if (insurerData.id_number_type_id === '1' && !validateEGN(insurerData.id_number)) {
      // Check if id_number_type_id is ЕГН (assuming id 1 is for ЕГН)
      newInvalidFields.push('id_number');
      errorMessages.push(`Невалиден номер на ЕГН в полето "${fieldLabels['id_number']}".`);
    } else if (insurerData.id_number_type_id === '2' && !validateLNCh(insurerData.id_number)) {
      // For ЛНЧ, validate that it contains 10 digits
      newInvalidFields.push('id_number');
      errorMessages.push(`Полето "ЛНЧ" трябва да съдържа 10 цифри.`);
    }

    // Check if id_number_type_id is ЛНЧ (id 2) or Паспорт № (id 3)
    if (insurerData.id_number_type_id === '2' || insurerData.id_number_type_id === '3') {
      // Validate birth date
      if (!insurerData.birth_date) {
        newInvalidFields.push('birth_date');
        errorMessages.push(`Моля, въведете ${fieldLabels['birth_date'].toLowerCase()}`);
      } else if (!validateAge(insurerData.birth_date)) {
        // Validate age (must be at least 18 years old)
        newInvalidFields.push('birth_date');
        errorMessages.push(`Застраховащият трябва да е на възраст над 18 години в полето "${fieldLabels['birth_date']}".`);
      }

      // Validate nationality
      if (!insurerData.insurer_nationality_id) {
        newInvalidFields.push('insurer_nationality_id');
        errorMessages.push(`Моля, изберете ${fieldLabels['insurer_nationality_id'].toLowerCase()}`);
      }

      // Validate gender
      if (!insurerData.gender) {
        newInvalidFields.push('gender');
        errorMessages.push(`Моля, изберете ${fieldLabels['gender'].toLowerCase()}`);
      }
    }

    // Validate other fields
    if (!insurerData.insurer_settlement_id) {
      newInvalidFields.push('insurer_settlement_id');
      errorMessages.push(`Моля, изберете ${fieldLabels['insurer_settlement_id'].toLowerCase()}`);
    }

    if (!insurerData.permanent_address.trim()) {
      newInvalidFields.push('permanent_address');
      errorMessages.push(`Моля, въведете ${fieldLabels['permanent_address'].toLowerCase()}`);
    } else if (!validatePermanentAddress(insurerData.permanent_address)) {
      newInvalidFields.push('permanent_address');
      errorMessages.push(`Позволени символи за полето "${fieldLabels['permanent_address']}" - букви на кирилица, букви I, V, X на латиница, цифри от 0 до 9, препинателни знаци – точка, двуеточие, точка и запетая, кавички и символи - № ( ) /.`);
    }

    if (!insurerData.phone.trim()) {
      newInvalidFields.push('phone');
      errorMessages.push(`Моля, въведете ${fieldLabels['phone'].toLowerCase()}`);
    }

    if (!insurerData.email.trim() || !insurerData.email.includes('@')) {
      newInvalidFields.push('email');
      errorMessages.push(`Моля, въведете валиден ${fieldLabels['email'].toLowerCase()} адрес`);
    }

    // Validate property owner name
    if (!insurerData.property_owner_name?.trim()) {
      newInvalidFields.push('property_owner_name');
      errorMessages.push(`Моля, въведете ${fieldLabels['property_owner_name'].toLowerCase()}`);
    } else if (!validateFullName(insurerData.property_owner_name)) {
      newInvalidFields.push('property_owner_name');
      errorMessages.push(`Полето "${fieldLabels['property_owner_name']}" трябва да съдържа две или повече имена на кирилица.`);
    }

    // Validate property owner ID number type
    if (!insurerData.property_owner_id_number_type_id) {
      newInvalidFields.push('property_owner_id_number_type_id');
      errorMessages.push(`Моля, изберете ${fieldLabels['property_owner_id_number_type_id'].toLowerCase()}`);
    }

    // Validate property owner ID number
    if (!insurerData.property_owner_id_number?.trim()) {
      newInvalidFields.push('property_owner_id_number');
      errorMessages.push(`Моля, въведете ${fieldLabels['property_owner_id_number'].toLowerCase()}`);
    }

    // Validate property address
    if (!insurerData.property_address?.trim()) {
      newInvalidFields.push('property_address');
      errorMessages.push(`Моля, въведете ${fieldLabels['property_address'].toLowerCase()}`);
    } else if (!validatePermanentAddress(insurerData.property_address)) {
      newInvalidFields.push('property_address');
      errorMessages.push(`Позволени символи за полето "${fieldLabels['property_address']}" - букви на кирилица, букви I, V, X на латиница, цифри от 0 до 9, препинателни знаци – точка, двуеточие, точка и запетая, кавички и символи - № ( ) /.`);
    }

    // Validate property additional info
    if (!insurerData.property_additional_info?.trim()) {
      newInvalidFields.push('property_additional_info');
      errorMessages.push(`Моля, въведете ${fieldLabels['property_additional_info'].toLowerCase()}`);
    }

    // Update state with invalid fields and error messages
    setInvalidFields(newInvalidFields);
    setErrors(errorMessages);

    return newInvalidFields.length === 0;
  };

  // Helper function to check if a field is invalid
  const isFieldInvalid = (fieldName) => {
    return invalidFields.includes(fieldName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]); // Clear any previous errors
    setInvalidFields([]); // Clear any previous invalid fields

    if (validateForm()) {
      nextStep();
    }
  };

  // Display loading indicator
  if (loading) {
    return <LoadingSpinner />;
  }

  // Generate arrays for years, months, and days
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Always limit years to current year - 18 to ensure users are at least 18 years old
    const endYear = currentYear - 18;
    for (let i = currentYear - 100; i <= endYear; i++) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = () => {
    return [
      { value: 0, label: 'Януари' },
      { value: 1, label: 'Февруари' },
      { value: 2, label: 'Март' },
      { value: 3, label: 'Април' },
      { value: 4, label: 'Май' },
      { value: 5, label: 'Юни' },
      { value: 6, label: 'Юли' },
      { value: 7, label: 'Август' },
      { value: 8, label: 'Септември' },
      { value: 9, label: 'Октомври' },
      { value: 10, label: 'Ноември' },
      { value: 11, label: 'Декември' }
    ];
  };

  const generateDays = () => {
    const { year, month } = tempDate;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const years = generateYears();
  const months = generateMonths();
  const days = generateDays();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Picker Dialog */}
      <Dialog
        open={datePickerOpen}
        onClose={handleCloseDatePicker}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: '#1a1a1a',
            color: 'white',
            borderRadius: '0.75rem',
            padding: '0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <span className="text-lg font-medium">Изберете дата на раждане</span>
          <IconButton 
            onClick={handleCloseDatePicker} 
            style={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.5rem',
              marginRight: '-0.5rem'
            }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: '1.5rem' }}>
          <div className="space-y-6">
            {/* Year Selector */}
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-white mb-1">
                Година <span className="text-red-300">*</span>
              </label>
              <div className="relative">
                <select
                  id="year-select"
                  value={tempDate.year}
                  onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                  className="appearance-none block w-full pl-3 pr-10 py-3.5 sm:py-2 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-[#8B2131] focus:border-[#8B2131] rounded-md text-black touch-manipulation"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Selector */}
            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-white mb-1">
                Месец <span className="text-red-300">*</span>
              </label>
              <div className="relative">
                <select
                  id="month-select"
                  value={tempDate.month}
                  onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                  className="appearance-none block w-full pl-3 pr-10 py-3.5 sm:py-2 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-[#8B2131] focus:border-[#8B2131] rounded-md text-black touch-manipulation"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Day Selector */}
            <div>
              <label htmlFor="day-select" className="block text-sm font-medium text-white mb-1">
                Ден <span className="text-red-300">*</span>
              </label>
              <div className="relative">
                <select
                  id="day-select"
                  value={tempDate.day}
                  onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                  className="appearance-none block w-full pl-3 pr-10 py-3.5 sm:py-2 text-base sm:text-base border-gray-300 focus:outline-none focus:ring-[#8B2131] focus:border-[#8B2131] rounded-md text-black touch-manipulation"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleDateSelect}
                className="inline-flex items-center justify-center py-3.5 sm:py-2.5 px-6 sm:px-5 border border-transparent shadow-sm text-base sm:text-sm font-medium rounded-full text-white bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105 touch-manipulation min-h-[52px] sm:min-h-0"
              >
                Потвърди <ArrowForward className="ml-1.5" fontSize="small" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <style>
        {`
          @keyframes colorPulse {
            0%, 100% { color: white; }
            50% { color: theme('colors.accent'); }
          }
        `}
      </style>
      {selectedTariff && (
        <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4">
            Вие избрахте покритие "{selectedTariff.name}" за Вашето имущество
          </h3>

          {/* Display clauses if available */}
          {selectedTariff.tariff_preset_clauses && (
            <div className="p-3 bg-white/5 rounded-lg mb-4">
              {/* Header - hidden on mobile */}
              <div className="hidden sm:flex justify-between border-b border-white/10 py-1 mb-1">
                <div className="font-medium text-white text-sm sm:text-base">Клаузи</div>
                <div className="font-medium text-white text-sm sm:text-base">Застрахователна сума</div>
              </div>

              {/* Clause rows - mobile optimized */}
              <div className="space-y-1">
                {selectedTariff.tariff_preset_clauses
                  .filter(clause => parseFloat(clause.tariff_amount) !== 0 && clause.tariff_amount !== '')
                  .map((clause) => (
                  <div key={clause.id} className="flex justify-between items-center border-b border-white/10 py-2">
                    <div className="text-white text-sm sm:text-base pr-2 flex-1">{clause.insurance_clause.name}</div>
                    <div className="text-white text-sm sm:text-base text-right font-semibold text-accent whitespace-nowrap" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>{formatCurrency(clause.tariff_amount)} {currencySymbol}</div>
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
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия</span>
                    </div>
                    <div className="text-accent font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">{formatCurrency(selectedTariff.statistics.total_premium)} {currencySymbol}</div>
                  </div>
                </div>
              )}

              {selectedTariff.statistics.discounted_premium && selectedTariff.discount_percent && (
                <div className="border-b border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия след отстъпка {selectedTariff.discount_percent}%</span>
                    </div>
                    <div className="text-accent font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">{formatCurrency(selectedTariff.statistics.discounted_premium)} {currencySymbol}</div>
                  </div>
                </div>
              )}

              {/* Show premium after promo code if a valid promo code is applied */}
              {promoCodeValid && promoDiscount && selectedTariff.statistics.discounted_premium && (
                <div className="border-b border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      <span className="uppercase text-white text-xs sm:text-sm font-medium">Застрахователна премия след приложен промо код {promoDiscount}%</span>
                    </div>
                    <div className="text-accent font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                      {formatCurrency(selectedTariff.statistics.discounted_premium - (selectedTariff.statistics.total_premium * promoDiscount / 100))} {currencySymbol}
                    </div>
                  </div>
                </div>
              )}

              {selectedTariff.statistics.tax_amount && selectedTariff.tax_percent && (
                <div className="border-b border-white/10 bg-white/5 p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      <span className="uppercase text-white text-xs sm:text-sm font-medium">Данък върху застрахователната премия {selectedTariff.tax_percent}% </span>
                    </div>
                    <div className="text-accent font-semibold text-base sm:text-lg ml-2 whitespace-nowrap">
                      {promoCodeValid && promoDiscount 
                        ? formatCurrency((selectedTariff.statistics.discounted_premium - (selectedTariff.statistics.total_premium * promoDiscount / 100)) * (selectedTariff.tax_percent / 100)) 
                        : formatCurrency(selectedTariff.statistics.tax_amount)} 
                      {currencySymbol}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-primary/70 p-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="uppercase text-white text-sm sm:text-base font-bold">Общо дължима сума за една година</span>
                  </div>
                  <div className="text-white font-bold text-lg sm:text-xl ml-2 whitespace-nowrap" style={{animation: 'colorPulse 2s ease-in-out infinite'}}>
                    {promoCodeValid && promoDiscount 
                      ? formatCurrency(promoDiscountedAmount)
                      : formatCurrency(selectedTariff.statistics.total_amount)} 
                    {currencySymbol}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Promotional Code Section */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/20">
            <div className="flex items-center mb-2">
              <LocalOffer className="text-[#ffcc00] mr-2" />
              <h4 className="text-white text-sm sm:text-base font-medium">Имате промоционален код?</h4>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-grow relative">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={handlePromoCodeChange}
                    placeholder="Въведете промоционален код"
                    className={`w-full p-2 rounded-md border ${promoCodeError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-[#8B2131] focus:border-[#8B2131] text-black`}
                    disabled={promoCodeValid || validatingPromo}
                  />
                  {promoCodeError && (
                    <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {promoCodeError && (
                  <div className="text-red-300 text-xs mt-1">{promoCodeError}</div>
                )}
              </div>
              <button
                onClick={validatePromoCode}
                disabled={promoCodeValid || validatingPromo || !promoCode.trim()}
                className={`inline-flex items-center justify-center py-4 sm:py-2.5 px-6 sm:px-5 border border-transparent shadow-sm text-base sm:text-base font-medium rounded-full text-white ${promoCodeValid ? 'bg-green-600' : 'bg-[#6b1021] hover:bg-[#5a0d1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b1021] transition-all duration-200 hover:scale-105'} disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto touch-manipulation min-h-[56px] sm:min-h-0`}
              >
                {validatingPromo ? 'Проверка...' : promoCodeValid ? 'Приложен' : 'Приложи'}
              </button>
            </div>

            {promoCodeValid && promoDiscount && showPromoSuccess && (
              <div className="mt-4 p-3 bg-green-600/20 rounded-lg border border-green-500/30">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" />
                  <span className="text-white text-sm">Промоционален код приложен успешно! Отстъпката от {promoDiscount}% е отразена в крайната цена.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/20">
        <h3 className="text-lg font-medium text-white mb-4">
          Данни за имота
        </h3>

        <div className="space-y-4">
          {/* Property Settlement (readonly) */}
          <div>
            <label htmlFor="property_settlement" className="block text-sm font-medium text-white mb-1">
              Нас. място на имота
            </label>
            <div className="relative">
              <input
                type="text"
                id="property_settlement"
                value={propertySettlement ? `${propertySettlement.name}, ${propertySettlement.post_code}` : ''}
                readOnly
                className="block w-full rounded-md shadow-sm focus:ring-[#8B2131] focus:border-[#8B2131] sm:text-sm text-black bg-gray-100 border-gray-300"
              />
            </div>
          </div>

          {/* Property Address */}
          <div>
            <label htmlFor="property_address" className="block text-sm font-medium text-white mb-1">
              Точен адрес на имота <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="property_address"
                name="property_address"
                value={insurerData.property_address || ''}
                onChange={handleChange}
                placeholder="Въведете Точен адрес на имота"
                required
                className={`block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('property_address') ? 'border-error' : 'border-gray-300'}`}
              />
              {isFieldInvalid('property_address') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Property Additional Info */}
          <div>
            <label htmlFor="property_additional_info" className="block text-sm font-medium text-white mb-1">
              Допълнителни данни за имота
            </label>
            <div className="relative">
              <input
                type="text"
                id="property_additional_info"
                name="property_additional_info"
                value={insurerData.property_additional_info || ''}
                onChange={handleChange}
                placeholder="Въведете допълнителни данни"
                className="block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/20">
        <h3 className="text-lg font-medium text-white mb-4">
          Собственик
        </h3>

        <div className="space-y-4">
          {/* Property Owner Name */}
          <div>
            <label htmlFor="property_owner_name" className="block text-sm font-medium text-white mb-1">
              Имена по документи за самоличност <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="property_owner_name"
                name="property_owner_name"
                value={insurerData.property_owner_name || ''}
                onChange={handleChange}
                placeholder="Въведете имена по документи за самоличност"
                required
                className={`block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('property_owner_name') ? 'border-error' : 'border-gray-300'}`}
              />
              {isFieldInvalid('property_owner_name') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

           {/* Property Owner ID Number */}
           <div>
            <label htmlFor="property_owner_id_number_type_id" className="block text-sm font-medium text-white mb-1">
              ЕГН/ЛНЧ/Паспорт №: <span className="text-red-300">*</span>
            </label>
            <div className="flex items-center mt-1">
              <div className="relative w-1/3">
                <select
                  id="property_owner_id_number_type_id"
                  name="property_owner_id_number_type_id"
                  value={insurerData.property_owner_id_number_type_id || ''}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-3 pr-10 py-2.5 sm:py-2 text-sm sm:text-base border-r-0 focus:outline-none focus:ring-primary focus:border-primary rounded-l-md text-black ${isFieldInvalid('property_owner_id_number_type_id') ? 'border-error' : 'border-gray-300'}`}
                  required
                >
                  {idNumberTypeOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {isFieldInvalid('property_owner_id_number_type_id') && (
                  <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-10 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="relative w-2/3">
                <input
                  type="text"
                  id="property_owner_id_number"
                  name="property_owner_id_number"
                  value={insurerData.property_owner_id_number || ''}
                  onChange={handleChange}
                  required
                  className={`pl-3 block w-full rounded-r-md border-l-0 shadow-sm focus:ring-primary focus:border-primary focus:z-10 py-2.5 sm:py-2 text-sm sm:text-base text-black ${isFieldInvalid('property_owner_id_number') ? 'border-error' : 'border-gray-300'}`}
                />
                {isFieldInvalid('property_owner_id_number') && (
                  <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
      <div className="bg-white/10 p-6 rounded-xl mb-6 border border-white/20">
        <h3 className="text-lg font-medium text-white mb-4">
          Застраховащ
        </h3>

        <div className="space-y-4">
          {/* Personal information */}
          <div>
            <label htmlFor="person_role_id" className="block text-sm font-medium text-white mb-1">
              В качеството на <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <select
                id="person_role_id"
                name="person_role_id"
                value={insurerData.person_role_id}
                onChange={handleChange}
                className={`appearance-none mt-1 block w-full pl-3 pr-10 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-primary focus:border-primary rounded-md text-black ${isFieldInvalid('person_role_id') ? 'border-error' : 'border-gray-300'}`}
                required
              >
                {personRoleOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {isFieldInvalid('person_role_id') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-10 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-white mb-1">
              Имена по документи за самоличност <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={insurerData.full_name}
                onChange={handleChange}
                placeholder="Въведете имена по документи за самоличност"
                required
                className={`block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('full_name') ? 'border-error' : 'border-gray-300'}`}
              />
              {isFieldInvalid('full_name') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="id_number_type_id" className="block text-sm font-medium text-white mb-1">
              ЕГН/ЛНЧ/Паспорт №: <span className="text-red-300">*</span>
            </label>
            <div className="flex items-center mt-1">
              <div className="relative w-1/3">
                <select
                  id="id_number_type_id"
                  name="id_number_type_id"
                  value={insurerData.id_number_type_id}
                  onChange={handleChange}
                  className={`appearance-none block w-full pl-3 pr-10 py-2.5 sm:py-2 text-sm sm:text-base border-r-0 focus:outline-none focus:ring-primary focus:border-primary rounded-l-md text-black ${isFieldInvalid('id_number_type_id') ? 'border-error' : 'border-gray-300'}`}
                  required
                >
                  {idNumberTypeOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {isFieldInvalid('id_number_type_id') && (
                  <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-10 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="relative w-2/3">
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={insurerData.id_number}
                  onChange={handleChange}
                  required
                  className={`pl-3 block w-full rounded-r-md border-l-0 shadow-sm focus:ring-primary focus:border-primary focus:z-10 py-2.5 sm:py-2 text-sm sm:text-base text-black ${isFieldInvalid('id_number') ? 'border-error' : 'border-gray-300'}`}
                />
                {isFieldInvalid('id_number') && (
                  <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional fields for ЛНЧ (id = 2) and Паспорт № (id = 3) */}
          {(insurerData.id_number_type_id === '2' || insurerData.id_number_type_id === '3') && (
            <>
              {/* Birth Date */}
              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-white mb-1">
                  Дата на раждане <span className="text-red-300">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-1/2 transform -translate-y-1/2 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="birth_date"
                    name="birth_date"
                    value={insurerData.birth_date ? new Date(insurerData.birth_date).toLocaleDateString('bg-BG') : ''}
                    onClick={handleOpenDatePicker}
                    readOnly
                    placeholder="Изберете дата"
                    required
                    className={`pl-10 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black cursor-pointer ${isFieldInvalid('birth_date') ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {isFieldInvalid('birth_date') && (
                    <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Nationality */}
              <div>
                <label htmlFor="insurer_nationality_id" className="block text-sm font-medium text-white mb-1">
                  Националност <span className="text-red-300">*</span>
                </label>
                <div className="relative">
                  <select
                    id="insurer_nationality_id"
                    name="insurer_nationality_id"
                    value={insurerData.insurer_nationality_id}
                    onChange={handleChange}
                    className={`appearance-none mt-1 block w-full pl-3 pr-10 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-primary focus:border-primary rounded-md text-black ${isFieldInvalid('insurer_nationality_id') ? 'border-red-500' : 'border-gray-300'}`}
                    required
                  >
                    <option value="">Изберете националност</option>
                    {nationalityOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {isFieldInvalid('insurer_nationality_id') && (
                    <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-10 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div>
                <div className={`flex items-center space-x-4 ${isFieldInvalid('gender') ? 'p-2 border border-red-500 rounded-md' : ''}`}>
                  <label className="text-sm font-medium text-white">
                    Пол <span className="text-red-300">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'gender', value: 'male' } })}
                    className={`px-4 py-2 rounded-md border ${
                      insurerData.gender === 'male' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                    } transition-colors duration-200`}
                  >
                    Мъж
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: 'gender', value: 'female' } })}
                    className={`px-4 py-2 rounded-md border ${
                      insurerData.gender === 'female' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                    } transition-colors duration-200`}
                  >
                    Жена
                  </button>
                  {isFieldInvalid('gender') && (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="relative" ref={settlementRef}>
            <label htmlFor="insurer_settlement_id" className="block text-sm font-medium text-white mb-1">
              Населено място <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-1/2 transform -translate-y-1/2 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-[#8B2131] focus:border-[#8B2131] sm:text-sm text-black ${isFieldInvalid('insurer_settlement_id') ? 'border-red-500' : 'border-gray-300'}`}
                autoComplete="off"
                required
              />
              {isFieldInvalid('insurer_settlement_id') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <input type="hidden" name="insurer_settlement_id" value={insurerData.insurer_settlement_id || ''} />
            </div>
            {showSettlementOptions && filteredSettlements.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-48 sm:max-h-60 rounded-md py-1 text-sm sm:text-base overflow-auto focus:outline-none text-black">
                {filteredSettlements.map(settlement => (
                  <div
                    key={settlement.id}
                    onClick={() => handleSettlementSelect(settlement)}
                    className="cursor-pointer select-none relative py-3.5 sm:py-3 px-4 sm:pl-10 sm:pr-4 hover:bg-gray-100 active:bg-gray-200 touch-manipulation border-b border-gray-100 last:border-b-0"
                  >
                    {settlement.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="permanent_address" className="block text-sm font-medium text-white mb-1">
              Постоянен адрес <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="permanent_address"
                name="permanent_address"
                value={insurerData.permanent_address}
                onChange={handleChange}
                placeholder="Въведете постоянен адрес"
                required
                className={`block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('permanent_address') ? 'border-error' : 'border-gray-300'}`}
              />
              {isFieldInvalid('permanent_address') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white mb-1">
              Телефон <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-1/2 transform -translate-y-1/2 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={insurerData.phone}
                onChange={handleChange}
                placeholder="Въведете телефон"
                required
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('phone') ? 'border-red-500' : 'border-gray-300'}`}
              />
              {isFieldInvalid('phone') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
              Имейл <span className="text-red-300">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-1/2 transform -translate-y-1/2 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={insurerData.email}
                onChange={handleChange}
                placeholder="Въведете имейл"
                required
                className={`pl-10 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm text-black ${isFieldInvalid('email') ? 'border-red-500' : 'border-gray-300'}`}
              />
              {isFieldInvalid('email') && (
                <div className="absolute top-1/2 transform -translate-y-1/2 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {propertyChecklistItems.length > 0 && (
          <div className="mt-6">
            <div className="bg-white/5 rounded-lg px-3 sm:px-4">
              {/* Property checklist items - mobile optimized */}
              <div className="space-y-2 sm:space-y-1">
                {propertyChecklistItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-white/10 py-3 sm:py-2">
                    <div className="text-white text-base sm:text-base pr-2 flex-1 mb-2 sm:mb-0 font-medium">{item.name}</div>
                    <div className="flex space-x-3 sm:space-x-2">
                      <button
                        type="button"
                        onClick={() => handleChecklistChange(item.id, true)}
                        className={`px-4 sm:px-3 py-2.5 sm:py-1 rounded-md border text-base sm:text-sm flex-1 sm:flex-none ${
                          checkedItems[item.id] === true 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                        } transition-colors duration-200 min-w-[80px] sm:min-w-0`}
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChecklistChange(item.id, false)}
                        className={`px-4 sm:px-3 py-2.5 sm:py-1 rounded-md border text-base sm:text-sm flex-1 sm:flex-none ${
                          checkedItems[item.id] === false 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                        } transition-colors duration-200 min-w-[80px] sm:min-w-0`}
                      >
                        Не
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mb-4">
          <ErrorDisplay 
            error={errors} 
            title="Моля, коригирайте следните грешки:" 
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6">
        <BackButton onClick={prevStep} className="order-2 sm:order-1" />
        {areAllItemsChecked() && (
          <ProceedButton
            type="submit"
            className="order-1 sm:order-2"
          />
        )}
      </div>
    </form>
  );
};

export default InsurerForm;
