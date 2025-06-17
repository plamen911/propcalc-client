/**
 * Utility functions for formatting data
 */

/**
 * Format currency with thousand separators (spaces)
 * @param {number|string} amount - The amount to format
 * @returns {string} - The formatted amount
 */
export const formatCurrency = (amount) => {
  if (!amount) return '0.00';
  // Round to 2 decimal places to avoid floating point precision issues
  const roundedAmount = typeof amount === 'number' ? Math.round(amount * 100) / 100 : amount;
  // Convert to string if it's not already
  const amountStr = roundedAmount.toString();
  // Split by decimal point if exists
  const parts = amountStr.split('.');
  // Format the integer part with spaces as thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  // Ensure there's a decimal part with exactly 2 digits
  if (parts.length === 1) {
    parts.push('00');
  } else if (parts[1].length === 1) {
    parts[1] = parts[1] + '0';
  }
  // Join back with decimal part
  return parts.join('.');
};
