import React, { useState } from 'react';
import { GoalOption, UserPreferences } from '../types';

interface GoalSelectionProps {
  onSelect: (goal: UserPreferences) => void;
}

const goalOptions: GoalOption[] = [
  {
    id: 'weight_management',
    title: '🏃‍♂️ Weight Management',
    description: 'Track calories, portions, and energy balance',
    icon: '⚖️',
    focusAreas: ['calories', 'portion_control', 'energy_density'],
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'heart_health',
    title: '❤️ Heart Health',
    description: 'Monitor sodium, cholesterol, and healthy fats',
    icon: '💗',
    focusAreas: ['sodium', 'cholesterol', 'healthy_fats'],
    color: 'from-red-500 to-pink-600'
  },
  {
    id: 'diabetes_care',
    title: '🩺 Diabetes Care',
    description: 'Manage sugars, carbs, and blood glucose impact',
    icon: '🍎',
    focusAreas: ['sugars', 'carbs', 'fiber', 'glycemic_index'],
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'fitness',
    title: '💪 Fitness Goals',
    description: 'Optimize protein, nutrients, and recovery',
    icon: '🏋️',
    focusAreas: ['protein', 'nutrients', 'energy', 'recovery'],
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'general_wellness',
    title: '🌟 General Wellness',
    description: 'Balanced nutrition for overall health',
    icon: '🌱',
    focusAreas: ['balance', 'variety', 'nutrients'],
    color: 'from-emerald-500 to-green-600'
  }
];

export function GoalSelection({ onSelect }: GoalSelectionProps) {
  const [step, setStep] = useState<'name' | 'goal'>('name');
  const [userName, setUserName] = useState('');

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setStep('goal');
    }
  };

  const handleGoalSelect = (goalOption: GoalOption) => {
    const preferences: UserPreferences = {
      goal: goalOption.id,
      focusAreas: goalOption.focusAreas,
      dietaryRestrictions: [],
      createdAt: new Date(),
      userName: userName.trim()
    };
    
    onSelect(preferences);
  };

  const handleBackToName = () => {
    setStep('name');
  };

  // NAME COLLECTION STEP
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">👋</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Hey there!
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Welcome to NutriScan! 🍃
              </p>
              <p className="text-gray-500">
                What should we call you? We love making things personal! 😊
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Sarah, Alex, Jordan..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userName.trim()}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <span className="mr-2">✨</span>
                Nice to meet you!
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-500 text-sm">
                💡 We'll use your name to personalize your experience
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GOAL SELECTION STEP  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <button
            onClick={handleBackToName}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Change name
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Great to meet you, {userName}! 🤝
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            How would you like to use NutriScan?
          </p>
          <p className="text-gray-500">
            Choose your primary health goal so we can personalize everything for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalOptions.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal)}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 p-6 text-left border border-gray-200 hover:border-transparent"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="text-3xl mb-3">{goal.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-gray-900">
                  {goal.title}
                </h3>
                <p className="text-gray-600 mb-4 group-hover:text-gray-700">
                  {goal.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {goal.focusAreas.slice(0, 3).map((area) => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-sm group-hover:bg-gray-200"
                    >
                      {area.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium">
                  Perfect for me!
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Don't worry, {userName} - you can change your goal anytime! 😊
          </p>
        </div>
      </div>
    </div>
  );
}