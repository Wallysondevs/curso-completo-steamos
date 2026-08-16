As oito seções anteriores cobriram cada tipo de acessório em detalhe. Falta juntar tudo num plano coerente: o que comprar primeiro, quanto custa um setup completo e como confirmar, com comandos, que o ecossistema de acessórios está funcionando junto. Esta seção fecha o capítulo com três cenários reais de uso: o setup essencial, o setup desktop completo e o setup do atirador de fone e microSD em promoção.

:::objetivos
- Montar um plano de aquisição de acessórios em ordem de prioridade
- Estimar o custo real de um setup completo (essencial, desktop e avançado)
- Validar todo o ecossistema de acessórios com uma sessão de diagnóstico
- Identificar conflitos — acessórios que, juntos, pioram a experiência
- Planejar manutenção e troca periódica dos acessórios
:::

## Três cenários, três orçamentos

Cada pessoa usa o Deck de um jeito. Os cenários abaixo refletem três perfis reais de uso, com acessórios em ordem de compra. Valores são ilustrativos (dólar convertido em faixas), mas a ordem de prioridade é o que importa.

**Setup essencial** (~R$ 120-200): película de vidro temperado, fonte USB-C PD 45 W sobressalente, microSD 256 GB A2.

**Setup desktop** (adicional ~R$ 400-700): dock com HDMI e PD, teclado USB barato, mouse com fio ou Bluetooth, monitor 1080p (se não tiver).

**Setup avançado** (adicional ~R$ 600-1000): grip de silicone ou case híbrido, DAC USB-C, SSD NVMe externo 512 GB em enclosure, controle extra (DualSense ou Xbox).

```terminal
$ df -h / /run/media/deck/mmcblk0p1
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p6  468G  312G  138G  69% /
/dev/mmcblk0p1  256G   92G  155G  37% /run/media/deck/mmcblk0p1
```

O `df` mostra o balanço final: 69% de uso no SSD interno e 37% no microSD. Se o interno estivesse em 90%, o microSD de 256 GB foi a compra certa; se estivesse em 40%, talvez a prioridade fosse outra. O orçamento começa pelos números.

## Sessão de diagnóstico: tudo conectado ao mesmo tempo

Depois de montar o setup, uma bateria de comandos confirma que tudo está se falando. A ordem importa: ligue o monitor primeiro, depois o dock, depois plugue o Deck, e só então conecte periféricos.

```terminal
$ sudo dmesg | grep -i -E 'altmode|usb|typec' | tail -10
[   12.344120] typec port0: alt mode 0: DisplayPort 1.4
[   12.345001] typec port0: alt mode 0: DisplayPort 1.4 active
[   15.221440] usb 1-1: new high-speed USB device number 5 using xhci_hcd
[   15.374892] usb 1-1: New USB device found, idVendor=0bda, idProduct=9210
[   15.376120] input: Logitech K120 as /devices/.../input/input9
[   15.512301] usb 1-1.1: New USB device found, idVendor=1038, idProduct=1720
```

A sequência do `dmesg` conta a história do boot do setup: primeiro a negociação DisplayPort, depois a detecção do hub USB (Realtek `0bda:9210`), e então teclado e mouse aparecem como dispositivos filhos do hub. Tudo em ordem.

```terminal
$ lsusb
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 005: ID 28de:1205 Valve Software Steam Deck
Bus 001 Device 006: ID 0bda:9210 Realtek Semiconductor Corp. RTL9210 M.2 NVMe Adapter
Bus 001 Device 007: ID 046d:c31c Logitech, Inc. Wireless Keyboard K120
Bus 001 Device 008: ID 1038:1720 SteelSeries ApS Rival 3
```

Seis dispositivos: hubs internos, controlador do Deck, gabinete NVMe, teclado e mouse. É o `lsusb` de um setup desktop completo funcionando.

## Conflitos: quando dois acessórios brigam

Nem todo setup funciona de primeira. Conflitos comuns:

- **Dock + hub USB na mesma porta:** não faz sentido — o dock já é um hub. Mas se você colocar um hub passivo entre o Deck e o dock, a negociação de alt-mode se perde porque o hub não encaminha DisplayPort. Resultado: dados funcionam, vídeo não.
- **Case + dock:** alguns grips grossos não deixam o Deck encaixar no dock oficial da Valve. Meça a espessura do grip na base (onde fica o USB-C) antes de comprar o dock.
- **Fones Bluetooth + microfone:** no modo headset (áudio + microfone), a taxa de áudio cai drasticamente porque o codec passa de A2DP para HSP/HFP. Para jogar só ouvindo, use o modo estéreo (A2DP); o microfone do Deck embutido funciona independente.

```terminal
$ pactl list cards short
0	alsa_card.pci-0000_05_00.6	PipeWire
1	bluez_card.88_C9_E8_3B_1A_02	PipeWire
$ pactl set-card-profile bluez_card.88_C9_E8_3B_1A_02 a2dp-sink
```

