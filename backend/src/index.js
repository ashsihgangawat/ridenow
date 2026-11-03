import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { initRideSocket } from './sockets/rideSocket.js';
import { seedDatabase } from './seed.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fareRoutes from './routes/fareRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});
initRideSocket(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'RideNow India Platform Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);

// Direct route aliases for driver and admin specifications
app.use('/driver', driverRoutes);
app.use('/admin', adminRoutes);

// Static frontend build support (for unified production deployment)
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// For SPA routing fallback to index.html if frontend is built
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.json({
        message: 'RideNow Backend API running. Please run frontend Vite server or run npm run build in frontend.',
        endpoints: {
          auth: '/api/auth',
          customer: '/api/customer',
          driver: '/api/driver',
          admin: '/api/admin',
          fare: '/api/fare'
        }
      });
    }
  });
});

// Central error handler
app.use(errorHandler);

// Auto-seed on startup
seedDatabase().catch(err => console.error('[Bootstrap Seed Error]:', err));

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 RideNow Backend & Socket.IO running on http://localhost:${PORT}`);
  console.log(`🇮🇳 Ready for Indian Mobility Fleet Operations`);
  console.log(`👑 Super Admin: admin@ridenow.in | Pass: Admin@123`);
  console.log(`====================================================`);
});

