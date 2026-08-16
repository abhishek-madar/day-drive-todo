import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import router from './routes';
import { initQueues } from './queues';
import './workers/task.worker'; 

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

const allowedOrigins = [
  'http://localhost:5173', 
  process.env.FRONTEND_URL || 'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' })); 
app.use('/api', router);

app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: config.vapidPublicKey });
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(config.port, async () => {
    console.log(`Server listening on port ${config.port}`);
    await initQueues();
    console.log('Queues initialized');
  });
}

export default app;
