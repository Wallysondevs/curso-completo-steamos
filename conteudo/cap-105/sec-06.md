O armazenamento do Steam Deck é a fronteira entre conforto e crise. Os jogos modernos são enormes — um único AAA pode passar de 100 GB — e o SSD interno (64 GB nos modelos antigos e o slot microSD) enche mais rápido do que você imagina. Pior: um microSD corrompido ou uma partição cheia pode causar de jogo que não inicia até travamento do sistema inteiro. Esta seção trata de disco cheio, microSD problemático e corrupção.

Uma peculiaridade do SteamOS vale destaque desde já: o **shader cache** e o **compatdata** (dados de prefixo Proton) moram no SSD interno, mesmo que o jogo esteja no microSD. Então um microSD espaçoso não impede que o disco interno estoure com shaders. Esse detalhe explica metade dos "disco cheio misterioso".

:::objetivos
- Diagnosticar por que o disco está cheio com `df` e `du`
- Encontrar e limpar shader cache, compatdata e arquivos órfãos com segurança
- Recuperar um microSD que "sumiu" ou não monta
- Corrigir arquivos de sistema com `fsck` e reconhecer sinais de corrupção
- Saber quando o problema é hardware (SSD/microSD falhando) em vez de espaço
:::

## Tabela de armazenamento

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Disco cheio" mas você não baixou nada | Shader cache e compatdata acumulados | `du -sh ~/.local/share/Steam/steamapps/shadercache` e `compatdata`; remova os de jogos desinstalados |
| Jogo não instala: "espaço insuficiente" | Partição `/home` cheia, download temporário | `df -h` confirma; apague shader cache órfão e downloads antigos |
| Jogos instalados no microSD "sumiram" | microSD desmontou, corrompeu, ou leitor sujo | `lsblk` vê o dispositivo? Remonte; `sudo dmesg | tail` mostra erro de I/O |
| microSD não monta, formato desconhecido | exFAT/EXT4 com erro, particionamento ilegível | `sudo fdisk -l /dev/mmcblk0`; `fsck.exfat` ou `fsck.ext4` conforme o formato |
| microSD extremamente lento | Cartão falsificado/classe baixa, ou morrendo | `hdparm -t /dev/mmcblk0` mede; compare com a classe; se < 20 MB/s, desconfie |
| Jogo fecha sozinho ao jogar do microSD | I/O do cartão falhando, microSD desconectou | `sudo dmesg | grep -i mmc`; reencaixe o cartão; teste outro |
| Erros de "read-only filesystem" no boot | Partição montada em leitura por erro detectado | `mount | grep ' ro,'`; rode `fsck -f` pela recuperação |
| NVMe "sumiu" da BIOS | SSD solto ou falhando | Reencaixe o NVMe; `smartctl -a /dev/nvme0n1` vê saúde do SSD |

## O disco cheio misterioso: shader cache e compatdata

O primeiro comando diante de qualquer "cheio" é o `df`, que mostra o uso por partição, não por pasta:

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p5   14G  2.1G   11G  16% /
/dev/nvme0n1p8  200G  194G  5.9G  98% /home
```

No exemplo, a partição `/home` (que no Steam Deck guarda jogos, shaders e dados de usuário) está em 98%. Para descobrir **o que** consome, entre com `du`, que soma por diretório:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/*
 24G  ~/.local/share/Steam/steamapps/common
 18G  ~/.local/share/Steam/steamapps/compatdata
 12G  ~/.local/share/Steam/steamapps/shadercache
  9K  ~/.local/share/Steam/steamapps/libraryfolders.vdf
```

Três pastas dominam e cada uma conta uma história:

- **`common`** — os jogos em si. Aqui você desinstala da forma normal (via Steam).
- **`compatdata`** — os prefixos Wine/Proton (um por jogo, nomeado pelo `appid`). Se você desinstalou um jogo pelo Steam, o prefixo normalmente sai junto; órfãos ficam quando a desinstalação falha.
- **`shadercache`** — shaders pré-compilados. São grandes, regeneráveis e, no Steam Deck, às vezes sobram de jogos que já saíram.

```terminal
# Encontrar os maiores diretórios de shader cache:
$ du -sh ~/.local/share/Steam/steamapps/shadercache/* | sort -rh | head -10
$ du -sh ~/.local/share/Steam/steamapps/compatdata/* | sort -rh | head -10
```

:::atencao
O `compatdata` guarda **saves e configurações** de jogos não-Steam (e de alguns Steam sem cloud). Não apague prefixos às cegas — identifique o `appid` correspondente antes. O shader cache, por outro lado, é seguro de apagar: ele se regenera na próxima execução (o jogo só recompila, sem perda).
:::

## O microSD que sumiu ou não monta

O leitor microSD do Deck é sensível, e cartões de procedência duvidosa (vendidos como "256 GB" a preço de 32 GB) são epidemia. O processo de recuperação:

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
mmcblk0     179:0    0 238.5G  0 disk
└─mmcblk0p1 179:1    0 238.5G  0 part

