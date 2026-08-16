Depois de instalar, você precisa saber o que está no disco, de qual versão e ocupando quanto espaço. O `flatpak list` responde à primeira pergunta e o `flatpak info` à segunda. São os dois comandos de inspeção que você mais vai digitar, porque servem de preâmbulo para quase toda manutenção: antes de atualizar, antes de remover, antes de abrir um chamado de bug.

:::objetivos
- Listar apps, runtimes e ambos com `flatpak list` e suas flags
- Diferenciar a instalação `--user` da `--system` na listagem
- Extrair metadados completos de um app com `flatpak info`
- Ler permissões e identificar versão e origem de um pacote instalado

:::
## O que está instalado, afinal

O `flatpak list` sozinho mostra os aplicativos da instalação ativa, mas o Flatpak guarda mais do que apps. Runtimes e extensões também são "refs" instalados, e o `list` consegue separá-los:

```terminal
$ flatpak list
Name               Application ID               Version      Branch       Installation
Firefox            org.mozilla.firefox          128.0.3      stable       system
GIMP               org.gimp.GIMP                2.10.38      stable       system
OBS Studio         com.obsproject.Studio        30.2.3       stable       system
```

As flags `--app` e `--runtime` filtram por tipo, e `--user`/`--system` trocam de instalação. Para enxergar tudo, incluindo os componentes internos que normalmente ficam escondidos:

```terminal
$ flatpak list --runtime
Name                             Application ID                              Version   Branch   Installation
Freedesktop Platform             org.freedesktop.Platform                   24.08.8    24.08    system
Mesa                             org.freedesktop.Platform.GL.default        24.2.6     24.08    system
GNOME Application Platform version 46 org.gnome.Platform                    46         46       system
```

Aqui aparece o `org.freedesktop.Platform.GL.default` — o driver Mesa empacotado como Flatpak que fornece OpenGL e Vulkan para os apps. É um bom exemplo de componente que você nunca "abre", mas que o sistema precisa ter para jogos e editores funcionarem.

:::nota
A coluna `Installation` diz em qual das duas instalações cada ref vive: `system` (`/var/lib/flatpak`) ou `user` (`~/.local/share/flatpak`). Como `--user` e `--system` podem coexistir, às vezes o mesmo app aparece duas vezes se você o instalou nos dois lugares. O `list` sem filtro mostra a instalação que o Flatpak considera "ativa" primeiro.
:::

## O `info` vai fundo num único pacote

Enquanto o `list` é uma visão panorâmica, o `flatpak info <ID>` abre um pacote específico e despeja tudo: versão, runtime de origem, remoto de instalação, tamanho e o bloco de permissões (o sandbox).

```terminal
$ flatpak info org.gimp.GIMP
GIMP - Create images and edit photographs

          ID: org.gimp.GIMP
         Ref: app/org.gimp.GIMP/x86_64/stable
        Arch: x86_64
      Branch: stable
     Version: 2.10.38
     License: GPL-3.0+ AND LGPL-3.0+
      Origin: flathub
  Collection: org.flathub.Stable
Installation: system
    Installed: 401.7 MB
      Runtime: org.gnome.Platform/x86_64/46
          Sdk: org.gnome.Sdk/x86_64/46

       Commit: 7f1a2b3c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
       Parent: 0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c
      Subject: Export org.gimp.GIMP
         Date: 2024-10-02 14:22:30 +0000
```

