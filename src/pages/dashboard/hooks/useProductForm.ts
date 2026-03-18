import { useState } from 'react';

export function useProductForm(initialData: any) {
  const [formData, setFormData] = useState(initialData);

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

  return {
    formData,
    setFormData,
    handleImageChange,
  };
}