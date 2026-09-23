# Tuna Stream — entrega e validação

Página: `../index.html`. HTML, CSS e JavaScript estão no mesmo arquivo; as mídias e fontes locais ficam em `../assets`. Abra o HTML diretamente ou sirva a pasta com um servidor estático. Nenhuma instalação de dependências é necessária para o site.

## Direção visual

`concept.png` é o estudo gerado com Image Gen nativo: sete seções, linguagem gamer, tipografia condensada, fundos preto/branco/roxo, personagens à direita no hero, retratos alternados, portfólio e ELITE destacado. Não houve etapa de aprovação explícita do conceito pelo usuário; a implementação seguiu o briefing fornecido.

Brief do conceito: criar sete painéis coordenados para Tuna Stream usando #6231A7, preto e branco; Evil Empire e Poppins; headline original, seções de desempenho, identidade, suporte, portfólio, START/PRO/ELITE e contato; sem preços inventados, cartões arredondados ou blobs. O resultado é apenas referência visual, não uma imagem usada como interface.

## Conferência visual

Inspeção no navegador integrado do Codex e capturas `desktop.png` (viewport configurado em 1440 × 900) e `mobile.png` (390 × 844). Conceito e capturas foram abertos com view_image. Também foi testada a largura de 320 px. O conceito é um painel de várias seções, portanto não existe comparação pixel a pixel com um único viewport nativo.

| Ponto | Resultado / ajuste |
| --- | --- |
| Tipografia | Evil Empire e Poppins carregadas localmente; títulos e texto têm hierarquia própria. |
| Composição | Hero alinhado à esquerda, duas artes à direita, seções editoriais alternadas e portfólio em duas colunas no desktop. |
| Paleta | Roxo #6231A7 nos botões e na seção de suporte; branco puro e preto. Variação clara do roxo em alguns títulos escuros para legibilidade. |
| Assets | Logo, cenário, fotos e artes reais fornecidos; originais preservados e cópias redimensionadas em assets/web. |
| Espaçamento | Sem cartões genéricos arredondados; recortes diagonais, botões retos, seções com altura mínima de viewport. Conteúdo maior pode ultrapassar uma tela. |
| Responsividade | Sem overflow horizontal em 390 e 320 px; corrigido título do portfólio na menor largura e CTAs do hero em 390 px. |
| Correções | Proporção do logo corrigida com height:auto; removida folga de âncora que mostrava uma faixa da seção anterior. |

## Comportamento

- Menu mobile abre, navega e fecha após selecionar uma seção.
- Filtros mostram somente os dois trabalhos do canal escolhido.
- Modal amplia a arte, fecha e devolve o foco ao botão.
- Vídeo real abriu com duração de 10,04 s e reprodução confirmada em 5,80 s; fechamento pausa e remove o player.
- Destinos dos links de WhatsApp conferidos: 5521979978671. Não foram enviadas mensagens.
- Nenhuma imagem quebrada ou erro/warning de console observado; sintaxe JavaScript validada.
- Animações de entrada usam IntersectionObserver; CSS respeita prefers-reduced-motion.

## Texto e diferenças intencionais

Headline e quatro parágrafos obrigatórios preservados. Acima da dobra foram adicionados apenas navegação, CTAs, nomes dos personagens, indicador e orientação de rolagem. O slogan adicional inventado pelo conceito não foi incluído. Não foram adicionadas métricas fictícias.

O conceito foi seguido na hierarquia, ritmo, geometria e cores, com adaptações ao material real. As fotos substituem os retratos ilustrados do conceito, conforme o briefing. Os personagens fornecidos são ilustrações, não renders 3D recortados; aparecem como painéis diagonais. O suporte usa símbolos vetoriais em vez de objetos 3D. O portfólio contém somente esquentadinha e sung, sem as marcas inventadas no conceito. Essas diferenças são intencionais; não se afirma equivalência pixel a pixel.

Benefícios dos pacotes permanecem explicitamente provisórios e não há preços, como solicitado. O site está concluído localmente; não foi publicado em hospedagem.

Fontes: Evil Empire disponível em https://www.cdnfonts.com/evil-empire.font e Poppins distribuída pelo Google Fonts. Arquivos usados armazenados em assets/fonts.

## Revisão solicitada — navegação e abertura