$ sudo fdisk -l /dev/mmcblk0
Disk /dev/mmcblk0: 238.5 GiB, 256060514304 bytes, 500118192 sectors
```

Se o `lsblk` **não mostra `mmcblk0`**, o cartão não foi detectado pelo hardware — reencaixe fisicamente (às vezes o contato oxida). Se aparece mas não monta, veja o `dmesg`:

```terminal
$ sudo dmesg | tail -20
[ ...] mmcblk0: error -110 transferring data, sector 0, nr 8, cmd response 0x900
[ ...] blk_update_request: I/O error, dev mmcblk0, sector 0 op 0x0:(READ)
```

Erros como `I/O error` ou `-110` em cascata indicam cartão falhando. Se for só o filesystem, o `fsck` (adequado ao formato) resolve:

```terminal
$ sudo fsck.exfat /dev/mmcblk0p1      # se for exFAT
$ sudo fsck.ext4 -f /dev/mmcblk0p1    # se for ext4
```

O SteamOS formata microSD como **ext4** por padrão quando você formata pelo Modo Jogo; o exFAT aparece quando o cartão veio formatado de fábrica (e é o que dá compatibilidade com Windows).

```terminal
# Medir a velocidade real (revela cartão falso ou morrendo):
$ sudo hdparm -t /dev/mmcblk0
 Timing buffered disk reads: 84 MB in 3.02 seconds = 27.8 MB/sec
```

Um cartão UHS-I genuíno de boa classe entrega 80–100 MB/s de leitura. Se o seu marca 20 MB/s ou menos, ele é falsificado ou está em colapso — a velocidade baixa também explica jogo que fecha sozinho jogando do cartão.

:::dica
MicroSD é consumível. Um cartão que já deu erro de I/O uma vez tende a dar de novo. Faça backup do conteúdo e considere substituir em vez de insistir. O custo de um cartão novo é menor que a perda de um save ou de horas de re-download.
:::

## Corrupção de filesystem e o "read-only"

O Linux protege o sistema montando uma partição **read-only** quando detecta erro de baixo nível — é um mecanismo de segurança, não um defeito em si. Se o Deck "perdeu" a capacidade de gravar (nada salva, tudo dá permission denied), desconfie:

```terminal
$ mount | grep ' ro,'
/dev/nvme0n1p8 on /home type ext4 (ro,relatime)
```

A presença de `ro` na montagem confirma que a partição entrou em read-only. A solução é verificar e remontar:

```terminal
# Pela imagem de recuperação (recomendado — partição desmontada):
# fsck -f /dev/nvme0n1p8
# mount -o remount,rw /home
```

O estado read-only também pode vir de um update que montou errado (raro) ou de dados corrompidos por shutdown forçado durante gravação. O `fsck -f` corrige a estrutura; se os dados em si estão truncados, o backup (cap. 104) é a única saída.

## Saúde do SSD com smartctl

Diferente do microSD, o NVMe interno tem suporte a S.M.A.R.T., que reporta antes mesmo de a falha acontecer:

```terminal
$ sudo smartctl -a /dev/nvme0n1
...
Data Units Written:              42,812,903 [21.9 TB]
Power On Hours:                  6,412
Percentage Used:                 3%
...
Critical Warning:                0x00
Temperature:                     38 Celsius
```

Os campos a vigiar são **Critical Warning** (qualquer valor diferente de `0x00` é alerta) e **Percentage Used** (percentual de vida consumido pelas escritas). Um SSD com `Percentage Used` alto e `Critical Warning` ativo está perto do fim — faça backup e troque (o capítulo de upgrade de SSD cobre a troca).

:::nota
Referências aprofundadas: shader cache na Steam (cap. 8, steam cloud), armazenamento e partições (cap. 4 e 6), LVM/Btrfs e filesystems (cap. 46–55), e upgrade de SSD físico (cap. 84).
:::

## Resumo

- "Disco cheio" quase sempre é shader cache + compatdata, não jogo — chegue com `du`, não com suposição.
- Shader cache é seguro apagar (regenera); compatdata guarda saves, não apague às cegas.
- `lsblk` + `dmesg` diferenciam microSD não detectado (hardware) de filesystem corrompido (fsck resolve).
- Velocidade real baixa no `hdparm` revela cartão falso ou morrendo — backup e troca.
- Partição em `ro` é proteção do kernel após erro; `fsck` + remount `rw`.
- S.M.A.R.T. (smartctl) antecipa falha do NVMe via Critical Warning e Percentage Used.

## Exercícios

1. Execute `df -h` e anote o uso de `/home`. Depois `du -sh ~/.local/share/Steam/steamapps/*`. Quais pastas dominam e quanto somam?
2. Liste o shader cache com `du -sh ~/.local/share/Steam/steamapps/shadercache/* | sort -rh | head`. Há entradas de jogos que você já desinstalou? Identifique os appids.
3. Insira um microSD e execute `lsblk`, `fdisk -l /dev/mmcblk0` e `hdparm -t /dev/mmcblk0`. Compare a velocidade medida com a classe do cartão.
4. Formate um microSD de teste em ext4 (pelo SteamOS) e outro em exFAT. Registre qual formato o SteamOS adotou por padrão e os comandos `fsck` correspondentes a cada um.
5. **Desafio.** Execute `sudo smartctl -a /dev/nvme0n1` e anote Critical Warning, Percentage Used e Temperature. Interprete: seu SSD está saudável? Quanto de vida sobrou e o que isso significa na prática?