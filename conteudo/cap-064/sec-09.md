O Steam Remote Play é a solução nativa, mas não é a única. Existem alternativas de código aberto que eliminam as restrições da Valve — como a exigência de internet para streaming local — e trazem recursos extras como codecs mais modernos, compatibilidade com placas não-Steam e streaming entre plataformas diferentes. Esta seção explora o ecossistema ao redor do Remote Play, com foco em Moonlight+Sunshine e Chiaki, e como essas ferramentas se integram ao Steam Deck.

:::objetivos
- Avaliar as limitações do Remote Play que as alternativas resolvem
- Instalar e configurar Sunshine no PC e Moonlight no Deck
- Comparar Moonlight/Sunshine com Remote Play em latência, qualidade e funcionalidades
- Conhecer o Chiaki e o streaming do PlayStation 5 para o Deck
- Integrar jogos não-Steam e jogos de outras lojas no ecossistema de streaming do Deck
:::

## Por que alternativas existem

O Remote Play atende bem o caso "jogo da biblioteca Steam no Deck", mas deixa buracos importantes:

- **Jogos fora da Steam** — GOG, Epic, Game Pass, emuladores. Você pode adicioná-los como atalhos não-Steam, mas a experiência de streaming é inconsistente.
- **Dependência de internet** — o Remote Play exige autenticação nos servidores Valve; sem internet, não conecta nem em LAN.
- **Códecs e customização** — o Steam usa H.264 (com HEVC experimental); o Moonlight/Sunshine suporta H.265, HEVC 10-bit e AV1.
- **Multi-plataforma** — hospedar no Windows e jogar no Steam Deck é fácil. Mas e se o hospedeiro é Linux e você quer jogar num tablet Android?

A solução consolidada da comunidade é a dupla **Sunshine** (servidor, código aberto) + **Moonlight** (cliente), que implementa o protocolo NVIDIA GameStream com retroengenharia limpa — sem depender de drivers NVIDIA.

```terminal
$ flatpak search moonlight
Moonlight	com.moonlight_stream.Moonlight
$ flatpak search sunshine
No matches found
```

No Steam Deck, o Moonlight está no Flathub (instalável via Discover). O Sunshine (servidor) não está no Flathub — instala-se diretamente no PC hospedeiro (Windows, Linux ou macOS). Para o Deck como **cliente**, o Moonlight é tudo que você precisa.

## Sunshine: o PC como servidor universal

Sunshine substitui o NVIDIA GameStream com um servidor de streaming aberto que fala o mesmo protocolo do Moonlight. A instalação no PC hospedeiro:

