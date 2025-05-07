import React from 'react';
import type { Clause } from '../types';
import ClauseCard from './ClauseCard';

interface ClauseListProps {
  clauses: Clause[];
}

const ClauseList: React.FC<ClauseListProps> = ({ clauses }) => {
  if (clauses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No clauses to display. Upload a document to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clauses.map((clause) => (
        <ClauseCard key={clause.id} clause={clause} />
      ))}
    </div>
  );
};

export default ClauseList; 