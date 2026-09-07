const { createApp, computed, ref, watch } = Vue;

const STORAGE_KEY = 'encontrapet-ocorrencias-v1';
const CONTACTS_KEY = 'encontrapet-contatos-v1';
const initialOccurrences = [
  { id: 1, type: 'Perdido', name: 'Mel', species: 'Cão', color: 'Caramelo', location: 'Jardim Estoril', date: '2026-09-02', status: 'Em busca do tutor', reviewStatus: 'Aprovada', description: 'Pequena, usa coleira vermelha e responde pelo nome Mel.' },
  { id: 2, type: 'Encontrado', name: 'Sem nome', species: 'Gato', color: 'Branco e cinza', location: 'Vila Universitária', date: '2026-09-03', status: 'Aguardando identificação', reviewStatus: 'Aprovada', description: 'Gato dócil encontrado próximo à praça.' },
  { id: 3, type: 'Perdido', name: 'Thor', species: 'Cão', color: 'Preto', location: 'Centro', date: '2026-08-29', status: 'Em busca do tutor', reviewStatus: 'Aprovada', description: 'Porte médio, mancha branca no peito.' }
];

function loadOccurrences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).map((item) => ({ reviewStatus: 'Aprovada', ...item })) : initialOccurrences;
  } catch (error) {
    return initialOccurrences;
  }
}

