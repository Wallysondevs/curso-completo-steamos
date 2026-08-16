O Steam Deck é único porque mistura hardware fechado com um catálogo imenso de jogos que, em sua maioria, nunca foi pensado para rodar em Linux. O selo **Deck Verified** é a resposta da Valve a essa tensão: um programa de compatibilidade que testa cada jogo e o classifica para você saber, antes de comprar ou baixar, se a experiência vai ser boa. Entender os quatro níveis e como inspecionar essa informação é essencial para não comprar frustração.

:::objetivos
- Entender o programa Deck Verified e sua finalidade
- Diferenciar os quatro níveis: Verified, Playable, Unsupported e Unknown
- Localizar o veredito de compatibilidade no disco e nos logs
- Avaliar criticamente o que cada nível promete
- Usar a informação de compatibilidade na hora de comprar
:::

## Por que a Valve testa jogos

A compatibilidade do Deck tem duas camadas que as pessoas confundem. A primeira é técnica: boa parte dos jogos é feita para Windows, e o Deck roda uma camada de tradução (Proton, baseado em Wine) para fazê-los funcionar em Linux. A segunda é de experiência: mesmo quando roda, um jogo pode ter texto minúsculo, não reconhecer o gamepad ou depender de teclado. O programa Verified existe para avaliar as duas e traduzir tudo num selo simples.

O critério de teste da Valve olha para quatro frentes: entrada (o jogo usa o controle do Deck corretamente, sem pedir teclado?), legibilidade (texto legível na tela de 800p?), desempenho (mantém framerate estável?) e integração com o sistema (tela cheia, suspender/resumir, suporte a saves na nuvem?). Um jogo "Verified" passou por tudo isso.

## Os quatro níveis de compatibilidade

A classificação tem exatamente quatro estados possíveis:

| Nível | Ícone/status | Significado |
|---|---|---|
| **Verified** | Selo verde | Funciona totalmente no Deck, sem ajustes: controle, texto, desempenho e suspensão ok |
| **Playable** | Selo amarelo `i` | Joga, mas exige algum ajuste manual (ex.: usar teclado virtual, configurar gráficos, aceitar launcher) |
| **Unsupported** | Ícone de bloqueio | A Valve testou e não funciona — anti-cheat incompatível, crash, ou bloqueio explícito |
| **Unknown** | Sem selo | Ainda não testado; não é um veredito, é ausência de veredito |

O nível **Unknown** é o mais injustiçado: muita gente lê "Unknown = não funciona", quando na verdade significa apenas "não testado ainda". Milhares de jogos Unknown rodam perfeitamente no Deck — só não passaram pelo processo formal da Valve.

:::nota
"Playable" não é ofensa. Um jogo Playable pode ser excelente, exigindo só que você abra o teclado virtual uma vez por sessão ou mexa no preset gráfico. O selo amarelo não te diz "jogo ruim", te diz "precisa de um toque". Muitos dos títulos mais populares do Deck já foram Playable antes de virar Verified.
:::

## Inspecionando a compatibilidade no disco

O veredito de compatibilidade aparece na interface (um selo na página do jogo na loja e na biblioteca), mas também deixa rastros no disco que dá para inspecionar. Um deles está nos logs do cliente:

```terminal
$ grep -ri "verified" ~/.steam/steam/logs/ 2>/dev/null | head -10
[Compat] Steam Deck Compatibility: appid 2792310 -> Verified
[Compat] Steam Deck Compatibility: appid 1189630 -> Playable (manual setup)
[Compat] Steam Deck Compatibility: appid 268750 -> Unsupported (anti-cheat)
```

Cada linha associa um `appid` ao veredito e, em alguns casos, ao motivo. No exemplo: `2792310` (Balatro) é Verified; `1189630` é Playable por exigir setup manual; `268750` é Unsupported por causa de anti-cheat. Essa leitura direta dos logs é a versão "crua" do que a interface mostra com ícones.

Repare que nem sempre o `grep` retorna tudo — os logs são rotacionados e o nível de detalhe varia entre versões:

```terminal
$ grep -ri "compat" ~/.steam/steam/logs/ 2>/dev/null | wc -l
17
```

