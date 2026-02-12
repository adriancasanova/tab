import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

const app: Application = express();

// Middleware
const isDev = config.nodeEnv === 'development';

// Middleware
// TODO: [SECURITY] Restrict CORS origin in production to specific frontend domain only.
// Currently allows '*' in development for easier local testing (localhost vs 127.0.0.1 vs port variations).
app.use(cors({
    origin: isDev ? '*' : config.frontendUrl,
    credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

export default app;
