(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};
  const { computed, inject, onMounted, ref, watch } = Vue;
  const { useRoute, useRouter } = VueRouter;
  const PetCard = namespace.components.PetCard;

  function todayString() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function emptyForm() {
    return { type: 'Perdido', name: '', species: 'Cão', color: '', location: '', date: '', description: '', photo: '' };
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
      return { recent };
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
            <p class="hero-privacy"><i class="ph-duotone ph-shield-check" aria-hidden="true"></i><span><strong>Privacidade em primeiro lugar.</strong> Seus dados pessoais não ficam públicos.</span></p>
          </div>
          <figure class="hero-visual"><img src="./assets/hero-pets.png" alt="Um cão e um gato juntos, representando o reencontro de animais com suas famílias" /><figcaption>Cada informação pode ser o começo de uma história.</figcaption></figure>
        </div>
      </section>
      <section class="section recent-section">
        <div class="container"><div class="section-heading journal-heading"><div><p class="eyebrow"><i class="ph-duotone ph-notebook" aria-hidden="true"></i>Consulta pública</p><h2>Caderno de Reencontros</h2><p>Ocorrências recentes em Bauru</p></div><router-link class="inline-link" to="/ocorrencias">Ver todas <i class="ph-bold ph-arrow-right" aria-hidden="true"></i></router-link></div><div v-if="recent.length" class="cards-grid recent-grid"><pet-card v-for="item in recent" :key="item.id" :item="item" compact /></div><p v-else class="empty-state">Ainda não há ocorrências públicas.</p></div>
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
        <div class="container"><div class="section-heading"><div><p class="eyebrow">Participação cidadã</p><h2>Como funciona</h2></div></div><div class="steps"><div><span>1</span><h3>Registre</h3><p>Informe características e o local aproximado.</p></div><div><span>2</span><h3>Revise</h3><p>A administração avalia o relato antes da publicação.</p></div><div><span>3</span><h3>Reencontre</h3><p>Compartilhe informações de modo responsável.</p></div></div></div>
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
      return { search, type, species, status, filtered, clearFilters, statuses: namespace.data.STATUSES };
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
        <div v-else class="empty-state"><h2>Nenhum resultado</h2><p>Tente remover um filtro ou buscar por outra característica.</p><button class="button button-primary" type="button" @click="clearFilters">Limpar filtros</button></div>
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

      function activateTutorDemo() { store.setProfile('Tutor'); store.notify('Perfil Tutor ativado para a demonstração.'); }
      function handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 1200000) { store.notify('Escolha uma imagem válida de até 1,2 MB.'); event.target.value = ''; return; }
        const reader = new FileReader();
        reader.onload = () => { form.value.photo = reader.result; };
        reader.onerror = () => store.notify('Não foi possível ler a imagem selecionada.');
        reader.readAsDataURL(file);
      }
      function submit() {
        if (!form.value.color.trim() || !form.value.location.trim() || !form.value.date) return store.notify('Preencha cor, local aproximado e data.');
        if (form.value.date > today) return store.notify('A data da ocorrência não pode estar no futuro.');
        const result = store.addOccurrence(form.value);
        if (result.ok) router.push('/painel'); else store.notify(result.message);
      }
      return { store, form, today, activateTutorDemo, handlePhoto, submit };
    },
    template: `
      <section class="section container narrow">
        <p class="eyebrow">Nova ocorrência</p><h1>Cadastrar um pet</h1>
        <div v-if="!store.isTutor" class="access-card"><h2>Entre como tutor para continuar</h2><p>A autenticação ainda é demonstrativa. Ative o perfil Tutor para testar o cadastro e o acompanhamento de ocorrências.</p><button class="button button-primary" type="button" @click="activateTutorDemo">Usar perfil Tutor</button></div>
        <form v-else class="page-form" @submit.prevent="submit">
          <div class="form-grid"><label>Tipo<select v-model="form.type"><option>Perdido</option><option>Encontrado</option></select></label><label>Espécie<select v-model="form.species"><option>Cão</option><option>Gato</option></select></label><label>Nome (se souber)<input v-model.trim="form.name" maxlength="60" /></label><label>Cor<input v-model.trim="form.color" maxlength="60" required /></label><label>Local aproximado<input v-model.trim="form.location" maxlength="100" required /></label><label>Data<input v-model="form.date" type="date" :max="today" required /></label></div>
          <label>Foto (opcional)<input type="file" accept="image/png,image/jpeg,image/webp" @change="handlePhoto" /><span class="field-help">JPG, PNG ou WebP, até 1,2 MB.</span><span v-if="form.photo" class="file-note">Foto pronta para envio.</span></label>
          <label>Descrição<textarea v-model.trim="form.description" rows="4" maxlength="500" placeholder="Inclua porte, coleira, comportamento ou outras características"></textarea><span class="field-help">Não inclua telefone, endereço ou outros dados pessoais.</span></label>
          <p class="privacy-note">O relato será enviado como pendente e só aparecerá na consulta pública após revisão.</p>
          <button class="button button-primary" type="submit">Enviar para revisão</button>
        </form>
      </section>`
  };

  const UserPanelView = {
    components: { PetCard },
    setup() {
      const store = inject('store');
      const stats = computed(() => ({ total: store.myOccurrences.length, pending: store.myOccurrences.filter((item) => item.reviewStatus === 'Pendente').length, reunited: store.myOccurrences.filter((item) => item.status === 'Pet reencontrado').length }));
      return { store, stats };
    },
    template: `<section class="section container"><div class="section-heading"><div><p class="eyebrow">Área do tutor</p><h1>Meu painel</h1></div><router-link class="button button-primary" to="/cadastrar">Nova ocorrência</router-link></div><div class="stats-grid"><div class="stat-card"><strong>{{ stats.total }}</strong><span>Minhas ocorrências</span></div><div class="stat-card"><strong>{{ stats.pending }}</strong><span>Em revisão</span></div><div class="stat-card"><strong>{{ stats.reunited }}</strong><span>Reencontrados</span></div></div><p class="panel-note"><strong>Você pode atualizar somente os seus registros.</strong> Ocorrências pendentes não aparecem na consulta pública até serem aprovadas.</p><div v-if="store.myOccurrences.length" class="cards-grid panel-cards"><pet-card v-for="item in store.myOccurrences" :key="item.id" :item="item" manageable /></div><div v-else class="empty-state"><h2>Nenhuma ocorrência cadastrada</h2><router-link class="button button-primary" to="/cadastrar">Cadastrar agora</router-link></div></section>`
  };

  const AdminView = {
    setup() { return { store: inject('store') }; },
    template: `<section class="section admin-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Gestão municipal</p><h1>Painel administrativo</h1></div><span class="result-count">Demonstração local</span></div><div class="stats-grid"><div class="stat-card"><strong>{{ store.stats.total }}</strong><span>Total de ocorrências</span></div><div class="stat-card"><strong>{{ store.stats.pending }}</strong><span>Aguardando revisão</span></div><div class="stat-card"><strong>{{ store.stats.reunited }}</strong><span>Reencontrados</span></div></div><div v-if="store.state.occurrences.length" class="admin-list"><article v-for="item in store.state.occurrences" :key="item.id" class="admin-row"><div><strong>{{ item.name }}</strong><span>{{ item.type }} · {{ item.location }}</span><span :class="['review-badge', 'review-' + item.reviewStatus.toLowerCase()]">{{ item.reviewStatus }}</span></div><div class="admin-actions"><button class="small-button" type="button" :disabled="item.reviewStatus === 'Aprovada'" @click="store.moderate(item, 'Aprovada')">Aprovar</button><button class="small-button danger-button" type="button" :disabled="item.reviewStatus === 'Ocultada'" @click="store.moderate(item, 'Ocultada')">Ocultar</button></div></article></div><p v-else class="empty-state">Não há ocorrências para moderar.</p></div></section>`
  };

  const MapView = {
    setup() { return { store: inject('store') }; },
    template: `<section class="section map-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Visão territorial</p><h1>Mapa de ocorrências</h1><p class="section-intro list-intro">O mapa mostra apenas a região de Bauru. Os bairros são listados sem endereço ou posição exata.</p></div><span class="result-count">{{ store.publicOccurrences.length }} registros públicos</span></div><div class="map-layout"><iframe class="real-map" title="Mapa de Bauru, São Paulo" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-49.15%2C-22.39%2C-48.99%2C-22.24&amp;layer=mapnik"></iframe><div class="map-list"><h2>Ocorrências por região</h2><router-link v-for="item in store.publicOccurrences" :key="item.id" class="map-list-item" :to="'/ocorrencias/' + item.id"><span><strong>{{ item.location }}</strong><small>{{ item.species }} · {{ item.type }}</small></span><span aria-hidden="true">→</span></router-link></div></div><p class="privacy-note map-note">Por segurança, os registros não são posicionados sobre residências ou endereços exatos.</p></div></section>`
  };

  const NotFoundView = { template: `<section class="section container narrow"><div class="empty-state"><p class="eyebrow">Erro 404</p><h1>Página não encontrada</h1><p>Confira o endereço ou volte para a consulta pública.</p><router-link class="button button-primary" to="/ocorrencias">Ver ocorrências</router-link></div></section>` };

  namespace.views = { HomeView, OccurrencesView, DetailsView, RegisterView, UserPanelView, AdminView, MapView, NotFoundView };
}());
