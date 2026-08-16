Iniciar um serviço na hora (`start`) e fazê-lo subir junto com o boot (`enable`) são coisas diferentes, e confundir as duas é o erro mais clássico de administração de systemd. Esta seção cobre o sistema de **estados persistentes** — habilitar, desabilitar, mascarar — e introduz os **targets**, unidades que funcionam como pontos de agrupamento equivalentes aos antigos runlevels.

:::objetivos
- Distinguir `start/stop` (agora) de `enable/disable` (no boot)
- Habilitar e desabilitar serviços para iniciarem automaticamente
- Mascarar unidades para impedir que sejam iniciadas por qualquer meio
- Entender o que são targets e como alternar entre eles
- Diagnosticar serviços com `failed` e fornecer contexto com `--no-pager`
:::

## Enable, disable e o conceito de link simbólico

Quando você roda `systemctl enable`, o systemd não altera o arquivo `.service` — ele cria um **link simbólico** (symlink) de `/etc/systemd/system/multi-user.target.wants/sshd.service` apontando para o unit file real. É esse symlink que "liga" o serviço a um target, dizendo ao systemd para iniciá-lo quando aquele target for alcançado.

```terminal
$ systemctl enable sshd
Created symlink /etc/systemd/system/multi-user.target.wants/sshd.service → /usr/lib/systemd/system/sshd.service.
```

A tabela a seguir cobre habilitar e desabilitar:

| Comando | O que faz |
|---|---|
| `systemctl enable sshd` | Habilita o serviço para iniciar no boot |
| `systemctl enable --now sshd` | Habilita E inicia agora (equivale a enable + start) |
| `systemctl disable sshd` | Remove os symlinks; serviço não sobe mais no boot |
| `systemctl disable --now sshd` | Desabilita E para agora |
| `systemctl reenable sshd` | Desabilita e habilita de novo (recria symlinks limpos) |
| `systemctl enable sshd nginx cups` | Habilita vários serviços de uma vez |
| `systemctl preset-all` | Aplica a política padrão da distribuição a todos os serviços |
| `systemctl preset sshd` | Aplica a política padrão a um serviço específico |

:::dica
Habilitar **não inicia** o serviço na hora, e iniciar **não habilita**. Se você quer as duas coisas — é o caso de 90% dos cenários — use `enable --now` ou `disable --now`.
:::

## Mascaramento: impedindo de vez

Habilitado ou não, qualquer serviço pode ser iniciado manualmente com `start`. Se você quer que um serviço **não possa** rodar de forma alguma, usa `mask`.

| Comando | O que faz |
|---|---|
| `systemctl mask bluetooth` | Impede que o serviço seja iniciado por qualquer via |
| `systemctl mask --runtime bluetooth` | Mascara só até o próximo boot |
| `systemctl unmask bluetooth` | Remove a máscara |
| `systemctl unmask --runtime bluetooth` | Remove a máscara temporária |

```terminal
$ systemctl mask bluetooth
Created symlink /etc/systemd/system/bluetooth.service → /dev/null.

$ systemctl start bluetooth
Failed to start bluetooth.service: Unit bluetooth.service is masked.
```

A diferença é visível no mecanismo: `mask` aponta o unit file para `/dev/null`, o "buraco negro" do Linux. Qualquer tentativa de iniciar o serviço falha na hora, com mensagem clara.

:::atencao
Máscaras são persistentes e silenciosas. Meses depois você se pergunta por que o Bluetooth não liga — e era um `mask` esquecido. Antes de caçar drivers, rode `systemctl status` e leia se a unidade está `masked`.
:::

## Targets: os antigos runlevels do systemd

No systemd, não existe mais o conceito de runlevel 3 ou 5 do SysV init. No lugar, existem os **targets**, que agrupam serviços com um propósito comum.

