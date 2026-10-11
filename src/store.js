(function () {
  const ns = window.EncontraPet = window.EncontraPet || {};
  const { client, fromRow, toInsert, statusCode, reviewCode } = ns.backend;

  ns.createStore = function createStore() {
    const state = Vue.reactive({ occurrences: [], messages: [], profile: 'Visitante', user: null, loading: true, loadError: '', notice: '', contactOccurrence: null, contactMessage: '' });
    let noticeTimer;
    let contactTrigger;
    let authSubscription;
    const store = {
      state,
      ready: null,
      get isTutor() { return Boolean(state.user); },
      get isAdmin() { return state.profile === 'Administrador'; },
      get publicOccurrences() { return state.occurrences.filter((item) => item.reviewStatus === 'Aprovada'); },
      get myOccurrences() { return state.occurrences.filter((item) => item.ownerId === state.user?.id); },
      get stats() { return { total: state.occurrences.length, pending: state.occurrences.filter((item) => item.reviewStatus === 'Pendente').length, reunited: state.occurrences.filter((item) => item.status === 'Pet reencontrado').length }; },
      notify(message) {
        window.clearTimeout(noticeTimer);
        state.notice = message;
        noticeTimer = window.setTimeout(() => { state.notice = ''; }, 6000);
      },
      async refresh() {
        state.loading = true;
        const { data, error } = await client.from('occurrences').select('*').order('reported_at', { ascending: false });
        state.loading = false;
        if (error) { state.loadError = 'Não foi possível carregar as ocorrências. Tente atualizar a página.'; this.notify(state.loadError); return false; }
        state.loadError = '';
        state.occurrences = data.map(fromRow);
        if (state.user) {
          const messages = await client.from('contact_messages').select('id,occurrence_id,sender_id,message,created_at').order('created_at', { ascending: false });
          if (messages.error) this.notify('Ocorrências carregadas, mas não foi possível consultar as mensagens.');
          state.messages = messages.data || [];
        } else state.messages = [];
        return true;
      },
      async syncUser(user) {
        state.user = user || null;
        state.profile = user ? 'Tutor' : 'Visitante';
        if (user) {
          const { data, error } = await client.from('app_admins').select('user_id').eq('user_id', user.id).maybeSingle();
          if (!error && data) state.profile = 'Administrador';
        }
        await this.refresh();
      },
      init() {
        this.ready = (async () => {
          const { data, error } = await client.auth.getUser();
          if (error && error.name !== 'AuthSessionMissingError') this.notify('Não foi possível verificar a sessão.');
          await this.syncUser(data?.user || null);
          const listener = client.auth.onAuthStateChange((_event, session) => {
            window.setTimeout(() => { void this.syncUser(session?.user || null); }, 0);
          });
          authSubscription = listener.data.subscription;
        })();
        return this.ready;
      },
      async signIn(email, password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error?.code === 'email_not_confirmed') return { ok: false, needsConfirmation: true, message: 'Sua conta ainda não foi confirmada. Confira o e-mail recebido ou reenvie a confirmação.' };
        if (error?.code === 'invalid_credentials') return { ok: false, message: 'E-mail ou senha incorretos.' };
        if (error) return { ok: false, message: 'Não foi possível entrar agora. Tente novamente.' };
        await this.syncUser(data.user);
        return { ok: true };
      },
      async resendConfirmation(email) {
        const { error } = await client.auth.resend({ type: 'signup', email });
        if (error?.code === 'email_address_not_authorized') return { ok: false, message: 'Este projeto gratuito só envia confirmação para e-mails da equipe Supabase.' };
        if (error) return { ok: false, message: 'Não foi possível reenviar a confirmação agora.' };
        return { ok: true, message: 'Se o endereço puder receber mensagens deste projeto, uma nova confirmação foi enviada.' };
      },
      async resetPassword(email) {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}${location.pathname}#/entrar` });
        if (error) return { ok: false, message: 'Não foi possível solicitar a recuperação agora.' };
        return { ok: true, message: 'Se o endereço existir, você receberá as instruções de recuperação.' };
      },
      async signUp(email, password) {
        if (password.length < 8) return { ok: false, message: 'A senha deve ter pelo menos 8 caracteres.' };
        const { data, error } = await client.auth.signUp({
          email, password, options: { emailRedirectTo: `${location.origin}${location.pathname}` }
        });
        if (error?.code === 'email_address_not_authorized') return { ok: false, message: 'Este projeto gratuito só envia confirmação para e-mails da equipe Supabase. Use o e-mail da sua conta no painel.' };
        if (error) return { ok: false, message: 'Não foi possível criar a conta. Verifique o e-mail e tente novamente.' };
        if (!data.session) return { ok: true, message: 'Confira seu e-mail para confirmar a conta antes de entrar.' };
        await this.syncUser(data.user);
        return { ok: true, message: 'Conta criada e sessão iniciada.' };
      },
      async signOut() {
        const { error } = await client.auth.signOut();
        if (error) return this.notify('Não foi possível sair da conta. Tente novamente.');
        await this.syncUser(null);
        this.notify('Você saiu da conta.');
      },
      canView(item) { return item.reviewStatus === 'Aprovada' || this.isAdmin || this.canManage(item); },
      canManage(item) { return Boolean(state.user && item.ownerId === state.user.id); },
      findOccurrence(id) {
        const item = state.occurrences.find((occurrence) => String(occurrence.id) === String(id));
        return item && this.canView(item) ? item : null;
      },
      async addOccurrence(form) {
        if (!state.user) return { ok: false, message: 'Entre na sua conta para cadastrar uma ocorrência.' };
        let imagePath = null;
        let imageUrl = null;
        if (form.photo) {
          const extension = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[form.photo.type];
          if (!extension || form.photo.size > 1200000) return { ok: false, message: 'Escolha uma imagem JPG, PNG ou WebP de até 1,2 MB.' };
          imagePath = `${state.user.id}/${crypto.randomUUID()}.${extension}`;
          const upload = await client.storage.from('pet-photos').upload(imagePath, form.photo, { contentType: form.photo.type });
          if (upload.error) return { ok: false, message: 'Não foi possível enviar a foto.' };
          imageUrl = client.storage.from('pet-photos').getPublicUrl(imagePath).data.publicUrl;
        }
        const { data, error } = await client.from('occurrences').insert(toInsert(form, state.user.id, imageUrl, imagePath)).select('*').single();
        if (error) {
          if (imagePath) await client.storage.from('pet-photos').remove([imagePath]);
          return { ok: false, message: 'A ocorrência não foi salva. Confira os campos e tente novamente.' };
        }
        state.occurrences.unshift(fromRow(data));
        this.notify('Ocorrência enviada para revisão.');
        return { ok: true, item: fromRow(data) };
      },
      async updateStatus(item, status) {
        if (!this.canManage(item) || !statusCode(status)) return this.notify('Somente o responsável pode alterar esta ocorrência.');
        const { data, error } = await client.from('occurrences').update({ status: statusCode(status) }).eq('id', item.id).select('*').single();
        if (error) return this.notify('Não foi possível atualizar a situação.');
        state.occurrences = state.occurrences.map((current) => current.id === item.id ? fromRow(data) : current);
        this.notify(`Situação de ${item.name} atualizada.`);
        return true;
      },
      async moderate(item, reviewStatus) {
        if (!this.isAdmin || !['Aprovada', 'Ocultada'].includes(reviewStatus)) return this.notify('Ação exclusiva da administração.');
        const { error } = await client.from('moderation_actions').insert({
          occurrence_id: item.id,
          admin_id: state.user.id,
          review_status: reviewCode(reviewStatus)
        });
        if (error) return this.notify('Não foi possível moderar a ocorrência.');
        await this.refresh();
        this.notify(`${item.name} marcada como ${reviewStatus.toLowerCase()}.`);
        return true;
      },
      openContact(item) { contactTrigger = document.activeElement; state.contactOccurrence = item; state.contactMessage = ''; },
      closeContact() { state.contactOccurrence = null; state.contactMessage = ''; requestAnimationFrame(() => contactTrigger?.focus?.()); },
      async submitContact() {
        if (!state.user) return this.notify('Entre na sua conta antes de enviar uma mensagem.');
        const message = state.contactMessage.trim();
        if (!message || !state.contactOccurrence) return this.notify('Escreva uma mensagem antes de enviar.');
        const { error } = await client.from('contact_messages').insert({ occurrence_id: state.contactOccurrence.id, sender_id: state.user.id, message });
        if (error) return this.notify('Não foi possível registrar a mensagem.');
        this.closeContact();
        await this.refresh();
        this.notify('Mensagem registrada no painel de acompanhamento.');
      },
      dispose() { authSubscription?.unsubscribe(); }
    };
    return store;
  };
}());
