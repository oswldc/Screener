import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';

const router = express.Router();

// setup folder for uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${file.fieldname}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

// POST /upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!type) {
      return res.status(400).json({ error: "Invalid or missing 'type'" });
    }

    const result = await pool.query(
      'INSERT INTO uploads (type, filename, filepath) VALUES ($1, $2, $3) RETURNING id',
      [type, file.originalname, file.path]
    );

    const uploadId = result.rows[0].id;

    res.status(201).json({
      id: uploadId,
      filename: file.originalname,
      type,
      status: 'uploaded',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