Removidos a borda do cabeçalho, o CTA Vamos conversar e o botão Nossos trabalhos da abertura. Os personagens agora são duas peças do portfólio, incluídas nos filtros e na ampliação. O fundo da abertura ganhou visibilidade. Adicionada navegação lateral de sete segmentos com rótulos acessíveis, links por seção e indicação dinâmica da seção atual. Conferidos desktop e mobile 390 × 844: sem overflow, cabeçalho com borda 0 px, apenas imagem de fundo no hero, dois personagens no portfólio, filtro sung com três trabalhos e indicador ativo em #trabalhos após navegação. As capturas e o conceito anteriores representam a versão inicial. O trecho incompleto “desça a palavra” aguarda esclarecimento; nenhum texto foi deslocado especificamente por esse pedido.

## Revisão — catálogo completo e linguagem gamer

Headline agora: Sua live / no próximo / nível!. Identidade visual tem onze cartões de exemplos com ícones próprios. Contato separa o parágrafo Poppins menor do título de destaque. Detalhes de interface gamer incluem grade sutil, numeração, cantos de moldura, marcadores e rótulo Stream / Create / Play, sem sobrepor personagens ao fundo.

Catálogo conferido visualmente: 14 arquivos originais de Trabalhos, 10 imagens e 4 vídeos, sete por canal. Arquivos originais renomeados de forma descritiva, sem alteração de conteúdo; assets/portfolio.json registra nomes antigos, novos, categorias e prévias. Miniaturas WebP das imagens preservam proporções; as quatro prévias de vídeo são frames dos respectivos vídeos em aproximadamente 1 segundo. Esquentadinha é o padrão; canais nunca aparecem misturados. Filtro adicional por tipo, estado vazio, ampliação e vídeo real. Não existem arquivos de emotes ou painéis entre os uploads atuais, portanto esses serviços aparecem nos exemplos, não como projetos fictícios.

Verificados os filtros combinados (duas telas animadas da esquentadinha e sete itens de sung), os caminhos de todos os originais/miniaturas, a abertura da tela de início corrigida (10,04 segundos, readyState 4), fonte Poppins do contato, ausência de imagens quebradas e overflow em 390 px. Animações independentes com fade-in + slide-up de 26 px, duração 850 ms, easing cubic-bezier(.16,1,.3,1) e stagger de 75 ms, limitado a 225 ms; respeitam reduced-motion e não interceptam a roda de rolagem.

## Revisão — referências, serviços e vídeos em destaque

Analisadas as oito referências de assets/referencias e as duas imagens de layout anexadas. O vídeo de efeitos (13,68 segundos) foi inspecionado em 20 momentos distribuídos por toda a duração via leitura local: fluxo vertical contínuo, entradas escalonadas, deslocamento de imagens e cartões. O vídeo de referência não foi adicionado ao site. O script da skill watch não tinha seus binários disponíveis; a inspeção visual local usou PyAV, sem transcrição nem upload de áudio.

Portfólio: duas colunas no desktop, vídeos grandes à esquerda e imagens à direita; uma coluna de vídeos seguida da grade de imagens no celular. Os quatro vídeos têm autoplay, muted, loop e playsinline, controles nativos, carregamento por visibilidade e pausa ao sair da tela/trocar canal. Reprodução automática confirmada em esquentadinha e sung; os vídeos ocultos estavam pausados. Filtros de canal e tipo mantidos, com redistribuição do espaço ao mostrar só vídeos ou só imagens.

Serviços: cartões substituídos por listas pontilhadas expansíveis com indicadores +/−. Os cinco grupos e quinze itens técnicos fornecidos foram incluídos integralmente, mais E muito mais. Expansão do grupo OBS conferida no navegador. Listas criativas seguem a mesma linguagem.

Hero: faixa inferior inspirada na referência, logo vertical fornecido, quatro benefícios e divisores finos. Corrigida apenas a grafia de Design personalizado. Criado assets/web/gamer-shards.png com Image Gen nativo: fragmentos de vidro obsidiano/metal escuro com iluminação roxa #6231A7, concentrados na direita e cantos, espaço negativo preto e nenhum texto/personagem. Asset inspecionado e aplicado em identidade, suporte e contato. Prompt: high-end esports decorative background, black #080809, obsidian glass shards at far right/bottom, thin purple rim lighting, sparse particles, left 65 percent dark negative space, no text/logo/UI/characters.

