O armazenamento é onde o Steam Deck mais se diferencia internamente — e onde mais existe desinformação. A Valve vendeu, ao longo do tempo, edições com 64 GB, 256 GB, 512 GB e 1 TB, mas a diferença crucial não está só no tamanho: está no **tipo** de mídia (eMMC versus NVMe), que muda radicalmente a velocidade e a possibilidade de upgrade. Saber ler o disco pelo sistema é o primeiro passo para decidir se vale trocá-lo.

Nesta seção você aprende a identificar o disco do seu Steam Deck, medir o espaço usado e entender cada edição de armazenamento.

:::objetivos
- Mapear as edições de armazenamento de cada geração (LCD e OLED)
- Diferenciar eMMC de NVMe e o impacto na velocidade
- Listar discos e partições com `lsblk` e medir uso com `df`
- Identificar o modelo exato do SSD instalado
- Avaliar se vale ou não fazer upgrade de armazenamento
:::

## As edições e o tipo de mídia

O Steam Deck LCD original saiu em três edições de armazenamento, e aqui mora a pegadinha mais famosa do produto: a edição de entrada de **64 GB** usava **eMMC**, uma mídia soldada e lenta, enquanto as de **256 GB** e **512 GB** usavam **NVMe**, um SSD rápido no formato M.2 2230. O eMMC é, na prática, um cartão de memória integrado: barato e pequeno, mas com velocidades muito inferiores às de um NVMe.

O OLED simplificou o cenário: saiu em **512 GB** e **1 TB**, ambas com **NVMe** M.2 2230. Ou seja, a segunda geração abandonou o eMMC de vez — todo OLED tem SSD rápido. O acabamento do vidro acompanha o armazenamento: as edições de 512 GB (LCD e OLED) e a de 1 TB (OLED) trazem o vidro **antirreflexo**, enquanto a de 64 GB (LCD) e a de 256 GB (LCD) usam vidro padrão brilhante.

| Geração | Edição | Mídia | Vidro |
|---|---|---|---|
| LCD | 64 GB | eMMC (soldado) | padrão |
| LCD | 256 GB | NVMe M.2 2230 | padrão |
| LCD | 512 GB | NVMe M.2 2230 | antirreflexo |
| OLED | 512 GB | NVMe M.2 2230 | antirreflexo |
| OLED | 1 TB | NVMe M.2 2230 | antirreflexo |

Também há o slot para cartão **microSD**, presente em todas as edições. Ele serve para expandir a biblioteca de jogos a baixo custo, com desempenho de leitura razoável para muitos títulos — mas bem abaixo do NVMe interno, e o eMMC da edição de 64 GB fica numa zona intermediária entre o microSD e o NVMe.

:::atencao
A diferença de velocidade entre a edição de 64 GB (eMMC) e as demais (NVMe) é a mais relevante da linha: carregamentos de jogos podem levar o dobro ou triplo do tempo no eMMC. Se você está comprando um Steam Deck usado, uma unidade de 64 GB "baratinha" pode ter o gargalo escondido no tipo de mídia, não só no espaço menor.
:::

## Listando discos e partições

