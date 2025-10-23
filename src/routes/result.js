import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /result/:id
router.get('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;

    const jobRes = await pool.query('SELECT * FROM jobs WHERE id = $1', [
      jobId,
    ]);
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ error: `Job with id ${jobId} not found` });
    }

    const job = jobRes.rows[0];

    if (job.status !== 'completed') {
      return res.status(200).json({
        id: job.id,
        status: job.status,
      });
    }

    const resultRes = await pool.query(
      'SELECT * FROM results WHERE job_id = $1',
      [jobId]
    );

    if (resultRes.rows.lengt === 0) {
      return res.status(200).json({
        id: job.id,
        status: 'completed',
        result: null,
      });
    }

    const result = resultRes.rows[0];

    res.status(200).json({
      id: job.id,
      status: job.status,
      result: {
        cv_match_rate: result.cv_match_rate,
        cv_feedback: result.cv_feedback,
        project_score: result.project_score,
        project_feedback: result.project_feedback,
        overall_summary: result.overall_summary,
      },
    });
  } catch (err) {
    console.error('Error in /result/:id', err.message);
    res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
