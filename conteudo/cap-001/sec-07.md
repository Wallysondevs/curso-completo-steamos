Depois de percorrer o hardware por partes, é hora de juntar tudo numa visão completa. Uma tabela de especificações permite comparar os dois modelos lado a lado e entender, de uma olhada, o que o Steam Deck é e o que não é. Esta seção consolida os números — e mostra como confirmá-los você mesmo, direto no aparelho, sem depender de folha de dados do fabricante.

:::objetivos
- Consolidar as especificações completas do Steam Deck em uma única referência
- Comparar os modelos LCD e OLED parâmetro por parâmetro
- Confirmar cada especificação com um comando real no seu aparelho
- Entender o que os números significam em uso prático
- Identificar documentos oficiais da Valve para consulta futura
:::

## A tabela-mestra de especificações

Os números abaixo vêm da combinação da documentação oficial da Valve com leituras do próprio hardware. São os valores de referência dos dois modelos do Deck, com a APU Zen 2 + RDNA 2 em ambos.

| Parâmetro | LCD (2022) | OLED (2023) |
|---|---|---|
| Codinome interno | `Galileo` | `Jupiter` |
| Tela | 7,0" IPS LCD, 400 nits, 60 Hz | 7,4" OLED HDR, 1000 nits, até 90 Hz |
| Resolução | 1280×800 (16:10) | 1280×800 (16:10) |
| APU | AMD Aerith (7 nm) | AMD Sephiroth (6 nm) |
| CPU | Zen 2, 4 núcleos, 8 threads, até 3,5 GHz | Zen 2, 4 núcleos, 8 threads, até 3,5 GHz |
| GPU | RDNA 2, 8 CUs, até 1,6 GHz | RDNA 2, 8 CUs, até 1,6 GHz |
| Memória | 16 GB LPDDR5 5500 MT/s, 128-bit | 16 GB LPDDR5 6400 MT/s, 128-bit |
| Armazenamento | 64 GB eMMC ou NVMe 256/512 GB | NVMe 512 GB / 1 TB |
| microSD | UHS-I | UHS-I |
| Wi-Fi | Wi-Fi 5 (802.11ac) | Wi-Fi 6E (802.11ax) |
| Bluetooth | 5.0 | 5.3 |
| Bateria | 40 Wh | 50 Wh |
| Vídeo externo | DisplayPort 1.4 via USB-C, até 4K 120 Hz / 8K 60 Hz | idem |
| Áudio | 3,5 mm, alto-falantes estéreo | sem 3,5 mm, alto-falantes estéreo |
| Peso | ~669 g | ~640 g |

Repare que as linhas de CPU, GPU e resolução são **idênticas**. O desempenho é essencialmente o mesmo; o OLED compensa em autonomia, tela e conectividade, não em potência bruta.

## Confirmando os números com o próprio hardware

Cada linha da tabela pode ser verificada por inspeção direta. Nada de confiar cegamente em folha de dados — o kernel sabe tudo.

```terminal
$ lscpu | grep -E 'Model name|Core|Thread|MHz'
  Model name:             AMD Custom APU 0405
    Thread(s) per core:   2
    Core(s) per socket:   4
    CPU max MHz:          3500.0000
```

`CPU max MHz 3500` confirma o boost de 3,5 GHz. Os 4 núcleos e 2 threads por núcleo dão os 8 threads. A GPU, por sua vez, se confirma no barramento PCI:

```terminal
$ lspci | grep -i vga
05:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD] VanGogh [AMD Custom GPU 0405]
```

E a memória, no total e no tipo, aparece em dois lugares:

```terminal
$ free -h | head -2
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.1Gi        11Gi        10Mi       387Mi        11Gi
$ sudo dmidecode -t memory 2>/dev/null | grep -E 'Type:|Speed:|Size:' | head -6
	Type: LPDDR5
	Speed: 5500 MT/s
	Size: 8 GB
	Type: LPDDR5
	Speed: 5500 MT/s
	Size: 8 GB
```

O `dmidecode` (precisa de root) lê a tabela SMBIOS e mostra os dois chips de 8 GB LPDDR5 a 5500 MT/s que somam 16 GB. Num modelo OLED, a velocidade reportada sobe para 6400 MT/s.

:::dica
`dmidecode` é a ferramenta definitiva para especificações de hardware no nível de firmware. Sem root, ela silencia a maior parte das informações (por isso o `2>/dev/null`). Para leitura completa, rode `sudo dmidecode -t memory` e procure por `Speed` e `Configured Memory Speed`.
:::

