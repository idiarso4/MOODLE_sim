import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { authRouter } from './routes/auth';
import { attendanceRouter } from './routes/attendance';
import { errorHandler } from './middleware/error-handler';
import { metricsMiddleware } from './middleware/metrics';

const app = express();

app.use(cors());
app.use(json());
app.use(metricsMiddleware);

// Routes
app.use('/auth', authRouter);
app.use('/attendance', attendanceRouter);

// Error handling
app.use(errorHandler);

export { app };
