import React, { useState, useEffect } from 'react';
import { GoalSelection } from './GoalSelection';
import { InputChoice } from './InputChoice';
import { EnhancedResultsDisplay } from './EnhancedResultsDisplay';
import { LoadingSpinner } from './LoadingSpinner';
import { UserPreferences, EnhancedAPIResponse } from '../types';

type AppState = 'onboarding' | 'input' | 'analyzing' | 'results' | 'error';

export function PersonalizedApp() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [results, setResults] = useState<EnhancedAPIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load saved preferences on startup
  useEffect(() => {
    const savedPreferences = localStorage.getItem('nutriscan-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setUserPreferences(preferences);
        setAppState('input');
      } catch (error) {
        console.warn('Failed to load saved preferences:', error);
      }
    }
  }, []);

  const handleGoalSelection = async (preferences: UserPreferences) => {
    setUserPreferences(preferences);
    
    // Save preferences to localStorage
    localStorage.setItem('nutriscan-preferences', JSON.stringify(preferences));
    
    // Also save to backend
    try {
      await fetch('http://localhost:5000/api/receipt/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.warn('Failed to save preferences to backend:', error);
      // Continue anyway - localStorage works
    }
    
    setAppState('input');
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAppState('analyzing');
    setError(null);
  };

  const handleAnalysisComplete = (analysisResults: EnhancedAPIResponse) => {
    setResults(analysisResults);
    setIsAnalyzing(false);
    setAppState('results');
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setIsAnalyzing(false);
    setAppState('error');
  };

  const handleNewAnalysis = () => {
    setResults(null);
    setError(null);
    setAppState('input');
  };

  const handleChangeGoal = () => {
    setUserPreferences(null);
    setResults(null);
    setError(null);
    localStorage.removeItem('nutriscan-preferences');
    setAppState('onboarding');
  };

  const getGoalDisplayName = (goal: string) => {
    return goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Render based on current state
  if (appState === 'onboarding') {
    return <GoalSelection onSelect={handleGoalSelection} />;
  }

  if (appState === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-2">
            Analyzing Your Nutrition
          </h2>
          <p className="text-gray-600 mb-4">
            {userPreferences 
              ? `Hey ${userPreferences.userName || 'there'}! Personalizing recommendations for ${getGoalDisplayName(userPreferences.goal)}`
              : 'Processing your food data with AI nutrition analysis'
            }
          </p>
          <div className="bg-white rounded-lg p-4 shadow-lg max-w-md mx-auto">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <span className="mr-2">🧠</span>
              Using Canadian Nutrient File + USDA + Open Food Facts databases
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'results' && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleChangeGoal}
                className="mr-4 px-3 py-2 text-sm bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Goal
              </button>
              {userPreferences && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{userPreferences.userName || 'User'}'s Goal:</span> {getGoalDisplayName(userPreferences.goal)}
                </div>
              )}
            </div>
          </div>
        </div>
        <EnhancedResultsDisplay 
          results={results} 
          onNewAnalysis={handleNewAnalysis}
        />
      </div>
    );
  }

  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Analysis Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Something went wrong during the analysis.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleNewAnalysis}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleChangeGoal}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Change Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: input state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🍃 NutriScan
          </h1>
          <p className="text-xl text-gray-600">
            {userPreferences?.userName 
              ? `Welcome back, ${userPreferences.userName}! 👋`
              : 'Smart Nutrition Analysis for Healthier Living'
            }
          </p>
          
          {userPreferences && (
            <div className="mt-4 flex items-center justify-center">
              <div className="flex items-center px-4 py-2 bg-white rounded-full shadow-md">
                <span className="mr-2">🎯</span>
                <span className="text-gray-700">
                  <strong>Your Goal:</strong> {getGoalDisplayName(userPreferences.goal)}
                </span>
                <button
                  onClick={handleChangeGoal}
                  className="ml-3 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Choice Component */}
        <InputChoice
          userPreferences={userPreferences || undefined}
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>
            Powered by Canadian Nutrient File, USDA FoodData Central, and Open Food Facts
          </p>
          <p className="mt-2">
            🇨🇦 Made for Canadians, by Canadians
          </p>
        </div>
      </div>
    </div>
  );
}