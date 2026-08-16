O `systemd` trata *tudo* — serviço, soquete, ponto de montagem, alvo de boot — como uma **unidade** (unit), e saber reconhecer o tipo de cada uma é o que separa o diagnóstico certeiro do chute. Um `target` não se liga como um `service`; um `timer` não se desliga como um `mount`. Esta seção mapeia os tipos de unidade que você vai encontrar no SteamOS e ensina a identificá-los pela extensão do nome e pela listagem do `systemctl`.

:::objetivos
- Reconhecer os principais tipos de unidade pela extensão do nome
- Diferenciar `service`, `target`, `socket`, `mount` e `timer`
- Listar unidades ativas e inativas com `systemctl list-units` e `list-unit-files`
- Identificar a unidade responsável por um processo em execução
- Navegar entre os estados "ativo", "habilitado" e "carregado"
:::

## Uma extensão para cada papel

Toda unidade tem um nome composto: um nome-base e uma extensão que declara seu tipo. A extensão não é enfeite — ela diz ao `systemd` como interpretar o arquivo. Os tipos mais comuns no dia a dia:

| Extensão | Papel | Exemplo no SteamOS |
|---|---|---|
| `.service` | Processo em segundo plano com ciclo de vida | `sshd.service` |
| `.target` | Ponto de sincronização/agrupamento | `graphical.target` |
| `.socket` | Ativação sob demanda via porta/soquete | `docker.socket` |
| `.timer` | Disparo agendado de outra unidade | `fstrim.timer` |
| `.mount` | Ponto de montagem de sistema de arquivos | `home.mount` |
| `.path` | Reação a mudanças em caminhos | `systemd-networkd.path` |
| `.slice` | Grupo de processos para isolamento | `user.slice` |

O `.service` é de longe o mais frequente: ele empacota um *daemon* com instruções de como iniciar, parar e reiniciar. Mas repare que o `systemd` também gerencia coisas que não são "programas", como montagens e caminhos — daí a extensão importar.

:::info
No SteamOS, a partição raiz é somente-leitura e a atualização do sistema é atômica (imagens A/B). Isso significa que você não vai editar units do sistema em `/usr/lib/systemd/system` como numa distro comum; suas unidades pessoais vivem em `/etc/systemd/system`. Mais detalhes na seção 9.
:::

## Listando o que está ativo

O comando de referência para ver o agora é `systemctl list-units`. Sem filtros, ele despeja centenas de linhas; o segredo é restringir por tipo:

```terminal
$ systemctl list-units --type=service --no-pager
UNIT                              LOAD   ACTIVE SUB       DESCRIPTION
NetworkManager.service            loaded active running   Network Manager
sshd.service                      loaded active running   OpenSSH Daemon
systemd-journald.service          loaded active running   Journal Service
systemd-timesyncd.service         loaded active running   Network Time Synchronization
fstrim.service                    loaded inactive dead    Discard unused blocks
docker.service                    loaded active running   Docker Application Container Engine
steamos-update-finished.service   loaded inactive dead    SteamOS Update Finished

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.

7 loaded units listed.
```

As três colunas da esquerda merecem tradução. `LOAD` diz se a definição foi carregada (quase sempre `loaded`). `ACTIVE` é o estado geral — `active`, `inactive` ou `failed`. `SUB` é o detalhe fino, que varia por tipo: para serviços, `running` (rodando), `exited` (terminou com sucesso) ou `dead` (parado). Um serviço `active (running)` está executando; um `inactive (dead)` existe como definição, mas não está de pé agora.

## Ativo não é habilitado

Existe uma confusão clássica que esta seção precisa desfazer: **estar ativo** (rodando agora) e **estar habilitado** (subir sozinho no boot) são coisas diferentes. O primeiro é o estado instantâneo; o segundo, a política de inicialização. Um serviço pode estar habilitado mas parado (porque você o desligou à mão) ou ativo mas desabilitado (subiu por demanda e não voltará no próximo boot).

