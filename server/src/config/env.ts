import dotenv from 'dotenv';
import path from 'path';

// Load .env file from root of server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  // Supabase Auth & Config
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // Databases
  DATABASE_URL: string;
  DIRECT_URL?: string;
  MONGODB_URI: string;
  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_DB: number;
  REDIS_URL?: string;
  // Cookie Configuration
  COOKIE_SAME_SITE: 'lax' | 'none' | 'strict';
  COOKIE_SECURE: boolean;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://kuvqrpblrqjogprywqjw.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthya_sahayak',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_URL: process.env.REDIS_URL || undefined,
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict') || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  COOKIE_SECURE: process.env.COOKIE_SECURE !== undefined ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
};
