import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const origin = 'https://motherofpearl.thedigitalyes.com';
const files = ['dist/assets/index-C7F6jN74.js', 'dist/assets/index-fCyDNC2C.css'];
const sources = await Promise.all(files.map(file => readFile(resolve(root, file), 'utf8')));
const paths = [...new Set(sources.flatMap(source => source.match(/\/(?:__l5e\/assets-v1|assets)\/[\w./-]+\.(?:png|jpe?g|webp|svg|woff2?|ttf|otf|mp3|mp4|webm|ico)/g) ?? [])), '/favicon.ico'];
const manifest = [];
let index = 0;
async function worker() {
  while (index < paths.length) {
    const path = paths[index++];
    const destination = resolve(root, 'dist', path.slice(1));
    await mkdir(dirname(destination), { recursive: true });
    try { await stat(destination); } catch {
      await run('curl.exe', ['--fail', '--location', '--silent', '--show-error', '--retry', '2', '--max-time', '120', origin + path, '-o', destination]);
    }
    const info = await stat(destination);
    manifest.push({ path, bytes: info.size, source: origin + path });
    console.log(`${manifest.length}/${paths.length} ${path.split('/').at(-1)} (${info.size} bytes)`);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
await writeFile(resolve(root, 'asset-manifest.json'), JSON.stringify(manifest.sort((a,b) => a.path.localeCompare(b.path)), null, 2) + '\n');
console.log(`Downloaded ${manifest.length} assets.`);
