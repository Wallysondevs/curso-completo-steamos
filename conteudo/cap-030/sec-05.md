Remover um Flatpak não é só apagar um ícone. O sistema de armazenamento em camadas significa que um runtime pode ficar órfão depois que o último app que o usava vai embora, e arquivos residuais em `~/.var` sobrevivem à desinstalação. Esta seção ensina a remover com precisão e a fazer a faxina completa.

:::objetivos
- Remover apps e runtimes com `flatpak remove` e `flatpak uninstall`
- Entender por que desinstalar um app não remove o runtime automaticamente
- Limpar runtimes órfãos com `uninstall --unused`
- Localizar e limpar dados residuais em `~/.var/app`

## `remove` e `uninstall` são o mesmo comando

O Flatpak aceita tanto `flatpak remove` quanto `flatpak uninstall`. São sinônimos; produzem a mesma saída e aceitam as mesmas flags. A diferença é só estética — `remove` é mais curto de digitar, `uninstall` é o nome canônico na documentação.

```terminal
$ flatpak remove org.gimp.GIMP

        ID                     Branch          Op
 1. [✗] org.gimp.GIMP          stable          r

Proceed with these changes to the system installation? [Y/n]: y
```

A coluna `Op` com `r` (de *remove*) indica que o ref será desinstalado. O Flatpak não pergunta confirmação para cada runtime que poderia ser removido junto — você tem que decidir isso separadamente, como veremos a seguir.

Assim como o `install`, o `remove` aceita `--user` e `--system` para mirar uma instalação específica, e `--force` para pular a confirmação interativa (perigoso em scripts, mas útil em automação).

```terminal
$ flatpak remove --user --force org.audacityteam.Audacity
```

:::perigo
`--force` não pede confirmação e remove imediatamente. Só use em scripts que você já testou. Digitar `--force` com o ID errado pode apagar o app errado sem chance de arrependimento.
:::

## Runtimes não somem sozinhos

Depois de remover o GIMP, o runtime `org.gnome.Platform` permanece instalado. O motivo é legítimo: outros apps podem depender dele. Só que, depois de vários ciclos de instalação e remoção, o disco acumula runtimes que ninguém mais usa:

```terminal
$ flatpak list --runtime
Name                         Application ID                       Version    Branch
Freedesktop Platform         org.freedesktop.Platform             24.08.8    24.08
Freedesktop Platform 23.08   org.freedesktop.Platform             23.08.23   23.08
Mesa                         org.freedesktop.Platform.GL.default  24.2.6     24.08
Mesa                         org.freedesktop.Platform.GL.default  23.3.6     23.08
```

Dois branches do Freedesktop (24.08 e 23.08) com seus Mesas — quase certamente um deles não serve mais a app nenhum. O comando que resolve isso sem adivinhação é:

```terminal
$ flatpak uninstall --unused

        ID                                              Branch          Op
 1. [✗] org.freedesktop.Platform.GL.default             23.08           r
 2. [✗] org.freedesktop.Platform                        23.08           r
 3. [✗] org.freedesktop.Platform.Locale                 23.08           r

Proceed with these changes to the system installation? [Y/n]: y
```

O Flatpak percorre todos os refs instalados, cruza com as dependências declaradas por cada app e identifica os órfãos. Só são listados refs que nenhum app utiliza. Se um runtime ainda tem pelo menos um app dependente, ele fica.

:::dica
Acostume-se a rodar `flatpak uninstall --unused` a cada duas ou três semanas. Em máquinas que recebem muitos apps (como um Steam Deck onde se testa emuladores e ferramentas), o acúmulo de runtimes órfãos pode ultrapassar 2 GB sem que você perceba.
:::

## Dados de aplicativo: o `~/.var/app`

A remoção do Flatpak apaga o ref do disco, mas não toca nos dados do usuário. Arquivos de configuração, saves, cache e preferências vivem em `~/.var/app/<ID>/`, e esse diretório sobrevive à desinstalação:

```terminal
$ ls ~/.var/app/org.gimp.GIMP/
cache  config  data
```

Se você quer apagar o GIMP por completo, inclusive suas configurações, o comando é manual:

```terminal
$ flatpak remove org.gimp.GIMP
$ rm -rf ~/.var/app/org.gimp.GIMP
```

Alguns apps grandes (navegadores, editores de vídeo) acumulam centenas de megabytes de cache em `~/.var`. Antes de remover um app que você pretende reinstalar, vale conferir o que será perdido:

```terminal
$ du -sh ~/.var/app/org.mozilla.firefox/
1.8G    /home/ana/.var/app/org.mozilla.firefox/
```

:::nota
O Discover, quando desinstala um Flatpak, geralmente oferece uma caixinha de seleção para "remover também os dados do app". No terminal, essa decisão é sua — o Flatpak por padrão preserva os dados como medida de segurança, caso você esteja apenas trocando de versão.
:::

## Reparando a instalação

Se algo parece corrompido — um app que não abre, um runtime que não carrega — o `flatpak repair` corrige problemas estruturais na instalação, como objetos soltos ou índices quebrados:

```terminal
$ flatpak repair
Checking remotes...
Pruning objects...
Erasing .removed files...
Repair completed.
```

Raramente necessário no uso normal, mas resolve aquela situação em que o disco encheu durante um `install` e o Flatpak ficou inconsistente. Se um `flatpak update` falhar com erro de checksum, rode `flatpak repair` antes de qualquer outra coisa.

## Resumo

- `flatpak remove` e `flatpak uninstall` são sinônimos; `--user`/`--system` miram a instalação certa.
- Remover um app não remove o runtime; use `flatpak uninstall --unused` para limpar órfãos.
- Dados de usuário em `~/.var/app/<ID>/` sobrevivem ao `remove` e precisam de `rm -rf` manual.
- `flatpak repair` corrige inconsistências da instalação após falhas de disco ou rede.
- `--force` pula confirmações, mas deve ser usado com cautela.

## Exercícios

1. Instale e remova um app pequeno (ex.: `org.gnome.Recipes`) em sequência, usando `flatpak install` e `flatpak remove`, observando cada confirmação.
2. Rode `flatpak list --runtime` antes e depois de `flatpak uninstall --unused`. Quantos runtimes foram removidos e qual era o branch deles?
3. Inspecione `~/.var/app/` e identifique diretórios de apps que você já desinstalou (compare com `flatpak list`). Se houver algum, calcule o espaço ocupado com `du -sh`.
4. Execute `flatpak repair` e explique cada linha da saída com suas próprias palavras.
5. **Desafio.** Escreva um script que: (a) liste todos os IDs de apps instalados com `flatpak list --app --columns=application`, (b) para cada um, verifique se o diretório `~/.var/app/<ID>` existe e qual seu tamanho, e (c) imprima uma linha final com o total de espaço em `~/.var/app` que não corresponde a nenhum app atualmente instalado.