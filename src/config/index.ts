import * as fs from 'fs';
import { join } from 'node:path';
import crypto from 'node:crypto';

function loadKey(envVarName: string, defaultFileName: string, isPrivate: boolean): string {
  const envVal = process.env[envVarName];
  if (envVal && (envVal.includes('-----BEGIN') || envVal.includes('KEY-----'))) {
    return envVal.replace(/\\n/g, '\n');
  }

  const keyPath = envVal || join(process.cwd(), 'keys', defaultFileName);

  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf-8');
  }

  // If file does not exist, auto-generate key pair
  const keysDir = join(process.cwd(), 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const privPath = join(keysDir, 'private.key');
  const pubPath = join(keysDir, 'public.key');

  if (!fs.existsSync(privPath) || !fs.existsSync(pubPath)) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    fs.writeFileSync(privPath, privateKey);
    fs.writeFileSync(pubPath, publicKey);
  }

  return isPrivate ? fs.readFileSync(privPath, 'utf-8') : fs.readFileSync(pubPath, 'utf-8');
}

const Config = {
  PORT: process.env['PORT'] || '8080',
  MONGODB_URI: process.env['MONGODB_URI'] || '',
  ACCESS_TOKEN_PRIVATE_KEY: loadKey('ACCESS_TOKEN_PRIVATE_KEY', 'private.key', true),
  ACCESS_TOKEN_PUBLIC_KEY: loadKey('ACCESS_TOKEN_PUBLIC_KEY', 'public.key', false),
  REFRESH_TOKEN_PRIVATE_KEY: loadKey('REFRESH_TOKEN_PRIVATE_KEY', 'private.key', true),
  REFRESH_TOKEN_PUBLIC_KEY: loadKey('REFRESH_TOKEN_PUBLIC_KEY', 'public.key', false),
  REFRESH_TOKEN_EXP: process.env['REFRESH_TOKEN_EXP'] || '30d',
  ACCESS_TOKEN_EXP: process.env['ACCESS_TOKEN_EXP'] || '600s',
  GOOGLE_ID: process.env['GOOGLE_CLIENT_ID'] || 'dummy-google-client-id',
  GOOGLE_SECRET: process.env['GOOGLE_CLIENT_SECRET'] || 'dummy-google-client-secret',
  GOOGLE_REDIRECT: 'http://localhost:8080/api/auth/google/redirect',
  ProfileImagesDir: join(__dirname, '..', '..', 'uploads', 'profile'),
  CatImagesDir: join(__dirname, '..', '..', 'uploads', 'category'),
  ProductImagesDir: join(__dirname, '..', '..', 'uploads', 'product'),
  ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'] || 'dummy-encryption-key-123456789012',
  STRIPE_PUBLIC_KEY: process.env['STRIPE_PUBLIC_KEY'] || 'pk_test_dummy',
  STRIPE_PRIVATE_KEY: process.env['STRIPE_PRIVATE_KEY'] || 'sk_test_dummy',
  STRIPE_ENDPOINT_SECRET: process.env['STRIPE_ENDPOINT_SECRET'] || 'whsec_dummy',
  EMAIL_SENDER: process.env['EMAIL_SENDER'] || 'dummy@example.com',
  EMAIL_SENDER_PASSWORD: process.env['EMAIL_SENDER_PASSWORD'] || 'dummy-password',
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  Default_Notification: false, // Change this if you want to customize notification
};
export default Config;
