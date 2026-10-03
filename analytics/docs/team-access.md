# Acesso privado e implantação

## Contas existentes

**Matheus P** e **Adriana S** estão cadastrados no Supabase Auth e associados à equipe TunaStream. Os aliases normalizam espaços e letras maiúsculas. O e-mail interno aleatório é apenas um identificador do provedor e nunca é exibido como campo de login.

O endpoint `tuna-login` troca usuário e senha por uma sessão do Supabase, com limites de tentativas por origem e usuário. O navegador não contém as senhas e as permissões são verificadas no banco e nos endpoints. Desativar o cadastro público no provedor. Não há recuperação por e-mail na interface; redefinir pelo administrador autorizado.

Equipe atual: `8764e489-d6d6-4378-a646-4d93ced7a75c`.

## Servidor

Os originais Deno ficam em `supabase/functions`. No projeto Lovable publicado, a implementação adaptada fica em `src/lib/tuna/*.server.ts` e `src/routes/api/public/tuna-*.ts`. A configuração desativa a verificação automática da plataforma para aceitar as chaves públicas modernas; cada endpoint valida sua própria autorização:

| Endpoint | Autorização |
| --- | --- |
| tuna-login | Origem permitida, limite de tentativas e senha real |
| tuna-collect | Origem permitida, limite, eventos permitidos e validação de payload |
| tuna-team | Sessão válida e associação real na equipe |
| tuna-report | Sessão válida e associação real na equipe |
| tuna-webhook | Assinatura HMAC da Meta e número autorizado |
| tuna-sync | Segredo exclusivo do agendador |

Aplicar `config.toml` na implantação. Não publicar os endpoints confiando somente em uma chave pública nem liberar escrita geral para o navegador.

Supabase injeta URL, anon e service role no servidor. Configurar os segredos em `.env.example` no gerenciador de segredos do projeto. Gerar os três segredos aleatórios uma vez e preservar o segredo de contatos, pois sua mudança altera a deduplicação.

## Publicação

1. As sete migrações já foram aplicadas no projeto atual. Preservar tabelas, usuários e histórico.
2. Publicar os seis endpoints e configurar origens exatas HTTPS.
3. Configurar URL e chave pública no build do painel; `VITE_REQUIRE_AUTH=true`.
4. Servir o painel em `/painel/`, com seu bundle e assets. Preservar o wrapper e o visual do site público.
5. Configurar `assets/tuna-analytics-config.js` do site com a URL de `tuna-collect`; endpoint vazio desativa a coleta.
6. Instalar o cron de minuto, guardando URL e segredo no Vault.
7. Verificar login das duas contas, isolamento da equipe, consentimento, evento real e atualização do painel.

## Instagram e geografia

Adicionar credenciais oficiais no servidor. O token deve autorizar a conta `tuna.stream`; outro perfil é rejeitado. Usar uma versão da API válida para o aplicativo Meta, sem adivinhar a versão atual. Renovar tokens conforme o fluxo oficial.

Para o mapa, autorizar uma conta de serviço com leitura da propriedade GA4 e fornecer o JSON somente no servidor. O ID de medição público vai no config do site. O Google é carregado apenas após consentimento. Não preencher estados desconhecidos nem redistribuir pessoas para produzir um mapa.

## Agendamento

Site: consolidação por cron de minuto. Instagram: consulta a cada quatro horas. Relatórios: segunda-feira 09:00, Brasília, configurável. A agenda fica salva na equipe, mas o envio permanece desativado enquanto o remetente não estiver pronto.

Retenção por cron: eventos e sessões 90 dias; oportunidades e recibos 365 dias; referências 372 dias para preservar relações; visitantes 120 dias no servidor e identificador local 30 dias. Referências valem sete dias para novas mensagens. Jobs abandonados são tratados sem reenviar mensagens de resultado incerto.

## Verificação de segurança

Requisições anônimas e usuários sem associação não podem consultar dados. As duas contas devem ver o mesmo snapshot. O navegador não pode adicionar membros, escrever métricas ou executar RPCs administrativas.

Testes de banco devem usar transação com rollback e nenhuma informação fictícia persistida. Uma simulação de frontend não comprova regras do banco; uma senha armazenada com hash não comprova login real. Validar as duas etapas separadamente antes de considerar a implantação concluída.

Documentação: [Auth](https://supabase.com/docs/guides/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [cron](https://supabase.com/docs/guides/functions/schedule-functions).
