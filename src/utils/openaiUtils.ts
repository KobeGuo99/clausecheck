/**
 * Represents the analysis result for a single contract clause
 */
export interface ClauseAnalysisResult {
  summary: string;
  dangerScore: number;
  riskReason: string;
  remediationAdvice?: string;
  confidenceScore?: number;
}

/**
 * Represents the overall summary of a contract analysis
 */
export interface ContractSummary {
  averageScore: number;
  weightedScore: number;
  riskLevel: 'Safe' | 'Moderate' | 'High' | 'Critical';
  recommendation: 'Accept' | 'Negotiate' | 'Avoid';
  keyRisks: {
    clauseNumber: number;
    description: string;
    score: number;
  }[];
  explanation: string;
}

/**
 * Scoring guide for danger scores in contract clause analysis
 * Defines risk levels and provides examples for each range
 */
const SCORING_GUIDE = `
Danger Score Scale:
0–19: ✅ Safe
- Standard, reciprocal, or legally required terms.
- No significant impact on user rights or expectations.
Examples: Mutual confidentiality, reasonable payment terms, jurisdiction matching user's country.

20–39:⚠️ Low Risk / Monitor
- Common clauses that may slightly favor one party, but usually acceptable.
- Watch for interaction with more dangerous clauses.
Examples: Auto-renewal with opt-out, minor service disclaimers, limits on liability with carve-outs.

40–59: 🟡 Moderate Risk / Needs Review
- One-sided or vague clauses that could disadvantage users under certain conditions.
- Reasonable in B2B or enterprise contracts, but questionable in consumer-facing agreements.
Examples: Broad indemnification, service change clauses without notice, non-refundable charges.

60–79: 🔶 High Risk / Potentially Exploitative
- Shifts significant power or risk to the company.
- Often non-negotiable in consumer contexts, but should be flagged and explained.
Examples: Forced arbitration, unilateral contract modification, strict termination rules, liquidated damages.

80–100: ❌ Predatory / Abusive
- Severely limits user rights or imposes unfair obligations.
- Often unenforceable or illegal in consumer jurisdictions.
Examples: Perpetual data rights, one-sided dispute resolution with biased venue, complete termination control, gag clauses with penalties.

Scoring Rules of Thumb:
- Danger compounds: If multiple medium-risk clauses work together (e.g. arbitration + no refunds + no termination), raise scores.
- Absurd fee amounts, hidden timelines, or vague enforcement = +10 bump.
- If a clause looks boilerplate but does something extreme (e.g. buries $50K in damages in fine print), score accordingly (80+).

Use scoring to prioritize **user explanation, not legal enforcement**.
`;

/**
 * Analyzes a single contract clause using OpenAI's API
 * @param clauseText - The text of the clause to analyze
 * @returns Promise resolving to the analysis result
 */
