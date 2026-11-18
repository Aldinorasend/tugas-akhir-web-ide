import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolusi path root monorepo: config -> src -> server -> packages -> root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../..', '.env');

// Satu-satunya tempat loading .env di server (file .env ada di root monorepo)
dotenv.config({ path: rootEnvPath });
