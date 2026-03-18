import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, Grid, List } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProductList } from '../../components/ProductList';
import { ProductGrid } from '../../components/ProductGrid';
import { SearchInput } from '../../components/search/SearchInput';
import { CategoryDropdown } from '../../components/products/CategoryDropdown';
import { CategoryManager } from '../../components/products/CategoryManager';
import { Pagination } from '../../components/ui/Pagination';
import { BackButton } from '../../components/navigation/BackButton';
import { useProducts } from '../../context/ProductContext';
import { useCategories } from '../../context/CategoryContext';
import type { Product } from '../../types/product';

const ITEMS_PER_PAGE = 20;

export function ProductsPage() {
  const navigate = useNavigate();
  const { products, deleteProduct } = useProducts();
  const { categories, addCategory } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Search filter
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        product.name.toLowerCase().includes(searchLower) ||
        product.artikelNr.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = !selectedCategoryId || 
        categories.some(category => 
          category.id === selectedCategoryId && 
          category.productIds.includes(product.artikelNr)
        );

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId, categories]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handlers
  const handleAddCategory = () => {
    const name = window.prompt('Enter category name:');
    if (name?.trim()) {
      addCategory(name.trim()).catch(error => {
        console.error('Failed to create category:', error);
        alert('Failed to create category. Please try again.');
      });
    }
  };

  const handleDelete = (artikelNr: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(artikelNr).catch(error => {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      });
      setSelectedProducts(prev => prev.filter(p => p.artikelNr !== artikelNr));
    }
  };

  const handleToggleSelect = (product: Product, selectAll?: boolean) => {
    setSelectedProducts(prev => {
      if (selectAll !== undefined) {
        const currentPageProducts = new Set(paginatedProducts.map(p => p.artikelNr));
        if (selectAll) {
          const newSelections = paginatedProducts.filter(
            p => !prev.some(selected => selected.artikelNr === p.artikelNr)
          );
          return [...prev, ...newSelections];
        } else {
          return prev.filter(p => !currentPageProducts.has(p.artikelNr));
        }
      } else {
        const isSelected = prev.some(p => p.artikelNr === product.artikelNr);
        return isSelected
          ? prev.filter(p => p.artikelNr !== product.artikelNr)
          : [...prev, product];
      }
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleAddCategory}>
            <FolderPlus className="h-5 w-5 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => navigate('/dashboard/products/new')}>
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <CategoryDropdown 
            onSelectCategory={handleCategoryChange}
            selectedCategoryId={selectedCategoryId}
          />
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search products by name or article number..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <ProductGrid 
            products={paginatedProducts}
            onDelete={handleDelete}
            selectedProducts={selectedProducts}
            onToggleSelect={handleToggleSelect}
          />
        ) : (
          <ProductList 
            products={paginatedProducts}
            onDelete={handleDelete}
            selectedProducts={selectedProducts}
            onToggleSelect={handleToggleSelect}
          />
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <CategoryManager 
        selectedProducts={selectedProducts}
        onClearSelection={() => setSelectedProducts([])}
      />
    </div>
  );
}