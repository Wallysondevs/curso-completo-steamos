Todas as seções anteriores convergem para um único ato: decidir qual sistema roda a sua máquina e, se for o caso, executar a troca sem perder nada. A decisão já foi municiada; o que falta é a parte operacional — o que preservar antes de formatar, como levar seus jogos e saves, e como experimentar uma distro nova sem se comprometer de vez. Migração bem-feita não é coragem, é checklist.

:::objetivos
- Consolidar os critérios de escolha de uma distro gaming
- Planejar um backup completo antes de migrar
- Levar jogos, saves e configurações para o sistema novo
- Experimentar uma distro sem instalá-la (live USB, dual boot)
- Executar a migração com rollback possível
:::

## A decisão, em uma frase

Se há uma conclusão que o capítulo inteiro sustenta, é esta: **escolha pelo hardware e pelo uso, não pela empolgação**. Resumindo os critérios trabalhados até aqui:

| Se você… | Vá de… |
|---|---|
| Usa Steam Deck e quer mínimo atrito | SteamOS |
| Tem handheld/PC sem suporte da Valve (AMD/Intel) | Bazzite `deck` |
| Quer desktop completo + gaming | Bazzite `desktop` |
| Tem GPU NVIDIA | Bazzite (imagem NVIDIA) |
| Quer um console dedicado à TV | ChimeraOS |

Se você ainda titubeia, releia a matriz de comparação e atribua pesos aos critérios que importam no seu dia a dia. A decisão raramente empata quando o hardware é fixo.

## O que preservar antes de qualquer formato

A regra número um da migração é: **nunca formate antes de ter duas cópias verificadas do que importa**. O que importa, no contexto de gaming, cabe em três grupos: saves, jogos e configurações.

**Saves.** No Steam, muitos vivem na nuvem (`Steam Cloud`), mas nem todos — e jogos não-Steam, emuladores e saves locais não sobem. O caminho seguro é copiar as pastas relevantes:

```terminal
$ du -sh ~/.local/share/Steam/userdata ~/.local/share/Steam/steamapps/compatdata 2>/dev/null
24M   ~/.local/share/Steam/userdata
1.4G  ~/.local/share/Steam/steamapps/compatdata
$ tar czf saves-backup.tar.gz ~/.local/share/Steam/userdata ~/.config ~/.local/share/Steam/steamapps/compatdata
```

O `compatdata/` guarda os prefixos Proton/Wine onde muitos jogos salvam progresso local, e `~/.config` concentra configurações de apps e emuladores.

