export const calculateOrderTotal = (items: Array<{ quantity: number; vkPrice: number }> = []): number => {
  return parseFloat(items.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity.toString()) || 0;
    const price = parseFloat(item.vkPrice.toString()) || 0;
    const itemTotal = parseFloat((quantity * price).toFixed(2));
    return parseFloat((sum + itemTotal).toFixed(2));
  }, 0).toFixed(2));
};

export const validateOrderTotal = (total: number): boolean => {
  return typeof total === 'number' && !isNaN(total) && total >= 0;
};