O Steam Deck não tem uma placa de vídeo separada. O que ele tem é uma **APU** — um único chip da AMD que reúne CPU e GPU — roubando a mesma pilha de RAM compartilhada para os dois. Quanta memória a GPU pode reivindicar para si (o chamado **buffer UMA**) é uma decisão de BIOS que afeta diretamente quanta RAM sobra para o jogo e para o sistema. Entender esse orçamento é talvez o tweak de maior impacto real que um usuário pode fazer.

:::objetivos
- Entender a arquitetura de memória unificada da APU do Deck
- Diferenciar VRAM dedicada de buffer de frame UMA dinâmico
- Identificar o orçamento de VRAM atual no firmware
- Avaliar os tamanhos mais usados (256 MB a 4 GB) e seus trade-offs
- Correlacionar VRAM com o zram e o swap já vistos
:::

## Uma pilha só, dois patrões

Num PC de mesa, a GPU tem sua própria VRAM — tipicamente 8 a 24 GB de memória GDDR soldada na placa. O Steam Deck, como os consoles, elimina essa separação: a APU AMD usa a mesma DDR5 (ou LPDDR5) tanto para o jogo (CPU) quanto para as texturas, geometria e buffers de quadro (GPU). Isso é o que os fabricantes chamam de **memória unificada** ou **UMA** (*Unified Memory Architecture*).

