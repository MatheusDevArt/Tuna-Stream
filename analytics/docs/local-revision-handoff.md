# Entrega da revisão local

## Escopo e estado

Trabalho local na branch `codex/tunastream-analytics`. Sem uso do Lovable, push ou nova publicação do site. O usuário criou um projeto Supabase independente, **TunaStream Analytics**, e informou as credenciais pela página privada local. O site publicado e seu banco anterior foram preservados.

- Painel conectado: http://127.0.0.1:4183/ · login obrigatório, novo banco real inicialmente vazio.
- Histórico real: http://127.0.0.1:4183/historico/ · login no banco anterior, somente consulta. Não migra nem mistura cadastros.
- Demonstração: http://127.0.0.1:4183/?modo=demonstracao · somente em loopback e quando explicitamente habilitada; exemplos não são gravados no banco real.
- UI: foto original da dupla em uma janela de até 520×190 px (140 px de altura no celular), apenas a tag; recorte CSS, sem alteração de rostos ou fundo. As duas fotos individuais são os arquivos originais.
- Gráficos: evolução diária, distribuição em anel, colunas verticais, lista de posições, comparação numérica e mapa.
- Relatórios: duas PNGs de 1080×2160, somente desempenho, comparação e conteúdos/pacotes em destaque; sem recomendações. Navegador e servidor usam o mesmo SVG.
- Oportunidades: quadro/lista de todo o histórico, confirmação privada, cliente identificado, serviço (configuração, personalização ou ambos), pacote negociado, personalizado com nome, estado e cidade. Pacote de origem permanece preservado.
- Vendas: negócios fechados, compradores únicos, pacotes, serviços e mapa de compras. Estado é informado no atendimento; o mapa de compradores é separado do mapa de visitantes.
- Perfil: fotos iniciais, troca de foto, e-mail verificado, confirmação de usuário por e-mail, recuperação/troca de senha.
- Instagram: autorização oficial de tuna.stream concluída pelo usuário. Primeira coleta no Supabase concluída em 03/10/2026 às 02:06 (Brasília), sem erro: três posts de Feed e cinco Stories; semana em andamento com 1.150 visualizações, alcance de 169 contas e 21 seguidores na consulta de 02:05:57. O painel e o banco mostram a fonte Meta. O cron está ativo; coleta aproximadamente a cada hora sem depender do computador. A importação anterior do Metricool permanece no histórico de commit/exportação; atualizar o painel relê o banco. Veja [estado e limites da coleta](../README.md).

## WhatsApp e contagem

A mensagem contém um ID de 128 bits e um link `/painel/?confirm=ID`. Abrir o link não grava recebimento; ele exige login de um membro da equipe e o botão “Sim, recebi esta mensagem”. Prévias automáticas e visitantes não podem confirmar.

A reserva do ID espera até oito segundos e mantém a abertura do WhatsApp em caso de falha. Nessa falha, a mensagem não terá referência: não prometer cobertura integral. O consumidor pode apagar o código ou o link.

Confirmação rápida sem telefone registra **uma oportunidade**, não um cliente identificado. “Dados do cliente” usa o telefone somente no servidor para obter um HMAC e deduplicar o cadastro. Pedidos com o mesmo telefone compartilham `client_id`; acrescentá-lo posteriormente mantém a oportunidade e seu histórico. Códigos compartilhados entre pessoas distintas continuam exigindo revisão.

Recebimentos e clientes identificados usam a data de chegada. Vendas e compradores usam `won_at` no período e etapa atual `won`; um negócio posteriormente perdido deixa de contar como venda atual. Indicadores de orçamento usam a coorte de chegada e os marcos históricos. Quadro e cadastro de clientes mostram todo o histórico. Nenhuma etapa comprova pagamento bancário.

## Banco independente conectado em 03/10/2026

Projeto `fundfokaxkmgvdrpwyot`, URL pública `https://fundfokaxkmgvdrpwyot.supabase.co`. Instaladas as seis migrações de dados históricas, perfis/confirmacão e clientes/vendas; o script de agendamento seguro foi excluído. Criados dois usuários Auth e seus vínculos à mesma equipe, sem guardar senhas. Os dois logins e a consulta de perfis retornaram HTTP 200. Cadastro público e acesso anônimo Auth desativados; consulta anônima das tabelas protegidas é negada.

O servidor Node local consolida snapshots a cada 60 segundos e após alterações de oportunidades. A chave privada e os identificadores/segredos de servidor ficam somente em `.env.server.local`, ignorado pelo Git. O frontend recebe somente valores públicos em `.env.local`. A configuração inicial impede uma segunda execução sobre o banco já conectado.

O coletor do site público continua apontando para o banco anterior. A consulta ao histórico retornou quatro visitas/quatro visitantes na semana de 28/09 a 04/10, parcial, no momento da verificação. Não existem oportunidades, clientes ou visitas importados no novo banco. Nenhum cliente fictício foi criado nele.

Esta hospedagem escuta apenas `127.0.0.1`: o novo painel não é acessível de outro computador/celular até hospedar o servidor e frontend em HTTPS. O banco já é compartilhado; acessibilidade móvel e publicação são etapas distintas.

## Contas e e-mails

Os endereços confirmados pelo usuário estão somente em `.env.accounts.local`, ignorado pelo Git. Não são `VITE_`, não entram no bundle, no ZIP ou no GitHub. A própria conta verá seu endereço pendente e precisará confirmar um link enviado à caixa postal. Não recriar os dois usuários Auth e não armazenar suas senhas em arquivos.

