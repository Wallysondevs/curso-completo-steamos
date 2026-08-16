A reinstalação termina na tela de configuração inicial, mas o trabalho não acaba aí. Entre o primeiro boot e um sistema pronto para uso, há uma sequência de ajustes — login, atualização, restauração de backup e verificação de que tudo funciona. Pular essa etapa deixa pontas soltas: um sistema limpo que, dias depois, revela que uma configuração essencial ou um save não voltou.

:::objetivos
- Configurar o sistema após o primeiro boot pós-reinstalação
- Restaurar dados do backup com segurança
- Verificar e aplicar atualizações pendentes
- Validar o hardware e as configurações essenciais
:::

## O primeiro boot: idioma, rede e login

Após a reinstalação ou reset, o Steam Deck inicia no assistente de configuração. A sequência é rápida: escolha de idioma, fuso horário, conexão Wi-Fi e login na conta Steam. No caso de reinstalação limpa, o aparelho pode pedir para baixar uma atualização antes mesmo de chegar ao modo de jogo — aceite.

```terminal
$ timedatectl list-timezones | grep -i 'america/sao'
America/Sao_Paulo
$ sudo timedatectl set-timezone America/Sao_Paulo
```

Se o fuso horário for configurado errado no assistente, corrija pelo terminal. Um fuso errado bagunça timestamps de saves, logs e sincronização com a nuvem — vale conferir.

:::nota
Se você restaurou um backup do `/home` antes de fazer o primeiro login, pode haver conflito com os dados de autenticação da Steam. O ideal é logar primeiro, deixar o sistema estabilizar, e só depois restaurar arquivos do backup antigo.
:::

## Atualizando o sistema até a versão mais recente

O SteamOS reinstalado pode estar em versão anterior à mais recente. Vá em `Configurações → Sistema → Atualizações de software` e aplique todas as pendentes. Cada atualização dispara um reboot para alternar o slot A/B.

```terminal
$ cat /etc/os-release | grep -E 'VERSION|BUILD'
VERSION="3.6.20"
BUILD_ID="20250214.1"
$ steamos-update check
```

O comando `steamos-update check` no terminal verifica se há atualizações disponíveis sem precisar navegar no menu. Se houver, `steamos-update apply` inicia o processo (requer root).

:::dica
Aguarde a conclusão de todas as atualizações antes de restaurar o backup. Uma atualização que altera `/etc` ou `/var` pode conflitar com arquivos restaurados de uma versão anterior do sistema.
:::

## Restaurando o backup com rsync reverso

Com o sistema atualizado e logado, é hora de trazer os dados de volta. O `rsync` agora roda na direção inversa, do cartão/pendrive para o `/home/deck`. A sintaxe é a mesma, apenas trocando origem e destino.

```terminal
$ rsync -avh --progress /run/media/deck/BACKUP/home-deck/ ~/
```

A barra final em ambas as pastas é crucial: ela copia o **conteúdo** de `home-deck` para dentro de `/home/deck`, sem criar subpasta `home-deck` lá dentro. Após a cópia, confira os arquivos mais importantes manualmente.

```terminal
$ ls ~/Downloads/
$ ls ~/.local/share/Steam/userdata/
$ ls ~/Emulation/saves/   # se usa EmuDeck
```

Conferir três pastas críticas já cobre a maioria dos cenários. Abra pelo menos um save de cada categoria (Steam Cloud, local, emulador) e confirme que o jogo reconhece o progresso.

## Verificando a integridade do hardware

Depois de reinstalar, é prudente rodar uma checagem rápida de hardware — não para diagnosticar defeitos, mas para confirmar que tudo continua funcionando como antes da operação.

```terminal
$ cat /sys/class/dmi/id/product_serial
$ cat /sys/class/dmi/id/bios_version
$ lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS /dev/nvme0n1
$ df -h /home
```

O primeiro comando confirma o serial (deve ser o mesmo de antes, a menos que tenha havido troca física). O segundo mostra a versão de BIOS (a reinstalação pode ter atualizado). O terceiro e quarto verificam que as partições e o espaço em disco estão conforme o esperado.

```terminal
$ journalctl -b -p err
```

Esse comando lista erros do boot atual. Alguns erros de firmware e ACPI são normais e inofensivos; o que deve acender alerta são erros de montagem (`mount`), filesystem (`ext4`, `vfat`) ou de hardware (`nvme`, `i2c`).

:::atencao
Se `journalctl -b -p err` mostrar erros novos que não apareciam antes da reinstalação, investigue antes de considerar o sistema estável. Em particular, erros de `mount` podem indicar que uma partição foi mal formatada ou que o `fstab` está incorreto.
:::

## Configurando o essencial pós-instalação

Com o sistema limpo e atualizado, reinstale o que você usa: Flatpaks (Heroic, Lutris, navegadores), plugins do Decky Loader, EmuDeck, e ferramentas de desenvolvimento se for o caso. Essa é a hora de ser seletivo — reinstalar só o que você realmente usa mantém o sistema leve.

```terminal
$ flatpak list --app
$ flatpak install flathub com.heroicgameslauncher.hgl
$ flatpak install flathub org.mozilla.firefox
```

O `flatpak list --app` mostra o que está instalado. Compare com sua lista mental do que usava antes e reinstale um por um, testando cada um brevemente.

## Resumo

- Conclua o assistente de configuração (idioma, Wi-Fi, login) e confira o fuso horário.
- Aplique todas as atualizações do SteamOS antes de restaurar o backup.
- Restaure os dados com `rsync` reverso e confira manualmente pastas críticas.
- Verifique serial, BIOS, partições e erros de boot com `journalctl -b -p err`.
- Reinstale Flatpaks e ferramentas essenciais de forma seletiva.

## Exercícios

1. Execute `cat /etc/os-release | grep VERSION` e anote a versão corrente do seu SteamOS.
2. Simule uma restauração de backup: copie uma pasta de teste de um pendrive para o home e confira com `diff`.
3. Rode `journalctl -b -p err` e classifique cada erro como "normal/inofensivo" ou "precisa investigar".
4. Liste os Flatpaks instalados (`flatpak list --app`) e decida quais são essenciais reinstalar após um reset.
5. **Desafio.** Crie um script `pos-instalacao.sh` que, após uma reinstalação limpa, execute: verificação de atualizações, restauração de backup, checagem de hardware, instalação de Flatpaks essenciais e geração de um relatório final de status.