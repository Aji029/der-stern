import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tag, X } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';

interface CategoryDropdownProps {
  onSelectCategory: (categoryId: string | null) => void;
  selectedCategoryId: string | null;
}

export function CategoryDropdown({ onSelectCategory, selectedCategoryId }: CategoryDropdownProps) {
  const { categories, deleteCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function adjustDropdownPosition() {
      if (!menuRef.current || !dropdownRef.current) return;

      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Check if dropdown would extend beyond viewport
      const spaceBelow = viewportHeight - dropdownRect.bottom;
      const spaceAbove = dropdownRect.top;
      const menuHeight = menuRect.height;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        // Position above if there's more space above
        menuRef.current.style.bottom = '100%';
        menuRef.current.style.top = 'auto';
        menuRef.current.style.maxHeight = `${Math.min(spaceAbove - 10, 300)}px`;
      } else {
        // Position below
        menuRef.current.style.top = '100%';
        menuRef.current.style.bottom = 'auto';
        menuRef.current.style.maxHeight = `${Math.min(spaceBelow - 10, 300)}px`;
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', adjustDropdownPosition);
    window.addEventListener('resize', adjustDropdownPosition);

    if (isOpen) {
      adjustDropdownPosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', adjustDropdownPosition);
      window.removeEventListener('resize', adjustDropdownPosition);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Tag className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {selectedCategory ? selectedCategory.name : 'All Products'}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute z-50 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-y-auto"
          style={{
            maxHeight: '300px',
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                onSelectCategory(null);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                !selectedCategoryId ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
            >
              All Products
            </button>

            {categories.map(category => (
              <div key={category.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                <button
                  onClick={() => {
                    onSelectCategory(category.id);
                    setIsOpen(false);
                  }}
                  className={`flex-1 text-left text-sm ${
                    selectedCategoryId === category.id ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {category.name} ({category.productIds.length})
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this category?')) {
                      deleteCategory(category.id);
                      if (selectedCategoryId === category.id) {
                        onSelectCategory(null);
                      }
                    }
                  }}
                  className="ml-2 p-1 rounded-full hover:bg-gray-200"
                  title="Delete category"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}