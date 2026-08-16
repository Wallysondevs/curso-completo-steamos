O dock é a peça que transforma a única porta USB-C do deck em um hub completo. Mas nem todo dock é igual, e boa parte dos problemas de multimonitor "misteriosos" no SteamOS tem o dock — não o deck — como culpado. Entender o que um dock faz de verdade por dentro, e onde estão seus limites, evita comprar o acessório errado e diagnosticar feio depois.

A palavra-chave é **DisplayPort Alt Mode** combinado com um chip **MST** (Multi-Stream Transport), responsável por dividir um único stream de vídeo em várias portas físicas.

:::objetivos
- Entender a diferença entre um dock que só repassa vídeo e um que usa MST
- Identificar quais resoluções e taxas um dock entrega em cada porta
- Descobrir as portas reais do dock pelo nó DRM no sistema
- Diagnosticar por que o segundo monitor de um dock não acende
- Conhecer as limitações de energia e dados que acompanham cada dock
:::

## O que um dock faz, tecnicamente

Na saída USB-C do deck existe **um único** stream de vídeo (DisplayPort 1.4) e energia. O dock tem duas missões: separar esse stream em portas físicas (HDMI/DP) e, se tiver MST, **dividir** a largura de banda entre vários monitores simultâneos.

Sem MST, um dock com duas portas HDMI costuma espelhar o mesmo sinal nas duas — você não ganha monitores independentes, só cópias. Com MST, o dock reparte os 25,92 Gbps do DisplayPort 1.4 entre as telas, o que permite dois 4K@30, ou um 4K@60 mais um 1080p, e assim por diante.

<div style="opacity:0.6;font-size:0.9em">A tabela abaixo resume a conta de largura de banda:</div>

| Configuração | Largura necessária | Cabe no DP 1.4? |
|---|---|---|
| 1× 4K@60 | ~12,5 Gbps | Sim |
| 2× 1080p@60 | ~6,4 Gbps | Sim |
| 2× 4K@60 | ~25 Gbps | No limite (com DSC) |
| 1× 4K@120 | ~25 Gbps | Sim (com DSC) |

O deck, pela porta USB-C, entrega DisplayPort 1.4 com suporte a DSC — por isso consegue 4K@120 num monitor direto.

## Vendo o que o dock expõe ao sistema

Cada porta do dock vira um nó no diretório `/sys/class/drm/`, o que permite listar exatamente o que o sistema enxerga, independente do que a embalagem do dock promete:

```terminal
$ ls /sys/class/drm/card0-*
card0-eDP-1/  card0-HDMI-A-1/  card0-DP-1/  card0-DP-2/
```

Nesse exemplo o dock expõe um HDMI e **dois** DisplayPorts — a assinatura de um dock com MST ativo. Se aparecer só `HDMI-A-1`, o dock é do tipo repetidor simples e a segunda porta física provavelmente espelha a primeira.

O `kscreen-doctor -o` ecoa a mesma topologia com nomes amigáveis:

```terminal
$ kscreen-doctor -o
Output: 1 eDP-1
	...
Output: 2 HDMI-A-1
	...
Output: 3 DP-1
	...
Output: 4 DP-2
	...
```

:::dica
Antes de comprar um dock, decida o pior cenário que você vai rodar: dois 1080p? um 4K@60? um 4K@120? Procure um dock que anuncie **DisplayPort 1.4 + MST** e confira, no manual, a tabela de "modos suportados por porta" — docks sérios publicam isso.
:::

## Por que o segundo monitor não acende

O sintoma nº 1 dos docks é: pluga dois monitores, e só um liga. As causas, em ordem de probabilidade:

1. **O dock é repetidor, não MST** — a segunda porta espelha em vez de estender. Não há comando que resolva; é limitação de hardware.
2. **Falta de energia** — o dock não tem fonte própria e puxa tudo do deck, que limita o fornecimento a ~45 W. Com monitor pendurado, a entrega de vídeo cai.
3. **Largura de banda esgotada** — dois monitores pedindo resolução alta demais para o link.

Para distinguir (2) de (3), veja o log do daemon:

```terminal
$ journalctl -u kscreen
... kscreen.kded: output DP-2 failed link training
... kscreen.kded: insufficient bandwidth for requested modes
```

`link training failed` sugere elétrica (energia/cabo); `insufficient bandwidth` confirma que o MST estourou a conta. Para o caso de banda, reduza a resolução de um dos monitores:

```terminal
$ kscreen-doctor output.DP-2.mode.1920x1080@60
```

Ao baixar um dos dois para 1080p, o orçamento volta a caber e a segunda tela acende.

:::atencao
Um erro comum é conectar o monitor na **porta de carregamento** USB-C do dock (aquela marcada com energia) esperando vídeo. Nem toda porta USB-C de um dock repassa Alt Mode. Se o monitor não aparece nem como `Unknown`, há chance de ele estar numa porta só de dados.
:::

## Energia e dados: o outro limite do dock

O mesmo cabo que leva vídeo leva energia de volta para o deck. Docks **com fonte própria** entregam 60–100 W e ainda sobram watts para o deck carregar a bateria enquanto joga. Docks **passivo** (sem fonte) dependem de um carregador ligado à entrada do dock ou sugam do próprio deck.

```terminal
$ cat /sys/class/power_supply/BAT1/status
Charging
$ cat /sys/class/power_supply/BAT1/current_now
2450000
```

Um `status` em `Discharging` mesmo com o dock plugado denuncia que a entrega de energia é insuficiente — o deck consome mais do que recebe. Isso afeta indiretamente o vídeo, porque um deck que aquece e estrangula energia pode reduzir clocks e derrubar modos de tela altos.

## Resumo

- A porta USB-C do deck carrega um stream DisplayPort 1.4; o dock o divide em portas físicas.
- Docks com **MST** entregam monitores independentes; sem MST, a segunda porta apenas espelha.
- `/sys/class/drm/card0-*` lista as saídas reais que o dock expõe ao sistema.
- "Segundo monitor não acende" costuma ser dock repetidor, falta de energia ou banda de MST estourada.
- `journalctl -u kscreen` distingue causa elétrica (`link training failed`) de banda (`insufficient bandwidth`).
- A entrega de energia do dock (`Charging` vs `Discharging`) interfere na estabilidade do vídeo.

## Exercícios

1. Liste `/sys/class/drm/card0-*` e anote quantas e quais saídas o seu dock expõe.
2. Compare a lista acima com o `kscreen-doctor -o`: os nomes batem um a um? Há alguma saída que só aparece num dos dois?
3. Conecte dois monitores ao dock e registre, com `kscreen-doctor -o`, se os dois aparecem com `Geometry` distinta (extensão) ou idêntica (espelhamento).
4. Com os dois monitores em 4K, rode `journalctl -u kscreen` e procure mensagens de `bandwidth`. Depois reduza um para 1080p e veja se a mensagem some.
5. **Desafio.** Visualize o desempenho do dock sob carga: conecte um 4K@60, rode `cat /sys/class/power_supply/BAT1/status`, desconecte a fonte do dock e observe se o `status` muda para `Discharging` e se o monitor cai de resolução. Documente a cadeia causa→efeito.
