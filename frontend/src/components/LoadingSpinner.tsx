import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Analyzing Your Receipt
          </h3>
          <div className="space-y-1 text-sm text-gray-500">
            <p>🔍 Extracting product information...</p>
            <p>🥗 Looking up nutrition data...</p>
            <p>📊 Calculating your health score...</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 text-center">
          This usually takes 3-5 seconds
        </div>
      </div>
    </div>
  );
};