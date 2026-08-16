O Steam Deck é um PC portátil poderoso, mas sua APU Zen 2 tem limites. Jogos AAA de 2024 e 2025 exigem compromissos de resolução e framerate que nem todo mundo está disposto a fazer. É aí que o cloud gaming entra: em vez de renderizar no Deck, você recebe o vídeo de uma máquina remota — um datacenter com GPUs de mesa — e devolve comandos pelo Wi-Fi. O Deck vira um terminal fino com controles integrados, e os jogos rodam em qualidade máxima sem aquecer a APU.

O capítulo cobre os dois serviços de cloud gaming que funcionam no Deck via navegador: **GeForce NOW**, da NVIDIA, e **Xbox Cloud Gaming** (xCloud), da Microsoft. Ambos rodam dentro do SteamOS sem dual boot ou Windows — você configura uma vez e acessa direto do Modo Jogo.

:::objetivos
- Entender o que é cloud gaming e por que o Deck é uma plataforma ideal para isso
- Conhecer os requisitos de assinatura, rede e conta de cada serviço
- Saber por que o caminho é o navegador, e não um app nativo
- Identificar as limitações de cada serviço no SteamOS
- Preparar o ambiente antes de instalar qualquer atalho
:::

## Por que cloud gaming faz sentido no Deck

O Deck tem uma tela de 800p (LCD) ou 800p HDR (OLED). Mesmo na resolução nativa, a APU entrega 30 a 45 FPS em títulos pesados como *Cyberpunk 2077* ou *Alan Wake 2*. Com cloud gaming, o servidor remoto roda o jogo em 1080p ou superior e envia um stream de vídeo comprimido para o Deck — que só precisa decodificar e exibir. A APU fica praticamente ociosa, a bateria dura o dobro e o calor some.

A equação é simples: você troca renderização local por latência de rede. Se o Wi-Fi for estável (5 GHz, roteador próximo), a latência adicional fica entre 15 e 40 ms — imperceptível para a maioria dos gêneros e aceitável até para shooters competitivos, dependendo da sua sensibilidade.

```terminal
$ sensors | grep -i temp
iwlwifi_1-virtual-0:  temp1:        +38.0°C
nvme-pci-0400:        Composite:    +35.9°C
amdgpu-pci-0400:      edge:         +41.0°C
acpitz-acpi-0:        temp1:        +40.0°C
```

A diferença térmica é drástica: enquanto um jogo nativo empurra a APU para 75–85 °C, o streaming mantém tudo abaixo de 45 °C. A ventoinha, que em carga máxima chega a 7000 RPM audível, permanece em 2000 RPM — essencial para jogar na cama sem incomodar.

## O que cada serviço oferece

**GeForce NOW** é uma ponte entre você e GPUs NVIDIA em datacenters. Ele não vende jogos — você conecta sua conta Steam, Epic, Ubisoft ou GOG e joga os títulos que já comprou, desde que estejam no catálogo suportado. O plano gratuito oferece sessões de 1 hora com fila de espera e GPUs básicas. O plano Priority (pago) sobe para 6 horas, RTX 3060 equivalente e resolução 1080p. O Ultimate entrega RTX 4080 e 4K. No Deck, 1080p já é mais que suficiente.

**Xbox Cloud Gaming** faz parte do Game Pass Ultimate. Você não compra os jogos — assina um catálogo rotativo de centenas de títulos, incluindo lançamentos do Xbox Game Studios no dia um. O stream roda em hardware Xbox Series X, a 1080p e até 60 FPS. Não há plano gratuito: o Game Pass Ultimate é a única porta de entrada.

| Serviço | Catálogo | Resolução | Plano gratuito? | Requer compra dos jogos? |
|---|---|---|---|---|
| GeForce NOW | ~2000 jogos (catálogo próprio) | até 4K (Ultimate) | Sim (1 h, fila) | Sim (Steam/Epic/etc.) |
| Xbox Cloud Gaming | ~400 jogos (Game Pass) | 1080p / 60 FPS | Não | Não (assinatura) |

## Por que o navegador, e não um app

Nenhum dos dois serviços oferece cliente nativo para Linux. A NVIDIA tem app para Windows, macOS, Android e smart TVs, mas nunca lançou para Linux — embora o backend dos servidores seja Linux. A Microsoft também restringe o app do Xbox a Windows, Android e iOS.

