# Validação da revisão local

Revisão preparada no repositório, sem publicação ou alterações de produção.

- npm test: 21 testes aprovados; regras de agregação, valores ausentes, referências, assinatura Meta, datas e duas PNGs válidas.
- npm run build: compilação do frontend aprovada.
- npm run build:server: oito endpoints Node compilados.
- validate-revision.mjs: 38 verificações em 1440 e 390 px. Capa sem texto, fotos originais, tipos de gráficos, canais, quadro de vendas, troca de etapa e pacote personalizado, duas PNGs baixadas e link privado de confirmação. Sem erros de página e sem rolagem horizontal da página.
- validate-revision-db.mjs: 28 verificações em PostgreSQL isolado em memória. Nenhuma alteração no banco hospedado. Confirmações idempotentes, referências desconhecidas/expiradas, membro externo, enriquecimento com telefone sem duplicação, histórico, pacote de origem preservado, tokens vinculados de uso único e acesso negado aos dados privados.
- Host Node local: /painel/ respondeu HTTP 200; arquivo de associação privada retornou HTTP 404. Host extra encerrado após verificação; prévia Vite em 4183 permanece disponível.
- Fotos de perfil e capa visualmente inspecionadas em computador/celular. Arquivos originais preservados; enquadramento por CSS.
- Relatórios rasterizados localmente: site 151.336 bytes e Instagram 156.324 bytes, 1080×2160, aproximadamente 298 ms no conjunto.

Limites: OAuth real, entrega de e-mail, storage hospedado e integração dos endpoints no novo projeto Lovable ainda precisam de configuração e validação após aprovação. A prévia usa exemplos declarados; não mostra dados reais do Instagram. O cron de produção não foi modificado.
