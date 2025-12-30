import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db';
import hackathonRoutes from './routes/hackathons';
import { startScheduler } from './cron/scheduler';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hackathons', hackathonRoutes);

// Database Connection & Server Start
const startServer = async () => {
  // await connectDB(); // Keeping this commented as we are using Firestore now? Wait, let me check utils/db.ts
  
  // Start Cron Jobs
  startScheduler();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
