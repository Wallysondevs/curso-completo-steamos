Depois de auditar o que já está instalado, o próximo nível é ajustar as permissões **na instalação** e para grupos de apps de uma vez. O SteamOS usa uma instalação Flatpak de sistema (os apps da base vêm de lá) e uma instalação de usuário para o que você adiciona no seu `~`. A distinção entre os dois escopos muda onde as permissões ficam gravadas e quem pode vê-las.

Aqui você vai aprender a instalar apps já com um conjunto de permissões endurecido, a mover permissões entre escopos e a tratar apps que precisam de exceção global — sem quebrar o sistema imutável do Deck.

:::objetivos
- Diferenciar a instalação Flatpak de sistema da de usuário no SteamOS
- Aplicar permissões no momento da instalação com `flatpak install --user`
- Entender onde o `flatpak override --system` e o `--user` gravam suas configurações
- Endurecer um app antes mesmo do primeiro uso
:::

## Sistema versus usuário

Todo Flatpak no Steam Deck vive em uma de duas instalações. A de **sistema** fica em `/var/lib/flatpak` e exige elevação para mexer. A de **usuário** fica em `~/.local/share/flatpak` e é totalmente sua.

```terminal
$ flatpak list --app --columns=application,installation
Application ID                Installation
org.mozilla.firefox           system
org.gimp.GIMP                 system
com.github.tchx84.Flatseal    user
com.valvesoftware.Steam       system
```

A coluna Installation mostra onde cada app está. O Firefox, o GIMP e o Steam chegaram pela instalação de sistema (pré-instalados ou via `flatpak install` sem `--user`). O Flatseal, que você instalou na primeira seção com `--user` implícito, ficou na instalação de usuário.

A consequência prática: overrides gravados com `--user` afetam apps de **ambas** as instalações (o override de usuário se aplica por cima do de sistema, para o seu usuário). Já overrides gravados com `--system` (ou sem flag, se o app é de sistema) afetam todos os usuários e pedem senha.

## Instalando já endurecido

Quando você instala um app que já sabe que vai querer limitado, pode aplicar o override logo após a instalação, no mesmo fluxo:

```terminal
$ flatpak install --user flathub org.example.OfflineEditor
[...]
$ flatpak override --user --nofilesystem=home --nosocket=network \
    --socket=wayland --nosocket=x11 org.example.OfflineEditor
$ flatpak override --show org.example.OfflineEditor | grep -E 'filesystems|sockets'
filesystems=!home;
sockets=!network;wayland;!x11;
```

O app acabou de nascer já sem home, sem rede, sem X11, e com Wayland. Se for um editor offline, está endurecido desde o primeiro segundo, antes de qualquer dado sensível tocar o disco no escopo dele.

Não existe um `flatpak install` com flags de permissão embutidas — o Flatpak instala com as permissões do pacote e você aplica o override em seguida. Por isso o padrão "instalar → override → testar" é a forma correta de fazer instalação endurecida.

:::dica
Se você instala frequentemente o mesmo app em várias máquinas, mantenha um pequeno script por app, ou um único arquivo com os comandos `flatpak override` de cada um. Rode o script logo após a instalação. É a versão pessoal de "hardening as code".
:::

## Onde os overrides ficam gravados

Os overrides são arquivos simples em disco, e saber onde eles estão ajuda a auditar e a debugar. O override de sistema de um app fica em:

```terminal
$ sudo cat /var/lib/flatpak/overrides/org.gimp.GIMP
[Context]
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;
```

E o override de usuário fica espelhado em:

```terminal
$ cat ~/.local/share/flatpak/overrides/org.gimp.GIMP
[Context]
filesystems=xdg-documents;
```

O Flatpak combina as camadas na ordem: metadados do pacote → override de sistema → override de usuário, com a última camada vencendo. É por isso que um override `--user` consegue negar algo que o sistema definiu: a camada de usuário é aplicada depois.

:::nota
No SteamOS, o sistema de arquivos raiz é imutável. Mexer em `/var/lib/flatpak` via `override --system` mexe em configuração (não no conteúdo imutável), então é permitido. Mas como os apps de sistema do Deck são gerenciados por atualizações da Valve, prefira overrides de usuário para as suas mudanças pessoais — assim uma atualização do sistema não interfere nas suas escolhas.
:::

## Tratando exceções globais

Às vezes você quer uma política para todos os apps, não um por um. Existe o conceito de override global (sem ID de aplicativo):

```terminal
$ flatpak override --user --nofilesystem=host
```

Isso nega o `host` para **todos** os Flatpaks do seu usuário. É útil como padrão de segurança: ninguém pode herdar `filesystems=host` sem uma exceção explícita. Apps que genuinamente precisam (raros) recebem a re-admissão individual:

```terminal
$ flatpak override --user --filesystem=host org.example.NeedsHost
```

A ordem de precedência torna isso possível: a negação global é aplicada primeiro, e a exceção específica do app vem depois.

:::atencao
Override global é poderoso mas perigoso de debugar. Um `--nofilesystem=host` global quebra silenciosamente qualquer app legado que dependia de `host`, e você pode passar horas tentando entender por que. Use com moderação, documente o que fez, e lembre que `flatpak override --user --reset` sem ID reverte o global.
:::

## Resumo

- O SteamOS tem instalação Flatpak de sistema (`/var/lib/flatpak`) e de usuário (`~/.local/share/flatpak`).
- `flatpak list --columns=installation` revela onde cada app está instalado.
- Override `--user` aplica-se ao seu usuário e cobre apps de ambas as instalações.
- Não há flags de permissão no `flatpak install`; endureça logo após com `flatpak override`.
- Os overrides são arquivos em `/var/lib/flatpak/overrides/` (sistema) e `~/.local/share/flatpak/overrides/` (usuário).
- A precedência é: pacote → override de sistema → override de usuário, com o último vencendo.

## Exercícios

1. Rode `flatpak list --app --columns=application,installation` e classifique seus apps entre sistema e usuário.
2. Escolha um app que você ainda não instalou, instale-o com `flatpak install --user flathub <id>` e aplique imediatamente um endurecimento de filesystem/sockets antes de abri-lo.
3. Localize e leia o override de usuário de um app em `~/.local/share/flatpak/overrides/`. Compare o conteúdo com a saída de `flatpak override --show`.
4. Aplique um override global `flatpak override --user --nofilesystem=host` e verifique com `flatpak override --show` (sem ID) que ele está ativo.
5. **Desafio.** Reverta o exercício 4 com o seletivo adequado (não use `--reset` global se quiser manter outros overrides). Depois, crie um app de teste com a exceção `--filesystem=host` e explique, usando a ordem de precedência, por que ele volta a ter acesso mesmo com a negação global ainda ativa.