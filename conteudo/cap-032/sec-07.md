Jogar é melhor em companhia, e boa parte da coordenação entre jogadores de Steam Deck acontece no Discord — chamadas de voz, comunidades de emulação, teams de partida. O Discord oferece um cliente oficial Linux há anos, e a versão Flatpak é a forma mais prática de mantê-lo atualizado num sistema com raiz somente leitura.

:::objetivos
- Instalar o Discord via Flathub e entender a diferença para o pacote .deb/.tar
- Configurar o push-to-talk com os botões extras do Deck
- Resolver problemas comuns de áudio do microfone no Flatpak
- Executar bots e rich presence diretamente do Deck
:::

## Instalação e peculiaridades do Flatpak

O Discord no Flathub usa o App ID `com.discordapp.Discord`:

```terminal
$ flatpak install com.discordapp.Discord
Looking for matches…
Found similar ref(s) for 'com.discordapp.Discord' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] com.discordapp.Discord                     stable          i            flathub          84,5 MB / 84,7 MB

Installation complete.
```

O Discord é uma aplicação Electron (baseada em Chromium), então o Flatpak traz um runtime próprio para ela. O tamanho aparente (~84 MB) engana: o runtime compartilhado com outros apps Electron reduz o custo real.

:::nota
Historicamente o Discord distribuía um pacote `.deb` que não funcionava bem no Arch do SteamOS (dependências desencontradas) e um `.tar.gz` que precisava de instalação manual em `/opt`. O Flatpak resolveu ambos os problemas ao empacotar tudo isolado, e é hoje o método oficial recomendado para o Deck.
:::

## Push-to-talk com os botões do Deck

No modo desktop, o Deck expõe os botões traseiros (L4, L5, R4, R5) como botões comuns de gamepad, que o KDE pode mapear como teclas. Para configurar o push-to-talk no Discord:

1. Abra Configurações do Discord → Voz e vídeo.
2. Em "Modo de entrada", escolha "Push-to-talk".
3. Em "Atalho de push-to-talk", clique em "Gravar atalho" e pressione o botão traseiro desejado.

Se os botões traseiros não dispararem como teclas, você pode instruir o Steam a mapeá-los. No modo desktop, abra o Steam, vá em Configurações → Controlador → Configuração do Desktop, e associe R4 e L4 a teclas como `F9` e `F10`. Depois use essas teclas como atalho do push-to-talk no Discord.

```terminal
$ flatpak run com.discordapp.Discord --enable-features=UseOzonePlatform
```

A flag `--enable-features=UseOzonePlatform` às vezes melhora a detecção de entrada com Wayland, útil se o Discord não capturar o teclado no Deck.

## Áudio: o calcanhar de Aquiles

O problema mais comum do Discord no Steam Deck é o microfone não ser detectado. Isso quase sempre vem do sandbox Flatpak, que não tem acesso automático ao dispositivo de captura. A solução padrão é liberar o acesso ao PulseAudio/PipeWire:

```terminal
$ flatpak override --user --socket=pulseaudio com.discordapp.Discord
$ flatpak override --user --device=all com.discordapp.Discord
```

O primeiro libera o áudio; o segundo libera os dispositivos (incluindo microfone USB). Depois reinicie o Discord:

```terminal
$ flatpak run com.discordapp.Discord
```

Se ainda assim o microfone não aparecer, verifique no KDE (Configurações do sistema → Áudio) se o dispositivo de entrada correto está selecionado como padrão. O Discord tende a usar o microfone padrão do sistema, e o Deck às vezes seleciona o microfone interno do próprio aparelho em vez do headset USB.

:::atencao
A flag `--device=all` é ampla: libera acesso a todos os dispositivos do sistema, não só o microfone. Para um aplicativo como o Discord (código fechado), prefira granularidade. Se possível, teste antes apenas `--socket=pulseaudio` e veja se o seu microfone já resolve; só adicione `--device=all` se necessário.
:::

## Rich presence e integração com a Steam

Quando você joga no Deck pelo modo desktop, o Discord exibe no seu perfil o status "Jogando <título>" graças ao rich presence — que lê a biblioteca Steam automaticamente. Não há configuração: o Discord detecta a Steam e aplica o status.

Para conferir se a integração está ativa:

```terminal
$ flatpak run com.discordapp.Discord --status:debug
```

Na prática, isso exibe logs que mencionam `detected game: <title>` quando você inicia um jogo. É uma boa ferramenta de diagnóstico quando o rich presence para de funcionar após uma atualização do Discord ou da Steam.

:::dica
Se você joga no modo jogo (fora do desktop) e quer que o Discord exiba o rich presence, mantenha o Discord aberto no desktop antes de alternar. O modo jogo suspende apps de desktop, então o rich presence só funciona quando o Discord está rodando ativamente numa sessão desktop.
:::

## Resumo

- O Discord instala com `flatpak install com.discordapp.Discord` e roda como aplicativo Electron empacotado no Flatpak.
- O push-to-talk pode usar os botões traseiros do Deck via mapeamento no Steam para teclas F (ex.: `F9`, `F10`).
- `flatpak override --socket=pulseaudio` e `--device=all` resolvem a maioria dos problemas de microfone não detectado.
- O rich presence funciona lendo a biblioteca Steam automaticamente, sem configuração extra.
- Use `--enable-features=UseOzonePlatform` para melhorar a captura de entrada em Wayland.

## Exercícios

1. Instale o Discord Flatpak, conecte sua conta e crie um servidor de teste com um canal de voz.
2. Configure o push-to-talk para uma tecla `F` e mapeie essa tecla para o botão traseiro R4 na configuração de desktop do Steam.
3. Conecte um headset USB e verifique se o microfone é detectado. Se não for, use `flatpak override --socket=pulseaudio` e reinicie.
4. Verifique o rich presence: abra um jogo leve no modo desktop e confira no seu perfil se o status "Jogando <título>" aparece.
5. **Desafio.** Configure o Discord para abrir automaticamente junto com a sessão desktop (autostart do KDE) e com a flag `--enable-features=UseOzonePlatform` pré-aplicada, validando que o app sobe já com o microfone liberado.