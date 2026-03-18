export const calculateProfitMargin = (ekPrice: number | undefined, vkPrice: number | undefined, mwst: 'A' | 'B'): number => {
  if (!ekPrice || !vkPrice || vkPrice <= 0) return 0;
  
  // Calculate profit margin using (((VK-EK)×100)/VK) with proper decimal handling
  return parseFloat((((vkPrice - ekPrice) * 100) / vkPrice).toFixed(2));
};

export const formatPrice = (price: number | undefined): string => {
  if (typeof price !== 'number' || isNaN(price)) return '€0.00';
  return `€${price.toFixed(2)}`;
};

export const formatProfitMargin = (margin: number): string => {
  return `${margin.toFixed(2)}%`;
};

export const validatePrices = (ekPrice: number | undefined, vkPrice: number | undefined): string | null => {
  if (!ekPrice || !vkPrice) {
    return 'Both prices must be set';
  }
  
  if (ekPrice < 0 || vkPrice < 0) {
    return 'Prices cannot be negative';
  }
  
  if (vkPrice < ekPrice) {
    return 'Selling price cannot be lower than purchase price';
  }
  
  return null;
};

export const calculateOrderTotal = (items: Array<{ quantity: number; vkPrice: number }>): number => {
  return parseFloat(items.reduce((total, item) => {
    const itemTotal = parseFloat((item.quantity * item.vkPrice).toFixed(2));
    return parseFloat((total + itemTotal).toFixed(2));
  }, 0).toFixed(2));
};