**Jogos.** Rebaixar uma biblioteca de centenas de GB é lento e desnecessário se o armazenamento permite. O mais eficiente é usar a função de backup/restauração do Steam, ou reaproveitar o disco de jogos:

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ | head -5
Counter-Strike 2
Hades
Portal 2
```

**Configurações do sistema.** Lista de Flatpaks, recipes `ujust` e arquivos de dotfiles entram no pacote de migração:

```terminal
$ flatpak list --app --columns=application > meus-flatpaks.txt
$ cat meus-flatpaks.txt
com.valvesoftware.Steam
org.libretro.RetroArch
```

:::perigo
Antes de rodar qualquer `dd` ou apagar partições, desmonte discos externos e **verifique o backup**: rode `tar tzf saves-backup.tar.gz | head` para confirmar que o arquivo não está truncado ou vazio. Um backup que você não validou é um backup que pode não existir.
:::

## Experimentar sem se comprometer

Você não precisa apagar o sistema atual para testar o novo. Duas rotas permitem um "test drive" sem risco:

A **live USB** roda a distro inteira da memória, sem tocar no disco:

```terminal
$ sudo dd if=./bazzite-deck-stable.iso of=/dev/sdb bs=4M status=progress oflag=sync
```

A **dual boot** instala a nova distro numa partição separada, mantendo o sistema antigo intocado e selecionável no boot. É a forma mais realista de conviver com os dois enquanto decide.

```terminal
$ sudo fdisk -l | grep -E '^/dev/(nvme|sd)'
/dev/nvme0n1p1    2048  1048575  1046528  512M EFI System
/dev/nvme0n1p2  1048576  ...       ...      Linux filesystem
/dev/nvme0n1p3   ...      ...       ...      Linux filesystem
```

Com uma partição livre (ou criada por encolhimento), o instalador do Bazzite (Anaconda) oferece "instalar ao lado" ou disco customizado. O GRUB passa a listar os dois sistemas no boot.

:::dica
Para migrar de SteamOS no Steam Deck para Bazzite preservando a possibilidade de voltar, mantenha a partição do SteamOS intacta e instale o Bazzite em outra. A dual boot no Deck exige cuidado com o particionamento e o bootloader, mas é a única forma de testar de verdade sem abrir mão do original.
:::

## Executando a troca

Com o backup validado e o teste feito, a migração vira rotina: gravar, instalar, restaurar. A ordem que minimiza retrabalho é: sistema → drivers confirmados → Flatpaks → jogos → saves → configurações.

```terminal
$ flatpak install -y --noninteractive < meus-flatpaks.txt
```

Restaurar os Flatpaks a partir da lista gravada economiza o caça-a-cada-app manual. Depois, no Steam, basta apontar a biblioteca para a pasta de jogos reaproveitada (ou restaurar o backup do Steam), e os saves voltam das cópias locais e da nuvem.

```terminal
$ tar xzf saves-backup.tar.gz -C ~/
```

Descompactar o tar no home restaura `userdata`, `compatdata` e `~/.config` de uma vez — mas faça isso **depois** de instalar o Steam, para não confundir o cliente no primeiro login.

:::atencao
Restaure os saves **após** rodar cada jogo ao menos uma vez e depois de deixar o Steam Cloud sincronizar, para não disparar um conflito de versão em massa. Se houver divergência, o diálogo de conflito do Steam favorece a escolha manual — nunca aceite "sobrescrever tudo" às cegas.
:::

## O pós-migração

Migrar não termina no reboot. A primeira semana é de validação: rode três ou quatro jogos representativos (um 2D leve, um 3D pesado, um com HDR se houver painel), confirme TDP e temperatura, e mantenha um deploy bom pinado no Bazzite para rollback rápido. Só depois de alguns dias de uso normal, apague o sistema antigo.

E lembre-se: a decisão não é irreversível. O modelo atômico — e mesmo a dual boot — existe justamente para que trocar de distro seja experimento barato, não aposta de tudo ou nada.

## Resumo

- A escolha se ancora em hardware e uso: SteamOS para Deck, Bazzite para desktop/handhelds alternativos, ChimeraOS para console de TV.
- Preserve saves (`userdata`/`compatdata`), configurações (`~/.config`) e a lista de Flatpaks antes de formatar.
- Valide todo backup (`tar tzf ...`) antes de apagar o disco original.
- Live USB e dual boot permitem experimentar sem comprometer o sistema atual.
- A ordem de migração é: sistema → drivers → Flatpaks → jogos → saves → configurações.
- Restaure saves após a primeira sincronização do Steam Cloud para evitar conflitos.

## Exercícios

1. Liste, na sua máquina atual, os itens que entram num backup de migração (`userdata`, `compatdata`, `~/.config`, lista de Flatpaks) e estime o tamanho com `du -sh`.
2. Crie e valide um backup com `tar czf`, depois confirme a integridade com `tar tzf ... | head` e anote o tamanho final.
3. Gere a lista de Flatpaks instalados (`flatpak list --app --columns=application`) e simule a restauração num ambiente limpo (ou confira comandos sem executar).
4. Grave uma live USB da distro que você testaria e inicialize-a sem instalar. Relate se o hardware (GPU, Wi-Fi, gamepad) foi reconhecido.
5. **Desafio.** Planeje uma migração com dual boot: descreva o particionamento (discos/partições), o ponto de montagem da biblioteca de jogos reaproveitada, e a sequência exata de restauração (sistema → Flatpaks → jogos → saves). Justifique a ordem escolhida para evitar conflito de Steam Cloud.