Movimento: fade/slide-up escalonado, nitidez gradual, leve escala na entrada dos retratos e parallax suave limitado ao hero/retratos em desktop. Respeita reduced-motion; rolagem nativa suave, sem bloquear controles de scroll. Conferidos hero e serviços no desktop e a faixa sem sobreposição com o CTA em 390 px.

## Revisão — vídeo silencioso, setup gamer e dimensões estáveis

Hero substituído pelo vídeo enviado magnific_cinematic-animation-of-a-_aFgqOyafSh.mp4. Criado assets/web/hero-cinematic-silent.mp4 por remux do stream H.264, sem a faixa AAC original, duração 15,08 s. Poster extraído do próprio vídeo. Loop, autoplay, muted e playsinline; pausa fora da tela e com preferência de movimento reduzido. Reprodução efetiva observada no navegador (currentTime 5,77 s, paused false). Logo vertical fornecida aplicada no cabeçalho e rodapé; nenhuma logo na faixa de benefícios. Poppins no texto de apoio da faixa e Evil Empire somente nas palavras destacadas.

Desempenho reconstruído com arte de setup gamer original, composição assimétrica, grade escura, faixa diagonal roxa e console de cinco abas. Todos os quinze serviços preservados. Painéis têm espaço reservado e navegação por teclado. Alturas verificadas ao selecionar cada uma das cinco abas: desktop seção 1066 px e documento 7358 px; mobile 390 px seção 1273 px e documento 7986 px, sem variação. Identidade visual recebeu composição com personagem e geometria triangular; foto real mantida no crédito. Pacotes passaram para composição escura com destaque roxo no ELITE.

Suporte sem background de vidro (background-image computado none), altura desktop 506 px. Conferidos visualmente hero, serviços, identidade, suporte e pacotes. Sem imagens quebradas e sem overflow horizontal nas larguras móveis 390 e 320 px. Nenhum erro registrado no console durante a revisão. Viewport restaurado.

Novo asset assets/web/performance-setup.webp gerado com Image Gen nativo: cinematic premium esports gaming setup, black and purple lighting, tower PC, monitor with fantasy game scenery, mechanical keyboard, headphones and microphone, futuristic dark room, no people, no lettering, no logos, no glass shards. Arte inspecionada e convertida em WebP. Arquivos originais enviados preservados.

## Revisão — fotos atualizadas e direção por referências

Aplicado plano design/direcao-visual-equipe.md após inspeção das oito referências. Fotos novas de assets/Equipe convertidas em adriana-updated.webp e matheus-updated.webp, usadas em ambos os perfis e contato. PC no fundo de Desempenho com 16% de opacidade; geometria triangular atrás do retrato de Matheus. Arte oficial de Jett integrada à abertura de Trabalhos, com recorte diagonal e máscara. Navegação 17 px, títulos sem quebra forçada fora do main. Suporte reduzido a 335 px desktop com texto Suporte de 15 dias pós-entrega. Âncoras compensam cabeçalho fixo.

Validação no navegador: fotos novas carregadas nos quatro pontos; sem imagens quebradas ou overflow horizontal em 390 px. Altura de Desempenho constante nas cinco abas: 1066 px desktop e 1706 px mobile. Retratos e composição inspecionados visualmente. Viewport restaurado. O arquivo atual encontrado nesta revisão já tinha estrutura, cores e fontes diferentes da versão da revisão anterior; alterações foram aplicadas sobre essa versão, preservando seu estilo.

## Recuperação após reescrita externa — 23/09/2026

Não havia commits Git. Recuperada base em index.html.backup (72.804 bytes), reconhecida pelas fontes locais Evil Empire/Poppins, roxo, sete seções e catálogo por canal. index.html alterado preservado integralmente em design/recovery-20260923-022733/index-alterado-preservado.html. Autoria da reescrita não foi comprovada.

Reaplicados os pedidos recentes: fotos atualizadas da Equipe, PC em fundo discreto, navegação 18 px, títulos sem br forçado, suporte compacto de 15 dias e ambientação Jett. Retornaram os textos dos serviços fornecidos pelo usuário, sem os números e garantias introduzidos pela reescrita. Base original também preservada na pasta de recuperação. Checkpoint restaurado index-restaurado-validado.html com SHA256 em checkpoint.json.

