import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8'
};

export function startPreview(port = 5173) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      let pathname = decodeURIComponent(url.pathname);
      // Exercise the same relative paths as a GitHub Pages project site.
      if (pathname === '/scrp-regelwerk') {
        response.writeHead(302, { location: '/scrp-regelwerk/' });
        return response.end();
      }
      if (pathname.startsWith('/scrp-regelwerk/')) pathname = pathname.slice('/scrp-regelwerk'.length);
      if (pathname.split(/[\\/]/).some(part => part.startsWith('.'))) {
        response.writeHead(403);
        return response.end('Forbidden');
      }
      let file = resolve(root, `.${pathname}`);
      if (!file.startsWith(root + sep)) {
        if (file !== root) throw new Error('Outside public root');
      }
      let info = await stat(file);
      if (info.isDirectory()) { file = resolve(file, 'index.html'); info = await stat(file); }
      response.writeHead(200, {
        'content-type': mime[extname(file)] || 'application/octet-stream',
        'content-length': info.size, 'cache-control': 'no-store',
        'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin'
      });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  });
  return new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => accept(server));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = await startPreview(Number(process.env.PORT || 5173));
  console.log(`SCRP preview: http://127.0.0.1:${server.address().port}/scrp-regelwerk/`);
}
