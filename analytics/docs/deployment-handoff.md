# Implantação no projeto existente

**Registro histórico do pacote inicial.** A implantação foi concluída e publicada em https://tunastream-ofc.lovable.app/painel. O banco atual contém sete migrações; as seis funções foram adaptadas para rotas TanStack em `/api/public/tuna-<nome>`, pois a plataforma não aceita novas funções Supabase. O cron de minuto está ativo. Não seguir abaixo como uma reinstalação. Para o estado atual, consultar [README](../README.md) e [correções pendentes](remaining-cloud-patch.md).

Preservar integralmente o site público e suas transições. Publicar este painel em uma rota própria /painel. A interface e a foto já foram aprovadas; aproveitar o código fornecido sem novo redesenho.

O backend Supabase do projeto já contém todas as seis migrações e a equipe 8764e489-d6d6-4378-a646-4d93ced7a75c. Matheus P e Adriana S já foram criados no Auth e associados à equipe; não recriar nem redefinir suas senhas.

O arquivo compactado contém um app Vite independente em analytics/. Para o wrapper TanStack atual, compilar com VITE_BASE_PATH=/painel/ e VITE_REQUIRE_AUTH=true, usando a URL e a chave pública reais do projeto. Servir os arquivos compilados em public/painel/; criar rota /painel que abre o index do painel por iframe. Nunca enviar a chave service_role ao frontend.

Copiar analytics/supabase/functions para o diretório de funções deste projeto, preservando imports _shared, e publicar as seis funções com verify_jwt=false conforme config.toml. Todos os endpoints verificam sua autorização explicitamente. As seis migrações estão anexadas apenas para registro: não reaplicar como nova instalação.

Gerar e salvar segredos estáveis TUNA_RATE_SECRET, WHATSAPP_CONTACT_HASH_SECRET e TUNA_CRON_SECRET no ambiente do servidor. Configurar TUNA_TEAM_ID e TUNA_ALLOWED_ORIGINS com as origens exatas do site público e preview. Supabase injeta seus segredos de plataforma. Não incluir valores de segredos na resposta, nos logs ou no repositório.

Instalar o cron de minuto por pg_cron + pg_net + Vault (exemplo em supabase/schedules). Se essas extensões não estiverem disponíveis, relatar a limitação e manter coleta sem alegar agendamento ativo. Chamar tuna-sync uma vez com a autorização correta para criar snapshots de dados disponíveis, sem inserir dados fictícios.

No site público estático (public/tuna-stream/), adicionar somente os dois scripts defer de configuração/coleta antes de fechar body e a página privacidade.html. Configurar endpoint HTTPS real de tuna-collect em tuna-analytics-config.js. Preservar o telefone existente, formulários, WhatsApp e scripts de navegação. O tracker compilado já está em website/assets/ neste pacote.

WhatsApp de atendimento é comum: deixar WHATSAPP_RECEIVING_PHONE_NUMBER_ID vazio e usar confirmação manual por referência no painel. Instagram, GA4 e remetente de relatórios ainda não têm credenciais; mantê-los pendentes. As PNGs podem ser baixadas sem remetente. Não criar dados demonstrativos no banco, habilitar cobrança, migrar número ou alegar envio automático ativo.

Desativar cadastro público no provedor Auth. Conferir login por nick, isolamento RLS, tela protegida sem configuração, mobile e consentimento. Publicar primeiro no preview; retornar URL do painel, URL pública de Supabase e caminho dos arquivos de configuração públicos para validação. Não expor tokens administrativos, senhas ou segredos.
