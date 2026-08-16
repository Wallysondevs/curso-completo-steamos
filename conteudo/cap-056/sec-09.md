Depois de sete seções de ferramentas e comandos, vale consolidar tudo num fluxo de decisão prático. Esta seção entrega o resumo executivo: qual sistema de arquivos escolher em cada cenário, os comandos na ordem certa, os erros mais comuns a evitar e um checklist do "cartão perfeito" para o Steam Deck.

:::objetivos
- Ter um fluxo de decisão claro para escolher o sistema de arquivos
- Reunir a sequência de comandos correta (formatação → montagem → migração)
- Evitar os erros mais comuns que corrompem dados
- Conhecer o checklist do cartão ideal para o Deck
- Consolidar o aprendizado do capítulo
:::

## Fluxo de decisão: qual sistema de arquivos?

Percorra em ordem:

1. **O cartão vai só no Deck?**
   - Sim → continue.
   - Não (vai no Windows/macOS também) → **exFAT**, mas use para transferência/mídia, não como biblioteca primária de jogos Proton.

2. **Você precisa de snapshots/compressão/rollback?**
   - Sim → **Btrfs**, aceitando o trade-off de gravações e sem case-fold maduro.
   - Não → continue.

3. **Vai instalar jogos Steam/Proton como biblioteca principal?**
   - Sim → **ext4 com casefold** (Modo Jogo ou `mkfs.ext4 -O casefold`).
   - Não (só ROMs/mídia) → qualquer um, preferindo ext4 ou exFAT conforme o caso 1.

A esmagadora maioria dos usuários termina no ext4 do Modo Jogo. É o default por bons motivos.

## A sequência de comandos, na ordem certa

```terminal
# 0. Identificar o dispositivo (NUNCA nvme*)
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT

# 1. Desmontar (se estiver montado)
$ sudo umount /run/media/deck/SD

# 2. Formatar (escolha UMA)
$ sudo mkfs.ext4 -L SD -O casefold /dev/mmcblk0p1     # ext4 (recomendado)
$ sudo mkfs.btrfs -L SD -m single -d single -f /dev/mmcblk0p1  # Btrfs
$ sudo mkfs.exfat -L MEDIA /dev/mmcblk0p1            # exFAT

# 3. Montar
$ sudo mkdir -p /mnt/sd
$ sudo mount -o noatime /dev/mmcblk0p1 /mnt/sd

# 4. (Opcional) montagem automática via fstab (use UUID + nofail)

# 5. Mover jogos
$ pkill steam
$ rsync -avP ~/.local/share/Steam/steamapps/ /run/media/deck/SD/steamapps/
```

## Erros mais comuns a evitar

1. **Formatar `/dev/nvme0n1*`** em vez do `mmcblk*` — apaga o SteamOS inteiro.
2. **Mover `steamapps` com o Steam aberto** — ele sobrescreve o estado ao fechar.
3. **Puxar o cartão sem ejetar** (`umount` + `sync`) — corrompe exFAT e, por extensão, dados.
4. **Instalar jogos Proton em exFAT** — case-sensitivity e falta de symlinks quebram títulos.
5. **Confiar em cartão falsificado** — a controladora mente a capacidade e sobrescreve dados.
6. **Ignorar o `nofail` no fstab** — boot pode falhar com o slot vazio.

:::atencao
Os dois primeiros erros da lista — formatar o NVMe e migrar com o Steam aberto — são os de consequência mais grave (perda total do sistema ou da biblioteca). Eles se evitam com dois hábitos simples: sempre conferir `lsblk` e sempre `pkill steam` antes de mexer.
:::

## O checklist do cartão ideal

- [ ] **Cartão genuíno e testado** (`f3probe`/`badblocks`) com a capacidade realmente anunciada.
- [ ] **Classe A2** para IOPS altos (carregamento e shaders), de marca confiável.
- [ ] **Sistema de arquivos certo** (ext4+casefold para biblioteca Steam; exFAT para intercâmbio).
- [ ] **Montado com `noatime`** para reduzir gravações.
- [ ] **fstab com UUID + `nofail`** se você depende do cartão em cada boot.
- [ ] **Backup dos saves** em outro lugar (cartão não é backup).

## Para onde ir a partir daqui

- Se o cartão ficou lotado, considere **compressão Btrfs** ou mover jogos pesados de volta ao SSD.
- Se o desempenho incomoda, avalie um **cartão A2 melhor** antes de culpar o sistema de arquivos.
- Para automação, explore **montagem via systemd/udisks** e scripts de backup agendado com o cartão fixo via fstab.

:::dica
O microSD é a forma mais barata de "desbloquear" armazenamento no Deck, mas não é mágica: ele é mais lento que o NVMe e tem vida útil finita. Use o SSD interno para os jogos que você joga com frequência e os pesados; o cartão, para a biblioteca de trás e ROMs.
:::

## Pontos-chave

- Decisão em três perguntas: só no Deck? precisa de snapshots? é biblioteca Steam/Proton? → ext4 (+casefold) na maioria.
- Ordem segura: `lsblk` → `umount` → `mkfs` → `mount` → `rsync`.
- Os erros graves (formatar NVMe, migrar com Steam aberto) têm hábito de prevenção simples (conferir + `pkill steam`).
- Cartão ideal: A2 genuíno, testado, no sistema de arquivos certo, com `noatime` e `nofail`.
- Cartão é expansão, não backup — proteja seus saves em outro lugar.

## Exercícios

1. Percorra o fluxo de decisão com o seu caso real e justifique a escolha do sistema de arquivos.
2. Execute a sequência completa (formatação → montagem → migração de um jogo) num cartão de teste.
3. Reescreva a linha de fstab usando UUID + `nofail` e teste no boot.
4. Faça um teste de autenticidade `f3probe --destructive` num cartão suspeito e registre o resultado.
5. **Desafio.** Monte uma tabela comparando ext4, Btrfs e exFAT nos critérios: desempenho, compatibilidade Proton, snapshots, e uso em microSD — e defenda sua escolha final.
