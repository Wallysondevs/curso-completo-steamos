A grande promessa das distros atômicas — e o motivo de o SteamOS, o Bazzite e o ChimeraOS terem convergido ali — é a capacidade de atualizar sem medo e voltar atrás com um reboot. Mas essa promessa tem mecânica própria: camadas de pacotes, deploys, rebase e rollback. Dominar esses conceitos no caso concreto do Bazzite (OSTree + `rpm-ostree`) é o que transforma a "imutabilidade" de palavra da moda em ferramenta que você realmente usa.

:::objetivos
- Entender como o OSTree modela deploys, camadas e commits
- Usar `rpm-ostree install` para empacotar sobre a base read-only
- Reverter atualizações com `rpm-ostree rollback` e pin
- Diferenciar deploy, rebase e reset no modelo atômico
- Evitar os erros que bagunçam um sistema imutável
:::

## O modelo mental: árvores versionadas

Pense no sistema operacional não como um disco cheio de arquivos soltos, mas como uma **árvore de arquivos versionada**, à la um repositório Git. O OSTree guarda cada estado do sistema como um **commit** — um snapshot completo da raiz. Atualizar não é "editar arquivos", é criar um commit novo e apontar o boot para ele.

Cada estado instalado no seu disco é um **deploy**. O disco pode ter vários deploys coexistindo (o atual, o anterior, o que está pendente), e o bootloader escolhe qual será montado na próxima vez. É por isso que "atualizar" e "reiniciar" andam juntos nesse modelo: você prepara um deploy novo e só assume no boot.

```terminal
$ rpm-ostree status
State: idle
Deployments:
● ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-deck:stable
    Version: 41.20250110.0 (2025-01-10T12:00:00Z)
    BaseCommit: 8a2f1c9d4e7b0a3c5f6d8e1b2a4c6d9f0e3b5a7c91b2d4f0a6e8c1b3d5f7a9c0e
  ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-deck:stable
    Version: 41.20241220.0 (2024-12-20T08:00:00Z)
    BaseCommit: 3e7b9a1c5d8f0b2e4a6c8d1f3b5e7a9c0d2f4b6e8a1c3d5f7b9a0c2e4f6b8d1
```

O `●` marca o deploy **em uso** (o que está rodando agora). O segundo registro, sem `●`, é o deploy anterior, ainda disponível no disco. Repare no campo `BaseCommit`: é o identificador do commit do OSTree — a "versão" concreta do sistema, como um hash de commit.

## Camadas: empacotando sobre a base

No sistema imutável, você não instala pacotes "soltando" arquivos na raiz. Você **empacota** pacotes numa camada que se soma à imagem base. O comando é o `rpm-ostree install`:

```terminal
$ rpm-ostree install htop neofetch
Checking out tree 8a2f1c9d... done
Enabled rpm-md repositories: fedora copr:copr.fedorainfracloud.org:ublue-os
Importing package manifest... done
Will download: 2 packages (1.2 MB)
Changes queued for next boot. Run "systemctl reboot" to start a reboot
```

A mensagem final é a chave de tudo: **"Changes queued for next boot"**. O pacote não foi instalado no sistema que está rodando — ele foi adicionado a um *novo* deploy, que assume no próximo boot. Nada muda na sua sessão atual.

```terminal
$ rpm-ostree uninstall htop
```

O `uninstall` faz o inverso: remove o pacote da camada, criando também um deploy novo. As camadas ficam listadas no status:

```terminal
$ rpm-ostree status --booted | grep -A5 LayeredPackages
    LayeredPackages: lutris steam
```

:::nota
Pacotes de **sistema** (drivers, ferramentas de CLI, bibliotecas) pertencem às camadas via `rpm-ostree install`. Aplicativos de **usuário final** (Steam, emuladores, editores) pertencem ao Flatpak. Misturar — instalar um app gráfico como camada ou tentar `dnf install` direto — é o caminho para um sistema inchado e difícil de reverter.
:::

## Rollback e pin: o airbag

A razão de ser de tudo isso aparece na hora do problema. Se um upgrade introduzir um bug, você não "desinstala a atualização" — você **volta um deploy**:

```terminal
$ rpm-ostree rollback
Moving '41.20241220.0' to be first deployment
Transaction complete; bootconfig swap complete.
Run "systemctl reboot" to start a reboot
```

O `rollback` é instantâneo porque não desfaz nada por meio de operações: ele simplesmente troca a ordem de boot, apontando para o deploy anterior, que já estava inteiro no disco. Reiniciou, você está de volta ao estado bom — como se a atualização nunca tivesse acontecido.

