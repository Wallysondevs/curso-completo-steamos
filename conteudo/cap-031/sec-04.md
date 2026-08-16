No Steam Deck, a sessão gráfica roda sobre Wayland. É o protocolo padrão desde o SteamOS 3.0, e o X11 só aparece quando um app mais antigo dispara o XWayland — um servidor X que o compositor Wayland hospeda como compatibilidade. Para os Flatpaks, essa dualidade gera um dilema de permissões: deixar o app falar com Wayland, com X11, com os dois, ou com nenhum?

A resposta correta depende do app. Mas a resposta segura — no sentido de isolamento — é quase sempre "só Wayland". Entender por que isso é verdade e como o **Portal XDG** se encaixa nessa conversa é o que esta seção resolve.

:::objetivos
- Distinguir os soquetes `wayland`, `x11` e `fallback-x11` no contexto de sandbox Flatpak
- Entender por que o X11 é inerentemente menos isolado que o Wayland
- Usar o Flatseal para forçar Wayland e remover o soquete X11 de apps compatíveis
- Explicar o papel do Portal XDG como alternativa segura a soquetes brutos
:::

## Wayland isola, X11 compartilha

O X11 foi projetado nos anos 80, quando a ideia de isolar processos gráficos uns dos outros não existia. No modelo X11, qualquer cliente conectado ao servidor pode:

- Ver as teclas que outro cliente está recebendo (keylogging trivial).
- Capturar a tela de qualquer janela.
- Injetar eventos de mouse e teclado em outras janelas.

Tudo isso funciona por design. Não é bug, é a arquitetura. O protocolo X11 expõe as mesmas primitivas de "ler entrada global" que um gerenciador de janelas precisa para todo e qualquer cliente conectado.

No Wayland, cada cliente recebe apenas seus próprios eventos. Um app não sabe o que o outro está digitando. Não pode capturar a tela de outro sem pedir via portal (que você autoriza). Não pode injetar cliques. O isolamento é arquitetural.

Isso significa que, para um Flatpak, remover o soquete `x11` e deixar só `wayland` **reduz a superfície de ataque gráfico de forma imediata**. O app perde a capacidade de espiar outros apps e de ser espiado por eles.

```terminal
$ flatpak override --show org.gnome.Evince | grep socket
sockets=x11;wayland;
```

O Evince pede os dois. Ele funciona perfeitamente em Wayland puro. Você pode forçar só Wayland:

```terminal
$ flatpak override --user --nosocket=x11 --socket=wayland org.gnome.Evince
$ flatpak override --show org.gnome.Evince | grep socket
sockets=!x11;wayland;
```

O `!x11` indica que o X11 foi negado. Agora o app só tem acesso ao servidor Wayland — e, por consequência, não pode bisbilhotar outros clientes XWayland nem ser bisbilhotado por eles.

Para confirmar que a migração pegou e que o app de fato subiu no Wayland, você pode checar a conexão do processo depois de abri-lo:

```terminal
$ flatpak run org.gnome.Evince &
$ flatpak ps | grep evince
 2143  org.gnome.Evince
$ cat /proc/2143/environ | tr '\0' '\n' | grep -E 'XDG_SESSION_TYPE|WAYLAND_DISPLAY'
XDG_SESSION_TYPE=wayland
WAYLAND_DISPLAY=wayland-0
```

A presença de `XDG_SESSION_TYPE=wayland` e de `WAYLAND_DISPLAY=wayland-0` confirma que o processo está conversando com o compositor Wayland, não com um XWayland. É a prova observável de que o soquete `x11` negado não fez falta.

## O fallback-x11 e o XWayland

Muitos pacotes Flatpak vêm com `fallback-x11` em vez de `x11` puro. A diferença é sutil:

- `x11`: o app tem acesso direto ao soquete X11, seja Xorg puro ou XWayland.
- `fallback-x11`: o Flatpak tenta Wayland primeiro; se o compositor não oferecer Wayland (cenário raro no SteamOS), aí sim ele cai para X11.

No SteamOS, `fallback-x11` é praticamente equivalente a `x11` — porque o compositor Gamescope sempre oferece Wayland, mas o app ainda teria o socket X11 como plano B, e a presença do socket em si já habilita as primitivas de espionagem.

A decisão de auditar, portanto, é a mesma: você quer que o app tenha acesso a X11 ou não? Se não, negue também o fallback — o Flatseal exibe ambas as chaves como toggles separados.

## Forçando Wayland no Flatseal

Na seção **Sockets** do Flatseal, os toggles `Wayland windowing system`, `X11 windowing system` e `Fallback to X11 windowing system` controlam esses três soquetes. O fluxo de endurecimento é:

