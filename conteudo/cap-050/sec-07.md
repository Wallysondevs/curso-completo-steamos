Backup local protege contra formatação e erro humano; já a nuvem protege contra a perda do próprio Deck e permite jogar a mesma campanha em duas máquinas. O EmuDeck oferece uma solução integrada chamada **CloudSync**, mas entender o mecanismo por trás — sincronização de arquivos — abre portas para alternativas mais flexíveis como Syncthing. Esta seção conecta os dois mundos.

:::objetivos
- Entender por que saves precisam de sincronização específica, não só upload
- Configurar o CloudSync do EmuDeck com um provedor
- Distinguir o save do Steam (Steam Cloud) do save de emulador
- Montar uma sincronização própria com Syncthing
- Evitar conflitos e sobrescrita de saves
:::

## Sincronizar ≠ fazer upload

Um backup na nuvem é uma cópia de mão única, boa para restaurar depois. Jogar em dois aparelhos exige **sincronização bidirecional**: o que mudou no Deck vai para a nuvem, e o que mudou em outro lugar volta. É exatamente o que o Steam Cloud faz com seus jogos de PC — mas ele **não cobre emuladores**, porque não sabe o que é um `.srm` nem um `.state`.

Por isso o EmuDeck tem o CloudSync, e por isso alternativas como Syncthing fazem sentido: elas preenchem a lacuna que o Steam Cloud deixa para a sua coleção de emulação.

## O CloudSync do EmuDeck

O CloudSync é um conjunto de *presets* que usa o `rclone` por baixo para empurrar `Emulation/saves/` (e outros alvos) para provedores como Dropbox, Google Drive, OneDrive ou pCloud:

```terminal
$ ls ~/emudeck/backend/
cloudSync.py
rclone.conf
```

Na configuração, você escolhe qual serviço e quais pastas sincronizar. O EmuDeck gera um `rclone.conf` com as credenciais do provedor e define os pares origem→destino:

```ini
[dropbox]
type = dropbox
token = {"access_token":"..."}

[saves]
type = alias
remote = /run/media/mmcblk0p1/Emulation/saves
```

Depois de configurado, há dois modos de uso: **Sync now** (manual, disparado na hora) e agendado (em intervalos). O sync é bidirecional, então um save feito no Deck num dia aparece no PC no outro, e vice-versa.

:::atencao
Cada provedor tem uma pasta raiz própria de salvamento. Verifique o `rclone.conf` para saber onde o CloudSync está realmente escrevendo — às vezes é a raiz da conta, o que polui o provedor. Ajuste o remote para um subdiretório como `/EmuDeck/saves`.
:::

## Por que o save do jogo de PC é diferente

Um jogo nativo do Steam grava seu progresso em `~/.local/share/Steam/steamapps/compatdata/<AppID>/...` ou em `~/.steam/steam/userdata/<id>/<AppID>/`, e o Steam Cloud cuida dele sozinho. O save do emulador vive em `Emulation/saves/` e **ninguém** cuida dele além de você.

```terminal
$ ls ~/.steam/steam/userdata/12345678/
config/ ${APPID}s/
630/ 723/
```

Não tente reapontar o CloudSync para as pastas do Steam Cloud — são mecanismos separados e isso gera duplicação e conflito. Deixe cada um no seu domínio: Steam Cloud para jogos de PC, CloudSync/Syncthing para emulação.

## Syncthing: sincronização sem nuvem central

Se você tem outro computador sempre ligado (um NAS, um desktop), o **Syncthing** sincroniza direto entre os aparelhos, sem passar por servidor de terceiros. Instale nas duas pontas:

```terminal
$ systemctl --user status syncthing
● syncthing.service - Syncthing
   Active: active (running)
```

Cada dispositivo tem um ID, e você "pareia" um com o outro. Depois, compartilha a pasta `Emulation/saves/` do Deck com uma pasta equivalente no outro aparelho:

```terminal
$ syncthing cli config folders list
default
saves-emudeck (shared with ABCDE-FGHIJ-...)
```

O Syncthing mantém um índice de versões e detecta conflitos — se o mesmo save mudar nas duas pontas antes de sincronizar, ele guarda a versão perdida como arquivo de conflito em vez de descartá-la silenciosamente.

:::dica
O Syncthing funciona bem com o Deck porque roda em segundo plano e retoma sozinho quando a rede volta. Para saves que você mexe com frequência, ele costuma ser mais imediato que o CloudSync agendado — a sincronização dispara em segundos, não a cada N minutos.
:::

## Evitando conflitos

Save states são o item mais propenso a conflito, porque mudam a cada uso. Duas regras simples reduzem quase tudo:

1. **Não jogue o mesmo jogo simultaneamente** em dois aparelhos com sync ativo.
2. **Deixe as duas pontas sincronizarem antes de desligar** qualquer uma delas.

```terminal
$ syncthing cli show system | grep -c 'Idle'
```

Se o status das duas pastas for `Idle` ou `Up to Date`, está seguro para encerrar. Não confie em "fechei e já era" — o envio pode levar alguns segundos.

## Resumo

- Steam Cloud não cobre emuladores; só jogos de PC.
- O CloudSync do EmuDeck usa `rclone` para sincronizar saves com Dropbox/Drive/OneDrive.
- O Syncthing sincroniza direto entre aparelhos, sem nuvem central, e preserva conflitos.
- O save de emulador (`Emulation/saves/`) é de responsabilidade sua.
- Evite jogar o mesmo jogo em duas pontas ao mesmo tempo e aguarde o sync concluir antes de desligar.

## Exercícios

1. Localize seu `rclone.conf` (ou crie um) e identifique o tipo e o remote do provedor configurado.
2. Rode o CloudSync em modo manual e confirme, pelo provedor, que uma subpasta de saves apareceu na nuvem.
3. Instale o Syncthing em duas máquinas, pareie os dispositivos e compartilhe uma pasta de teste pequena.
4. Crie um arquivo nas duas pontas com o mesmo nome e veja como o Syncthing sinaliza o conflito.
5. **Desafio.** Monte uma sincronização do Syncthing para `Emulation/saves/` e escreva uma regra de "boas práticas" (baseada no que você aprendeu sobre save states) para evitar sobrescrita de progresso.