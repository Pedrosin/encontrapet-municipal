const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const evidence = process.env.ENCONTRAPET_QA_DIR ? path.resolve(process.env.ENCONTRAPET_QA_DIR) : path.join(root, 'qa', 'online');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

async function run() {
  fs.mkdirSync(evidence, { recursive: true });
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`)) return response.writeHead(403).end();
    fs.readFile(file, (error, content) => {
      if (error) return response.writeHead(404).end();
      response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(content);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const checks = [];
  const check = (name, ok) => { checks.push({ name, passed: Boolean(ok) }); assert.ok(ok, name); };
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}/index.html`;
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('.pet-card').first().waitFor();
    check('página inicial mostra pelo menos dois relatos recentes', await page.locator('.pet-card:visible').count() >= 2);
    await page.screenshot({ path: path.join(evidence, 'inicio.png'), fullPage: true });

    await page.goto(`${base}#/ocorrencias`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Ocorrências' }).waitFor();
    await page.getByText(/registros/).waitFor();
    check('consulta pública do PostgreSQL mostra pelo menos três amostras', await page.locator('.pet-card').count() >= 3);
    await page.getByLabel('Espécie').selectOption('Gato');
    check('filtro exibe apenas o gato', await page.locator('.pet-card').count() === 1 && await page.locator('.pet-card h3').innerText() === 'Sem nome');

    await page.goto(`${base}#/cadastrar`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Entrar' }).waitFor();
    check('cadastro redireciona visitante para login', (await page.evaluate(() => location.hash)).startsWith('#/entrar?next='));

    await page.goto(`${base}#/ocorrencias/1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Mel' }).waitFor();
    await page.getByRole('button', { name: /Tenho informações/ }).click();
    check('mensagem requer conta', await page.getByRole('link', { name: 'Entre na sua conta' }).isVisible() && await page.getByLabel('Mensagem').count() === 0);
    await page.screenshot({ path: path.join(evidence, 'contato-visitante.png'), fullPage: true });
    check('navegação sem erro de JavaScript', pageErrors.length === 0);
    await page.getByRole('button', { name: 'Fechar contato' }).click();

    await page.goto(`${base}#/entrar`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
    check('recuperação de senha exibe formulário sem senha', await page.getByRole('heading', { name: 'Recuperar senha' }).isVisible() && await page.getByLabel('Senha').count() === 0 && await page.getByRole('button', { name: 'Enviar instruções' }).isVisible());
    await page.getByRole('button', { name: 'Voltar para entrar' }).click();
    await page.getByRole('button', { name: 'Criar uma conta' }).click();
    check('alternância para criação de conta', await page.getByRole('heading', { name: 'Criar conta' }).isVisible() && await page.getByRole('button', { name: 'Criar conta' }).isVisible());
    await context.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobile = await mobileContext.newPage();
    await mobile.goto(`${base}#/entrar`, { waitUntil: 'domcontentloaded' });
    await mobile.getByRole('heading', { name: 'Entrar' }).waitFor();
    const sizes = await mobile.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    check('login móvel sem rolagem horizontal', sizes.content <= sizes.viewport);
    await mobile.screenshot({ path: path.join(evidence, 'entrar-mobile.png'), fullPage: true });
    await mobileContext.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
    fs.writeFileSync(path.join(evidence, 'resultados.json'), `${JSON.stringify({ executedAt: new Date().toISOString(), checks }, null, 2)}\n`);
  }
  console.log(`${checks.length} verificações online aprovadas`);
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
