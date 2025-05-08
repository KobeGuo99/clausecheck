import React, { useState } from 'react';
import { analyzeClausesBatchWithOpenAI } from '../utils/openaiUtils';
import type { ClauseAnalysisResult } from '../utils/openaiUtils';

/**
 * ContractAnalysis Component
 * 
 * A React component that allows users to analyze multiple contract clauses.
 * Users can add, edit, and remove clauses, then analyze them for potential risks.
 * The analysis results are displayed with risk scores and detailed assessments.
 */
const ContractAnalysis: React.FC = () => {
  const [clauses, setClauses] = useState<string[]>([]);
  const [results, setResults] = useState<ClauseAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates a clause text for minimum requirements
   * @param clause - The clause text to validate
   * @returns Object containing validation status and message
   */
  const validateClause = (clause: string): { isValid: boolean; message: string } => {
    const trimmed = clause.trim();
    if (!trimmed) {
      return { isValid: false, message: 'Clause cannot be empty' };
    }
    if (trimmed.length < 20) {
      return { isValid: false, message: 'Clause is too short for meaningful analysis' };
    }
    return { isValid: true, message: '' };
  };

  /**
   * Initiates the analysis of all clauses
   * Validates clauses first, then sends them for analysis
   * Updates the UI with results or error messages
   */
  const handleAnalyze = async () => {
    if (clauses.length === 0) {
      setError('Please add at least one clause to analyze');
      return;
    }

    const invalidClauses = clauses
      .map((clause, index) => ({ index, ...validateClause(clause) }))
      .filter(result => !result.isValid);

    if (invalidClauses.length > 0) {
      setError(`Invalid clauses found: ${invalidClauses.map(c => c.index + 1).join(', ')}. ${invalidClauses[0].message}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysisResults = await analyzeClausesBatchWithOpenAI(clauses);
      setResults(analysisResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Adds a new empty clause to the list
   */
  const handleAddClause = () => {
    setClauses([...clauses, '']);
    setResults([]);
  };

  /**
   * Updates a specific clause's text
   * @param index - Index of the clause to update
   * @param value - New text value for the clause
   */
  const handleClauseChange = (index: number, value: string) => {
    const newClauses = [...clauses];
    newClauses[index] = value;
    setClauses(newClauses);
    setResults([]);
  };

  /**
   * Removes a clause from the list
   * @param index - Index of the clause to remove
   */
  const handleRemoveClause = (index: number) => {
    const newClauses = clauses.filter((_, i) => i !== index);
    setClauses(newClauses);
    setResults([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Contract Analysis</h1>

      {/* Clause Management Section */}
      <div className="mb-8">
        <button
          onClick={handleAddClause}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Clause
        </button>
      </div>

      {/* Clause Input Section */}
      <div className="space-y-4 mb-8">
        {clauses.map((clause, index) => {
          const validation = validateClause(clause);
          const hasResult = results[index];
          return (
            <div key={index} className="space-y-2">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <textarea
                    value={clause}
                    onChange={(e) => handleClauseChange(index, e.target.value)}
                    className={`w-full p-2 border rounded ${
                      clause.trim() && !validation.isValid ? 'border-red-500' : ''
                    } ${hasResult ? 'bg-gray-50' : ''}`}
                    rows={3}
                    placeholder="Enter clause text..."
                  />
                  {hasResult && (
                    <div className="absolute top-2 right-2 text-sm text-gray-500">
                      Analyzed
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveClause(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
              {clause.trim() && !validation.isValid && (
                <p className="text-red-500 text-sm">{validation.message}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Analysis Controls */}
      <button
        onClick={handleAnalyze}
        disabled={loading || clauses.length === 0}
        className={`px-6 py-3 rounded text-white ${
          loading || clauses.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {loading ? 'Analyzing...' : 'Analyze Contract'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Detailed Analysis</h2>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">Clause {index + 1}</h3>
                  <div className={`px-3 py-1 rounded ${
                    result.dangerScore <= 30 ? 'bg-green-100 text-green-800' :
                    result.dangerScore <= 60 ? 'bg-yellow-100 text-yellow-800' :
                    result.dangerScore <= 80 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Risk Score: {result.dangerScore}
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{result.summary}</p>
                <div className="space-y-2">
                  <p className="font-medium">Risk Assessment:</p>
                  <p className="text-gray-600">{result.riskReason}</p>
                  {result.remediationAdvice && (
                    <>
                      <p className="font-medium mt-4">Remediation Advice:</p>
                      <p className="text-gray-600">{result.remediationAdvice}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractAnalysis; 