Instalar o Parsec no SteamOS é um exercício de convivência entre o Flatpak e o sistema imutável. O processo é simples na superfície, mas há detalhes de permissão, áudio e inicialização automática que separam uma instalação funcional de uma frustrante. Esta seção cobre o caminho completo: do Flatpak ao primeiro teste de conexão.

:::objetivos
- Instalar o Parsec via Flatpak no SteamOS
- Verificar e corrigir permissões de dispositivos (GPU, áudio, entrada)
- Configurar inicialização automática no Modo Jogo
- Testar se o Parsec está funcional antes de conectar a outro PC
:::

## Instalação via Flatpak

O Parsec está no Flathub. A instalação é direta:

```terminal
$ flatpak install flathub com.parsecgaming.parsec
Looking for matches…
com.parsecgaming.parsec permissions:
    ipc       network     pulseaudio     x11       dri       devices
    devel     multiarch   system dbus    wayland


        ID                                Branch      Op       Remote        Download
 1. [✓] com.parsecgaming.parsec.Locale    stable      i        flathub       < 1 MB
 2. [✓] com.parsecgaming.parsec           stable      i        flathub       < 60 MB

Installation complete.
```

Repare nas permissões listadas: `dri` (Direct Rendering Infrastructure) é a que permite acesso à GPU; `pulseaudio` dá acesso ao som; `devices` expõe `/dev/input` para capturar controles e teclado. Sem `dri`, o Parsec não consegue usar aceleração de hardware e cai em modo de software — latência inaceitável para jogos.

Após instalar, confirme que o binário está acessível:

```terminal
$ flatpak run com.parsecgaming.parsec --version
parsec version 150-0-0
```

## Permissões extras que o Flatpak esconde

O Flatpak isola aplicativos por padrão — isso é bom para segurança, mas pode bloquear funcionalidades que o Parsec precisa. Use o `flatpak override` para liberar acesso adicional:

```terminal
$ flatpak override --user --socket=wayland --socket=x11 --device=all com.parsecgaming.parsec
$ flatpak override --user --socket=pulseaudio com.parsecgaming.parsec
$ flatpak override --user --share=network com.parsecgaming.parsec
```

O comando `flatpak override` escreve em `~/.local/share/flatpak/overrides/com.parsecgaming.parsec`. Para verificar:

```terminal
$ flatpak override --user --show com.parsecgaming.parsec
[Context]
sockets=x11;wayland;pulseaudio;
devices=all
shared=network;
```

:::atencao
`--device=all` expõe todos os dispositivos do sistema, incluindo `/dev/input/*` (controles), `/dev/dri/*` (GPU) e `/dev/uinput` (controles virtuais). É necessário para que o Parsec capture gamepads conectados ao Deck e os encaminhe ao host. Se preferir granularidade, substitua `all` por `dri` e adicione `--device=input`.
:::

## Áudio no SteamOS: PulseAudio vs PipeWire

O SteamOS moderno (3.5+) usa PipeWire, mas o Flatpak do Parsec ainda fala PulseAudio via `pipewire-pulse`. Na prática, isso funciona, mas pode haver conflito se o pipewire-pulse não estiver rodando:

```terminal
$ pactl info | grep "Server Name"
Server Name: pulseaudio (on PipeWire 1.0.0)
```

Se o `pactl` não responder, o serviço pipewire-pulse pode estar parado. Reinicie-o com:

```terminal
$ systemctl --user restart pipewire-pulse
$ systemctl --user status pipewire-pulse
● pipewire-pulse.service - PipeWire PulseAudio
     Active: active (running) since Sat 2025-08-16 14:22:10 UTC; 2s ago
```

Com o PipeWire operando, o Parsec consegue capturar e reproduzir áudio bidirecionalmente.

## Inicialização automática no Modo Jogo

Para que o Parsec esteja disponível sem sair do Modo Jogo, você precisa que ele apareça como atalho na interface Gaming. O Flatpak cria automaticamente uma entrada `.desktop`, mas é bom verificar:

```terminal
$ ls ~/.local/share/applications/ | grep parsec
com.parsecgaming.parsec.desktop
$ cat ~/.local/share/applications/com.parsecgaming.parsec.desktop | grep -E '^Name=|^Exec='
Name=Parsec
Exec=/usr/bin/flatpak run --branch=stable --arch=x86_64 --command=parsec com.parsecgaming.parsec
```

Para adicionar ao Steam como atalho não-Steam (visível no Modo Jogo):

```terminal
$ steam steam://addnonsteamgame/$(echo ~/.local/share/applications/com.parsecgaming.parsec.desktop)
```

Alternativamente, use o script `add-steam-game.sh` embutido em alguns helpers da comunidade. O importante é que, uma vez adicionado, o Parsec aparece na biblioteca do Modo Jogo como qualquer outro título.

## Iniciando o Parsec como host em background

Se você quer que o Deck **transmita** jogos (modo host) e não apenas receba, precisa iniciar o Parsec com o modo host ativo. O Flatpak não expõe isso diretamente; você precisa do pacote `parsec-linux` nativo ou de um container. Para o caso mais comum — Deck como **cliente** recebendo stream de um PC — a instalação Flatpak é suficiente.

Para host Linux (experimental), o `parsec-linux` oficial é distribuído como `.deb` e `.tar.gz`. Em sistemas Arch (base do SteamOS), a comunidade mantém no AUR — mas isso exige desbloquear a raiz (`steamos-readonly disable`), o que foge do escopo deste livro. A recomendação é: **use o Deck como cliente Parsec e mantenha o host em Windows ou Linux desktop tradicional**.

## Teste rápido de funcionamento

Antes de tentar conectar a outro PC, abra o Parsec no Desktop Mode e confirme que a interface carrega sem erros:

```terminal
$ flatpak run com.parsecgaming.parsec &
```

Se a janela abrir, mostrar o logo do Parsec e pedir login, a instalação está correta. Feche e prossiga para a configuração do host.

**Em resumo:** o Parsec no SteamOS é um Flatpak que exige permissões explícitas para GPU, áudio e dispositivos de entrada. A receita é `flatpak install` + `flatpak override` + verificação do PipeWire. Com o atalho no Modo Jogo, o Parsec fica a um botão de distância.

## Exercícios

1. Instale o Parsec via Flatpak e execute `flatpak override --show` para verificar as permissões. Se `dri` não estiver listado, adicione-o.
2. Verifique o status do PipeWire com `pactl info`. O campo `Server Name` menciona PipeWire?
3. Adicione o Parsec à biblioteca Steam como jogo não-Steam e confirme que o atalho aparece no Modo Jogo.
4. Abra o Parsec no Desktop Mode e faça login com sua conta. Anote o `peer_id` que aparece no canto inferior da janela principal.
5. **Desafio.** O Parsec Linux host é beta. Leia a documentação oficial em `https://parsec.app/docs` e liste três limitações conhecidas do host Linux em comparação com o host Windows.