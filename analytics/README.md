# TunaStream — painel de métricas

Programa em português brasileiro, com identidade gamer da TunaStream, foto original, mapa dos 27 estados e versões para celular e computador.

## Implementado

- Login por usuário e senha: **Matheus P** e **Adriana S**, na mesma equipe.
- Banco online com regras por equipe, contas individuais e senhas protegidas pelo Supabase Auth.
- Coletor do site com consentimento, sessões, visitantes, cliques, tempo ativo, seções, rolagem, navegador, sistema e Web Vitals.
- Referência única nos botões do WhatsApp e confirmação manual de mensagem recebida para continuar usando o WhatsApp comum.
- Histórico compartilhado de pedidos, orçamentos enviados, fechamento e perda.
- Conector oficial do Instagram, com Feed, Reels, Stories, miniaturas e links reais quando a conta estiver autorizada.
- Duas imagens PNG separadas: site e Instagram. Prévia e download no painel.
- Envio oficial das duas imagens com agenda, deduplicação, tentativas limitadas e confirmação de entrega por webhook.
- Mapa e localidades por Google Analytics quando configurado; ausência de dados não vira localização inventada.
- Semana em andamento e duas semanas completas, sem comparação de totais parciais com semana completa.

## Estado da ativação

O painel está publicado em **https://tunastream-ofc.lovable.app/painel**. Os dois usuários foram validados por login real em desktop e celular. As sete migrações foram aplicadas no banco do projeto **Tuna Stream Central**. O agendador de minuto está ativo e seus pedidos retornaram HTTP200 em produção. A coleta do site já gravou visitas reais.

O Lovable adaptou os seis endpoints para rotas TanStack em `/api/public/tuna-<nome>`; a plataforma não aceita novas funções Supabase. Os originais Deno ficam nesta pasta como alternativa de hospedagem. Os arquivos publicados são preservados no projeto Lovable, com o fonte do painel em `analytics/`.

Instagram, Google Analytics e envio automático de imagens dependem das credenciais e permissões reais dos provedores. Nenhuma mensagem recebida ou entrega de relatório é simulada como produção. A geração das PNGs no navegador funciona. O gerador puro JavaScript do servidor foi validado localmente, mas sua aplicação no Lovable ficou bloqueada por créditos esgotados: o servidor publicado ainda possui um stub e o envio automático não funciona, mesmo se somente as credenciais forem adicionadas. Também está pendente um ajuste para preservar a origem de tráfego através do iframe; interpretar os canais como provisórios até aplicá-lo. Os arquivos em `design/relatorio-*-exemplo.png` são demonstrações identificadas.

## Executar localmente

`npm install`, depois `npm run dev`. Prévia em http://127.0.0.1:4180/.

Sem configuração, o desenvolvimento permite visualizar exemplos. Produção deve usar `VITE_REQUIRE_AUTH=true`; sem conexão válida mostra a tela protegida de configuração e não libera a demonstração.

`npm test` verifica regras e cálculos. `npm run build` gera o painel; `npm run build:tracker` gera o coletor em `../assets/tuna-analytics.js`.

Para publicar em `/painel/`, use `VITE_BASE_PATH=/painel/`. O projeto Lovable usa um wrapper TanStack e iframe para o site público; preservar essa navegação e servir o painel em uma rota própria.

## Atualização online

Ambos acessam o mesmo banco por celular ou computador. O servidor consolida o site aproximadamente a cada minuto; o navegador acompanha por Realtime e consulta a cada 60 segundos como complemento. O Instagram é consultado a cada quatro horas e também depende do processamento da Meta. A confirmação manual depende do registro feito por vocês.

A coleta não recupera visitas anteriores à instalação. Recusas de consentimento e bloqueadores reduzem os dados medidos. Métricas indisponíveis permanecem nulas e dias futuros não aparecem como zero.

## WhatsApp comum

O clique pode ser medido automaticamente. O site não consegue verificar o botão “Enviar” dentro do aplicativo. Vocês conferem a mensagem recebida e registram a referência, o telefone e a data no painel. O telefone é usado somente para gerar um identificador protegido; não fica salvo na lista.

O relatório automático precisa de um remetente oficial habilitado, destinatário autorizado e dois modelos com cabeçalho de imagem aprovados. Essa integração de envio pode usar outro número; o número que recebe clientes pode continuar no aplicativo comum. Até configurar o remetente, baixar as duas imagens é o caminho disponível.

## Configuração e documentação

- [Acesso e servidor](docs/team-access.md)
- [Contagem do WhatsApp](docs/whatsapp-measurement.md)
- [.env.example](.env.example): somente URL e chave pública usam `VITE_`.
- [Cron seguro](supabase/schedules/minute-cron.sql.example)
- Migrações em `supabase/migrations/`, já aplicadas no banco atual: não reaplicar manualmente como instalação nova.

As senhas fornecidas não são incluídas nos arquivos, no frontend ou nos exemplos de configuração. Novas contas e trocas de senha devem usar a administração do serviço de autenticação.

## Melhorias sugeridas

Registrar tempo de resposta, valor do orçamento e receita efetivamente fechada por pacote em uma etapa posterior. Manter cliques, pessoas e negócios como medidas diferentes; uma correlação semanal não comprova que uma mudança causou o resultado.
