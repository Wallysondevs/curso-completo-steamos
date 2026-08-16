Especificações e benchmarks capturam apenas metade da história. A outra metade é como o aparelho *sente* depois de sessões longas — o peso nos pulsos, a textura do grip, o calor nas palmas, o barulho da ventoinha, a confiança nos botões. Esta seção cobre a dimensão humana dos handhelds, onde o Steam Deck tem uma liderança construída em anos de iteração.

:::objetivos
- Comparar a ergonomia e o conforto de cada handheld em sessões longas
- Avaliar a qualidade de controles, trackpads, sticks e botões
- Analisar ruído, temperatura e o impacto na experiência
- Comparar os launchers proprietários e o ecossistema de software de cada fabricante
:::

## Peso e empunhadura: a diferença que não aparece em foto

O peso de cada aparelho é uma especificação objetiva, mas o que importa é a *sensação de peso* — como ele distribui a massa nas mãos.

| Handheld | Peso | Empunhadura | Fatiga após 1h |
|---|---|---|---|
| Steam Deck OLED | 640 g | Excelente, grips profundos | Baixa |
| Steam Deck LCD | 669 g | Excelente, idêntico | Baixa |
| ROG Ally | 608 g | Boa, menor e mais compacto | Moderada |
| ROG Ally X | 678 g | Boa, ligeiramente melhor | Moderada |
| Legion Go | 854 g | Boa, mas pesada com controles | Alta |
| MSI Claw | 675 g | Boa, similar ao Ally | Moderada |

O Steam Deck é o mais elogiado em ergonomia, e não por acaso: a Valve passou anos testando protótipos com jogadores, e os grips são mais profundos e anatômicos que qualquer concorrente. O Deck "desaparece" nas mãos depois de alguns minutos, enquanto o Legion Go nunca deixa você esquecer do seu peso — especialmente jogando na cama com as mãos elevadas.

O Ally é notavelmente mais leve no papel (608 g, 60 g a menos que o Deck OLED), mas essa vantagem não se traduz em melhor ergonomia, porque o corpo mais compacto concentra o peso numa área menor e os grips são menos pronunciados.

## Trackpads: a vantagem estratégica do Deck

O Steam Deck é o único entre os grandes que tem **trackpads**: dois pequenos touchpads posicionados abaixo dos sticks, herdados do Steam Controller. Eles parecem um extra de luxo, mas na prática são *essenciais* para muitos jogos.

- **RTS e estratégia.** Jogar *Civilization VI* ou *Age of Empires* com stick analógico é sofrível; com trackpad, é natural e preciso.
- **Point-and-click.** Clássicos de aventura, *Disco Elysium*, *RimWorld* — todos dependem de precisão de toque.
- **Navegação desktop.** No modo Desktop do Deck, o trackpad direito vira mouse e o esquerdo, roda de scroll.
- **Jogos sem suporte a controle.** Um trackpad mapeado como mouse transforma qualquer jogo de PC (como *Papers, Please*, *FTL*, *The Sims*) em jogável no portátil.

