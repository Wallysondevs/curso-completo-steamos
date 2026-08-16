O Modo Jogo do SteamOS é a interface que recebe você assim que o Deck liga. Diferente de um desktop tradicional, ele foi projetado para ser operado com os polegares — e cada botão físico pode disparar atalhos que economizam dezenas de toques na tela. Conhecer esses atalhos significa menos tempo navegando em menus e mais tempo jogando. Esta seção cobre a navegação básica: o que cada botão faz sozinho e como se locomover pela biblioteca, loja e configurações sem nunca encostar na tela touch.

:::objetivos
- Navegar pelas seções principais do Modo Jogo usando apenas botões físicos
- Diferenciar as funções primárias de cada botão no Modo Jogo
- Memorizar os atalhos de um toque para biblioteca, loja e configurações
- Acionar busca rápida e filtros sem o teclado virtual
:::

## Os botões e suas funções primárias

No Modo Jogo, cada botão do Deck tem uma função padrão que dispensa configuração. A tabela abaixo resume o comportamento de fábrica — o ponto de partida antes de qualquer personalização via Steam Input.

| Botão | Função primária no Modo Jogo |
|---|---|
| **Steam** | Abre/fecha o menu Steam (lateral esquerdo) |
| **Quick Access (`...`)** | Abre/fecha o painel de acesso rápido (lateral direito) |
| **D-Pad (cima/baixo)** | Navega entre itens de lista verticalmente |
| **D-Pad (esquerda/direita)** | Alterna entre abas horizontais quando disponível |
| **Analógico esquerdo** | Navegação direcional livre em menus e grid |
| **Analógico direito** | Raramente usado como cursor; em jogos, controle de câmera |
| **A** | Confirma seleção / Enter |
| **B** | Volta / Cancelar |
| **X** | Função contextual (ex.: abrir detalhes do jogo) |
| **Y** | Função contextual (ex.: toggle de favorito) |
| **L1 / R1** | Alterna entre abas superiores (Biblioteca, Loja, etc.) |
| **L2 / R2** | Scroll rápido em listas longas |
| **Touchpad esquerdo** | Scroll circular em listas (deslize em círculo na borda) |
| **Touchpad direito** | Cursor do mouse virtual em sobreposições |
| **Botões traseiros** | Sem função padrão; mapeáveis via Steam Input |

Pressionar o botão **Steam** por cerca de 2 segundos abre um menu rápido com atalhos para suspender, desligar, reiniciar e alternar para o Modo Desktop — sem precisar navegar até o menu de energia.

```terminal
$ systemctl status steam-remote-play
● steam-remote-play.service - Steam Remote Play Service
     Loaded: loaded (/usr/lib/systemd/system/steam-remote-play.service; enabled)
     Active: active (running) since Mon 2026-01-12 18:30:22 -03; 2h 15min ago
```

O SteamOS mantém serviços como o Remote Play em segundo plano mesmo durante a navegação no Modo Jogo. A interface não "pausa" o sistema — ela apenas oculta a área de trabalho.

## Navegação entre seções com um toque

A tela inicial do Modo Jogo exibe cinco abas principais no topo: **Biblioteca**, **Loja**, **Comunidade**, **Perfil** e **Configurações**. O jeito mais rápido de alternar entre elas é com os bumpers:

| Atalho | Resultado |
|---|---|
| [[R1]] | Próxima aba à direita |
| [[L1]] | Aba anterior à esquerda |
| [[Steam]] + [[R1]] ou [[L1]] | Alterna entre abas com atalho de teclado (mantém Steam pressionado) |

Dentro da **Biblioteca**, o D-Pad para cima/baixo percorre os jogos instalados um a um. Para acelerar, use os gatilhos:

| Atalho | Resultado |
|---|---|
| [[R2]] | Scroll rápido para baixo (salta cerca de 10 itens) |
| [[L2]] | Scroll rápido para cima |
| [[Y]] | Alterna entre visualização em grid e lista |
| [[X]] | Abre a página de detalhes do jogo selecionado |

:::dica
Na Biblioteca, segure o **analógico esquerdo** totalmente para uma direção por mais de meio segundo — o Deck ativa scroll contínuo, útil para quem tem centenas de jogos instalados no SSD ou microSD.
:::

