import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './lib/db.js';

// Route imports
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import partyRoutes from './routes/parties.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import purchaseRoutes from './routes/purchases.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import returnRoutes from './routes/returns.js';
import quotationRoutes from './routes/quotations.js';
import bankingRoutes from './routes/banking.js';
import payrollRoutes from './routes/payroll.js';

const app = express();
const PORT = process.env.PORT || 7000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';

// Middleware configuration
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow configured origins or any vercel.app deployment
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Ensure database connection for serverless/Vercel and standard requests
app.use(async (req, res, next) => {
  // Skip DB check for simple health check
  if (req.path === '/api/health') return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is set correctly in environment variables.',
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', businessRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/payroll', payrollRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Hisaaboo Backend API',
    version: '1.0.0',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    console.log('✓ MongoDB Connected Successfully to hisaaboo');

    app.listen(PORT, () => {
      console.log(`🚀 Hisaaboo Backend API Server running on port ${PORT}`);
      console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start standalone server only when not running in Vercel/serverless
if (!process.env.VERCEL) {
  startServer();
}

export default app;
