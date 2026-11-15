// Static server for the browser tests (started by playwright.config.ts).
//
//   /ohashi-editor.js        the bundle under test: dist/, or $BUNDLE to test
//                            another build (e.g. an older one, to prove a
//                            test catches a regression)
//   /sanitizer-cases.json    the shared sanitiser cases
//   /<anything else>         tests/browser/pages/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const pages = resolve(here, 'pages');
const bundle = process.env.BUNDLE ? resolve(process.env.BUNDLE) : resolve(here, '../../dist/ohashi-editor.js');
const fixtures = resolve(here, '../fixtures/sanitizer-cases.json');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file =
    path === '/ohashi-editor.js' ? bundle
    : path === '/sanitizer-cases.json' ? fixtures
    : join(pages, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(pages) && file !== bundle && file !== fixtures) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': `${types[extname(file)] ?? 'application/octet-stream'}; charset=utf-8` }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(Number(process.env.PORT ?? 4173), '127.0.0.1');
