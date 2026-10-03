# Implementação — verificações

## Código local

- Build Vite e coletor concluídos.
- 21 testes unitários aprovados.
- Deno verificou os tipos dos seis endpoints originais.
- 31 verificações de navegador isolado aprovadas: sete páginas em desktop e celular, exportação das duas PNGs 1080×2160, login por usuário, erro de credenciais, registro manual e envio oficial bloqueado sem configuração.
- Relatórios de exemplo renderizados com o mesmo WASM do servidor e inspecionados visualmente. São identificados como demonstração.

## Banco real

17 verificações aprovadas em uma transação revertida:

- Matheus P e Adriana S consultam o snapshot autorizado e apenas sua própria associação.
- As duas contas não podem escrever métricas, ler aliases privados ou executar RPCs confiáveis.
- Anônimos e usuários externos não podem acessar os dados.
- Mensagens e contatos repetidos não duplicam oportunidades.
- Referências desconhecidas e expiradas não são atribuídas.
- Mudanças de etapa preservam os marcos de pedido, envio e fechamento.
- Uma referência compartilhada por contatos distintos invalida a atribuição.

Nenhum contato fictício dos testes foi persistido. Nenhuma mensagem de WhatsApp foi enviada.

## Hospedagem

O Lovable adaptou os endpoints para rotas do servidor TanStack, porque o ambiente não permite criar funções Edge Supabase. Os arquivos originais ficam disponíveis como alternativa Deno. O preview exige autenticação da plataforma e retornou HTTP 401 ao navegador externo.

14 verificações passaram no endereço publicado: os dois nicks entraram por suas senhas reais, nas telas de desktop1440px e celular390px; ambos consultaram snapshots protegidos, sem fallback de demonstração. Requisições anônimas foram negadas e uma referência desconhecida foi recusada sem gravar contato.

O login também foi verificado diretamente pelo password grant real do Supabase, seguido de consulta RLS: os dois usuários receberam role authenticated e somente os três snapshots da equipe. As sessões desse teste direto foram encerradas apenas localmente.

O cron está ativo em `* * * * *`; três respostas HTTP200 consecutivas confirmaram execução em produção. Os snapshots foram atualizados a cada minuto. A fonte website foi marcada ready e as visitas reais das verificações foram coletadas; os períodos anteriores à instalação mantiveram visits=null. Não há contatos fictícios persistidos.

Nos botões, a referência registrada foi conferida com métricas recusadas e sem enviar mensagem. O endpoint tem fallback quando a reserva não responde em1,8s, de modo que nem todo clique gera uma referência. A suíte de site não foi concluída integralmente por atraso de resposta e comportamento do popup; isso não é apresentado como teste aprovado.

O gerador puro JavaScript local produz duas PNGs1080×2160, com descompressão verificada e inspeção visual. Essa correção e o ajuste de origem no iframe estão salvos, porém não foram aplicados ao Lovable por créditos esgotados. O remetente de WhatsApp, Instagram e geografiaGA4 continuam sem credenciais.
