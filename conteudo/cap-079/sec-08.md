Automação falha. Não "se" — "quando". Um timer que esperava o disco montado roda com o disco ausente; um serviço que dependia de rede inicia antes do Wi-Fi conectar; um script que funcionou por semanas quebra depois de uma atualização do SteamOS. A diferença entre um sistema automatizado confiável e uma coleção de scripts quebrados não está em evitar falhas, está em antecipá-las e diagnosticá-las rápido. Esta seção é o manual do detetive da automação: como depurar cada peça do quebra-cabeça — script, systemd, udev, autostart — e como desenhar automações que falham de forma visível e recuperável.

:::objetivos
- Construir uma mentalidade de depuração para cada componente da automação
- Dominar o trio `set -x`, `trap` e log estruturado para scripts
- Diagnosticar problemas de sistema com journalctl, systemd-analyze e udevadm
- Identificar a falha mais comum de cada mecanismo e sua solução
- Criar um dashboard de saúde que reporte o estado de toda a automação ativa

:::

## A mentalidade do detetive

Antes de partir para comandos, três perguntas que substituem horas de `grep` cego:

1. **Quando falhou?** — Use timestamps e logs. Se o serviço quebrou na mesma hora de uma atualização do sistema, o caminho da investigação é outro.
2. **O que mudou?** — Atualização do SteamOS? Novo disco plugado? Script editado e não testado? O que mudou é quase sempre a causa.
3. **Quem sabe?** — Onde a informação sobre o problema está registrada? Journal? Arquivo de log? Saída de um comando? `systemctl status`?

E a regra de ouro: **reproduza manualmente antes de adicionar `echo`**. Se o script quebrou sob o systemd, rode-o você mesmo, no mesmo shell, com as mesmas variáveis. Se o caminho de erro for diferente do erro real, a causa é o ambiente (PATH, permissões, variáveis).

## Debug de scripts: além do `echo`

O Bash tem um arsenal que a maioria dos scripts não usa. Comece pelo mais impactante:

```terminal
$ bash -x ~/bin/meu-script.sh
+ source /home/deck/.bashrc
+ set +u
+ log 'Iniciando...'
+ echo '[script] Iniciando...'
+ something_broken
/home/deck/bin/meu-script.sh: line 10: something_broken: command not found
```

O `-x` faz o Bash ecoar cada comando com `+` enquanto executa. É o equivalente a assistir o script pensar em voz alta — vê-se o valor de cada variável expandida e o ponto exato da falha. Pode-se também ativar dentro do script, seletivamente:

```terminal
#!/bin/bash
set -euo pipefail

# ativa trace só para uma seção sensível
set -x
rsync -a "$ORIGEM/" "$DESTINO/"
set +x
# trace desligado para o resto
```

O `trap` captura erros no contexto e imprime informações:

```terminal
#!/bin/bash
set -euo pipefail

on_error() {
    local lineno="$1"
    local cmd="$2"
    echo "[TRAP] Erro na linha $lineno: comando '$cmd' falhou." >&2
}

trap 'on_error ${LINENO} "$BASH_COMMAND"' ERR

# se algo abaixo falhar, on_error dispara com linha e comando
```

Esse `trap ... ERR` é a bala de prata do debugging de Bash. Em vez de "algo deu errado, não sei onde", você obtém a linha exata e o comando. Coloque-o em todos os scripts que já estão em produção.

:::dica
Combine `trap ERR` com `set -o functrace` (ou `set -E`) para propagar o trap em funções: sem `functrace`, um `ERR` dentro de uma função não sobe para o trap do script. Com ele, sobe.
:::

## Debug de systemd: os três comandos salvadores

Quando um serviço não inicia ou falha misteriosamente, o trio de comando + variante resolve:

```terminal
$ # 1. O estado atômico
$ systemctl --user status meu-servico.service

$ # 2. O que o serviço escreveu (últimas 50 linhas)
$ journalctl --user -u meu-servico.service -n 50 --no-pager

$ # 3. O que o systemd pensa que vai executar
$ systemctl --user cat meu-servico.service
```

E o quarto comando, menos usado mas mais poderoso:

```terminal
$ systemd-analyze --user verify ~/.config/systemd/user/meu-servico.service
```

Ele valida a sintaxe e as dependências do unit file **antes** de tentar iniciá-lo. Captura erros como `ExecStart` apontando para um binário que não existe, dependências circulares ou tipografia errada em `After`.

Erros específicos de systemd e suas causas mais frequentes:

