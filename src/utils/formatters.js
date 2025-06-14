/**
 * Utility functions for formatting data
 */

/**
 * Format currency with thousand separators (spaces)
 * @param {number|string} amount - The amount to format
 * @returns {string} - The formatted amount
 */
export const formatCurrency = (amount) => {
  if (!amount) return '0';
  // Convert to string if it's not already
  const amountStr = amount.toString();
  // Split by decimal point if exists
  const parts = amountStr.split('.');
  // Format the integer part with spaces as thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  // Join back with decimal part if it exists
  return parts.join('.');
};