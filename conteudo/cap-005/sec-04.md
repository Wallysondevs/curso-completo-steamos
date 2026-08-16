A primeira atualização do SteamOS é um marco: é nela que o aparelho baixa correções de segurança, drivers de GPU mais novos e melhorias do Proton (a camada de compatibilidade que roda jogos de Windows). Ao contrário de um PC comum, onde cada pacote é atualizado individualmente, o SteamOS usa um modelo de *imagem* em que o sistema inteiro é trocado de uma vez. Vale entender esse mecanismo antes de apertar o botão de atualizar.

:::objetivos
- Entender como funciona o modelo de atualização por imagem do SteamOS
- Localizar o serviço responsável pelas atualizações com `systemctl` e `journalctl`
- Verificar a versão instalada antes e depois de atualizar
- Usar o comando `steamos-update` e interpretar sua saída
- Inspecionar partições e espaço antes de uma atualização grande
:::

## Atualização por imagem, não por pacotes

O SteamOS 3.x monta a raiz do sistema em modo somente-leitura e a trata como uma *imagem* completa. Quando uma atualização é lançada, a Valve prepara uma imagem nova (ou um delta dela) e o cliente a aplica sobre a partição de sistema, mantendo a versão anterior disponível para *rollback*. Isso é um desvio do Arch tradicional (que atualiza pacote a pacote com `pacman`) e do Ubuntu de desktop.

A vantagem é a previsibilidade: ou a imagem nova sobe inteira, ou nada muda. Não existe o estado intermediário "atualizei metade e o sistema quebrou". A desvantagem é que você não atualiza componentes isolados — espera o lançamento oficial da Valve.

O serviço que orquestra isso é o `steamos-update`. Ele roda como uma unidade do systemd, o sistema de inicialização e gerenciamento de serviços do SteamOS:

```terminal
$ systemctl status steamos-update --no-pager
● steamos-update.service - SteamOS update service
     Loaded: loaded (/usr/lib/systemd/system/steamos-update.service; enabled; preset: enabled)
     Active: inactive (dead)
  TriggeredBy: ● steamos-update.timer
       Docs: man:steamos-update(8)
```

O estado `inactive (dead)` é normal: o serviço é acionado por um *timer* (`TriggeredBy: steamos-update.timer`) e não fica residente. Ele executa, verifica se há imagem nova e termina. Para ver quando foi a última execução e o que ela fez:

```terminal
$ systemctl list-timers steamos-update.timer --no-pager
NEXT                        LEFT      LAST                        PASSED   UNIT
Sun 2025-08-17 00:00:00 -03 6h left   Sat 2025-08-16 14:00:07 -03 25min ago steamos-update.timer
```

## Verificando a versão antes de atualizar

Antes de qualquer atualização, registre a versão atual. Depois de atualizar, compare. A versão do SteamOS aparece em `/etc/os-release` (vista na seção de primeiro boot), e o kernel em `uname -r`:

```terminal
$ uname -r
6.5.0-valve21-1-neptune-65
$ cat /etc/os-release | grep VERSION
VERSION="3.6.20"
VERSION_ID="3.6.20"
```

O número `3.6.20` é a versão do SteamOS; o `valve21` no kernel é o release do kernel da Valve. Anote ambos. Após a atualização, o kernel e o `VERSION` devem caminhar juntos (cada imagem traz seus próprios binários).

Uma checagem importante antes de atualizar é o espaço livre, pois a imagem nova é baixada para a partição de dados antes de ser aplicada:

```terminal
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  4.9G  3.1G  1.6G  64% /
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  458G  120G  322G  73% /home
```

A partição raiz (`/`) é pequena (da ordem de 5 GB no modelo de 512 GB) e fica sempre com uso alto por design — o sistema inteiro cabe nela. Já `/home`, na partição de dados, é onde a imagem nova é baixada antes de ser aplicada.