Configurar `RESEND_API_KEY` e `TUNA_MAIL_FROM` com remetente verificado, ou portar o pequeno adaptador de e-mail para o serviço já disponível no ambiente. Nenhuma contratação, compra ou envio de e-mail foi feito. Remetente, disponibilidade e limites precisam de validação antes da ativação. Tokens de 256 bits são guardados somente como HMAC, expiram em 15 minutos e só podem ser consumidos uma vez. Trocas de e-mail/usuário exigem senha atual ao solicitar e login da mesma conta para concluir; recuperação de senha usa o link secreto enviado ao e-mail verificado.

Fotos novas usam o bucket privado `team-avatars`, com tamanho de até 3 MB e JPG/PNG/WebP. O servidor verifica a conta, tipo e assinatura do arquivo; fornece URLs assinadas de uma hora aos membros. As duas fotos iniciais são assets do aplicativo e não devem ser tratadas como arquivos secretos.

## Instagram

Não pedir senha do Instagram no painel e não abrir o console de desenvolvedor como se fosse uma autorização da conta. O botão abre o Instagram na janela externa, inclusive quando o painel está em iframe.

Configurar no servidor `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_TOKEN_ENCRYPTION_KEY` (32 bytes aleatórios em hexadecimal), `META_GRAPH_VERSION`, `INSTAGRAM_REDIRECT_URI` e `TUNA_PANEL_URL`. Cadastrar a URI exata no aplicativo oficial. A conta deve ser profissional (Criador/Empresa); não é necessária uma página Facebook nessa modalidade. Verificar permissões/acesso do aplicativo e autorizar `tuna.stream`. A existência de e-mail/senha no Instagram não substitui OAuth nem habilita métricas de uma conta pessoal.

Tokens são cifrados em AES-GCM com associação à equipe e conta; clientes não consultam a tabela de credenciais. A autorização real, o retorno ao painel e a primeira coleta oficial foram confirmados. Saldo de seguidores e dados demográficos permanecem indisponíveis para esta conta pequena; visitas ao perfil e cliques na bio não são preenchidos com outras métricas.

## Publicação após aprovação

O Lovable documenta que a conexão de um projeto cria um novo repositório GitHub. Não prometer importar diretamente o repositório atual. Após aprovação: criar o projeto mínimo, conectar o GitHub e transferir o código preparado para o repositório criado pela conexão, mantendo histórico/backups e separando o site público. Verificar o runtime: Vite é o frontend; o servidor tem Request/Response originais Deno e um host Node. Para TanStack, adaptar o registro das rotas sem pedir ao agente para refazer o produto.

Escolher explicitamente o banco de destino antes da publicação; não substituir o banco antigo nem migrar seus contatos com um novo segredo HMAC sem uma estratégia de migração. No novo banco, as migrações de dados estão instaladas e o coletor/callback do Instagram estão hospedados com cron ativo. Ainda falta hospedar o frontend, os endpoints protegidos da aplicação e a coleta pública do site; Google Analytics, recuperação por e-mail e envio de relatórios também dependem de configuração. No banco antigo, perfis e clientes ainda não foram aplicados. Incluir o bundle atualizado de `assets/tuna-analytics.js` no site público com o endpoint HTTPS de destino e `panelUrl` real. Publicar com `VITE_REQUIRE_AUTH=true` e `VITE_ALLOW_LOCAL_DEMO=false` somente após aprovação.

## Evidências e limites

- 21 testes unitários existentes aprovados.
- 48 verificações de interface local em 1440 e 390 px: foto compacta, fotos individuais, gráficos, formatos, edição de cliente/serviço/pacote/região, cadastro, download PNG e link de recebimento.
- 40 verificações PostgreSQL local: migrações, confirmação idempotente, referência inválida/expirada, isolamento, HMAC posterior, dois pedidos para o mesmo cliente, pacote personalizado, estado válido e tokens de uso único.
- Compilação do frontend e dos oito endpoints Node aprovada; host local respondeu HTTP 200 e negou o arquivo privado com HTTP 404.
- Verificações reais: dois logins, dois perfis na mesma equipe, três snapshots iniciais, tabelas de clientes e oportunidades vazias, anonimato negado e histórico consultado sem alteração.
- A atualização da coleta oficial passou em 27 testes de regras/renderização e 38 verificações isoladas de banco/controles do agendamento. A coleta real da Meta gravou oito conteúdos e três períodos em uma transação, sem erro. O cron está ativo no novo Supabase; o cron do banco antigo foi preservado. Windsor não é usado nesta integração.
- Essas verificações não comprovam entrega de e-mail, upload de fotos hospedado ou publicação do frontend desta revisão.
- Rotas hospedadas verificadas: callback sem estado e coletor sem segredo retornam HTTP403. O carregamento do Vault usa memória do módulo, pois o runtime Edge recusou alterar as variáveis de ambiente. Nenhuma chave privada foi detectada no conteúdo do commit local.
- Caminho do agendamento verificado: chamada pela mesma função SQL do cron retornou HTTP200, sem timeout, com `not_due` e `schedulerConfigured=true`. Isso confirma a conexão independente; não força uma nova consulta à Meta antes do intervalo. A próxima execução periódica ainda não foi observada nesta entrega.

Fontes: [Instagram Login — Meta](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login), [GitHub — Lovable](https://docs.lovable.dev/integrations/github), [PGlite](https://pglite.dev/docs/api).
