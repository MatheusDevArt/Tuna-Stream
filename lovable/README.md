# Integração opcional para Lovable

O site público do Lovable foi inspecionado em 01/10/2026. Ele usava uma cópia antiga de `assets/main.js`, que navegava com `scrollIntoView` sobre seções sticky. Esta pasta prepara a integração, mas não altera diretamente o projeto remoto do Lovable.

## Integração

Execute `node lovable/prepare.cjs` na raiz. O resultado fica em `.preview/lovable-export/`.

1. Copie `public/tuna-stream/` para `public/tuna-stream/` no projeto Lovable.
2. Copie `TunaStreamPage.tsx` para os componentes do Lovable e renderize-o na rota inicial.
3. Retire da rota inicial a antiga cópia do HTML e os scripts injetados individualmente. Não monte as duas versões juntas.
4. Preserve os metadados da rota e confira a página antes de publicar.

O iframe de mesma origem ocupa a viewport inteira. Apenas o documento interno rola; o router React não controla as âncoras, não duplica listeners e não interfere no parallax. Os links externos abrem em nova aba e o formulário continua preparando a mensagem para WhatsApp. A URL externa permanece na rota inicial; as âncoras ficam no documento do site.

## Conferência

Abra `.preview/lovable-preview.html` pelo servidor local. Teste navegação, passagem automática, fim de Trabalhos e Pacotes, FAQ, formulário e carrossel mobile. A exportação é uma cópia integral da mesma versão local, sem ajustes visuais separados.