## O que os números significam no dia a dia

Especificação sem interpretação é decoração. Alguns desses números têm impacto direto e mensurável:

- **1280×800 a 16:10** — resolução propositalmente modesta. A APU renderiza nessa resolução com folga, permitindo 30–60 fps em jogos modernos com ajustes médios. Se a tela fosse 1440p, a mesma APU afundaria.
- **Largura de banda de 88–102 GB/s** — o gargalo real. Em cenas com muitas texturas, a APU espera a memória, não o contrário. É por isso que aumentar o TDP tem retornos decrescentes em alguns jogos.
- **Bateria de 40 vs 50 Wh** — 50 Wh é 25% mais energia, mas o ganho prático de autonomia é maior (30–50%) porque o chip de 6 nm e o OLED consomem menos. Bateria maior + consumo menor = efeito composto.
- **microSD UHS-I (máx ~104 MB/s)** — suficiente para carregamento, mas o SSD NVMe interno é de 3 a 10× mais rápido. Jogos com muito streaming devem ficar no SSD; biblioteca antiga e indies, no microSD.

```terminal
$ hdparm -t /dev/nvme0n1 2>/dev/null | grep Timing
 Timing buffered disk reads: 1864 MB in  3.00 seconds = 621.31 MB/sec
```

O `hdparm -t` mede a leitura sequencial do NVMe: 621 MB/s de pico, bem acima dos ~90 MB/s que um microSD UHS-I entrega. Para comparação, rode o mesmo teste no microSD (`hdparm -t /dev/mmcblk0`) e veja a diferença de uma ordem de magnitude.

## Consultando a documentação oficial

Manter um conjunto de referências oficiais evita confiar em boatos de fórum. A Valve publica especificações e notas em páginas estáveis:

- [Página oficial do Steam Deck](https://www.steamdeck.com/) — specs atuais e anúncios.
- [Steam Deck Tech Info](https://partner.steamgames.com/doc/steamdeck) — documentação técnica para desenvolvedores, com detalhes de hardware.
- [SteamOS](https://store.steampowered.com/steamos) — informações sobre o sistema operacional (aprofundado no [capítulo 2](#/cap-002/sec-01)).

:::info
Os nomes Aerith, Sephiroth, VanGogh e Galileu/Jupiter vêm da cultura interna da Valve e são confirmados pelo firmware DMI, não por boatos. Quando ouvir afirmações sobre "novo chip mais rápido", verifique primeiro com `lscpu`, `lspci` e `dmidecode` no próprio aparelho — o hardware não mente.
:::

## Resumo

- A tabela-mestra compara LCD e OLED; CPU, GPU e resolução são idênticas entre os modelos.
- O desempenho bruto é o mesmo; OLED ganha em tela, autonomia e conectividade.
- `lscpu`, `lspci -v`, `free -h` e `sudo dmidecode` confirmam cada especificação no aparelho.
- O gargalo dominante é a largura de banda da memória (88–102 GB/s), não a velocidade dos núcleos.
- O NVMe interno é ~6× mais rápido que o microSD UHS-I; `hdparm -t` mede a diferença em segundos.

## Exercícios

1. Reproduza a tabela-mestra com os valores do **seu** aparelho: rode `lscpu`, `free -h`, `lsusb`, `lspci -v` e preencha CPU, memória, GPU e armazenamento com números reais.
2. Confirme o tipo e a velocidade da memória com `sudo dmidecode -t memory`. A velocidade reportada é 5500 ou 6400 MT/s?
3. Meça a leitura sequencial do SSD com `hdparm -t /dev/nvme0n1` e, se tiver um, do microSD com `hdparm -t /dev/mmcblk0`. Calcule quantas vezes o SSD é mais rápido.
4. Leia a resolução e taxa de atualização atuais com `cat /sys/class/drm/card0-eDP-*/modes` e `cat .../status`. Bate com a tabela do seu modelo?
5. **Desafio.** Construa um "boletim de especificações" em um único comando encadeado que, de uma execução só, imprima: modelo (DMI), CPU (lscpu), memória total (free), GPU (lspci) e armazenamento (lsblk). Dica: use `;` ou `&&` e `grep` para filtrar. Entregue o comando completo e a saída lado a lado com a tabela-mestra.