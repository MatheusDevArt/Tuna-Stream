# Relatórios semanais por e-mail

Destinatários autorizados: henriquestreaming2022@gmail.com e adriana_lemos90@hotmail.com.
Segunda-feira, 08:00, America/Sao_Paulo. Enviar um e-mail individual para cada destinatário, com duas imagens PNG incorporadas no corpo: site e Instagram.

## Fontes e acesso

O trabalho na nuvem utiliza os conectores Supabase e Gmail autorizados pelo proprietário. Não depende de navegador, computador ligado ou credenciais guardadas no código.
Banco: fundfokaxkmgvdrpwyot. Equipe: ed882f67-f995-4df9-bfe0-389e200dc79e. Filtrar toda leitura e escrita por essa equipe.
Use a última semana completa, de segunda a domingo, calculada em Brasília. Consulte analytics_snapshots por team_id, period_start e period_end exatos. Nunca substitua por outra semana, dados de exemplo ou outra conta Instagram.

## Execução

1. Confira email_report_deliveries para kind='weekly' e a semana correta. Se sent, sending ou uncertain, não repita. Um registro sending exige conferência no Gmail antes de qualquer novo envio.
2. Reserve atomicamente a semana com INSERT ... ON CONFLICT DO NOTHING RETURNING id, status='preparing'. Uma tentativa sem reserva não envia.
3. Reabra o mesmo Site com Sites tools e o fluxo oficial de fonte. O código deste arquivo e scripts/export-report-images.mjs fica no repositório vinculado, não no computador do autor. Instale dependências pelo instalador oficial. Não modifique nem publique o Site durante a rotina.
4. Grave o snapshot autorizado em arquivo temporário: period {start,end,label}, current=current_metrics, previous=previous_metrics, demo=false. Execute node scripts/export-report-images.mjs <snapshot.json> <pasta-temporaria>.
5. Confira as duas imagens. Nunca transforme valores nulos em zero. Informe dados parciais, fonte e horário real da consulta. Se o snapshot faltar, não invente um relatório: marque failed e avise o proprietário.
6. Marque sending ANTES de chamar Gmail. Use recipient_deliveries para registrar separadamente cada destinatário como sending, sent ou uncertain. Não reenvie para um destinatário já sent; uma resposta ambígua precisa de conferência no Gmail antes de repetir. Envie dois e-mails pelo conector Gmail, um para cada pessoa. Matheus: henriquestreaming2022@gmail.com; Adriana: adriana_lemos90@hotmail.com. Assunto: TunaStream · Relatório semanal · DD/MM a DD/MM.
7. O único texto visível no corpo será exatamente "Seu relatório semanal Matheus de DD/MM/AAAA até DD/MM/AAAA" ou "Seu relatório semanal Adriana de DD/MM/AAAA até DD/MM/AAAA", seguido das imagens do site e Instagram, nessa ordem. Sem assinatura, explicações ou outras frases. Use MIME multipart/related, text/html com parágrafo escapado e duas tags img src="cid:tunastream-site" e src="cid:tunastream-instagram". Cada image/png terá Content-ID correspondente e Content-Disposition: inline; Use a árvore MIME no argumento payload do Gmail, não um arquivo MIME inteiro dentro de body. Execute node scripts/prepare-report-email.mjs <snapshot.json> <pasta-das-imagens> <arquivo-temporario.json> para preparar os dois argumentos completos de gmail_send_email. Somente os bytes de cada imagem são base64url no respectivo body.base64_url_content. Não use URLs públicas para as imagens privadas.
8. Gmail retornando id confirma aceite pelo provedor. Grave esse id no objeto recipient_deliveries associado ao endereço correto. Depois de ambos enviados, grave status='sent', provider_message_id=último id, updated_at=now(). Isso não confirma entrega ou leitura. Leia a mesma linha de volta. Se a resposta for ambígua, marque uncertain e não reenvie automaticamente. Se o primeiro e-mail foi enviado e o segundo falhou, preserve o primeiro como sent e identifique a falha no segundo; não comece os dois envios novamente.

O teste de instalação é kind='test' e não bloqueia o envio semanal. O primeiro teste foi aceito pelo Gmail em 03/10/2026, id 1a1005fe962a4e2b. Primeiro envio semanal previsto: 05/10/2026 às 08:00. A criação da programação não comprova que uma execução futura já ocorreu.

