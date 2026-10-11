const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'qa', 'ci');
const allowed = new Set(['index.html', 'app.js', 'styles.css', ...['data', 'backend', 'store', 'components', 'views'].map((name) => `src/${name}.js`), ...['encontrapet-icon', 'hero-pets', 'pet-mel', 'pet-sem-nome', 'pet-thor'].map((name) => `assets/${name}.png`)]);
const rows = [
  { id: 1, owner_id: null, type: 'perdido', species: 'cão', name: 'Mel', color: 'Caramelo', neighborhood: 'Jardim Estoril', occurred_on: '2026-09-02', status: 'em_busca_do_tutor', review_status: 'aprovada', description: 'Relato fictício.', image_url: './assets/pet-mel.png', reported_at: '2026-09-02T12:00:00Z' },
  { id: 2, owner_id: null, type: 'encontrado', species: 'gato', name: 'Sem nome', color: 'Branco e cinza', neighborhood: 'Vila Universitária', occurred_on: '2026-09-03', status: 'aguardando_identificacao', review_status: 'aprovada', description: 'Relato fictício.', image_url: './assets/pet-sem-nome.png', reported_at: '2026-09-03T12:00:00Z' },
  { id: 3, owner_id: null, type: 'perdido', species: 'cão', name: 'Thor', color: 'Preto', neighborhood: 'Centro', occurred_on: '2026-08-29', status: 'em_busca_do_tutor', review_status: 'aprovada', description: 'Relato fictício.', image_url: './assets/pet-thor.png', reported_at: '2026-08-29T12:00:00Z' }
];
const supabaseStub = `window.supabase = { createClient() { return {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
  },
  from(table) {
    if (table !== 'occurrences') throw new Error('Unexpected table: ' + table);
    return { select() { return { order: async () => ({ data: ${JSON.stringify(rows)}, error: null }) }; } };
  }
}; } };`;

async function main() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\//, '') || 'index.html';
    if (!allowed.has(pathname)) return response.writeHead(404).end();
    const file = path.join(root, pathname);
    fs.readFile(file, (error, content) => {
      if (error) return response.writeHead(404).end();
      const type = path.extname(file) === '.png' ? 'image/png' : path.extname(file) === '.css' ? 'text/css' : path.extname(file) === '.js' ? 'text/javascript' : 'text/html';
      response.writeHead(200, { 'Content-Type': type });
      response.end(content);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  let page;
  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/npm/@supabase/supabase-js@2*', (route) => route.fulfill({ contentType: 'text/javascript', body: supabaseStub }));
    await page.route('https://slkcrdyowcephpdgxydu.supabase.co/**', (route) => route.abort());
    const base = `http://127.0.0.1:${server.address().port}/index.html`;
    await page.goto(`${base}#/ocorrencias`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Ocorrências' }).waitFor();
    await page.locator('.pet-card').first().waitFor();
    assert.equal(await page.locator('.pet-card').count(), 3, 'três relatos fictícios publicados');
    await page.getByLabel('Espécie').selectOption('Gato');
    assert.equal(await page.locator('.pet-card').count(), 1, 'filtro de espécie');
    assert.equal(await page.locator('.pet-card h3').innerText(), 'Sem nome');
    await page.goto(`${base}#/cadastrar`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Entrar' }).waitFor();
    assert.match(new URL(page.url()).hash, /^#\/entrar\?next=/, 'visitante é redirecionado');
    await page.goto(`${base}#/administracao`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Caderno de Reencontros' }).waitFor();
    assert.equal(new URL(page.url()).hash, '#/', 'visitante não acessa administração');
    assert.deepEqual(errors, [], 'sem erros de JavaScript');
    console.log('CI: 5 verificações de navegador aprovadas com dados fictícios simulados.');
  } catch (error) {
    if (page) {
      fs.mkdirSync(evidence, { recursive: true });
      await page.screenshot({ path: path.join(evidence, 'falha.png'), fullPage: true }).catch(() => {});
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
