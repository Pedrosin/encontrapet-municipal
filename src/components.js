(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};
  const { inject, nextTick, onMounted, ref, watch } = Vue;
  const { useRoute, useRouter } = VueRouter;

  const PetCard = {
    props: {
      item: { type: Object, required: true },
      manageable: { type: Boolean, default: false },
      compact: { type: Boolean, default: false }
    },
    setup() {
      return {
        store: inject('store'),
        formatDate: namespace.data.formatDate,
        statuses: namespace.data.STATUSES
      };
    },
    template: `
      <article :class="['pet-card', { 'pet-card-compact': compact }]">
        <div class="pet-card-top">
          <div class="pet-media">
            <img v-if="item.photo" :src="item.photo" :alt="'Foto de ' + item.name" />
            <span v-else class="pet-placeholder" aria-hidden="true">{{ item.species }}</span>
          </div>
          <span :class="['tag', item.type === 'Perdido' ? 'tag-warm' : 'tag-cool']">{{ item.type }}</span>
        </div>
        <h3>{{ item.name }}</h3>
        <p class="pet-description">{{ item.description || 'Sem descrição adicional.' }}</p>
        <dl>
          <div><dt>Local aproximado</dt><dd>{{ item.location }}</dd></div>
          <div><dt>Data</dt><dd>{{ formatDate(item.date) }}</dd></div>
          <div><dt>Situação</dt><dd>{{ item.status }}</dd></div>
        </dl>
        <label v-if="manageable && store.canManage(item)" class="status-control">
          Atualizar situação
          <select :value="item.status" @change="store.updateStatus(item, $event.target.value)">
            <option v-for="status in statuses" :key="status">{{ status }}</option>
          </select>
        </label>
        <router-link class="detail-button" :to="'/ocorrencias/' + item.id">Ver detalhes</router-link>
        <button class="text-button" type="button" @click="store.openContact(item)">Tenho informações sobre este pet <span aria-hidden="true">→</span></button>
      </article>`
  };

  const SiteHeader = {
    setup() {
      const store = inject('store');
      const router = useRouter();
      const route = useRoute();
      const accountMenu = ref(null);

      async function goToSection(section) {
        if (accountMenu.value) accountMenu.value.open = false;
        await router.push({ path: '/', query: { section } });
      }

      async function signOut() {
        if (accountMenu.value) accountMenu.value.open = false;
        await store.signOut();
        if (route.meta.auth || route.meta.admin) await router.push('/');
      }

      watch(() => route.fullPath, () => {
        if (accountMenu.value) accountMenu.value.open = false;
      });

      return {
        store,
        accountMenu,
        goToSection,
        signOut
      };
    },
    template: `
      <header class="site-header">
        <div class="container header-content">
          <router-link class="brand" to="/" aria-label="EncontraPet Bauru — início">
            <img class="brand-mark" src="./assets/encontrapet-icon.png" alt="" />
            <span><strong>EncontraPet</strong><small>Bauru, SP</small></span>
          </router-link>
          <nav class="primary-nav" aria-label="Navegação principal">
            <router-link to="/ocorrencias">Ocorrências</router-link>
            <router-link to="/mapa">Mapa</router-link>
            <a href="#como-funciona" @click.prevent="goToSection('como-funciona')">Como funciona</a>
          </nav>
          <div class="header-actions">
            <router-link class="button button-primary header-cta" to="/cadastrar"><i class="ph-bold ph-plus-circle" aria-hidden="true"></i>Cadastrar</router-link>
            <details ref="accountMenu" class="account-menu">
              <summary><i class="ph ph-user" aria-hidden="true"></i>Área<i class="ph ph-caret-down" aria-hidden="true"></i></summary>
              <div class="account-popover">
                <p><strong>{{ store.state.user?.email || 'Visitante' }}</strong><small>{{ store.isAdmin ? 'Administração' : (store.isTutor ? 'Conta de tutor' : 'Entre para participar') }}</small></p>
                <router-link v-if="!store.state.user" to="/entrar">Entrar ou criar conta</router-link>
                <router-link v-if="store.isTutor" to="/painel">Meu painel</router-link>
                <router-link v-if="store.isAdmin" to="/administracao">Administração</router-link>
                <button v-if="store.state.user" class="text-button" type="button" @click="signOut">Sair</button>
              </div>
            </details>
          </div>
        </div>
      </header>`
  };

  const ContactModal = {
    setup() {
      const store = inject('store');
      const modal = ref(null);

      function handleKeydown(event) {
        if (event.key === 'Escape') return store.closeContact();
        if (event.key !== 'Tab') return;
        const focusable = [...modal.value.querySelectorAll('button, textarea, [href], select, input')].filter((element) => !element.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }

      onMounted(() => nextTick(() => (modal.value?.querySelector('textarea') || modal.value?.querySelector('a') || modal.value?.querySelector('button'))?.focus()));
      return { store, modal, handleKeydown };
    },
    template: `
      <div class="modal-backdrop" @click.self="store.closeContact()">
        <section ref="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="contact-title" aria-describedby="contact-note" @keydown="handleKeydown">
          <button class="modal-close" type="button" aria-label="Fechar contato" @click="store.closeContact()">×</button>
          <p class="eyebrow">Contato mediado</p>
          <h2 id="contact-title">Falar sobre {{ store.state.contactOccurrence.name }}</h2>
          <p id="contact-note" class="privacy-note">A mensagem será armazenada no serviço do projeto e poderá ser lida pelo responsável e pela moderação. Não inclua telefone ou endereço.</p>
          <p v-if="!store.state.user"><router-link to="/entrar" @click="store.closeContact()">Entre na sua conta</router-link> para enviar uma mensagem.</p>
          <form v-else @submit.prevent="store.submitContact()">
            <label>Mensagem<textarea v-model="store.state.contactMessage" rows="5" maxlength="1000" placeholder="Conte o que você sabe sobre este pet" required></textarea></label>
            <button class="button button-primary" type="submit">Registrar mensagem</button>
          </form>
        </section>
      </div>`
  };

  const ToastMessage = {
    setup() { return { store: inject('store') }; },
    template: `<div class="toast" role="status" aria-live="polite">{{ store.state.notice }}<button type="button" aria-label="Fechar aviso" @click="store.state.notice = ''">×</button></div>`
  };

  namespace.components = { PetCard, SiteHeader, ContactModal, ToastMessage };
}());