A vantagem é custo e flexibilidade: o sistema operacional decide, dinamicamente, quanto da RAM vai para cada lado. A desvantagem é a disputa: 16 GB totais precisam caber o sistema, o Proton, o jogo e tudo o que a GPU precisa renderizar.

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       9.1Gi       4.2Gi       420Mi       2.1Gi       5.9Gi
```

Nesses 15 Gi (úteis de 16 GB), a GPU pega uma fatia *antes* de o jogo começar a rodar, definida no firmware. Esse valor inicial é o que o CryoUtilities orienta o usuário a ajustar na BIOS do Steam Deck.

## O que é o buffer UMA frame

No firmware do Steam Deck (acessível segurando [[Volume+]] durante o boot), há uma opção chamada **UMA Frame buffer Size**. Apesar do nome longo, ela define o orçamento **mínimo** de RAM reservado para a GPU num primeiro momento. Os valores disponíveis variam conforme o modelo, mas o padrão costuma ser 1 GB, com opções de 256 MB até 4 GB (em alguns BIOS, com passos).

O detalhe crucial: esse valor **não é um teto rígido**. O driver da AMD pode pedir mais memória de vídeo ao sistema conforme o jogo exige, graças à alocação dinâmica. Reduzir o reservado a 256 MB não limita o jogo a 256 MB de VRAM — apenas muda o ponto de partida e libera mais RAM para o resto.

```terminal
# o valor reservado aparece no firmware, mas dá para inferir via /proc ou dmesg
$ sudo dmesg 2>/dev/null | grep -i -E 'amdgpu|vram|gtt' | head -8
[    2.31] [drm] amdgpu kernel modesetting enabled
[    2.44] amdgpu 0000:04:00.0: amdgpu: VRAM: 512M 0x000000F400000000 - 0x000000F41FFFFFFF (512M used)
[    2.44] amdgpu 0000:04:00.0: amdgpu: GTT: 7669M 0x0000001000000000 - 0x00000012DFFFFFFF
```

A saída do `dmesg` mostra o driver `amdgpu` informando quanto viu: `VRAM: 512M` é o que a BIOS reservou de início, e o `GTT` é a região de memória de tradução da GPU (memória do sistema que a GPU pode acessar). O número exato de VRAM depende do que estava definido no firmware.

## Tamanhos e trade-offs

Não existe um valor universalmente "melhor"; o que existe é uma troca entre o jogo pedir mais VRAM dinamicamente e sobrar RAM de verdade para o sistema:

| UMA Buffer | Efeito | Para quem |
|---|---|---|
| 256 MB | Libera mais RAM para o sistema e jogos leves | Emulação, jogos 2D, multi-tarefa |
| 1 GB (padrão) | Ponto de equilíbrio da Valve | A maioria dos jogos AAA |
| 4 GB | Reserva mais para GPU, menos RAM para CPU | Jogos com texturas pesadas e pouca lógica |

O raciocínio por trás de *reduzir* para 256 MB é dar mais folga à RAM do sistema, reduzindo a necessidade de zram/swap vista nas [seções anteriores](#/cap-076/sec-02). O contraponto é que alguns jogos consultam o tamanho da "VRAM" reportado pela API e se comportam diferente ao vê-la pequena — recusando texturas altas ou reduzindo qualidade automaticamente.

:::atencao
O buffer UMA é uma configuração de **firmware (BIOS)**, não um arquivo de sistema. Alterá-lo requer reiniciar o Deck e entrar na BIOS segurando [[Volume+]] + power. Não há como mudá-lo por software. E como a Valve também usa esse valor de formas específicas no Game Mode, vale anotar o valor original antes de mexer.
:::

## VRAM reportada e o efeito no jogo

Jogos Windows modernos costumam ler o quanto de VRAM está disponível para decidir a qualidade. Via Proton, essa leitura é feita através do DXVK/VKD3D, que reporta um valor ao jogo. Se o buffer UMA está baixo, alguns títulos podem reportar "VRAM insuficiente" e travar ou forçar texturas médias mesmo quando o sistema teria RAM de sobra para dar à GPU via alocação dinâmica.

```terminal
$ cat /sys/class/drm/card0/device/mem_info_vram_total
536870912
```

O arquivo `mem_info_vram_total` (no caminho do amdgpu) mostra o total de VRAM reportado em bytes — aqui 512 MiB (536870912 bytes), consistente com o `dmesg` anterior. Divida por 1024² para ler em MiB. Esse é o número inicial que o firmware reservou; a GPU ainda pode crescer via GTT conforme pedir.

:::info
No Steam Deck OLED e em revisões mais novas, a Valve ajustou o comportamento de memória no SteamOS, e a recomendação antiga de "diminuir para 256 MB" ficou menos relevante. Em alguns casos, aumentar para 4 GB ajuda jogos que alocam grandes texturas no início; em outros, reduzir para 256 MB libera RAM e melhora os 1% low. Contexto manda.
:::

## A ligação com o resto do sistema

O orçamento de VRAM conversa diretamente com tudo que este capítulo tratou. Reservar 4 GB para a GPU num sistema de 16 GB deixa 12 GB (menos o sistema e o Proton) para o jogo, pressionando o zram e o swap. Reduzir para 256 MB libera ~768 MB adicionais de RAM de trabalho, o que pode eliminar engasgos de troca sem custo se o jogo não precisava daquele reservado.

Por isso, o ajuste de VRAM nunca deve ser feito isolado. Ele é uma das três alavancas — junto com `swappiness` e o tamanho do zram — que devem ser movidas em conjunto e validadas com medição real, como a [seção de benchmark](#/cap-076/sec-08) ensina.

## Resumo

- O Deck usa memória unificada: CPU e GPU compartilham a mesma RAM física.
- O UMA Frame Buffer Size define o reservado **inicial** de VRAM, não um teto rígido.
- Reduzir para 256 MB libera RAM do sistema; aumentar para 4 GB reserva mais para a GPU.
- O valor é ajustado na BIOS e exige reinício; não há caminho por software.
- O orçamento de VRAM conversa com zram e swappiness e deve ser ajustado em conjunto com eles.

## Exercícios

1. Verifique no firmware qual o UMA Frame Buffer Size atual da sua máquina (anote antes de alterar).
2. Use `dmesg` e `/sys/class/drm/card0/device/mem_info_vram_total` para confirmar quanto VRAM o driver vê. Os números batem com o firmware?
3. Rode um jogo pesado e monitore `free -h` para ver o quanto de RAM está livre antes e depois de reduzir o buffer UMA para 256 MB.
4. Identifique se algum jogo reporta "VRAM insuficiente" com o buffer em 256 MB e como ele se comporta (reduz texturas, trava, ou segue normal).
5. **Desafio.** Explique por que "VRAM reportada" pode mentir: como o driver AMD aloca mais memória de vídeo via GTT mesmo com o UMA baixo, e por que alguns jogos não se beneficiam disso.