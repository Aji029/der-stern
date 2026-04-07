import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useProducts } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { ProductFormFields } from './components/ProductFormFields';
import { ImageUpload } from './components/ImageUpload';
import { useProductForm } from '../hooks/useProductForm';
import { INITIAL_PRODUCT_DATA } from '../constants/productForm';

export function AddProductForm() {
  const navigate = useNavigate();
  const { addProduct, products } = useProducts();
  const { suppliers } = useSuppliers();
  const { formData, setFormData, handleImageChange } = useProductForm(INITIAL_PRODUCT_DATA);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);
    setSubmitError(null);

    // --- Duplicate Artikel-Nr check ---
    const normalizedNr = formData.artikelNr.trim().toUpperCase();
    const existingByNr = products.find(p => p.artikelNr === normalizedNr);
    if (existingByNr) {
      setDuplicateError(
        `Artikel-Nr. "${normalizedNr}" already exists — "${existingByNr.name}". ` +
        `Please use a different Artikel number.`
      );
      return;
    }

    // --- Duplicate product name check (case-insensitive) ---
    const normalizedName = formData.name.trim().toLowerCase();
    const existingByName = products.find(
      p => p.name.trim().toLowerCase() === normalizedName
    );
    if (existingByName) {
      setDuplicateError(
        `A product named "${existingByName.name}" already exists (Art. Nr: ${existingByName.artikelNr}). ` +
        `Please use a different product name.`
      );
      return;
    }

    try {
      const productData = {
        ...formData,
        vkPrice: parseFloat(formData.vkPrice),
        ekPrice: parseFloat(formData.ekPrice),
      };

      await addProduct(productData);
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error creating product:', error);
      setSubmitError('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Product Details</h2>
          <ProductFormFields
            formData={formData}
            setFormData={(data) => {
              // Clear duplicate errors when the user edits fields
              setDuplicateError(null);
              setFormData(data);
            }}
            suppliers={suppliers}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Product Image</h2>
          <ImageUpload
            imagePreview={formData.imagePreview}
            onImageChange={handleImageChange}
          />
        </div>

        {/* Duplicate / submit error banner */}
        {(duplicateError || submitError) && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{duplicateError || submitError}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate('/dashboard/products')}
          >
            Cancel
          </Button>
          <Button type="submit">
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}