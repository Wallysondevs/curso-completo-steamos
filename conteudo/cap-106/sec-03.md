Canais de YouTube servem para entender e acompanhar; sites servem para consultar e verificar. A diferença prática aparece quando você tem uma pergunta específica — "esse jogo roda?", "essa build quebrou com o update?", "esse anti-cheat ainda me bane?" — e precisa de uma resposta escrita, com data, rastreável e citável. Esta seção apresenta os sites que funcionam como referência permanente, não como linha do tempo de notícias.

:::objetivos
- Conhecer os portais de referência técnica do ecossistema Steam Deck e Linux gaming
- Usar o ProtonDB para decidir compras e diagnosticar problemas de compatibilidade
- Acompanhar o estado do anti-cheat no Linux com fonte confiável
- Distinguir fonte de notícia de fonte de referência
:::

## ProtonDB: a bússola de compatibilidade

O [ProtonDB](https://www.protondb.com/) é o recurso individual mais valioso do ecossistema. Ele resolve uma falha do selo oficial da Valve: o badge "Deck Verified" é uma avaliação pontual, feita uma vez, que pode ficar desatualizada quando um update quebra o jogo ou quando o Proton melhora. O ProtonDB, em vez disso, agrega reports contínuos de milhares de jogadores reais.

Cada jogo tem um rating de bronze a platina, derivado dos reports da comunidade. Mais importante que o rating é o texto dos reports: usuários descrevem qual versão de Proton usaram, quais flags resolveram um crash, quais problemas persistem. É onde você encontra, por exemplo, que um jogo precisa de `PROTON_ENABLE_NVAPI=1` ou que trava no nível 3 sem um workaround específico.

```terminal
$ protontricks 1675200 list-installed
```

O comando acima — de uma ferramenta que discutiremos na seção sobre Proton — mostra os prefixos instalados para o jogo de ID 1675200, o Steam Deck. O ponto aqui é outro: o ProtonDB organiza exatamente esse tipo de conhecimento tácito que não cabe no selo oficial.

:::dica
Antes de comprar qualquer jogo para o Deck, abra a página dele no ProtonDB. O rating platina ou ouro com reports recentes vale mais que o selo Deck Verified sozinho. E note a data dos reports: um platina de 2022 pode não refletir o estado atual.
:::

## GamingOnLinux: notícia com profundidade

O [GamingOnLinux](https://www.gamingonlinux.com) é, desde 2009, o veículo de referência para jogos no Linux. Cobre SteamOS, Proton, anti-cheat, Steam Deck e o ecossistema de distribuições gamer com um nível de detalhe que a imprensa de tecnologia generalista não alcança. Quando um jogo para de funcionar por causa de anti-cheat, o GamingOnLinux costuma ser a fonte original da notícia — muitas vezes com texto do FAQ do próprio desenvolvedor explicando a decisão.

O valor do site está em três frentes: notícias com fonte citada, guias *how-to* verificados (como instalar jogos da GOG e Epic no Deck) e um fórum ativo onde problemas reais recebem resposta. Para quem quer acompanhar o ecossistema sem ruído, é o RSS essencial.

:::info
O GamingOnLinux mantém um feed RSS limpo, coisa rara hoje em dia. Se você usa um leitor de RSS, adicione o site — é a forma menos algorítmica de acompanhar o ecossistema, tema que retomamos na seção 9.
:::

## AreWeAntiCheatYet: a pergunta que não quer calar

O [AreWeAntiCheatYet](https://areweanticheatyet.com/) é um site de resposta única, mas essencial: ele rastreia quais soluções de anti-cheat funcionam no Linux/SteamOS e quais bloqueiam. O formato lembra o clássico "Is Steam Deck Ready?" — uma tabela de status (funciona / parcial / não funciona) por jogo e por tecnologia anti-cheat.

Ele importa porque o anti-cheat é hoje a maior ameaça à compatibilidade do Deck. Jogos online competitivos que dependem de anti-cheat em modo kernel — Easy Anti-Cheat, BattlEye, Vanguard — podem funcionar, funcionar parcialmente ou não funcionar no Proton/SteamOS, e essa situação muda com frequência conforme os desenvolvedores habilitam ou desabilitam o suporte Linux.

:::atencao
Nunca decida comprar um jogo multiplayer competitivo para o Deck sem checar o AreWeAntiCheatYet. Um jogo pode estar "Deck Verified" hoje e ter o suporte Linux revogado pelo estúdio na próxima atualização — a página captura exatamente esse tipo de volatilidade.
:::

## Consultando referências a partir do terminal

Os sites de referência têm interface web, mas o Steam Deck é uma máquina Linux — e parte do valor de morar num Linux é poder consultar suas fontes sem abrir o navegador. Dois exemplos concretos mostram como.

O AreWeAntiCheatYet expõe o estado de cada jogo numa página simples que dá para puxar e filtrar do terminal:

```terminal
$ curl -s https://areweanticheatyet.com/ | grep -i -E 'eac|battleye' | head -10
```

A página lista cada jogo com seu status de anti-cheat. Filtrar por `EAC` ou `BattlEye` — as duas tecnologias dominantes — te dá, num relance, a lista de jogos cuja compatibilidade está em jogo. Não é uma API, e o formato pode mudar; quando mudar, a própria página é a fonte.

Para manter um registro local do que você consulta, nada supera um arquivo de notas versionado. O exemplo abaixo cria uma checagem reprodutível do estado de um jogo:

```terminal
$ mkdir -p ~/lab/radar
$ echo "2025-02-14 — Elden Ring (ID 1245620): platina, Proton 9 funcional" >> ~/lab/radar/protondb.md
$ cat ~/lab/radar/protondb.md
2025-02-14 — Elden Ring (ID 1245620): platina, Proton 9 funcional
```

Esse "log de compatibilidade" conecta o tema desta seção ao hábito de benchmarking do capítulo anterior: cada linha é uma medição datada que, meses depois, permite saber quando uma regressão apareceu. O ProtonDB em si já guarda o histórico; o seu log guarda o *seu* histórico de decisões.

```terminal
$ curl -s https://areweanticheatyet.com/ | grep -c 'status'
```

O comando acima é um pontapé: contar quantas entradas de status existem na página te dá uma noção do tamanho do catálogo monitorado — um número que cresce a cada jogo competitivo que sai para o Linux. Consultar o texto completo no navegador continua sendo o caminho para a resposta definitiva, mas o terminal agiliza o "tem spoiler de novo jogo quebrado?" do dia a dia.

## Curadoria de configurações e bibliotecas

**SteamDeckHQ** ([steamdeckhq.com](https://steamdeckhq.com)) se posiciona como o complemento de settings do ProtonDB: enquanto o ProtonDB diz *se* roda, o SDHQ diz *como* configurar para extrair o melhor desempenho. As tabelas de configuração jogo a jogo (resolução, FSR, TDP, limite de FPS) são testadas e documentadas.

**DeckFilter** ([deckfilter.app](https://deckfilter.app)) resolve um problema distinto — gerenciar o backlog. Ele cruza sua biblioteca Steam com os ratings do ProtonDB para mostrar o que roda bem no Deck, ajudando a decidir o que instalar num aparelho com armazenamento limitado.

**ProtonDB Badges** e extensões de navegador adicionam o rating do ProtonDB diretamente na loja Steam, para que você veja a compatibilidade enquanto navega, sem abrir uma aba separada. É um atalho que reduz o atrito da checagem.

## A diferença que importa: referência vs. notícia

Uma fonte de **notícia** (GamingOnLinux, canais de YouTube) te diz o que mudou ontem. Uma fonte de **referência** (ProtonDB, AreWeAntiCheatYet, SDHQ) te diz o estado atual de algo específico. Você consulta referências quando tem uma decisão a tomar — comprar, instalar, configurar — e segue notícias para saber quando re-consultar suas referências. Manter as duas categorias separadas evita a armadilha de tratar um artigo de novidades como se fosse verdade permanente.

| Fonte | Tipo | Para quê |
|---|---|---|
| ProtonDB | referência | compatibilidade e workarounds por jogo |
| AreWeAntiCheatYet | referência | estado do anti-cheat no Linux |
| SteamDeckHQ | referência | configurações ótimas por jogo |
| DeckFilter | utilitário | cruzar backlog com compatibilidade |
| GamingOnLinux | notícia + referência | notícias, guias e fórum |

## Resumo

- ProtonDB é o recurso individual mais valioso; o texto dos reports vale mais que o rating.
- O selo Deck Verified é uma avaliação pontual; o ProtonDB é uma medição contínua da comunidade.
- GamingOnLinux é a fonte primária de notícias com profundidade técnica e feed RSS limpo.
- AreWeAntiCheatYet rastreia a compatibilidade de anti-cheat, a maior ameaça atual ao Deck.
- Separe fontes de notícia (o que mudou) de fontes de referência (estado atual).

## Exercícios

1. Abra o ProtonDB e procure três jogos seus. Compare o rating da comunidade com o selo Valve de cada um. Em quantos casos eles divergem?
2. Leia três reports recentes de um jogo platina no ProtonDB e liste os workarounds que os usuários mencionam. Identifique qual deles é uma variável de ambiente de Proton.
3. Verifique no AreWeAntiCheatYet o status de um jogo competitivo que você joga ou gostaria de jogar no Deck. O status atual é "funciona", "parcial" ou "não funciona"? Há nota da data da última mudança?
4. Navegue pelo GamingOnLinux e encontre um guia *how-to* sobre launchers alternativos (GOG/Epic). Compare o passo a passo com o que você já sabe sobre instalação de apps não-Steam no Deck.
5. **Desafio.** Escolha um jogo do seu backlog, use o DeckFilter para verificar compatibilidade e, se ele rodar, configure-o seguindo uma tabela do SteamDeckHQ. Documente em três linhas: o rating, a configuração recomendada e o resultado real que você mediu.