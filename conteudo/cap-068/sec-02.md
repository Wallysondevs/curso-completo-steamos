Antes de transmitir para qualquer dispositivo, o Deck precisa estar configurado para aceitar streams — e a interface gráfica do Steam esconde algumas decisões importantes que afetam qualidade, latência e compatibilidade. Ajustar resolução, bitrate, codec e permissões de rede antes da primeira transmissão evita a frustração de um stream travando ou com imagem pixelada.

:::objetivos
- Habilitar o Remote Play nas configurações do Steam no Deck
- Ajustar resolução máxima, bitrate e preferência de codec
- Entender as opções de hardware encoding e NVFBC
- Configurar permissões de streaming por conta Steam
- Verificar as configurações persistidas no `streaming_settings.vdf`
:::

## Ligando o Remote Play no Deck

A opção principal está enterrada nas configurações do Steam. Do modo Gaming: botão Steam, Settings, Remote Play. A chave "Enable Remote Play" precisa estar ativada — e por padrão já vem ligada. O que nem todo mundo nota é que há três subchaves importantes logo abaixo:

**Pairing.** Quando ativado, permite que novos dispositivos na mesma rede encontrem o Deck automaticamente. É o que faz o aplicativo Steam Link no celular ou o cliente Steam no PC exibirem o Deck como opção de servidor sem que você precise digitar um código. Se você desmarcar, só dispositivos já pareados conseguem conectar.

**Broadcasting.** Controla se o Deck aparece na rede local como disponível para streaming. É um anúncio UDP multicast que o cliente recebe. Desligue se estiver em rede compartilhada e quiser privacidade.

**Hardware Encoding.** No Deck, esta opção usa o encoder da APU AMD via VA-API. Deixar ligado é essencial — desligar joga a codificação para a CPU, o que aumenta a latência e reduz a qualidade. Só desligue para depuração.

```terminal
$ cat ~/.steam/steam/config/streaming_settings.vdf
"system"
{
	"server"
	{
		"enableHardwareEncoding"		"1"
		"enableTrafficPriority"			"1"
		"enableStreaming"			"1"
	}
	"client"
	{
		"bitrate"		"15000"
		"desiredResolution"	"2"
		"preferredCodec"	"2"
		"enableHardwareDecoding"	"1"
		"enablePerformanceOverlay"	"0"
	}
}
```

O arquivo `streaming_settings.vdf` mostra as mesmas opções que a interface gráfica. O `bitrate` está em kbps (15000 = 15 Mbps). `desiredResolution` `2` corresponde a 1080p (`0` = 480p, `1` = 720p, `2` = 1080p, `3` = 4K). `preferredCodec` `2` indica HEVC; `1` seria H.264.

## Bitrate, resolução e o que sua rede aguenta

O bitrate define quantos bits por segundo o Deck envia para o cliente. Quanto maior, mais nítida a imagem — mas também mais exigente com a rede. A tabela de referência para streaming local:

| Bitrate (Mbps) | Resolução | Qualidade visual | Exigência de rede |
|---|---|---|---|
| 5 – 8 | 720p | Aceitável, leve artefato em movimento | 2.4 GHz razoável |
| 10 – 15 | 1080p | Boa, raros artefatos | 5 GHz estável |
| 20 – 30 | 1080p@60 | Excelente, sem artefatos visíveis | 5 GHz forte, canal limpo |
| 40 – 75 | 4K | Máxima fidelidade | 5 GHz excelente ou Ethernet |

O Deck, com sua tela nativa de 1280x800, raramente precisa transmitir acima de 1080p. Forçar 4K num jogo que roda a 800p só consome banda sem melhorar a imagem. A recomendação prática: deixe a resolução em "Automático" e o bitrate em "Automático" na primeira tentativa, depois ajuste manualmente se houver problemas.

```terminal
$ iw dev wlan0 link
Connected to 3c:37:86:0a:b1:c4 (on wlan0)
	SSID: casa-5g
	freq: 5180
	RX: 120987654 bytes (809432 packets)
	TX: 45678901 bytes (234567 packets)
	signal: -58 dBm
	rx bitrate: 866.7 MBit/s VHT-MCS 9 80MHz short GI
	tx bitrate: 780.0 MBit/s VHT-MCS 8 80MHz short GI
```

