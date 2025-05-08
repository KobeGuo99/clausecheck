export interface ClauseAnalysisResult {
  summary: string;
  dangerScore: number;
  riskReason: string;
}

export async function analyzeClauseWithOpenAI(clauseText: string): Promise<ClauseAnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) {
    throw new Error('OpenAI API key is not set. Please define VITE_OPENAI_API_KEY in your .env file.');
  }

  const prompt = `Analyze the following legal contract clause. Summarize it in 1-2 sentences, assign a danger score from 0 (safe) to 100 (very risky), and explain the risk in 1-2 sentences.\n\nClause: ${clauseText}\n\nRespond ONLY with a valid JSON object with keys: summary, dangerScore, riskReason. Do not include any explanation or code block formatting.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a legal contract analysis assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI.');
  }

  // Try to parse the JSON from the response
  try {
    const result = JSON.parse(content);
    return {
      summary: result.summary || '',
      dangerScore: typeof result.dangerScore === 'number' ? result.dangerScore : 50,
      riskReason: result.riskReason || '',
    };
  } catch (e) {
    // Try to extract JSON object from code block or extra text
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const result = JSON.parse(match[0]);
        return {
          summary: result.summary || '',
          dangerScore: typeof result.dangerScore === 'number' ? result.dangerScore : 50,
          riskReason: result.riskReason || '',
        };
      } catch (e2) {
        console.error('Failed to parse extracted JSON object:', match[0]);
      }
    }
    console.error('Raw OpenAI response (single):', content);
    throw new Error('Failed to parse OpenAI response as JSON.');
  }
}

// Batch analysis for multiple clauses
export async function analyzeClausesBatchWithOpenAI(clauseTexts: string[]): Promise<ClauseAnalysisResult[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) {
    throw new Error('OpenAI API key is not set. Please define VITE_OPENAI_API_KEY in your .env file.');
  }

  const prompt = `Analyze the following legal contract clauses. For each clause, summarize it in 1-2 sentences, assign a danger score from 0 (safe) to 100 (very risky), and explain the risk in 1-2 sentences.\n\nClauses:\n${clauseTexts.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nRespond ONLY with a valid JSON array, where each element has: summary, dangerScore, riskReason, in the same order as the clauses. Do not include any explanation or code block formatting.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a legal contract analysis assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI.');
  }

  // Try to parse the JSON array from the response
  try {
    const result = JSON.parse(content);
    if (!Array.isArray(result)) throw new Error('Response is not an array');
    return result.map((item) => ({
      summary: item.summary || '',
      dangerScore: typeof item.dangerScore === 'number' ? item.dangerScore : 50,
      riskReason: item.riskReason || '',
    }));
  } catch (e) {
    // Try to extract JSON array from code block or extra text
    const match = content.match(/\[\s*[\{\[].*[\}\]]\s*\]/s);
    if (match) {
      try {
        const result = JSON.parse(match[0]);
        if (!Array.isArray(result)) throw new Error('Extracted response is not an array');
        return result.map((item) => ({
          summary: item.summary || '',
          dangerScore: typeof item.dangerScore === 'number' ? item.dangerScore : 50,
          riskReason: item.riskReason || '',
        }));
      } catch (e2) {
        console.error('Failed to parse extracted JSON array:', match[0]);
      }
    }
    console.error('Raw OpenAI response (batch):', content);
    throw new Error('Failed to parse OpenAI batch response as JSON array.');
  }
} 