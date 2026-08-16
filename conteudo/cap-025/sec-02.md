Conectar o monitor é só metade do caminho. A outra metade é fazer o SteamOS escolher a resolução certa — e, quando ele erra, saber trocar para o modo que o painel realmente suporta. O KScreen normalmente acerta sozinho, mas dock genérico, cabo ruim ou monitor exótico fazem o sistema cair num modo conservador que deixa a imagem borrada ou limitada a 30 Hz.

Toda resolução e taxa de atualização de uma saída é um **modo** (mode), identificado por uma string. Aprender a ler e a aplicar esses modos na linha de comando é o que separa quem assiste o sistema decidir de quem comanda o próprio monitor.

:::objetivos
- Entender o formato de modo `resolução@taxa` do KScreen
- Listar os modos disponíveis de uma saída com `kscreen-doctor`
- Aplicar resolução e refresh rate específicos com `kscreen-doctor output.<id>.mode`
- Forçar um modo pelo `xrandr` quando o KScreen não colabora
- Diagnosticar por que um monitor cai em 4K@30 em vez de 4K@60
:::

## O formato de modo: `larguraxaltura@taxa`

Cada opção de resolução que um monitor anuncia vira uma entrada na lista de `Modes` do `kscreen-doctor -o`. O formato é direto: `1920x1080@60` significa 1920 pixels de largura, 1080 de altura, a 60 Hz. O mesmo painel costuma anunciar várias taxas para a mesma resolução.

Para ver o que uma saída específica oferece, filtre pela id:

```terminal
$ kscreen-doctor output.HDMI-A-1.modes
Output: 1 HDMI-A-1
	Modes:  1:1920x1080@60*!  2:1920x1080@50  3:1920x1080@59.94  5:1280x720@60  6:3840x2160@30  7:3840x2160@60
```

A saída revela um detalhe importante: o mesmo monitor 4K oferece `3840x2160@30` e `3840x2160@60`. O `@30` não é preguiça do sistema — é o teto de largura de banda quando o link HDMI é antigo (HDMI 1.4) e só suporta 4K a trinta quadros. O `@60` exige HDMI 2.0 ou DisplayPort.

## Aplicando um modo com kscreen-doctor

O subcomando `mode` troca a resolução e a taxa de uma vez. A sintaxe é `output.<id>.mode.<modo>`, onde o id vem do `kscreen-doctor -o` (por exemplo `HDMI-A-1`) e o modo é a string completa com `@`:

```terminal
$ kscreen-doctor output.HDMI-A-1.mode.1920x1080@60
$ kscreen-doctor -o
Output: 2 HDMI-A-1
	priority 1
	Modes:  1:1920x1080@60*  2:1920x1080@50  3:1920x1080@59.94
	Geometry: 1280,0 1920x1080
```

A confirmação vem na linha `Modes`, com o asterisco agora marcando `1920x1080@60` como ativo. A mudança é imediata: o monitor pisca uma fração de segundo durante a renegociação do link e volta já no novo modo.

Se você quiser o nome do id sem decorar, o `kscreen-doctor -o` sempre lista os ids entre parênteses no cabeçalho de cada saída.

:::atencao
Ordens de troca de modo podem **desativar** temporariamente outros monitores. O KScreen, ao aplicar um modo num monitor 4K, às vezes reavalia os demais. Se uma tela "sumir", não entre em pânico: rode `kscreen-doctor -o` para se situar e reative a saída com `kscreen-doctor output.<id>.enable`.
:::

## Quando o KScreen não oferece o modo que você quer

Nem sempre a resolução desejada aparece na lista. Isso acontece quando a EDID do monitor (o bloco de dados que descreve seus modos nativos) não é bem lida — comum em docks baratos. Aí o `xrandr` permite forçar um modo na marra, desde que o painel tecnicamente o suporte.

