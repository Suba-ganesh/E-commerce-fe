/**
 * Format date strings to a readable local format.
 */
export const formatDate = (date: string | Date | number): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
};

/**
 * Format standard currency amounts.
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Limit characters in a string for displays (truncate).
 */
export const truncateText = (text: string, length = 100): string => {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};
