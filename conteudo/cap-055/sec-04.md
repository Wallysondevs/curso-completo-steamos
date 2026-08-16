Se o root é congelado e o `/home` guarda dados pessoais, onde o sistema escreve as coisas que *precisa* modificar no dia a dia? A resposta está em `/var` — a partição de dados mutáveis do sistema. É lá que o SteamOS mantém logs, caches do gerenciador de pacotes e o estado do systemd, e é por isso que `/var` tem sua própria partição no esquema A/B.

:::objetivos
- Entender o propósito da partição `/var` no SteamOS
- Navegar pela estrutura de `/var/log` e `/var/tmp`
- Inspecionar logs com `journalctl` e interpretar o esquema A/B de `/var`
- Separar o que é seguro apagar do que não é
:::

## Por que o /var merece uma partição própria

O nome `/var` vem de *variable* (variável), e seu conteúdo muda constantemente: logs de sistema, arquivos de spool, caches de pacotes e diretórios temporários persistentes. Sem uma partição própria, essa mutação constante aconteceria dentro do root, inviabilizando a atualização atômica — a imagem do sistema deixaria de ser autocontida.

No SteamOS, ambas as partições `/var` (A e B) têm tipicamente 256 MB cada. Pode parecer pouco, mas é suficiente para o que se espera de um console: logs do systemd, caches de fontconfig e estado do Flatpak. Os logs são rotacionados automaticamente para não estourar.

```terminal
$ findmnt /var
TARGET SOURCE        FSTYPE OPTIONS
/var   /dev/mmcblk0p6 ext4   rw,relatime
```

Mais uma vez, `rw` é a assinatura de que aqui se escreve livremente, e a partição é pequena de propósito: nada que cresça indefinidamente deveria parar em `/var` sem controle.

## A estrutura de /var subdiretório a subdiretório

Nem tudo em `/var` interessa no uso diário do Steam Deck, mas alguns subdiretórios merecem atenção:

```terminal
$ ls /var
backups/   cache/   flatpak/   lib/   local/
log/       opt/     spool/     tmp/   journal/
```

| Diretório | Função |
|---|---|
| `log/` | Logs tradicionais em texto (poucos, porque o systemd usa journal binário) |
| `journal/` | Logs binários do systemd-journald (persistentes) |
| `cache/` | Caches de aplicações do sistema (FHS-padrão) |
| `flatpak/` | Estado do sistema Flatpak (runtimes, configurações de sistema) |
| `tmp/` | Arquivos temporários persistentes entre boots (diferente de `/tmp`, que some) |
| `spool/` | Filas de impressão, mail e outros spools (quase vazios no Steam Deck) |

A diferença entre `/var/tmp` e `/tmp` é sutil mas importante: `/tmp` é um `tmpfs` em RAM, descartado no boot; `/var/tmp` sobrevive ao reboot e é limpo apenas periodicamente. Scripts de instalação do Flatpak, por exemplo, usam `/var/tmp` como pasta de trabalho.

## Lendo logs do sistema com journalctl

No SteamOS, a principal ferramenta de log não é um arquivo de texto — é o **journal** do systemd, um banco binário com indexação por data, serviço e prioridade. O acesso se dá pelo `journalctl`:

```terminal
$ journalctl --boot -p warning --no-pager -n 10
Jan 10 14:22:03 steamdeck kernel: ACPI BIOS Error (bug): ...
Jan 10 14:22:05 steamdeck kernel: xhci_hcd 0000:04:00.4: WARNING:...
Jan 10 14:22:06 steamdeck kernel: nvme 0000:02:00.0: platform:...
...
Dec 18 21:43:12 steamdeck plasmashell[1234]: ...
Dec 18 21:43:19 steamdeck steam[5678]: ...
```

- `--boot` limita ao boot atual (equivalente a `-b`).
- `-p warning` filtra apenas mensagens com prioridade warning ou acima.
- `-n 10` mostra apenas as 10 últimas linhas.
- `--no-pager` evita o paginador `less` para que a saída vá direto ao terminal.

O Steam Deck gera uma quantidade surpreendente de logs de hardware, especialmente no boot, por conta dos drivers ACPI e NVMe. A maior parte são avisos inofensivos.

:::dica
Para ver o tamanho ocupado pelo journal binário, use `journalctl --disk-usage`. Se estiver perto de estourar o `/var`, o sistema rotaciona automaticamente, mas você também pode rodar `journalctl --vacuum-size=50M` para liberar espaço manualmente.
:::

## A partição A/B do /var e o que isso significa

A seção 01 mostrou que o `/var` tem gêmea: `mmcblk0p6` (ativo) e `mmcblk0p7` (adormecida). A cada atualização atômica, os dois `/var` são alternados junto com os dois `/`. Isso significa que:

- Logs do sistema antigo ficam preservados na partição B durante uma atualização.
- Se você der rollback para uma versão anterior do sistema, os logs da versão com problema também estarão lá.
- O espaço total ocupado pelas partições de `/var` (A + B) é tipicamente 512 MB.

Você pode ver o estado de ocupação atual e histórico:

```terminal
$ df -h /var
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p6  256M   88M  168M  35% /var
```

Com 35% de uso, ainda há bastante folga. Se um dia esse número bater 90% ou mais, alguma coisa está crescendo de forma anormal — provavelmente um log de kernel repetido em loop ou um cache que não foi rotacionado.

:::atencao
Se o `/var` encher completamente, o SteamOS pode travar ou se recusar a iniciar o modo desktop corretamente. Monitore com `df -h /var` periodicamente e investigue qualquer salto súbito com `du -sh /var/*/`, especialmente `/var/log` e `/var/journal`.
:::

## Resumo

- `/var` é a partição mutável do sistema — logs, cache e estado de serviços ficam aqui.
- Tem sua própria partição A/B, compatível com atualizações atômicas, com ~256 MB cada.
- `journalctl` é a ferramenta principal para ler logs, substituindo arquivos em `/var/log`.
- `/var/tmp` sobrevive ao boot; `/tmp` não.
- Monitore `/var` com `df -h` e libere espaço com `journalctl --vacuum-size=50M` se necessário.

## Exercícios

1. Execute `df -h /var` e anote o percentual de uso. Depois rode `journalctl --disk-usage` e compare os números.
2. Liste os 5 maiores subdiretórios de `/var` com `du -sh /var/*/ 2>/dev/null | sort -h | tail -5`.
3. Rode `journalctl --boot -p err --no-pager` e identifique os erros do boot atual. Há algum que se repete?
4. Crie um arquivo em `/var/tmp` e outro em `/tmp`. Reinicie a máquina (ou explique, sem reiniciar, qual dos dois sobreviveria e por quê).
5. **Desafio.** Examine os logs de uma unidade específica do systemd com `journalctl -u sshd --since "1 hour ago"`. Depois explique por que o journald existe como banco binário em vez de um arquivo de texto.