O caminho no SteamOS é o navegador: Chrome ou Edge, ambos disponíveis como Flatpak no Discover. O GeForce NOW funciona bem no Chrome; o xCloud é otimizado para Edge (a Microsoft usa codecs e controle de latência específicos no seu navegador). Nos dois casos, você vai criar atalhos que abrem o navegador em modo *kiosk* — sem barras de endereço, abas ou interface de navegador — e os registra como "jogos" no Steam, acessíveis pelo Modo Jogo.

```terminal
$ flatpak search chromium | grep -i -E 'chrome|edge'
Google Chrome    com.google.Chrome              127.0.6533.119  stable
Microsoft Edge   com.microsoft.Edge              127.0.2651.74  stable
$ flatpak install com.google.Chrome
$ flatpak install com.microsoft.Edge
```

:::dica
Instale os dois navegadores. O Chrome para o GeForce NOW e o Edge para o xCloud. Cada serviço é testado e otimizado contra um navegador específico, e usar o recomendado evita artefatos de vídeo, dessincronia de áudio e problemas com gamepad.
:::

## Preparando o terreno

Antes de criar os atalhos, três ajustes no Modo Desktop economizam horas de frustração. Primeiro: verifique se o Wi-Fi está na rede de 5 GHz. A banda de 2,4 GHz é saturada demais para cloud gaming.

```terminal
$ iw dev wlan0 link
Connected to 3c:37:86:0a:b1:c4 (on wlan0)
	SSID: Casa-5G
	freq: 5180
	RX: 384726191 bytes (1234567 packets)
	TX: 18273465 bytes (98765 packets)
	signal: -48 dBm
	rx bitrate: 866.7 MBit/s VHT-MCS 8 80MHz VHT-NSS 2
	tx bitrate: 780.0 MBit/s VHT-MCS 8 80MHz VHT-NSS 2
```

O campo `freq: 5180` confirma 5 GHz. Um `signal` de −48 dBm é excelente (quanto mais próximo de zero, melhor; abaixo de −70 dBm a experiência degrada). O `rx bitrate` de 866 Mbps mostra que o link físico é robusto.

Segundo: conecte um controle externo via Bluetooth se pretende jogar com o Deck dockado na TV. O controle integrado funciona perfeitamente, mas dockado você precisa de um gamepad externo.

Terceiro: no Modo Desktop, abra o Chrome e o Edge pelo menos uma vez, aceite os termos, desabilite telemetria e feche. Isso evita que a janela de "primeira execução" apareça sobre o jogo quando você abrir o atalho no Modo Jogo.

:::atencao
O SteamOS é imutável por padrão — o sistema base é somente leitura. Flatpaks instalados pelo Discover sobrevivem a atualizações do sistema, mas customizações em `/usr` são apagadas. Felizmente, tudo que este capítulo ensina usa Flatpaks e arquivos em `~/.local` ou `~/.steam`, que são preservados.
:::

## Resumo

- Cloud gaming no Deck troca renderização local por streaming de vídeo — a APU fica ociosa, a bateria dura mais e o calor diminui.
- GeForce NOW usa os jogos que você já comprou em lojas PC; Xbox Cloud Gaming é um catálogo por assinatura do Game Pass Ultimate.
- Nenhum dos dois serviços tem app Linux nativo. O caminho é Chrome (GeForce NOW) ou Edge (xCloud) como Flatpak.
- O navegador é lançado em modo kiosk e registrado como atalho no Steam, acessível pelo Modo Jogo.
- Antes de configurar, confirme que o Wi-Fi está em 5 GHz com `iw dev wlan0 link` e abra cada navegador ao menos uma vez no Modo Desktop.

## Exercícios

1. Execute `iw dev wlan0 link` e anote a frequência, o sinal (dBm) e o bitrate de recepção. Sua rede está na banda correta para cloud gaming?
2. Abra o Discover e instale o Google Chrome e o Microsoft Edge como Flatpaks. Execute cada um pelo menu Iniciar e feche.
3. Acesse `play.geforcenow.com` no Chrome. Sem fazer login, navegue pela lista de jogos suportados e verifique se pelo menos três jogos da sua biblioteca Steam estão disponíveis.
4. Acesse `xbox.com/play` no Edge e faça login com sua conta Microsoft. Se não tiver Game Pass Ultimate, a interface mostra a oferta de assinatura — observe os requisitos.
5. **Desafio.** Com um jogo nativo rodando no Deck, meça a temperatura da APU com `sensors` e estime o consumo com `cat /sys/class/power_supply/BAT1/power_now`. Depois, assista a um vídeo no YouTube em tela cheia por 10 minutos e meça de novo. Compare os valores: qual a diferença de consumo entre renderizar e decodificar vídeo?