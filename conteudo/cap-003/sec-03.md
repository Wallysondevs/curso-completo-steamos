Quando o Steam já dominava o software, a Valve começou a olhar para o hardware. O raciocínio era simples: a plataforma estava presa ao Windows, e o Windows era controlado pela Microsoft, que poderia a qualquer momento priorizar sua própria loja ou fechar o sistema. Para garantir o futuro do Steam, a Valve precisava de um plano B — e esse plano B envolvia Linux, hardware próprio e um sistema operacional feito sob medida. As Steam Machines, anunciadas em 2013, foram a tentativa mais ambiciosa e mais fracassada dessa estratégia.

:::objetivos
- Entender por que a Valve lançou Steam Machines e SteamOS em 2013
- Conhecer a arquitetura do SteamOS 1.0, baseado em Debian
- Reconhecer os erros estratégicos que levaram ao fracasso das Steam Machines
- Avaliar o que sobrou dessa experiência que foi reaproveitado no Steam Deck
:::

## A Microsoft como ameaça existencial

Em 2012, a Microsoft lançou o Windows 8 com uma loja própria — a Windows Store — que, na visão da Valve, poderia se tornar um concorrente direto do Steam se ganhasse tração. Gabe Newell foi público ao chamar o Windows 8 de "catástrofe para o jogo no PC". A ameaça era dupla: de um lado, uma loja embutida no sistema operacional; de outro, a possibilidade de a Microsoft restringir a instalação de software "de fora", como já fazia o iOS da Apple.

A resposta da Valve foi preparar uma rota de fuga. O destino era o Linux — o único sistema que a Valve poderia controlar de ponta a ponta. O projeto era ambicioso demais para se resolver só com um "modo Linux" no cliente Steam. Ele demandava hardware, sistema operacional e uma ponte para os jogos que só existiam no Windows. Dali nasceram simultaneamente três iniciativas: as Steam Machines (hardware), o SteamOS (sistema) e o Steam Play/Proton (compatibilidade), sendo este último o que só amadureceria anos depois.

## Steam Machines: hardware com sabor de console

O conceito era ousado: fabricantes parceiros (Alienware, Falcon Northwest, Zotac, entre outros) produziriam máquinas com hardware variado, mas todas rodando o mesmo SteamOS. A Valve forneceria uma especificação de referência e um controle dedicado, o **Steam Controller**. O jogador compraria uma Steam Machine como quem compra um console, mas com a liberdade de um PC — e com acesso ao catálogo do Steam.

```text
Principais fabricantes de Steam Machines (2015)
─────────────────────────────────────────────────
Fabricante       Modelo                   Faixa de preço
─────────────────────────────────────────────────
Alienware        Steam Machine (Alpha)    ~US$ 449-749
Falcon Northwest Tiki                     ~US$ 2000+
Zotac            Steam Machine EN970      ~US$ 999
Syber            Vapor Series             ~US$ 499-1499
```

O problema não estava no hardware — muitas máquinas eram boas. O problema estava no software. Na época do lançamento (novembro de 2015), a biblioteca nativa de jogos para Linux era minúscula. A Valve ainda não tinha o Proton funcionando; o máximo que existia era uma lista reduzida de títulos com suporte nativo a Linux, a maioria do catálogo da própria Valve. Comprar uma máquina caríssima para rodar meia dúzia de jogos não era atraente para ninguém.

## O primeiro SteamOS: coragem certa, momento errado

O SteamOS 1.0 foi lançado em dezembro de 2013 (beta) junto com as Steam Machines. Ele era baseado no Debian e trazia o GNOME como ambiente de desktop e o Big Picture Mode do Steam como interface padrão. Não era um sistema para uso geral — era um sistema para jogar no sofá, com controle, conectado à TV da sala.

```terminal
$ cat /etc/os-release  ## SteamOS 1.0 (saída ilustrativa, Debian-based)
NAME="SteamOS"
VERSION="1.0 (Alchemist)"
ID="steamos"
ID_LIKE="debian"
PRETTY_NAME="SteamOS 1.0"
VERSION_ID="1.0"
VERSION_CODENAME=alchemist
```

A escolha do Debian, e não do Ubuntu, foi deliberada: o Debian é um projeto comunitário, sem uma empresa por trás que pudesse mudar de direção. A Valve queria controle total sobre a base. Porém, o Debian é conservador com versões de pacotes, o que significava que drivers gráficos e bibliotecas de games chegavam com atraso. Esse atrito entre "estabilidade" e "estar atualizado para jogos" se tornaria uma lição que a Valve aplicaria no SteamOS 3.

:::nota
O codinome "Alchemist" seguia a tradição da Valve de nomear versões com personagens e conceitos de seus jogos. A versão seguinte, baseada em Debian 8, chamou-se "Brewmaster", referência de *Dota 2*.
:::

## Por que fracassou e o que ficou

O fracasso das Steam Machines veio de três fatores simultâneos: preço alto demais em comparação com consoles, biblioteca de jogos escassa (sem Proton ainda) e marketing confuso — o consumidor médio não entendia por que comprar uma Steam Machine em vez de um PC normal ou um PlayStation. Em 2016, a Valve praticamente abandonou a divulgação do conceito.

O que sobreviveu foi surpreendentemente importante: o Steam Controller, que influenciou o design dos controles do Steam Deck (em especial os touchpads); o Big Picture Mode, que até hoje é a interface de sofá do Steam; e a semente do SteamOS como sistema de hardware dedicado. Mais importante ainda: a Valve aprendeu, com esse fracasso, que ela não poderia depender de fabricantes parceiros para o hardware. A próxima tentativa de hardware seria feita internamente.

:::dica
Se você encontrar uma Steam Machine usada por aí, saiba que ela roda Linux com `apt` do Debian. Pode ser usada como PC compacto, mas a experiência de jogo nela sem Proton é limitadíssima. Com o Proton, a biblioteca melhora, mas o hardware das primeiras máquinas já está defasado.
:::

## Resumo

- Em 2013, a Valve respondeu ao Windows 8 com Steam Machines, SteamOS 1.0 e Steam Controller.
- SteamOS 1.0 era baseado em Debian, com GNOME e Big Picture Mode.
- As Steam Machines falharam por preço, catálogo limitado e falta de Proton.
- O Steam Controller e o Big Picture Mode sobreviveram como peças do ecossistema.
- A lição central foi que a Valve precisaria fabricar o próprio hardware.

## Exercícios

1. Explique, em um parágrafo, por que Gabe Newell chamou o Windows 8 de "catástrofe" para jogos no PC.
2. Pesquise os nomes de código do SteamOS (Alchemist, Brewmaster) e identifique de onde eles vêm nos jogos da Valve.
3. Compare o preço de lançamento de uma Steam Machine Alienware com o de um Steam Deck de 256 GB (em dólares americanos).
4. Liste três razões pela falha comercial das Steam Machines e relacione cada uma com uma decisão que a Valve corrigiu no lançamento do Steam Deck.
5. **Desafio.** Procure em fóruns ou na documentação da Valve o que é o Big Picture Mode e escreva um pequeno guia de como ativá-lo no Steam Deck atual, explicando a diferença entre o modo Desktop e o modo Gaming na interface.