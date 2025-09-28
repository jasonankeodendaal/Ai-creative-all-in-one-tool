
import React from 'react';
import { UploadedImage } from '../types.ts';
import TrashIcon from './icons/TrashIcon.tsx';

interface ImagePreviewProps {
  image: UploadedImage;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onRemove }) => {
  return (
    <div className="relative group w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg transition-all duration-300 hover:border-purple-500">
      <img
        src={image.previewUrl}
        alt={image.file.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
        <button
          onClick={onRemove}
          className="p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500"
          aria-label="Remove image"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ImagePreview;