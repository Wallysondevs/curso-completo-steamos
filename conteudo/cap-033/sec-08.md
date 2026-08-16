Se as seções anteriores deixaram uma impressão, é esta: metade dos problemas com Discord, Zoom e navegador no Deck não é bug do aplicativo, é permissão da sandbox. O Flatseal é a ferramenta que expõe essas permissões de forma gráfica e deixa você abrir ou fechar o acesso de cada Flatpak a rede, áudio, webcam e arquivos. Esta é a seção que transforma "o microfone não funciona" em "eu sei exatamente qual botão ativar".

:::objetivos
- Instalar o Flatseal e entender a grade de permissões de cada Flatpak
- Conceder e revogar acesso a mic, webcam e rede por aplicativo
- Interpretar as permissões via linha de comando, sem abrir o Flatseal
- Aplicar permissões de forma reproduzível com `flatpak override`
:::

## Instalando o Flatseal

O Flatseal é ele mesmo um Flatpak, então o processo é familiar:

```terminal
$ flatpak install com.github.tchx84.Flatseal
Looking for matches…
Found ref ‘app/com.github.tchx84.Flatseal/x86_64/stable’ in remote ‘flathub’ (system).
Do you want to install it? [Y/n]: Y
Installing… done
$ flatpak run com.github.tchx84.Flatseal
```

A interface mostra uma lista de Flatpaks instalados à esquerda e, à direita, uma grade de interruptores agrupados em categorias: **Filesystem**, **Network**, **Devices**, **Sockets** e **Session Bus**. Cada interruptor corresponde a uma permissão que, por baixo do pano, vira uma opção do comando `flatpak override`.

## A grade de permissões explicada

O que cada grupo controla, no contexto dos aplicativos deste capítulo:

| Grupo | O que liga | Exemplo de uso no Deck |
|---|---|---|
| Network | Acesso à internet | Quase todo Flatpak precisa; desligar corta a rede do app |
| Socket ×11 / Wayland | Exibir janelas | Necessário para navegador e mensageiros |
| Socket PulseAudio | Microfone e alto-falante | Discord, Zoom, Telegram com voz |
| Devices | `/dev/video*`, `/dev/snd` | Câmera e placa de som |
| Filesystem | Pastas que o app lê | `~/Downloads`, `~/Documents` |

O equívoco mais comum é achar que "Socket PulseAudio" é opcional. Para qualquer aplicativo que usa microfone ou reproduz som, desligar esse socket silencia tudo. É a primeira coisa a checar quando "não tem áudio".

:::atencao
O Flatseal edita as permissões do seu Flatpak **imediatamente**, mas aplicativos já em execução só absorvem a mudança após reiniciados. Se você ligar o PulseAudio no Discord com o Discord aberto, precisa fechar e reabrir o Discord para valer.
:::

## Conferindo sem sair do terminal

Nem sempre você quer abrir uma interface gráfica. O `flatpak info --show-permissions` mostra o estado atual:

```terminal
$ flatpak info --show-permissions com.discordapp.Discord

[Context]
shared=network;ipc;

[Sockets]
x11;wayland;pulseaudio;

[File System]
xdg-download:rw
home:ro
```

A seção `[Sockets]` lista `pulseaudio`, o que significa que o Discord tem o socket de som liberado. Se a saída não trouxer `pulseaudio`, você pode garantir via linha de comando:

```terminal
$ flatpak override --socket=pulseaudio com.discordapp.Discord
$ flatpak override --device=all com.discordapp.Discord
```

O primeiro comando libera o áudio; o segundo libera todos os dispositivos (câmera, placa de som). Prefira `--device=all` apenas quando necessário — ele abre mais do que o mínimo.

## Revogando para fechar a porta

O mesmo comando que libera também fecha. Se você quer que um navegador não acesse a câmera de jeito nenhum:

```terminal
$ flatpak override --nofilesystem=home --nosocket=pulseaudio org.mozilla.firefox
```

A semântica dos prefixos é confusa de propósito para quem não lê: `--socket=...` adiciona, `--nosocket=...` remove. O mesmo vale para filesystem (`--filesystem=` vs `--nofilesystem=`) e device. Para listar todas as permissões que você já sobrescreveu manualmente:

```terminal
$ flatpak override --show org.mozilla.firefox
[Context]
[Session Bus Policy]
[Environment]
[File System]
[Socket]
[Device]
```

Se a saída vier vazia, significa que você nunca tocou nas permissões — o Firefox está com os valores de fábrica definidos pelo pacote.

:::dica
O Flatseal e o `flatpak override` escrevem no mesmo lugar: `~/.local/share/flatpak/overrides/`. Se você quiser fazer backup das suas permissões ou transferi-las para outro Deck, copie esse diretório. Um `diff` entre dois Decks mostra exatamente o que difere entre as configurações.
:::

## O caso completo: câmera + microfone + rede

Juntando tudo, a receita para um aplicativo de videoconferência funcionar no Deck tem três permissões mínimas:

```terminal
$ flatpak override --socket=pulseaudio us.zoom.Zoom
$ flatpak override --device=all us.zoom.Zoom
$ flatpak override --share=network us.zoom.Zoom
```

Áudio (PulseAudio), vídeo (device) e internet (network). Se qualquer uma das três faltar, a reunião falha de um jeito diferente: sem `pulseaudio` não há som; sem `device` não há câmera; sem `network` não há conexão. Diagnosticar por sintoma é rápido quando você sabe qual permissão controla qual recurso.

## Resumo

- O Flatseal é uma interface gráfica sobre o `flatpak override`, que persiste permissões em `~/.local/share/flatpak/overrides/`.
- "Socket PulseAudio" controla microfone e alto-falante; é o primeiro suspeito quando não há áudio.
- `--device=all` libera câmera e placa de som, mas com mais acesso que o mínimo necessário.
- Mudanças de permissão só valem para aplicativos reiniciados depois da alteração.
- O trio mínimo para videoconferência é `pulseaudio` + `device` + `network`.

## Exercícios

1. Instale o Flatseal e localize na grade as permissões do Discord. Quais estão ligadas e quais desligadas?
2. Execute `flatpak override --socket=pulseaudio com.discordapp.Discord` e confirme com `flatpak info --show-permissions`.
3. Revogue o acesso de rede de um navegador com `flatpak override --no-share=network` e tente abrir um site. Depois religue.
4. Liste o conteúdo de `~/.local/share/flatpak/overrides/` e explique o que cada arquivo representa.
5. **Desafio.** Configure as permissões mínimas do Zoom (áudio, vídeo, rede) apenas via `flatpak override`, sem abrir o Flatseal, e documente cada comando. Depois compare com o que o Flatseal mostra.