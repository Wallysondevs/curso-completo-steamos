O Xbox Cloud Gaming chegou ao Steam Deck por um caminho que ninguém esperava em 2022: uma colaboração entre Microsoft e Valve resultou em uma página oficial — `xbox.com/play` — otimizada para o Edge no SteamOS. Diferente do GeForce NOW, que funciona razoavelmente em qualquer navegador Chromium, o xCloud entrega sua melhor experiência no Edge: codec mais eficiente, latência menor e suporte a vibração nos gatilhos. Esta seção cobre a configuração do Edge como plataforma de streaming do xCloud no Deck.

:::objetivos
- Instalar e configurar o Microsoft Edge como plataforma do xCloud no Deck
- Entender por que o Edge é o navegador recomendado para xCloud
- Configurar o agente de usuário e as flags de desempenho
- Testar o streaming com um jogo do catálogo Game Pass
- Diagnosticar problemas de áudio, controle e vídeo no xCloud
:::

## Por que Edge e não Chrome para xCloud

A Microsoft construiu o xCloud sobre a infraestrutura do Xbox Series X. O stream usa variações do codec H.264 com extensões proprietárias que o Edge decodifica melhor que o Chrome — a diferença é visível em cenas de movimento rápido, onde o Chrome mostra artefatos de blocos (macroblocking) que o Edge suaviza.

Além disso, o Edge expõe a API `navigator.getGamepads()` com menor latência de polling, e o xCloud detecta isso automaticamente. No Chrome, o polling do gamepad pode levar até 16 ms extras, o que se soma à latência de rede. Parece pouco, mas em 60 FPS cada frame dura 16,7 ms — esse atraso equivale a um frame inteiro.

```terminal
$ flatpak info com.microsoft.Edge | head -10
Microsoft Edge - Navegador da Web da Microsoft

          ID: com.microsoft.Edge
         Ref: app/com.microsoft.Edge/x86_64/stable
        Arch: x86_64
      Branch: stable
     Version: 127.0.2651.74
     License: Proprietary
      Origin: flathub
  Collection: org.flathub.Stable
Installation: system
     Options: system,current
```

O Edge está disponível no Flathub como Flatpak de primeiro escalão — mantido pela própria Microsoft e atualizado automaticamente pelo Discover junto com os demais aplicativos.

## Instalando e preparando o Edge

Abra o Discover, busque por *Microsoft Edge* e instale. Depois de instalado, abra o Edge uma vez no Modo Desktop para aceitar os termos e desabilitar telemetria. Vá em **Configurações > Privacidade, pesquisa e serviços** e desligue tudo que for opcional — quanto menos tráfego de fundo, melhor para o streaming.

Em seguida, acesse `xbox.com/play` e faça login com sua conta Microsoft vinculada ao Game Pass Ultimate. Marque **Manter sessão iniciada** — o modo kiosk não salva cookies entre sessões por padrão, e essa opção garante que o token de login persista.

```terminal
$ flatpak run com.microsoft.Edge \
  --kiosk \
  --no-first-run \
  --edge-enhanced-security=0 \
  --window-size=1280,800 \
  "https://www.xbox.com/play"
```

A flag `--edge-enhanced-security=0` desabilita o modo de segurança reforçada do Edge para o domínio do Xbox. Sem essa flag, o Edge impõe restrições a scripts de terceiros que podem quebrar o carregamento da biblioteca de jogos ou impedir a detecção do gamepad.

:::dica
Adicione `--disable-features=msEnhancedSecurityMode` como alternativa se `--edge-enhanced-security=0` não surtir efeito. As flags do Edge mudam com frequência e o Flatpak às vezes fica uma ou duas versões atrás.
:::

## O que acontece na primeira sessão

Ao acessar `xbox.com/play` no Edge, o site do Xbox Cloud Gaming carrega a biblioteca de jogos do Game Pass. A interface é idêntica à do app Xbox no Windows: grade de capas, barra de busca, filtros por gênero e a seção **Continuar jogando** com seus títulos recentes.

