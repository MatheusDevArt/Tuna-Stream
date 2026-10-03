# Verificações — revisão TunaStream

Revisão de 02/10/2026, na branch `codex/tunastream-analytics`.

## Resultados

- Build Vite concluído.
- **10 testes de domínio aprovados**: semanas, cálculos, totais, estados, classificação, links, mensagens distintas, eventos de orçamento e dados indisponíveis.
- **13 verificações de interface aprovadas**, incluindo as 7 páginas a 1440, 768 e 390 pixels, sem rolagem horizontal do documento ou erros de execução.
- **8 verificações de acesso/dados com API simulada aprovadas**: exigência de login, senha inválida, celular, associação ausente, permalinks individuais, horários por fonte, dados reais ausentes, convite e recuperação.
- Nenhum e-mail, mensagem WhatsApp ou convite real foi enviado nos testes.
- Foto original copiada com igualdade SHA256: `B052AE37CEC2440B465A31D17D849890BA99606482AFD56DF9B4917909443474`.

Uma tabela larga de oportunidades pode rolar dentro de seu próprio quadro no celular; isso não produz rolagem horizontal da página.

## Fluxos conferidos

Explorar estados por seletor e teclado; mudar semana e conferir totais/mapa; alternar Feed/Reels/Stories; ordenar Reels por compartilhamentos; abrir prévia e fechar por Escape; bloquear Story expirado; marcar pedido e conferir atualização do relatório; preservar pedido ao mudar a oportunidade para “Não avançou”; trocar período sem levar alterações do exemplo para outra semana.

No ambiente simulado de autenticação: login sem acesso aos exemplos, erro de credenciais, conta autenticada sem associação bloqueada, resposta autorizada exibida, conteúdo com link individual permitido, snapshot vazio sem dados fictícios, confirmação de senha por convite e solicitação de recuperação com resposta genérica.

## Evidências

- `browser-checks.json`: verificações de navegação.
- `auth-checks.json`: verificações controladas de autenticação.
- `gamer-desktop.png`, `gamer-mobile.png`: abertura e mapa.
- `instagram-desktop.png`, `instagram-mobile.png`: conteúdos por formato.
- `gamer-native-reference.png`, `instagram-native-reference.png`: capturas nas dimensões de viewport das referências, com página completa.
- `login-desktop.png`, `login-mobile.png`: login configurado no ambiente fictício.
- `access-denied.png`: conta sem associação autorizada.
- `preview.png`: recorte de viewport para apresentação.

Os screenshots de celular da visão geral mostram 20 pedidos porque um contato fictício foi marcado durante a verificação; o conjunto inicial tem 19. Isso demonstra o fluxo local, não uma coleta real.

O navegador integrado não ficou disponível na tentativa inicial; a verificação usou Playwright/Chromium isolado. Nenhuma sessão de navegador do usuário foi reaproveitada.

## Limites

Supabase real, aplicação da migração, isolamento entre equipes no banco, sincronização em dois aparelhos, convites/e-mails reais, eventos do Lovable, importação da Meta, webhook de atendimento, classificação compartilhada e envio semanal **ainda não foram ativados nem comprovados**.

A migração e o cliente foram preparados. As respostas simuladas validam a interface, sem comprovar autorização no servidor. Aplicar o roteiro em `docs/team-access.md` antes de publicar dados reais.
