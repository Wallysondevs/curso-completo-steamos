Diagnóstico é uma ciência, não um chute. Depois de dominar as ferramentas individuais — `dmesg`, `journalctl`, `steam-logs`, MangoHud, `sensors`, `dmidecode` — o que separa um power user de um novato é a capacidade de combiná-las numa sequência lógica que isola o problema em minutos, não em horas. Esta seção fecha o capítulo com um fluxo de trabalho unificado e as armadilhas mais comuns a evitar.

:::objetivos
- Aplicar uma sequência de diagnóstico completa, da primeira pista ao RMA
- Cruzar logs de kernel, sistema e aplicação para triangular a causa
- Conhecer os erros de interpretação mais frequentes
- Montar um "kit de diagnóstico" reutilizável com scripts e aliases
:::

## O fluxo de diagnóstico em sete passos

Toda investigação bem-sucedida segue a mesma espinha dorsal, independente de o sintoma ser "o jogo trava", "o Wi-Fi cai" ou "o deck desliga sozinho". A sequência abaixo transforma o caos de um sintoma vago em uma causa apontada.

1. **Reproduza o sintoma.** Sem reproduzir, você não tem evidência — só anedota.
2. **Fixe o momento.** Anote data/hora exata do travamento para recortar os logs depois.
3. **Leia o kernel primeiro** (`dmesg --level=err`): hardware fala alto e direto.
4. **Leia o sistema em seguida** (`journalctl -b -p err`): serviços e aplicações.
5. **Cruze com o específico** (`steam-logs`, `PROTON_LOG`, `gamescope`): a camada do problema.
6. **Meça desempenho/térmico** (`sensors`, MangoHud): se for lentidão ou calor.
7. **Documente e decida**: software (corrigir) ou hardware (RMA).

```terminal
$ dmesg --level=err | tail -n 20
$ journalctl -b -p err --since "10:00" --until "10:15"
```

Esses dois comandos, rodados em sequência, cobrem 80% dos diagnósticos. O primeiro mostra o que o hardware reclamou; o segundo, o que o sistema reclamou na janela do sintoma. A triangulação entre os dois é quase sempre suficiente para classificar o problema.

## Triangular a causa: um exemplo completo

Considere um cenário real: o jogo *Hades* trava após 30 minutos de sessão, toda vez. O que cada ferramenta revela, e como elas se conjugam:

```terminal
$ journalctl -u steam --since "1 hour ago" | grep -i -E "signal|crash|terminated"
fev 20 14:32:40 steamdeck steam[2819]: Game 1145360 terminated with signal 11 (SIGSEGV)
```

O `journalctl` mostra que o processo do jogo morreu com `SIGSEGV` (segmentation fault) às 14h32. É o *efeito*, ainda não a *causa*.

```terminal
$ dmesg --level=err | tail
[ 1234.567890] amdgpu 0000:04:00.0: [gfxhub] page fault (src_id:0 ring:24 vmid:0)
[ 1234.567891] amdgpu 0000:04:00.0: VM_L2_PROTECTION_FAULT_STATUS:0x00000000
```

O `dmesg` revela um *page fault* da GPU — a APU tentou acessar uma página de memória inválida. Isso aponta para driver/Proton, não para defeito do jogo em si, e sugere aumentar a VRAM, testar outra versão de Proton ou atualizar o firmware.

```terminal
$ sensors amdgpu-pci-0400 | grep junction
junction:     +94.0°C  (crit = +110.0°C)
```

A temperatura de junção a 94 °C logo antes do crash acrescenta o suspeito térmico. A sequência de evidências — crash do processo, page fault da GPU, temperatura alta — permite formar a hipótese: *instabilidade relacionada a calor + driver*. A próxima ação lógica é testar com TDP reduzido ou ventoinha mais agressiva (CoreCtrl) e observar se o crash some.

:::dica
Nunca pare na primeira pista. Um único `SIGSEGV` pode ser driver, jogo, calor ou um bug aleatório. A triangulação — kernel + sistema + aplicação + térmico — é o que transforma suspeita em diagnóstico.
:::

## Erros comuns de interpretação

Os deslizes mais frequentes, e como evitá-los:

**Tratar "error" como sinônimo de "defeito de hardware".** Nem todo `error` no `dmesg` indica hardware quebrado. `failed with error -2` ao carregar firmware costuma ser pacote `linux-firmware` desatualizado; `degraded` num serviço pode ser configuração. Classifique antes de concluir.

**Ignorar o carimbo de tempo.** Um erro de NVMe que aparece uma vez por semana tem significado diferente de um que aparece a cada boot. O *quando* importa tanto quanto o *quê*.

**Filtrar demais, perder contexto.** `grep -i error` deixa de fora warnings que explicam o erro. Leia ao redor da mensagem alvo, não só a linha exata.

**Diagnosticar GPU com a tampa fechada (dock).** O deck no dock dissipa calor de forma diferente de handheld. Um throttling que só aparece no dock pode ser fluxo de ar obstruído pela própria posição.

