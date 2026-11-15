// Writes the manual check pages as single self-contained HTML files, for
// machines without Node (a Windows PC, a Mac): copy the file over and open it
// by double-clicking — it works from file://, no server needed.
//
//   npm run standalone   →   standalone/ime-log.html, standalone/paste-capture.html
//
// The bundle goes in as its own inline module (its top-level names are
// minified and would clash with the page's), followed by the page script with
// deliver.js inlined in place of its import. Inline module scripts run in
// document order, and the pages wait for customElements.whenDefined anyway.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const pages = resolve(here, 'pages');
const out = process.env.OUT ? resolve(process.env.OUT) : resolve(here, '../../standalone');
const bundle = await readFile(process.env.BUNDLE ? resolve(process.env.BUNDLE) : resolve(here, '../../dist/ohashi-editor.js'), 'utf8');
const deliver = (await readFile(resolve(pages, 'deliver.js'), 'utf8')).replace(/^export /gm, '');
const { version } = JSON.parse(await readFile(resolve(here, '../../package.json'), 'utf8'));

// An inline script ends at the first "</script" whatever the JS means by it.
const inline = (code) => code.replace(/<\/(script)/gi, '<\\/$1');

const IMPORT_EDITOR = "import './ohashi-editor.js';\n";
const IMPORT_DELIVER = /^import \{[^}]*\} from '\.\/deliver\.js';\n/m;

await mkdir(out, { recursive: true });
for (const name of ['ime-log', 'paste-capture']) {
  const html = await readFile(resolve(pages, `${name}.html`), 'utf8');
  const script = await readFile(resolve(pages, `${name}.js`), 'utf8');
  if (!script.includes(IMPORT_EDITOR) || !IMPORT_DELIVER.test(script)) {
    throw new Error(`${name}.js: expected imports of ./ohashi-editor.js and ./deliver.js`);
  }
  const tag = `<script type="module" src="${name}.js"></script>`;
  if (!html.includes(tag)) throw new Error(`${name}.html: expected ${tag}`);

  const page = script.replace(IMPORT_EDITOR, '').replace(IMPORT_DELIVER, `${deliver}\n`);
  const built = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const result = html.replace(tag, () =>
    `<p style="color:#6b7280;font-size:12px">Standalone build — editor ${version}, built ${built} UTC.</p>\n`
    + `<script type="module">\n${inline(bundle)}\n</script>\n`
    + `<script type="module">\n${inline(page)}\n</script>`);
  await writeFile(resolve(out, `${name}.html`), result);
  console.log(resolve(out, `${name}.html`));
}
