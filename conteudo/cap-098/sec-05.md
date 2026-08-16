Um dos motivos para o SteamOS apostar no Flatpak como principal via de instalação de aplicativos de desktop é o isolamento: cada Flatpak roda numa sandbox com acesso restrito ao sistema. Mas "restrito" é uma configuração, não um fato consumado — muitos aplicativos pedem permissões amplas, e o usuário as concede sem ler. Esta seção explica como a sandbox funciona e como você audita e restringe essas permissões com o Flatseal ou diretamente pelo `flatpak override`.

:::objetivos
- Entender o modelo de sandbox do Flatpak: namespaces, bind mounts e portais
- Listar permissões concedidas a cada aplicativo instalado
- Restringir acesso a sistema de arquivos, rede e dispositivos
- Usar o Flatseal para ajuste visual e o `flatpak override` para scripts
- Auditar permissões de um Flatpak antes de instalá-lo
:::

## A sandbox explicada em uma frase

Um Flatpak vê um sistema de arquivos virtual, não o `/` real. O runtime (GNOME, KDE, Freedesktop) fornece as bibliotecas; o aplicativo só enxerga o que o empacotador declarou e o que você, usuário, permitiu depois. Isso passa por três mecanismos: namespaces (isolamento de processos e montagens), bind mounts (o que do sistema real aparece dentro da sandbox) e portais (APIs D-Bus pelas quais o aplicativo pede arquivos ou impressão sem ver o sistema de arquivos real).

## O que seu Flatpak está vendo de você

O comando `flatpak permissions` lista as permissões globais; o `flatpak info -m` detalha o que cada aplicativo tem:

```terminal
$ flatpak info -m org.gimp.GIMP
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;
devices=dri;usb;
filesystems=xdg-config/GIMP;xdg-config/gtk-3.0;host;
```

Cada campo é uma decisão de segurança. `filesystems=host` significa que o GIMP vê todos os seus arquivos — inclusive `/home/deck`, diretórios ocultos e chaves SSH. `shared=network` permite acesso à rede. `sockets=x11` dá acesso ao servidor X11, o que é conveniente para atalhos de teclado, mas também permite keylogging por qualquer Flatpak X11.

```terminal
$ flatpak info -m com.visualstudio.code | grep filesystems
filesystems=host;home;
```

O VS Code Flatpak também monta todo o sistema de arquivos. Isso é esperado — um IDE precisa ler projetos —, mas saber disso é diferente de assumir que "está isolado porque é Flatpak".

:::atencao
`filesystems=host` e `sockets=x11` juntos significam que o aplicativo pode ler e escrever qualquer arquivo visível ao `deck` e capturar a entrada de teclado de qualquer outro aplicativo X11. Não é um "escape de sandbox", mas torna a sandbox praticamente decorativa. Ajuste com critério.
:::

## Flatseal: a interface gráfica

O Flatseal (`com.github.tchx84.Flatseal`) é o jeito mais prático de ajustar permissões: abre o Flatpak, seleciona o aplicativo na lista, desliga chaves e salva. Ele gera overrides que ficam em `~/.local/share/flatpak/overrides/`.

Mas você também pode usar a linha de comando para ver o que o Flatseal está escrevendo:

```terminal
$ cat ~/.local/share/flatpak/overrides/org.gimp.GIMP
[Context]
filesystems=!host;
```

A exclamação (`!host`) remove a permissão `host` que o pacote pedia. O GIMP agora só acessa arquivos via portal — quando você abre um arquivo pelo seletor do GNOME/KDE, o portal entrega o arquivo sem revelar o sistema de arquivos.

:::dica
Depois de restringir o `filesystems` de um aplicativo, teste-o abrindo um arquivo e salvando. Se ele travar ou não encontrar nada, pode ser que precise de `filesystems=xdg-pictures` ou `filesystems=~/Projetos:create`. O Flatseal tem uma caixa de texto "Other files" onde você digita esses paths adicionais.
:::

## Bloqueando rede e dispositivos

Para aplicativos que não deveriam acessar a internet, negue a rede:

```terminal
$ flatpak override --user --unshare=network com.example.app
$ flatpak info -m com.example.app | grep shared
shared=ipc;
```

Note que `network` sumiu da lista de `shared=`. O aplicativo agora opera offline, o que é ideal para calculadoras, editores de texto offline e ferramentas que processam dados locais.

Para bloquear dispositivos (webcam, microfone, GPU), os toggles são `--unshare=device` e `--nosocket`:

```terminal
$ flatpak override --user --nosocket=wayland --nosocket=x11 --nosocket=pulseaudio com.example.app
```

Sem `wayland` ou `x11`, o aplicativo não desenha janela — útil para serviços em background que você roda via Flatpak.

## Auditoria antes de instalar

O FlatHub exibe as permissões na página do aplicativo (seção "Permissions"), mas o comando equivalente é olhar o arquivo de metadados antes da instalação. Se você tem o `.flatpakref`, descompacte e leia:

```terminal
$ flatpak remote-info --log flathub org.gimp.GIMP 2>/dev/null | head -20
```

Isso mostra o commit message e pode incluir a lista de permissões. Mas a fonte mais confiável é instalar e rodar `flatpak info -m` imediatamente:

```terminal
$ flatpak install flathub com.example.app
$ flatpak info -m com.example.app
```

Se as permissões forem excessivas, ajuste com override **antes** de executar o aplicativo pela primeira vez.

:::info
Alguns Flatpaks declaram `filesystems=home` em vez de `host`. `home` monta apenas `/home/deck` (ou o home do usuário), enquanto `host` monta a raiz inteira. A diferença prática é sutil para dados pessoais, mas importante para aplicativos que leem `/etc` ou `/sys` — que `home` não alcança.
:::

## Resumo

- Flatpak isola aplicativos com namespaces, bind mounts e portais; o nível de isolamento depende das permissões declaradas e aceitas.
- `flatpak info -m` lista exatamente o que o aplicativo vê do sistema real — rede, sistema de arquivos, sockets e dispositivos.
- `filesystems=host` e `sockets=x11` juntos anulam a maioria dos benefícios da sandbox.
- O Flatseal gerencia overrides visuais; `flatpak override --user` faz o mesmo pela linha de comando.
- Permissões podem ser removidas com `--unshare` (rede, ipc), `--nosocket` (x11, wayland, pulseaudio) e `!host` (sistema de arquivos).
- Auditar permissões com `flatpak info -m` antes de executar um Flatpak novo é um hábito que evita surpresas.

## Exercícios

1. Liste todos os Flatpaks instalados com `flatpak list` e inspecione as permissões de cada um com `flatpak info -m`. Quantos têm `filesystems=host`?
2. Instale o Flatseal e use-o para bloquear a rede de um aplicativo. Depois confira com `flatpak info -m` que a mudança aparece como `shared` sem `network`.
3. Use `flatpak override --user --unshare=network --nofilesystem=host org.gnome.Calculator` e teste se a calculadora ainda funciona normalmente.
4. Crie um override que permita a um aplicativo acessar apenas `~/Documentos` e `~/Downloads`, removendo `host` e `home`. Teste se ele ainda consegue abrir arquivos fora desses diretórios.
5. **Desafio.** Pegue o arquivo de metadados de um Flatpak qualquer (`/var/lib/flatpak/app/<id>/current/active/metadata`) e compare com a saída de `flatpak info -m`. Identifique um caso onde o `flatpak override` do usuário modifica, adiciona ou remove uma linha do `[Context]`. Escreva um script de uma linha que liste, para todos os Flatpaks instalados, apenas os que têm `host` no filesystems.