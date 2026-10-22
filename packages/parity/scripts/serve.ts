// Minimal static file server for Storybook builds (used by the a11y check and the e2e tests).
//   node scripts/serve.ts ../vue/storybook-static 6107
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, resolve } from 'node:path';

const MIME: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    // pdf.js loads its worker as a module – browsers refuse a module script without a JavaScript type
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
};

/** Serves `dir` on `port` (0 = any free port) and returns the base URL. */
export async function serve(dir: string, port = 0): Promise<string> {
    const root = resolve(dir);
    const server = createServer((request, response) => {
        const path = join(root, decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname));
        const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
        if (!file.startsWith(root) || !existsSync(file)) {
            response.writeHead(404).end();
            return;
        }
        response.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        createReadStream(file).pipe(response);
    });
    await new Promise<void>((done) => server.listen(port, '127.0.0.1', done));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

if (import.meta.main) {
    const [dir, port] = process.argv.slice(2);
    if (!dir) throw new Error('Usage: node scripts/serve.ts <dir> [port]');
    console.log(`Serving ${dir} on ${await serve(dir, Number(port ?? 0))}`);
}
