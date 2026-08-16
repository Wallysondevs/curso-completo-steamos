O Steam Deck já vem com o Steam Remote Play integrado — e para muita gente isso basta. Mas o ecossistema de streaming de jogos vai muito além: o Parsec se destaca por oferecer latência mais baixa, compatibilidade com qualquer jogo (mesmo fora da Steam) e o recurso único de jogos cooperativos remotos com amigos que nem têm o jogo instalado. Esta seção desenha o mapa das ferramentas que você vai dominar no capítulo.

:::objetivos
- Entender o que o Parsec entrega que o Steam Link nativo não cobre
- Comparar os modelos de cada ferramenta de streaming no ecossistema Deck
- Reconhecer os cenários em que cada solução brilha
- Posicionar Parsec, Steam Link, Moonlight/Sunshine e Chiaki no mapa mental de streaming
:::

## O ecossistema de streaming no SteamOS

O Steam Deck é ao mesmo tempo um ótimo **cliente** e um **host** de streaming. Como cliente, ele recebe o vídeo de um PC mais potente; como host, ele transmite seus jogos para uma TV, tablet ou outro Deck. Cada ferramenta ataca esse problema de um ângulo diferente:

| Ferramenta | Modelo | Melhor para |
|---|---|---|
| Steam Remote Play / Steam Link | Proprietário, integrado | Jogos da biblioteca Steam, zero configuração |
| Parsec | Proprietário, low-latency | Qualquer jogo, coop remoto, desktop remoto |
| Moonlight + Sunshine | Open source (Sunshine server) | Qualidade máxima, personalização, qualquer GPU |
| Chiaki | Open source | Streaming do PlayStation (PS4/PS5) para o Deck |

O Steam Remote Play já foi coberto em capítulos anteriores como parte da experiência integrada. O foco deste capítulo é o que está **fora** desse caminho padrão: Parsec, Moonlight/Sunshine e Chiaki, com ênfase em baixa latência e jogos cooperativos.

## Por que o Parsec importa no Steam Deck

O Parsec foi projetado com uma obsessão por latência. Diferente do Steam Remote Play — que prioriza a integração com a loja e a biblioteca Steam — o Parsec trata o streaming como uma **extensão de baixíssimo atraso da sua mesa**. Três características o tornam relevante para o Deck:

1. **Compatibilidade universal.** O Parsec transmite a tela inteira do host, não apenas jogos Steam. Isso significa que jogos da Epic, GOG, Battle.net, emuladores e até aplicativos de produtividade funcionam sem gambiarras.
2. **Jogos cooperativos.** O recurso *Parsec Arcade* (e o modo *Shared*) permite que um amigo se conecte ao seu Deck e jogue com você, como se o controle dele estivesse plugado fisicamente. Um só Deck roda o jogo; o amigo vê e controla pela rede. Isso é impossível no Steam Remote Play padrão, que transmite para um cliente por vez.
3. **Modo headless.** O Parsec pode rodar num PC sem monitor (ou com monitor desligado), usando um display virtual. Isso é útil para streaming dedicado — por exemplo, um PC gamer num canto do escritório, sem tela, acessado remotamente pelo Deck no sofá.

```terminal
$ flatpak search parsec
Name           Description                          Application ID            Version    Branch    Remotes
Parsec         Low latency remote desktop and game… com.parsecgaming.parsec   150.0.0    stable    flathub
```

O Parsec está disponível como Flatpak e também como pacote nativo (`.deb` convertido ou AppImage). No SteamOS, o Flatpak é o caminho recomendado porque se integra ao sistema de atualização e não mexe na raiz somente-leitura.

## O fator latência sob o capô

O Parsec ganha do Steam Remote Play em latência por três decisões de engenharia:

- **Captura direta via GPU.** O Parsec usa APIs de baixo nível (DXGI no Windows, KMS/DRM no Linux) para capturar o framebuffer sem passar pelo compositor — ao contrário do Steam, que passa pelo compositor e adiciona um frame de atraso.
- **Codec agressivo.** O Parsec força H.264/H.265 por hardware no menor perfil de latência possível, mesmo que isso custe um pouco de qualidade visual. O Steam Remote Play tende a equilibrar qualidade e latência, o que pode resultar em atrasos maiores.
- **Roteamento P2P.** Conexões diretas entre cliente e host, sem relay de servidores Valve (exceto quando NAT exige). O Steam Remote Play também tenta P2P, mas cai em relay com mais frequência.

Na prática, a diferença costuma ser de **5–15 ms** adicionais de latência de entrada no Steam Remote Play em relação ao Parsec, sob as mesmas condições de rede. Para jogos de ritmo acelerado (luta, FPS competitivo, ritmo), isso é significativo.

:::info
O Parsec **não** é open source. O servidor (host) funciona em Windows, macOS e Linux (beta). O cliente roda também em Android e Raspberry Pi. No SteamOS, o Parsec atua como **cliente** (conectando a um PC Windows/Linux) ou como **host** limitado — o host Linux do Parsec ainda é oficialmente beta, com suporte a encoding por software (VAAPI experimental).
:::

## Quando cada ferramenta é a resposta certa

Antes de mergulhar na instalação, fixe este mapa mental de decisão:

```
Precisa transmitir um jogo Steam da sua biblioteca?
  ├─ Sim, e é só um jogo Steam → Steam Remote Play (zero config)
  └─ Não, ou é jogo de outra loja / coop remoto
      ├─ O host é Windows? → Parsec (melhor latência)
      ├─ O host é Linux? → Sunshine + Moonlight (ou Parsec, se tolerar beta)
      ├─ É um PlayStation? → Chiaki
      └─ Quer controle total de codec/bitrate? → Sunshine + Moonlight
```

O resto do capítulo explora cada uma dessas ferramentas com o mesmo espírito do livro: comandos de terminal, arquivos de configuração, diagnóstico e exercícios práticos.

**Em resumo:** o Steam Deck tem acesso a um ecossistema rico de ferramentas de streaming que vão muito além do Steam Link integrado. O Parsec lidera em baixa latência e cooperação remota; Moonlight/Sunshine oferece máxima qualidade e controle; Chiaki conecta o Deck ao PlayStation. Nas próximas seções, você vai instalar, configurar e diagnosticar cada uma delas.

## Exercícios

1. Liste os aplicativos Flatpak relacionados a streaming instalados no seu Deck: `flatpak list | grep -iE 'parsec|moonlight|chiaki|steam'`. Compare o resultado com a tabela de ferramentas desta seção.
2. Abra o Steam Remote Play no modo Gaming e meça a latência aproximada com um jogo leve (aperte Stats overlay se disponível). Anote o valor-base.
3. Leia a saída de `ping -c 10 <ip-do-seu-PC-gamer>` a partir do Deck e calcule a média de ida e volta. Esse é o chão da latência que nenhuma ferramenta consegue vencer.
4. **Desafio.** Pesquise a engine de rede do Parsec (BUD, "Better User Datagram") e compare com o protocolo do Steam Remote Play. Qual dos dois usa UDP puro e qual mistura TCP? Por que isso importa para latência?