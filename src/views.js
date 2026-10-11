(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};
  const { computed, inject, onBeforeUnmount, onMounted, ref, watch } = Vue;
  const { useRoute, useRouter } = VueRouter;
  const PetCard = namespace.components.PetCard;

  function todayString() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function emptyForm() {
    return { type: 'Perdido', name: '', species: 'Cão', color: '', location: '', date: '', description: '', photo: null, photoPreview: '' };
  }

  const HomeView = {
    components: { PetCard },
    setup() {
      const store = inject('store');
      const route = useRoute();
      const recent = computed(() => store.publicOccurrences.slice(0, 3));

      function scrollToRequestedSection() {
        const section = route.query.section;
        if (!section) return;
        requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }

      onMounted(scrollToRequestedSection);
      watch(() => route.query.section, scrollToRequestedSection);
      return { recent, store };
    },
    template: `
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-content">
            <p class="location-pill"><i class="ph-fill ph-map-pin" aria-hidden="true"></i>Bauru, São Paulo</p>
            <h1>Ajude um pet a <em>voltar</em> para casa.</h1>
            <p class="hero-copy">Consulte registros de pets perdidos ou encontrados e compartilhe informações que possam levar a um reencontro seguro.</p>
            <div class="hero-actions">
              <router-link class="button button-primary" to="/ocorrencias"><i class="ph-bold ph-magnifying-glass" aria-hidden="true"></i>Buscar um pet</router-link>
              <router-link class="button button-secondary" to="/cadastrar"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i>Cadastrar ocorrência</router-link>
            </div>
            <p class="hero-privacy"><i class="ph-duotone ph-shield-check" aria-hidden="true"></i><span><strong>Protótipo acadêmico, não oficial.</strong> Os registros fictícios são compartilhados entre dispositivos; não publique dados pessoais reais.</span></p>
          </div>
          <figure class="hero-visual"><img src="./assets/hero-pets.png" alt="Um cão e um gato juntos, representando o reencontro de animais com suas famílias" /><figcaption>Cada informação pode ser o começo de uma história.</figcaption></figure>
        </div>
      </section>
      <section class="section recent-section">
        <div class="container"><div class="section-heading journal-heading"><div><p class="eyebrow"><i class="ph-duotone ph-notebook" aria-hidden="true"></i>Consulta pública</p><h2>Caderno de Reencontros</h2><p>Ocorrências recentes em Bauru</p></div><router-link class="inline-link" to="/ocorrencias">Ver todas <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></router-link></div><div v-if="recent.length" class="cards-grid recent-grid"><pet-card v-for="item in recent" :key="item.id" :item="item" compact /></div><p v-else class="empty-state">{{ store.state.loading ? 'Carregando ocorrências…' : (store.state.loadError || 'Ainda não há ocorrências públicas.') }}</p></div>
      </section>
      <section class="section container support-section">
        <div class="intro-grid"><div><p class="eyebrow">Cuidado compartilhado</p><h2>Informação organizada, com privacidade.</h2></div><p>O EncontraPet reúne relatos da comunidade. O local é exibido por bairro ou região, e informações de contato não ficam públicas.</p></div>
        <div class="audience-grid">
          <article><span class="audience-label">Para tutores</span><h3>Perdi um pet</h3><p>Consulte ocorrências e cadastre um relato para revisão.</p></article>
          <article><span class="audience-label">Para a comunidade</span><h3>Encontrei um animal</h3><p>Registre características e uma localização aproximada.</p></article>
          <article><span class="audience-label">Colaboração segura</span><h3>Tenho uma informação</h3><p>Envie uma mensagem sem divulgar telefone ou endereço.</p></article>
        </div>
      </section>
      <section id="como-funciona" class="how-section">
        <div class="container"><div class="section-heading"><div><p class="eyebrow">Participação cidadã</p><h2>Como funciona</h2></div></div><div class="steps"><div><span>1</span><h3>Registre</h3><p>Entre na sua conta e informe características e local aproximado.</p></div><div><span>2</span><h3>Revise</h3><p>Uma conta de administração aprova o relato antes da publicação.</p></div><div><span>3</span><h3>Reencontre</h3><p>Compartilhe informações de modo responsável.</p></div></div></div>
      </section>`
  };

  const OccurrencesView = {
    components: { PetCard },
    setup() {
      const store = inject('store');
      const search = ref('');
      const type = ref('Todos');
      const species = ref('Todas');
      const status = ref('Todas');
      const filtered = computed(() => store.publicOccurrences.filter((item) => {
        const term = search.value.trim().toLocaleLowerCase('pt-BR');
        const searchable = [item.name, item.species, item.color, item.location, item.description].join(' ').toLocaleLowerCase('pt-BR');
        return (!term || searchable.includes(term)) && (type.value === 'Todos' || item.type === type.value) && (species.value === 'Todas' || item.species === species.value) && (status.value === 'Todas' || item.status === status.value);
      }));
      function clearFilters() { search.value = ''; type.value = 'Todos'; species.value = 'Todas'; status.value = 'Todas'; }
      return { store, search, type, species, status, filtered, clearFilters, statuses: namespace.data.STATUSES };
    },
    template: `
      <section class="section container">
        <div class="section-heading"><div><p class="eyebrow">Consulta pública</p><h1>Ocorrências</h1><p class="section-intro list-intro">Busque por características ou região. Apenas relatos aprovados são exibidos.</p></div><span class="result-count" aria-live="polite">{{ filtered.length }} registros</span></div>
        <div class="filters" role="search" aria-label="Filtros de ocorrências">
          <label class="search-field"><span>Buscar</span><input v-model="search" type="search" placeholder="Bairro, espécie, cor ou nome" /></label>
          <label><span>Tipo</span><select v-model="type"><option>Todos</option><option>Perdido</option><option>Encontrado</option></select></label>
          <label><span>Espécie</span><select v-model="species"><option>Todas</option><option>Cão</option><option>Gato</option></select></label>
          <label><span>Situação</span><select v-model="status"><option>Todas</option><option v-for="item in statuses" :key="item">{{ item }}</option></select></label>
          <button class="filter-reset" type="button" @click="clearFilters">Limpar</button>
        </div>
        <div v-if="filtered.length" class="cards-grid"><pet-card v-for="item in filtered" :key="item.id" :item="item" /></div>
        <div v-else class="empty-state"><h2>{{ store.state.loading ? 'Carregando…' : (store.state.loadError ? 'Falha na consulta' : 'Nenhum resultado') }}</h2><p>{{ store.state.loadError || 'Tente remover um filtro ou buscar por outra característica.' }}</p><button v-if="!store.state.loadError" class="button button-primary" type="button" @click="clearFilters">Limpar filtros</button></div>
      </section>`
  };

  const DetailsView = {
    setup() {
      const store = inject('store');
      const route = useRoute();
      return { store, item: computed(() => store.findOccurrence(route.params.id)), formatDate: namespace.data.formatDate };
    },
    template: `
      <section class="section container">
        <router-link class="back-link" to="/ocorrencias">← Voltar para ocorrências</router-link>
        <article v-if="item" class="detail-page">
          <div class="detail-visual"><img v-if="item.photo" :src="item.photo" :alt="'Foto de ' + item.name" /><span v-else aria-hidden="true">{{ item.species }}</span></div>
          <div><p class="eyebrow">Detalhes da ocorrência</p><div class="detail-title"><h1>{{ item.name }}</h1><span :class="['tag', item.type === 'Perdido' ? 'tag-warm' : 'tag-cool']">{{ item.type }}</span></div><p class="detail-type">{{ item.species }} · {{ item.color }}</p><dl class="details-list"><div><dt>Local aproximado</dt><dd>{{ item.location }}</dd></div><div><dt>Data do relato</dt><dd>{{ formatDate(item.date) }}</dd></div><div><dt>Situação</dt><dd>{{ item.status }}</dd></div><div v-if="item.reviewStatus !== 'Aprovada'"><dt>Moderação</dt><dd>{{ item.reviewStatus }}</dd></div></dl><p class="detail-description">{{ item.description || 'Sem descrição adicional.' }}</p><button class="button button-primary" type="button" @click="store.openContact(item)">Tenho informações sobre este pet</button></div>
        </article>
        <div v-else class="empty-state"><h1>Ocorrência não encontrada</h1><p>Ela pode ter sido removida, ainda estar em revisão ou o link pode estar incorreto.</p><router-link class="button button-primary" to="/ocorrencias">Ver ocorrências</router-link></div>
      </section>`
  };

  const RegisterView = {
    setup() {
      const store = inject('store');
      const router = useRouter();
      const form = ref(emptyForm());
      const today = todayString();

      function handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1200000) { store.notify('Escolha JPG, PNG ou WebP de até 1,2 MB.'); event.target.value = ''; return; }
        if (form.value.photoPreview) URL.revokeObjectURL(form.value.photoPreview);
        form.value.photo = file;
        form.value.photoPreview = URL.createObjectURL(file);
      }
      const submitting = ref(false);
      async function submit() {
        const values = form.value;
        if (!values.color.trim() || !values.location.trim() || !values.date) return store.notify('Preencha cor, local aproximado e data.');
        if (values.name.trim().length > 60 || values.color.trim().length > 60 || values.location.trim().length > 100 || values.description.trim().length > 500) return store.notify('Revise o tamanho dos campos antes de enviar.');
        if (values.date > today) return store.notify('A data da ocorrência não pode estar no futuro.');
        submitting.value = true;
        const result = await store.addOccurrence(values);
        submitting.value = false;
        if (result.ok) router.push('/painel'); else store.notify(result.message);
      }
      onBeforeUnmount(() => { if (form.value.photoPreview) URL.revokeObjectURL(form.value.photoPreview); });
      return { store, form, today, submitting, handlePhoto, submit };
    },
    template: `
      <section class="section container narrow">
        <p class="eyebrow">Nova ocorrência</p><h1>Cadastrar um pet</h1>
        <div v-if="!store.isTutor" class="access-card"><h2>Entre na sua conta para continuar</h2><router-link class="button button-primary" to="/entrar">Entrar</router-link></div>
        <form v-else class="page-form" @submit.prevent="submit">
          <div class="form-grid"><label>Tipo<select v-model="form.type"><option>Perdido</option><option>Encontrado</option></select></label><label>Espécie<select v-model="form.species"><option>Cão</option><option>Gato</option></select></label><label>Nome (se souber)<input v-model.trim="form.name" maxlength="60" /></label><label>Cor<input v-model.trim="form.color" maxlength="60" required /></label><label>Local aproximado<input v-model.trim="form.location" maxlength="100" required /></label><label>Data<input v-model="form.date" type="date" :max="today" required /></label></div>
          <label>Foto (opcional)<input type="file" accept="image/png,image/jpeg,image/webp" @change="handlePhoto" /><span class="field-help">JPG, PNG ou WebP, até 1,2 MB. Use apenas fotos fictícias nesta demonstração.</span><span v-if="form.photo" class="file-note">Foto pronta para envio.</span><img v-if="form.photoPreview" class="photo-preview" :src="form.photoPreview" alt="Pré-visualização da foto selecionada" /></label>
          <label>Descrição<textarea v-model.trim="form.description" rows="4" maxlength="500" placeholder="Inclua porte, coleira, comportamento ou outras características"></textarea><span class="field-help">Não inclua telefone, endereço ou outros dados pessoais.</span></label>
          <p class="privacy-note">O relato será enviado como pendente e só aparecerá na consulta pública após revisão.</p>
          <button class="button button-primary" type="submit" :disabled="submitting">{{ submitting ? 'Enviando…' : 'Enviar para revisão' }}</button>
        </form>
      </section>`
  };

  const AuthView = {
    setup() {
      const store = inject('store');
      const router = useRouter();
      const route = useRoute();
      const email = ref('');
      const password = ref('');
      const mode = ref('entrar');
      const busy = ref(false);
      const feedback = ref('');
      const canResend = ref(false);
      async function submit() {
        if (!email.value.trim()) return;
        busy.value = true;
        feedback.value = '';
        canResend.value = false;
        const result = mode.value === 'criar'
          ? await store.signUp(email.value.trim(), password.value)
          : mode.value === 'recuperar'
            ? await store.resetPassword(email.value.trim())
            : await store.signIn(email.value.trim(), password.value);
        busy.value = false;
        feedback.value = result.message || '';
        canResend.value = Boolean(result.needsConfirmation);
        if (!result.ok) return;
        if (store.state.user) await router.push(typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/painel');
      }
      async function resend() {
        if (!email.value.trim()) return;
        busy.value = true;
        const result = await store.resendConfirmation(email.value.trim());
        busy.value = false;
        feedback.value = result.message;
        canResend.value = false;
      }
      function setMode(nextMode) { mode.value = nextMode; feedback.value = ''; canResend.value = false; }
      return { store, email, password, mode, busy, feedback, canResend, submit, resend, setMode };
    },
    template: `
      <section class="section container narrow">
        <p class="eyebrow">Conta do projeto</p><h1>{{ mode === 'criar' ? 'Criar conta' : (mode === 'recuperar' ? 'Recuperar senha' : 'Entrar') }}</h1>
        <p class="privacy-note">Use apenas relatos fictícios nesta demonstração acadêmica. Seu e-mail de acesso não aparece na consulta pública.</p>
        <div class="access-card" v-if="store.state.user"><p>Você já está conectado como {{ store.state.user.email }}.</p><router-link class="button button-primary" to="/painel">Abrir meu painel</router-link></div>
        <form v-else class="page-form" @submit.prevent="submit">
          <label>E-mail<input v-model.trim="email" type="email" autocomplete="email" required /></label>
          <label v-if="mode !== 'recuperar'">Senha<input v-model="password" type="password" :autocomplete="mode === 'criar' ? 'new-password' : 'current-password'" minlength="8" required /></label>
          <p v-if="feedback" role="status" class="privacy-note">{{ feedback }}</p>
          <button class="button button-primary" type="submit" :disabled="busy">{{ busy ? 'Aguarde…' : (mode === 'criar' ? 'Criar conta' : (mode === 'recuperar' ? 'Enviar instruções' : 'Entrar')) }}</button>
          <button v-if="canResend" class="text-button" type="button" :disabled="busy" @click="resend">Reenviar confirmação</button>
          <button v-if="mode === 'entrar'" class="text-button" type="button" :disabled="busy" @click="setMode('recuperar')">Esqueci minha senha</button>
          <button class="text-button" type="button" :disabled="busy" @click="setMode(mode === 'criar' ? 'entrar' : 'criar')">{{ mode === 'criar' ? 'Já tenho conta' : 'Criar uma conta' }}</button>
          <button v-if="mode === 'recuperar'" class="text-button" type="button" :disabled="busy" @click="setMode('entrar')">Voltar para entrar</button>
        </form>
      </section>`
  };

  const UserPanelView = {
    components: { PetCard },
    setup() {
      const store = inject('store');
      const stats = computed(() => ({ total: store.myOccurrences.length, pending: store.myOccurrences.filter((item) => item.reviewStatus === 'Pendente').length, reunited: store.myOccurrences.filter((item) => item.status === 'Pet reencontrado').length }));
      const inbox = computed(() => store.state.messages.filter((message) => store.myOccurrences.some((item) => item.id === message.occurrence_id)));
      const petName = (id) => store.state.occurrences.find((item) => item.id === id)?.name || 'Ocorrência';
      return { store, stats, inbox, petName };
    },
    template: `<section class="section container"><div class="section-heading"><div><p class="eyebrow">Área do tutor</p><h1>Meu painel</h1></div><router-link class="button button-primary" to="/cadastrar">Nova ocorrência</router-link></div><div class="stats-grid"><div class="stat-card"><strong>{{ stats.total }}</strong><span>Minhas ocorrências</span></div><div class="stat-card"><strong>{{ stats.pending }}</strong><span>Em revisão</span></div><div class="stat-card"><strong>{{ stats.reunited }}</strong><span>Reencontrados</span></div></div><p class="panel-note"><strong>Você pode atualizar somente os seus registros.</strong> Ocorrências pendentes não aparecem na consulta pública até serem aprovadas.</p><div v-if="store.myOccurrences.length" class="cards-grid panel-cards"><pet-card v-for="item in store.myOccurrences" :key="item.id" :item="item" manageable /></div><div v-else class="empty-state"><h2>Nenhuma ocorrência cadastrada</h2><router-link class="button button-primary" to="/cadastrar">Cadastrar agora</router-link></div><section class="inbox-section"><h2>Informações recebidas</h2><p v-if="!inbox.length">Ainda não há mensagens sobre seus relatos.</p><div v-else class="admin-list"><article v-for="message in inbox" :key="message.id" class="admin-row"><div><strong>{{ petName(message.occurrence_id) }}</strong><span>{{ message.message }}</span></div></article></div></section></section>`
  };

  const AdminView = {
    setup() {
      const store = inject('store');
      const pendingOnly = ref(true);
      const moderationItems = computed(() => pendingOnly.value ? store.state.occurrences.filter((item) => item.reviewStatus === 'Pendente') : store.state.occurrences);
      const petName = (id) => store.state.occurrences.find((item) => item.id === id)?.name || 'Ocorrência';
      return { store, petName, pendingOnly, moderationItems };
    },
    template: `<section class="section admin-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Gestão de relatos</p><h1>Painel administrativo</h1></div><span class="result-count">Conta autorizada</span></div><div class="stats-grid"><div class="stat-card"><strong>{{ store.stats.total }}</strong><span>Total de ocorrências</span></div><div class="stat-card"><strong>{{ store.stats.pending }}</strong><span>Aguardando revisão</span></div><div class="stat-card"><strong>{{ store.stats.reunited }}</strong><span>Reencontrados</span></div></div><div class="admin-toolbar"><label><input v-model="pendingOnly" type="checkbox" /> Mostrar somente pendentes</label><span>{{ moderationItems.length }} na fila</span></div><div v-if="moderationItems.length" class="admin-list"><article v-for="item in moderationItems" :key="item.id" class="admin-row"><div class="admin-row-content"><img v-if="item.photo" class="admin-thumb" :src="item.photo" :alt="'Foto de ' + item.name" /><div><strong>{{ item.name }}</strong><span>{{ item.type }} · {{ item.species }} · {{ item.location }}</span><span class="admin-description">{{ item.description || 'Sem descrição adicional.' }}</span><span :class="['review-badge', 'review-' + item.reviewStatus.toLowerCase()]">{{ item.reviewStatus }}</span></div></div><div class="admin-actions"><button class="small-button" type="button" :disabled="item.reviewStatus === 'Aprovada'" @click="store.moderate(item, 'Aprovada')">Aprovar</button><button class="small-button danger-button" type="button" :disabled="item.reviewStatus === 'Ocultada'" @click="store.moderate(item, 'Ocultada')">Ocultar</button></div></article></div><p v-else class="empty-state">Não há ocorrências{{ pendingOnly ? ' pendentes' : '' }} para moderar.</p><section class="inbox-section"><h2>Mensagens recebidas</h2><p v-if="!store.state.messages.length">Nenhuma mensagem registrada.</p><div v-else class="admin-list"><article v-for="message in store.state.messages" :key="message.id" class="admin-row"><div><strong>{{ petName(message.occurrence_id) }}</strong><span>{{ message.message }}</span></div></article></div></section></div></section>`
  };

  const MapView = {
    setup() { return { store: inject('store') }; },
    template: `<section class="section map-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Visão territorial</p><h1>Mapa de ocorrências</h1><p class="section-intro list-intro">O mapa mostra apenas a região de Bauru. Os bairros são listados sem endereço ou posição exata.</p></div><span class="result-count">{{ store.publicOccurrences.length }} registros públicos</span></div><div class="map-layout"><iframe class="real-map" title="Mapa de Bauru, São Paulo" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-49.15%2C-22.39%2C-48.99%2C-22.24&amp;layer=mapnik"></iframe><div class="map-list"><h2>Ocorrências por região</h2><router-link v-for="item in store.publicOccurrences" :key="item.id" class="map-list-item" :to="'/ocorrencias/' + item.id"><span><strong>{{ item.location }}</strong><small>{{ item.species }} · {{ item.type }}</small></span><span aria-hidden="true">→</span></router-link></div></div><p class="privacy-note map-note">Por segurança, os registros não são posicionados sobre residências ou endereços exatos.</p></div></section>`
  };

  const NotFoundView = { template: `<section class="section container narrow"><div class="empty-state"><p class="eyebrow">Erro 404</p><h1>Página não encontrada</h1><p>Confira o endereço ou volte para a consulta pública.</p><router-link class="button button-primary" to="/ocorrencias">Ver ocorrências</router-link></div></section>` };

  namespace.views = { HomeView, OccurrencesView, DetailsView, RegisterView, AuthView, UserPanelView, AdminView, MapView, NotFoundView };
}());
