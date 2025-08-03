import React, { useState } from 'react';
import { ReceiptUpload } from './ReceiptUpload';
import { ManualEntry } from './ManualEntry';
import { UserPreferences, EnhancedAPIResponse } from '../types';

interface InputChoiceProps {
  userPreferences?: UserPreferences;
  onAnalysisComplete: (results: EnhancedAPIResponse) => void;
  onError: (error: string) => void;
}

type InputMethod = 'choice' | 'receipt' | 'manual';

export function InputChoice({ userPreferences, onAnalysisComplete, onError }: InputChoiceProps) {
  const [inputMethod, setInputMethod] = useState<InputMethod>('choice');

  const handleReceiptUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      // Add user preferences if available
      if (userPreferences) {
        formData.append('preferences', JSON.stringify(userPreferences));
      }

      const response = await fetch('http://localhost:5000/api/receipt/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        onAnalysisComplete(data);
      } else {
        onError(data.error || 'Failed to analyze receipt');
      }
    } catch (error) {
      onError('Network error: Unable to analyze receipt');
      console.error('Receipt upload error:', error);
    }
  };

  const handleBackToChoice = () => {
    setInputMethod('choice');
  };

  if (inputMethod === 'receipt') {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToChoice}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to options
        </button>
        <ReceiptUpload 
          onUpload={handleReceiptUpload}
          userPreferences={userPreferences}
        />
      </div>
    );
  }

  if (inputMethod === 'manual') {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBackToChoice}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to options
        </button>
        <ManualEntry 
          userPreferences={userPreferences}
          onAnalysisComplete={onAnalysisComplete}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          How would you like to add your food data?
        </h2>
        {userPreferences && (
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full mb-4">
            <span className="mr-2">🎯</span>
            Personalized for {userPreferences.goal.replace('_', ' ')} goal
          </div>
        )}
        <p className="text-gray-600">
          Choose the method that works best for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Upload Option */}
        <button
          onClick={() => setInputMethod('receipt')}
          className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8 text-center border border-gray-200 hover:border-blue-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-gray-900">
              Scan Receipt
            </h3>
            <p className="text-gray-600 mb-4 group-hover:text-gray-700">
              Take a photo or upload an image of your grocery receipt for automatic analysis
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Fast and automatic
              </div>
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Extracts prices and store info
              </div>
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Works with most receipts
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center text-blue-600 group-hover:text-blue-700 font-medium">
              Upload Receipt
              <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Manual Entry Option */}
        <button
          onClick={() => setInputMethod('manual')}
          className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-8 text-center border border-gray-200 hover:border-green-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="text-5xl mb-4">✍️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-gray-900">
              Add Manually
            </h3>
            <p className="text-gray-600 mb-4 group-hover:text-gray-700">
              Type in the products you've purchased or consumed for detailed analysis
            </p>
            
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Perfect for fresh produce
              </div>
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Works without receipts
              </div>
              <div className="flex items-center justify-center">
                <span className="text-green-500 mr-2">✓</span>
                Specify exact quantities
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center text-green-600 group-hover:text-green-700 font-medium">
              Enter Products
              <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          💡 You can use both methods - scan receipts for groceries, add items manually for farmers markets or meal tracking
        </p>
      </div>
    </div>
  );
}