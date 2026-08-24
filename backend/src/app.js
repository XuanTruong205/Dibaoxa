import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import cruiseRoutes from './routes/cruiseRoutes.js';
import flightRoutes from './routes/flightRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import travelOrderRoutes from './routes/travelOrderRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import teamRoutes from './routes/teamRoutes.js';

const app = express();

// Middlewares
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || ENV.CORS_ORIGINS.includes(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/cruises', cruiseRoutes);
app.use('/api/v1/flights', flightRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/travel-orders', travelOrderRoutes);
app.use('/api/v1/contact-inquiries', contactRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Dibaoxa API is healthy and operational.',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', (req, res) => {
  res.status(404).json({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: 'Không tìm thấy API được yêu cầu.',
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
