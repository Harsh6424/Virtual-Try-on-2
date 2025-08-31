import React, { useRef } from 'react';
import type { ImageData } from '../types';

interface ImageUploaderProps {
  value: ImageData | null;
  onImageUpload: (data: ImageData | null) => void;
}

const UploadIcon = () => (
    <svg className="w-12 h-12 text-gray-500 group-hover:text-pink-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagePreview = value ? `data:${value.mimeType};base64,${value.base64}` : null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        if (base64String) {
          onImageUpload({ base64: base64String, mimeType: file.type });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onImageUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
        onClick={handleClick}
        className="group relative aspect-[4/5] w-full bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-pink-500/80 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all duration-300"
      >
        <input
          type="file"
          accept="image/*,.heic"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload image"
        />
        {imagePreview ? (
          <>
            <img src={imagePreview} alt="Preview" className="object-contain w-full h-full rounded-2xl p-1" />
            <button
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all"
                aria-label="Remove image"
            >
                <CloseIcon />
            </button>
          </>
        ) : (
          <div className="text-center text-gray-400 pointer-events-none p-4">
            <UploadIcon />
            <p className="mt-2 text-sm font-semibold">Click to upload</p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
  );
};