O `pin` protege um deploy específico de ser removido pela limpeza automática. Útil para "travar" uma versão que você sabe que funciona:

```terminal
$ rpm-ostree status
...
  ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-deck:stable
    Version: 41.20241220.0 (2024-12-20T08:00:00Z)
    BaseCommit: 3e7b9a1c...
    Pinned: yes
```

:::info
Deploys antigos ocupam espaço real em disco. O `ostree admin cleanup` remove os que não estão pinados nem em uso. Manter dois ou três deploys (um bom, um sendo testado) é a prática saudável; acumular dezenas esgota o SSD de um portátil sem motivo.
:::

## Deploy, rebase e reset: não confunda

Três operações parecem se sobrepor, mas fazem coisas distintas:

| Operação | O que faz | Quando usar |
|---|---|---|
| `rpm-ostree upgrade` | Puxa deploy novo da mesma imagem | Atualização rotineira |
| `rpm-ostree rebase` | Aponta para **outra** imagem | Trocar de variante (GNOME→KDE, AMD→NVIDIA) |
| `rpm-ostree reset` | Remove as camadas manuais | "Zerar" as sobreposições para voltar à base pura |

O `rebase` é a mais potente e a menos intuitiva: trocar de variante do Bazzite é isso — apontar o sistema para outro registro de imagem, que puxa um deploy completamente novo de outra base. Sem reinstalar.

```terminal
$ rpm-ostree rebase ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-kde:stable
Pulling manifest: ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-kde:stable
Staging deployment... done
Run "systemctl reboot" to start a reboot
```

O `reset` limpa as camadas que você adicionou via `rpm-ostree install`, devolvendo o sistema à imagem base tal como publicada. É o "restaurar de fábrica" sem reinstalar — útil depois de experimentar pacotes que não deram certo.

## Erros que bagunçam o imutável

O maior erro conceitual é tentar forçar o modelo antigo. O `dnf install` direto **não funciona** num Bazzite (a raiz é read-only) e gera o erro clássico:

```terminal
$ sudo dnf install htop
Error: This command has to be run with superuser privileges (under the root user)
...
$ sudo rpm-ostree install htop
```

Outro erro é ignorar a fronteira sistema/aplicativo: instalar um Steam via camada (`rpm-ostree install steam`) em vez de Flatpak cria um Frankenstein que nem o rollback limpa de forma elegante, porque o Steam trará dezenas de dependências para dentro da imagem.

:::atencao
Nunca rode `dnf` ou edite `/usr` à mão num sistema atômico. A raiz é lida de um commit versionado; alterações manuais ali são apagadas no próximo deploy (porque o deploy novo vem da imagem, não do seu disco) ou, pior, dessincronizam o estado de forma imprevisível. Toda mudança de sistema passa por `rpm-ostree`.
:::

## Resumo

- O OSTree modela o sistema como commits versionados; cada estado instalado é um deploy no disco.
- `rpm-ostree install`/`uninstall` empacotam pacotes em camadas que só assumem no próximo boot.
- `rpm-ostree rollback` reverte uma atualização trocando a ordem de boot, sem tocar nos arquivos.
- `pin` protege um deploy bom da limpeza; `ostree admin cleanup` remove deploys antigos.
- `upgrade` atualiza a mesma imagem, `rebase` troca de variante, `reset` remove as camadas manuais.
- Mudanças fora do `rpm-ostree` (dnf, editar `/usr`) quebram a promessa de atomicidade.

## Exercícios

1. Rode `rpm-ostree status` e identifique: o deploy em uso, o pendente/anterior, e se algum está pinado. Descreva cada campo.
2. Instale um pacote pequeno e inofensivo (`rpm-ostree install htop`), reinicie, e confirme com `which htop`. Depois remova-o e reinicie de novo.
3. Execute `rpm-ostree rollback` após uma atualização e verifique, no `status`, que a ordem de boot inverteu. Depois volte ao estado novo.
4. Marque um deploy como pinado e rode `ostree admin cleanup`. Observou que ele não foi removido? Explique por quê.
5. **Desafio.** Faça um `rebase` real para outra variante do Bazzite (ex.: de `bazzite-deck` para `bazzite-kde`) e documente o antes/depois no `rpm-ostree status`. Depois rebaseie de volta e explique o que mudou no `BaseCommit` e por que isso é "trocar de distro sem reinstalar".
