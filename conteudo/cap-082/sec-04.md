O Steam Deck vem com 64 GB, 256 GB ou 512 GB internos (e até 1 TB no OLED), mas jogos modernos passam de 100 GB, e a biblioteca descarrega rápido. O slot microSD UHS-I na borda inferior é a expansão mais barata que existe, e um SSD NVMe externo pelo USB-C é o caminho para quem quer velocidade sem abrir o aparelho. Saber medir o que cada mídia entrega é o que evita comprar cartão falsificado ou disco lento.

:::objetivos
- Entender as classes de velocidade de microSD e o que importa no Deck
- Montar e inspecionar cartões e discos externos no SteamOS
- Medir a velocidade real de leitura e escrita de cada mídia
- Detectar cartões falsificados ou com capacidade adulterada
- Escolher entre microSD, SSD externo e troca do NVMe interno
:::

## O que importa num microSD para o Deck

O slot do Steam Deck segue o padrão **UHS-I**, com teto teórico de 104 MB/s de leitura. Na prática, cartões bons entregam entre 80 e 95 MB/s de leitura sequencial; a escrita costuma ser bem mais baixa. Jogos carregam texturas continuamente, então leitura **aleatória** importa mais que a sequencial.

As classes não contam a história toda, mas são o primeiro filtro. A marca "A2" (Application Performance Class 2) indica um mínimo de operações de entrada/saída por segundo (IOPS) para rodar apps — exatamente o caso de uso de jogos.

| Marcação | Significado prático no Deck |
|---|---|
| UHS-I | Padrão do slot; velocidade de barramento até 104 MB/s |
| U3 / V30 | Escrita sustentada mínima de 30 MB/s |
| A1 / A2 | Classe de IOPS aleatórios; A2 é melhor para jogos |
| SDXC | Capacidades de 64 GB a 2 TB |

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E 'mmcblk|nvme'
mmcblk0                256G disk
└─mmcblk0p1            256G part /run/media/deck/mmcblk0p1
nvme0n1                512G disk
├─nvme0n1p1            64M  part
├─nvme0n1p8            256M part
└─nvme0n1p6            511G part /
```

Aqui o `mmcblk0` é o microSD de 256 GB montado em `/run/media/deck/`, e o `nvme0n1` é o SSD interno de 512 GB. O SteamOS monta cartões automaticamente ao inseri-los — não é preciso `mount` manual no uso normal.

## Medindo a velocidade de verdade

A especificação na caixa é uma promessa. A velocidade real — e, mais importante, a integridade do cartão — se mede. A ferramenta `f3` (Fight Flash Fraud) existe exatamente para isso.

```terminal
$ sudo f3write /run/media/deck/mmcblk0p1
Free space: 176.23 GB
Creating file 1.h2w ... OK!
Creating file 2.h2w ... OK!
...
Average writing speed: 82.17 MB/s
```

O `f3write` preenche o cartão com arquivos de teste enquanto mede a escrita. Depois, o `f3read` relê tudo para confirmar que os dados gravados realmente existem — a parte que flagra fraude.

```terminal
$ sudo f3read /run/media/deck/mmcblk0p1
                  SECTORS      ok/corrupted/changed/overwritten
Validating file 1.h2w ... 2097152/        0/      0/      0
...
  Data OK: 176.23 GB (369783808 sectors)
Data LOST: 0.00 Byte (0 sectors)
```

`Data LOST: 0.00 Byte` é o selo de que o cartão entrega tudo que anuncia. Cartão falsificado "de 1 TB" costuma, na verdade, ter 32 GB — o controlador mente sobre a capacidade e, quando os dados passam do limite real, eles se corrompem silenciosamente. O `f3read` pega exatamente esse golpe.

:::perigo
Nunca confie num cartão recém-comprado sem testar. O golpe comum é um microSD que reporta 512 GB mas só grava 32 GB: o jogo instala, parece funcionar, e semanas depois os saves corrompem. Rode `f3write` + `f3read` em **todo** cartão novo antes de confiar nele para a biblioteca de jogos.
:::

## SSD externo e o caminho rápido

Para quem quer velocidade de verdade sem abrir o aparelho, um SSD NVMe num gabinete USB-C (enclosure) é a solução. Pela porta USB 3.2 Gen 2 do Deck, ele alcança perto de 1 GB/s — dez vezes um microSD.

```terminal
$ sudo dmesg | grep -i -E 'usb|uas|nvme' | tail -4
[  301.223110] usb 4-1: new SuperSpeed Plus Gen 2x1 USB device number 2 using xhci_hcd
[  301.224883] usb 4-1: New USB device found, idVendor=0bda, idProduct=9210
[  301.226401] scsi host6: uas
[  301.228156] scsi 6:0:0:0: Direct-Access     Realtek  RTL9210B-CG      1.00 PQ: 0 ANSI: 6
```

O `dmesg` revela dois detalhes importantes. Primeiro, `SuperSpeed Plus Gen 2x1` confirma o link USB 3.2 Gen 2 (10 Gbps). Segundo, `uas` (USB Attached SCSI) indica que o gabinete usa o protocolo moderno, mais rápido que o antigo `usb-storage`. Um enclosure com chip Realtek RTL9210 é das escolhas mais confiáveis para esse fim.

Para medir a velocidade, o `hdparm` dá uma leitura sequencial rápida e sem dependências:

```terminal
$ sudo hdparm -t /dev/sda
/dev/sda:
 Timing buffered disk reads: 918 MB in  3.01 seconds = 305.28 MB/sec