Selecione um jogo e clique em **Jogar**. O Edge entra em tela cheia automaticamente (o site chama a API Fullscreen), e o stream começa após 5 a 15 segundos de carregamento — o tempo que o datacenter leva para alocar uma instância de Xbox Series X e iniciar o jogo.

```terminal
$ ss -tunp | grep -i edge
tcp   ESTAB  0  0  192.168.1.101:45678  20.201.128.15:9001  users:(("msedge",pid=3245,fd=42))
udp   UNCONN 0  0  0.0.0.0:49152         0.0.0.0:*            users:(("msedge",pid=3245,fd=38))
```

A conexão TCP vai para um IP do intervalo da Microsoft Azure (AS8075). O fluxo UDP transporta o vídeo e áudio comprimidos. Se você só vir conexões TCP, o streaming está usando TCP fallback — mais confiável em redes instáveis, mas com latência maior. O ideal é que o UDP esteja presente.

## Ajustes de controle no xCloud

O Xbox Cloud Gaming tem uma vantagem sobre o GeForce NOW: o servidor é um Xbox, então os jogos esperam gamepad. Você não precisa lidar com o dilema WASD vs XInput — o gamepad do Deck é reconhecido como controle de Xbox padrão.

O template recomendado é **Gamepad padrão** (sem trackpad de mouse), porque o xCloud navega com D-pad e analógicos, não com cursor. O touchpad direito ainda pode ser configurado como mouse para os raros momentos em que a interface pede um clique — por exemplo, para fechar um pop-up de assinatura.

```terminal
$ evtest --grab /dev/input/event5 2>&1 | grep -E 'ABS|BTN'
  Event type 3 (EV_ABS)
    ABS_X
    ABS_Y
    ABS_RX
    ABS_RY
    ABS_Z
    ABS_RZ
    ABS_HAT0X
    ABS_HAT0Y
  Event type 1 (EV_KEY)
    BTN_SOUTH
    BTN_EAST
    BTN_NORTH
    BTN_WEST
    BTN_TL
    BTN_TR
    BTN_TL2
    BTN_TR2
```

Esses são os eventos ABS (eixos analógicos) e BTN (botões) que o kernel expõe para o controlador do Deck. O Edge lê esses eventos via evdev e os traduz para a Gamepad API — o mesmo caminho do Chrome, mas com menor latência de polling.

:::nota
A Microsoft implementa *Direct Capture* no Edge: o navegador lê o gamepad diretamente do dispositivo evdev, sem passar pelo escalonador de eventos do X11/Wayland. No Chrome, o caminho é indireto (X11 → Gamepad API → site), o que adiciona um frame de latência. Essa é a razão técnica para a recomendação do Edge.
:::

## Resumo

- O Xbox Cloud Gaming funciona melhor no Microsoft Edge, disponível como Flatpak no Discover.
- O Edge oferece menor latência de gamepad (Direct Capture via evdev) e melhor decodificação H.264 que o Chrome.
- Instale o Edge, faça login em `xbox.com/play` e marque **Manter sessão iniciada** para persistir o token.
- O template de controle ideal é **Gamepad padrão** — o servidor remoto é um Xbox, que espera XInput.
- A flag `--edge-enhanced-security=0` evita que o Edge bloqueie scripts do xCloud.

## Exercícios

1. Instale o Microsoft Edge via Discover, faça login em `xbox.com/play` e inicie qualquer jogo do catálogo Game Pass.
2. Execute `ss -tunp | grep -i edge` durante uma sessão de xCloud. Identifique as conexões TCP e UDP. Há tráfego UDP? Se não, repita o teste em outra rede.
3. Compare a latência de gamepad entre Chrome e Edge: no mesmo jogo, mexa o analógico e perceba o tempo até o movimento na tela. Anote sua impressão subjetiva.
4. No Edge, abra `edge://gpu` e procure por *Video Acceleration*. O decode de hardware está ativo? Qual codec está listado?
5. **Desafio.** Instale o Edge Beta ou Dev via Flatpak (`com.microsoft.EdgeDev`) e teste o xCloud. Versões diferentes do Edge podem incluir flags experimentais de rede — teste `--enable-features=UsePreferredIntervalForVideo` e documente se há diferença na fluidez.