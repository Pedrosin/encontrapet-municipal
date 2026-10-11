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

Uma falha de teste bloqueia a geração do pacote. O `SHA256SUMS` permite comparar o arquivo promovido com o artefato da execução. A execução em GitHub Actions só poderá ser confirmada após o workflow ser enviado ao repositório remoto.