```

Os 305 MB/s aqui são a leitura do SSD externo através do gabinete. É menos que o NVMe interno entregaria direto no slot, mas ainda é uma ordem de grandeza acima do microSD.

:::dica
Para jogar direto de um SSD externo, basta mover a biblioteca no Steam: nas configurações, adicione a pasta do disco externo como biblioteca de instalação. O SteamOS monta o disco e o Steam enxerga. Só evite desconectar o disco com o jogo aberto — remoção a quente sem ejetar corrompe o sistema de arquivos.
:::

## NVMe interno: quando vale trocar

O modelo de 64 GB usa um SSD eMMC soldado e um slot NVMe M.2 2230 vazio em alguns revision — mas a forma mais segura de expansão permanente é trocar o NVMe nos modelos que permitem. Isso, porém, exige abrir o aparelho, o que anula garantia e expõe riscos.

```terminal
$ sudo smartctl -a /dev/nvme0n1 | grep -E 'Model|Capacity|Percentage Used'
Model Number:                       KIOXIA BG5 KBG50ZNV512G
Total NVM Capacity:                 512.110.190.592 [512 GB]
Percentage Used:                    3%
```

O `smartctl` lê os dados SMART do disco interno: modelo, capacidade real e o desgaste acumulado (`Percentage Used`). Um disco com 3% usado está praticamente novo; perto de 100%, é hora de pensar em troca. Antes de qualquer troca física, leia os dados e decida se a expansão por microSD/SSD externo já não resolve.

```terminal
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p6  468G  312G  138G  69% /
```

Quando o `df` da raiz mostra `Use%` perto de 90%, a jogada mais barata não é trocar disco, e sim mover jogos pouco usados para o microSD ou para o SSD externo.

:::atencao
Trocar o NVMe interno do Steam Deck exige ferramenta adequada, desconectar a bateria antes e clonar ou reinstalar o SteamOS. Um escorregão danifica o conector e o aparelho. Para a maioria das pessoas, microSD + SSD externo resolvem o problema de espaço com risco zero. Troca de NVMe é projeto, não upgrade casual.
:::

## Resumo

- O slot microSD é UHS-I (até ~104 MB/s); a classe A2 favorece leitura aleatória de jogos.
- `lsblk` mostra o microSD (`mmcblk0`) e o NVMe interno (`nvme0n1`) e seus pontos de montagem.
- `f3write` + `f3read` medem velocidade real e flagrarem cartões com capacidade falsa.
- SSD NVMe em enclosure USB 3.2 Gen 2 (chip UAS, ex. RTL9210) entrega centenas de MB/s pelo USB-C.
- `smartctl` revela desgaste do disco interno; troca de NVMe é risco que microSD/SSD externo muitas vezes dispensam.

## Exercícios

1. Insira um microSD e rode `lsblk`. Identifique o device do cartão e seu ponto de montagem automático.
2. Leia a classe de um cartão seu (`U3`, `A2`, etc.) e explique, com base na seção, se ele é adequado para jogos.
3. Rode `sudo hdparm -t` no seu microSD (device `mmcblk0`) e depois num SSD externo, se tiver. Compare as leituras.
4. Execute `sudo f3write` e `sudo f3read` num cartão novo ou suspeito. O `Data LOST` foi zero? O que isso confirma?
5. **Desafio.** Instale um jogo pesado no microSD e outro no SSD interno, e meça o tempo de carregamento de uma fase em cada um (cronometre do clique até jogar). Relacione a diferença com a velocidade de leitura aleatória que você mediu com `hdparm` e com as classes do cartão registradas em `dmesg`.
