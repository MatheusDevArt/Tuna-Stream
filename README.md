# Tuna Stream

Site de apresentação dos serviços da Tuna Stream. O projeto é uma página estática em HTML, CSS e JavaScript, com imagens e vídeos em `assets/`.

## Executar localmente

Com Node.js instalado, rode na raiz do projeto:

```sh
node .preview/server.cjs
```

Abra `http://127.0.0.1:4173/` no navegador. Não há etapa de instalação ou compilação.

## Estrutura

- `index.html`: conteúdo e estrutura da página.
- `assets/site-refinement.css`: estilos complementares.
- `assets/*.js`: interações, animações, pacotes e reprodução sem áudio.
- `assets/portfolio.json`: metadados dos trabalhos exibidos.
- `assets/Trabalhos/`: imagens e vídeos do portfólio.
- `design/`: referências e registro de validação visual.

Os preços, benefícios e regras dos pacotes ficam em `assets/packages.js`.

A integração para Lovable está documentada em `lovable/README.md`. O backup anterior à revisão fica em `design/checkpoint-2026-10-01/`, associado ao commit `edaf6de4674c7f6060e4e72d28f1158790c35125`.
