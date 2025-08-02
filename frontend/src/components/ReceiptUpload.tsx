import React, { useRef, useState } from 'react';
import { Camera, Upload, Image } from 'lucide-react';

interface ReceiptUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ onUpload, isAnalyzing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  if (isAnalyzing) {
    return null; // Hide upload component when analyzing
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <Image className="w-16 h-16 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700">
            Upload Your Receipt
          </h3>
          <p className="text-gray-500 max-w-sm">
            Take a photo or upload an image of your grocery receipt to get instant health insights
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnalyzing}
            >
              <Camera className="w-5 h-5" />
              <span>Take Photo</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnalyzing}
            >
              <Upload className="w-5 h-5" />
              <span>Upload File</span>
            </button>
          </div>
          
          <p className="text-xs text-gray-400">
            Supports JPG, PNG, HEIC up to 10MB
          </p>
        </div>
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={isAnalyzing}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        disabled={isAnalyzing}
      />
    </div>
  );
};