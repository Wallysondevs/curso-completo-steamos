Um Steam Deck com RetroArch, Dolphin e dezenas de ROMs resolve a emulação em si, mas não resolve a pergunta que o próprio jogo faz: "onde foi parar meu jogo de GameCube no meio de trezentos títulos do Steam?". Quando você depende de abrir o EmuDeck, caçar a ROM na lista e lembrar qual emulador roda qual plataforma, a emulação vira uma atividade separada do resto da sua biblioteca. O Steam ROM Manager (SRM) existe para fechar essa fresta: ele transforma cada ROM num atalho com cara de jogo de verdade dentro da própria biblioteca Steam, com capa, banner e ícone — tudo no lugar, tudo lançável com um clique a partir do modo jogo.

:::objetivos
- Entender o problema que o SRM resolve e onde ele se encaixa no EmuDeck
- Distinguir atalho Steam de instalação de jogo
- Conhecer os dois artefatos que o SRM manipula (atalho e arte)
- Compreender o fluxo geral de trabalho em três etapas
- Saber quando o SRM vale a pena e quando é dispensável
:::

## O problema que ninguém percebe até ter

O Steam, no modo jogo, não entende o que é uma ROM. Para ele, existe jogo instalado (com AppID, prefixo Proton, atualização automática) e existe *atalho externo*: um item sem AppID que apenas aponta para um comando. É exatamente nessa segunda categoria que a emulação precisa entrar, porque um jogo de SNES não vem da loja, não tem AppID e não atualiza sozinho — ele é um arquivo `.sfc` num cartão microSD e um binário de emulador que o interpreta.

O problema prático é duplo. Primeiro, criar esse atalho na mão é tedioso: cada plataforma tem centenas de ROMs, cada uma precisa de nome bonito, comando certo e arte. Segundo, o Steam por padrão mostra atalhos externos sem arte nenhuma — um quadrado cinza genérico igual para todos. É impossível distinguir um jogo do outro.

O SRM automatiza as duas coisas. Ele varre suas pastas de ROMs, gera um atalho steam por jogo com o comando de lançamento correto, baixa a arte correspondente e injeta tudo no lugar que o Steam espera.

