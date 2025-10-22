import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db.js';
import uploadRoutes from './routes/upload.js';
import evaluateRoutes from './routes/evaluate.js';
import resultRoutes from './routes/result.js';
import { runQueue } from './jobs/queue.js';

dotenv.config();
const app = express();

app.use(express.json());
app.use('/upload', uploadRoutes);
app.use('/evaluate', evaluateRoutes);
app.use('/result', resultRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
