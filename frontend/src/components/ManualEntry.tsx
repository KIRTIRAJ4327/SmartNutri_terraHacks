import React, { useState } from 'react';
import { ManualProduct, UserPreferences, EnhancedAPIResponse } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ManualEntryProps {
  userPreferences?: UserPreferences;
  onAnalysisComplete: (results: EnhancedAPIResponse) => void;
  onError: (error: string) => void;
}

const unitOptions = [
  { value: 'pieces', label: 'pieces' },
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
  { value: 'oz', label: 'oz' },
  { value: 'cups', label: 'cups' },
  { value: 'servings', label: 'servings' }
];

const commonProducts = [
  // 🍎 FRUITS (Best accuracy)
  'banana', 'apple', 'orange', 'strawberries', 'blueberries', 'grapes', 'pineapple', 'mango', 'avocado', 'lemon',
  
  // 🥬 VEGETABLES (Excellent accuracy)  
  'spinach', 'broccoli', 'carrots', 'tomatoes', 'cucumber', 'bell peppers', 'onions', 'garlic', 'sweet potato', 'potatoes',
  
  // 🥩 SIMPLE PROTEINS (Good accuracy)
  'chicken breast', 'salmon', 'eggs', 'ground beef', 'tofu', 'tuna',
  
  // 🥛 DAIRY & BASICS (Reliable data)
  'milk', 'greek yogurt', 'cheese', 'butter', 'bread', 'rice', 'oats',
  
  // 🌰 NUTS & SEEDS (Well-documented)
  'almonds', 'walnuts', 'peanuts', 'sunflower seeds'
];

export function ManualEntry({ userPreferences, onAnalysisComplete, onError }: ManualEntryProps) {
  const [products, setProducts] = useState<ManualProduct[]>([
    { name: '', quantity: 1, unit: 'pieces' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null);

  const addProduct = () => {
    setProducts([...products, { name: '', quantity: 1, unit: 'pieces' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof ManualProduct, value: string | number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const selectSuggestion = (index: number, productName: string) => {
    updateProduct(index, 'name', productName);
    setShowSuggestions(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate products
    const validProducts = products.filter(p => p.name.trim() && p.quantity > 0);
    if (validProducts.length === 0) {
      onError('Please add at least one product with a name and quantity');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/receipt/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: validProducts,
          userPreferences
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onAnalysisComplete(data);
      } else {
        onError(data.error || 'Failed to analyze products');
      }
    } catch (error) {
      onError('Network error: Unable to analyze products');
      console.error('Manual entry error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFilteredSuggestions = (query: string) => {
    if (!query) return commonProducts.slice(0, 6);
    return commonProducts
      .filter(product => product.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Analyzing your products...</p>
        <p className="text-sm text-gray-500 mt-2">
          {userPreferences ? `Personalizing for ${userPreferences.goal.replace('_', ' ')} goal` : 'Processing nutrition data'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">✍️</div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Add Products Manually</h3>
          <p className="text-gray-600">Enter products you've purchased or consumed</p>
        </div>
      </div>

      {userPreferences && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <span className="text-blue-600 mr-2">🎯</span>
            <span className="text-blue-800 font-medium">
              Personalized for: {userPreferences.goal.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="relative">
            <div className="flex gap-3 items-start">
              {/* Product Name Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Product name (e.g., banana, chicken breast)"
                  value={product.name}
                  onChange={(e) => {
                    updateProduct(index, 'name', e.target.value);
                    setShowSuggestions(e.target.value ? index : null);
                  }}
                  onFocus={() => setShowSuggestions(index)}
                  onBlur={() => setTimeout(() => setShowSuggestions(null), 200)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions === index && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {getFilteredSuggestions(product.name).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => selectSuggestion(index, suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity Input */}
              <div className="w-24">
                <input
                  type="number"
                  placeholder="Qty"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  required
                />
              </div>

              {/* Unit Select */}
              <div className="w-32">
                <select
                  value={product.unit}
                  onChange={(e) => updateProduct(index, 'unit', e.target.value as ManualProduct['unit'])}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {unitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove Button */}
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove product"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Another Button */}
        <button
          type="button"
          onClick={addProduct}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Another Product
        </button>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={products.every(p => !p.name.trim())}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <span className="mr-2">📊</span>
          Analyze Nutrition
          {userPreferences && (
            <span className="ml-2 text-blue-200">
              (Personalized)
            </span>
          )}
        </button>
      </form>

      <div className="mt-4 text-center space-y-2">
        <p className="text-gray-500 text-sm">
          💡 Tip: We get the best results with fruits, vegetables, and simple proteins
        </p>
        <p className="text-gray-400 text-xs">
          Examples: banana, spinach, chicken breast, salmon, eggs, oats
        </p>
      </div>
    </div>
  );
}