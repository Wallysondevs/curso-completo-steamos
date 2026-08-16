O `systemctl` é a chave inglesa do systemd — com ele você inicia, para, recarrega e consulta qualquer serviço do sistema. No SteamOS, daemon do Steam, NetworkManager, SSH e dezenas de outros serviços são unidades gerenciadas pelo systemd. Decorar os subcomandos principais evita que você tenha de reiniciar a máquina para aplicar uma configuração nova.

:::objetivos
- Iniciar, parar e reiniciar serviços com `systemctl start/stop/restart`
- Recarregar configurações sem derrubar o serviço com `reload` e `reload-or-restart`
- Consultar o status detalhado de qualquer unidade
- Listar unidades por estado e tipo
- Entender a diferença entre `daemon-reload` e `reload`
:::

## O ciclo de vida de um serviço

No systemd, tudo é uma **unit** (unidade). Serviços são units do tipo `.service`. O comando `systemctl` opera sobre elas com verbos que refletem o ciclo de vida: nasce (`start`), vive (`status`), é interrompido (`stop`), recarregado (`reload`) e morre de vez (`disable`).

```terminal
$ systemctl status sshd
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled)
     Active: active (running) since Fri 2024-12-13 08:22:41 -03; 3h 14min ago
   Main PID: 1241 (sshd)
      Tasks: 1 (limit: 18527)
     Memory: 3.2M
        CPU: 1.748s
     CGroup: /system.slice/sshd.service
             └─1241 sshd: /usr/bin/sshd -D [listener] 0 of 10-100 startups
```

A saída do `status` é densa e responde seis perguntas de uma vez: o serviço está carregado? Habilitado? Rodando? Qual o PID principal? Quanta memória e CPU consumiu? Em qual cgroup ele está?

A tabela a seguir cobre as operações fundamentais:

| Comando | O que faz |
|---|---|
| `systemctl start sshd` | Inicia o serviço imediatamente |
| `systemctl stop sshd` | Para o serviço imediatamente |
| `systemctl restart sshd` | Para e inicia novamente (leitura limpa da configuração) |
| `systemctl reload sshd` | Recarrega a configuração sem derrubar conexões ativas |
| `systemctl reload-or-restart sshd` | Tenta `reload`; se não suportado, faz `restart` |
| `systemctl try-restart sshd` | Só reinicia se já estiver rodando (evita iniciar serviço parado) |
| `systemctl status sshd` | Estado completo: Loaded, Active, PID, memória, logs recentes |
| `systemctl is-active sshd` | Devolve `active` ou `inactive` (útil em scripts) |
| `systemctl is-enabled sshd` | Devolve `enabled`, `disabled` ou `masked` |
| `systemctl is-failed sshd` | Devolve `failed` se o serviço caiu; `active` caso contrário |

:::dica
`systemctl reload` é um privilégio: nem todo serviço implementa o sinal `SIGHUP` ou o método `ExecReload=`. O SSH e o NGINX suportam; o Docker e o Steam, não. Na dúvida, use `reload-or-restart` — ele tenta o recarregamento suave e, se não der, faz o restart completo.
:::

## Listando e filtrando unidades

Um sistema systemd típico tem centenas de units. Sem filtros, o `list-units` é inútil.

| Comando | O que faz |
|---|---|
| `systemctl list-units` | Lista todas as units ativas (carregadas na memória) |
| `systemctl list-units --all` | Lista ativas e inativas |
| `systemctl list-units --type=service` | Lista só serviços |
| `systemctl list-units --type=service --state=running` | Só serviços rodando agora |
| `systemctl list-units --type=service --state=failed` | Só serviços que falharam |
| `systemctl list-units --type=mount` | Lista pontos de montagem gerenciados pelo systemd |
| `systemctl list-units --type=target` | Lista targets (análogos a runlevels) |
| `systemctl list-unit-files --type=service` | Lista TODOS os serviços instalados, ativos ou não |
| `systemctl list-unit-files --state=enabled` | Só serviços habilitados para iniciar no boot |
| `systemctl list-unit-files --state=disabled` | Só serviços desabilitados |

