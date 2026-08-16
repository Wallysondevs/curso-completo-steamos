O Steam Deck tem um comportamento que confunde quem vem do Windows: conecte um disco pela porta USB-C e, na maioria das vezes, ele aparece magicamente no gerenciador de arquivos Dolphin, montado e pronto para usar, sem que você tenha digitado um único comando. Quem faz essa mágica é o `udisks2`, um daemon que conversa com o KDE Plasma e monta discos removíveis automaticamente. Entender essa engrenagem ajuda a diagnosticar quando a mágica falha — e a pará-la quando você não quer que o disco seja montado.

:::objetivos
- Entender o papel do udisks2 na montagem automática de discos removíveis
- Saber onde o SteamOS/KDE monta discos e por que o caminho inclui o nome do usuário
- Configurar comportamento de automontagem via KDE System Settings
- Diagnosticar por que um disco conectado não foi montado automaticamente
- Bloquear a montagem automática quando necessário
:::

## O motor: udisks2

`udisks2` é um daemon que roda em segundo plano e recebe eventos do kernel via `udev`. Quando você conecta um disco, o kernel cria o dispositivo em `/dev` e dispara um evento; o `udisks2` captura esse evento e — se as políticas permitirem — monta o disco num caminho padronizado.

O caminho é sempre `/run/media/<usuário>/<rótulo>`:

```terminal
$ ls /run/media/ana/
BACKUP   DADOS   KINGSTON
```

Isso não é coincidência: o `udisks2` monta discos removíveis em `/run/media/` (um tmpfs, volátil) para que o diretório não fique sujo com montagens órfãs após um reboot. O subdiretório com o nome do usuário garante isolamento entre usuários num sistema multiusuário — embora no Steam Deck isso raramente importe, porque o uso é essencialmente single-user no modo Desktop.

## O que acontece quando você conecta um disco USB-C

O fluxo completo, do hardware ao Dolphin, dura frações de segundo:

1. O kernel detecta o dispositivo USB e cria `/dev/sda` e `/dev/sda1`.
2. O `udev` emite um evento de adição.
3. O `udisks2` consulta a tabela de partições e o UUID.
4. Se o sistema de arquivos for reconhecido, o `udisks2` monta em `/run/media/ana/DADOS`.
5. O KDE Plasma (via Solid, sua camada de hardware) detecta a montagem e emite uma notificação.
6. O Dolphin mostra o disco na barra lateral.

Você pode inspecionar o que o `udisks2` sabe sobre os discos conectados:

```terminal
$ udisksctl status
MODEL                     REVISION  SERIAL               DEVICE
------------------------------------------------------------------------
Samsung SSD 990 PRO 2TB            S7DXNE0XC07424N      nvme0n1
Samsung PSSD T7           0        S57CNX0W123456       sda
```

Para ver detalhes de um disco específico:

```terminal
$ udisksctl info -b /dev/sda
/org/freedesktop/UDisks2/block_devices/sda:
  org.freedesktop.UDisks2.Block:
    ...
    IdLabel:                DADOS
    IdUUID:                 B2F4-1A08
    Size:                   512110190592
    ...
```

## Configurando o comportamento de automontagem

O KDE Plasma permite controlar o que acontece quando você conecta mídia removível. As configurações ficam em **System Settings → Removable Storage → Removable Devices**:

- **On login**: monta automaticamente discos que já estavam conectados antes do login.
- **On insertion**: monta quando o disco é conectado.
- **Automatic mounting**: liga/desliga a automontagem por completo.

Você também pode configurar ações específicas por tipo de mídia — por exemplo, iniciar o Dolphin automaticamente ao conectar um disco.

Estas configurações são salvas pelo KDE no arquivo `~/.config/kded_device_automounterrc`. Você pode inspecioná-lo para ver o estado atual:

```terminal
$ cat ~/.config/kded_device_automounterrc
[General]
AutomountEnabled=true
AutomountOnLogin=true
AutomountUnknownDevices=true
```

:::dica
Se você usa o EmuDeck e gerencia ROMs no cartão SD, a automontagem do KDE é sua aliada: o cartão SD aparece em `/run/media/deck/` automaticamente e o EmuDeck o encontra. Se a automontagem falhar, seus emuladores perdem a biblioteca — o diagnóstico começa com `udisksctl status` e `systemctl status udisks2`.
:::

