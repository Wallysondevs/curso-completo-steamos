A virada de chave na história dos jogos para PC aconteceu quando a Valve anunciou que *Half-Life 2*, lançado em 2004, exigiria o Steam para instalar e ativar — mesmo em cópia física comprada em loja. A decisão foi impopular na época, mas ela definiu o destino do software para PC: a distribuição deixou de ser física e passou a ser digital e centralizada. Entender esse momento é entender por que, hoje, a palavra "Steam" é quase sinônimo de jogos no computador.

:::objetivos
- Entender como o Steam deixou de ser atualizador e virou plataforma de distribuição
- Conhecer o papel de *Half-Life 2* na imposição do Steam
- Reconhecer os efeitos do Steam na indústria de jogos para PC
- Localizar o Steam no sistema de arquivos do SteamOS
:::

## A imposição que mudou tudo

Quando *Half-Life 2* estreou, em novembro de 2004, a Valve tomou uma decisão arriscada: mesmo quem comprasse o disco precisava criar uma conta Steam, conectar-se à internet e ativar o jogo. Houve fúria em fóruns, reclamações sobre DRM e servidores que não aguentaram o pico de ativações no dia do lançamento. A Valve, porém, segurou a decisão.

O saldo, com o tempo, se inverteu. A centralização permitiu que a Valve entregasse atualizações, promovesse promoções e — decisão crucial — passasse a vender jogos de terceiros. A loja cresceu de catálogo próprio para um mercado aberto. Em poucos anos, o Steam se tornou o canal padrão de distribuição de jogos para PC, algo que nenhum concorrente físico conseguia reproduzir.

## Da caixa ao download: a economia mudou

O modelo anterior era caro e frágil: fabricar mídia, imprimir caixas, pagar varejistas, lidar com devoluções e com o risco de encalhe. O Steam eliminou quase todo esse custo marginal. Para um estúdio pequeno, colocar o jogo no Steam passou a ser viável sem editora, sem fabricante de mídia e sem rede de distribuição física.

Duas consequências estruturais vieram daí. A primeira foi a explosão dos jogos independentes — o movimento "indie" que domina boa parte do catálogo atual. A segunda foi a mudança no modelo de preço, com promoções sazonais (as famosas *Steam Sales*) e preços regionais. Ambas nasceram de uma mesma infraestrutura: a possibilidade de distribuir e atualizar software a custo quase zero.

| Etapa | Antes do Steam | Depois do Steam |
|---|---|---|
| Fabricação | Mídia física, caixa, manual | Arquivo digital |
| Distribuição | Varejistas e portais de download | Infraestrutura própria da Valve |
| Atualização | Manual, por patch baixado | Automática, via cliente |
| Barreira de entrada | Alta (editora, mídia) | Baixa (conta de desenvolvedor) |
| Alcance | Local/regional | Global instantâneo |

## O Steam no seu SteamOS

Para quem usa o SteamOS, a plataforma não é uma abstração histórica: ela está instalada como um programa real, com arquivos e processos no disco. O cliente roda como aplicativo Flatpak no SteamOS, e vale a pena localizá-lo para enxergar a estrutura por trás da interface.

```terminal
$ which steam
/usr/bin/steam
$ steam --version
steam   1.0.0.82-1
```

O executável `steam` é um pequeno *launcher*: ele decide se o cliente precisa se atualizar e, em seguida, dispara o processo principal. A maior parte dos arquivos reais — biblioteca de jogos, configurações, dados de usuário — fica no diretório pessoal do usuário `deck`.

```terminal
$ ls -a ~/.steam
.
..
bin
compatibilitytools.d
config
controller_base
registry.vdf
steam
steam.pid
ubuntu12_32
```

O diretório `~/.steam/steam` contém a instalação efetiva do cliente. Nele, a subpasta `ubuntu12_32` é um legado histórico: o cliente Steam para Linux foi originalmente distribuído como um binário de 32 bits compilado contra o Ubuntu 12.04, e o nome do diretório permaneceu mesmo depois das atualizações. A pasta `compatibilitytools.d` é onde versões do Proton (a camada de compatibilidade do Steam Play) são instaladas manualmente, [assunto da seção sobre Proton](#/cap-003/sec-06).

## O efeito de rede como moat

O valor de um mercado digital cresce com o número de participantes: mais jogadores atraem mais desenvolvedores, que atraem mais jogadores. O Steam construiu ao longo de duas décadas um dos maiores catálogos e uma das maiores bases de usuários do mundo, o que tornou extremamente difícil competir mesmo para gigantes como Epic e Microsoft, que lançaram lojas com comissões menores.

Esse efeito de rede é o verdadeiro "fosso" (moat) da Valve. Ele também explica a lógica por trás do hardware: quando a Valve lança um Steam Deck ou investe em SteamOS, não está vendendo só uma máquina — está estendendo o alcance de uma biblioteca que já é o ativo mais valioso da empresa. Cada aparelho novo é uma porta de entrada para o mesmo catálogo.

:::info
O Steam contabiliza centenas de milhões de contas e dezenas de milhões de usuários ativos mensais. A biblioteca média de um usuário antigo é grande o suficiente para que trocar de plataforma signifique abandonar anos de compras — um custo de migração que protege a posição da Valve.
:::

## Resumo

- *Half-Life 2* (2004) tornou o Steam obrigatório, mesmo em cópia física.
- O Steam eliminou o custo marginal de distribuição, viabilizando o cenário independente.
- Promoções sazonais e preços regionais nasceram da digitalização da distribuição.
- No SteamOS, o cliente é um Flatpak cujos arquivos ficam em `~/.steam`.
- O efeito de rede do catálogo é o principal ativo estratégico da Valve.

## Exercícios

1. Execute `steam --version` e `ls -a ~/.steam` no seu SteamOS e descreva o que cada diretório listado representa.
2. Explique por que a decisão de exigir o Steam em *Half-Life 2* foi arriscada e por que acabou se pagando.
3. Compare os custos de distribuição de um jogo antes e depois do Steam usando uma tabela como a desta seção.
4. Verifique, em `~/.steam/steam`, se existe o diretório `ubuntu12_32` e pesquise por que esse nome é um legado histórico.
5. **Desafio.** Liste o conteúdo de `~/.steam/compatibilitytools.d` e explique, relacionando com a seção sobre Proton, o que uma pasta ali dentro poderia representar.
