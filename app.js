const { createApp, nextTick } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;
const { components, views, createStore } = window.EncontraPet;

const store = createStore();
const routes = [
  { path: '/', name: 'inicio', component: views.HomeView, meta: { title: 'Início' } },
  { path: '/inicio', redirect: '/' },
  { path: '/ocorrencias', name: 'ocorrencias', component: views.OccurrencesView, meta: { title: 'Ocorrências' } },
  { path: '/ocorrencias/:id', name: 'detalhes', component: views.DetailsView, meta: { title: 'Detalhes da ocorrência' } },
  { path: '/mapa', name: 'mapa', component: views.MapView, meta: { title: 'Mapa de ocorrências' } },
  { path: '/painel', name: 'painel', component: views.UserPanelView, meta: { title: 'Meu painel', role: 'Tutor' } },
  { path: '/administracao', name: 'administracao', component: views.AdminView, meta: { title: 'Administração', role: 'Administrador' } },
  { path: '/cadastrar', name: 'cadastrar', component: views.RegisterView, meta: { title: 'Cadastrar ocorrência' } },
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

router.beforeEach((to) => {
  if (!to.meta.role || to.meta.role === store.state.profile) return true;
  store.notify(`A área solicitada é exclusiva do perfil ${to.meta.role}.`);
  return { path: '/', replace: true };
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
  setup() { return { store }; },
  template: `
    <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <site-header />
    <main id="conteudo" tabindex="-1"><router-view /></main>
    <contact-modal v-if="store.state.contactOccurrence" />
    <toast-message v-if="store.state.notice" />
    <footer><div class="container"><img src="./assets/encontrapet-icon.png" alt="" /><p><strong>EncontraPet é um serviço público de Bauru.</strong><span>Juntos, construímos uma cidade mais cuidadosa com seus animais.</span></p><router-link to="/?section=como-funciona">Saiba como funciona</router-link></div></footer>`
};

createApp(App).provide('store', store).use(router).mount('#app');
