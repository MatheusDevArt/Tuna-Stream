# Contatos do site pelo WhatsApp comum

| Medida | Como é registrada |
| --- | --- |
| Clique | Evento do botão após consentimento de métricas |
| Mensagem recebida do site | Registro pela equipe após conferir a referência na mensagem |
| Pedido de orçamento | Etapa confirmada pela equipe |
| Enviado ou fechado | Etapa, preservando o pedido anterior |

O site não observa o botão “Enviar” dentro do WhatsApp. Sem API oficial de recebimento, a confirmação é manual. O número de atendimento continua no aplicativo comum.

## Fluxo implementado

1. O botão solicita uma referência criptograficamente aleatória de 128 bits, registrada no servidor e válida por sete dias. Formato: `TS-LIVE-<32 caracteres hexadecimais>`.
2. O site adiciona a referência à mensagem sugerida. Não envia texto de formulários ao coletor.
3. Após receber a mensagem, vocês registram código, telefone e data real do recebimento no painel. Podem confirmar de uma vez o pedido de orçamento.
4. O servidor verifica a equipe e a referência; a mensagem precisa estar dentro da validade do código. O registro pode ser feito até 30 dias depois do recebimento.
5. O telefone gera um HMAC com segredo do servidor. Só o identificador protegido fica no banco; não se guarda telefone nem mensagem completa.
6. Repetir a mesma referência e contato não duplica o registro. Uma referência usada por pessoas diferentes se torna ambígua e sai da atribuição.
7. As duas contas compartilham o histórico. Avançar, voltar ou perder uma oportunidade não apaga os marcos de orçamento enviado e fechamento.

Contatos são pessoas distintas com recebimento confirmado no período. Orçamentos são contatos das oportunidades recebidas naquele período que possuem um pedido confirmado no histórico. Uma pessoa pode aparecer em semanas diferentes; a métrica não significa “cliente novo”.

Mensagens sem referência, com referência apagada, expirada ou de outra origem não entram nos totais do site. Se a pessoa abriu o WhatsApp e desistiu, permanece somente o clique. Cliques sem consentimento opcional não entram nas métricas de navegação, mas o botão continua funcionando com referência de atendimento.

## Limites da atribuição

O cliente pode conversar em outra semana ou apagar o código. Código compartilhado não comprova uma visita individual; o sistema exclui casos identificados de ambiguidade. A razão entre pedidos e visitas do mesmo período é um indicador operacional, não uma conversão de coorte com as mesmas pessoas.

As referências são de alta entropia para impedir adivinhação fácil. Ainda dependem da conferência honesta feita pela equipe. Não há leitura oculta do WhatsApp Web nem automação do aplicativo comum.

## Duas imagens

O painel gera uma PNG do site e outra do Instagram, com prévia e download. Isso funciona sem API de WhatsApp.

O envio automático semanal requer um **remetente oficial** separado ou autorizado, destinatário que aceitou receber os relatórios e dois modelos aprovados:

- Cabeçalho: IMAGE.
- Idioma: pt_BR.
- Corpo: um parâmetro para o período.
- Modelo do site e modelo do Instagram, configurados em segredos.
- Opcional: botão de URL estática com o endereço HTTPS do painel.

A agenda padrão é segunda-feira 09:00 em Brasília. A ativação deve ocorrer depois de configurar e conferir uma entrega real. “Enviado” significa aceito pela Meta; “Entregue” e “Lido” dependem do webhook. Resultados incertos não são reenviados automaticamente. Mensagens oficiais podem ter cobrança do provedor; nenhuma contratação foi feita.

## API de recebimento opcional

O endpoint `tuna-webhook` também suporta uma futura conexão oficial de recebimento, com assinatura HMAC, número autorizado, deduplicação de IDs e referências registradas. Enquanto o número usa o aplicativo comum, deixar `WHATSAPP_RECEIVING_PHONE_NUMBER_ID` vazio.

Um remetente de relatórios não fornece eventos das conversas do número comum. Confirmar uma entrega de relatório nunca aumenta os contatos comerciais.

[Documentação oficial da Cloud API](https://www.postman.com/meta/whatsapp-business-platform/overview).
