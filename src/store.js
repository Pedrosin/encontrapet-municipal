(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};
  const data = namespace.data;

  namespace.createStore = function createStore() {
    const { reactive, watch } = Vue;
    const state = reactive({
      occurrences: data.loadOccurrences(),
      profile: data.loadProfile(),
      notice: '',
      contactOccurrence: null,
      contactMessage: ''
    });
    let noticeTimer;
    let contactTrigger;

    const store = {
      state,
      get isTutor() { return state.profile === 'Tutor'; },
      get isAdmin() { return state.profile === 'Administrador'; },
      get publicOccurrences() { return state.occurrences.filter((item) => item.reviewStatus === 'Aprovada'); },
      get myOccurrences() { return state.occurrences.filter((item) => item.ownerId === data.TUTOR_ID); },
      get stats() {
        return {
          total: state.occurrences.length,
          pending: state.occurrences.filter((item) => item.reviewStatus === 'Pendente').length,
          reunited: state.occurrences.filter((item) => item.status === 'Pet reencontrado').length
        };
      },
      setProfile(profile) {
        if (!data.PROFILES.includes(profile)) return;
        state.profile = profile;
        if (!data.saveProfile(profile)) this.notify('Não foi possível salvar o perfil neste navegador.');
      },
      notify(message) {
        window.clearTimeout(noticeTimer);
        state.notice = message;
        noticeTimer = window.setTimeout(() => { state.notice = ''; }, 5000);
      },
      canView(item) {
        return item.reviewStatus === 'Aprovada' || this.isAdmin || (this.isTutor && item.ownerId === data.TUTOR_ID);
      },
      canManage(item) {
        return this.isTutor && item.ownerId === data.TUTOR_ID;
      },
      findOccurrence(id) {
        const item = state.occurrences.find((occurrence) => String(occurrence.id) === String(id));
        return item && this.canView(item) ? item : null;
      },
      addOccurrence(form) {
        if (!this.isTutor) return { ok: false, message: 'Entre como tutor para cadastrar uma ocorrência.' };
        const item = {
          id: Date.now(),
          ownerId: data.TUTOR_ID,
          type: form.type,
          name: form.name.trim() || 'Sem nome',
          species: form.species,
          color: form.color.trim(),
          location: form.location.trim(),
          date: form.date,
          status: form.type === 'Encontrado' ? 'Aguardando identificação' : 'Em busca do tutor',
          reviewStatus: 'Pendente',
          description: form.description.trim(),
          photo: form.photo
        };
        state.occurrences.unshift(item);
        this.notify('Ocorrência enviada para revisão municipal.');
        return { ok: true, item };
      },
      updateStatus(item, status) {
        if (!this.canManage(item) || !data.STATUSES.includes(status)) {
          this.notify('Somente o tutor responsável pode atualizar esta ocorrência.');
          return;
        }
        item.status = status;
        this.notify(`Situação de ${item.name} atualizada.`);
      },
      moderate(item, reviewStatus) {
        if (!this.isAdmin || !data.REVIEW_STATUSES.includes(reviewStatus)) {
          this.notify('Esta ação é exclusiva da administração.');
          return;
        }
        item.reviewStatus = reviewStatus;
        this.notify(`${item.name} marcada como ${reviewStatus.toLowerCase()}.`);
      },
      openContact(item) {
        contactTrigger = document.activeElement;
        state.contactOccurrence = item;
        state.contactMessage = '';
      },
      closeContact() {
        state.contactOccurrence = null;
        state.contactMessage = '';
        requestAnimationFrame(() => contactTrigger?.focus?.());
      },
      submitContact() {
        const message = state.contactMessage.trim();
        if (!message) return this.notify('Escreva uma mensagem antes de enviar.');
        const contacts = data.loadContacts();
        contacts.push({ occurrenceId: state.contactOccurrence.id, message, createdAt: new Date().toISOString() });
        if (!data.saveContacts(contacts)) return this.notify('Não foi possível salvar a mensagem neste navegador.');
        this.closeContact();
        this.notify('Mensagem registrada para encaminhamento demonstrativo.');
      }
    };

    watch(() => state.occurrences, (items) => {
      if (!data.saveOccurrences(items)) store.notify('O armazenamento do navegador está cheio. Remova fotos grandes e tente novamente.');
    }, { deep: true });

    return store;
  };
}());