:::nota
A navegação por bumpers (`L1`/`R1`) é pré-processada pelo firmware do Steam Deck antes de chegar ao SteamOS. Isso significa que mesmo se a interface do Modo Jogo travar momentaneamente, a troca de abas pelos bumpers pode continuar funcionando — o firmware enfileira os eventos no controlador USB interno, e o SteamOS os processa quando recupera o ciclo de renderização.
:::

## Busca e filtros instantâneos

Apertar o botão **X** sobre um espaço vazio da biblioteca ou tocar no ícone de lupa ativa a busca. Mas o atalho mais rápido para filtrar a coleção é a tabela de filtros pré-definidos:

| Atalho | Filtro aplicado |
|---|---|
| [[Steam]] + [[X]] | Abre barra de busca da biblioteca |
| [[Steam]] + [[Y]] | Alterna ordenação (alfabética, data, tamanho) |
| [[Steam]] + [[D-Pad Cima]] | Filtra "Instalados localmente" |
| [[Steam]] + [[D-Pad Baixo]] | Mostra "Todos os jogos" (inclui cloud) |

Esses filtros são especialmente úteis quando você está com um microSD cheio e precisa decidir o que desinstalar para liberar espaço — o filtro por tamanho revela na hora os jogos mais pesados.

```terminal
$ du -sh /run/media/deck/*/steamapps/common/* | sort -rh | head -5
89G     /run/media/deck/sd128/steamapps/common/Baldur's Gate 3
62G     /run/media/deck/sd128/steamapps/common/Red Dead Redemption 2
51G     /run/media/deck/sd128/steamapps/common/Cyberpunk 2077
38G     /run/media/deck/sd128/steamapps/common/Elden Ring
27G     /run/media/deck/sd128/steamapps/common/Hades II
```

O Modo Jogo não exibe o peso de cada jogo em gigabytes — mas o terminal do Modo Desktop resolve isso com `du`. A tabela de atalhos de navegação torna a limpeza manual muito mais rápida porque você localiza o título em segundos antes de alternar para o Desktop e executar o comando.

Quando a biblioteca está muito cheia, outra utilidade de navegação é identificar os títulos que você não abre há meses. O Steam guarda o registro de último acesso em cada manifesto de jogo, e o terminal expõe esse dado rapidamente:

```terminal
$ grep -h '"LastPlayed"' /run/media/deck/*/steamapps/appmanifest_*.acf | sort
"LastPlayed"	"1767480000"
"LastPlayed"	"1767532200"
"LastPlayed"	"1768100400"
"LastPlayed"	"1768536000"
```

O valor `LastPlayed` é um timestamp Unix (segundos desde 1970). Convertendo os maiores valores com `date -d @1768536000`, você descobre exatamente quais jogos ficaram parados por semanas — e decide o que desinstalar pela própria tabela de filtros, sem adivinhar.

## Resumo

- Os bumpers `L1`/`R1` alternam entre as abas principais; gatilhos `L2`/`R2` aceleram o scroll.
- O botão Steam segurado por 2 segundos abre menu de energia com suspensão, desligamento e troca de modo.
- A biblioteca suporta filtros rápidos com combinações de Steam + D-Pad sem abrir menus.
- O analógico esquerdo ativa scroll contínuo quando mantido em uma direção.
- A busca pode ser invocada com Steam + X, dispensando o teclado virtual para filtros simples.

## Exercícios

1. No Modo Jogo, alterne entre as cinco abas principais usando apenas `L1` e `R1`. Conte quantos pressionamentos são necessários para ir de Biblioteca até Configurações.
2. Segure o botão Steam por 2 segundos e observe o menu de energia. Qual é a primeira opção destacada? Quantas opções existem no total?
3. Navegue até a sua biblioteca e use o filtro Steam + D-Pad Cima para mostrar apenas jogos instalados localmente. Depois execute o mesmo filtro pelo menu normal com o analógico. Qual caminho foi mais rápido?
4. Com um microSD inserido, anote quantos jogos aparecem na biblioteca com o filtro "Todos os jogos" e depois com "Instalados localmente". A diferença corresponde aos jogos na nuvem?
5. **Desafio.** No Modo Desktop, execute `find /run/media/deck -name '*.acf' | wc -l` para contar quantos jogos estão instalados no microSD. Depois compare com o número exibido no Modo Jogo. Os números batem? Investigue arquivos `.acf` que possam estar órfãos.