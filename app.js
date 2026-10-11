const { createApp, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;
const { components, views, createStore } = window.EncontraPet;

const store = createStore();
store.init();
const routes = [
  { path: '/', name: 'inicio', component: views.HomeView, meta: { title: 'Início' } },
  { path: '/inicio', redirect: '/' },
  { path: '/ocorrencias', name: 'ocorrencias', component: views.OccurrencesView, meta: { title: 'Ocorrências' } },
  { path: '/ocorrencias/:id', name: 'detalhes', component: views.DetailsView, meta: { title: 'Detalhes da ocorrência' } },
  { path: '/mapa', name: 'mapa', component: views.MapView, meta: { title: 'Mapa de ocorrências' } },
  { path: '/painel', name: 'painel', component: views.UserPanelView, meta: { title: 'Meu painel', auth: true } },
  { path: '/administracao', name: 'administracao', component: views.AdminView, meta: { title: 'Administração', admin: true } },
  { path: '/cadastrar', name: 'cadastrar', component: views.RegisterView, meta: { title: 'Cadastrar ocorrência', auth: true } },
  { path: '/entrar', name: 'entrar', component: views.AuthView, meta: { title: 'Entrar' } },
  { path: '/como-funciona', redirect: { path: '/', query: { section: 'como-funciona' } } },
  { path: '/:pathMatch(.*)*', name: 'nao-encontrada', component: views.NotFoundView, meta: { title: 'Página não encontrada' } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.query.section) return { el: `#${to.query.section}`, top: 88, behavior: 'smooth' };
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  await store.ready;
  if (to.meta.auth && !store.state.user) return { path: '/entrar', query: { next: to.fullPath }, replace: true };
  if (to.meta.admin && !store.isAdmin) {
    store.notify('Área exclusiva da administração.');
    return { path: '/', replace: true };
  }
  return true;
});

router.afterEach(async (to) => {
  document.title = `${to.meta.title || 'EncontraPet'} · EncontraPet Municipal`;
  await nextTick();
  document.querySelector('main')?.focus({ preventScroll: true });
});

const App = {
  components: {
    SiteHeader: components.SiteHeader,
    ContactModal: components.ContactModal,
    ToastMessage: components.ToastMessage
  },
  setup() {
    function skipToContent() {
      document.querySelector('#conteudo')?.focus();
    }
    return { store, skipToContent };
  },
  template: `
    <a class="skip-link" href="#conteudo" @click.prevent="skipToContent">Pular para o conteúdo</a>
    <site-header />
    <main id="conteudo" tabindex="-1"><router-view /></main>
    <contact-modal v-if="store.state.contactOccurrence" />
    <toast-message v-if="store.state.notice" />
    <footer><div class="container"><img src="./assets/encontrapet-icon.png" alt="" /><p><strong>EncontraPet é um protótipo acadêmico para Bauru.</strong><span>Sem vínculo oficial com a prefeitura. Use apenas dados fictícios nesta versão de demonstração.</span></p><router-link to="/?section=como-funciona">Saiba como funciona</router-link></div></footer>`
};

createApp(App).provide('store', store).use(router).mount('#app');
