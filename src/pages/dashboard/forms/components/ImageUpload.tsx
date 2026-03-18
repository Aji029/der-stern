import React from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface ImageUploadProps {
  imagePreview: string;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageUpload({ imagePreview, onImageChange }: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Create a fake change event to clear the image
    onImageChange({
      target: {
        files: null
      }
    } as any);
  };

  return (
    <div className="space-y-4">
      {imagePreview ? (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Product preview"
            className="w-full h-64 object-contain rounded-lg border border-gray-200"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearImage}
            className="absolute top-2 right-2 bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg border-2 border-dashed cursor-pointer hover:bg-gray-50">
            <Upload className="h-8 w-8" />
            <span className="mt-2 text-sm">Click to upload product image</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onImageChange}
            />
          </label>
        </div>
      )}
    </div>
  );
}