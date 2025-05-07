// Utility to extract clauses from legal contract text
export function extractClauses(text: string): string[] {
  // Regex for clause starts: numbered, lettered, or bullets
  const clauseRegex = /(?:^|\n)(?=\d{1,2}(?:\.\d+)*[\.\)]|\([a-z]\)|[-•])\s+/g;

  // Split using the regex
  const splitByRegex = text.split(clauseRegex).map(clause => clause.trim()).filter(Boolean);

  // Fallback: if fewer than 3 clauses, split by two or more newlines
  if (splitByRegex.length < 3) {
    return text
      .split(/\n{2,}/)
      .map(clause => clause.trim())
      .filter(Boolean);
  }

  return splitByRegex;
} 