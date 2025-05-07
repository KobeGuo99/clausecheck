import React, { useState } from 'react';
import type { Clause } from '../types';

interface ClauseCardProps {
  clause: Clause;
}

const ClauseCard: React.FC<ClauseCardProps> = ({ clause }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDangerColor = (score: number) => {
    if (score <= 33) return 'bg-green-100 text-green-800';
    if (score <= 66) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getDangerColor(
                clause.dangerScore
              )}`}
            >
              Danger Score: {clause.dangerScore}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
          <h3 className="text-lg font-semibold mt-2">Summary</h3>
          <p className="text-gray-600 mt-1">{clause.summary}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-md font-semibold text-gray-700">Original Clause</h4>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{clause.originalText}</p>
          </div>
          <div>
            <h4 className="text-md font-semibold text-gray-700">Risk Assessment</h4>
            <p className="text-gray-600 mt-1">{clause.riskReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClauseCard; 