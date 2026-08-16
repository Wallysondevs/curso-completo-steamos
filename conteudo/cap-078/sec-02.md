Trocar o kernel do Steam Deck não é como instalar um tema ou trocar o papel de parede. O linux-neptune existe por um motivo: ele carrega drivers que não estão no kernel mainline e aplica patches de latência que fazem diferença mensurável em jogos. Dito isso, existem cenários legítimos para querer um kernel diferente — e entender esses cenários ajuda a decidir se vale a pena o esforço e o risco.

:::objetivos
- Identificar os três cenários em que trocar o kernel do Deck faz sentido
- Avaliar o custo-benefício: performance versus perda de drivers customizados
- Compreender os tradeoffs de latência, throughput e compatibilidade de hardware
- Saber o que acontece com os módulos Valve ao trocar de kernel
:::

## Cenário 1: Kernel mais novo para hardware mais novo

O SteamOS 3.6 usa kernel 6.5. Se você conecta um dock USB-C com chip de rede que só ganhou driver estável no kernel 6.8, ou uma GPU externa que precisa de uma versão mais recente do `amdgpu`, o linux-neptune simplesmente não reconhece o dispositivo. A saída do `dmesg` entrega o diagnóstico:

```terminal
$ sudo dmesg | grep -i 'firmware\|missing\|unknown' | head -6
[    4.123456] r8152 4-1.2:1.0: unknown chip version
[    4.234567] r8152 4-1.2:1.0 (unnamed net_device) (uninitialized): device not supported
```

Nesse caso, um kernel 6.8 ou superior traria o driver `r8152` atualizado e o adaptador Ethernet USB funcionaria imediatamente. Este é o motivo mais pragmático para trocar de kernel: hardware novo que o kernel atual não cobre.

:::atencao
Nem todo dispositivo não reconhecido é culpa do kernel. Às vezes é firmware ausente. Antes de trocar o kernel, verifique se o pacote `linux-firmware` está atualizado e se o firmware específico do seu dispositivo está presente em `/usr/lib/firmware/`.
:::

## Cenário 2: Latência de áudio e escalonamento

O kernel linux-neptune usa o escalonador CFS (Completely Fair Scheduler) padrão, com algumas configurações de preempção. Kernels alternativos como o Xanmod ou o Liquorix aplicam patches de escalonamento (BMQ, PDS, BORE) e configurações de preempção mais agressivas que reduzem a latência máxima em cenários de carga mista — quando o jogo disputa CPU com processos de fundo.

A diferença é mensurável com `cyclictest`:

```terminal
$ sudo cyclictest -t 4 -p 99 -i 200 -l 100000 -q
# Com linux-neptune (CFS):
T: 0 (  4567) P:99 I:200 C: 100000 Min:      7 Act:   12 Avg:   11 Max:     247
T: 1 (  4568) P:99 I:200 C: 100000 Min:      6 Act:   11 Avg:   10 Max:     189

# Com Xanmod (BORE):
T: 0 (  5123) P:99 I:200 C: 100000 Min:      5 Act:    8 Avg:    8 Max:      74
T: 1 (  5124) P:99 I:200 C: 100000 Min:      5 Act:    9 Avg:    8 Max:      68
```

A latência máxima caiu de ~247 µs para ~74 µs. Para áudio em tempo real (guitarra, microfone, monitoring), essa diferença é audível. Para jogos, o ganho é marginal — mas mensurável em títulos que exigem reflexo e onde o sistema faz streaming simultâneo.

## Cenário 3: Suporte a sistema de arquivos ou funcionalidade experimental

O kernel mainline ganha novos sistemas de arquivos, melhorias em Btrfs e suporte a features como `NTFS3` (driver nativo NTFS da Paragon) que podem não estar habilitadas no linux-neptune. Se você precisa de `bcachefs` ou quer testar `kSMBD` (servidor SMB no kernel), um kernel mais novo resolve.

```terminal
$ zgrep -i 'bcachefs\|ntfs3\|ksmbd' /proc/config.gz || echo "não disponível no linux-neptune"
não disponível no linux-neptune
```

## O que se perde ao trocar o kernel

Ao instalar um kernel que não seja o linux-neptune, os seguintes módulos **deixam de existir**:

| Módulo | Consequência da perda |
|---|---|
| `steamdeck_hid` | Botões extras, touchpads e giroscópio param de funcionar |
| `steamdeck_fan` | Ventoinha volta para controle de BIOS (menos granular) |
| `jupiter_button` | Botão Steam e botões de volume perdem funcionalidade extra |
| `steamdeck_gyro` | Giroscópio deixa de ser exposto ao sistema |

A Valve mantém esses drivers fora do mainline por enquanto. Se você precisa deles, a única opção é aplicar os patches manualmente no kernel novo — o que exige compilar do zero, não apenas instalar um binário.

:::perigo
Trocar o kernel e perder o `steamdeck_fan` significa que a ventoinha pode não responder corretamente a picos de temperatura. Se o controle de BIOS não for suficiente, o Deck pode sofrer thermal throttling ou, no pior caso, desligamento por proteção térmica. Monitore `sensors` após a troca.
:::

## Resumo

- Três cenários justificam trocar o kernel: hardware novo sem suporte, redução de latência e funcionalidades experimentais ausentes no linux-neptune.
- Antes de trocar, verifique firmware (`linux-firmware`) e diagnóstico com `dmesg` — nem tudo é kernel.
- Kernels alternativos reduzem latência máxima (de ~250 µs para ~70 µs), mas o ganho em jogos é marginal.
- Ao trocar de kernel, os módulos Valve (`steamdeck_hid`, `steamdeck_fan`, `steamdeck_gyro`) deixam de existir.
- A perda do controle de ventoinha é o risco mais grave; monitore temperaturas com `sensors` após a troca.

## Exercícios

1. Liste todos os módulos Valve em execução: `lsmod | grep -iE 'steam|jupiter|neptune'`. Para cada um, explique o que ele controla e o que aconteceria se fosse removido.
2. Execute `zgrep -i 'bcachefs\|ntfs3' /proc/config.gz`. Quantos sistemas de arquivos experimentais estão ausentes no seu kernel atual?
3. Instale o `rt-tests` e rode `sudo cyclictest -t 4 -p 99 -i 200 -l 100000 -q`. Anote sua latência máxima. Esse valor seria problemático para áudio em tempo real?
4. Conecte um dispositivo USB que você tem (dock, adaptador, teclado) e inspecione `sudo dmesg -w` enquanto conecta. O kernel atual reconhece todos os chips?
5. **Desafio.** Compare a configuração do linux-neptune (`/proc/config.gz`) com a de um kernel mainline da mesma versão. Quais opções específicas do Deck estão habilitadas como `=y` no neptune que seriam `=m` ou estariam ausentes no mainline?