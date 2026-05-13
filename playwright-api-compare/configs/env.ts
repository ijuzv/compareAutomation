import * as dotenv from 'dotenv';
import * as path from 'path';

// Load global .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  V1: {
    BASE_URL: process.env.BASE_URL_V1 || 'http://localhost:3000/v1',
    API_URL: process.env.API_URL_V1 || 'http://localhost:4000/v1',
  },
  V2: {
    BASE_URL: process.env.BASE_URL_V2 || 'http://localhost:3000/v2',
    API_URL: process.env.API_URL_V2 || 'http://localhost:4000/v2',
  },
  SCREENSHOT_INTERVAL: parseInt(process.env.SCREENSHOT_INTERVAL || '300000', 10),
  WORKERS: parseInt(process.env.WORKERS || '4', 10),
  HEADLESS: process.env.HEADLESS !== 'false',
  DEVICE: process.env.DEVICE || 'Desktop Chrome'
};
