# Entrega da revisão local

## Escopo e estado

Trabalho realizado localmente na branch `codex/tunastream-analytics`. Nenhuma mensagem enviada ao agente Lovable nesta revisão, nenhum projeto criado, nenhum push e nenhuma mudança no banco ou site de produção. O usuário pediu aprovação da prévia antes da etapa Lovable/GitHub.

- Prévia navegável: http://127.0.0.1:4183/ · contém dados demonstrativos identificados.
- UI: foto original da dupla como capa em 16:9, apenas a tag; recorte CSS, sem alteração de rostos ou fundo. As duas fotos individuais são os arquivos originais.
- Gráficos: evolução diária, distribuição em anel, colunas verticais, lista de posições, comparação numérica e mapa.
- Relatórios: duas PNGs de 1080×2160, somente desempenho, comparação e conteúdos/pacotes em destaque; sem recomendações. Navegador e servidor usam o mesmo SVG.
- Oportunidades: quadro/lista, confirmação privada, histórico de etapas e pacote negociado, incluindo personalizado. Pacote de origem permanece preservado.
- Perfil: fotos iniciais, troca de foto, e-mail verificado, confirmação de usuário por e-mail, recuperação/troca de senha.
- Instagram: OAuth pelo próprio Instagram, mínimo de permissões para métricas, estado de uso único vinculado à conta, tokens cifrados no servidor e renovação.

## WhatsApp e contagem

A mensagem contém um ID de 128 bits e um link `/painel/?confirm=ID`. Abrir o link não grava recebimento; ele exige login de um membro da equipe e o botão “Sim, recebi esta mensagem”. Prévias automáticas e visitantes não podem confirmar.

A reserva do ID espera até oito segundos e mantém a abertura do WhatsApp em caso de falha. Nessa falha, a mensagem não terá referência: não prometer cobertura integral. O consumidor pode apagar o código ou o link.

Confirmação rápida sem telefone identifica **uma referência**, não uma pessoa distinta. A mesma pessoa com dois códigos pode contar duas vezes. O formulário detalhado usa o telefone somente no servidor para obter um HMAC e deduplicar; acrescentá-lo posteriormente mantém a oportunidade e seu histórico. Códigos compartilhados entre pessoas distintas continuam exigindo revisão.

Vendas por pacote são oportunidades recebidas no período, por etapa atual e pacote negociado. Os indicadores históricos de solicitação, envio de orçamento e fechamento preservam eventos registrados, mesmo após mudança de etapa. Nenhuma etapa comprova pagamento bancário.

## Contas e e-mails

Os endereços confirmados pelo usuário estão somente em `.env.accounts.local`, ignorado pelo Git. Não são `VITE_`, não entram no bundle, no ZIP ou no GitHub. A própria conta verá seu endereço pendente e precisará confirmar um link enviado à caixa postal. Não recriar os dois usuários Auth e não armazenar suas senhas em arquivos.

Configurar `RESEND_API_KEY` e `TUNA_MAIL_FROM` com remetente verificado, ou portar o pequeno adaptador de e-mail para o serviço já disponível no ambiente. Nenhuma contratação, compra ou envio de e-mail foi feito. Remetente, disponibilidade e limites precisam de validação antes da ativação. Tokens de 256 bits são guardados somente como HMAC, expiram em 15 minutos e só podem ser consumidos uma vez. Trocas de e-mail/usuário exigem senha atual ao solicitar e login da mesma conta para concluir; recuperação de senha usa o link secreto enviado ao e-mail verificado.

Fotos novas usam o bucket privado `team-avatars`, com tamanho de até 3 MB e JPG/PNG/WebP. O servidor verifica a conta, tipo e assinatura do arquivo; fornece URLs assinadas de uma hora aos membros. As duas fotos iniciais são assets do aplicativo e não devem ser tratadas como arquivos secretos.

## Instagram

Não pedir senha do Instagram no painel e não abrir o console de desenvolvedor como se fosse uma autorização da conta. O botão abre o Instagram na janela externa, inclusive quando o painel está em iframe.

Configurar no servidor `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_TOKEN_ENCRYPTION_KEY` (32 bytes aleatórios em hexadecimal), `META_GRAPH_VERSION`, `INSTAGRAM_REDIRECT_URI` e `TUNA_PANEL_URL`. Cadastrar a URI exata no aplicativo oficial. A conta deve ser profissional (Criador/Empresa); não é necessária uma página Facebook nessa modalidade. Verificar permissões/acesso do aplicativo e autorizar `tuna.stream`. A existência de e-mail/senha no Instagram não substitui OAuth nem habilita métricas de uma conta pessoal.

Tokens são cifrados em AES-GCM com associação à equipe e conta; clientes não consultam a tabela de credenciais. Nenhuma autorização real foi realizada nesta revisão. Os dados e a disponibilidade dos campos precisam ser conferidos com a conta conectada.

## Publicação após aprovação

O Lovable documenta que a conexão de um projeto cria um novo repositório GitHub. Não prometer importar diretamente o repositório atual. Após aprovação: criar o projeto mínimo, conectar o GitHub e transferir o código preparado para o repositório criado pela conexão, mantendo histórico/backups e separando o site público. Verificar o runtime: Vite é o frontend; o servidor tem Request/Response originais Deno e um host Node. Para TanStack, adaptar o registro das rotas sem pedir ao agente para refazer o produto.

Preservar banco, contas, segredos estáveis, cron e dados atuais. Aplicar somente a nova migração de perfis/confirmacão, configurar os serviços e validar acesso de ambos antes de publicar. Incluir o bundle atualizado de `assets/tuna-analytics.js` no site público e configurar `panelUrl` com a rota real. Publicar frontend com `VITE_REQUIRE_AUTH=true`; não publicar a demonstração aberta como painel real.

## Evidências e limites

- 21 testes unitários existentes aprovados.
- 38 verificações de interface local em 1440 e 390 px: capa, fotos, gráficos, formatos do Instagram, etapas, personalizado, download PNG e link de recebimento.
- 28 verificações PostgreSQL local: migrações, confirmação idempotente, bloqueio de referência inválida/expirada, isolamento, HMAC posterior sem duplicação, histórico e tokens de uso único.
- Compilação do frontend e dos oito endpoints Node aprovada; host local respondeu HTTP 200 e negou o arquivo privado com HTTP 404.
- Os testes locais não comprovam entrega de e-mail, autorização OAuth, funcionamento do storage hospedado ou implantação em produção. O cron e a configuração Auth reais não foram modificados.

Fontes: [Instagram Login — Meta](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login), [GitHub — Lovable](https://docs.lovable.dev/integrations/github), [PGlite](https://pglite.dev/docs/api).