Verificação: todos os caminhos locais de mídia existentes; sem imagens quebradas; vídeo do hero reproduzindo sem som; vídeo de portfólio readyState 4 e tocando ao aparecer; troca de canal isolada; alturas das cinco abas constantes (881 px desktop, 1374 px mobile); sem overflow horizontal em 390 px. Fonte e layout conferidos por screenshots no navegador.

## Revisão — divisões futuristas, sobreposição e pacotes

Cor de destaque unificada em #7227dc, incluindo títulos e botões. E comercial removido dos textos visíveis. Saiba mais colocado 22 px abaixo do CTA no desktop e 18 px no celular, com link para Desempenho. Imagem de Valorant removida da renderização e de URLs CSS. Suporte inclui Tudo isso do conforto da sua casa, Atendimento personalizado e Resolva tudo em um só lugar; mantidos os 15 dias.

Identidade visual ganhou cabeçalho completo, painel de serviços numerado, foto real preservada, geometria angular e amostras reais de borda de webcam e amuleto de Sung. Pacotes têm insígnias SVG originais com um, dois e três níveis, silhueta recortada, medidores decorativos, bordas e órbitas animadas. Benefícios comerciais permanecem provisórios.

Criado assets/ui/sector-circuit.svg: grafismo vetorial próprio com trilhas diagonais, marcações, chevrons e segmentos. Divisões de seção usam máscaras angulares, faixa de circuitos e varredura animada. Cada seção fica sticky no limite inferior do próprio conteúdo, permitindo ler seções maiores que a janela antes de a próxima cobri-la. Marcadores de fluxo independentes corrigem navegação por âncora para camadas sticky. Tamanhos atualizam via ResizeObserver. Rolagem nativa, sem bloqueio da roda. Reduced-motion desativa empilhamento e decoração animada. Vídeos são pausados quando outra seção os cobre.

Servidor local atualizado para servir CSS, SVG e WebP com MIME adequado. Validação real: cobertura observada com hero em top 0 e seção seguinte em top 426 px após 640 px de scroll; navegação para frente e retorno ao início funcionando. Todos os cinco destaques de título retornam rgb(114,39,220). Nenhum E comercial visível e nenhum elemento Valorant. Saiba mais navega para Desempenho. Em 390 px, cinco abas mantiveram altura 1412 px; sem overflow horizontal em 390 e 320 px. Inspecionados identidade, retrato sem legenda coberta, suporte e pacotes em desktop e celular. Nenhum asset local ausente; JavaScript passou node --check.

Checkpoint completo desta revisão em design/checkpoint-futurista-20260923: index.html, site-refinement.css, sector-circuit.svg e hashes SHA256. Para recuperação, os dois últimos arquivos pertencem a assets/site-refinement.css e assets/ui/sector-circuit.svg respectivamente.

## Revisão — identidade em abas, parallax e formulário personalizado

Seção 3 passou a usar fotografia à esquerda e console de abas à direita, como Desempenho. Mantidos os nove tópicos e todas as descrições, comparados com a versão anterior. Removida a amostra de webcam sob a foto e o texto junto ao amuleto. Logo do rodapé removida. Os três tópicos do suporte compartilham tipografia e ficam na mesma linha em desktop: 14 px e mesma coordenada vertical na verificação; empilham no celular.

Parallax de entrada/saída: conteúdo e cenário recebem deslocamentos independentes durante scroll; em uma transição observada, conteúdo -49,99 px e fundo +32,49 px. Intensidade menor no celular e desativação com reduced-motion. Corrigido cálculo para seções menores que a janela. Seção do formulário usa fluxo normal e não desloca os campos durante preenchimento.

Nova seção personalizado entre pacotes e contato, integrada à navegação lateral e à contagem de oito seções. Formulário solicita nome, Configuração/Design/Ambos, múltiplos serviços e informações adicionais. Opções extraídas dos serviços existentes: 15 configuração, 9 design, 24 ambos, verificados no navegador. Correção durante QA de uma tag option malformada. Campos ocultos/fora da categoria são desativados e desmarcados. Nome e categoria obrigatórios; ausência de serviço bloqueia submit e foca o erro. Revisar mensagem mostra exatamente a mensagem preparada. Form GET abre https://wa.me/5521979978671 em nova aba com somente parâmetro text. Nenhuma mensagem de teste enviada.

