# TunaStream — painel de métricas

Programa em português brasileiro, com identidade gamer da TunaStream, foto original, mapa dos 27 estados e versões para celular e computador.

## Revisão local atual · aguardando aprovação

Painel em **http://127.0.0.1:4183/** conectado ao novo Supabase **TunaStream Analytics**, com dois acessos reais. O banco começa vazio; o site publicado continua na versão anterior e grava no banco antigo. Consulte esse histórico real, sem alterações, em **http://127.0.0.1:4183/historico/**. Demonstração separada somente em `/?modo=demonstracao`. Sem chamadas ao Lovable ou push. Veja [estado da revisão](docs/local-revision-handoff.md).

Foto compacta no topo, fotos individuais, gráficos variados, dois relatórios em PNG, quadro de vendas, cadastro de clientes deduplicado, serviços, pacotes personalizados e mapa de compras. Recuperação por e-mail, OAuth e envio automático têm código preparado, mas ainda dependem dos provedores; não estão ativados.

Os e-mails fornecidos ficam somente em `.env.accounts.local`, ignorado pelo Git. Eles serão oferecidos à própria conta para verificação; ainda não foram associados ao banco publicado nem usados para enviar mensagens. O código exige a confirmação do endereço antes de habilitar recuperação.

As migrações de perfis e clientes (`202610030001*` e `202610030002*`) foram instaladas no **novo** Supabase, junto das seis migrações históricas de dados. O banco antigo não recebeu esta atualização. O novo banco não tem cron externo: o host local consolida dados a cada 60 segundos enquanto está aberto. Não reaplicar migrações nem substituir o banco de destino implicitamente.

`npm run build:server`, `npm run build` e `npm run start:server` oferecem os oito endpoints em Node. A configuração privada atual usa a porta 4183; o padrão sem configuração é 4182. O host escuta apenas em loopback e não disponibiliza o painel em outros dispositivos. Para acesso remoto, hospedar frontend/servidor em HTTPS e configurar origens/URLs reais.

## Implementado

- Login por usuário e senha: **Matheus P** e **Adriana S**, na mesma equipe.
- Banco online com regras por equipe, contas individuais e senhas protegidas pelo Supabase Auth.
- Coletor do site com consentimento, sessões, visitantes, cliques, tempo ativo, seções, rolagem, navegador, sistema e Web Vitals.
- Referência única e link privado nos botões do WhatsApp; confirmação explícita pela equipe para continuar usando o aplicativo comum. Sem telefone, deduplicação por referência; com telefone, por identificador protegido.
- Histórico compartilhado de pedidos, orçamentos enviados, fechamento e perda.
- Conector oficial do Instagram, com Feed, Reels, Stories, miniaturas e links reais quando a conta estiver autorizada.
- Duas imagens PNG separadas: site e Instagram. Prévia e download no painel.
- Envio oficial das duas imagens com agenda, deduplicação, tentativas limitadas e confirmação de entrega por webhook.
- Mapa e localidades por Google Analytics quando configurado; ausência de dados não vira localização inventada.
- Semana em andamento e duas semanas completas, sem comparação de totais parciais com semana completa.

## Estado da publicação anterior

O painel está publicado em **https://tunastream-ofc.lovable.app/painel**. Os dois usuários foram validados por login real em desktop e celular. As sete migrações foram aplicadas no banco do projeto **Tuna Stream Central**. O agendador de minuto está ativo e seus pedidos retornaram HTTP200 em produção. A coleta do site já gravou visitas reais.

O Lovable adaptou os seis endpoints para rotas TanStack em `/api/public/tuna-<nome>`; a plataforma não aceita novas funções Supabase. Os originais Deno ficam nesta pasta como alternativa de hospedagem. Os arquivos publicados são preservados no projeto Lovable, com o fonte do painel em `analytics/`.

