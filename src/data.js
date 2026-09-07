(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};

  const KEYS = {
    occurrences: 'encontrapet-ocorrencias-v3',
    previousOccurrences: ['encontrapet-ocorrencias-v2', 'encontrapet-ocorrencias-v1'],
    contacts: 'encontrapet-contatos-v1',
    profile: 'encontrapet-perfil-demo-v1'
  };
  const TUTOR_ID = 'tutor-demo';
  const PROFILES = ['Visitante', 'Tutor', 'Administrador'];
  const STATUSES = ['Em busca do tutor', 'Aguardando identificação', 'Pet reencontrado'];
  const REVIEW_STATUSES = ['Pendente', 'Aprovada', 'Ocultada'];
  const DEMO_PHOTOS = { 1: './assets/pet-mel.png', 2: './assets/pet-sem-nome.png', 3: './assets/pet-thor.png' };

  const initialOccurrences = [
    { id: 1, ownerId: TUTOR_ID, type: 'Perdido', name: 'Mel', species: 'Cão', color: 'Caramelo', location: 'Jardim Estoril', date: '2026-09-02', status: 'Em busca do tutor', reviewStatus: 'Aprovada', description: 'Pequena, usa coleira vermelha e responde pelo nome Mel.', photo: './assets/pet-mel.png' },
    { id: 2, ownerId: 'tutor-externo-2', type: 'Encontrado', name: 'Sem nome', species: 'Gato', color: 'Branco e cinza', location: 'Vila Universitária', date: '2026-09-03', status: 'Aguardando identificação', reviewStatus: 'Aprovada', description: 'Gato dócil encontrado próximo à praça.', photo: './assets/pet-sem-nome.png' },
    { id: 3, ownerId: 'tutor-externo-3', type: 'Perdido', name: 'Thor', species: 'Cão', color: 'Preto', location: 'Centro', date: '2026-08-29', status: 'Em busca do tutor', reviewStatus: 'Aprovada', description: 'Porte médio, mancha branca no peito.', photo: './assets/pet-thor.png' }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function normalizeOccurrence(item, index) {
    const safeStatus = STATUSES.includes(item.status) ? item.status : STATUSES[0];
    const safeReview = REVIEW_STATUSES.includes(item.reviewStatus) ? item.reviewStatus : 'Aprovada';
    return {
      id: item.id || Date.now() + index,
      ownerId: item.ownerId || `registro-legado-${item.id || index}`,
      type: item.type === 'Encontrado' ? 'Encontrado' : 'Perdido',
      name: String(item.name || 'Sem nome').trim(),
      species: item.species === 'Gato' ? 'Gato' : 'Cão',
      color: String(item.color || '').trim(),
      location: String(item.location || '').trim(),
      date: String(item.date || ''),
      status: safeStatus,
      reviewStatus: safeReview,
      description: String(item.description || '').trim(),
      photo: typeof item.photo === 'string' && item.photo ? item.photo : (DEMO_PHOTOS[item.id] || '')
    };
  }

  function loadOccurrences() {
    const current = localStorage.getItem(KEYS.occurrences);
    let sourceKey = current ? KEYS.occurrences : KEYS.previousOccurrences.find((key) => localStorage.getItem(key));
    const items = sourceKey ? readJson(sourceKey, initialOccurrences) : clone(initialOccurrences);
    const normalized = items.map(normalizeOccurrence);
    if (sourceKey !== KEYS.occurrences) writeJson(KEYS.occurrences, normalized);
    return normalized;
  }

  function loadProfile() {
    const value = localStorage.getItem(KEYS.profile);
    return PROFILES.includes(value) ? value : 'Visitante';
  }

  function formatDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  }

  namespace.data = {
    KEYS,
    TUTOR_ID,
    PROFILES,
    STATUSES,
    REVIEW_STATUSES,
    loadOccurrences,
    loadContacts: () => readJson(KEYS.contacts, []),
    loadProfile,
    saveOccurrences: (items) => writeJson(KEYS.occurrences, items),
    saveContacts: (items) => writeJson(KEYS.contacts, items),
    saveProfile: (profile) => {
      try { localStorage.setItem(KEYS.profile, profile); return true; } catch { return false; }
    },
    formatDate
  };
}());
