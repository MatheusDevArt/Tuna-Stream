# Correções prontas e bloqueadas pelos créditos do Lovable

**Estado histórico da publicação anterior.** O usuário agora pediu desenvolvimento local e aprovação antes da próxima etapa Lovable/GitHub. A implementação local já usa o gerador PNG portátil e recebeu perfis, OAuth e confirmação por link. Consulte [a entrega atual](local-revision-handoff.md). Nada desta revisão foi publicado.

Projeto: Tuna Stream Central. Painel publicado em https://tunastream-ofc.lovable.app/painel.

## PNG do servidor

- Instalar opentype.js@1.3.4 no app TanStack.
- Copiar supabase/functions/_shared/report-raster.js para src/lib/tuna/report-raster.server.ts.
- Ajustar somente imports font-data.js e report-image.js para os módulos equivalentes .server.
- Reexportar renderReportPng como renderPng no módulo png.server.ts, substituindo o stub atual.
- O código usa fonte Poppins embutida, rasterização e CompressionStream, sem WASM, filesystem, biblioteca de canvas ou serviço externo.
- Validado localmente: duas PNGs de 1080×2160, aproximadamente 204 KB/184 KB, 347 ms no total. Teste de assinatura, dimensões, descompressão e diferença entre imagens aprovado.
- Validar também no runtime hospedado antes de declarar geração automática disponível. Manter report_preferences.enabled=false sem remetente oficial e teste de entrega.

## Origem de tráfego no iframe

O tracker atualizado em ../assets/tuna-analytics.js lê utm_source e referrer do wrapper pai quando há mesma origem. O site usa iframe: sem esse ajuste, uma visita direta pode aparecer como Outros e o parâmetro da página externa pode ser perdido.

Copiar o bundle para public/tuna-stream/assets/tuna-analytics.js. Testar origem através de /?utm_source=instagram, visitas diretas e referência externa sem gravar URLs completas ou parâmetros arbitrários.

## Referências e latência

A reserva da referência aguarda 1,8 s e mantém o WhatsApp funcional quando falha. Em verificação real, respostas lentas produziram abertura sem referência. Melhorar a reserva antecipada por pacote ou ampliar o prazo com estado de abertura, mantendo fallback e sem inventar código não registrado.

## Acesso

Preservar contas, senhas, segredos, cron, regras RLS e site público. Os dois logins reais já passaram em produção. Não recriar usuários nem incluir senhas no pacote.

## Provedores

Conectar Instagram e GA4 por autorização oficial e guardar credenciais no servidor. Para envio semanal, configurar remetente oficial, destinatário autorizado e dois modelos de imagem aprovados. O número de atendimento pode continuar no WhatsApp comum com confirmação manual.
