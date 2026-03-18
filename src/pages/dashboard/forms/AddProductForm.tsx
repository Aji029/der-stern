import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useProducts } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { ProductFormFields } from './components/ProductFormFields';
import { ImageUpload } from './components/ImageUpload';
import { useProductForm } from '../hooks/useProductForm';
import { INITIAL_PRODUCT_DATA } from '../constants/productForm';

export function AddProductForm() {
  const navigate = useNavigate();
  const { addProduct } = useProducts();
  const { suppliers } = useSuppliers();
  const { formData, setFormData, handleImageChange } = useProductForm(INITIAL_PRODUCT_DATA);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      alert('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Product Details</h2>
          <ProductFormFields 
            formData={formData}
            setFormData={setFormData}
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