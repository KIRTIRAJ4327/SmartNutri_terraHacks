import React from 'react';
import { EnhancedAPIResponse, Recommendation } from '../types';
import { GamificationDisplay } from './GamificationDisplay';

interface EnhancedResultsDisplayProps {
  results: EnhancedAPIResponse;
  onNewAnalysis: () => void;
}

export function EnhancedResultsDisplay({ results, onNewAnalysis }: EnhancedResultsDisplayProps) {
  const { analysis, history, personalization, source } = results;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '💡';
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'swap': return 'REPLACE';
      case 'reduce': return 'REDUCE';
      case 'add': return 'ADD';
      default: return 'TIP';
    }
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with source indicator */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {source === 'manual' ? '✍️' : '📸'}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Nutrition Analysis Complete
              </h2>
              <p className="text-gray-600">
                {source === 'manual' ? 'Manual entry analysis' : 'Receipt scan analysis'}
                {personalization && (
                  <span className="ml-2 text-blue-600">
                    • Personalized for {personalization.customizedFor}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onNewAnalysis}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Analysis
          </button>
        </div>

        {/* Overall Score */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBackgroundColor(analysis.overallScore)} mb-4`}>
            <span className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Overall Health Score</h3>
          <p className="text-gray-600">
            {analysis.overallScore >= 80 ? 'Excellent choices!' : 
             analysis.overallScore >= 60 ? 'Good with room for improvement' : 
             'Consider some healthier alternatives'}
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sodium', score: analysis.sodiumScore, icon: '🧂' },
            { label: 'Processing', score: analysis.processingScore, icon: '🏭' },
            { label: 'Sugar', score: analysis.sugarScore, icon: '🍯' },
            { label: 'Nutrients', score: analysis.nutrientScore, icon: '💪' }
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className={`text-2xl font-bold ${getScoreColor(item.score)} mb-1`}>
                {item.score}
              </div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            💡 Smart Recommendations
            {personalization && (
              <span className="text-sm text-blue-600 ml-2">
                (Personalized for {personalization.customizedFor})
              </span>
            )}
          </h3>
          <div className="space-y-4">
            {analysis.recommendations.map((rec: Recommendation, index: number) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-start">
                  <span className="text-xl mr-3">{getPriorityIcon(rec.priority)}</span>
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold mr-2 ${
                        rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {getTypeLabel(rec.type)}
                      </span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium mb-1">{rec.message}</p>
                    <p className="text-gray-600 text-sm">💭 {rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🎮 Gamification Display */}
      {results.gamification && (
        <GamificationDisplay 
          gamification={results.gamification}
          userName={personalization?.customizedFor?.includes(' ') 
            ? personalization.customizedFor.split(' ')[0] 
            : personalization?.customizedFor}
        />
      )}

      {/* Progress Tracking */}
      {history && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {history.totalReceipts}
              </div>
              <div className="text-sm text-gray-600">Total Analyses</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {history.averageHealthScore}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <span className="text-xl mr-2">{getTrendIcon(history.trendDirection)}</span>
                <span className="text-2xl font-bold text-emerald-600">
                  {history.trendDirection.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-gray-600">Health Trend</div>
            </div>
          </div>

          {history.isImproving && (
            <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">🎉</span>
                <span className="text-green-800 font-medium">
                  Great job! Your nutrition choices are improving over time.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Detailed Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Nutrition Facts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Average Sodium:</span>
                <span className="font-medium">{analysis.averageSodium}mg</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sugar Intake:</span>
                <span className="font-medium">{analysis.totalSugarIntake}g</span>
              </div>
              <div className="flex justify-between">
                <span>Ultra-processed Foods:</span>
                <span className="font-medium">{analysis.ultraProcessedPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Items with Added Sugars:</span>
                <span className="font-medium">{analysis.addedSugarPercent}%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Analysis Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items Analyzed:</span>
                <span className="font-medium">{analysis.analysisCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Processing Time:</span>
                <span className="font-medium">{(analysis.processingTime / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Hit Rate:</span>
                <span className="font-medium">{(analysis.cacheHitRate * 100).toFixed(0)}%</span>
              </div>
              {results.receiptId && (
                <div className="flex justify-between">
                  <span>Analysis ID:</span>
                  <span className="font-medium text-xs">{results.receiptId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nutrient Gaps */}
      {analysis.nutrientGaps && analysis.nutrientGaps.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">⚠️ Potential Nutrient Gaps</h3>
          <div className="space-y-2">
            {analysis.nutrientGaps.map((gap, index) => (
              <div key={index} className="flex items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-500 mr-3">⚠️</span>
                <span className="text-orange-800">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}