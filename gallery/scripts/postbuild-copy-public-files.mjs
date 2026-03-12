import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicHtaccess = path.join(projectRoot, 'public', '.htaccess');
const distDir = path.join(projectRoot, 'dist');
const distHtaccess = path.join(distDir, '.htaccess');

if (existsSync(publicHtaccess)) {
  mkdirSync(distDir, { recursive: true });
  copyFileSync(publicHtaccess, distHtaccess);
}