:::nota
A raiz `/` no SteamOS é propositalmente apertada e somente-leitura. Não se assuste com `Use%` alto na raiz; o espaço que importa para uma atualização é o livre em `/home` (ou na partição de dados), onde o download temporário acontece.
:::

## Disparando e acompanhando a atualização

O cliente gráfico oferece "verificar atualizações" nas configurações do modo Gaming, mas dá para fazer o mesmo pelo terminal com `steamos-update`. O comando é a porta de entrada para o mecanismo:

```terminal
$ steamos-update check
Checking for updates...
Current branch: stable
Latest installed: 3.6.20
Remote available: 3.6.21
Newer version available, but user-applied updates are disabled.
```

O campo `branch` indica o canal (normalmente `stable`, mas há `beta` e `preview` para quem opta por atualizações antecipadas). Se uma versão mais nova estiver disponível, o comando avisa. A mensagem "user-applied updates are disabled" aparece quando a atualização automática está desligada nas configurações.

Para ver o registro detalhado do que o serviço já fez, o `journalctl` filtra as mensagens da unidade:

```terminal
$ journalctl -u steamos-update --no-pager -n 15
Aug 16 14:00:07 steamdeck steamos-update[1831]: Checking for updates on branch 'stable'
Aug 16 14:00:08 steamdeck steamos-update[1831]: Current version 3.6.20 is already up to date
Aug 16 14:00:08 steamdeck steamos-update[1831]: Update check complete
```

Aqui o serviço conferiu o canal `stable`, viu que `3.6.20` já é a mais recente e encerrou. Num dia de atualização real, você veria linhas de download e de "applying image", seguidas de uma solicitação de reinício.

:::atencao
Depois de aplicar uma imagem nova, o Deck precisa reiniciar para ativar a versão. Se você reiniciar no meio da aplicação, o mecanismo de *rollback* entra em ação e devolve a versão anterior, protegendo o sistema de ficar em estado inconsistente. Nunca desligue o aparelho durante a mensagem "aplicando atualização".
:::

## Atualização automática versus manual

Por padrão, o SteamOS baixa e prepara atualizações em segundo plano, mas só as aplica de fato mediante o seu aceite (ou agendamento). O comportamento é configurável, e o estado atual pode ser inspecionado:

```terminal
$ steamos-update check
Checking for updates...
Current branch: stable
Automatic updates: disabled
     Latest installed: 3.6.20
```

Com atualização automática desligada, você é quem decide a hora. Isso é útil para quem joga offline ou tem conexão limitada, já que uma imagem pode passar de um gigabyte. O custo é ficar defasado em correções de segurança.

## Resumo

- O SteamOS atualiza por *imagem* inteira, com raiz somente-leitura e rollback embutido, não pacote a pacote.
- `steamos-update.service` é o serviço de atualização, acionado por `steamos-update.timer`.
- `systemctl status`/`list-timers` mostram o estado do serviço e a frequência de verificação.
- `steamos-update check` informa branch, versão instalada e disponível, e o estado da atualização automática.
- `journalctl -u steamos-update` registra o histórico de verificações e aplicações.
- Antes de atualizar, confira espaço livre em `/home` com `df -h` e anote `uname -r` e a versão.

## Exercícios

1. Rode `uname -r` e anote a versão do kernel. Confirme a versão do SteamOS com `cat /etc/os-release | grep VERSION`.
2. Execute `systemctl status steamos-update` e explique por que o estado é `inactive (dead)` mesmo com o serviço habilitado.
3. Liste os timers com `systemctl list-timers` e encontre o `steamos-update.timer`, anotando a próxima execução.
4. Rode `journalctl -u steamos-update -n 20` e descreva o resultado da última verificação de atualização.
5. **Desafio.** Verifique o espaço livre em `/home` com `df -h /home`. Supondo que uma imagem de atualização ocupa cerca de 1,5 GB, determine se há espaço suficiente e proponha o que fazer caso não haja, relacionando com a diferença entre partição de sistema e partição de dados.
