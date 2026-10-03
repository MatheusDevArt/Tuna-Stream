# Geolocalização brasileira aproximada

Fonte: [DB-IP City Lite, outubro de 2026](https://db-ip.com/db/download/ip-to-city-lite).
Licença: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
Este projeto inclui dados derivados de DB-IP.com. O recorte mantém somente faixas brasileiras com estado identificado e a cidade aproximada, sem coordenadas precisas. A base gratuita tem precisão e cobertura reduzidas.

CSV original: https://download.db-ip.com/free/dbip-city-lite-2026-10.csv.gz
SHA1 do CSV descomprimido: 2e5fecf1cc24d2c2379d5bd87d669ae346150c06, conferido contra o fornecedor.

Para atualizar: executar `node scripts/build-br-geography.mjs AAAA-MM` a partir de analytics, conferir a nova versão e publicar o mesmo site com o arquivo gerado. Atualizar também a data indicada no painel. Não executar na rotina de coleta: as consultas dos visitantes usam a cópia dentro do servidor, sem enviar IP ao fornecedor. Não guardar os endereços dos visitantes na base.