Aqui o Deck está conectado a uma rede 5 GHz (freq 5180 MHz), com sinal excelente (-58 dBm) e taxa de transmissão de 780 Mbps. Essa é uma rede pronta para streaming de 1080p@60 sem engasgos. Se o sinal estiver abaixo de -70 dBm ou a frequência for 2.4 GHz (freq 2412–2484), a experiência de streaming vai sofrer.

## Codec: H.264 ou HEVC

O Deck suporta dois codecs de vídeo para streaming, e a escolha afeta qualidade, latência e compatibilidade:

**H.264 (AVC).** Suportado por praticamente todo dispositivo dos últimos 15 anos. Mais rápido para codificar e decodificar, resultando em latência menor. O custo: para a mesma qualidade visual, precisa de quase o dobro do bitrate do HEVC.

**HEVC (H.265).** Comprime melhor — mesma qualidade com metade do bitrate. A contrapartida: a codificação é mais pesada, a decodificação exige hardware mais recente e alguns dispositivos (smart TVs antigas, Raspberry Pi 3) não têm suporte.

Para ver exatamente quais codecs o Deck oferece via hardware, o `vainfo` lista os perfis suportados pelo encoder da APU:

```terminal
$ vainfo | grep -A 1 "VAProfileH"
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain10             : VAEntrypointVLD
```

As entradas `VAEntrypointVLD` indicam suporte a decodificação via hardware (VLD = Variable Length Decoding). Para streaming, o que importa é o encoder — e o Deck expõe o encoder via API `radeonsi`, que o Steam acessa diretamente, sem passar pelo `vainfo` de forma visível. O importante é que ambos os codecs estão lá, e o Steam sabe usá-los.

:::dica
Para streaming local em rede 5 GHz com sinal forte, HEVC é a melhor escolha: qualidade superior com menor uso de banda. Para streaming fora de casa (internet) ou dispositivos mais antigos, H.264 é mais seguro — a compatibilidade universal evita surpresas.
:::

## Resumo

- O Remote Play é habilitado em Steam > Settings > Remote Play; as três subchaves críticas são Pairing, Broadcasting e Hardware Encoding.
- O arquivo `streaming_settings.vdf` guarda bitrate (kbps), resolução e codec preferido; editável manualmente, mas prefira a interface.
- Bitrates típicos: 10–15 Mbps para 1080p, 20–30 Mbps para 1080p@60; acima de 30 Mbps só para 4K.
- Rede 5 GHz com sinal acima de -65 dBm é o piso para streaming de qualidade; 2.4 GHz serve como fallback para 720p.
- H.264 privilegia compatibilidade e latência; HEVC privilegia qualidade por bit — escolha conforme o cliente e a rede.

## Exercícios

1. No Deck, abra Settings > Remote Play e verifique se todas as opções de streaming estão habilitadas. Depois, leia `~/.steam/steam/config/streaming_settings.vdf` e compare com o que aparece na interface.
2. Execute `iw dev wlan0 link` e anote frequência, sinal (dBm) e tx bitrate. Sua rede atual é adequada para streaming 1080p@60?
3. Altere manualmente o bitrate máximo no Steam para 10 Mbps e inicie um stream. Depois altere para 30 Mbps e compare visualmente. Há diferença perceptível no seu cenário?
4. Descubra se seu dispositivo cliente (TV, celular ou PC) suporta HEVC: no Android/iOS, procure nas especificações do aparelho; no PC Linux, execute `vainfo` e procure `HEVC`.
5. **Desafio.** Edite o `streaming_settings.vdf` diretamente (com o Steam fechado) para forçar `preferredCodec` para H.264 e `bitrate` para 8000. Abra o Steam e veja se as mudanças foram preservadas. Depois restaure os valores originais pela interface. Isso mostra como o Steam lida com edições manuais do VDF.