1. Para cada app, desligue `X11 windowing system` e `Fallback to X11`.
2. Deixe `Wayland windowing system` ligado.
3. Teste o app. Se ele não abrir ou tiver problemas de renderização, pode ser que ainda precise de XWayland — nesse caso reative o `fallback-x11` como compromisso temporário.

Apps baseados em Electron, Chromium, Firefox e a maioria dos apps GTK4 ou Qt6 funcionam perfeitamente em Wayland puro. Apps mais antigos (GIMP 2.x, Audacity, alguns jogos indie) podem precisar de XWayland.

:::dica
Para apps que precisam de XWayland mas não precisam de acesso ao resto do X11, você pode negar o `x11` bruto e manter só o `fallback-x11`. A diferença prática é pequena, mas sinaliza ao Flatpak que o caminho preferido é Wayland.
:::

## O Portal XDG como ponte segura

Remover soquetes brilha como estratégia, mas deixa uma pergunta: como o app acessa arquivos, imprime ou captura a tela sem permissões brutas? A resposta é o **Portal XDG**.

Portais são uma camada de APIs padronizadas que o Flatpak (e o Snap) suportam. Em vez de dar ao app acesso ao filesystem inteiro, você o deixa pedir um arquivo específico através de um **file chooser portal**. O seletor de arquivos que aparece na tela é renderizado pelo sistema, fora do sandbox, e o app só recebe de volta o arquivo que você escolheu — não a pasta inteira.

O mesmo vale para:

- **ScreenCast portal** — compartilhamento de tela (você autoriza janela por janela).
- **RemoteDesktop portal** — acesso remoto.
- **Print portal** — impressão sem acesso direto ao CUPS.
- **Notification portal** — notificações sem acesso ao D-Bus de notificações.

O Flatseal não controla portais diretamente (eles fazem parte do comportamento do app, não da configuração), mas entender que os portais substituem permissões brutas ajuda a tomar decisões melhores. Um app que usa o file chooser portal **não** precisa de `filesystems=home`. Um app que usa o ScreenCast portal **não** precisa de acesso bruto ao framebuffer ou ao PipeWire.

:::info
Os portais são implementados pelo pacote `xdg-desktop-portal` e pelo backend específico (no SteamOS, `xdg-desktop-portal-gtk` para apps GTK e `xdg-desktop-portal-kde` para dependências do KDE/Plasma). Você pode verificar se estão rodando com `systemctl --user status xdg-desktop-portal`.
:::

## O fluxo completo: socket gráfico ideal

O que você quer alcançar para cada app:

1. Se o app funciona em Wayland puro: `--socket=wayland`, `--nosocket=x11`, `--nosocket=fallback-x11`.
2. Se o app precisa de XWayland: `--socket=wayland`, `--nosocket=x11`, `--socket=fallback-x11`.
3. Se o app é legado e só funciona em X11: `--socket=x11` (e aceite o risco).

No Flatseal, isso se traduz em três toggles. Em segundos você audita todo app instalado com essa lógica.

## Resumo

- O X11 é arquiteturalmente inseguro para isolamento: qualquer cliente pode espiar entrada, tela e eventos de outro.
- O Wayland isola cada cliente: um app só recebe seus próprios eventos.
- `x11` dá acesso direto; `fallback-x11` tenta Wayland primeiro e cai para X11 se necessário.
- Forçar só Wayland (`--nosocket=x11 --socket=wayland`) reduz a superfície de ataque gráfico.
- O Portal XDG substitui permissões brutas de arquivo, tela, impressão e notificações por diálogos controlados pelo sistema.
- O Flatseal exibe os três soquetes gráficos como toggles independentes na seção Sockets.

## Exercícios

1. Liste todos os seus Flatpaks e identifique quantos pedem `x11` e quantos pedem `wayland`.
2. Para um app que pede ambos, force só Wayland com `flatpak override --user --nosocket=x11 --nosocket=fallback-x11 --socket=wayland <id>`. Teste se o app funciona.
3. Verifique se o `xdg-desktop-portal` está rodando com `systemctl --user status xdg-desktop-portal`. Se não estiver, inicie-o e observe no log o que muda.
4. Abra o Flatseal e, para três apps, configure os toggles de acordo com a lógica de "só Wayland" ou "Wayland + fallback". Depois confira cada um com `flatpak override --show`.
5. **Desafio.** Pesquise se seu navegador Flatpak (Firefox ou Chrome) funciona em Wayland puro no SteamOS. Tente a migração e, se o navegador ainda abrir, explique por que o Portal XDG substitui o acesso bruto ao filesystem quando você faz upload ou download de um arquivo.