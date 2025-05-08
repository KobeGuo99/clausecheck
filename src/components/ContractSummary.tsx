import React from 'react';
import type { ContractSummary as ContractSummaryType } from '../utils/openaiUtils';

interface ContractSummaryProps {
  summary: ContractSummaryType;
}

const ContractSummary: React.FC<ContractSummaryProps> = ({ summary }) => {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Safe':
        return 'text-green-600';
      case 'Moderate':
        return 'text-yellow-600';
      case 'High':
        return 'text-orange-600';
      case 'Critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Accept':
        return 'text-green-600';
      case 'Negotiate':
        return 'text-yellow-600';
      case 'Avoid':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Contract Analysis Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
            <p className={`text-xl font-bold ${getRiskLevelColor(summary.riskLevel)}`}>
              {summary.riskLevel} Risk
            </p>
            <p className="text-sm text-gray-600">
              Weighted Score: {summary.weightedScore} / Average Score: {summary.averageScore}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
            <p className={`text-xl font-bold ${getRecommendationColor(summary.recommendation)}`}>
              {summary.recommendation}
            </p>
          </div>
        </div>

        {summary.keyRisks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Key Risks</h3>
            <ul className="space-y-2">
              {summary.keyRisks.map((risk) => (
                <li key={risk.clauseNumber} className="bg-red-50 p-3 rounded">
                  <p className="font-medium">Clause {risk.clauseNumber}</p>
                  <p className="text-sm text-gray-700">{risk.description}</p>
                  <p className="text-sm font-medium text-red-600">Risk Score: {risk.score}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Detailed Analysis</h3>
        <div className="bg-gray-50 p-4 rounded">
          {summary.explanation.split('\n').map((line, index) => (
            <p key={index} className="mb-2 last:mb-0">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractSummary; 