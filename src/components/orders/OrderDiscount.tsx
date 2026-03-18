import React from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProductSearchInput } from '../search/ProductSearchInput';
import { formatPrice } from '../../utils/priceCalculations';
import { validateGutschrift } from '../../utils/gutschriftValidation';
import type { OrderDiscount as OrderDiscountType, OrderItem } from '../../types/order';

interface OrderDiscountProps {
  subtotal: number;
  items: OrderItem[];
  discount?: OrderDiscountType;
  onApplyDiscount: (discount: OrderDiscountType | undefined) => void;
  disabled?: boolean;
}

export function OrderDiscount({ 
  subtotal, 
  items,
  discount, 
  onApplyDiscount, 
  disabled = false 
}: OrderDiscountProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddDiscountProduct = (product: any) => {
    // Validate the Gutschrift
    const validation = validateGutschrift(items, product, discount);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    // Create a discount item with negative VK price
    const discountItem: OrderItem = {
      product: {
        artikelNr: product.artikelNr,
        name: `Gutschrift: ${product.name}`, // Prefix with Gutschrift
        mwst: product.mwst,
        supplierId: product.supplierId,
      },
      quantity: 1,
      ekPrice: 0, // Set EK price to 0 for discounts
      vkPrice: -Math.abs(product.vkPrice), // Make price negative for discount
      total: -Math.abs(product.vkPrice), // Total is also negative
    };

    onApplyDiscount({
      type: 'fixed',
      value: Math.abs(product.vkPrice),
      description: `Gutschrift: ${product.name}`,
      item: discountItem
    });
    setIsAdding(false);
    setError(null);
  };

  if (disabled) {
    return discount ? (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">Gutschrift:</span>
            <span className="ml-2 text-sm text-gray-600">{discount.description}</span>
          </div>
          <span className="font-medium text-red-600">-{formatPrice(discount.value)}</span>
        </div>
      </div>
    ) : null;
  }

  if (!isAdding && !discount) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsAdding(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Gutschrift
      </Button>
    );
  }

  if (!isAdding && discount) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{discount.description}</div>
              <div className="text-sm text-red-600">-{formatPrice(discount.value)}</div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              Change
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyDiscount(undefined)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for a product to add as Gutschrift
        </label>
        <ProductSearchInput
          onSelect={handleAddDiscountProduct}
          placeholder="Search any product to add as Gutschrift..."
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setIsAdding(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}