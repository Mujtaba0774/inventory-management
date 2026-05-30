/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change (can be negative)
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage for display
 * @param {number} percentage - Percentage value
 * @returns {string} Formatted percentage string with + or - sign
 */
export const formatPercentage = (percentage) => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};

/**
 * Get the month key in format YYYY-MM
 * @param {Date|string} date - Date object or date string
 * @returns {string} Month key in format YYYY-MM
 */
export const getMonthKey = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get the previous month key
 * @param {string} monthKey - Current month key in format YYYY-MM
 * @returns {string} Previous month key in format YYYY-MM
 */
export const getPreviousMonthKey = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
};

/**
 * Get metric for current and previous periods
 * @param {Array} movements - Stock movements array
 * @param {Array} products - Products array
 * @param {string} currentMonth - Current month key in format YYYY-MM or 'all'
 * @param {Function} calculatorFn - Function to calculate metric from movements and products
 * @returns {Object} Object with current and previous values
 */
export const getMetricComparison = (
  movements,
  products,
  currentMonth,
  calculatorFn
) => {
  // For 'all time', we can't compare, so return current value with 0% change
  if (currentMonth === 'all') {
    return {
      current: calculatorFn(movements, products),
      previous: calculatorFn(movements, products),
      percentage: 0
    };
  }

  const filteredCurrent = movements.filter(
    m => getMonthKey(m.date) === currentMonth
  );
  
  const previousMonth = getPreviousMonthKey(currentMonth);
  const filteredPrevious = movements.filter(
    m => getMonthKey(m.date) === previousMonth
  );

  const currentValue = calculatorFn(filteredCurrent, products);
  const previousValue = calculatorFn(filteredPrevious, products);
  const percentage = calculatePercentageChange(currentValue, previousValue);

  return {
    current: currentValue,
    previous: previousValue,
    percentage
  };
};