| Código de erro | Significado | Causa típica |
|---|---|---|
| `status=203/EXEC` | não conseguiu executar | caminho errado em `ExecStart`, arquivo sem `chmod +x` |
| `status=200/CHDIR` | diretório de trabalho inacessível | `WorkingDirectory` aponta para lugar que não existe |
| `status=217/USER` | usuário desconhecido | `User=` com nome de usuário inexistente |
| `code=exited, status=127` | comando não encontrado dentro do script | PATH restrito; use caminho absoluto |
| `Condition check failed` | pré-condição falhou | `ConditionPathExists`, `ConditionHost`, etc. |
| `timeout` | não iniciou no prazo | `TimeoutStartSec` curto demais para um `oneshot` pesado |

```terminal
$ # um status=203 típico:
$ systemctl --user status broken.service
● broken.service - Serviço quebrado
     Active: failed (Result: exit-code) since ...
     Process: 3841 ExecStart=/home/deck/bin/nao-existe (code=exited, status=203/EXEC)
```

:::info
`Type=oneshot` que termina rápido demais pode mostrar `inactive (dead)` e parecer que falhou quando na verdade funcionou. O journal (`journalctl --user -u`) é a fonte da verdade: se o script emitiu sua saída esperada, funcionou. `RemainAfterExit=yes` (no `[Service]`) faz o systemd considerar o serviço `active` mesmo após o processo terminar — útil para serviços que são "gatilhos" e cujo estado você quer ver como "ok".
:::

## Debug de udev: por que minha regra não dispara

Três camadas de checagem:

```terminal
$ # 1. O udev vê o evento?
$ sudo udevadm monitor --property

$ # 2. A regra casa com o dispositivo?
$ sudo udevadm test /devices/.../block/sda 2>&1 | grep -E 'meu-serial|meu-SYMLINK|SYSTEMD_WANTS'

$ # 3. As regras foram recarregadas?
$ sudo udevadm control --reload-rules && sudo udevadm trigger
```

O erro mais comum é discrepância entre o `ATTR{serial}` que você digitou e o real. O `udevadm test` imprime cada atributo disponível — compare caractere por caractere, incluindo espaços e traços. A segunda causa mais comum: esqueceu o `--reload-rules` após editar o arquivo.

Outro clássico: o `RUN` roda, mas falha silenciosamente porque o PATH do udev não inclui seu diretório. Use sempre caminho absoluto em `RUN`.

```terminal
$ # errado:
$ RUN+="meu-script.sh"
$ # correto:
$ RUN+="/usr/local/bin/meu-script.sh"
```

E uma dica de ouro para debug de regras: adicione uma regra temporária que loga com `logger`:

```terminal
$ cat /etc/udev/rules.d/99-debug.rules
ACTION=="add", ATTR{serial}=="WX12A3B4C5D6", RUN+="/usr/bin/logger 'UDEV DEBUG: disco com serial WX12A3B4C5D6 conectado'"
```

O `logger` escreve no journal, que você lê com `journalctl -f` enquanto conecta o dispositivo. Isso confirma se o match disparou.

## Debug de autostart: o plasma esconde o erro

O Plasma é notoriamente silencioso quando um autostart falha. Três abordagens:

```terminal
$ # 1. Validar a sintaxe do .desktop
$ desktop-file-validate ~/.config/autostart/meu.desktop

$ # 2. Executar o comando manualmente (exatamente como o plasma faria)
$ bash -c "konsole"
# se falhar aqui, falhará no autostart

$ # 3. Espionar os logs do plasma
$ journalctl --user -b -g autostart --no-pager
$ journalctl --user -b -g plasmashell --no-pager | grep -i autostart
```

Se o autostart é um script que precisa de ambiente gráfico (`DISPLAY`, `WAYLAND_DISPLAY`), teste com as mesmas variáveis:

```terminal
$ env DISPLAY=:0 WAYLAND_DISPLAY=wayland-0 bash -x ~/bin/meu-autostart.sh
```

O erro mais comum: o script roda, faz algo e morre rápido demais, sem deixar rastro. O Plasma executou — o problema é o que o script fez (ou não fez). `bash -x` é a solução.

## Dashboard de saúde

Com várias automações rodando, você precisa saber, com um comando, o que está vivo e o que está morto. Um dashboard simples:

