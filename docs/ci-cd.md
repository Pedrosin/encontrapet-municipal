# CI/CD do EncontraPet Municipal

Esta é a primeira etapa executável do plano de integração e entrega contínuas. Em pull requests e pushes para `main`, o GitHub Actions instala dependências pelo lockfile, verifica a sintaxe, executa testes de lógica e testa a interface no Chromium com três relatos fictícios simulados. A suíte de CI bloqueia chamadas ao projeto Supabase e não cria registros, contas ou arquivos remotos.

Depois de um push validado em `main`, a mesma execução gera um arquivo `.tar.gz` contendo **somente** os arquivos estáticos necessários ao aplicativo e um arquivo `SHA256SUMS`. O pacote fica como artefato da execução por 30 dias. Isso é uma entrega versionada, **não** uma publicação automática. O artefato continua contendo a chave publishable do cliente, que é pública; nenhuma chave `service_role`, senha ou variável secreta deve ser adicionada ao frontend.

## Reproduzir localmente

Com Node.js 22, pnpm 11.25.0 e Chromium do Playwright instalados:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run check:syntax
pnpm test
pnpm run test:ci-browser
```

`pnpm run test:browser` é a suíte online separada: ela consulta o Supabase real e atualiza as evidências em `qa/online/`; não faz parte da CI. As migrações em `supabase/migrations/` já foram executadas pelo SQL Editor e **não** são reaplicadas por este fluxo.

## Critérios antes da publicação

- Validar em uma área de homologação isolada, com projeto Supabase próprio e dados fictícios, os fluxos completos de conta, confirmação de e-mail, login, ocorrência, foto, contato, status e moderação.
- Definir hospedagem, domínio e URLs de retorno do Supabase; revisar políticas de acesso, privacidade, retenção e recuperação.
- Decidir a estratégia de migração (verificação do estado, revisão de SQL, backup e execução manual aprovada) antes de automatizar qualquer alteração de banco.
- Promover manualmente um pacote aprovado, registrando commit, checksum, responsável e procedimento de reversão. Não há credenciais de produção nem deploy configurados nesta etapa.

Uma falha de teste bloqueia a geração do pacote. O `SHA256SUMS` permite comparar o arquivo promovido com o artefato da execução. O workflow já foi enviado e sua primeira execução remota está registrada abaixo.

## Execução verificada

Em 11/10/2026, o commit `28a3e91` passou no GitHub Actions: sintaxe, oito testes de lógica, cinco verificações de navegador com dados simulados e criação do pacote estático com checksum. A execução ficou registrada em <https://github.com/Pedrosin/encontrapet-municipal/actions/runs/38168426833>. No mesmo dia, nove verificações online de leitura passaram localmente; o fluxo autenticado real está documentado em `qa/online/fluxo-autenticado-2026-10-11.md`. Nada disso equivale a publicar o aplicativo ou a testar todas as variantes de autenticação.
