import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../dist');
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if (path.startsWith('/api/')) {
      const body = await readFile(file).catch(() => Buffer.from('{"error":"Backend not configured"}'));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(body);
      return;
    }
    let info;
    try { info = await stat(file); } catch {
      if (extname(file)) { res.writeHead(404).end('Not found'); return; }
      file = resolve(root, 'index.html'); info = await stat(file);
    }
    if (info.isDirectory()) { file = resolve(root, 'index.html'); info = await stat(file); }
    const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    let start = 0, end = info.size - 1;
    if (range) {
      if (!range[1]) start = Math.max(0, info.size - Number(range[2]));
      else { start = Number(range[1]); if (range[2]) end = Math.min(Number(range[2]), end); }
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(file, { start, end }).pipe(res);
  } catch { res.writeHead(500).end('Server error'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}/?embed=1`));
