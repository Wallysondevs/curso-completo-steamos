Transmitir para o celular transforma o Deck numa máquina que cabe no bolso — literalmente. O aplicativo Steam Link para Android e iOS recebe o stream e oferece três formas de jogar: com touchscreen (controles virtuais sobrepostos), com controle Bluetooth pareado no celular, ou com o próprio Deck como controle (stream de vídeo para o celular enquanto você segura o Deck nas mãos).

:::objetivos
- Instalar o Steam Link no Android ou iOS e parear com o Deck
- Configurar controles virtuais touchscreen por jogo
- Conectar controle Bluetooth ao celular para jogar sem touch
- Usar o Deck como controle enquanto assiste no celular
- Ajustar bitrate e resolução para redes móveis e Wi-Fi
:::

## Instalação e pareamento no celular

O aplicativo Steam Link está na Google Play Store (Android) e na App Store (iOS). Instale, abra e ele escaneia a rede local. O fluxo de pareamento é idêntico ao da TV: toque no nome do Deck, digite o PIN de quatro dígitos que aparece no celular usando a interface do Deck.

```terminal
## No Deck, confirmando que o Steam Link do celular está na lista de dispositivos pareados:
$ cat ~/.steam/steam/config/config.vdf | grep -A 3 "SteamLink"
"SteamLink"
{
	"paired"		"1"
	"lastConnected"		"1723834200"
}
```

O `config.vdf` mantém o registro de quais dispositivos já foram pareados e quando foi a última conexão. O timestamp `1723834200` é Unix epoch — equivale a 16 de agosto de 2025. Se um dispositivo não aparece mais, você pode removê-lo em Steam > Settings > Remote Play > Paired Devices.

## Controles touchscreen

Sem um controle físico, o Steam Link sobrepõe botões virtuais na tela do celular. O layout padrão tem analógico esquerdo, analógico direito, D-pad, quatro botões frontais (A/B/X/Y) e dois gatilhos. A experiência não é ideal para jogos de ação, mas funciona bem para RPGs, estratégia, visual novels e menus.

Você pode personalizar o layout por jogo: no aplicativo Steam Link, vá em Settings > Controller > Touch Controller Layout. Escolha entre os presets (Gamepad, Trackpad, Mouse + Keyboard) ou importe um layout da comunidade. As configurações de touch são salvas no celular, não no Deck — cada dispositivo tem seus próprios layouts.

:::dica
Para jogos que só usam mouse (point-and-click, estratégia), use o layout "Mouse + Keyboard" no Steam Link. Toques na tela viram cliques, arrastar move o cursor e dois dedos fazem scroll. Jogos como Civilization, Cities: Skylines e The Sims ficam surpreendentemente jogáveis.
:::

## Controle Bluetooth no celular

A melhor experiência de jogo móvel é com um controle físico. Qualquer controle Bluetooth compatível com Android ou iOS funciona: Xbox Wireless, DualSense, DualShock 4, Nintendo Switch Pro, 8BitDo e controles genéricos.

Pareie o controle com o celular (em Configurações > Bluetooth), não com o Deck. O Steam Link detecta o controle automaticamente e o mapeia como se fosse um controle Steam.

```terminal
## No Deck, durante o stream, verificando os dispositivos:
$ ls -l /dev/input/js* 2>/dev/null
crw-rw---- 1 root input 13, 0 Aug 16 17:22 /dev/input/js0
## O dispositivo js0 foi criado pelo stream — o controle está no celular,
## mas o Deck recebe os eventos como se o controle estivesse conectado aqui.
```

## O Deck como controle

Um modo pouco conhecido: você pode usar o Deck como controle enquanto assiste ao jogo no celular. O stream envia vídeo para o celular, mas você continua segurando o Deck e usando seus botões físicos. É útil quando você quer uma tela maior que a do Deck (um tablet, por exemplo) sem abrir mão dos controles integrados.

Para usar esse modo: inicie o stream normalmente no celular. No Deck, a tela fica espelhada (mostrando o jogo também). Os controles do Deck continuam funcionando — toque neles e o jogo responde. O celular vira uma segunda tela passiva.

## Ajustes para redes móveis

Se você fizer streaming pelo 5G ou 4G do celular (fora de casa), a banda é mais limitada e a latência é maior. Reduza o bitrate no aplicativo Steam Link:

| Tipo de rede | Bitrate recomendado | Resolução |
|---|---|---|
| Wi-Fi 5 GHz (casa) | 15–30 Mbps | 1080p |
| Wi-Fi 2.4 GHz (casa) | 5–10 Mbps | 720p |
| 5G móvel | 8–15 Mbps | 720p |
| 4G móvel | 3–8 Mbps | 480p |

```terminal
## No Deck, medindo a latência até o celular via Wi-Fi:
$ ping -c 5 192.168.1.105
PING 192.168.1.105 (192.168.1.105) 56(84) bytes of data.
64 bytes from 192.168.1.105: icmp_seq=1 ttl=64 time=3.21 ms
64 bytes from 192.168.1.105: icmp_seq=2 ttl=64 time=2.87 ms
64 bytes from 192.168.1.105: icmp_seq=3 ttl=64 time=4.12 ms
64 bytes from 192.168.1.105: icmp_seq=4 ttl=64 time=3.05 ms
64 bytes from 192.168.1.105: icmp_seq=5 ttl=64 time=2.98 ms

--- 192.168.1.105 ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4006ms
rtt min/avg/max/mdev = 2.870/3.246/4.120/0.458 ms
```

Latência de 3 ms na rede local é cenário ideal para streaming no celular. Com 4G, espere 40–80 ms; com 5G, 15–30 ms. O streaming é jogável até cerca de 60 ms de ping — acima disso, jogos de ritmo rápido (FPS, luta, ritmo) ficam frustrantes, mas RPGs e estratégia continuam perfeitamente aceitáveis.

## Resumo

- O Steam Link para Android/iOS escaneia a rede, pareia via PIN e está pronto em minutos.
- Controles touchscreen têm layouts configuráveis por jogo; o preset "Mouse + Keyboard" é ótimo para point-and-click.
- Controles Bluetooth emparelhados no celular são mapeados como controles nativos do Deck.
- O modo "Deck como controle" transmite vídeo para o celular enquanto você joga com os botões físicos do Deck.
- Em redes móveis, reduza bitrate (3–15 Mbps) e resolução (480p–720p) para compensar latência e banda.

## Exercícios

1. Instale o Steam Link no celular, pareie com o Deck e inicie um stream. Teste o layout de touch padrão em um jogo de ação e anote o que funcionou e o que não funcionou.
2. Personalize o layout de touch para um jogo de estratégia (ou point-and-click) e use o modo "Mouse + Keyboard". A precisão do toque é suficiente?
3. Conecte um controle Bluetooth ao celular e verifique, no Deck com `ls /dev/input/js*`, se ele aparece como dispositivo de entrada durante o stream.
4. Com o celular no 4G/5G (fora do Wi-Fi de casa), tente conectar ao Deck usando o Steam Link (requer port forwarding ou VPN — use o ambiente controlado que você montar). Qual a latência e a qualidade?
5. **Desafio.** Use o Deck como controle enquanto transmite para um tablet. Depois, tente o contrário: use o celular como controle (touchscreen) enquanto assiste ao jogo na tela do Deck. Qual modo é mais confortável para jogar?