Nenhum concorrente oferece trackpads — o Ally e o Claw usam a tela de toque como substituto, e o Legion Go usa o modo FPS para a mesma função (mas exige destacar o controle). É uma omissão que fecha a porta para gêneros inteiros. A [seção 9](#/cap-107/sec-09) mostra como isso influencia a escolha.

```terminal
$ # Mapeamentos típicos do trackpad no Deck
$ echo "Trackpad direito  -> mouse + clique"
$ echo "Trackpad esquerdo -> roda de scroll + menu radial"
$ echo "Gyro              -> fine aim (ativado ao tocar no trackpad)"
Trackpad direito  -> mouse + clique
Trackpad esquerdo -> roda de scroll + menu radial
Gyro              -> fine aim (ativado ao tocar no trackpad)
```

## Giroscópio e fine aim

Todos os modelos têm giroscópio, mas o do Deck é visivelmente superior por causa da integração com o Steam Input: o giroscópio pode ser ativado condicionalmente — "ao tocar no trackpad direito", "ao mirar (botão LT)", "sempre ligado" — com curvas de resposta customizáveis. É o recurso que faz a diferença entre "consegui mirar na cabeça" e "morri de novo para o controle".

O Ally e o Legion Go têm giroscópio, mas a integração no Windows é limitada. O Armoury Crate e o Legion Space não oferecem a mesma granularidade do Steam Input, e o resultado é que a maioria dos usuários simplesmente não usa.

## Sticks, botões e D-pad

A qualidade dos inputs físicos é outra área onde as especificações mentem. Um stick pode ser "Hall Effect" (sensor magnético, sem drift) e ainda assim ter formato desconfortável ou resistência esquisita.

| Input | Steam Deck | ROG Ally | Legion Go |
|---|---|---|---|
| Sticks | analógicos padrão, suaves e altos | Hall Effect, bons | Hall Effect, bons (destacáveis) |
| D-pad | Bom (OLED melhorou) | Bom | So-so (nos controles destacáveis) |
| ABXY | Silenciosos, curso curto | Mais ruidosos | Ok |
| Bumpers (LB/RB) | Ok | Mais clicáveis | Ok |
| Gatilhos (LT/RT) | Analógicos, precisos | Analógicos, bons | Analógicos, bons |
| Botões traseiros | 4 (L4/R4, L5/R5) | 2 | 4 (pequenos no destacável) |

O Deck LED e OLED têm quatro botões traseiros programáveis — o Ally tem apenas dois. Para jogos que exigem muitas ações (como *Elden Ring* ou *Elite Dangerous*), quatro botões extras fazem diferença.

O D-pad do Deck OLED melhorou em relação ao LCD — o contato ficou mais preciso, importante para jogos de luta e plataforma retrô.

## Ruído e temperatura

A ventoinha não é um detalhe — para quem joga na cama ao lado de alguém dormindo, o ruído é critério de escolha.

```terminal
$ # Ruído da ventoinha (dB, aproximado, a 15 W)
$ echo "Steam Deck OLED .......... ~32 dB (quase inaudível)"
$ echo "ROG Ally ................. ~38 dB"
$ echo "Legion Go ................ ~37 dB"
$ echo "MSI Claw ................. ~36 dB"
Steam Deck OLED .......... ~32 dB (quase inaudível)
ROG Ally ................. ~38 dB
Legion Go ................ ~37 dB
MSI Claw ................. ~36 dB
```

O Deck OLED é o mais silencioso — a ventoinha menor e o perfil de consumo mais estável mantêm a rotação baixa. O Ally original era criticado pelo ruído; o Ally X melhorou discretamente.

Em temperatura externa, todos aquecem — 40–50 °C na carcaça é normal sob carga. Mas o Legion Go é o que concentra mais calor perto das mãos (por causa da bateria e do kickstand), enquanto o Deck dissipa o calor pelas laterais e pela ventilação superior, longe dos dedos.

## Os launchers: uma conversa que o Deck não precisa ter

Cada concorrente Windows depende de um launcher proprietário para controlar TDP, RGB, macros e biblioteca. A tabela resume o estado deles em 2025:

| Fabricante | Launcher | Qualidade |
|---|---|---|
| Valve | Steam (Game Mode) | Excelente, integração total |
| Asus | Armoury Crate SE | Bom, às vezes pesado e bugado |
| Lenovo | Legion Space | Melhorando, mas ainda imaturo |
| MSI | MSI Center | Razoável, menos polido |

O Steam Deck não precisa de launcher — o sistema *é* o launcher. O Game Mode substitui o desktop inteiro. Essa é a diferença que torna o Armoury Crate e o Legion Space soluções *precárias de um problema que o Deck não tem*.

O fluxo de uso num handheld Windows típico:

```terminal
$ # Rotina comum em Ally/Legion Go
1. Ligar o dispositivo (20-30s até desktop)
2. Aguardar launcher carregar (5-10s)
3. Ignorar notificação do Windows Update
4. Abrir Steam/Armoury Crate
5. Jogar
6. Fechar jogo (ou arriscar sleep)
```

No Steam Deck, esse fluxo se resume a: ligar (5s) → selecionar jogo → jogar → suspender (1 botão). A diferença de atrito acumulado em meses de uso é substancial.

## Resumo

A ergonomia do Steam Deck é a referência da categoria — grips profundos, distribuição de peso, quatro botões traseiros e trackpads que desbloqueiam gêneros inteiros. O Ally é o mais leve mas menos confortável; o Legion Go é o mais pesado e pune em sessões longas. Em ruído, o Deck OLED lidera com folga. Em software, o Game Mode do SteamOS elimina a necessidade de launchers intermediários — cada concorrente Windows depende de um (Armoury Crate, Legion Space, MSI Center) que varia de bom a frustrante.

## Exercícios

1. Explique por que o Steam Deck é mais pesado que o Ally (640 vs 608 g) e ainda assim é considerado ergonomicamente superior. Que atributo faz a diferença?
2. Liste três gêneros de jogo que são *substancialmente* melhores com trackpad do que com stick analógico. Para cada gênero, dê um exemplo de jogo e explique por quê.
3. Pesquise o que são sticks "Hall Effect" e por que são anunciados como "sem drift". O Deck OLED usa Hall Effect? Isso é relevante a longo prazo?
4. Ouça (ou assista a um review de) o ruído da ventoinha do Ally a 30 W comparado com o do Deck OLED a 15 W. Descreva em que contexto essa diferença importa.
5. **Desafio.** O Steam Input é uma camada de mapeamento independente do jogo. Pesquise como funciona e compare com a customização limitada do Armoury Crate. Por que mapeamento por jogo (e compartilhamento de perfis) é um diferencial?