import { pool } from '../db.js';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'; // ← gunakan versi legacy agar kompatibel Node

let isProcessing = false;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function readPdfText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(' ') + '\n';
  }

  return text;
}

async function evaluateWithGemini(cvText, reportText, jobTitle) {
  const prompt = `
You are an AI evaluator for recruitment.
Evaluate the candidate based on the following inputs.

---
**Job Title:** ${jobTitle}

**CV Content:**
${cvText}

**Project Report Content:**
${reportText}
---

Please respond in JSON format with these exact fields:
{
  "cv_match_rate": number (0-1),
  "cv_feedback": string,
  "project_score": number (0-5),
  "project_feedback": string,
  "overall_summary": string
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Error parsing Gemini response:', err.message);
    console.log('Raw response:', text);
    return {
      cv_match_rate: 0,
      cv_feedback: 'Failed to parse Gemini output',
      project_score: 0,
      project_feedback: 'Failed to parse Gemini output',
      overall_summary: 'Evaluation error',
    };
  }
}

async function processJob(job) {
  try {
    console.log(`Processing job ${job.id} (${job.job_title})...`);

    const cv = await pool.query('SELECT * FROM uploads WHERE id = $1', [
      job.cv_id,
    ]);
    const report = await pool.query('SELECT * FROM uploads WHERE id = $1', [
      job.report_id,
    ]);

    const cvText = await readPdfText(cv.rows[0].filepath);
    const reportText = await readPdfText(report.rows[0].filepath);

    const aiResult = await evaluateWithGemini(
      cvText,
      reportText,
      job.job_title
    );

    await pool.query(
      `INSERT INTO results
      (job_id, cv_match_rate, cv_feedback, project_score, project_feedback, overall_summary)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        job.id,
        aiResult.cv_match_rate,
        aiResult.cv_feedback,
        aiResult.project_score,
        aiResult.project_feedback,
        aiResult.overall_summary,
      ]
    );

    await pool.query("UPDATE jobs SET status = 'completed' WHERE id = $1", [
      job.id,
    ]);
    console.log(`✅ Job ${job.id} completed.`);
  } catch (err) {
    console.error(`❌ Error processing job ${job.id}:`, err.message);
    await pool.query("UPDATE jobs SET status = 'failed' WHERE id = $1", [
      job.id,
    ]);
  }
}

export async function runQueue() {
  if (isProcessing) {
    console.log('⚠️  Queue is already running, skipping this cycle.');
    return;
  }

  isProcessing = true;
  console.log('🚀 Queue started at', new Date().toISOString());

  try {
    const res = await pool.query(
      "SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1"
    );
    if (res.rows.length === 0) return;

    const job = res.rows[0];

    // ubah status agar tidak diambil lagi
    await pool.query("UPDATE jobs SET status = 'processing' WHERE id = $1", [
      job.id,
    ]);

    await processJob(job);
  } catch (err) {
    console.error('Error running job queue:', err.message);
  } finally {
    isProcessing = false;
  }
}
