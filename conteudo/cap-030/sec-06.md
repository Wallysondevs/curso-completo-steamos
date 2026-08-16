Todo Flatpak que você instala veio de algum lugar. Esse "lugar" é um **remoto** — um repositório que serve metadados e pacotes. O Flathub é o remoto padrão e cobre 90% dos cenários, mas o ecossistema Flatpak permite múltiplos remotos simultâneos, cada um com seus próprios catálogos, políticas de atualização e canais (como o beta). Saber gerenciar remotos é o que permite instalar apps que não estão no Flathub, acessar versões de teste e até criar espelhos locais.

:::objetivos
- Listar e inspecionar remotos com `flatpak remotes`
- Adicionar e remover remotos com `flatpak remote-add` e `flatpak remote-delete`
- Entender o canal `flathub-beta` e quando usá-lo
- Conferir o conteúdo de um remoto com `flatpak remote-ls`
- Diagnosticar problemas de conectividade em remotos

:::
## O que é um remoto e quais estão ativos

Um remoto é uma URL base que serve arquivos OSTree — o mesmo sistema de versionamento de arquivos que o rpm-ostree e o Silverblue usam. No SteamOS, o Flathub vem pré-configurado como remoto `system`:

```terminal
$ flatpak remotes
Name          Options
flathub       system
```

A flag `-d` (de *details*) mostra a URL real, o título e a prioridade:

```terminal
$ flatpak remotes -d
Name    Title           URL                                     Collection   Subset  Filter  Options
flathub Flathub         https://dl.flathub.org/repo/            org.flathub.Stable            system
```

Você pode inspecionar um remoto específico com `flatpak remote-info`:

```terminal
$ flatpak remote-info flathub org.gimp.GIMP
        ID: org.gimp.GIMP
       Ref: app/org.gimp.GIMP/x86_64/stable
      Arch: x86_64
    Branch: stable
   Version: 2.10.38
...
```

É o mesmo comando que usamos na [seção de inspeção](#/cap-030/sec-03), mas mirando o servidor em vez do disco local.

## Adicionando um remoto novo

Para adicionar um repositório que não é o Flathub — por exemplo, o Elementary AppCenter ou um repositório corporativo interno —, usa-se `flatpak remote-add`. A sintaxe básica é:

```terminal
$ flatpak remote-add --user --if-not-exists meu-remoto https://exemplo.com/repo/
$
```

A flag `--if-not-exists` é uma defesa: se o remoto `meu-remoto` já existir, o comando não falha estrondosamente, apenas não faz nada. Sem ela, tentar adicionar um remoto de mesmo nome resulta em erro e o script quebra.

O `--user` grava o remoto em `~/.local/share/flatpak/repo/config`, enquanto o `--system` (padrão) grava em `/var/lib/flatpak/repo/config` e pede `sudo`.

:::atencao
Adicionar um remoto de terceiros é confiar que aquele servidor não vai servir pacotes maliciosos. Remotos não são isolados entre si — um app do remoto X pode declarar dependência de um runtime que está no remoto Y, e o Flatpak tentará resolver a dependência automaticamente. Só adicione remotos cuja procedência você confia.
:::

## O caso do `flathub-beta`

O Flathub mantém um canal separado chamado `flathub-beta` onde mantenedores publicam versões de teste antes de promoverem para o canal estável. É o equivalente Flatpak dos repositórios `-proposed` ou `-testing` dos sistemas APT.

```terminal
$ flatpak remote-add --if-not-exists flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo
$ flatpak remotes
Name            Options
flathub         system
flathub-beta    system
```

Com o remoto beta adicionado, você instala a versão beta explicitamente:

```terminal
$ flatpak install flathub-beta org.gimp.GIMP
```

A grande vantagem de ter os dois canais como remotos separados (em vez de um "branch beta" no remoto `flathub`) é que você pode instalar a versão estável e a beta lado a lado — ou escolher, app por app, qual vem de qual remoto. Um Firefox estável do `flathub` e um GIMP beta do `flathub-beta` coexistem sem conflito.

:::dica
Se você só quer testar uma versão beta de um app específico, instale-o do `flathub-beta` e mantenha o resto do sistema no `flathub`. Depois do teste, remova o beta e reinstale do estável — ou espere a versão beta ser promovida, que o `update` resolve.
:::

## Listando o que um remoto oferece

O `flatpak remote-ls` lista o catálogo completo de um remoto — e o Flathub tem milhares de entradas, então o comando sem filtro demora e polui o terminal:

```terminal
$ flatpak remote-ls flathub | wc -l
2437
$ flatpak remote-ls --app flathub | grep -i video
Video Trimmer      org.gnome.gitlab.YaLTeR.VideoTrimmer
OBS Studio         com.obsproject.Studio
LosslessCut        no.mifi.losslesscut
```

O `--app` filtra só aplicativos, deixando de fora runtimes e extensões. Para descobrir updates disponíveis sem aplicar:

```terminal
$ flatpak remote-ls --updates flathub
```

Isso lista os refs cuja versão no servidor é mais nova que a local — o mesmo cálculo que o `update` faz, mas sem o compromisso de instalar.

## Removendo um remoto

`flatpak remote-delete` remove o remoto, mas não desinstala os apps que vieram dele. O catálogo some, mas os pacotes já no disco continuam funcionando — sem receber atualizações.

```terminal
$ flatpak remote-delete flathub-beta
$ flatpak remotes
Name     Options
flathub  system
```

Se o remoto removido era a única fonte de atualização de um app, o `flatpak update` passará a ignorá-lo silenciosamente. Para restaurar as atualizações, ou readicione o remoto ou mude a origem do app com `flatpak build-commit-from` (avançado, fora do escopo deste capítulo).

## Resumo

- `flatpak remotes` lista os remotos; `-d` mostra URL, título e coleção.
- `flatpak remote-add --if-not-exists <nome> <url>` adiciona um novo remoto com segurança.
- O `flathub-beta` é um remoto separado com versões de teste; apps dos dois remotos coexistem.
- `flatpak remote-ls --app <remoto>` lista o catálogo de apps de um remoto.
- `flatpak remote-delete <nome>` remove o remoto mas não desinstala os apps que vieram dele.

## Exercícios

1. Liste seus remotos com `flatpak remotes` e com `flatpak remotes -d`. Anote a URL do Flathub e o nome da coleção.
2. Adicione o `flathub-beta` com `flatpak remote-add --if-not-exists` e confirme que ele aparece em `flatpak remotes`. Depois remova-o com `flatpak remote-delete`.
3. Use `flatpak remote-ls --app flathub | wc -l` para contar quantos apps o Flathub oferece no momento.
4. Execute `flatpak remote-ls --updates flathub` e cruze o resultado com `flatpak list --app`. Quantos dos seus apps estão desatualizados?
5. **Desafio.** Adicione um segundo remoto (pode ser o `flathub-beta` mesmo) e instale um app que já existe no `flathub` a partir desse remoto beta. Verifique com `flatpak info <ID>` se o campo `Origin` mudou e o que acontece quando você roda `flatpak update`.