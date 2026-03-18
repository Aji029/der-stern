import React from 'react';
import { Tag, X } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';

interface CategoryListProps {
  onSelectCategory: (categoryId: string | null) => void;
  selectedCategoryId: string | null;
}

export function CategoryList({ onSelectCategory, selectedCategoryId }: CategoryListProps) {
  const { categories, deleteCategory } = useCategories();

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-2 mb-2">
        <Tag className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Categories</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCategoryId
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Products
        </button>
        {categories.map(category => (
          <div key={category.id} className="flex items-center">
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.productIds.length})
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this category?')) {
                  deleteCategory(category.id);
                  if (selectedCategoryId === category.id) {
                    onSelectCategory(null);
                  }
                }
              }}
              className="ml-1 p-1 rounded-full hover:bg-gray-200"
              title="Delete category"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}