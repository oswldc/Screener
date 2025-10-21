import { pool } from '../db.js';
import fs from 'fs';
import path from 'path';

async function processJob(job) {
  try {
    console.log(`Processing job ${job.id} (${job.job_title})...`);

    await pool.query("UPDATE jobs SET status = 'processing' WHERE id = $1", [
      job.id,
    ]);

    // Ambil path
    const cv = await pool.query('SELECT * FROM uploads WHERE id = $1', [
      job.cv_id,
    ]);
    const report = await pool.query('SELECT * FROM uploads WHERE id = $1', [
      job.report_id,
    ]);

    const cvFile = cv.rows[0];
    const reportFile = report.rows[0];

    console.log(' CV:', cvFile.filepath);
    console.log(' Report:', reportFile.filepath);

    const fakeResult = {
      cv_match_rate: Math.random().toFixed(2),
      cv_feedback: 'Strong backend experience.',
      project_score: (Math.random() * 5).toFixed(1),
      project_feedback: 'Well-structured and comprehensive report.',
      overall_summary:
        'The candidate shows promise with relevant skills and a solid project background.',
    };

    await pool.query(
      `INSERT INTO results (job_id, cv_match_rate, cv_feedback, project_score, project_feedback, overall_summary) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        job.id,
        fakeResult.cv_match_rate,
        fakeResult.cv_feedback,
        fakeResult.project_score,
        fakeResult.project_feedback,
        fakeResult.overall_summary,
      ]
    );

    // Update job status to completed
    await pool.query("UPDATE jobs SET status = 'completed' WHERE id = $1", [
      job.id,
    ]);

    console.log(`Job ${job.id} completed.`);
  } catch (err) {
    console.log(`Error processing job ${job.id}:`, err.message);
    await pool.query("UPDATE jobs SET status = 'failed' WHERE id = $1", [
      job.id,
    ]);
  }
}

export async function runQueue() {
  try {
    const res = await pool.query(
      "SELECT * FROM jobs WHERE status = 'queued' LIMIT 1"
    );
    if (res.rows.length === 0) return;

    const job = res.rows[0];
    await processJob(job);
  } catch (err) {
    console.error('Error running job queue', err.message);
  }
}
