# Publicar a versão pronta · 05/10/2026

Fonte: `https://github.com/MatheusDevArt/Tuna-Stream`, branch `main`.

## Painel

O aplicativo em `analytics/` já está publicado em https://tunastream-painel.matheusdevart.chatgpt.site/ e usa o Supabase independente **TunaStream Analytics** (`fundfokaxkmgvdrpwyot`). Os registros reais, logins, coleta oficial do Instagram, clientes e cron estão instalados nesse banco. Não reinstalar nem migrar para o banco antigo do Lovable. Não copiar segredos, dados de clientes ou senhas para o chat ou o código público.

Para a integração mínima, copiar `lovable/TunaAnalyticsPage.tsx` sem alterações e montá-lo na rota `/painel`. O componente abre o painel existente, repassa parâmetros de ticket/OAuth e mantém o login individual dentro dele. Não recriar componentes, métricas, gráficos ou APIs. A antiga cópia do painel deve ser substituída nessa rota para não mostrar outro banco. A infraestrutura e os dados continuam no backend já publicado; esta é uma integração de acesso, não uma transferência de hospedagem.

## Site principal

Sincronizar a versão pronta do site via `node lovable/prepare.cjs`, copiando o documento e seus assets, preservando o visual e as URLs de vídeos já hospedados. O arquivo `assets/tuna-analytics-config.js` do repositório é a configuração atual: usa o coletor publicado e o painel novo. Não preservar o endpoint antigo `/api/public/tuna-collect`: ele pertence ao banco antigo. Manter a coleta condicionada à escolha de métricas existente, sem adicionar um banner.

## Dados e períodos

- Conta hoje: seguidores e publicações totais da API, com data da consulta; frequência de Feed/Reels na janela de 30 dias.
- Desempenho: últimos 30 dias por padrão, semana atual ou semanas completas. Alcance vem da consulta do período, sem somar alcance diário.
- A semana nova não zera o retrato da conta. Zero de desempenho permanece quando a Meta realmente retorna zero; indisponibilidade não vira zero.
- Visitas ao site são somente as visitas medidas desde a instalação. Não reconstruir visitas anteriores nem inventar estados.
- Mapa inteiro, todas as siglas, sem seleção obrigatória de estado.

As instruções históricas em `analytics/docs/local-revision-handoff.md` e `deployment-handoff.md` descrevem versões anteriores. Este documento é a orientação atual para esta publicação.
