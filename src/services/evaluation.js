import { getRelevantContext } from './chroma.js';
import { generateEvaluation } from './gemini.js';

export async function evaluateCandidate(cvText, reportText, jobTitle) {
  const context = await getRelevantContext(jobTitle, 'case_study');
  const prompt = `
Context:
${context}

Candidate CV:
${cvText}

Project Report:
${reportText}
...
`;

  return await generateEvaluation(prompt);
}
