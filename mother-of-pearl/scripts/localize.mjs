import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root = resolve(import.meta.dirname, '..');
const run = promisify(execFile);
const fontPath = resolve(root, 'dist/assets/google-fonts.css');
let css = await readFile(fontPath, 'utf8');
const fontUrls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g) ?? [])];
await mkdir(resolve(root, 'dist/assets/fonts'), { recursive: true });
for (const [i, url] of fontUrls.entries()) {
  const path = `/assets/fonts/${new URL(url).pathname.split('/').at(-1)}`;
  await run('curl.exe', ['--fail', '--location', '--silent', '--show-error', '--max-time', '60', url, '-o', resolve(root, 'dist' + path)]);
  css = css.replaceAll(url, path);
  console.log(`Font ${i + 1}/${fontUrls.length}`);
}
await writeFile(fontPath, css);
let html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
html = html.replace(/\s*<link rel="preconnect"[^>]+>/g, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/, '<link rel="stylesheet" href="/assets/google-fonts.css">')
  .replace(/<script defer src="\/(?:~flock\.js|__l5e\/events\.[^"]+\.js)"[^>]*><\/script>/g, '');
await writeFile(resolve(root, 'dist/index.html'), html);
const jsPath = resolve(root, 'dist/assets/index-C7F6jN74.js');
let js = await readFile(jsPath, 'utf8');
// Keep all presentation code unchanged; the source site's private services
// cannot be cloned. Use an unconfigured local endpoint instead of contacting it.
js = js.replace('const Xz="https://kgiystryyzikemyfnafi.supabase.co",Kx="sb_publishable_3XCPvPz3HBBiFDHXAhPuAw_xbo07MkP"', 'const Xz=window.location.origin+"/api",Kx="clone-backend-not-configured"');
await writeFile(jsPath, js);
await mkdir(resolve(root, 'dist/api/functions/v1'), { recursive: true });
await writeFile(resolve(root, 'dist/api/functions/v1/submit-rsvp'), JSON.stringify({ error: 'RSVP delivery is not configured for this copy yet.' }));
await writeFile(resolve(root, 'dist/api/functions/v1/admin-login'), JSON.stringify({ success: false, error: 'The original private admin service is not part of this copy.' }));
console.log('Localized typefaces and isolated private services. Presentation preserved.');
