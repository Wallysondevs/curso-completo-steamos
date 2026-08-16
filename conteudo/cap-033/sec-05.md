O Discord é o mensageiro padrão da comunidade gamer: servidores de clã, canais de voz durante a partida, transmissão de tela ao vivo. No Deck, ele funciona como Flatpak, mas com uma ressalva importante: a permissão de áudio não é concedida automaticamente. O microfone e o alto-falante do Deck não aparecem para o Discord a menos que o Flatpak tenha acesso explícito ao PulseAudio — e essa permissão se configura no Flatseal, não no aplicativo.

:::objetivos
- Instalar e lançar o Discord com áudio funcional no Deck
- Diagnosticar por que o microfone não capta no primeiro uso
- Configurar push-to-talk com o teclado virtual do Deck
- Entender as limitações do Discord Flatpak em relação ao cliente nativo
:::

## Instalação e o primeiro silêncio

O Discord está no Flathub e é um dos Flatpaks mais baixados:

```terminal
$ flatpak install com.discordapp.Discord
Looking for matches…
Found ref ‘app/com.discordapp.Discord/x86_64/stable’ in remote ‘flathub’ (system).
Do you want to install it? [Y/n]: Y
Installing… done
$ flatpak run com.discordapp.Discord
```

O aplicativo abre normalmente, você faz login e o teclado virtual do Deck aparece quando precisa digitar. Mas ao entrar num canal de voz, silêncio: você ouve os outros, mas ninguém te escuta. O microfone parece mudo.

O problema está nas permissões de sandbox:

```terminal
$ flatpak info --show-permissions com.discordapp.Discord | grep audio
sockets=x11;wayland;pulseaudio;
```

A linha `pulseaudio` está lá. O Discord pediu o socket, mas no SteamOS o PulseAudio é emulado pelo PipeWire, e o Flatpak nem sempre encaminha o dispositivo de captura correto. O resultado é que o Discord vê uma fonte de áudio fantasma, sem sinal.

Para confirmar o que o PipeWire está expondo dentro da sandbox, você pode inspecionar os dispositivos de captura que o Discord enxerga:

```terminal
$ flatpak run --command=sh com.discordapp.Discord -c \
  'pactl list short sources'
0  alsa_output.pci-0000_00_1f.3.analog-stereo.monitor  PipeWire  s16le 2ch 48000Hz  SUSPENDED
1  alsa_input.pci-0000_00_1f.3.analog-stereo  PipeWire  s16le 2ch 48000Hz  SUSPENDED
```

A fonte `alsa_input` é o microfone embutido do Deck (que, em muitos modelos, é de baixa qualidade ou nem existe fisicamente). Se a sua webcam USB ou headset Bluetooth não aparecerem nessa lista, o problema é de roteamento do PipeWire, não do Discord em si.

## Corrigindo o áudio com Flatseal

O caminho é abrir o Flatseal, selecionar o Discord na lista e verificar duas coisas:

- **Socket PulseAudio**: deve estar ligado. Se estiver desligado, ligue.
- **Dispositivos**: adicione `/dev/snd` na seção "System files" se o microfone for USB.

Depois de salvar, reinicie o Discord. Agora, nas configurações de Voz e Vídeo, o dispositivo de entrada deve aparecer como `default` ou `pipewire`. Selecione e faça o teste de microfone.

Em linha de comando, você pode lançar o Discord com o socket explicitamente:

```terminal
$ flatpak run --socket=pulseaudio com.discordapp.Discord
```

:::atencao
Se você estiver usando fones Bluetooth, o PipeWire pode criar um dispositivo de entrada separado para o microfone do headset. No Discord, o dispositivo "default" às vezes aponta para o microfone embutido do Deck, não para o Bluetooth. Vá em Settings → Voice & Video → Input Device e troque manualmente.
:::

## Push-to-talk no Deck

No desktop, push-to-talk é uma tecla do teclado físico. No Deck, com o controle em mãos, a solução é mapear um botão traseiro (L4, L5, R4, R5) como atalho de teclado. O Discord reconhece qualquer combinação registrada.

Nas configurações do Discord, aba Keybinds, adicione um novo atalho: ação "Push to Talk (Normal)" e tecla `Shift+F13`. O `F13` é uma tecla que não existe em teclado nenhum — e é exatamente por isso que ela é perfeita para ser mapeada no controle. Depois, no Steam Input, mapeie o botão traseiro como `Shift+F13`.

```terminal
$ flatpak run --socket=pulseaudio --command=sh com.discordapp.Discord -c \
  'echo "Keybind mapeado: Shift+F13 = L4 traseiro"'
```

## Limitações do Flatpak

O Discord Flatpak não captura a tela inteira no modo jogo: a função "Go Live" tenta acessar o compositor do KDE via PipeWire, mas a captura de jogos rodando em tela cheia (modo Gaming) falha porque o Gamescope — o compositor da Valve — não expõe uma porta de captura compatível com o portal do Flatpak.

Isso significa que, se você quiser transmitir jogo ao vivo para um canal, precisa fazer pelo modo desktop com o jogo em janela, ou usar o streaming nativo do Steam (que não depende do Discord). O chat de texto e os canais de voz, porém, funcionam perfeitamente.

:::info
A versão web do Discord (`discord.com/app`) funciona no Firefox ou Chrome e resolve a captura de tela dentro do navegador, mas com latência de áudio maior. Para conversa durante o jogo, o Flatpak ganha. Para streaming, o navegador ganha.
:::

## Resumo

- O Discord Flatpak pede acesso ao PulseAudio, mas no SteamOS o roteamento do microfone falha por padrão.
- Flatseal resolve: ligue o socket PulseAudio e adicione `/dev/snd` aos "System files".
- A flag `--socket=pulseaudio` no comando `flatpak run` garante o áudio via terminal.
- Push-to-talk pode ser mapeado para botões traseiros do Deck via Steam Input.
- A transmissão de tela de jogos falha por incompatibilidade entre Discord Flatpak e Gamescope; use o streaming do Steam nesse caso.

## Exercícios

1. Instale o Discord e entre em um canal de voz. O microfone funciona? Se não, diagnostique com `flatpak info --show-permissions`.
2. Abra o Flatseal, adicione `--socket=pulseaudio` ao Discord e teste novamente. Anote as diferenças.
3. Mapeie o botão L4 do Deck como push-to-talk no Discord, usando `Shift+F13` como tecla virtual.
4. Teste o Discord web no Firefox e compare a latência de áudio com a do Flatpak em uma chamada.
5. **Desafio.** Configure um servidor Discord no Deck: instale um bot simples (ex.: Red Discord Bot) dentro de um container Flatpak separado e faça-o responder a um comando no chat.