O fluxo tem duas etapas: criar o modo com `--newmode` e anexá-lo à saída com `--addmode`, antes de aplicá-lo com `--mode`:

```terminal
$ xrandr --newmode "1920x1080_60.00"  148.50  1920 2008 2052 2200  1080 1084 1089 1125 +hsync +vsync
$ xrandr --addmode HDMI-A-1 1920x1080_60.00
$ xrandr --output HDMI-A-1 --mode 1920x1080_60.00
```

Os números enormes (148.50, 2008, 2052...) são os **timings** do modo — a frequência de pixel e os intervalos de sincronismo. Você não precisa calculá-los: o utilitário `cvt` gera essa linha pronta para você.

```terminal
$ cvt 1920 1080 60
# 1920x1080 59.96 Hz (CVT 2.07M9) hsync: 67.16 kHz; pclk: 173.00 MHz
Modeline "1920x1080_60.00"  173.00  1920 2048 2248 2576  1080 1083 1088 1120 -hsync +vsync
```

Ao contrário do `kscreen-doctor`, o modo criado pelo `xrandr` é **volátil**: some ao reiniciar. Ele existe para destravar uma tela na hora, não para ser sua configuração permanente.

## Por que 4K cai em 30 Hz (e como salvar em 60)

A causa quase sempre é o caminho HDMI. Um dock com porta HDMI 1.4 limita o 4K a 30 Hz, porque 1.4 só carrega 10,2 Gbps. Para 4K@60 você precisa de HDMI 2.0 (18 Gbps) ou, preferível, uma saída DisplayPort no dock.

```terminal
$ kscreen-doctor output.HDMI-A-1.modes
Output: 2 HDMI-A-1
	Modes:  6:3840x2160@30*  7:3840x2160@60
$ kscreen-doctor output.HDMI-A-1.mode.3840x2160@60
```

Se o `3840x2160@60` existe na lista mas a imagem fica preta ou piscando ao aplicá-lo, o cabo ou o dock não sustenta a largura de banda. Troque para um cabo HDMI certificado 2.0 ou use uma saída DisplayPort do dock. O deck em si tem potência de sobra pela porta USB-C para 4K@60 — o gargalo está no periférico.

:::dica
Para conferir se o modo ativo é mesmo o que você pediu, em vez de confiar só no asterisco, verifique o `Geometry` no `kscreen-doctor -o`. Ele mostra a resolução **efetivamente entregue** no momento, não a que o monitor diz suportar.
:::

## Resumo

- Modos têm o formato `larguraxaltura@taxa`, como `1920x1080@60`.
- `kscreen-doctor output.<id>.modes` lista os modos; `output.<id>.mode.<modo>` aplica um.
- O asterisco no `kscreen-doctor -o` marca o modo ativo; o `!` marca o preferido.
- `xrandr --newmode` + `--addmode` + `--mode` forçam um modo ausente, de forma volátil.
- 4K limitado a 30 Hz indica HDMI 1.4 ou cabo/dock sem largura de banda para HDMI 2.0.

## Exercícios

1. Liste os modos da sua tela interna com `kscreen-doctor output.eDP-1.modes` e identifique qual está ativo (`*`) e qual é o preferido (`!`).
2. Aplique uma resolução menor no monitor externo (`kscreen-doctor output.HDMI-A-1.mode.1280x720@60`), confirme com `-o`, e depois volte para o modo nativo.
3. Gere um modo 1080p com `cvt 1920 1080 60` e explique para que servem os números da linha `Modeline`.
4. Seu monitor está em 4K@30? Verifique com `kscreen-doctor output.HDMI-A-1.modes` se o `@60` existe e tente aplicá-lo, registrando o que acontece.
5. **Desafio.** Combine o que aprendeu nesta e na seção anterior: force via `xrandr` o modo `1920x1080_60.00` gerado pelo `cvt`, confirme no `xrandr --query`, e reinicie o deck para provar que a alteração é volátil.