:::nota
O SRM é mantido pela comunidade como [SteamROMManager](https://github.com/SteamGridDB/steam-rom-manager) e é o coração da solução de *biblioteca unificada* que o EmuDeck prega. O EmuDeck é o instalador que monta emuladores e ROMs; o SRM é a ponte que liga essa estrutura ao Steam.
:::

## Atalho não é instalação

Vale cravar essa distinção antes de continuar, porque ela explica quase todos os erros que você vai encontrar. Quando o SRM adiciona um jogo à biblioteca, ele **não instala nada**. Ele escreve duas coisas:

- Um **atalho** dentro do arquivo `shortcuts.vdf`, que é a lista de itens externos do Steam.
- **Arquivos de arte** (as imagens de capa, banner e ícone) dentro da pasta de grid do Steam.

O atalho guarda apenas texto: um rótulo, um caminho de executável, argumentos e o diretório de trabalho. Nada disso baixa o emulador nem copia a ROM. Quando você clica no jogo no modo jogo, o Steam simplesmente executa a linha de comando gravada — normalmente algo como "abra o RetroArch com o core do SNES apontando para tal ROM".

```terminal
$ ls ~/.steam/steam/userdata/*/config/ | grep shortcuts
shortcuts.vdf
```

O `shortcuts.vdf` é um arquivo de texto com um formato próprio da Valve (VDF, *Valve Data Format*), não JSON nem YAML, e você verá seu interior na [seção sobre geração de atalhos](#/cap-051/sec-08). Por ora, fique com a ideia: o SRM edita esse arquivo e o Steam o lê ao iniciar.

:::atencao
Por causa desse mecanismo, o Steam precisa estar **fechado** quando o SRM grava os atalhos. Se o Steam estiver aberto, ele segura uma cópia do `shortcuts.vdf` na memória e sobrescreve o arquivo ao fechar, apagando o que o SRM acabou de escrever. Essa é a causa número um de "adicionei mas não apareceu".
:::

## O fluxo em três etapas

O trabalho do SRM se resume a três momentos, sempre na mesma ordem. Memorizar esse esqueleto impede que você se perca na interface, que tem muitas abas e opções.

1. **Parse** — o SRM varre as pastas que você indicou, casa cada arquivo com um padrão (o *parser*) e monta a lista de jogos candidatos em memória.
2. **Preview** — você revisa a lista, corrige nomes, remove entradas indesejadas e confere a arte atribuída a cada jogo. Nada foi gravado ainda.
3. **Save / Generate** — só agora o SRM escreve os atalhos e baixa as imagens para o Steam.

A gravação é a única etapa com efeito colateral. Parse e preview são seguros e reversíveis — você pode rodá-los quantas vezes quiser sem tocar em nada.

```text
[ Pastas de ROM ] --(parser)--> [ Lista em memória ] --(preview)--> [ Revisão ] --(save)--> [ shortcuts.vdf + arte ]
```

O conceito de **parser** é o mais importante do capítulo inteiro. Um parser é o conjunto de regras que diz ao SRM: "tudo que casar com este padrão de arquivo numa certa pasta é um jogo de tal plataforma, e o comando para rodá-lo é esse". Sem parser configurado, o SRM varre pastas e não encontra nada. A [seção específica sobre parsers](#/cap-051/sec-03) desdobra isso em detalhes.

## Quando o SRM vale a pena

Nem todo mundo precisa do SRM. Se você joga emulação raramente e não se incomoda de abrir o RetroArch manualmente, ele é peso morto. Mas três cenários o tornam quase obrigatório:

| Cenário | Por que o SRM ajuda |
|---|---|
| Biblioteca grande de emulação | Você quer navegar por capa, como no restante da biblioteca |
| Uso 100% em modo jogo | Não quer voltar para o desktop para lançar emulador |
| Vários emuladores diferentes | O SRM unifica RetroArch, Dolphin e standalone num só lugar |

O SRM também conversa bem com o EmuDeck, que já entrega parsers pré-configurados para as plataformas mais comuns — você não parte do zero. É o caminho que a [seção sobre EmuDeck](#/cap-051/sec-04) detalha.

## Resumo

- O SRM adiciona ROMs à biblioteca Steam criando atalhos externos e baixando arte para cada jogo.
- Um atalho Steam não é uma instalação: ele só guarda um comando que o Steam executa ao clicar.
- O SRM escreve em `shortcuts.vdf` (a lista de atalhos) e na pasta de grid (as imagens).
- O fluxo tem três etapas: parse (varrer e casar), preview (revisar) e save (gravar).
- O Steam precisa estar fechado na hora de gravar, senão sobrescreve o que o SRM escreveu.
- Um parser é a regra que liga um padrão de arquivo a uma plataforma e um comando de lançamento.

## Exercícios

1. Abra o EmuDeck e observe onde ficam as pastas de ROMs. Liste as plataformas que têm pastas criadas e anote o caminho de uma delas.
2. Localize o arquivo `shortcuts.vdf` do seu usuário com `find ~/.steam -name shortcuts.vdf`. Leia as primeiras linhas com `head` e tente identificar se já existem atalhos externos gravados.
3. Sem abrir o SRM ainda, escreva em uma frase qual é a diferença entre um atalho e um jogo instalado, usando a noção de AppID.
4. Feche o Steam e abra o SRM. Repare na ordem das três etapas na interface e confirme se a etapa de save só aparece depois do preview.
5. **Desafio.** Proponha um comando que liste, dentro da pasta de grid do Steam, quantos arquivos de imagem já existem — e reflita se esse número corresponde ao de jogos instalados ou de atalhos externos. (Dica: a pasta de grid fica em `~/.steam/steam/userdata/<id>/config/grid`.)