O comando que mostra quem volta sozinho é o `list-unit-files`:

```terminal
$ systemctl list-unit-files --type=service --no-pager
UNIT FILE                         STATE
NetworkManager.service            enabled
sshd.service                      disabled
systemd-timesyncd.service         enabled
fstrim.service                    static
steamos-update-finished.service   static
docker.service                    enabled
systemd-journald.service          static

6 unit files listed.
```

A coluna `STATE` aqui não é "running" nem "dead": é `enabled` (sobe no boot), `disabled` (espera ordem manual) ou `static` (não é ligado diretamente, mas sim puxado por outra unidade — é o caso de quase todo serviço interno do `systemd`). O `fstrim.service` é `static` porque, no SteamOS, quem o dispara é o `fstrim.timer`, não o próprio boot.

:::atencao
`list-units` mostra o estado de runtime (agora), e ele por padrão **omite** unidades que nunca foram carregadas. `list-unit-files` mostra a política de instalação (boot), e lista tudo. Não use um para responder a pergunta do outro: para saber "roda agora?" use `list-units`/`status`; para "volta no boot?" use `is-enabled` ou `list-unit-files`.
:::

## Descobrindo a unidade de um processo

Às vezes você sabe o processo, mas não a unidade que o controla. O `systemctl status` resolve o caminho inverso, mas há um atalho direto: cada serviço ativo ganha uma *cgroup* (grupo de controle) com o nome da unidade. O `ps` pode revelar isso:

```terminal
$ systemctl status steam --no-pager -l | head -8
● steam.service - SteamOS Steam Client
     Loaded: loaded (/usr/lib/systemd/system/steam.service; enabled)
     Active: active (running) since Wed 2025-01-15 09:12:34 -03; 3h ago
   Main PID: 940 (steam)
```

O cabeçalho do `status` é um mapa denso: o nome com uma bolinha colorida (verde = ativo, branca = inativo, vermelha = falhou), a linha `Loaded` com o caminho do arquivo da unidade e se está habilitado, e a linha `Active` com o estado e o PID principal. É a primeira olhada em qualquer diagnóstico, e a seção 3 vai destrinchá-lo por inteiro.

Agora você já consegue distinguir, num relance, um `service` de um `target`, e sabe que "ativo" e "habilitado" respondem a perguntas diferentes. Esse vocabulário é pré-requisito de tudo o que vem a seguir.

## Resumo

- Toda unidade tem extensão que define seu tipo: `.service`, `.target`, `.socket`, `.timer`, `.mount` e outros.
- `systemctl list-units` mostra o estado de runtime; `list-unit-files` mostra a política de boot.
- As colunas `LOAD`, `ACTIVE` e `SUB` indicam, respectivamente, se a definição carregou, o estado geral e o detalhe fino.
- "Ativo" (roda agora) e "habilitado" (sobe no boot) são independentes; `static` significa que outra unidade dispara esta.
- O cabeçalho do `systemctl status` concentra nome, caminho do arquivo, estado e PID principal da unidade.

## Exercícios

1. Rode `systemctl list-units --type=service --no-pager` e separe mentalmente três unidades `active (running)` de três `inactive (dead)`.
2. Execute `systemctl list-unit-files --type=service --no-pager` e encontre um serviço `static`; explique por que ele tem esse estado.
3. Para um serviço ativo da sua lista, rode `systemctl status <nome>` e identifique o caminho em `Loaded` e o valor de `Main PID`.
4. Compare `list-units --type=socket` com `list-unit-files --type=socket` e explique a diferença entre as duas saídas.
5. **Desafio.** Escolha um processo que apareça em `pstree -p 1` (por exemplo o `NetworkManager`), descubra qual unidade o controla via `systemctl status` e confirme se essa unidade está habilitada para o próximo boot usando `systemctl is-enabled`.