**Windows:** baixar o instalador de [github.com/LizardByte/Sunshine](https://github.com/LizardByte/Sunshine). O Sunshine roda como serviço de sistema e expõe uma interface web local em `https://localhost:47990` para configurar.

**Linux (PC hospedeiro que não é o Deck):** instalar via pacote nativo ou AppImage:

```terminal
$ sunshine --help
Usage: sunshine [options] config_directory
Sunshine is a self-hosted game stream host.
Options:
  -v, --version  Show version
  -h, --help     Show this help
```

Após instalar, a interface web (`localhost:47990`) permite adicionar aplicativos — o Sunshine detecta automaticamente jogos Steam, mas você pode adicionar manualmente a GOG Galaxy, Epic Games Launcher, emuladores ou qualquer `.exe`/`.desktop`.

:::info
O Sunshine usa os mesmos codificadores de hardware que o Steam: NVENC/NVFBC na NVIDIA, AMF/VCE na AMD, Quick Sync na Intel. A diferença é que ele expõe mais opções de tuning: perfil de codificação (P1 a P7), força de quantização, taxa de quadros fixa e até HDR em HEVC 10-bit — recurso que o Remote Play não oferece na versão atual do SteamOS.
:::

## Moonlight no Steam Deck

Com o Sunshine rodando no PC, instalar o Moonlight no Deck é um `flatpak install`:

```terminal
$ flatpak install flathub com.moonlight_stream.Moonlight
$ flatpak run com.moonlight_stream.Moonlight
```

Na primeira execução, o Moonlight escaneia a rede local e encontra o servidor Sunshine automaticamente (via mDNS). Se não encontrar, adicione o IP manualmente. O pareamento exige um PIN de 4 dígitos exibido no Sunshine (interface web), similar ao pareamento do Remote Play.

:::dica
Adicione o Moonlight como atalho não-Steam no modo de jogo do Deck para iniciá-lo sem sair do gamescope. Vá em **Adicionar jogo → Adicionar um programa não-Steam**, selecione o Moonlight na lista de flatpaks, e renomeie para "Moonlight Streaming". Com ele rodando, você tem uma "biblioteca paralela" de jogos não-Steam acessível com dois toques.
:::

O Moonlight suporta resolução de até 4K e 120 fps (dependendo do servidor), mas os parâmetros relevantes para o Deck são:

- **Resolução:** 1280×800 (tela nativa do Deck).
- **FPS:** 60 ou 90 (este último só no OLED).
- **Bitrate:** 20-40 Mbit/s em H.265, 30-60 Mbit/s em H.264.
- **Codec:** HEVC (H.265) é o padrão recomendado; AV1 se o servidor tiver GPU compatível (RTX 4000 ou Radeon RX 7000+).

```terminal
$ flatpak run com.moonlight_stream.Moonlight stream --local --resolution 1280x800 --fps 60 --bitrate 25000 --codec hevc
```

O comando acima, executado no terminal do modo desktop do Deck, inicia um stream direto com configurações explícitas. Isso é útil para testar parâmetros rapidamente sem navegar por menus, e os valores testados podem ser salvos no perfil do Moonlight.

## Remote Play vs Moonlight/Sunshine: escolhendo

Nenhuma das soluções é "melhor" em todos os cenários. A escolha depende do que você prioriza:

| Critério | Steam Remote Play | Moonlight + Sunshine |
|---|---|---|
| Jogos Steam | Integração total, dois toques | Funciona, mas sem overlay Steam |
| Jogos não-Steam | Adicionar manualmente (inconsistente) | Nativo, via Sunshine |
| Latência | Similar (H.264, NVENC) | Similar ou ligeiramente menor |
| Codecs | H.264, HEVC experimental | H.264, HEVC, HEVC 10-bit, AV1 |
| HDR | Apenas no Deck OLED (parcial) | Completo (HEVC 10-bit HDR) |
| Offline LAN | **Não** (exige login Steam) | **Sim** (rede local pura) |
| Multiplataforma | PC ↔ Deck (Steam) | PC, Android, iOS, Linux, Deck, TV |

:::nota
No quesito latência, as duas soluções são próximas porque usam os mesmos codificadores. As diferenças relatadas (ex.: "Moonlight tem 3 ms a menos") geralmente vêm de configurações padrão diferentes de vsync e buffer, não do protocolo em si. Se você ajustar ambas com os mesmos parâmetros de encode (seção 5), o resultado é virtualmente idêntico.
:::

## Chiaki e o streaming do PlayStation

Se você tem um PlayStation 4 ou 5, o **Chiaki** faz para o PlayStation o que o Moonlight faz para o PC: streaming local de baixa latência. O Chiaki implementa o protocolo Remote Play do PS de forma aberta, com builds nativas para Linux (e, portanto, Steam Deck via flatpak).

```terminal
$ flatpak search chiaki
Chiaki4deck	re.chiaki.Chiaki4deck
$ flatpak install flathub re.chiaki.Chiaki4deck
```

O `Chiaki4deck` é um fork do Chiaki otimizado para o Steam Deck, com suporte aos touchpads, teclas de atalho do Deck e integração com o modo de jogo. A configuração envolve registrar o Deck como dispositivo Remote Play do PS — o que requer obter o *account ID* da sua conta PSN (há scripts automatizados para isso no repositório do projeto).

:::dica
O Chiaki4deck mapeia o touchpad do PS5 para os touchpads do Steam Deck, e os botões traseiros podem ser configurados como atalhos (ex.: botão PS, touchpad click). É a melhor experiência de Remote Play de PlayStation em hardware portátil que existe hoje.
:::

## Integrando tudo no modo de jogo

O objetivo final é que todos os caminhos de streaming estejam acessíveis no modo de jogo do Deck, sem precisar alternar para o desktop:

1. **Remote Play nativo** — jogos Steam já aparecem na biblioteca como "Stream".
2. **Moonlight** — adicionado como atalho não-Steam, abre a biblioteca de jogos do Sunshine.
3. **Chiaki4deck** — adicionado como atalho não-Steam, conecta direto ao PlayStation.

Com os três configurados, seu Deck se torna um terminal de jogo universal: PC, servidor Linux, PlayStation e até emuladores hospedados remotamente — tudo com dois toques no modo de console.

```terminal
$ ls ~/.local/share/Steam/userdata/*/config/shortcuts.vdf 2>/dev/null
/home/deck/.local/share/Steam/userdata/12345678/config/shortcuts.vdf
```

O `shortcuts.vdf` contém todos os atalhos não-Steam, incluindo Moonlight e Chiaki. Se você quiser migrá-los entre Decks ou fazer backup, é esse arquivo que deve copiar — junto com as respectivas configurações de controle (pasta `controller_configs`).

## Resumo

- Sunshine (servidor) + Moonlight (cliente) substitui o GameStream com código aberto, sem dependência da Valve e com codecs modernos.
- O Moonlight instala-se no Deck via Flatpak (Flathub); adicioná-lo como atalho não-Steam permite uso no modo de jogo.
- Remote Play e Moonlight/Sunshine têm latência similar quando configurados com os mesmos parâmetros de encode.
- Chiaki4deck traz streaming local de PlayStation 4/5 para o Deck com mapeamento completo dos controles.
- Com Remote Play, Moonlight e Chiaki configurados, o Deck funciona como terminal de streaming universal.

## Exercícios

1. Instale o Sunshine no seu PC e o Moonlight no Deck (via Discover). Pareie os dois e confirme que o streaming funciona com um jogo não-Steam.
2. Compare a latência do mesmo jogo via Remote Play e via Moonlight, usando o método do contador da seção 5. A diferença é significativa?
3. Teste o Moonlight offline: desconecte a internet (mantendo LAN), feche o Steam e inicie uma sessão. Funciona?
4. Se você tem um PS4 ou PS5, instale o Chiaki4deck e configure pelo menos um jogo. Como os touchpads do Deck se comportam?
5. **Desafio.** Adicione Moonlight e Chiaki como atalhos não-Steam, ajuste as artes de capa (hero e logo no Steam ROM Manager ou manualmente) e deixe sua biblioteca do Deck com aparência de console — PC, PlayStation e emuladores, tudo a dois toques.