Se o fone Bluetooth estiver em modo headset e o som parecer de telefone, force o perfil `a2dp-sink` como acima. O áudio volta à qualidade estéreo, mas o microfone do fone para de funcionar — o trade-off inevitável do Bluetooth.

## Manutenção e vida útil

Acessórios duram, mas não são eternos. A tabela de vida útil esperada ajuda a planejar reposições:

| Acessório | Vida útil típica | Sinal de troca |
|---|---|---|
| Película | 12-18 meses | Trincas, descolamento, oleofóbico gasto |
| Case / grip | 2-3 anos | Ressecamento, perda de aderência |
| Cabo USB-C | 2-4 anos | Dobras, conexão intermitente |
| microSD | 3-5 anos (uso moderado) | Erros de leitura, corrupção, `Data LOST > 0` |
| Dock | 3-5 anos | Portas frouxas, perda de alt-mode |
| Fonte PD | 3-5 anos | `voltage_max` inconsistente |

```terminal
$ sudo f3read /run/media/deck/mmcblk0p1 | grep 'Data LOST'
Data LOST: 0.00 Byte (0 sectors)
```

Execute o `f3read` a cada 6 meses no microSD. Se `Data LOST` deixar de ser zero, o cartão começou a corromper dados — aposente-o antes que ele corrompa um save importante. É a manutenção mais barata e mais negligenciada do ecossistema de acessórios.

:::dica
Uma vez por semestre, reserve 20 minutos para a "inspeção geral": `lsusb` para confirmar periféricos, `f3read` no microSD, `sensors` com e sem case, `pactl list short sinks` para áudio, e `cat /sys/class/power_supply/BAT1/energy_full` para monitorar a saúde da bateria. Vinte minutos que evitam semanas de frustração.
:::

## A última regra: não compre o que não dói

O capítulo termina onde começou. Acessório não é coleção — é solução. Cada real gasto sem uma dor real por trás é um real que poderia ter ido para um jogo ou para um upgrade que importa. Se depois de ler estas nove seções você só comprar uma película e um microSD, e confirmar com `lsusb`, `f3read` e `sensors` que ambos funcionam direito, o capítulo cumpriu o propósito.

```terminal
$ df -h / /run/media/deck/mmcblk0p1
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p6  468G  218G  232G  46% /
/dev/mmcblk0p1  256G   91G  156G  37% /run/media/deck/mmcblk0p1
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/voltage_max
15000000
$ cat /sys/class/power_supply/BAT1/capacity
85
```

SSD com folga de 46%, microSD com 37% ocupado, PD negociado a 15 V, bateria a 85% e carregando. É o retrato de um setup que funciona. O terminal não mente — e agora você tem as ferramentas para montar o seu e confirmar que ele funciona também.

## Resumo

- Priorize acessórios por cenário real de uso: essencial (película, fonte, microSD), desktop (dock, teclado, mouse), avançado (grip, DAC, SSD externo).
- Uma sessão de diagnóstico com `dmesg`, `lsusb`, `pactl`, `df` e `/sys/class/power_supply/` valida todo o ecossistema de uma vez.
- Conflitos comuns incluem dock+hub (perde alt-mode), case+dock (não encaixa) e Bluetooth headset (áudio degradado).
- Acessórios têm vida útil; `f3read` semestral no microSD e inspeção de `energy_full` previnem perda de dados e degradação silenciosa.
- Compre o que resolve uma dor medida por você — não o que o YouTube diz que é indispensável.

## Exercícios

1. Monte, por escrito, seu plano de aquisição pessoal em três camadas (essencial, desktop, avançado) com base no seu uso real do Deck e nos preços atuais de mercado.
2. Conecte todos os acessórios que você tem e rode a sessão de diagnóstico completa: `dmesg`, `lsusb`, `df`, `pactl list short sinks`, `cat /sys/class/power_supply/BAT1/capacity` e `cat /sys/class/power_supply/ucsi-source-psy-*/voltage_max`. Tudo está como esperado?
3. Identifique um conflito potencial no seu setup (ex.: grip não encaixa no dock, fone Bluetooth ativa modo headset) e, se tiver os acessórios, reproduza-o e documente o comportamento.
4. Execute o `f3read` em todos os seus microSDs e SSDs externos. Algum deles reportou `Data LOST > 0`?
5. **Desafio.** Crie um script de diagnóstico que rode todos os comandos de validação deste capítulo em sequência e salve a saída num arquivo `/home/deck/lab/diagnostico-$(date +%Y%m%d).txt`. Agende a execução com `systemd-timer` para rodar a cada 3 meses. Descreva o que cada seção do relatório revela sobre a saúde do ecossistema de acessórios e como você interpretaria mudanças entre dois relatórios consecutivos.