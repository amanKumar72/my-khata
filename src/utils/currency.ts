export const formatCurrency = (
  amount: number | string | undefined | null,
  symbol: string = '₹'
): string => {
  try {
    if (amount === undefined || amount === null) {
      return `${symbol}0`;
    }
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
      return `${symbol}0`;
    }
    
    const isNegative = num < 0;
    const absAmount = Math.abs(num);
    
    // Defend against JSC / JavaScript engines without full Intl support
    if (typeof Intl === 'undefined' || !Intl.NumberFormat) {
      return `${isNegative ? '-' : ''}${symbol}${absAmount.toFixed(2)}`;
    }
    
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(absAmount);

    return `${isNegative ? '-' : ''}${symbol}${formatted}`;
  } catch {
    const fallbackNum = typeof amount === 'number' ? amount : 0;
    return `${fallbackNum < 0 ? '-' : ''}${symbol}${Math.abs(fallbackNum).toFixed(2)}`;
  }
};
