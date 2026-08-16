Você percorreu as oito seções anteriores — logs, chroot, kernel, drivers — e o problema persiste, ou o sistema está tão quebrado que o chroot não basta, ou simplesmente você decidiu começar do zero. A restauração de fábrica e a reinstalação são as opções nucleares. Mas entre elas há uma diferença importante: a restauração limpa os dados mas mantém a imagem de sistema da Valve; a reinstalação a partir de uma imagem externa substitui tudo. Esta seção explica quando cada uma é a escolha certa e como executá-la sem perder o que é recuperável.

:::objetivos
- Distinguir restauração de fábrica de reinstalação por imagem
- Executar o reset de fábrica do SteamOS preservando o que for possível
- Baixar, gravar e inicializar uma imagem de recuperação
- Planejar o backup do que importa antes de apagar tudo
:::

## Reset de fábrica vs. reinstalação: qual e quando

O reset de fábrica usa a imagem de sistema **já presente** nas partições de recuperação do Steam Deck. Ele formata as partições de dados e recria o estado de primeira inicialização — rápido, não precisa de pendrive, e mantém a versão de fábrica. A reinstalação a partir de uma imagem externa (pendrive com a ISO de recuperação da Valve) é mais profunda: reescreve até as partições de sistema, troca a versão se você quiser e corrige corrupção das partições A/B do SteamOS.

| Situação | Reset de fábrica | Reinstalação por imagem |
|---|---|---|
| Sistema quebrado mas partições íntegras | Sim | Desnecessário |
| Partições de recuperação intactas | Sim | — |
| Partições A/B corrompidas ou apagadas | Não | Obrigatório |
| Mudar de canal (stable → beta) | Não | Sim (com imagem desejada) |
| SSD trocado (disco novo, vazio) | Não | Único caminho |

:::dica
Antes de qualquer ação destrutiva, monte a partição `/home` pelo ambiente live e copie os salvamentos. Muitos jogos salvam em `~/.local/share/Steam/steamapps/compatdata/` dentro dos prefixos Proton, e perder essa pasta é perder centenas de horas de progresso que a nuvem do Steam não cobre.
:::

## O reset de fábrica pelo menu

O SteamOS expõe o reset de fábrica na própria interface do modo recovery. Desligue o aparelho, mantenha o botão de volume menos pressionado e ligue — o menu de boot aparece. Escolha a opção de recuperação (*SteamOS Recovery*) e, na interface que sobe, selecione "Reimage Steam Deck". Esse processo:

1. Apaga as partições de dados (`/home` e afins).
2. Recria o sistema de arquivos usando a imagem de fábrica armazenada nas partições de recuperação.
3. Reinicia como se fosse primeira inicialização.

```terminal
$ mount | grep nvme
/dev/nvme0n1p4 on / type ext4 (ro,relatime)
/dev/nvme0n1p6 on /home type ext4 (rw,relatime)
/dev/nvme0n1p2 on /recovery type ext4 (ro,relatime)
```

A partição `/recovery` (`nvme0n1p2` neste exemplo) contém a imagem de fábrica. Se você formatou ou apagou essa partição ao tentar redimensionar o disco, o reset de fábrica pelo menu **não funciona mais** — você precisa da reinstalação por pendrive.

:::atencao
O reset de fábrica apaga `/home` completamente. Seus saves, screenshots, configurações e arquivos pessoais somem. A nuvem do Steam guarda saves de jogos compatíveis com Steam Cloud, mas nem todos os jogos (principalmente títulos antigos e mods) têm cobertura. Faça backup antes.
:::

## Reinstalação por imagem de recuperação

