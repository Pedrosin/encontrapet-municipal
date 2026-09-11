# EncontraPet Municipal

Primeira versão do projeto integrador para registrar, consultar e acompanhar pets achados e perdidos em Bauru, SP.

## Tecnologias

- Vue.js 3 via CDN
- Vue Router 4 via CDN
- Phosphor Icons via CDN
- HTML5 semântico
- CSS responsivo
- JavaScript

## Como executar

Abra `index.html` em um navegador com conexão à internet. A conexão é necessária para carregar o Vue.js pela CDN.

## Funcionalidades atuais

- Listagem de ocorrências de pets.
- Busca por palavra-chave.
- Filtro por pet perdido ou encontrado.
- Formulário de cadastro com validação dos campos essenciais.
- Persistência local das ocorrências com `localStorage`.
- Modelo SQL documentado em `database/schema.sql`, com entidades, restrições, índices, trigger e operações CRUD.
- Tela de detalhes com URL própria e tratamento para ocorrência inexistente.
- Atualização da situação limitada ao tutor responsável, na área demonstrativa.
- Filtros combinados por tipo, espécie e situação.
- Pré-visualização de fotos e armazenamento local da imagem.
- Formulário demonstrativo de contato mediado.
- Seletor de perfil para demonstrar visitante, tutor e administrador.
- Regras demonstrativas: visitante consulta; tutor cadastra e altera apenas suas ocorrências; administrador modera.
- Mapa base do OpenStreetMap com recorte de Bauru e lista de ocorrências por região, sem expor endereços exatos.
- Painel do tutor com indicadores e registros associados ao tutor demonstrativo.
- Painel administrativo com revisão e ocultação de ocorrências.
- Atualização da lista sem recarregar a página.
- Layout responsivo e navegação por teclado.
- Rotas para início, ocorrências, detalhes, mapa, painel, administração, cadastro e página não encontrada.

## Limitações da versão inicial

Os dados e mensagens ficam salvos apenas no navegador, sem sincronização entre dispositivos. O mapa usa uma base cartográfica real, mas não possui geocodificação nem marcadores vinculados aos registros. O seletor de perfil, as regras de acesso e o painel administrativo são demonstrativos e não representam autenticação ou autorização seguras. Banco de dados online, autenticação segura, contato mediado por servidor e publicação serão desenvolvidos em etapas posteriores.

## Modelo de dados

O arquivo `database/schema.sql` apresenta uma modelagem relacional para uma futura versão online. A entidade `users` representa os perfis do sistema; `occurrences` registra pets achados ou perdidos e se relaciona com o usuário responsável; `contact_messages` guarda o contato mediado associado a uma ocorrência. Chaves estrangeiras, valores permitidos, validações de tamanho, índices de busca e atualização automática de datas documentam as principais restrições do modelo. O arquivo também contém exemplos de inserção, consulta, atualização e remoção.

## Organização do código

- `app.js`: inicialização da aplicação, rotas e guardas de navegação.
- `src/data.js`: dados demonstrativos, normalização e migração do armazenamento local.
- `src/store.js`: estado central, permissões e ações de negócio.
- `src/components.js`: cabeçalho, cards, modal e avisos reutilizáveis.
- `src/views.js`: telas associadas às rotas.
- `styles.css`: tokens visuais, componentes e responsividade.
- `assets/`: ícone do sistema e imagens demonstrativas.
