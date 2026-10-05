# Projetos separados · 05/10/2026

Fonte: `https://github.com/MatheusDevArt/Tuna-Stream`, branch `main`.

## Painel

O aplicativo em `analytics/` já está publicado em https://tunastream-painel.matheusdevart.chatgpt.site/ e usa o Supabase independente **TunaStream Analytics** (`fundfokaxkmgvdrpwyot`). Os registros reais, logins, coleta oficial do Instagram, clientes e cron estão instalados nesse banco. Não reinstalar nem migrar para o banco antigo do Lovable. Não copiar segredos, dados de clientes ou senhas para o chat ou o código público.

O painel deve ficar em um projeto Lovable próprio, separado de **Tuna Stream Central**. Projeto criado: `5551fcbe-b85a-4660-96e3-5449e6850f72`, editor https://lovable.dev/projects/5551fcbe-b85a-4660-96e3-5449e6850f72. A importação foi solicitada a partir do commit `6afc4adba11e24c6db8b07b08ab38b9ef6df22a2`, diretório `analytics/`.

Importar a fonte completa e compilar o frontend existente para `public/app/`, usando autenticação obrigatória e somente a chave pública do banco. A página inicial pode montar esse aplicativo local em `/app/index.html`, repassando query e hash; não deve incorporar o frontend remoto. Não recriar componentes, métricas, gráficos ou usuários.

Os endpoints locais do projeto dedicado encaminham apenas as cinco APIs privadas de aplicação ao backend existente, preservando a autorização do usuário. O encaminhamento usa destino fixo, valida a origem, limita o corpo, recusa redirecionamentos e não utiliza chave de serviço. Banco, coleta oficial, programação e segredos continuam na infraestrutura atual. O site principal pode manter um redirecionamento de compatibilidade em `/painel`, mas não deve hospedar o aplicativo do painel.

## Publicação confirmada

- Nome no Lovable: **TunaStream Dashboard**.
- Endereço do painel separado: https://tunastream-painel.lovable.app/.
- Commit importado no projeto Lovable: `cfb53b3a40626bacf76c5c0e27666770e269e1c1`.
- Publicação: `165fb6fb-49e1-418c-a7e2-4efdabeb3d5e`. Tela de login individual conferida no endereço publicado.
- Importação consumiu 1,2 créditos, conforme resposta do Lovable.
- Limitação: os créditos acabaram antes de alterar o projeto do site principal. O redirecionamento em `lovable/TunaAnalyticsPage.tsx` e o novo `panelUrl` estão preparados neste repositório, mas ainda precisam ser sincronizados/publicados naquele projeto. O endereço antigo `/painel` continua com o acesso anterior até essa sincronização.
- O login real pelo novo encaminhamento não foi exercitado nesta publicação; a autenticação e os dados continuam no backend existente.

## Site principal

Sincronizar a versão pronta do site via `node lovable/prepare.cjs`, copiando o documento e seus assets, preservando o visual e as URLs de vídeos já hospedados. O arquivo `assets/tuna-analytics-config.js` do repositório é a configuração atual: usa o coletor publicado e o painel novo. Não preservar o endpoint antigo `/api/public/tuna-collect`: ele pertence ao banco antigo. Manter a coleta condicionada à escolha de métricas existente, sem adicionar um banner.

## Dados e períodos

- Conta hoje: seguidores e publicações totais da API, com data da consulta; frequência de Feed/Reels na janela de 30 dias.
- Desempenho: últimos 30 dias por padrão, semana atual ou semanas completas. Alcance vem da consulta do período, sem somar alcance diário.
- A semana nova não zera o retrato da conta. Zero de desempenho permanece quando a Meta realmente retorna zero; indisponibilidade não vira zero.
- Visitas ao site são somente as visitas medidas desde a instalação. Não reconstruir visitas anteriores nem inventar estados.
- Mapa inteiro, todas as siglas, sem seleção obrigatória de estado.

As instruções históricas em `analytics/docs/local-revision-handoff.md` e `deployment-handoff.md` descrevem versões anteriores. Este documento é a orientação atual para esta publicação.
