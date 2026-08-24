import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = process.env.PERF_DIST_DIR || 'dist';
const assetsDir = fileURLToPath(new URL(`../${distDir}/assets/`, import.meta.url));
const files = readdirSync(assetsDir);
const entryName = files.find((name) => /^index-[\w-]+\.js$/.test(name));
if (!entryName) throw new Error('Không tìm thấy JavaScript entry trong dist. Hãy chạy npm run build trước.');

const entryPath = join(assetsDir, entryName);
const gzipBytes = gzipSync(readFileSync(entryPath)).length;
const budgetBytes = 80 * 1024;
const kb = (value) => (value / 1024).toFixed(1);

console.log(`Entry JavaScript: ${kb(gzipBytes)} KB gzip (ngân sách ${kb(budgetBytes)} KB)`);
if (gzipBytes > budgetBytes) {
  console.error('FAIL: JavaScript khởi động vượt ngân sách hiệu năng.');
  process.exitCode = 1;
} else {
  console.log('PASS: JavaScript khởi động nằm trong ngân sách.');
}
