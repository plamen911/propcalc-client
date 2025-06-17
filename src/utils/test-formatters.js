// Test script for formatters.js
import { formatCurrency } from './formatters';

// Test cases
const testCases = [
  { input: 2, expected: '2.00' },
  { input: 2.1, expected: '2.10' },
  { input: 2.15, expected: '2.15' },
  { input: 1000, expected: '1 000.00' },
  { input: 1234.5, expected: '1 234.50' },
  { input: 0, expected: '0.00' },
  { input: null, expected: '0.00' },
  { input: undefined, expected: '0.00' },
  { input: '', expected: '0.00' },
  { input: '2', expected: '2.00' },
  { input: '2.1', expected: '2.10' },
];

// Run tests
console.log('Testing formatCurrency function:');
testCases.forEach(({ input, expected }) => {
  const result = formatCurrency(input);
  const passed = result === expected;
  console.log(`Input: ${input} (${typeof input}) => Result: "${result}" | Expected: "${expected}" | ${passed ? 'PASSED' : 'FAILED'}`);
});

console.log('Test completed.');