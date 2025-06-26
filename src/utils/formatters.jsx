/**
 * Utility functions for formatting data
 */

import React from 'react';

/**
 * Format currency with thousand separators (spaces)
 * @param {number|string} amount - The amount to format
 * @returns {string} - The formatted amount
 */
export const formatCurrency = (value, fraction = 2) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return '0.00';
  }
  return number.toLocaleString('bg-BG', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
};

export const formatDescription = (text) => {
    if (!text) {
        return '';
    }

    // Convert newlines to <br> tags for HTML display
    return text.split('\n').join('<br />');
};
