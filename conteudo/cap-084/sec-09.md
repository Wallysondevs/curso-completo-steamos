Trocar as peças é metade do trabalho; garantir que tudo funciona como deveria é a outra metade. Depois de fechar o Deck e religá-lo, o que vem a seguir não é abrir um jogo e torcer — é uma bateria de verificações que pesam certezas, não esperanças. SSD vazio ou clonado errado, stick com zona morta deslocada, botão que não registra, bateria que parou de carregar: cada um tem um teste específico.

:::objetivos
- Executar uma bateria de validação de SSD com `lsblk`, `smartctl` e `df`
- Verificar a integridade do sistema de arquivos após clonagem ou reinstalação
- Medir desempenho de leitura e gravação do novo SSD
- Validar sticks hall effect e botões com `evtest` e o menu de calibração
- Criar um checklist de pós-upgrade que cubra os três componentes
:::

## Validação do SSD

Comece pelo armazenamento. Se você reinstalou pelo recovery, o SSD deve mostrar as partições do SteamOS. Se clonou, confirme que as oito partições estão presentes e que o sistema de arquivos está limpo (não sujo de `fsck` pendente).

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT /dev/nvme0n1
NAME        SIZE FSTYPE  MOUNTPOINT
nvme0n1     931.5G
├─nvme0n1p1  64M
├─nvme0n1p2  32M
├─nvme0n1p3  32M
├─nvme0n1p4  64M
├─nvme0n1p5   5G ext4   /
├─nvme0n1p6  32M
├─nvme0n1p7   5G
└─nvme0n1p8 921.3G ext4   /home
```

O layout acima é típico do SteamOS. As partições pequenas (p1 a p4 e p6) são EFI, boot, variáveis e A/B root — não devem ser manipuladas manualmente. O que importa aqui é que o disco certo (`931.5G`, no caso de 1 TB) aparece e `/home` cobre o grosso do espaço.

```terminal
$ sudo fsck.ext4 -nf /dev/nvme0n1p8
Pass 1: Verificando inodes, blocos e tamanhos
Pass 2: Verificando estruturas de diretórios
Pass 3: Verificando conectividade
Pass 4: Verificando contagens de blocos
Pass 5: Verificando resumo
   112345 inodes usados
   145678 blocos usados (1.2% do total)
```

O `fsck` com `-n` (não modificar, só reportar) varre o sistema de arquivos e reporta o estado sem consertar nada. Se o sistema foi desligado limpo, o resultado dirá "clean" ou não terá erros. Se houver inodes órfãos ou blocos inválidos, rode `fsck` sem `-n` para corrigir — mas isso só deve acontecer se algo foi interrompido durante a clonagem.

## Teste de desempenho de leitura e gravação

O desempenho importa, especialmente no carregamento de jogos. Um teste de leitura sequencial e outro de leitura aleatória confirmam que o SSD novo entrega o esperado. Não espere números de notebook — o Deck é PCIe Gen3 e isso é o teto.

```terminal
$ sudo fio --name=seq-read --size=1G --bs=1M --direct=1 --rw=read /home/ana/lab/testfile 2>/dev/null
[...]
  read: IOPS=3.2k, BW=3200MB/s
```

O `fio` (`flexible I/O tester`) faz leitura sequencial de 1 GB em blocos de 1 MiB com bypass de cache (`--direct=1`). O valor esperado para um SSD Gen3 decente fica entre 2500 e 3500 MB/s. Repita com `--rw=randread` e `--bs=4k` para medir o desempenho aleatório, que reflete melhor o carregamento de pequenos arquivos.

```terminal
$ sudo fio --name=rand-read --size=1G --bs=4k --direct=1 --rw=randread /home/ana/lab/testfile 2>/dev/null
[...]
  read: IOPS=230k, BW=920MB/s
