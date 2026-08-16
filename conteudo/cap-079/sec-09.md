Automação é poder, e poder sem cuidado se transforma em risco. Um script rodando como usuário pode apagar saves; um serviço root mal configurado pode comprometer o sistema inteiro; uma regra udev que dispara na hora errada pode travar o Deck. No SteamOS, que você usa tanto como console de jogos quanto como computador pessoal, a superfície de risco é dupla: não há só seus dados, há também o sistema imutável que a Valve atualiza por cima de qualquer coisa que você fizer. Esta seção final foca em higiene e segurança: os princípios que mantêm sua automação segura, previsível e sobrevivente a longo prazo.

:::objetivos
- Aplicar o princípio do menor privilégio à automação (usuário vs root, systemd vs udev)
- Estruturar scripts com gestão segura de variáveis, paths e `sudo`
- Proteger segredos e credenciais que a automação manipula
- Tornar scripts auditáveis, versionáveis e reprodutíveis
- Definir os limites éticos e práticos da automação no SteamOS (o que não automatizar)

:::

## Menor privilégio: o fundamento

A regra mais importante é a mais violada: **a automação deve rodar com o mínimo de privilégio necessário.** No SteamOS, isso se traduz em decisões concretas:

```terminal
$ # automação cotidiana → usuário deck, systemd --user
$ # montagem de disco, rede, hardware → root via udev/sistema, e o mínimo possível
```

Cada privilégio que você concede a um script é um privilégio que qualquer falha ou bug desse script também possui. Um script de backup com `sudo` irrestrito pode, por um erro de variável, transformar um `rm -rf "$VAR/"` em `rm -rf /`.

A consequência prática para o design:

| Tarefa | Privilégio correto | Por quê |
|---|---|---|
| Backup de saves | usuário `deck` | dados do próprio usuário |
| Limpeza de caches | usuário `deck` | pertencem ao usuário |
| Monitoramento de jogo | usuário `deck` | leitura de processos próprios |
| Montar disco externo | root (via udev→systemd) | requer mount |
| Alterar clock/TDP | **não fazer** | conflita com a Valve |
| Regras udev | root (arquivo em `/etc`) | config de sistema |

Quando root for inevitável, confine o escopo usando `sudo` com um comando específico autorizado (`sudoers` com entry restrita), em vez de `sudo` irrestrito:

```terminal
$ cat /etc/sudoers.d/deck-backup
# permite apenas montar/desmontar o disco de backup, sem senha
deck ALL=(root) NOPASSWD: /usr/bin/mount, /usr/bin/umount
```

Isso limita o `sudo` a exatamente `mount` e `umount` — nada mais. Um script que só pode montar/desmontar não pode, por acidente, derrubar o sistema.

:::atencao
Nunca coloque `sudo` + senha hardcoded num script, nem use a senha do usuário em texto claro. Se um comando precisa de root de forma interativa, prefira `sudo -n` (que falha em vez de travar esperando senha) junto com uma regra `NOPASSWD` específica no sudoers. Senha no script = senha comprometida.
:::

## Gestão segura de variáveis e paths

Muitos desastres de automação começam com uma variável vazia. O `set -u` pega a variável indefinida, mas não pega a variável definida-como-vazia:

```terminal
$ backup_dir=""            # deveria vir de um config, mas veio vazio
$ rm -rf "$backup_dir/"    # rm -rf "/" — desastre
$ rm -rf "$backup_dir"     # rm -rf "" → erro, mas sem desastre
```

Duas defesas essenciais:

1. **Valide antes de usar:**

```terminal
#!/bin/bash
set -euo pipefail

dest="${1:-}"
if [[ -z "$dest" ]]; then
    echo "ERRO: destino não informado" >&2
    exit 1
fi
if [[ ! -d "$dest" ]]; then
    echo "ERRO: '$dest' não é um diretório" >&2
    exit 1
fi
```

2. **Use `--` para separar opções de argumentos, e caminhos absolutos:**