Quando o reset de fábrica não é possível (SSD novo, partições de recuperação corrompidas, ou você quer trocar de canal), o caminho é a imagem de recuperação oficial da Valve. O processo é idêntico ao de criar qualquer pendrive bootável:

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS | grep -E 'sd|nvme'
nvme0n1 953.9G disk
sda      14.7G disk
```

No seu computador auxiliar (ou no próprio Deck com dock), baixe a imagem e grave no pendrive com `dd`:

```terminal
$ sudo dd if=steamdeck-recovery-4.img of=/dev/sda bs=4M status=progress conv=fsync
3858759680 bytes (3.9 GB, 3.6 GiB) copied, 47 s, 82 MB/s
920+0 records in
920+0 records out
3858759680 bytes (3.9 GB, 3.6 GiB) copied, 85.42 s, 45.2 MB/s
```

A flag `conv=fsync` força a sincronização ao final — importante para não ter um pendrive com buffer sujo. Depois, insira o pendrive no Deck (via dock ou adaptador USB-C), ligue segurando volume menos e selecione o pendrive no menu de boot.

:::perigo
O `dd` grava blocos crus, sem piedade. Confira o dispositivo de destino três vezes antes de apertar Enter: `/dev/sda` pode ser o pendrive num computador auxiliar, mas se você trocar por `/dev/nvme0n1`, apagou o disco interno. A flag `status=progress` ajuda a ver que está rodando, mas não impede erro humano.
:::

## Planejando o backup antes do "reset nuclear"

Um reset sem backup é aposta. Antes de disparar a formatação, faça o mínimo:

1. Copie tudo de `~/.local/share/Steam/steamapps/compatdata/` para um disco externo — são os prefixos Wine/Proton.
2. Exporte a lista de pacotes Flatpak instalados com `flatpak list --app --columns=application > flatpaks.txt`.
3. Copie `~/.var/app/` se usa Flatpaks com dados locais (navegadores, clientes de chat, emuladores).
4. Salve `~/.config/` inteiro se tem configurações manuais que você fez (atalhos, scripts, temas).

```terminal
$ tar -czf /run/media/ana/externo/backup-steamdeck.tar.gz \
    ~/.local/share/Steam/steamapps/compatdata \
    ~/.var/app \
    ~/.config \
    ~/Documents
```

Um tarball no disco externo garante que, após a reinstalação, você extrai os saves e volta a jogar de onde parou.

## Depois da reinstalação

Com o sistema limpo recém-instalado, a ordem de recuperação é: rede, atualizações do sistema, Steam, jogos, saves.

```terminal
$ sudo steamos-update
$ flatpak install --from=flatpaks.txt   # se salvou a lista antes
$ tar -xzf /run/media/ana/externo/backup-steamdeck.tar.gz -C ~/
```

Lembre-se de que o Steam detecta jogos já baixados se você preservar a pasta `steamapps/common` — mas o mais seguro é deixar o Steam baixar de novo e depois restaurar só os saves.

## Resumo

- Reset de fábrica usa a partição de recuperação interna; reinstalação por imagem usa pendrive externo com a ISO da Valve.
- Reset é mais rápido e não precisa de pendrive, mas exige que as partições de recuperação estejam intactas.
- Reinstalação por imagem resolve corrupção das partições de sistema e serve para SSD novo.
- `dd` grava a imagem no pendrive com `bs=4M` e `conv=fsync`; confira o dispositivo destino três vezes.
- Backup mínimo: `compatdata` (saves Proton), `~/.var/app` (Flatpak), `~/.config` e `~/Documents`.
- Após reinstalar, atualize o sistema, reinstale Flatpaks e extraia o tarball de backup.

## Exercícios

1. Liste todas as partições do seu SSD com `lsblk -o NAME,SIZE,FSTYPE,LABEL`. Identifique qual é a partição de recuperação (se houver).
2. Calcule o tamanho do seu diretório de saves Proton com `du -sh ~/.local/share/Steam/steamapps/compatdata/`. Vale a pena fazer backup?
3. Gere um tarball de teste com `tar -czf /tmp/backup-teste.tar.gz ~/.config/` e depois liste seu conteúdo com `tar -tzf /tmp/backup-teste.tar.gz | head -20`.
4. Liste todos os Flatpaks instalados com `flatpak list --app --columns=application` e salve a saída num arquivo. Daria para reinstalar tudo com essa lista?
5. **Desafio.** Sem consultar documentação externa: elabore um plano de reinstalação completa do zero que inclua (a) backup dos saves não cobertos pelo Steam Cloud, (b) preservação da lista de jogos instalados, (c) restauração dos saves e (d) verificação de que cada jogo restaurado funciona. Qual é o ponto mais frágil desse plano — onde ele pode falhar silenciosamente?