Instagram, Google Analytics e envio automático de imagens dependem das credenciais e permissões reais dos provedores. Nenhuma mensagem recebida ou entrega de relatório é simulada como produção. A geração das PNGs no navegador funciona. O gerador puro JavaScript do servidor foi validado localmente, mas sua aplicação no Lovable ficou bloqueada por créditos esgotados: o servidor publicado ainda possui um stub e o envio automático não funciona, mesmo se somente as credenciais forem adicionadas. Também está pendente um ajuste para preservar a origem de tráfego através do iframe; interpretar os canais como provisórios até aplicá-lo. Os arquivos em `design/relatorio-*-exemplo.png` são demonstrações identificadas.

## Executar localmente

`npm install`, depois `npm run dev`. Prévia em http://127.0.0.1:4180/.

Sem configuração, o desenvolvimento permite visualizar exemplos. Produção deve usar `VITE_REQUIRE_AUTH=true`; sem conexão válida mostra a tela protegida de configuração e não libera a demonstração.

`npm test` verifica regras e cálculos. `npm run build` gera o painel; `npm run build:tracker` gera o coletor em `../assets/tuna-analytics.js`.

Para publicar em `/painel/`, use `VITE_BASE_PATH=/painel/`. O projeto Lovable usa um wrapper TanStack e iframe para o site público; preservar essa navegação e servir o painel em uma rota própria.

## Atualização online

### Instagram via Metricool no novo banco

A conta `tuna.stream` (marca `7209286`) foi reconhecida pelo plugin. A consulta de 03/10/2026 trouxe três posts reais de 01 e 02/10, com miniaturas, links e métricas acumuladas. O histórico diário é parcial: o registro de 01/10 informou 15 seguidores, 417 visualizações e 108 de alcance diário. Reels, Stories e países vieram sem registros; isso não comprova ausência de publicação ou audiência. O painel mantém os totais semanais e comparações sem base como indisponíveis.

O arquivo de exportação privado fica em `.qa/metricool-instagram.json`, ignorado pelo Git. `node server/import-metricool.mjs` valida a marca/conta e o novo banco antes de importar e consolidar. O painel mostra a fonte, a data da consulta, os dias informados e o caráter acumulado das métricas dos posts. **Importação manual pelo plugin nesta conversa; atualizar o painel apenas relê o banco.** Nenhuma coleta automática do Metricool foi ativada e nenhuma configuração da publicação anterior foi alterada.

Os dois perfis usam o mesmo banco. O painel local ainda precisa de hospedagem aprovada para acesso remoto da parceira. O servidor consolida os registros aproximadamente a cada minuto; o navegador acompanha por Realtime e consulta a cada 60 segundos como complemento. A importação atual do Metricool é manual. A confirmação de contatos depende do registro feito por vocês.

### Coleta oficial do Instagram — 03/10/2026

O aplicativo Meta `TunaStream Analytics` (`1870500717264659`) e o aplicativo Instagram `TunaStream Analytics-IG` (`1098888089403799`) estão preparados com apenas `instagram_business_basic` e `instagram_business_manage_insights`. A autorização usa Instagram Login, sem página do Facebook. O perfil precisa ser profissional e aceitar o convite de testador durante o desenvolvimento. A versão consultada na documentação é **v26.0**.

No projeto independente `fundfokaxkmgvdrpwyot`, as funções `tuna-instagram-callback` e `tuna-instagram-sync` estão implantadas. A configuração privada foi salva pelo usuário, com chaves do coletor no Vault; o segredo do aplicativo permanece somente no servidor local ignorado pelo Git. O retorno HTTPS aprovado é `https://fundfokaxkmgvdrpwyot.supabase.co/functions/v1/tuna-instagram-callback`. O código OAuth retorna ao painel local, é consumido uma vez e o token fica cifrado no banco.