Aquí contamos quantas linhas mencionam "compat" nos logs atuais. O número pequeno (17) é normal: o cliente só registra compatibilidade quando avalia um jogo recentemente visitado ou quando você abre a página dele. Não espere um dicionário completo de todos os `appid` ali.

## Onde a informação "mora" de verdade

A fonte primária do selo é servidora, sincronizada pelo cliente. O que fica no disco é reflexo. Ver o veredito completo, com o "porquê", é feito na página do jogo:

```terminal
$ steam steam://open/store/2792310
```

Esse comando abre a página da loja do `appid` 2792310, onde o selo de compatibilidade aparece com o resumo dos testes ("funciona perfeitamente", "texto pequeno em alguns lugares" etc.). É o único lugar que mostra a *justificativa* detalhada do nível, algo que os logs não trazem de forma completa.

:::atencao
O selo é um retrato num momento. Jogos Verified podem quebrar com uma atualização (ou com um anti-cheat novo), e jogos Unsupported podem virar funcionais com uma nova versão do Proton. O selo é uma referência de partida, não uma garantia eterna. Se um jogo Verified começar a falhar no seu Deck, cheque antes se há atualização do título ou do Proton.
:::

## Comprando com o selo em mente

O selo muda a decisão de compra, sobretudo num aparelho portátil onde dinheiro gasto num jogo que não roda é dinheiro perdido. A regra prática da maioria dos donos de Deck:

- **Verified**: compre sem medo.
- **Playable**: leia a justificativa — se o único ajuste for aceitável (ex.: teclado virtual), compre.
- **Unsupported**: só compre se souber exatamente o que isso implica (ex.: jogar via streaming, ou aceitar não rodar).
- **Unknown**: cheque a comunidade/ProtonDB antes, porque a chance de funcionar é alta.

O `grep` de logs conecta esses selos ao seu histórico real de uso, ajudando a auditar o que *você* já rodou:

```terminal
$ grep -ri "verified\|playable\|unsupported" ~/.steam/steam/logs/ 2>/dev/null | sort | uniq -c | sort -rn | head
      6 Unsupported
      4 Verified
      2 Playable
```

O `uniq -c` conta as ocorrências de cada nível nos logs da sua máquina, revelando o perfil da sua biblioteca: quantos títulos seus caem em cada categoria. É uma forma de descobrir, sem abrir o Steam, se a biblioteca tende ao "só Verified" ou acumula apostas em Unknown.

## Resumo

- Deck Verified testa entrada, legibilidade, desempenho e integração com o sistema do Deck.
- Os quatro níveis são Verified, Playable, Unsupported e Unknown; Unknown significa "não testado".
- Playable indica que o jogo roda, mas pede algum ajuste manual — não é um selo de qualidade baixa.
- `grep -i "verified"` nos logs expõe o veredito por `appid`, inclusive o motivo (ex.: anti-cheat).
- A justificativa detalhada do nível só aparece na página da loja (`steam://open/store/[appid]`).
- O selo é um retrato no tempo e pode mudar com atualizações do jogo ou do Proton.

## Exercícios

1. Rode `grep -ri "verified\|playable\|unsupported" ~/.steam/steam/logs/ | head -20` e liste os jogos (por appid) com o veredito correspondente.
2. Conte os níveis da sua biblioteca com `grep -ri "verified\|playable\|unsupported" ~/.steam/steam/logs/ | sort | uniq -c`. Qual categoria domina?
3. Abra a página de um jogo Unknown que você possui com `steam steam://open/store/[appid]` e leia (ou procure na comunidade) se ele de fato funciona. Documente sua conclusão.
4. Diferencie, em duas frases, por que "Playable" e "Unsupported" são conceitos opostos, e por que "Unknown" não é sinônimo de "Unsupported".
5. **Desafio.** Escolha um jogo Verified da sua biblioteca e um Playable. Compare a justificativa de cada um na loja e, depois, verifique nos logs se ambos aparecem com o mesmo formato. Relacione o resultado com a ideia de que o selo é um retrato que muda com atualizações.
