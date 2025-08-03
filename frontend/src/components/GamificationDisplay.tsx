import React, { useState, useEffect } from 'react';
import { GamificationData, Badge } from '../types';

interface GamificationDisplayProps {
  gamification: GamificationData;
  userName?: string;
}

export function GamificationDisplay({ gamification, userName }: GamificationDisplayProps) {
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);

  // Trigger animations when component mounts
  useEffect(() => {
    if (gamification.pointsEarned > 0) {
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 3000);
    }
    
    if (gamification.newBadges.length > 0) {
      setShowBadgeAnimation(true);
      setTimeout(() => setShowBadgeAnimation(false), 5000);
    }
  }, [gamification.pointsEarned, gamification.newBadges.length]);

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'bronze': return 'from-amber-600 to-yellow-700';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      case 'diamond': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string): string => {
    switch (rarity) {
      case 'bronze': return 'border-amber-500';
      case 'silver': return 'border-gray-400';
      case 'gold': return 'border-yellow-400';
      case 'platinum': return 'border-purple-400';
      case 'diamond': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const parseWeeklyProgress = (progress: string) => {
    const [completed, total] = progress.split('/').map(Number);
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const weeklyProgress = parseWeeklyProgress(gamification.weeklyProgress);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header with Points and Level */}
      <div className="text-center">
        <div className="relative">
          {/* Points Animation */}
          {showPointsAnimation && gamification.pointsEarned > 0 && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                +{gamification.pointsEarned} points! 🎉
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="text-3xl">{gamification.levelIcon}</div>
              <div className="text-sm text-gray-600">Level {gamification.level}</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {gamification.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl">🔥</div>
              <div className="text-sm text-gray-600">{gamification.streak} day streak</div>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mt-4">
          {gamification.levelName}
        </h3>
        
        {/* Motivational Message */}
        <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg">
          <p className="text-gray-800 font-medium">
            {gamification.motivationalMessage}
          </p>
        </div>
      </div>

      {/* Points Events */}
      {gamification.events.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">🎯 Points Earned</h4>
          <div className="space-y-2">
            {gamification.events.map((event, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  event.points >= 20 ? 'bg-green-50 border border-green-200' :
                  event.points >= 10 ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-sm text-gray-700">{event.description}</span>
                <span className={`font-bold ${
                  event.points >= 20 ? 'text-green-600' :
                  event.points >= 10 ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  +{event.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">📅 Weekly Progress</h4>
          <span className="text-sm text-gray-600">
            {weeklyProgress.completed}/{weeklyProgress.total} analyses
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(weeklyProgress.percentage)}`}
            style={{ width: `${Math.min(weeklyProgress.percentage, 100)}%` }}
          />
        </div>
        
        {weeklyProgress.percentage >= 100 && (
          <div className="mt-2 text-center text-green-600 font-medium text-sm">
            🎉 Weekly goal achieved! Amazing consistency!
          </div>
        )}
      </div>

      {/* Streak Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-xl">🔥</div>
          <div className="text-lg font-bold text-orange-600">{gamification.streak}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-xl">🏆</div>
          <div className="text-lg font-bold text-purple-600">{gamification.longestStreak}</div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
      </div>

      {/* New Badges Animation */}
      {showBadgeAnimation && gamification.newBadges.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center transform animate-pulse">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              New Badge{gamification.newBadges.length > 1 ? 's' : ''} Unlocked!
            </h3>
            
            <div className="space-y-4">
              {gamification.newBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-lg bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-bold">{badge.name}</div>
                  <div className="text-sm opacity-90">{badge.description}</div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowBadgeAnimation(false)}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Awesome! Continue
            </button>
          </div>
        </div>
      )}

      {/* Keep Going Message */}
      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="text-2xl mb-2">🚀</div>
        <p className="text-gray-700">
          {userName ? `Keep it up, ${userName}!` : 'Keep going!'} You're building incredible healthy habits! 
          {gamification.streak >= 7 && ' Your consistency is amazing! 🌟'}
        </p>
      </div>
    </div>
  );
}