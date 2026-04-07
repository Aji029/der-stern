import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Upload, Loader, ArrowLeft, AlertCircle } from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { ProductFormFields } from './components/ProductFormFields';
import { ImageUpload } from './components/ImageUpload';

const INITIAL_FORM_DATA = {
  artikelNr: '',
  name: '',
  vkPrice: '0',
  ekPrice: '0',
  mwst: 'A',
  packungArt: '',
  packungInhalt: '',
  istBestand: '0',
  ean: '',
  herkunftsland: 'Germany',
  produktgruppe: '101',
  supplierId: '',
  image: null as File | null,
  imagePreview: '',
};

export function EditProductForm() {
  const navigate = useNavigate();
  const { artikelNr } = useParams();
  const { getProduct, updateProduct, products, isLoading } = useProducts();
  const { suppliers } = useSuppliers();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (artikelNr) {
      const product = getProduct(artikelNr);
      if (product) {
        setFormData({
          ...product,
          vkPrice: product.vkPrice?.toString() || '0',
          ekPrice: product.ekPrice?.toString() || '0',
          istBestand: product.istBestand?.toString() || '0',
          supplierId: product.supplierId || '',
          image: null,
          imagePreview: product.image || '',
        });
      } else {
        setError('Product not found');
        navigate('/dashboard/products');
      }
    }
  }, [artikelNr, getProduct, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artikelNr) return;
    setError(null);

    // --- Duplicate product name check (excluding the current product being edited) ---
    const normalizedName = formData.name.trim().toLowerCase();
    const existingByName = products.find(
      p => p.name.trim().toLowerCase() === normalizedName && p.artikelNr !== artikelNr
    );
    if (existingByName) {
      setError(
        `A product named "${existingByName.name}" already exists (Art. Nr: ${existingByName.artikelNr}). ` +
        `Please use a different product name.`
      );
      return;
    }

    try {
      const productData = {
        ...formData,
        artikelNr,
        vkPrice: parseFloat(formData.vkPrice) || 0,
        ekPrice: parseFloat(formData.ekPrice) || 0,
        istBestand: parseInt(formData.istBestand) || 0,
      };

      await updateProduct(artikelNr, productData);
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
    }
  };

  // Hard errors (e.g., product not found) keep the old full-page error view
  // Soft errors (duplicates, update failure) are shown inline inside the form

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/dashboard/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Products
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Edit Product</h2>
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

        {/* Duplicate / submit error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-300 rounded-lg p-4">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
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
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}