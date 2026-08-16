Nem todo conserto precisa passar pela Valve. O Steam Deck foi desenhado, dentro do possível, para ser reparável pelo próprio dono, e a Valve fechou parceria com a iFixit para vender peças oficiais e publicar guias de troca. Saber o que dá para trocar em casa — e quando é melhor não mexer — evita tanto um RMA desnecessário quanto uma abertura que estrague o aparelho.

:::objetivos
- Conhecer a parceria Valve/iFixit e o que ela oferece
- Identificar quais peças são substituíveis em casa
- Entender o risco de cada tipo de reparo
- Decidir com critério entre consertar, acionar a garantia ou contratar técnico
:::

## A parceria Valve e iFixit

A Valve firmou acordo com a iFixit para fornecer peças oficiais do Steam Deck — telas, ventoinhas, alavancas, placas de botões, entre outras — acompanhadas de guias com passo a passo e, para reparos mais delicados, uma nota de dificuldade. É a via oficial para quem quer consertar fora do RMA sem recorrer a peças paralelas de qualidade duvidosa.

```terminal
$ curl -s https://www.ifixit.com/Device/Steam_Deck | grep -i "guide"
```

O catálogo e os guias vivem em `ifixit.com`, na página do dispositivo Steam Deck. Consultar o guia **antes** de comprar a peça é essencial: ele informa as ferramentas necessárias, o tempo estimado e o nível de risco, e muitas vezes revela que o reparo é mais simples (ou mais arriscado) do que parecia.

## O que dá para trocar em casa

Algumas peças são de troca trivial; outras exigem desmontagem quase total com risco real. A ventoinha, os analógicos (alavancas) e a bateria da tampa traseira são relativamente acessíveis. A tela e a tela sensível ao toque, por envolverem cola e cabo flat delicado, estão no extremo oposto da escala de dificuldade.

```terminal
$ ls /sys/class/hwmon/hwmon*/fan1_input 2>/dev/null
/sys/class/hwmon/hwmon3/fan1_input
```

Antes de trocar a ventoinha, confirme pelo sistema que ela de fato está com problema — ler a rotação via `hwmon` e cruzar com a temperatura (seção anterior) evita trocar uma peça que está funcionando. Diagnóstico correto é metade do reparo.

:::atencao
Abra o aparelho **só após** confirmar que o defeito não é coberto por garantia que você queira usar. Se você abrir e danificar algo no processo, esse dano novo fica fora da cobertura — e "eu abri para olhar" não é justificativa aceita.
:::

## O custo real de um reparo caseiro

Reparar em casa raramente é "grátis": você paga a peça, as ferramentas (algumas específicas, como a espátula de abertura e a chave Torx), e assume o risco de quebrar algo adicional. A conta certa compara isso com o custo e o tempo de um RMA, ou de um técnico especializado.

```terminal
$ du -sh ~/Downloads/steam-deck-thumbsticks/
1.2M	~/Downloads/steam-deck-thumbsticks/
```

Nem tudo é hardware físico: alguns "defeitos" de analógico, por exemplo, são resolvidos por calibração de software ou remapeamento (visto em capítulos sobre controles). A regra de custo começa em "o defeito é mesmo físico?" antes de "quanto custa a peça?".

:::dica
Peças oficiais da iFixit vêm com rastreabilidade e acabamento idêntico ao original; peças paralelas baratas costumam ter folga, brilho de tela diferente ou calibração imprecisa. Para componentes como tela e bateria, a diferença de preço não compensa o risco.
:::

## Decidindo entre as três vias

No fim, cada defeito cabe numa de três decisões: garantir (RMA), consertar em casa, ou contratar técnico. A garantia é a primeira opção quando o caso é coberto e o aparelho está dentro do prazo. O reparo caseiro faz sentido quando a peça é barata, o guia é simples e você está fora da garantia (ou ela não cobre). O técnico é a saída quando o reparo é delicado e você não quer arriscar.

```terminal
$ cat /sys/class/dmi/id/product_name
Jupiter
```

A geração do aparelho importa para a escolha: o LCD ("Jupiter") é mais maduro e tem peças e guias abundantes; o OLED ("Galileo") é mais novo e tem particularidades de desmontagem (tela mais fina, cola diferente). Consulte o guia específico da sua geração, não um genérico.

## Erros comuns de reparo caseiro

O erro clássico: comprar a peça e depois descobrir que precisa de ferramenta específica que não tem. O guia da iFixit lista as ferramentas logo no início, e ignorá-las leva à tentação de improvisar — uma chave de fenda no lugar de Torx, uma lâmina no lugar de espátula — que causa dano ao plástico, ao encaixe ou ao conector.

```terminal
$ ls /sys/class/hwmon/hwmon3/device/fan1_*
/sys/class/hwmon/hwmon3/device/fan1_input
/sys/class/hwmon/hwmon3/device/fan1_max
/sys/class/hwmon/hwmon3/device/fan1_min
```

Testar a ventoinha pelo `hwmon` — comparando `fan1_input` (RPM atual) com `fan1_max` e `fan1_min` — revela se ela responde a diferentes cargas. Se ela gira normalmente sob demanda, o "superaquecimento" pode ser problema de pasta térmica ou de dissipador, não da ventoinha — um diagnóstico que o guia da iFixit ajuda a refinar.

| Peça | Dificuldade iFixit | Ferramenta específica |
|---|---|---|
| Analógico (thumbstick) | Moderada | Chave Phillips, espátula |
| Ventoinha | Moderada | Chave Phillips, pinça |
| Bateria da tampa traseira | Fácil | Chave Phillips |
| Tela (LCD ou OLED) | Difícil | Pistola de calor, espátula, ventosa |
| Placa de botões ABXY | Moderada | Chave Torx, espátula |

## Resumo

- A Valve vende peças oficiais e guias de reparo por meio da parceria com a iFixit.
- Ventoinha, analógicos e bateria são trocas acessíveis; tela exige desmontagem delicada.
- Diagnóstico correto (via `hwmon`, por exemplo) precede qualquer compra de peça.
- Abrir o aparelho só é seguro se o dano novo não inviabilizar a garantia que você ainda quer usar.
- A escolha entre garantia, reparo caseiro e técnico depende de cobertura, risco e custo.

## Exercícios

1. Acesse a página do Steam Deck na iFixit e liste três peças oficiais disponíveis com suas notas de dificuldade.
2. Explique por que o diagnóstico da ventoinha (via `hwmon`) deve vir antes da compra da peça de reposição.
3. Compare, em uma tabela curta, os custos de trocar uma tela em casa versus enviar para RMA vs. contratar técnico.
4. Descreva um cenário em que abrir o aparelho anula uma garantia que você ainda queria usar.
5. **Desafio.** Escolha um defeito (analógico com drift) e trace a decisão completa: verifique se é físico ou calibração, consulte o guia da iFixit, liste ferramentas e peças necessárias e conclua qual das três vias é a mais racional no seu caso, justificando.