```terminal
$ systemctl list-units --type=service --state=failed
  UNIT                     LOAD   ACTIVE SUB    DESCRIPTION
● bluetooth.service        loaded failed failed Bluetooth service

Legend: LOAD   → Reflects whether the unit definition was properly loaded.
        ACTIVE → The high-level unit activation state.
        SUB    → The low-level unit activation state.
```

Um serviço `failed` não trava o sistema, mas merece investigação. A bolinha `●` indica que o estado não é limpo.

## Recarregar o systemd e gerenciar units customizadas

Quando você cria ou edita um arquivo `.service` em `/etc/systemd/system/`, o systemd não percebe automaticamente.

| Comando | O que faz |
|---|---|
| `systemctl daemon-reload` | Recarrega a definição de todas as units do disco |
| `systemctl cat sshd` | Mostra o conteúdo do arquivo `.service` |
| `systemctl show sshd` | Despeja TODAS as propriedades da unit (centenas de linhas) |
| `systemctl show sshd -p MainPID` | Mostra só uma propriedade específica |
| `systemctl edit sshd` | Abre um override em `/etc/systemd/system/sshd.d/override.conf` |
| `systemctl revert sshd` | Remove overrides e volta à configuração original do pacote |

```terminal
$ systemctl daemon-reload
$ systemctl start meu-servico
```

Sem o `daemon-reload`, o systemd continua usando a definição antiga do arquivo `.service` e ignora suas alterações. É o erro mais comum de quem cria units pela primeira vez.

:::nota
`systemctl daemon-reload` recarrega a definição de **todas** as units de uma vez. É uma operação segura e rápida — não derruba serviços rodando, só atualiza o cache de metadados que o systemd mantém na memória.
:::

## Gerenciamento remoto com `-H`

O systemd suporta administração de hosts remotos via SSH sem precisar abrir um shell interativo.

```terminal
$ systemctl -H ana@steamdeck status sshd
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled)
     Active: active (running) since Fri 2024-12-13 08:22:41 -03
```

| Comando | O que faz |
|---|---|
| `systemctl -H user@host status sshd` | Consulta serviço em máquina remota via SSH |
| `systemctl -H user@host restart nginx` | Reinicia serviço remoto |
| `systemctl -H user@host --no-pager list-units` | Lista units remotas sem paginação |

:::atencao
O `-H` exige que o SSH esteja configurado com autenticação por chave. Com senha interativa, ele não funciona — o systemd não tem como passar a senha para o `ssh`.
:::

## Resumo

- `systemctl start/stop/restart` controlam o ciclo de vida imediato do serviço
- `systemctl reload` recarrega configuração sem derrubar; `reload-or-restart` é a versão segura
- `systemctl status` responde Loaded, Active, PID, memória e log em uma tela só
- `systemctl list-units --type=service --state=running` é o filtro mais usado no dia a dia
- `systemctl daemon-reload` é obrigatório após editar ou criar arquivos `.service`
- `systemctl -H` estende qualquer comando para hosts remotos via SSH

## Exercícios

1. Liste todos os serviços que estão rodando agora. Depois, liste os que estão habilitados mas não estão rodando. Explique a diferença entre os dois estados.
2. Pare o serviço `bluetooth.service`, verifique o status com `is-active`, depois inicie-o novamente.
3. Use `systemctl cat sshd` para ler o unit file original. Depois crie um override com `systemctl edit sshd` que aumente o `TimeoutStartSec` e verifique com `systemctl show` que o valor foi alterado. Reverta com `systemctl revert`.
4. Execute `systemctl list-units --state=failed` e, se houver alguma unit, investigue com `systemctl status <unit>` e os logs.
5. **Desafio.** Crie um arquivo `/etc/systemd/system/ola.service` simples (Type=oneshot, ExecStart=/bin/echo "ola"), rode `daemon-reload`, inicie, verifique o status e depois remova a unit completamente (arquivo + `daemon-reload`).
