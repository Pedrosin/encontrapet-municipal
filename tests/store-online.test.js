const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function setup({ user = null, insertError = null, uploadError = null, admin = false } = {}) {
  const calls = [];
  const rows = [{ id: 1, ownerId: null, name: 'Mel', reviewStatus: 'Aprovada', status: 'Em busca do tutor' }];
  const client = {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { user }, error: null }),
      signUp: async () => ({ data: { user, session: user ? {} : null }, error: null }),
      signOut: async () => ({ error: null })
    },
    storage: {
      from(bucket) {
        return {
          async upload(filePath, file) { calls.push({ bucket, upload: filePath, file }); return { error: uploadError }; },
          getPublicUrl(filePath) { return { data: { publicUrl: `https://example.invalid/${filePath}` } }; },
          async remove(paths) { calls.push({ bucket, remove: paths }); return { error: null }; }
        };
      }
    },
    from(table) {
      return {
        select() { return this; },
        order() { return Promise.resolve({ data: table === 'occurrences' ? [...rows] : [], error: null }); },
        eq() { return this; },
        maybeSingle() { return Promise.resolve({ data: admin ? { user_id: user?.id } : null, error: null }); },
        insert(value) {
          calls.push({ table, value });
          if (table === 'contact_messages' || table === 'moderation_actions') return Promise.resolve({ error: insertError });
          return { select: () => ({ single: async () => ({ data: { id: 2, ...value }, error: insertError }) }) };
        },
        update(value) {
          calls.push({ table, update: value });
          return { eq: () => ({ select: () => ({ single: async () => ({ data: { ...rows[0], ...value }, error: null }) }) }) };
        }
      };
    },
    rpc: async (name, args) => { calls.push({ name, args }); return { error: null }; }
  };
  const context = vm.createContext({
    window: { EncontraPet: { backend: {
      client,
      fromRow: (item) => item,
      toInsert: (form, ownerId, imageUrl, imagePath) => ({ ...form, ownerId, imageUrl, imagePath, reviewStatus: 'Pendente' }),
      statusCode: (label) => label === 'Pet reencontrado' ? 'pet_reencontrado' : null,
      reviewCode: (label) => label === 'Aprovada' ? 'aprovada' : 'ocultada'
    } }, clearTimeout() {}, setTimeout() {} },
    Vue: { reactive: (value) => value },
    document: { activeElement: null },
    requestAnimationFrame: (callback) => callback(),
    crypto: { randomUUID: () => 'test-uuid' }
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/store.js'), 'utf8'), context, { filename: 'src/store.js' });
  const store = context.window.EncontraPet.createStore();
  if (user) { store.state.user = user; store.state.profile = admin ? 'Administrador' : 'Tutor'; }
  return { store, calls, rows };
}

test('visitante não cadastra nem envia mensagem', async () => {
  const { store, calls } = setup();
  assert.equal((await store.addOccurrence({})).ok, false);
  await store.submitContact();
  assert.equal(calls.length, 0);
});

test('cadastro autenticado salva uma pendência e só depois altera a tela', async () => {
  const { store, calls } = setup({ user: { id: 'tutor-1' } });
  const result = await store.addOccurrence({ name: 'Luna', photo: null });
  assert.equal(result.ok, true);
  assert.equal(calls[0].value.ownerId, 'tutor-1');
  assert.equal(calls[0].value.reviewStatus, 'Pendente');
  assert.equal(store.myOccurrences[0].name, 'Luna');
  assert.equal(store.publicOccurrences.length, 0);
});

test('erro do banco não anuncia cadastro concluído', async () => {
  const { store } = setup({ user: { id: 'tutor-1' }, insertError: new Error('falha') });
  const result = await store.addOccurrence({ name: 'Luna', photo: null });
  assert.equal(result.ok, false);
  assert.equal(store.state.occurrences.length, 0);
});

test('foto é enviada para pasta do tutor e registrada com a ocorrência', async () => {
  const { store, calls } = setup({ user: { id: 'tutor-1' } });
  const result = await store.addOccurrence({ name: 'Luna', photo: { type: 'image/png', size: 5000 } });
  assert.equal(result.ok, true);
  assert.equal(calls[0].upload, 'tutor-1/test-uuid.png');
  assert.equal(calls[1].value.imagePath, 'tutor-1/test-uuid.png');
});

test('falha no envio da foto não cria ocorrência', async () => {
  const { store, calls } = setup({ user: { id: 'tutor-1' }, uploadError: new Error('falha') });
  const result = await store.addOccurrence({ name: 'Luna', photo: { type: 'image/png', size: 5000 } });
  assert.equal(result.ok, false);
  assert.equal(calls.length, 1);
});

test('falha no cadastro remove a foto recém-enviada', async () => {
  const { store, calls } = setup({ user: { id: 'tutor-1' }, insertError: new Error('falha') });
  const result = await store.addOccurrence({ name: 'Luna', photo: { type: 'image/png', size: 5000 } });
  assert.equal(result.ok, false);
  assert.equal(calls[2].remove.join(','), 'tutor-1/test-uuid.png');
});

test('moderação só é solicitada por perfil administrativo', async () => {
  const tutor = setup({ user: { id: 'tutor-1' } });
  await tutor.store.moderate({ id: 1, name: 'Mel' }, 'Aprovada');
  assert.equal(tutor.calls.length, 0);
  const adminUser = setup({ user: { id: 'admin-1' }, admin: true });
  await adminUser.store.moderate({ id: 1, name: 'Mel' }, 'Aprovada');
  assert.equal(adminUser.calls[0].table, 'moderation_actions');
  assert.equal(adminUser.calls[0].value.admin_id, 'admin-1');
});

test('mensagem autenticada inclui o remetente da sessão', async () => {
  const { store, calls } = setup({ user: { id: 'tutor-1' } });
  store.state.contactOccurrence = { id: 1 };
  store.state.contactMessage = 'Vi o animal na praça';
  await store.submitContact();
  assert.equal(calls[0].value.sender_id, 'tutor-1');
  assert.equal(calls[0].value.occurrence_id, 1);
});