| Comando | O que faz |
|---|---|
| `systemctl get-default` | Mostra o target padrão de boot |
| `systemctl set-default multi-user.target` | Define o target padrão (equivale ao runlevel 3) |
| `systemctl set-default graphical.target` | Define o target gráfico (equivale ao runlevel 5) |
| `systemctl isolate multi-user.target` | Troca para o target agora, parando/iniciando o que for preciso |
| `systemctl list-dependencies multi-user.target` | Mostra a árvore de dependências do target |
| `systemctl list-dependencies --reverse sshd` | Mostra o que depende do serviço |

```terminal
$ systemctl get-default
graphical.target

$ systemctl list-dependencies graphical.target
graphical.target
● ├─accounts-daemon.service
● ├─gdm.service
● ├─systemd-update-utmp-runlevel.service
● └─multi-user.target
  ● ├─cron.service
  ● ├─dbus.service
  ...
```

O `graphical.target` depende do `multi-user.target`, que por sua vez agrega serviços como cron e dbus. É uma hierarquia: o target gráfico é "tudo do modo texto, mais um gerenciador de display".

:::nota
`set-default` muda o comportamento **no próximo boot**, enquanto `isolate` troca **agora**. É a mesma relação entre `enable` e `start`, aplicada a targets.
:::

## Estados e o diagnóstico rápido

O systemd rastreia muito mais estados do que "rodando" ou "parado". Conhecê-los acelera o diagnóstico.

```terminal
$ systemctl list-units --type=service --state=failed
  UNIT              LOAD   ACTIVE SUB    DESCRIPTION
● cups.service      loaded failed failed CUPS Scheduler
● foo.service       loaded failed failed Foo service

$ systemctl status cups
● cups.service - CUPS Scheduler
     Loaded: loaded (/usr/lib/systemd/system/cups.service; enabled)
     Active: failed (Result: exit-code) since Fri 2024-12-13 09:10:02 -03
```

| Estado | Significado |
|---|---|
| `active (running)` | Processo principal rodando normalmente |
| `active (exited)` | Oneshot terminou com sucesso (esperado para Type=oneshot) |
| `inactive (dead)` | Serviço não está rodando, nem foi iniciado agora |
| `activating` | Em processo de subida (auto, start em andamento) |
| `deactivating` | Em processo de descida |
| `failed` | Caiu ou não conseguiu iniciar |
| `masked` | Apontado para `/dev/null`, não pode iniciar |

:::dica
O `active (exited)` assusta iniciantes: parece erro, mas é o estado normal de serviços `oneshot` que executam uma tarefa e terminam. O `sshd` fica `running` para sempre; um serviço de limpeza de logs fica `exited` após concluir.
:::

## Resumo

- `enable/disable` controlam o boot; `start/stop` controlam o agora — `--now` une os dois
- `enable` cria symlinks em `*.wants/`; é isso que o dot displays no `Loaded`
- `mask` aponta a unit para `/dev/null`, impedindo início por qualquer via
- Targets substituem runlevels: `multi-user` (texto) e `graphical` (gráfico)
- `set-default` edita o boot futuro; `isolate` troca a sessão imediatamente
- `failed`, `running`, `exited`, `masked` são estados distintos que o `status` revela

## Exercícios

1. Rode `systemctl is-enabled` e `systemctl is-active` para três serviços diferentes (sshd, bluetooth, cups) e explique cada combinação de resultados.
2. Habilite um serviço com `systemctl enable --now`, verifique o symlink criado com `ls -l /etc/systemd/system/*.wants/`, depois desabilite com `--now`.
3. Mascare o serviço `bluetooth.service`, tente iniciá-lo e observe a mensagem de erro. Em seguida, desfaça com `unmask`.
4. Compare `systemctl get-default` com `cat /etc/systemd/system/default.target` e explique o vínculo entre os dois.
5. **Desafio.** Use `systemctl list-dependencies --reverse multi-user.target` para descobrir quais targets dependem do `multi-user.target`. Depois, de forma temporária, troque para `multi-user.target` com `isolate` e volte com `isolate graphical.target` — observando o que para e o que inicia em cada troca.