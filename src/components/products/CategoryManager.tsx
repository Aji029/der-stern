import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCategories } from '../../context/CategoryContext';
import type { Product } from '../../types/product';

interface CategoryManagerProps {
  selectedProducts: Product[];
  onClearSelection: () => void;
}

export function CategoryManager({ selectedProducts, onClearSelection }: CategoryManagerProps) {
  const { categories, addCategory, addProductsToCategory } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleAddToCategory = async (categoryId: string) => {
    try {
      await addProductsToCategory(categoryId, selectedProducts.map(p => p.artikelNr));
      onClearSelection();
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to add products to category:', error);
    }
  };

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">
          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
        </h3>
        <button
          onClick={onClearSelection}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {isAddingCategory ? (
          <form onSubmit={handleCreateCategory} className="flex space-x-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
              required
            />
            <Button type="submit" size="sm">
              <Check className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAddingCategory(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        )}

        <div className="relative">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Add to Category
          </Button>

          {showDropdown && (
            <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
              <div className="p-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleAddToCategory(category.id)}
                    className="w-full px-3 py-2 text-left rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-gray-500">
                      {category.productIds.length} products
                    </div>
                  </button>
                ))}
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No categories yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}