## Quando a automontagem falha

Conectou o disco e nada apareceu? O diagnóstico segue uma sequência:

```terminal
## Passo 1: o kernel viu o disco?
$ lsblk
## Se o disco não aparecer, o problema é de hardware ou de driver USB.

## Passo 2: o udisks2 está rodando?
$ systemctl status udisks2
● udisks2.service - Disk Manager
     Active: active (running) since Thu 2025-01-12 14:02:33 -03; 2h ago
...

## Passo 3: o disco tem sistema de arquivos reconhecível?
$ sudo blkid /dev/sda1
## Se TYPE= estiver vazio, o disco está sem sistema de arquivos.

## Passo 4: monte manualmente para ver o erro real
$ udisksctl mount -b /dev/sda1
## ou
$ sudo mount /dev/sda1 /mnt/teste
```

Causas comuns de falha de automontagem:

- **Sistema de arquivos sujo** (NTFS com "fast startup" do Windows ativado): o kernel se recusa a montar para proteger os dados.
- **Disco sem tabela de partições**: `lsblk` mostra o disco mas nenhuma partição.
- **Sem sistema de arquivos**: disco novo, não formatado.
- **Cabo USB-C só de energia**: alguns cabos baratos não transmitem dados.

## Bloqueando a automontagem

Há cenários em que você **não quer** que o disco seja montado automaticamente — por exemplo, ao conectar um disco de backup que você monta manualmente em ponto específico, ou ao fazer recuperação de dados. Você pode:

1. Desativar a automontagem no KDE System Settings temporariamente.
2. Usar `udisksctl unmount` para desmontar após a automontagem.
3. Impedir que uma partição específica seja automontada adicionando uma regra udev — mais invasivo, mas permanente.

Para desmontar via udisks2:

```terminal
$ udisksctl unmount -b /dev/sda1
Unmounted /dev/sda1.
```

E para desligar o dispositivo completamente (power off do disco):

```terminal
$ udisksctl power-off -b /dev/sda
```

:::atencao
No SteamOS em modo Gaming, a automontagem de discos via USB-C ocorre em segundo plano, mas a interface não exibe notificações. Se você precisar acessar o disco, use o modo Desktop ou monte manualmente via terminal no modo Gaming (acessível por `[[Ctrl+Alt+F3]]`).
:::

## Resumo

- `udisks2` é o daemon que monta discos removíveis automaticamente ao detectar eventos do kernel via udev.
- Discos automontados aparecem em `/run/media/<usuário>/<rótulo>`.
- O KDE Plasma controla a política de automontagem em System Settings → Removable Storage.
- `udisksctl status` e `udisksctl info -b /dev/sdX` inspecionam o estado gerenciado pelo udisks2.
- Falhas de automontagem são diagnosticadas com `lsblk`, `systemctl status udisks2` e `blkid`.
- Cabos USB-C só de energia e NTFS com "fast startup" do Windows são causas comuns de falha.

## Exercícios

1. Conecte um disco e identifique com `udisksctl status` qual dispositivo foi atribuído. Compare com a saída de `lsblk`.
2. Use `udisksctl info -b /dev/sdX` (substituindo pelo disco) e encontre os campos `IdLabel`, `IdUUID` e `IdType`. Eles batem com `blkid`?
3. Desmonte um disco automontado usando `udisksctl unmount -b /dev/sdX1`. Confirme com `lsblk` que ele não tem mais ponto de montagem. Remonte-o com `udisksctl mount -b /dev/sdX1`.
4. Abra o arquivo `~/.config/kded_device_automounterrc` e veja o estado da automontagem. Altere a configuração pelo KDE System Settings e observe como o arquivo muda.
5. **Desafio.** Simule um disco "sujo" criando um arquivo-bloco formatado como NTFS, montando-o, copiando dados e desmontando sem `sync`. Tente montá-lo com `udisksctl mount` e observe se o udisks2 emite alguma mensagem de erro. Use `sudo ntfsfix` para limpar o bit de dirty e monte novamente.