# Identidade visual — revisão TunaStream

## Direção

Referências geradas antes da implementação: `reference-gamer.png` (1036 × 1518) e `reference-instagram.png` (1468 × 1071). Os prompts usados estão em `gamer-concept-prompt.txt` e `instagram-concept-prompt.txt`.

O site existente forneceu a direção: fundo #080809, roxo principal #7227dc, Evil Empire nos títulos e Poppins na interface. Acentos mais claros servem ao contraste. Componentes React continuam usando texto selecionável e botões reais; o conceito não é uma imagem usada como interface.

## Conferência visual

| Ponto | Implementação conferida | Diferença intencional |
| --- | --- | --- |
| Hierarquia | Títulos Evil Empire, números claros, texto Poppins | Valores usam Poppins para leitura de métricas |
| Identidade | Preto/roxo, brilho, linhas de circuito e cantos angulares | Efeitos moderados para não competir com os dados |
| Abertura | Foto original, chamada e legenda; ambos os rostos visíveis | Sem recorte gerado ou alteração de aparência |
| Estrutura | Barra lateral, quatro métricas, mapa/funil, série/sugestões e tabela | Mapa e detalhes se reorganizam em telas intermediárias |
| Mapa | 27 estados clicáveis, ranking, seletor e destaque selecionado | Malha real do IBGE substitui contorno aproximado do conceito |
| Funil | Visita, pacote, clique e contatos atribuídos ao site | Rótulos explicam atribuição e não confundem clique com mensagem |
| Instagram | Abas, ordenação, miniaturas, prévia e ação externa | Imagens do próprio portfólio substituem miniaturas inventadas pelo modelo |
| Métricas | Exemplo coerente: 1.248 visitas, 28 contatos e 19 pedidos | Tabela e série mantêm totais do conjunto de exemplos; valores inconsistentes do conceito não foram copiados |
| Marca | Nome em tipografia, sem símbolo novo | Logo de golfinho e ilustração lateral da referência do Instagram omitidos |
| Idioma | Todas as ações e instruções em português | Terminologia técnica permanece somente onde ajuda a entender uma conexão |
| Celular | Menu recolhível, foto inteira na largura e cards empilhados | Layout adapta a composição, não reduz a tela desktop como uma imagem |

Faixa de exemplos fica acima da abertura para permanecer visível em todas as páginas. A prévia não afirma que contas estão conectadas.

## Cópia e estados

- “Contatos recebidos” = pessoas distintas que escreveram no período.
- “Pedidos de orçamento” = confirmação por etapa, com histórico preservado.
- “Abrir perfil” em conteúdo de demonstração; “Abrir publicação” somente com permalink individual válido da API.
- Story expirado: mensagem explícita, prévia desativada e sem link apresentado como ativo.
- Métricas reais ausentes: “Não disponível”; nunca retorno automático aos exemplos.
- Login configurado: sem acesso aberto ao demo; associação de equipe exigida.
- Fontes mostram horário de coleta quando disponível. Atualização do banco não significa que todas as APIs atualizaram naquele instante.
- Movimento reduzido é respeitado. Mapa opera por teclado e também por seletor.

As capturas finais foram inspecionadas visualmente nos tamanhos desktop, celular e nas dimensões de viewport das duas referências.
