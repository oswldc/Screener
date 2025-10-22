import express from 'express';
import { pool } from '../db.js';
import { runQueue } from '../jobs/queue.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { job_title, cv_id, report_id } = req.body;

    if (!job_title || !cv_id || !report_id) {
      return res.status(400).json({
        error: 'Missing job_title, cv_id, or report_id',
      });
    }

    const cvCheck = await pool.query(
      "SELECT * FROM uploads WHERE id = $1 AND type = 'cv'",
      [cv_id]
    );
    const reportCheck = await pool.query(
      "SELECT * FROM uploads WHERE id = $1 AND type = 'report'",
      [report_id]
    );

    if (cvCheck.rows.length === 0) {
      return res.status(404).json({ error: `CV with id ${cv_id} not found` });
    }
    if (reportCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: `Project report with id ${report_id} not found` });
    }

    const job = await pool.query(
      "INSERT INTO jobs (job_title, cv_id, report_id, status) VALUES ($1, $2, $3, 'queued') RETURNING id, status",
      [job_title, cv_id, report_id]
    );
    await runQueue();

    const jobData = job.rows[0];

    res.status(200).json({
      id: jobData.id,
      status: jobData.status,
    });
  } catch (err) {
    console.error('Error creating evaluation job:', err);
    res.status(500).json({ error: 'Failed to queue evaluation job' });
  }
});

export default router;
