# EncontraPet Municipal

Primeira versão do projeto integrador para registrar, consultar e acompanhar pets achados e perdidos em Bauru, SP.

## Tecnologias

- Vue.js 3 via CDN
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
- Tela de detalhes com as características completas do pet.
- Atualização da situação do animal diretamente no card.
- Filtros combinados por tipo, espécie e situação.
- Pré-visualização de fotos e armazenamento local da imagem.
- Formulário demonstrativo de contato mediado.
- Seletor de perfil para demonstrar visitante, tutor e administrador.
- Atualização da lista sem recarregar a página.
- Layout responsivo e navegação por teclado.

## Limitações da versão inicial

Os dados e mensagens ficam salvos apenas no navegador, sem sincronização entre dispositivos. O seletor de perfil é demonstrativo e ainda não representa autenticação real. Banco de dados online, autenticação segura, contato mediado por servidor e publicação serão desenvolvidos em etapas posteriores.