createApp({
  setup() {
    const occurrences = ref(loadOccurrences());

    const search = ref('');
    const filterType = ref('Todos');
    const filterSpecies = ref('Todas');
    const filterStatus = ref('Todas');
    const profile = ref('Visitante');
    const showForm = ref(false);
    const selectedOccurrence = ref(null);
    const contactOccurrence = ref(null);
    const contactMessage = ref('');
    const notice = ref('');
    const form = ref({ type: 'Perdido', name: '', species: 'Cão', color: '', location: '', date: '', status: 'Em busca do tutor', description: '', photo: '' });

    const filteredOccurrences = computed(() => occurrences.value.filter((item) => {
      const term = search.value.toLowerCase().trim();
      const matchesText = !term || [item.name, item.species, item.color, item.location, item.description].join(' ').toLowerCase().includes(term);
      const matchesType = filterType.value === 'Todos' || item.type === filterType.value;
      const matchesSpecies = filterSpecies.value === 'Todas' || item.species === filterSpecies.value;
      const matchesStatus = filterStatus.value === 'Todas' || item.status === filterStatus.value;
      return item.reviewStatus !== 'Ocultada' && matchesText && matchesType && matchesSpecies && matchesStatus;
    }));

    watch(occurrences, (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }, { deep: true });

    function submitOccurrence() {
      if (!form.value.species || !form.value.color || !form.value.location || !form.value.date) {
        notice.value = 'Preencha espécie, cor, local e data para cadastrar a ocorrência.';
        return;
      }
      occurrences.value.unshift({ id: Date.now(), ...form.value, name: form.value.name || 'Sem nome', reviewStatus: 'Pendente' });
      notice.value = 'Ocorrência cadastrada com sucesso.';
      showForm.value = false;
      form.value = { type: 'Perdido', name: '', species: 'Cão', color: '', location: '', date: '', status: 'Em busca do tutor', description: '', photo: '' };
    }

    function updateStatus(item, status) {
      item.status = status;
      notice.value = `Situação de ${item.name} atualizada.`;
    }

    function openDetails(item) {
      selectedOccurrence.value = item;
    }

    function handlePhoto(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/') || file.size > 1200000) {
        notice.value = 'Escolha uma imagem de até 1,2 MB.';
        event.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { form.value.photo = reader.result; };
      reader.readAsDataURL(file);
    }

    function openContact(item) {
      contactOccurrence.value = item;
      contactMessage.value = '';
    }

    function submitContact() {
      if (!contactMessage.value.trim()) {
        notice.value = 'Escreva uma mensagem antes de enviar.';
        return;
      }
      const contacts = JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
      contacts.push({ occurrenceId: contactOccurrence.value.id, message: contactMessage.value.trim(), createdAt: new Date().toISOString() });
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
      contactOccurrence.value = null;
      notice.value = 'Mensagem registrada para contato mediado.';
    }

    function mapPosition(index) {
      const positions = [[18, 30], [47, 24], [72, 45], [35, 64], [63, 70], [82, 22]];
      const position = positions[index % positions.length];
      return { left: `${position[0]}%`, top: `${position[1]}%` };
    }

    function adminAction(item, reviewStatus) {
      item.reviewStatus = reviewStatus;
      notice.value = `${item.name} marcada como ${reviewStatus.toLowerCase()}.`;
    }

    const dashboardStats = computed(() => ({
      total: occurrences.value.length,
      lost: occurrences.value.filter((item) => item.type === 'Perdido').length,
      found: occurrences.value.filter((item) => item.type === 'Encontrado').length,
      reunited: occurrences.value.filter((item) => item.status === 'Pet reencontrado').length,
      pending: occurrences.value.filter((item) => item.reviewStatus === 'Pendente').length
    }));

    return { occurrences, search, filterType, filterSpecies, filterStatus, profile, showForm, selectedOccurrence, contactOccurrence, contactMessage, notice, form, filteredOccurrences, dashboardStats, submitOccurrence, updateStatus, openDetails, handlePhoto, openContact, submitContact, mapPosition, adminAction };
  },
  template: `
    <header class="site-header">
      <div class="container header-content">
        <a class="brand" href="#inicio" aria-label="EncontraPet Municipal - início">
          <span class="brand-mark" aria-hidden="true">🐾</span>
          <span><strong>EncontraPet</strong><small>Municipal</small></span>
        </a>
        <nav aria-label="Navegação principal">
            <a href="#ocorrencias">Ocorrências</a>
            <a href="#mapa">Mapa</a>
            <a href="#painel">Meu painel</a>
            <a href="#administracao">Administração</a>
            <a href="#como-funciona">Como funciona</a>
            <label class="profile-switch">Perfil (demonstração)<select v-model="profile"><option>Visitante</option><option>Tutor</option><option>Administrador</option></select></label><button class="button button-primary" @click="showForm = true">Cadastrar ocorrência</button>
        </nav>
      </div>
    </header>

    <main id="inicio">
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <p class="eyebrow">Bauru, São Paulo</p>
            <h1>Ajude um pet a voltar para casa.</h1>
            <p class="hero-copy">Um espaço municipal para registrar, encontrar e acompanhar pets perdidos ou encontrados.</p>
            <a class="button button-light" href="#ocorrencias">Buscar um pet</a>
          </div>
          <div class="hero-illustration" aria-label="Ilustração de um cão e um gato" role="img"><span>🐶</span><span>🐱</span></div>
        </div>
      </section>

      <section id="ocorrencias" class="section container">
        <div class="section-heading"><div><p class="eyebrow">Consulta pública</p><h2>Ocorrências recentes</h2></div><span class="result-count">{{ filteredOccurrences.length }} registros</span></div>
        <div class="filters" role="search">
          <label class="search-field"><span class="sr-only">Buscar por palavra-chave</span><input v-model="search" type="search" placeholder="Busque por bairro, espécie ou cor" /></label>
          <label><span class="sr-only">Filtrar por tipo</span><select v-model="filterType"><option>Todos</option><option>Perdido</option><option>Encontrado</option></select></label><label><span class="sr-only">Filtrar por espécie</span><select v-model="filterSpecies"><option>Todas</option><option>Cão</option><option>Gato</option></select></label><label><span class="sr-only">Filtrar por situação</span><select v-model="filterStatus"><option>Todas</option><option>Em busca do tutor</option><option>Aguardando identificação</option><option>Pet reencontrado</option></select></label>
        </div>
        <div v-if="filteredOccurrences.length" class="cards-grid">
          <article v-for="item in filteredOccurrences" :key="item.id" class="pet-card">
            <div class="pet-card-top"><div class="pet-icon" aria-hidden="true"><img v-if="item.photo" :src="item.photo" :alt="'Foto de ' + item.name" /><span v-else>{{ item.species === 'Gato' ? '🐱' : '🐶' }}</span></div><span :class="['tag', item.type === 'Perdido' ? 'tag-warm' : 'tag-cool']">{{ item.type }}</span></div>
            <h3>{{ item.name }}</h3><p class="pet-description">{{ item.description }}</p>
            <dl><div><dt>Local</dt><dd>{{ item.location }}</dd></div><div><dt>Data</dt><dd>{{ item.date }}</dd></div><div><dt>Situação</dt><dd>{{ item.status }}</dd></div></dl>
            <label class="status-control">Atualizar situação<select :value="item.status" @change="updateStatus(item, $event.target.value)"><option>Em busca do tutor</option><option>Aguardando identificação</option><option>Pet reencontrado</option></select></label>
            <button class="detail-button" @click="openDetails(item)">Ver detalhes</button>
            <button class="text-button" @click="openContact(item)">Tenho informações sobre este pet <span aria-hidden="true">→</span></button>
          </article>
        </div>
        <p v-else class="empty-state">Nenhuma ocorrência encontrada com esses filtros.</p>
      </section>

      <section id="mapa" class="section map-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Visão territorial</p><h2>Mapa de ocorrências</h2></div><span class="result-count">Localização aproximada</span></div><p class="section-intro">Consulte a concentração de registros por região sem expor endereços exatos.</p><div class="map-board" aria-label="Mapa demonstrativo de Bauru com ocorrências"><span class="map-road road-one"></span><span class="map-road road-two"></span><span class="map-road road-three"></span><span class="map-label label-north">Norte</span><span class="map-label label-center">Centro</span><span class="map-label label-south">Sul</span><button v-for="(item, index) in filteredOccurrences" :key="'map-' + item.id" class="map-marker" :style="mapPosition(index)" @click="openDetails(item)" :aria-label="'Abrir ocorrência de ' + item.name">{{ item.species === 'Gato' ? '🐱' : '🐶' }}</button></div></div></section>

      <section id="painel" class="section dashboard-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Área do usuário</p><h2>Meu painel</h2></div><span class="result-count">Perfil: {{ profile }}</span></div><p class="section-intro">Acompanhe os registros associados ao seu perfil e atualize a situação dos animais.</p><div class="stats-grid"><div class="stat-card"><strong>{{ dashboardStats.total }}</strong><span>Registros no protótipo</span></div><div class="stat-card"><strong>{{ dashboardStats.lost }}</strong><span>Pets perdidos</span></div><div class="stat-card"><strong>{{ dashboardStats.found }}</strong><span>Pets encontrados</span></div><div class="stat-card"><strong>{{ dashboardStats.reunited }}</strong><span>Reencontros</span></div></div><div class="panel-note"><strong>Próximo passo:</strong> com autenticação real, esta área exibirá somente as ocorrências cadastradas pelo usuário conectado.</div></div></section>

      <section id="administracao" class="section admin-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Gestão municipal</p><h2>Painel administrativo</h2></div><span class="result-count">Demonstração local</span></div><p class="section-intro">Área para revisão de conteúdo, acompanhamento dos indicadores e moderação das ocorrências.</p><div class="stats-grid"><div class="stat-card"><strong>{{ dashboardStats.total }}</strong><span>Total de ocorrências</span></div><div class="stat-card"><strong>{{ dashboardStats.pending }}</strong><span>Aguardando revisão</span></div><div class="stat-card"><strong>{{ dashboardStats.reunited }}</strong><span>Reencontrados</span></div></div><div class="admin-list"><article v-for="item in occurrences" :key="'admin-' + item.id" class="admin-row"><div><strong>{{ item.name }}</strong><span>{{ item.type }} · {{ item.location }} · {{ item.reviewStatus }}</span></div><div class="admin-actions"><button class="small-button" @click="adminAction(item, 'Aprovada')">Aprovar</button><button class="small-button danger-button" @click="adminAction(item, 'Ocultada')">Ocultar</button></div></article></div></div></section>

      <section id="como-funciona" class="how-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">Participação cidadã</p><h2>Como funciona</h2></div></div><div class="steps"><div><span>1</span><h3>Registre</h3><p>Informe as características e o local onde o pet foi perdido ou encontrado.</p></div><div><span>2</span><h3>Busque</h3><p>Use filtros para consultar ocorrências próximas e comparar informações.</p></div><div><span>3</span><h3>Reencontre</h3><p>Envie informações com privacidade e ajude a atualizar a situação do animal.</p></div></div></div></section>
    </main>

    <div v-if="selectedOccurrence" class="modal-backdrop" @click.self="selectedOccurrence = null"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="details-title"><button class="modal-close" aria-label="Fechar detalhes" @click="selectedOccurrence = null">×</button><p class="eyebrow">Detalhes da ocorrência</p><h2 id="details-title">{{ selectedOccurrence.name }}</h2><img v-if="selectedOccurrence.photo" class="detail-photo" :src="selectedOccurrence.photo" :alt="'Foto de ' + selectedOccurrence.name" /><p class="detail-type">{{ selectedOccurrence.type }} · {{ selectedOccurrence.species }}</p><dl class="details-list"><div><dt>Cor</dt><dd>{{ selectedOccurrence.color }}</dd></div><div><dt>Local aproximado</dt><dd>{{ selectedOccurrence.location }}</dd></div><div><dt>Data</dt><dd>{{ selectedOccurrence.date }}</dd></div><div><dt>Situação</dt><dd>{{ selectedOccurrence.status }}</dd></div></dl><p class="detail-description">{{ selectedOccurrence.description || 'Sem descrição adicional.' }}</p><button class="button button-primary" @click="openContact(selectedOccurrence); selectedOccurrence = null">Tenho informações sobre este pet</button></section></div>
    <div v-if="contactOccurrence" class="modal-backdrop" @click.self="contactOccurrence = null"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="contact-title"><button class="modal-close" aria-label="Fechar contato" @click="contactOccurrence = null">×</button><p class="eyebrow">Contato mediado</p><h2 id="contact-title">Falar sobre {{ contactOccurrence.name }}</h2><p class="privacy-note">Sua mensagem será armazenada apenas neste protótipo. Em produção, o contato não exibirá telefone ou endereço publicamente.</p><form @submit.prevent="submitContact"><label>Mensagem<textarea v-model="contactMessage" rows="5" placeholder="Conte o que você sabe sobre este pet" required></textarea></label><button class="button button-primary" type="submit">Registrar mensagem</button></form></section></div>
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><button class="modal-close" aria-label="Fechar formulário" @click="showForm = false">×</button><p class="eyebrow">Nova ocorrência</p><h2 id="form-title">Cadastrar um pet</h2><form @submit.prevent="submitOccurrence"><div class="form-grid"><label>Tipo<select v-model="form.type"><option>Perdido</option><option>Encontrado</option></select></label><label>Espécie<select v-model="form.species"><option>Cão</option><option>Gato</option></select></label><label>Nome (se souber)<input v-model="form.name" type="text" /></label><label>Cor<input v-model="form.color" type="text" required /></label><label>Local aproximado<input v-model="form.location" type="text" required /></label><label>Data<input v-model="form.date" type="date" required /></label></div><label>Foto (opcional)<input type="file" accept="image/*" @change="handlePhoto" /><span v-if="form.photo" class="file-note">Foto selecionada.</span></label><label>Descrição<textarea v-model="form.description" rows="3" placeholder="Inclua características que ajudem na identificação"></textarea></label><button class="button button-primary" type="submit">Salvar ocorrência</button></form></section></div>
    <div v-if="notice" class="toast" role="status">{{ notice }} <button aria-label="Fechar aviso" @click="notice = ''">×</button></div>
    <footer><div class="container"><strong>EncontraPet Municipal</strong><span>Projeto Integrador em Tecnologia da Informação II · Bauru, SP</span></div></footer>
  `
}).mount('#app');
