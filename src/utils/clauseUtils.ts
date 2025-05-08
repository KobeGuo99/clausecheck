// Utility to extract clauses from legal contract text
export function extractClauses(text: string): string[] {
  // First, remove any document title or header text
  const cleanText = text.replace(/^(?:SERVICE AGREEMENT|AGREEMENT|CONTRACT|TERMS AND CONDITIONS)[\s\S]*?\n\n/gi, '');

  // Split into potential clauses by numbered sections
  const sections = cleanText.split(/(?=\d+\.\s)/);

  // Process each section to extract the actual clause
  const clauses = sections.map(section => {
    // Remove the section number and clean up
    const cleaned = section.replace(/^\d+\.\s*/, '').trim();
    
    // Skip empty sections or very short ones
    if (!cleaned || cleaned.length < 20) return null;

    // Check if this is a real clause (has actual content, not just a title)
    const hasContent = cleaned.split('\n').length > 1 || cleaned.length > 50;
    if (!hasContent) return null;

    return cleaned;
  }).filter(Boolean) as string[];

  // If we found valid clauses, return them
  if (clauses.length > 0) {
    return clauses;
  }

  // Fallback: if no valid clauses found, try splitting by two or more newlines
  return cleanText
    .split(/\n{2,}/)
    .map(clause => clause.trim())
    .filter(clause => {
      // Must have substantial content
      const hasContent = clause.length > 50;
      // Must not be just a title or header
      const isNotJustTitle = !/^[A-Z\s]+$/.test(clause);
      return hasContent && isNotJustTitle;
    });
} 