Dois campos importam muito para o resto do capítulo. O **`Origin`** (`flathub`) diz de qual remoto o pacote veio — essencial na [seção de remotes](#/cap-030/sec-06). E o **`Commit`** é o hash que identifica exatamente *esta* build; é com ele que você faz downgrade, como na [seção de downgrade](#/cap-030/sec-09).

## Vendo as permissões do sandbox

O `flatpak info` também expõe as permissões que o app declara ou que você concedeu. Acione com `--show-permissions`:

```terminal
$ flatpak info --show-permissions org.gimp.GIMP
[Context]
shared=network;ipc;
sockets=x11;wayland;
devices=dri;
filesystems=xdg-pictures;xdg-download;
```

Cada linha é uma classe de acesso: `network` permite falar com a internet, `x11`/`wayland` são os protocolos de janela, `dri` libera acesso à GPU, e `filesystems=xdg-pictures;xdg-download;` autoriza o app a ler apenas as pastas de Imagens e Downloads. Entender esse bloco é pré-requisito para mexer em permissões com `override`, abordado na [seção de overrides](#/cap-030/sec-07).

:::dica
Para um resumo compacto útil em scripts, use `flatpak info --show-origin`, `--show-commit` e `--show-runtime` separadamente. Cada flag devolve uma única linha, fácil de capturar num `$( )`. Exemplo: `flatpak info --show-commit org.gimp.GIMP`.
:::

## Erros comuns ao inspecionar

Dois tropeços dominam o primeiro contato com `list` e `info`. O primeiro é rodar `flatpak list` e não ver um app que você *jura* ter instalado. Na maioria das vezes, o app está na outra instalação: você instalou com `--user`, mas o `list` sem flag mostra a instalação `system` (ou vice-versa). A correção é explícita e imediata:

```terminal
$ flatpak list --user
Name        Application ID          Version    Branch    Installation
GIMP        org.gimp.GIMP           2.10.38    stable    user
```

O segundo é confundir o `flatpak info` local com o remoto. `flatpak info org.gimp.GIMP` fala do pacote *no seu disco*; `flatpak info flathub org.gimp.GIMP` fala do pacote *no servidor*. Quem quer descobrir "há atualização disponível?" e roda o primeiro comando vê uma versão antiga e conclui errado que está desatualizado sem nunca confirmar no servidor.

:::atencao
O `flatpak info` aceita ID ambíguo. Se o mesmo ID existe em dois remotos ou em duas instalações, ele pode pedir que você desambigue com `--user`, `--system` ou informando o remoto. Não ignore esse prompt: o app que você inspeciona pode não ser o que você imagina.
:::

## Inspecionar sem instalar (remoto)

O `info` também funciona contra um remoto, para você espiar um pacote antes de baixá-lo. Basta informar o remoto:

```terminal
$ flatpak info flathub org.mozilla.firefox
```

A saída é praticamente a mesma do pacote instalado, mas traz a versão disponível *no servidor* em vez da que está no seu disco. É uma forma de comparar: se o `Version` do remoto for mais novo que o do `list`, existe atualização pendente — exatamente o que o `update` vai resolver, na [seção de atualização](#/cap-030/sec-04).

## Resumo

- `flatpak list` mostra apps instalados; `--runtime` revela runtimes e componentes internos como Mesa e GL.
- `--user` e `--system` separam as duas instalações que podem coexistir.
- `flatpak info <ID>` despeja metadados completos, incluindo `Origin` (remoto) e `Commit` (hash da build).
- `flatpak info --show-permissions` mostra o bloco de permissões do sandbox.
- `flatpak info <remoto> <ID>` inspeciona um pacote no servidor, sem instalar.

## Exercícios

1. Rode `flatpak list` e depois `flatpak list --runtime`. Separe em três grupos: apps, runtimes e extensões/componentes internos.
2. Execute `flatpak info org.gimp.GIMP` (troque pelo ID de um app seu) e anote os valores de `Origin`, `Runtime` e `Commit`.
3. Use `flatpak info --show-permissions <ID>` e interprete cada linha do bloco de contexto com suas próprias palavras.
4. Compare a versão local e a remota de um app: rode `flatpak info <ID>` e `flatpak info flathub <ID>` e veja se há diferença no campo `Version`.
5. **Desafio.** Escreva um loop de uma linha (com `for` no shell) que percorra os IDs de `flatpak list --app --columns=application` e imprima, para cada um, apenas o `Origin` via `flatpak info --show-origin`. Use o resultado para descobrir se algum app veio de um remoto inesperado.