```terminal
$ cat ~/bin/automation-health.sh
#!/bin/bash
set -euo pipefail

echo "=============================================="
echo "  AUTOMATION HEALTH — $(date '+%Y-%m-%d %H:%M')"
echo "=============================================="
echo ""

echo "--- systemd user services ---"
for s in syncthing game-monitor maintenance hello-deck; do
    state=$(systemctl --user is-active "$s.service" 2>/dev/null || echo "not-found")
    ok="OK"
    [[ "$state" =~ ^(active|inactive)$ ]] || ok="FALHA"
    printf "  %-25s %-12s [%s]\n" "$s" "$state" "$ok"
done

echo ""
echo "--- timers ---"
systemctl --user list-timers --no-pager 2>/dev/null | tail -n +2 | head -5

echo ""
echo "--- udev rules ---"
ls -1 /etc/udev/rules.d/99-* 2>/dev/null || echo "  Nenhuma regra customizada"

echo ""
echo "--- autostart ---"
ls -1 ~/.config/autostart/ 2>/dev/null || echo "  Nenhum autostart configurado"

echo ""
echo "=============================================="
```

```terminal
$ automation-health.sh
==============================================
  AUTOMATION HEALTH — 2025-04-30 22:00
==============================================

--- systemd user services ---
  syncthing                 active       [OK]
  game-monitor              active       [OK]
  maintenance               inactive     [OK]
  hello-deck                inactive     [OK]

--- timers ---
NEXT                        LEFT     LAST                        PASSED  UNIT
Thu 2025-05-01 03:00:00 UTC 5h left  Wed 2025-04-30 03:00:00 UTC 16h ago backup.timer

--- udev rules ---
  /etc/udev/rules.d/99-backup-disk.rules
  /etc/udev/rules.d/99-ac-power.rules

--- autostart ---
  konsole.desktop
  syncthingtray.desktop
==============================================
```

O `is-active` retorna `active`, `inactive`, `activating` ou `failed`. O dashboard trata `active` e `inactive` como estados OK (o `hello-deck` rodou e terminou, portanto `inactive` é esperado), e qualquer outra coisa como falha.

## Lidando com a imutabilidade e atualizações

No SteamOS, atualizações do sistema são frequentes e silenciosas. Uma automação que funciona hoje pode quebrar amanhã porque a Valve mudou um binário, um caminho ou uma API. Isso não é paranóia — é o que aconteceu com o `steamos-readonly` e com o layout de partições entre versões.

Mitigações:

```terminal
$ # no ExecStartPre do serviço: verificar que dependências existem
$ cat ~/.config/systemd/user/meu-servico.service
[Service]
Type=oneshot
ExecStartPre=/usr/bin/test -x %h/bin/meu-script.sh || \
    /usr/bin/echo "AVISO: meu-script.sh não executável"
ExecStart=%h/bin/meu-script.sh
```

Um `ExecStartPre` que valida pré-condições (arquivo existe, comando executável, caminho montado) torna a falha explícita e registrada no journal, em vez de um `status=203` genérico.

Outra prática: manter um changelog próprio de automação:

```terminal
$ cat ~/bin/CHANGELOG.md
# Changelog de automação

## 2025-04-30
- maintenance.sh: corrigido path do shadercache (mudou em SteamOS 3.6)
- udev: regra 99-backup-disk ajustada para novo serial do disco
```

Simples e manual — mas quando algo quebra após uma atualização, o changelog te lembra o que você mexeu da última vez e por quê.

## Resumo

- Depure scripts com `bash -x`, `trap ... ERR` e `set -o functrace`; o `-x` é o pensamento em voz alta do Bash.
- Para systemd: `systemctl --user status/cat`, `journalctl --user -u` e `systemd-analyze verify` formam o trio de ouro.
- Para udev: `udevadm monitor`, `udevadm test` e `logger`; o erro mais comum é match de atributo incorreto ou esquecer `--reload-rules`.
- Para autostart: `desktop-file-validate`, execução manual com as variáveis de ambiente, e `journalctl --user -b -g autostart`.
- Um dashboard `automation-health.sh` centraliza o estado de serviços, timers, udev e autostart.
- Prepare-se para atualizações com `ExecStartPre`, validações de existência de binário e um changelog de automação.

## Exercícios

1. Adicione `trap 'on_error ${LINENO} "$BASH_COMMAND"' ERR` a um de seus scripts. Provoque uma falha (comando inexistente) e veja o trap reportar a linha exata.
2. Use `systemd-analyze --user verify` em todos os seus unit files. Corrija os warnings que aparecerem.
3. Com `sudo udevadm test`, confira se as regras da seção 4 casam com seu hardware real. Ajuste atributos onde necessário.
4. Quebre propositalmente um autostart (ex.: `Exec` inválido) e use `journalctl` para encontrar o registro do erro. O Plasma reportou ou foi silencioso?
5. **Desafio.** Instale o `automation-health.sh` como um serviço/timer diário que envia o relatório para um arquivo `~/automation-health.log` e, se houver alguma falha (estado diferente de `active`/`inactive`), escreve um alerta em `~/.config/autostart/pending-alerts.txt`.