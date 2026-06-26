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

dotenv.config();

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
