import React, { useState } from 'react';
import { ReceiptUpload } from './components/ReceiptUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AnalysisResult, APIError } from './types';
import './App.css';

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<APIError | null>(null);

  const handleReceiptUpload = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      console.log('📸 Uploading file:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:5000/api/receipt/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        throw new Error(data.details || data.error || 'Analysis failed');
      }

      if (data.success) {
        console.log('✅ Analysis successful:', data.analysis);
        setResults(data.analysis);
      } else {
        throw new Error('Analysis failed - no results returned');
      }
      
    } catch (err) {
      console.error('❌ Analysis error:', err);
      
      // Create proper error object
      const errorObj: APIError = {
        error: err instanceof Error ? err.message : 'Something went wrong',
        details: err instanceof Error ? err.message : 'An unexpected error occurred during analysis',
        timestamp: new Date().toISOString(),
        processingTime: 0,
        support: {
          tips: [
            'Ensure good lighting when taking the photo',
            'Keep the receipt flat and fully visible',
            'Use a high-resolution image',
            'Make sure the entire receipt is in frame'
          ],
          contact: 'If problems persist, please try again or contact support'
        }
      };
      
      setError(errorObj);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            NutriScan
          </h1>
          <p className="text-xl text-gray-600">
            Transform your grocery receipt into health insights
          </p>
          <p className="text-sm text-gray-500 mt-2">
            📱 Your data stays on your device - nothing is stored
          </p>
        </header>

        <main className="max-w-2xl mx-auto">
          {isAnalyzing && <LoadingSpinner />}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p><strong>Error:</strong> {error.error}</p>
              <p className="text-sm mt-1">{error.details}</p>
              {error.support?.tips && (
                <div className="mt-3">
                  <p className="font-medium text-sm">💡 Tips:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {error.support.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button 
                onClick={handleReset}
                className="mt-3 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {results ? (
            <ResultsDisplay results={results} onReset={handleReset} />
          ) : (
            <ReceiptUpload onUpload={handleReceiptUpload} isAnalyzing={isAnalyzing} />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>
            Powered by Google Vision API & Open Food Facts • 
            <a href="http://localhost:5000/api/health/info" className="ml-1 underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              API Status
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;