```terminal
$ rm -rf -- "$dest"          # o -- impede que "$dest" seja interpretado como flag
$ rsync -a --delete -- "$src/" "$dest/"
```

O `--` é um guarda barato contra nomes de arquivo que começam com `-` (raro, mas possível com saves e downloads).

Para globs e expansões que podem não casar, proteja com `nullglob`:

```terminal
shopt -s nullglob
# se o glob não casar nada, o for simplesmente não itera (em vez de iterar o literal)
for f in "$dest"/*.vdf; do
    : # processa
done
```

## Protegendo segredos

Automação que sincroniza saves na nuvem, faz backup remoto ou chama APIs vai manipular segredos — tokens, senhas de API, chaves SSH. Três regras:

1. **Nunca em texto claro no script.** Use variáveis de ambiente ou arquivos de config com permissão restrita.

```terminal
$ # NÃO:
$ # API_TOKEN="sk-abc123..."   # no script, versionado

$ # SIM:
$ export API_TOKEN="..."       # no shell, fora do script
$ # ou num arquivo protegido:
$ cat ~/.config/meu-app/env
API_TOKEN=sk-abc123...
$ chmod 600 ~/.config/meu-app/env
```

2. **`chmod 600` em tudo que guarda segredo.** Um arquivo de config com token em modo `644` é legível por qualquer processo do sistema.

```terminal
$ ls -l ~/.config/meu-app/env
-rw------- 1 deck deck 28 Apr 30 10:00 /home/deck/.config/meu-app/env
```

3. **Prefira chaves SSH e agentes a senhas.** O `ssh-agent` (iniciado no `.bash_profile`, seção 5) mantém a chave em memória e permite operações sem senha em texto claro.

```terminal
$ eval "$(ssh-agent -s)"
$ ssh-add ~/.ssh/id_ed25519
```

Para serviços systemd que precisam de segredo, evite colocar o valor no unit file (que pode ser lido com `systemctl cat`). Use `EnvironmentFile` apontando para um arquivo restrito:

```terminal
$ cat ~/.config/systemd/user/backup-remoto.service
[Service]
Type=oneshot
EnvironmentFile=%h/.config/meu-app/env
ExecStart=%h/bin/backup-remoto.sh

$ chmod 600 ~/.config/meu-app/env
```

:::info
`EnvironmentFile` com `%h` resolve para o `$HOME`. O arquivo deve pertence ao usuário e ter permissão 600 — o systemd se recusa a ler alguns tipos de arquivo com permissões permissivas, mas melhor garantir explicitamente.
:::

## Audítável, versionável, reprodutível

Automação é código, e código só é confiável se pode ser auditado, revertido e refeito. Três práticas que separam um script amador de um sistema de automação sério:

**1. Controle de versão.** Mantenha seus scripts em um repositório git local (ou remoto):

```terminal
$ git init ~/automatizacao
$ git -C ~/automatizacao add -A
$ git -C ~/automatizacao commit -m "maintenance.sh: corrige path do shadercache"
```

O git dá histórico, revert e a capacidade de recriar todo o setup num Steam Deck novo — essencial num dispositivo que você vai, cedo ou tarde, formatar ou trocar.

**2. Idempotência.** Um script idempotente pode rodar 10 vezes e o resultado final é idêntico ao de rodar 1 vez. Isso não é só elegância — é o que torna timers seguros (se a execução se repetir por `Persistent=true` ou re-trigger, nada quebra):

```terminal
# idempotente: criar diretório se não existir
mkdir -p ~/backups/saves
# idempotente: rsync com --delete deixa o destino igual à origem
rsync -a --delete -- ~/all-saves/ ~/backups/saves/
# idempotente: touch não destroi nada
touch ~/.last-backup-stamp
```

**3. Self-documenting.** O próprio script deve explicar o que faz e por quê — cabeçalho, comentários nos pontos não óbvios, e mensagens de log descritivas:

