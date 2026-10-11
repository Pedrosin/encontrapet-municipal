# EncontraPet Municipal

Protótipo acadêmico do projeto integrador para registrar, consultar e acompanhar pets achados e perdidos em Bauru, SP. Não é um serviço oficial da prefeitura.

## Tecnologias

- Vue.js 3 via CDN
- Vue Router 4 via CDN
- Phosphor Icons via CDN
- HTML5 semântico
- CSS responsivo
- JavaScript
- Supabase (PostgreSQL, autenticação e armazenamento de fotos)

## Como executar

Execute `python3 -m http.server 8000 --bind 127.0.0.1` na pasta do projeto e abra `http://127.0.0.1:8000/index.html`. A conexão com a internet é necessária para carregar Vue.js, Vue Router e Supabase pela CDN e para acessar o banco. As duas migrações em `supabase/migrations/` já foram aplicadas pelo editor SQL; confira o estado do banco antes de qualquer nova execução.

## Funcionalidades atuais

- Listagem de ocorrências de pets.
- Busca por palavra-chave.
- Filtro por pet perdido ou encontrado.
- Formulário de cadastro com validação dos campos essenciais.
- Ocorrências compartilhadas no PostgreSQL, com consulta pública limitada a relatos aprovados.
- Login por e-mail e senha para tutores; contas administradoras exigem autorização manual no banco.
- Políticas de segurança no banco (RLS) e moderação com trilha de auditoria.
- Fotos novas no Supabase Storage. O bucket é público, portanto use apenas fotos de demonstração nesta fase.
- Modelo acadêmico anterior em `database/schema.sql`; a integração efetiva usa a migração em `supabase/migrations/`.
- Tela de detalhes com URL própria e tratamento para ocorrência inexistente.
- Atualização da situação limitada ao tutor responsável, validada também pelo banco.
- Filtros combinados por tipo, espécie e situação.
- Envio de fotos para o armazenamento do projeto.
- Mensagens privadas visíveis ao tutor do relato e à moderação.
- Regras reais: visitante consulta relatos aprovados; usuário autenticado cadastra e altera apenas os próprios; administrador autorizado modera.
- Mapa base do OpenStreetMap com recorte de Bauru e lista de ocorrências por região, sem expor endereços exatos.
- Painel do tutor com indicadores e registros associados ao tutor demonstrativo.
- Painel administrativo com revisão e ocultação de ocorrências.
- Atualização da lista sem recarregar a página.
- Layout responsivo e navegação por teclado.
- Rotas para início, ocorrências, detalhes, mapa, painel, administração, cadastro e página não encontrada.

## Limitações da versão inicial

Esta ainda é uma demonstração acadêmica, não um serviço oficial. Use apenas relatos e fotos fictícios; o bucket de fotos é público. O mapa não possui geocodificação nem marcadores vinculados aos registros. As mensagens podem ser lidas nos painéis, mas ainda não há resposta dentro do aplicativo. O plano gratuito pode pausar por inatividade e não oferece backups automáticos. Não use o protótipo para dados reais de cidadãos sem uma revisão de privacidade, retenção, segurança e operação.

## Modelo de dados

O arquivo `database/schema.sql` documenta a modelagem da etapa acadêmica anterior e não deve ser aplicado ao Supabase. As migrações efetivas estão em `supabase/migrations/`: usuários vêm do Supabase Auth; `occurrences` registra relatos, `contact_messages` guarda mensagens e `app_admins` define quem pode moderar. A tabela `moderation_actions` só aceita registros de administradores e aciona a atualização do relato, mantendo uma trilha de auditoria. A chave publishable em `src/backend.js` não é segredo; a segurança depende das políticas RLS. Nunca coloque a senha do PostgreSQL nem chaves secret/service-role no navegador ou no Git.

Para habilitar uma conta de administrador, primeiro crie e confirme a conta pela interface. Depois, no editor SQL do Supabase, confira a identidade em `auth.users` e adicione **somente o ID escolhido** a `public.app_admins`. Não existe promoção automática de contas pela interface.

No projeto gratuito sem SMTP próprio, os e-mails de confirmação só são enviados aos endereços que fazem parte da equipe Supabase. A URL principal de retorno está configurada para `http://127.0.0.1:8000/index.html`; também foram permitidos retornos para `http://localhost:8000/index.html`. O cliente usa PKCE para não conflitar com as rotas `#/`. Altere as URLs antes de publicar o aplicativo. Não desative a confirmação de e-mail para contornar o limite.

## Testes e evidências

A primeira etapa de CI/CD está descrita em [`docs/ci-cd.md`](docs/ci-cd.md). O workflow verifica sintaxe, lógica e interface com dados fictícios simulados em pull requests; após um push validado em `main`, produz um pacote estático versionado para promoção manual. Não publica o aplicativo nem aplica migrações ao Supabase.

Os resultados anteriores em `qa/vvt/` (15 casos de navegador) documentam a versão com `localStorage` e **não comprovam a integração atual**. A suíte atual tem oito testes de lógica (`pnpm test`), nove verificações de navegador online (`pnpm run test:browser`, com evidências em `qa/online/`) e cinco verificações de navegador isoladas para CI (`pnpm run test:ci-browser`). Também foi verificado que a chave pública consulta as três amostras e recebe HTTP 401 ao tentar inserir sem login. O Security Advisor do Supabase terminou sem erros nem avisos após os ajustes. Ainda falta validar ponta a ponta, em homologação, confirmação de conta, cadastro, moderação, foto, mensagem e mudança de status antes de uso com pessoas reais.

## Organização do código

- `app.js`: inicialização da aplicação, rotas e guardas de navegação.
- `src/data.js`: rótulos e formatação da interface; mantém funções legadas de demonstração sem uso na versão online.
- `src/backend.js`: cliente público Supabase e conversão de dados.
- `src/store.js`: estado central, sessão e ações de negócio online.
- `supabase/migrations/`: esquema aplicado, RLS, função de moderação e dados fictícios.
- `src/components.js`: cabeçalho, cards, modal e avisos reutilizáveis.
- `src/views.js`: telas associadas às rotas.
- `styles.css`: tokens visuais, componentes e responsividade.
- `assets/`: ícone do sistema e imagens demonstrativas.
- `tests/`: testes de lógica e testes de fluxo no navegador.
- `qa/vvt/`: resultado e capturas da última execução da suíte de navegador.