Verificados composição desktop e mobile 390 px sem overflow ou imagens quebradas; nove abas de design mantêm altura desktop 1066 px. Mensagem com ambos os tipos e informações adicionais conferida visualmente. Teste Node confirmou montagem, trimming e preservação de Unicode, pontuação e quebras após codificação URL. JavaScript passou node --check. Assets locais presentes. Cópia de recuperação em design/checkpoint-formulario-20260923 inclui HTML, CSS, JS do formulário e hashes.


## Revisão — novo main, avanço automático e FAQ (23/09/2026)

Novo vídeo recebido magnific_animate-this-image-as-a-s_bx4sbyd5Y2.mp4 remuxado sem recodificar para assets/web/hero-stream-silent.mp4, removendo a faixa AAC. Saída conferida com somente vídeo H.264, 10,125 segundos; loop, autoplay, muted e poster próprio. Original do usuário preservado.

Seção 3: foto real de Matheus à direita no desktop, console à esquerda. No celular, painel e foto empilham. Molduras das duas seções receberam recortes, cantos, circuitos, varredura e indicadores animados. Nenhuma mudança no texto das seções 2 e 3: comparação automática com checkpoint anterior passou. Troca de aba na seção 2 manteve altura 929 px em viewport 1280x720.

assets/section-motion.js complementa o parallax existente: roda do mouse avança suavemente à seção seguinte ao ultrapassar 28% da transição, depois de liberar a leitura da parte longa da seção. Transição com easing cúbico de 600 a 900 ms, cancelável por rolagem para cima, navegação/teclado, toque ou resize. Painéis com rolagem própria e formulário não acionam o avanço. Preferência por movimento reduzido o desativa. Conferidos no navegador main -> desempenho (scroll final 905 px) e suporte -> trabalhos (3126 px). Em mobile emulado, scroll de 380 px dentro da seção longa de identidade não adiantou a seção.

Revelação em sequência dos campos do formulário, textos e arte; movimento na arte e resposta de foco. Suporte revela cada promessa, indicadores pulsantes. Trabalhos têm entrada de imagem, reflexo no hover e indicador de loop animado. Animações contínuas de decoração pausam fora da seção e quando cobertas; reduced-motion remove animações.

Antiga seção de fechamento substituída por Perguntas e respostas com as sete perguntas e respostas fornecidas, sem alterações. Disclosures nativos acessíveis, primeiro aberto. Navegação lateral ajustada. Formulário personalizado é a última seção, seguido apenas pelo próprio rodapé sem logo. Removidas as duas frases indicadas do seu texto lateral. Opção E muito mais... alterada apenas no formulário para Outros. Contato do menu leva ao formulário; âncora antiga #contato permanece compatível.

Validação: sete perguntas presentes; resposta expandida e lida no navegador; seleção Design + Outros e texto adicional produziu mensagem correta na revisão, destinada ao mesmo https://wa.me/5521979978671. Nenhuma mensagem de teste enviada. Layouts desktop 1280x720 e mobile 390x844 inspecionados, sem overflow horizontal ou imagens quebradas. Vídeo visível do portfólio reproduzindo em loop e mute; vídeos fora da tela pausados. Cor de destaque conferida rgb(114,39,220). Promessas do suporte com 14 px e mesma coordenada Y no desktop. Scripts passaram node --check, todos os assets referenciados encontrados e nenhum erro de console no navegador. Viewport restaurado.

Cópia desta revisão em design/checkpoint-faq-motion-20260923, com caminhos relativos preservados e hashes SHA256; versão anterior em design/checkpoint-antes-faq-20260923.


## Revisão — hover, FAQ e main mobile

Símbolo TS fornecido substitui logo do cabeçalho. Foto conjunta fornecida convertida para WebP sem recorte, preservando proporção, e usada no pacote personalizado. Retratos das seções 2 e 3 ganham elevação de 7px, zoom 1.035 e reflexo no hover, com alternativa de foco e respeito a movimento reduzido. Valores conferidos no navegador para ambas as fotos.

Título FAQ, CTA com classes btn primary, perguntas com grupo nativo details name=service-faq: ao abrir a segunda, a primeira fechou; somente uma aberta no teste. Hover da pergunta confirmou translate 0 -5px e sombra. Respostas permanecem intactas.

