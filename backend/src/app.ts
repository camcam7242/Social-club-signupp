import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initSocket } from './services/socketService';
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import requestRoutes from './routes/requests';
import mechanicRoutes from './routes/mechanics';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import reviewRoutes from './routes/reviews';
import jobRoutes from './routes/jobs';
import terminalRoutes from './routes/terminal';
import pushRoutes from './routes/push';
import chatRoutes from './routes/chat';
import documentRoutes from './routes/documents';
import availabilityRoutes from './routes/availability';
import disputeRoutes from './routes/disputes';
import jobNotesRoutes from './routes/jobNotes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';

dotenv.config();

// Fail fast if critical env vars are missing
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'STRIPE_SECRET_KEY', 'DATABASE_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin && process.env.NODE_ENV === 'production') {
  throw new Error('FRONTEND_URL must be set in production');
}
app.use(cors({ origin: allowedOrigin || '*', credentials: !!allowedOrigin }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/jobs/:jobId/chat', chatRoutes);
app.use('/api/mechanics/documents', documentRoutes);
app.use('/api/mechanics/availability', availabilityRoutes);
app.use('/api/jobs/:jobId/dispute', disputeRoutes);
app.use('/api/jobs/:jobId/notes', jobNotesRoutes);

// Health check — internal only, not rate-limited but also not informative
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
