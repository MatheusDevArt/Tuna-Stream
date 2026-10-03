# Validação da primeira etapa — 02/10/2026

A referência usada para a implementação está em [reference.png](reference.png), gerada com a ferramenta integrada image_gen. Seu prompt completo está em [concept-prompt.txt](concept-prompt.txt).

## Método

O navegador integrado (IAB) encerrou o processo ao iniciar. Por isso, a inspeção funcional foi feita com Playwright em uma sessão isolada, sem usar o perfil do navegador do usuário.

Viewport desktop igual à referência: 1448 × 1086. Celular: 390 × 844. As imagens desktop.png e mobile.png são capturas integrais da página, por isso sua altura pode exceder a viewport. Ambas foram abertas com view_image junto à referência para comparação visual.

## Comparação visual

| Ponto | Evidência da referência | Resultado conferido |
|---|---|---|
| Composição | Barra lateral, quatro indicadores e duas colunas de conteúdo | Estrutura preservada no desktop; menu recolhível e painéis empilhados no celular |
| Tipografia | Título dominante, números em destaque, rótulos compactos | Tipografia do desktop aumentada após a primeira captura; tamanhos específicos para celular |
| Cores | Carvão, roxo, verde de crescimento e rosa do Instagram | Paleta aplicada por tokens; bordas e superfícies consistentes |
| Ícones | WhatsApp com telefone, relatório com gráfico, aviso circular | Ícones ajustados no passe final; sem imagens usadas no lugar dos controles |
| Conteúdo | Funil, gráfico semanal, tabela de pacotes e três sugestões | Todos presentes; valores e percentuais calculados dos mesmos dados |
| Espaçamento | Coluna de gráfico e tabela larga, funil e sugestões estreitos | Grade e ritmo preservados; ausência de transbordamento horizontal em cinco telas |
| Comportamento | Período e botão de relatório | Controle de semana funcional; prévia, cópia e arquivo com o mesmo conteúdo |

A implementação foi conferida visualmente contra a referência, com os desvios abaixo documentados. Não houve corte de conteúdo principal, menu cobrindo o estado final da tela móvel ou erro JavaScript não tratado na inspeção final.

## Textos e desvios intencionais

- “Analytics” foi traduzido para “Análises”.
- “Novos seguidores” foi ajustado para “Saldo de seguidores”: +47 representa ganhos menos perdas, enquanto a página Instagram mostra ambos.
- Crescimento de 42 para 47 é +11,9%; a imagem arredondava para +12,0%.
- Série diária e eixo do gráfico foram ajustados para totalizar as 1.248 visitas.
- A faixa de demonstração contém um link funcional para Integrações.
- Rodapé mostra o estado real de demonstração, sem data/hora fictícias.
- Valores do gráfico podem ser abertos em tabela para acessibilidade.
- Sugestões foram encurtadas e incluem os números que motivam cada hipótese.
- O aviso sobre intenção de contato foi acrescentado abaixo dos painéis.

Os textos principais foram comparados: título, subtítulo, período, botão de relatório, faixa de demonstração, indicadores, títulos dos painéis e linhas do funil. As diferenças são as registradas acima.

## Validação funcional

13 verificações no navegador: demonstração explícita; filtro; cópia; download; Escape; Site; Instagram; preferência local; guias; ausência de transbordamento no celular; navegação móvel; diálogo móvel; ausência de erros JavaScript.

Quatro testes de cálculo: semana completa de segunda a domingo; base anterior zero/ausente; sugestões com evidência; consistência de totais diários, pacotes e seguidores.

A cópia pela área de transferência do Windows usa CRLF; a comparação normaliza apenas essa quebra de linha. O texto baixado foi comparado diretamente com a prévia.

## Limites desta etapa

Apenas demonstração local. Não há coleta real, autenticação, credenciais conectadas, tarefa agendada no servidor ou entrega de mensagem. A preferência de horário é local e não ativa o agendamento.

A aprovação do usuário sobre esta primeira versão ainda é necessária para passar à próxima etapa, conforme solicitado no anexo.
