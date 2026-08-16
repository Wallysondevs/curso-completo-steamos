Três peças concentram a maioria das trocas no Steam Deck: **SSD**, **bateria** e **tela**. São também as três com mais pegadinhas — o SSD é simples mas exige reinstalar o sistema; a bateria é colada com adesivo forte; a tela exige calor e mão firme. Esta seção percorre cada uma, na ordem de dificuldade.

:::objetivos
- Trocar o SSD (a troca mais simples e comum) e reinstalar o SteamOS
- Substituir a bateria removendo o adesivo com segurança
- Trocar a tela usando calor controlado e reposicionamento correto
- Reinstalar a imagem de recuperação do SteamOS
- Validar cada troca depois de concluída
:::

## Troca de SSD (dificuldade: baixa)

O SSD é o ponto de entrada ideal para quem nunca fez reparo. Ele fica logo sob a tampa, preso por um escudo metálico e um parafuso. É formato **M.2 2230** NVMe — compre um NVMe (não SATA) de 2230.

**Passos:**
1. Com o Deck aberto e a bateria desconectada, desparafuse o escudo do SSD.
2. Deslize o SSD para fora do conector (não puxe para cima).
3. Transfira a película térmica/escudo para o drive novo, se aplicável.
4. Insira o novo SSD em ~30° e empurre até assentar; recoloque o parafuso e o escudo.

```terminal
$ sudo blkdiscard --version 2>/dev/null || echo "sem blkdiscard"
```

Depois de trocar o SSD, ele vem vazio. Você precisa reinstalar o SteamOS com o **drive de recuperação** (pendrive com a imagem oficial da Valve). O processo grava a imagem limpa e reformata as partições.

```terminal
$ lsblk -f /dev/nvme0n1
NAME        FSTYPE  LABEL
nvme0n1p1   vfat    esp
nvme0n1p2   vfat    efi
nvme0n1p3   btrfs   rootfs-A
```

Após a recuperação, o `lsblk` mostra o esquema de partições do SteamOS: uma ESP/EFI e as partições raiz em esquema A/B (a Valve usa `rootfs-A`/`rootfs-B` para atualizações atômicas).

:::dica
Tire os parafusos do escudo com a ponta do magnetizador, não os arranhões. E guarde o SSD antigo intacto — ele pode virar armazenamento externo com um case USB M.2 barato.
:::

## Reinstalando o SteamOS

A reinstalação usa a ferramenta de recuperação da Valve, gravada num pendrive de 8 GB+.

```terminal
$ # grave a imagem (exemplo ilustrativo com dd):
$ sudo dd if=steamdeck-recovery.img of=/dev/sdX bs=4M status=progress conv=fsync
```

Troque `/dev/sdX` pelo seu pendrive (confirme com `lsblk` — gravar no disco errado destrói dados). Depois, insira o pendrive no Deck (via dock/adaptador USB-C) e boot com volume (–) + power, escolhendo o drive de recuperação. Há opções **"Re-imagem completa"** (apaga tudo) e **"Reinstalar SteamOS"** (tenta preservar `/home`).

:::atencao
A "re-imagem completa" apaga **todos** os dados do SSD — jogos, saves locais, tudo. Faça backup antes. A opção "reinstalar" preserva `/home` mas pode não resolver se a partição de sistema estiver corrompida.
:::

## Troca de bateria (dificuldade: média)

A bateria é o passo que exige mais paciência, por causa do adesivo. Ela ocupa a metade inferior e conecta à placa por um plug.

**Passos:**
1. Bateria desconectada e Deck aberto. Desconecte o conector da bateria puxando o plug com spudger.
2. Remova os parafusos que prendem a bateria.
3. Aplique **calor suave** (secador, ~60–70 °C) sob a bateria para amolecer o adesivo.
4. Use picareta plástica para descolar lentamente; **não dobre, não perfure** a célula.
5. Instale a nova bateria, recoloque parafusos e reconecte o plug.

```terminal
$ cat /sys/class/power_supply/BAT1/uevent | grep -iE 'cycle|full|capacity'
```

Após a troca, recalibre o medidor: carregue a 100%, use até desligar, carregue a 100% de novo. O ciclo `cycle_count` zera ou é herdado conforme a bateria; o importante é `energy-full` voltar perto do valor nominal.

:::atencao
Bateria de lítio **nunca** deve ser dobrada, perfurada ou aquecida demais. Se o adesivo não cede, aplique mais calor gradual, não mais força. Uma célula perfurada pode incendiar.
:::

## Troca de tela (dificuldade: alta)

A tela é a peça mais cara e a operação mais arriscada. Ela é colada com adesivo ao longo de toda a borda e conectada por flat cables.

**Passos:**
1. Desconecte a bateria e remova tudo que bloqueia o acesso (às vezes o escudo/ventoinha).
2. Aqueça a borda da tela com pistola de ar quente (~70–80 °C) para amolecer o adesivo.
3. Use a ventosa para levantar um canto, insira a picareta e descole contornando.
4. Desconecte os flat cables do display (toque e backlight) soltando a trava com spudger.
5. Remova a tela velha, limpe resíduo de adesivo com álcool isopropílico, aplique novo adesivo e assente a nova tela.

```terminal
$ xrandr --listmonitors
```

Depois de trocar a tela, `xrandr` confirma o painel interno ativo. Teste cores (tela branca/preta/verde) para achar pixels mortos ou backlight irregular antes de fechar de vez.

:::dica
Se você danificar um flat cable durante a troca de tela, o sintoma típico é tela "acesa mas sem imagem" ou "imagem mas sem backlight". Flat cable dobrado rompe as ligações finas — manuseie sempre pela trava e pelo reforço, nunca pela fita.
:::

## Validando as trocas

Regra de fechamento: toda troca termina com validação. Rode o diagnóstico da seção 4 em cada peça substituída:

```terminal
$ sudo smartctl -H /dev/nvme0n1        # SSD: PASSED?
$ cat /sys/class/power_supply/BAT1/uevent   # bateria: capacidade nominal?
$ sensors                               # temperaturas estáveis?
$ xrandr --listmonitors                 # tela ativa?
```

Só recoloque os 8 parafusos da tampa traseira depois que tudo passar. A conclusão lógica do reparo físico é o tema da seção 6: o sistema térmico.