```

O aleatório é sempre mais lento que o sequencial. Com blocos de 4k, o IOPS (operações por segundo) é a métrica que mais importa, não a largura de banda. Um SSD sem DRAM (HMB) pode mostrar IOPS menor que o esperado — é normal no Deck.

:::dica
Limpe o arquivo de teste depois com `rm /home/ana/lab/testfile`. O `fio` cria um arquivo de 1 GB que fica ocupando espaço desnecessário na home.
:::

## Validação dos analógicos e botões

Com o Deck ligado, vá ao menu Steam → Configurações → Controlador → Calibração e uso avançado. O SteamOS mostra uma visualização dos eixos: cada stick deve repousar no centro e atingir as bordas sem saltos. A zona morta padrão (default ~2000) costuma ser suficiente para hall effect, mas reduza gradualmente e veja se o jitter aparece.

```terminal
$ evtest /dev/input/event3 | grep -E 'ABS_X|ABS_Y|BTN|HAT'
```

Deixe `evtest` rodando e percorra cada controle: mexa os dois sticks em círculos, aperte cada botão de face, cada direcional e os gatilhos. Nenhum evento deve estar ausente; nenhum deve aparecer sem você ter pressionado. Esse teste cobre num único comando tudo que foi mexido.

## Teste integrado com jogo

Depois dos testes técnicos, abra um jogo que exija o conjunto: mira com stick (analógico), ação com botões e movimentação com D-pad. O jogo ideal é aquele que você mais joga — você reconhece a sensação "normal" e nota rápido se algo está fora.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'percentage|state|time to empty|energy-full-design'
    percentage:   72%
    state:        discharging
    energy-full-design: 40,00 Wh
    time to empty: 2,4 hours
```

O teste final de upgrade completo: jogue por tempo suficiente para a bateria descarregar naturalmente, e observe o `upower` ao final. O `energy-full-design` deve ser o mesmo de antes (a bateria não foi trocada) e o `time to empty` deve ser razoável para a carga. Esse comando fecha o ciclo de validação — hardware, software e bateria operando juntos.

## Checklist de encerramento

Antes de declarar o upgrade concluído, confirme: todas as partições do `lsblk` estão presentes; o `df` mostra `/home` com o espaço esperado; o `fsck` reporta sistema limpo; o `evtest` registra todos os botões e eixos; o jogo roda sem drift nem botão fantasma; e `upower` mostra bateria carregando e descarregando normalmente. Uma linha falhando é motivo para reabrir e investigar.

## Resumo

- `lsblk` e `fsck -nf` validam o SSD: partições presentes e sistema de arquivos limpo.
- `fio` mede desempenho sequencial (~3200 MB/s) e aleatório (IOPS de ~230k) para referência Gen3.
- `evtest` com o deck inteiro montado confirma que cada controle gera os eventos esperados.
- O SteamOS oferece calibração visual de sticks e zona morta; reduza a zona morta até o jitter aparecer e depois suba um degrau.
- Um checklist final de 5 itens (partições, `/home`, fsck, input, bateria) cobre os três upgrades do capítulo.

## Exercícios

1. Após trocar o SSD (ou com seu SSD atual), rode `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT` e compare com o layout de 8 partições esperado. Quantas partições estão presentes?
2. Execute `sudo fio --name=test --size=1G --bs=1M --direct=1 --rw=read /home/ana/lab/benchfile` e registre a largura de banda reportada. O valor está dentro da faixa esperada para Gen3?
3. Com `evtest` filtrando por `BTN`, pressione todos os botões de face e gatilhos. Alguém falta? Alguém aparece sem ser pressionado?
4. Reduza a zona morta do stick no menu do SteamOS até o personagem começar a "andar sozinho" e depois suba um degrau. Registre o valor da zona morta de corte.
5. **Desafio.** Combine `fio`, `smartctl` e `df` para produzir um relatório de uma página sobre seu SSD: modelo, capacidade total e usada, saúde (Percentage Used), velocidade sequencial e aleatória, e o veredito "aprovado" ou "reprovado". Compare os números com a ficha técnica do fabricante — eles batem?