| Erro | Consequência | Correção |
|---|---|---|
| Concluir hardware sem descartar software | RMA negado, tempo perdido | Esgotar atualizações e testes |
| Ler só a linha do `grep` | Perde a causa raiz | Ler contexto ao redor |
| Ignorar carimbo de tempo | Falha na correlação | Usar `--since`/`--until` |
| Uma ocorrência = defeito | Falso positivo | Reproduzir e repetir |

## Montando seu kit de diagnóstico

Automatizar a coleta acelera tudo. Um script de shell coleta em um comando o que este capítulo ensinou a fazer manualmente — e o salva num pacote pronto para anexar.

```bash
#!/bin/bash
# kit-diag.sh — coleta diagnósticos do Steam Deck
OUT=~/deck-diag-$(date +%Y%m%d-%H%M%S)
mkdir -p "$OUT"

sudo dmesg > "$OUT/dmesg.txt" 2>/dev/null
journalctl -b -p err > "$OUT/journal-err.txt" 2>/dev/null
sensors > "$OUT/sensors.txt" 2>/dev/null
sudo dmidecode -t system > "$OUT/system.txt" 2>/dev/null
lsblk -d -o NAME,SIZE,TRAN,MODEL,SERIAL > "$OUT/storage.txt" 2>/dev/null
lspci | grep -iE "network|vga|audio" > "$OUT/pci.txt" 2>/dev/null

tar czf "$OUT.tgz" "$OUT" && rm -rf "$OUT"
echo "Pacote gerado: $OUT.tgz"
```

Salve como `~/bin/kit-diag.sh`, torne executável com `chmod +x`, e você tem um único comando que produz o dossiê completo — o mesmo que este capítulo construiu seção a seção.

```terminal
$ chmod +x ~/bin/kit-diag.sh
$ ~/bin/kit-diag.sh
Pacote gerado: /home/deck/deck-diag-20250220-143500.tgz
```

Com aliases, os comandos mais usados ficam a uma palavra de distância:

```bash
alias kerlog='sudo dmesg --level=err'
alias syslog='journalctl -b -p err'
alias temps='watch -n 1 sensors amdgpu-pci-0400'
alias steamerr='journalctl -u steam -b -p err'
```

Coloque esses aliases no `~/.bashrc` e o diagnóstico diário fica imediato.

## Quando pedir ajuda (e como)

Mesmo com diagnóstico completo, há casos que exigem a Valve ou a comunidade. A regra: só abra chamado quando o fluxo de sete passos esgotou o lado do software e a evidência aponta, com clareza, para hardware.

Para a comunidade (Reddit, fóruns do Steam Deck), publique: sintoma reproduzível, versão do SteamOS, o resultado do `dmesg --level=err`, e o que você já tentou. Para a Valve, anexe o `steam-logs` e o `deck-info.txt` da seção anterior — o chamado sai pronto e o retorno é rápido.

## Checkpoint final do capítulo

Você domina as ferramentas de diagnóstico do Steam Deck quando consegue, sem consultar nada:

- Usar `dmesg` para ver o que o kernel registrou, filtrado por nível e módulo.
- Navegar o `journalctl` por boot, serviço, prioridade e tempo.
- Gerenciar o crescimento dos logs com `journald.conf` e `--vacuum`.
- Coletar logs do Steam/modo de jogo com `steam-logs`, `PROTON_LOG` e `gamescope`.
- Ler desempenho com MangoHud e controlá-lo com CoreCtrl.
- Medir térmica com `sensors` e `watch`.
- Identificar o hardware com `dmidecode`, `lsblk`, `lspci`, `lsusb`.
- Triangular causa com um fluxo lógico, e documentar tudo para RMA.

## Resumo

- O diagnóstico segue sete passos: reproduzir, fixar o momento, kernel, sistema, específico, medir, decidir.
- A triangulação entre `dmesg`, `journalctl`, `steam-logs` e `sensors` transforma suspeita em causa.
- Evite tratar "error" como "hardware quebrado" sem primeiro descartar software e atualizações.
- Automação com scripts e aliases acelera a coleta e padroniza o dossiê.
- Anexe `steam-logs` e `deck-info.txt` a chamados da Valve para respostas rápidas.

## Exercícios

1. Escolha um sintoma (real ou hipotético) e percorra os sete passos do fluxo, documentando cada achado.
2. Crie o script `kit-diag.sh`, execute-o e inspecione o conteúdo do pacote gerado.
3. Adicione ao `~/.bashrc` os quatro aliases sugeridos e teste cada um.
4. Reproduza (ou simule) um problema de desempenho e triangula a causa usando `journalctl`, `sensors` e MangoHud simultaneamente.
5. **Desafio.** Monte um estudo de caso completo: descreva o sintoma, mostre as saídas de pelo menos quatro ferramentas diferentes, forme uma hipótese de causa com base na triangulação, e proponha a próxima ação (correção de software ou preparação de RMA).