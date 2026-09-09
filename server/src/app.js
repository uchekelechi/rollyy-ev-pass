import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import geocodeRoutes from './routes/geocode.routes.js';
import chargingRoutes from './routes/charging.routes.js';
import parkingRoutes from './routes/parking.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import carwashRoutes from './routes/carwash.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import reservationRoutes from './routes/reservations.routes.js';
import intentRoutes from './routes/intent.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'rollyy-server' }));

  app.use('/api/geocode', geocodeRoutes);
  app.use('/api/charging', chargingRoutes);
  app.use('/api/parking', parkingRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/carwash', carwashRoutes);
  app.use('/api/weather', weatherRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/intent', intentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