O `lsblk` é o comando que desenha a árvore de discos e partições do sistema, com tamanhos e pontos de montagem. No Steam Deck, a leitura típica:

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE  MOUNTPOINTS
mmcblk0     179:0    0 119.1G  0 disk
├─mmcblk0p1 179:1    0   256M  0 part
└─mmcblk0p2 179:2    0 118.9G  0 part
nvme0n1     259:0    0 476.9G  0 disk
├─nvme0n1p1 259:1    0    64M  0 part
├─nvme0n1p2 259:2    0    32M  0 part
├─nvme0n1p3 259:3    0   256M  0 part
├─nvme0n1p4 259:4    0   256M  0 part
...
```

O disco interno é o `nvme0n1` (um SSD NVMe de 476,9 GiB, o número comercial de 512 GB), com várias partições — o SteamOS particiona o disco em múltiplas partes pequenas de boot e uma grande de dados. O `mmcblk0` é o **microSD** de 128 GB inserido, com seu próprio layout.

Já dá para notar pela nomenclatura a diferença de mídia: um SSD NVMe sempre aparece como `nvme0n1`, `nvme1n1` e assim por diante; um eMMC aparece como `mmcblk0` (o mesmo prefixo do microSD, porque ambos falam o protocolo MMC); um microSD também é `mmcblk` mas com número diferente quando há mais de um. Essa distinção é a forma mais rápida de saber se uma unidade de 64 GB tem eMMC ou NVMe: basta ver o nome.

Para ver os tamanhos com detalhe e o modelo, acrescente opções:

```terminal
$ lsblk -d -o NAME,SIZE,MODEL,TRAN
NAME      SIZE MODEL                    TRAN
mmcblk0 119.1G                          mmc
nvme0n1 476.9G ESMP512GKB4C3-E13TS      nvme
```

A coluna `TRAN` (tipo de transporte) confirma: `mmc` para o cartão e `nvme` para o SSD. O `MODEL` mostra o fabricante e a capacidade do SSD instalado — `ESMP512GKB4C3` é um SSD de 512 GB da eSSD, usado pela Valve em várias unidades.

:::dica
O `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS` dá uma visão completa: nome, tamanho, tipo (disk/part), sistema de arquivos e onde está montado. É o comando mais útil para mapear o armazenamento de um relance.
:::

## Medindo o espaço usado com `df`

O `df` responde à pergunta "quanto espaço resta?" por sistema de arquivos montado. A opção `-h` dá números legíveis:

```terminal
$ df -h
Filesystem         Size  Used Avail Use% Mounted on
overlay            476G  321G  136G   71% /
/dev/nvme0n1p4      64M  4.0K   64M    1% /efs
/dev/nvme0n1p6     256M   30M  226M   12% /var
tmpfs              7.1G  172K  7.1G    1% /dev/shm
/dev/mmcblk0p2     114G   21G   93G   19% /run/media/deck/microsd
```

A raiz `/` aparece como `overlay` — uma característica marcante do SteamOS, que usa um sistema de arquivos somente-leitura sobreposto por camadas graváveis (`overlayfs`). O disco interno de 476 GB tem 321 GB usados (71%), restando 136 GB. O microSD (`/run/media/deck/microsd`) mostra 114 GB com 93 GB livres, 19% usados.

O `Use%` é o número que mais interessa no dia a dia: acima de 90% o sistema começa a avisar, e jogos grandes deixam de instalar. O `df` conta cada sistema de arquivos separado, então num aparelho com microSD inserido você vê duas linhas de espaço útil — a do interno e a do cartão.

:::nota
O `overlay` no lugar de um disco tradicional reflete uma decisão de segurança da Valve: a partição de sistema do SteamOS é somente-leitura por padrão, e as mudanças de sistema são aplicadas como atualizações de imagem completas. Para o usuário, isso significa que o espaço de instalação de jogos fica numa camada de dados separada. Mexer no sistema exige desativar temporariamente o modo somente-leitura (`sudo steamos-readonly disable`).
:::

## O modelo do SSD e o upgrade

Além do tamanho, vale saber exatamente qual SSD está instalado — útil ao comprar usado ou planejar troca. O `hdparm` e o `smartctl` (do pacote `smartmontools`) leem os metadados do disco:

```terminal
$ sudo smartctl -i /dev/nvme0n1
=== START OF INFORMATION SECTION ===
Model Number:                       ESMP512GKB4C3-E13TS
Serial Number:                      EF0123456789ABCD
Firmware Version:                   ECFM12.3
Namespace 1 Size/Capacity:          512,110,190,592 [512 GB]
Form Factor:                        2.5 inches
Rotation Rate:                      Solid State Device
```

A saída confirma o modelo, o número de série, o firmware e a capacidade real (512 GB em bytes decimais). O `Form Factor` e a ausência de `Rotation Rate` (por ser SSD) também aparecem. Para um eMMC de 64 GB, o `smartctl` muitas vezes não retorna metadados ricos, pois eMMC não expõe as mesmas informações SMART de um NVMe.

O tamanho físico do SSD importa para upgrade: o Steam Deck usa o formato **M.2 2230**, que é bem menor que o SSD comum de desktop (M.2 2280). Ao comprar um SSD novo, essa é a especificação decisiva — um 2280 não cabe. A Valve recomenda, nas edições com NVMe, trocar o SSD por outro 2230 de maior capacidade se o espaço acabar, procedimento que exige abrir o aparelho e reaplicar o SteamOS.

:::perigo
Trocar o SSD apaga **tudo** — jogos, saves locais sem nuvem e configurações. Faça backup antes, e lembre que o SteamOS precisa ser reinstalado com a imagem oficial da Valve no disco novo. A abertura do aparelho também compromete a vedação e pode anular garantia em algumas regiões. Se a ideia é só ganhar espaço com menos risco, o microSD de alto desempenho é o caminho de menor atrito.
:::

## Resumo

- LCD saiu em 64 GB (eMMC), 256 GB e 512 GB (NVMe); OLED em 512 GB e 1 TB (NVMe, vidro antirreflexo).
- eMMC é soldado e lento; NVMe é SSD rápido em M.2 2230 — a diferença de tipo de mídia supera a de tamanho.
- `lsblk` mostra a árvore de discos: `nvme0n1` é SSD NVMe, `mmcblk0` é microSD (ou eMMC na edição de 64 GB).
- `lsblk -d -o NAME,SIZE,MODEL,TRAN` revela modelo e tipo de transporte de cada disco.
- `df -h` mede espaço usado/livre por sistema de arquivos; a raiz `/` aparece como `overlay` (rootfs somente-leitura).
- O `smartctl -i` lê modelo, serial e firmware do SSD; o formato de upgrade é M.2 2230.

## Exercícios

1. Rode `lsblk` e descreva cada disco e partição, identificando qual é o SSD interno e qual o microSD (se houver).
2. Execute `lsblk -d -o NAME,SIZE,MODEL,TRAN` e diga o modelo e o transporte do disco interno. É NVMe ou eMMC?
3. Rode `df -h` e liste os sistemas de arquivos, anotando o `Use%` da raiz e do microSD.
4. Com `sudo smartctl -i /dev/nvme0n1` (ou o dispositivo correto), extraia modelo, serial e capacidade. Compare a capacidade "512 GB" com o `SIZE` do `lsblk` e explique a diferença (decimal vs binário).
5. **Desafio.** Monte um diagnóstico completo de armazenamento: use `lsblk`, `df -h` e `smartctl` para responder, num único relato, qual edição é o aparelho (pelo tamanho e tipo de mídia), quanto espaço resta e se há microSD. Cruze o tipo de mídia com o vidro esperado (antirreflexo nas edições de 512 GB+) e proponha se um upgrade compensa.