Mobile: fotografia de Matheus antes do console (top 311px vs 771px no teste). Main usa fluxo com benefícios próximos ao texto, remove altura mínima excessiva e reenquadra vídeo em 51%, sem zoom elevado. Em 390x650, benefícios terminam em y599 e main tem 650px; em 320x568, benefícios terminam em y558. Sem overflow horizontal. Rosto do gato conferido visualmente nas duas larguras. Viewport restaurado após validação. Checkpoint incremental em design/checkpoint-mobile-faq-20260923; scripts e vídeo permanecem na revisão anterior.


## Revisão — vídeos sem áudio, fundos e hierarquia dos pacotes

Logo reduzida a 48 px desktop e 42 px mobile. Main mobile com duas linhas visuais SUA LIVE NO / PRÓXIMO NÍVEL; desktop preserva três linhas. Conteúdo deslocado para baixo e vídeo 80 px para cima, com máscara de leitura na parte inferior. Conferidos rosto livre, título e benefícios completos em 390x650 (main 650 px, benefícios até 628 px) e 320x568 (main 568 px, benefícios até 546 px), sem overflow horizontal. Viewport restaurado.

FAQ recebeu gamer-shards.png com camada escura de 91–93%. Identidade recebeu a imagem Cyberpunk fornecida, convertida para WebP de 2200px, com camada escura de 90–93%. Ambas inspecionadas no navegador.

Vídeo enviado tela de fim da live.mp4 substituiu o arquivo solicitado esquentadinha-tela-animada-inicio.mp4, cuja versão anterior foi preservada no checkpoint antes-videos. Catálogo e site apontam para cópia canônica esquentadinha-tela-animada-fim.mp4, nome Tela animada — fim da live e poster extraído do vídeo correto. Os quatro vídeos ativos do portfólio foram conferidos com PyAV e contêm somente H.264, sem faixa de áudio. Originais com áudio preservados no checkpoint antes-videos quando aplicável.

Vídeos do catálogo são botões com cursor pointer e ampliação por clique ou teclado. Player ampliado toca em loop, mudo, sem controles nativos; controles próprios apenas para pausar/reproduzir e fechar. Testados abertura de volto já, pausa e abertura do novo vídeo de fim; títulos, imagens e src conferidos, controls=false, muted=true. Nenhum controle de volume ou desmutar exposto.

assets/silent-video.js, carregado antes do corpo, mantém mute padrão, volume zero, controles desativados, Picture-in-Picture/remoto desativados, para vídeos iniciais e inseridos depois. Observa novas mídias e mudanças de src/controls/muted, além de eventos de reprodução/volume. Teste real em .preview/silent-video-check.html: vídeo inserido com controles e volume 1 voltou a muted=true, defaultMuted=true, volume=0, controls=false. Tentativa posterior de reativação resultou nos mesmos valores, pass=true em ambos. Novos arquivos publicados também devem ser preparados sem faixa de áudio, seguindo o procedimento de remux usado nesta revisão.

Pacotes preservam grid, recortes, alturas e animações. START recebe emblema menor e cinza; PRO recebe asas no emblema e superfície roxa intermediária; ELITE recebe coroa, contorno e emblema claros, contraste mais forte, recomendado e CTA claros. Hierarquia inspecionada no desktop. Assets referenciados presentes, quatro botões de ampliação conferidos, scripts passaram node --check e navegador sem erros. Checkpoint com arquivos alterados e vídeos em design/checkpoint-videos-pacotes-20260923.


## Filtros de pacotes e contraste
Fundo cyberpunk da seção 3 escurecido com camada 95,7–97%. Texto acima do título main branco, 12px desktop e 8px mobile. Três botões lado a lado: Configuração, Personalização, Ambos; Configuração é padrão. assets/packages.js contém preços e benefícios independentes para cada uma das nove combinações de categoria e nível, com valores null e listas vazias até o fornecimento dos dados. Renderização mantém START/PRO/ELITE, atualiza rótulo, benefícios, preço e mensagem WhatsApp por categoria. Nenhum preço inventado. Validada troca para Personalização e Ambos, nomes intactos; no mobile 320px, botões na mesma coordenada Y e sem overflow. Benefícios do main terminam em y563,9 no viewport 568px. Script passou node --check. Servidor local retomado em segundo plano. Checkpoint em design/checkpoint-filtros-pacotes-20260923.
