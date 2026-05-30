import dotenv from 'dotenv';

dotenv.config();

export const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

export const corsOptions = {
  origin: corsOrigin,
};