export async function analyzeClauseWithOpenAI(
  clauseText: string
): Promise<ClauseAnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is not set. Please define VITE_OPENAI_API_KEY in your .env file."
    );
  }

  // Validate clause text
  if (!clauseText || clauseText.trim().length < 10) {
    return {
      summary: "Invalid clause text",
      dangerScore: 0,
      riskReason:
        "The provided text is too short or empty to be a valid clause.",
      remediationAdvice: "Provide a complete clause for analysis.",
      confidenceScore: 100,
    };
  }

  const prompt = `Analyze the following legal contract clause. Provide a detailed analysis with:
1. A concise summary (1-2 sentences)
2. A danger score from 0 (safe) to 100 (very risky) using this scale:
${SCORING_GUIDE}
3. A detailed risk assessment explaining WHY the clause is dangerous, not just what it does
4. Specific remediation advice for what to look for in a safer version
5. A confidence score (0-100) in your analysis

Consider:
- Real-world examples of how such clauses have been abused
- Whether the clause is common but risky vs common and safe
- The practical impact on the client's rights and protections
- How this clause might interact with other potentially dangerous clauses

Clause: ${clauseText}

Respond ONLY with a valid JSON object with keys: summary, dangerScore, riskReason, remediationAdvice, confidenceScore. Do not include any explanation or code block formatting.`;

  try {
    const response = await fetch("https://api.openAI.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are a legal contract analysis assistant specializing in identifying unfair terms and potential scams. Be direct and specific about risks. Do not downplay serious concerns by calling them "common practice." Use the provided scoring guide to assign appropriate danger scores.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI.");
    }

    // Try to parse the JSON from the response
    try {
      const result = JSON.parse(content);
      // Validate the result structure
      if (
        !result.summary ||
        typeof result.dangerScore !== "number" ||
        !result.riskReason
      ) {
        throw new Error("Invalid response structure from OpenAI");
      }
      return {
        summary: result.summary,
        dangerScore: Math.max(0, Math.min(100, result.dangerScore)),
        riskReason: result.riskReason,
        remediationAdvice:
          result.remediationAdvice ||
          "No specific remediation advice provided.",
        confidenceScore:
          typeof result.confidenceScore === "number"
            ? Math.max(0, Math.min(100, result.confidenceScore))
            : 80,
      };
    } catch (e) {
      // Try to extract JSON object from code block or extra text
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const result = JSON.parse(match[0]);
          if (
            !result.summary ||
            typeof result.dangerScore !== "number" ||
            !result.riskReason
          ) {
            throw new Error("Invalid response structure from OpenAI");
          }
          return {
            summary: result.summary,
            dangerScore: Math.max(0, Math.min(100, result.dangerScore)),
            riskReason: result.riskReason,
            remediationAdvice:
              result.remediationAdvice ||
              "No specific remediation advice provided.",
            confidenceScore:
              typeof result.confidenceScore === "number"
                ? Math.max(0, Math.min(100, result.confidenceScore))
                : 80,
          };
        } catch (e2) {
          console.error("Failed to parse extracted JSON object:", match[0]);
        }
      }
      console.error("Raw OpenAI response:", content);
      throw new Error("Failed to parse OpenAI response as JSON.");
    }
  } catch (error) {
    console.error("Error analyzing clause:", error);
    return {
      summary: "Analysis failed",
      dangerScore: 50,
      riskReason: `Could not analyze clause: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      remediationAdvice:
        "Unable to provide remediation advice due to analysis failure.",
      confidenceScore: 0,
    };
  }
}

/**
 * Analyzes multiple contract clauses in batch using OpenAI's API
 * @param clauseTexts - Array of clause texts to analyze
 * @returns Promise resolving to an array of analysis results
 */
export async function analyzeClausesBatchWithOpenAI(
  clauseTexts: string[]
): Promise<ClauseAnalysisResult[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is not set. Please define VITE_OPENAI_API_KEY in your .env file."
    );
  }

  const prompt = `Analyze the following legal contract clauses. For each clause, provide:
1. A concise summary (1-2 sentences)
2. A danger score from 0 (safe) to 100 (very risky) using this scale:
${SCORING_GUIDE}
3. A detailed risk assessment explaining WHY the clause is dangerous
4. Specific remediation advice for what to look for in a safer version
5. A confidence score (0-100) in your analysis

Consider:
- Real-world examples of how such clauses have been abused
- Whether the clause is common but risky vs common and safe
- The practical impact on the client's rights and protections
- How clauses might interact with each other to compound risks

Clauses:
${clauseTexts.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Also provide an overall assessment of the contract's risk level and any patterns of concerning clauses.

Respond ONLY with a valid JSON array, where each element has: summary, dangerScore, riskReason, remediationAdvice, confidenceScore, followed by an overallAssessment object. Do not include any explanation or code block formatting.`;

  try {
    const response = await fetch("https://api.openAI.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'You are a legal contract analysis assistant specializing in identifying unfair terms and potential scams. Be direct and specific about risks. Do not downplay serious concerns by calling them "common practice." Use the provided scoring guide to assign appropriate danger scores.',
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI.");
    }

    // Try to parse the JSON array from the response
    try {
      const result = JSON.parse(content);
      if (!Array.isArray(result)) throw new Error("Response is not an array");
      return result.map((item) => ({
        summary: item.summary || "",
        dangerScore:
          typeof item.dangerScore === "number"
            ? Math.max(0, Math.min(100, item.dangerScore))
            : 50,
        riskReason: item.riskReason || "",
        remediationAdvice:
          item.remediationAdvice || "No specific remediation advice provided.",
        confidenceScore:
          typeof item.confidenceScore === "number"
            ? Math.max(0, Math.min(100, item.confidenceScore))
            : 80,
      }));
    } catch (e) {
      // Try to extract JSON array from code block or extra text
      const match = content.match(/\[\s*[\{\[].*[\}\]]\s*\]/s);
      if (match) {
        try {
          const result = JSON.parse(match[0]);
          if (!Array.isArray(result))
            throw new Error("Extracted response is not an array");
          return result.map((item) => ({
            summary: item.summary || "",
            dangerScore:
              typeof item.dangerScore === "number"
                ? Math.max(0, Math.min(100, item.dangerScore))
                : 50,
            riskReason: item.riskReason || "",
            remediationAdvice:
              item.remediationAdvice ||
              "No specific remediation advice provided.",
            confidenceScore:
              typeof item.confidenceScore === "number"
                ? Math.max(0, Math.min(100, item.confidenceScore))
                : 80,
          }));
        } catch (e2) {
          console.error("Failed to parse extracted JSON array:", match[0]);
        }
      }
      console.error("Raw OpenAI response (batch):", content);
      throw new Error("Failed to parse OpenAI batch response as JSON array.");
    }
  } catch (error) {
    console.error("Error analyzing clauses:", error);
    return clauseTexts.map(() => ({
      summary: "Analysis failed",
      dangerScore: 50,
      riskReason: `Could not analyze clause: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      remediationAdvice:
        "Unable to provide remediation advice due to analysis failure.",
      confidenceScore: 0,
    }));
  }
}