```terminal
#!/bin/bash
# ------------------------------------------------------------------
# backup-remoto.sh
# Sobe os saves para o destino remoto via rsync+ssh.
# Pré-requisitos: ssh-agent ativo, chave carregada, rede disponível.
# Uso: backup-remoto.sh [destino]
# ------------------------------------------------------------------
```

## O que NÃO automatizar (e por quê)

Nem tudo deve ser automatizado — e no SteamOS há uma linha clara. Automação que interfere no funcionamento central do console tende a brigar com a Valve e a quebrar na próxima atualização:

- **Gerenciamento de energia, clock e TDP.** A Valve controla isso dinamicamente no Gaming Mode. Automatizar por cima gera conflito e instabilidade (reforçado na seção 7).
- **Modificar a partição raiz imutável.** Além de ser revertido, pode corromper o esquema A/B de atualização.
- **Apagar arquivos de sistema ou do Steam sem entender o que são.** Um "cache limpo" mal direcionado pode remover shaders ativos ou até saves (nunca delete `userdata/` ou `compatdata/`).
- **Automatizar decisões irreversíveis de dados.** Excluir saves, sobrescrever backups de forma destrutiva, resolver conflitos de nuvem automaticamente — essas decisões pertencem ao humano. A automação detecta e reporta; você decide.

A fronteira é uma só: **automatize o que é repetitivo, reversível e bem compreendido. Deixe manual o que é único, irreversível ou incerto.**

## Checklist final de segurança

Antes de colocar qualquer automação em produção, passe por esta lista:

- [ ] `set -euo pipefail` no topo do script
- [ ] `trap ... ERR` para capturar falhas com contexto
- [ ] Todas as expansões com aspas duplas (`"$var"`)
- [ ] Caminhos validados antes de `rm`, `rsync --delete` ou `mv`
- [ ] `--` antes de argumentos que podem começar com `-`
- [ ] `chmod 600` em arquivos com segredo; `chmod +x` em scripts executáveis
- [ ] `sudo` restrito via `sudoers.d` (nada de senha em texto claro)
- [ ] Idempotente: rodar duas vezes não causa efeito colateral
- [ ] Versionado em git, com mensagem de commit clara
- [ ] Testado manualmente antes de ser agendado num timer

## Resumo

- Menor privilégio: rode como `deck` sempre que possível; confine `sudo` com regras `NOPASSWD` específicas no sudoers.
- Valide variáveis antes de usar; use `--`, `nullglob` e caminhos absolutos; o `set -u` não pega variável vazia.
- Segredos nunca em texto claro: variáveis de ambiente, `EnvironmentFile` com `chmod 600`, chaves SSH + agent.
- Automação é código: versionamento git, idempotência e self-documentation tornam-na confiável a longo prazo.
- Não automatize power/clock/TDP, a raiz imutável, nem decisões irreversíveis de dados.
- Um checklist final de segurança é o pré-requisito antes de agendar qualquer tarefa.

## Exercícios

1. Audite um dos seus scripts com a checklist final. Quantos itens falharam? Corrija cada um.
2. Configure uma regra `sudoers.d` que permita apenas `mount`/`umount` sem senha para sua conta, e teste `sudo -n mount` e `sudo -n rm` (este último deve falhar).
3. Mova uma credencial (token/senha) de dentro de um script para um `EnvironmentFile` com `chmod 600`, e referencie via `EnvironmentFile=%h/...`. Confirme que `systemctl cat` não expõe o valor.
4. Inicialize um repositório git para `~/bin` (e `~/.config/systemd/user`), faça um commit inicial e simule uma mudança + revert com `git diff` e `git restore`.
5. **Desafio.** Escreva um script "auditor" que percorra `~/bin/*.sh` e reporte violações da checklist (falta de `set -euo pipefail`, `rm` sem validação, `chmod 777`, segredo em texto claro, etc.). Rode-o na sua coleção e priorize as correções.