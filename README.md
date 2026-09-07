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
- Mapa demonstrativo com localização aproximada das ocorrências.
- Painel do tutor com indicadores de registros e reencontros.
- Painel administrativo com revisão e ocultação de ocorrências.
- Atualização da lista sem recarregar a página.
- Layout responsivo e navegação por teclado.

## Limitações da versão inicial

Os dados e mensagens ficam salvos apenas no navegador, sem sincronização entre dispositivos. O mapa é uma representação visual, não um serviço cartográfico real. O seletor de perfil e o painel administrativo são demonstrativos e ainda não representam autenticação ou autorização reais. Banco de dados online, autenticação segura, contato mediado por servidor e publicação serão desenvolvidos em etapas posteriores.
