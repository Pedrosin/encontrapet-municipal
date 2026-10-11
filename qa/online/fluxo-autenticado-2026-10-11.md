# Validação autenticada — 11/10/2026

Ambiente: aplicação local em `http://127.0.0.1:8000`, conectada ao projeto Supabase acadêmico existente. Sessão de uma conta já autenticada e autorizada para administração; nenhuma senha foi solicitada ou registrada. Todos os novos dados foram fictícios. As duas migrações existentes não foram executadas novamente.

## Resultados observados

1. O formulário rejeitou `assets/pet-mel.png` por exceder 1,2 MB, com aviso visível. Nenhuma ocorrência foi enviada nessa tentativa.
2. Uma ilustração nova e fictícia de cão, abaixo de 1,2 MB, foi aceita com pré-visualização. A ocorrência `Mel QA Fictícia` foi enviada como pendente e apareceu no painel do tutor com imagem (ID 6).
3. Uma sessão anônima viu quatro relatos públicos e não encontrou o novo relato enquanto pendente.
4. O painel administrativo listou o relato pendente; a ação de aprovar concluiu com aviso de sucesso e zerou a fila de pendências.
5. Uma sessão anônima passou a ver cinco relatos, incluindo o novo. A imagem pública carregou com dimensões naturais de 1254 × 1254 pixels.
6. Uma mensagem sem dados pessoais foi registrada pelo contato mediado e apareceu tanto no painel do tutor quanto na visão administrativa.
7. O responsável alterou a situação para `Pet reencontrado`; a nova situação apareceu no painel e persistiu em nova consulta anônima à página de detalhes.

A captura do estado final está em `qa/online/fluxo-autenticado-2026-10-11.png` e mostra apenas o relato fictício.

## Limites da evidência

- A conta já estava autenticada; esta execução não testou criação de conta, confirmação de e-mail ou login com senha.
- A mesma conta era responsável e administradora. O envio de contato não comprova o fluxo entre duas contas diferentes nem todas as políticas RLS.
- A aprovação foi confirmada pela interface e pela consulta pública; a tabela de auditoria não foi consultada diretamente nesta execução.
- O teste ocorreu no projeto compartilhado de demonstração, não em homologação isolada. O relato fictício aprovado permanece visível até que uma ação de moderação posterior o oculte.
- O PDF acadêmico deve refletir estes resultados e limites antes da entrega; este arquivo é evidência técnica, não substitui o modelo da faculdade.
