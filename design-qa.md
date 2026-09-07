# Design QA — EncontraPet Municipal

## Referência e capturas

- Referência selecionada: opção 2 em `/Users/victorpedroso/.codex/generated_images/01a0741a-6375-7913-95c1-4016493ef275/exec-6a76f78d-64d8-4704-911a-4de47beac59b.png` (1487 × 1058 px).
- Implementação desktop: `qa/home-desktop-viewport-pass-1.png` (viewport CSS e PNG de 1440 × 1024 px, exportação 1×).
- Comparação em uma única superfície: `qa/home-desktop-comparison-pass-1.png`; referência à esquerda e implementação à direita.
- Implementação móvel: `qa/home-mobile-390x844-pass-2.png`, dentro de uma moldura de 390 × 844 px.

## Comparação visual

### Página completa / desktop

- Confirmados: paleta creme, verde-petróleo, sálvia, damasco e lavanda; tipografia editorial no título; navegação simples; CTA preenchido e CTA contornado; imagem real de cão e gato; bloco de ocorrências com tom quente; rodapé verde escuro.
- A implementação preserva o conceito da referência sem copiar seus textos ou dados fictícios: o carrossel foi traduzido para os cards reais da aplicação e o bloco de privacidade ficou explícito.
- Diferenças intencionais: há duas ocorrências recentes (em vez de um trilho horizontal) e um bloco informativo adicional abaixo da dobra, necessários para o fluxo já existente da aplicação.

### Região focal / hero e cabeçalho

- Confirmados: ícone proprietário em PNG, ícones consistentes da biblioteca Phosphor, título de alto contraste, imagem com recorte orgânico e legenda lavanda.
- Não há desenhos CSS/SVG improvisados, emoji como ícone, nem imagens de placeholder visíveis.

### Responsividade

- Desktop: validado em 1440 × 1024 px.
- Móvel: validado dentro de 390 × 844 px. A grade do hero passa para uma coluna, os botões permanecem acessíveis e o cabeçalho mantém todos os controles na largura disponível.

## Histórico de achados

1. **P1 — cabeçalho excedia 390 px.** O CTA “Cadastrar” e o menu “Área” se sobrepunham/saíam pelo lado direito. Corrigido em `styles.css`: abaixo de 700 px, o CTA vira um botão de ícone de 42 px, preservando o nome acessível do link.
2. **P2 — cache da folha de estilos durante a inspeção.** Atualizada a referência de `styles.css` com versão de consulta para garantir a carga da regra corrigida no preview.

Nenhum achado P0, P1 ou P2 permanece aberto.

## Fluxos e acessibilidade verificados

- Navegação para Ocorrências, Mapa e Cadastro.
- Escolha de perfil Tutor para revelar o formulário de cadastro.
- Escolha de perfil Administrador para revelar a rota Administração e carregamento do painel administrativo.
- Foco visível, navegação por teclado, link de pular conteúdo, rótulos de formulário, texto alternativo nas imagens e redução de movimento definidos na interface.
- Console: sem erros ou avisos nas rotas verificadas.

**final result: passed**
