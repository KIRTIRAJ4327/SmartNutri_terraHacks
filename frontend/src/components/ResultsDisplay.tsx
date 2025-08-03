import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  results: AnalysisResult;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (score >= 40) return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
    return <XCircle className="w-8 h-8 text-red-600" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Health Score</h2>
            <p className="text-blue-100">Based on {results.analysisCount} items analyzed</p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Another</span>
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {getScoreIcon(results.overallScore)}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(results.overallScore)}`}>
              {results.overallScore}/100
            </div>
            <div className="text-lg text-gray-600">
              {getScoreLabel(results.overallScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sodium Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">🧂 Sodium Level</span>
              <span className={`font-bold ${getScoreColor(results.sodiumScore)}`}>
                {results.sodiumScore}/100
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Average: {results.averageSodium}mg per item
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(results.sodiumScore)}`}
                style={{ width: `${results.sodiumScore}%` }}
              />
            </div>
          </div>

          {/* Processing Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">🔬 Food Processing</span>
              <span className={`font-bold ${getScoreColor(results.processingScore)}`}>
                {results.processingScore}/100
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {results.ultraProcessedPercent}% ultra-processed foods
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(results.processingScore)}`}
                style={{ width: `${results.processingScore}%` }}
              />
            </div>
          </div>

          {/* Sugar Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">🍭 Sugar Impact</span>
              <span className={`font-bold ${getScoreColor(results.sugarScore)}`}>
                {results.sugarScore}/100
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {results.totalSugarIntake}g total, {results.addedSugarPercent}% with added sugars
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(results.sugarScore)}`}
                style={{ width: `${results.sugarScore}%` }}
              />
            </div>
          </div>

          {/* Nutrient Score */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">💪 Nutrient Power</span>
              <span className={`font-bold ${getScoreColor(results.nutrientScore)}`}>
                {results.nutrientScore}/100
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Vitamin & mineral density
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(results.nutrientScore)}`}
                style={{ width: `${results.nutrientScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4">💡 Recommendations</h3>
        <div className="space-y-3">
          {results.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-600 mt-0.5">•</div>
              <div className="text-gray-700">
                {typeof rec === 'string' ? rec : rec.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrient Gaps */}
      {results.nutrientGaps.length > 0 && (
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">⚠️ Potential Nutrient Gaps</h3>
          <div className="space-y-2">
            {results.nutrientGaps.map((gap, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600 mt-0.5">•</div>
                <div className="text-gray-700 text-sm">{gap}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Info */}
      <div className="p-6 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            🔒 Your receipt data was processed locally and not stored anywhere
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>⚡ Processed in {results.processingTime}ms</span>
            <span>📊 Cache efficiency: {(results.cacheHitRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};