**Perfil autorizado e primeira coleta válida concluída em 03/10/2026 às 02:06 (Brasília).** A consulta começou às 02:05:57 e retornou 21 seguidores, 1.150 visualizações e alcance de 169 contas para a semana em andamento, além de três posts de Feed e cinco Stories. Esses números são uma medição nessa data, não valores permanentemente atuais. A semana está parcial e não recebe comparação com uma semana completa. A API informou zero nas duas semanas anteriores; seguidores históricos continuam indisponíveis. O total dos seguidores se refere à data da consulta, não a ganhos na semana.

O servidor Supabase ativou o cron após receber esses dados válidos. O cron verifica a cada 15 minutos e o coletor consulta a Meta quando a última coleta válida tem pelo menos 55 minutos: aproximadamente uma vez por hora, com novas tentativas após falha. O computador não precisa ficar ligado para essa coleta. O endpoint usa segredo próprio, valida o perfil e registra cada tentativa. O painel mostra a data real da medição, atraso e falhas; atualizar a página apenas relê os dados salvos.

Os lotes são gravados em uma transação: falha não altera a última coleta válida. Comparações exigem dois períodos completos da mesma fonte. Alcance diário não é somado como pessoas únicas. Seguidores são uma contagem na data da consulta. `profile_links_taps` mede contatos do perfil, não o link da bio; visitas ao perfil e cliques da bio ficam indisponíveis quando não retornados. Dados ausentes não viram zero. A Meta limita algumas métricas abaixo de 100 seguidores e Stories com poucos espectadores; métricas dos Stories têm disponibilidade limitada, e registros antigos mantêm a data de sua consulta. Polling pode perder Stories removidos entre consultas.

Documentação: [Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login), [Insights da conta](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights), [Insights de mídias](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights), [agendamento Supabase](https://supabase.com/docs/guides/functions/schedule-functions).

Verificações locais: 27 testes de regras/renderização e 38 verificações isoladas de transação, RLS, configuração privada e controles de agendamento aprovadas. Os testes do agendamento emulam somente suas interfaces; não fazem chamadas de rede nem comprovam autorização ou coleta real da Meta. `pg_cron`/`pg_net` e os privilégios das funções privadas são verificados no projeto hospedado. Nenhum frontend foi publicado e nenhum código foi enviado ao GitHub nesta etapa.

A coleta não recupera visitas anteriores à instalação. Recusas de consentimento e bloqueadores reduzem os dados medidos. Métricas indisponíveis permanecem nulas e dias futuros não aparecem como zero.

## WhatsApp comum

O clique pode ser medido automaticamente. O site não consegue verificar o botão “Enviar” dentro do aplicativo. Vocês conferem a mensagem recebida e registram a referência, o telefone e a data no painel. O telefone é usado somente para gerar um identificador protegido; não fica salvo na lista.

O relatório automático precisa de um remetente oficial habilitado, destinatário autorizado e dois modelos com cabeçalho de imagem aprovados. Essa integração de envio pode usar outro número; o número que recebe clientes pode continuar no aplicativo comum. Até configurar o remetente, baixar as duas imagens é o caminho disponível.

## Configuração e documentação

- [Acesso e servidor](docs/team-access.md)
- [Contagem do WhatsApp](docs/whatsapp-measurement.md)
- [.env.example](.env.example): somente URL e chave pública usam `VITE_`.
- [Cron seguro](supabase/schedules/minute-cron.sql.example)
- O banco anterior preserva suas migrações. O novo banco inclui perfis/clientes, integridade da coleta, configuração privada e agendamento do Instagram; o agendamento só é ativado após coleta válida.

As senhas fornecidas não são incluídas nos arquivos, no frontend ou nos exemplos de configuração. Novas contas e trocas de senha devem usar a administração do serviço de autenticação.

## Melhorias sugeridas

Registrar tempo de resposta, valor do orçamento e receita efetivamente fechada por pacote em uma etapa posterior. Manter cliques, pessoas e negócios como medidas diferentes; uma correlação semanal não comprova que uma mudança causou o resultado.
