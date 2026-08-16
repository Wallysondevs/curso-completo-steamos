O Steam Deck é uma máquina que joga games de PC nativamente, mas nem todo console tem versão para Steam. A boa notícia é que tanto o PlayStation quanto o Xbox permitem transmitir a tela do console para outro dispositivo via rede local — um recurso chamado genericamente de *Remote Play*. No SteamOS, o Chiaki é o cliente de código aberto que faz a ponte com PS4 e PS5, entregando latência baixa e qualidade que rivaliza com o aplicativo oficial da Sony. Antes de instalar qualquer coisa, vale entender como esses protocolos funcionam e por que a escolha do cliente certo faz tanta diferença no Deck.

:::objetivos
- Entender o funcionamento dos protocolos Remote Play da Sony e da Microsoft
- Conhecer as diferenças entre Chiaki, Chiaki4Deck e o app oficial
- Identificar os pré-requisitos de rede para streaming local de consoles
- Avaliar as limitações de cada solução antes de escolher
:::

## O que é Remote Play e por que o Steam Deck precisa dele

Remote Play é o nome que a Sony dá para a transmissão de jogos do PlayStation para outro dispositivo. No PC, o aplicativo oficial funciona, mas exige Windows ou macOS e impõe restrições desnecessárias: exige um controle DualShock 4 ou DualSense conectado via USB e não oferece ajustes finos de codec e bitrate.

O Chiaki resolve isso rodando nativamente no Linux — inclusive no SteamOS — e falando diretamente o protocolo proprietário do Remote Play da Sony. Isso significa que ele não depende de emulação, Wine ou camadas de compatibilidade: é um binário nativo que se comunica com o console como se fosse o app oficial, mas com mais opções de configuração.

O mesmo vale para o ecossistema Xbox: o aplicativo oficial de Remote Play da Microsoft também não tem versão para Linux, mas projetos da comunidade como o **Greenlight** e o **xbPlay** preenchem essa lacuna. Eles implementam o protocolo de streaming do Xbox One e Series, permitindo que você jogue títulos do Game Pass ou da sua biblioteca diretamente no Deck.

## O protocolo por trás do Chiaki

O Chiaki implementa o protocolo *CTRL* (Consumer Technology Remote Link), o mesmo usado pelo PS Vita, PC Remote Play e PS TV. Esse protocolo opera sobre UDP e foi parcialmente documentado por engenharia reversa da comunidade. A comunicação acontece em três fases distintas:

1. **Registro (pairing):** o Chiaki obtém as credenciais do console usando seu PSN Account ID. O PlayStation exibe um PIN de 8 dígitos que o cliente envia de volta criptografado.
2. **Descoberta:** o Chiaki localiza o console na rede local via broadcast UDP na porta 987 ou usando o endereço IP manualmente configurado.
3. **Streaming:** os dados de vídeo e áudio são transmitidos em tempo real, com codec negociado entre H.264 e H.265.

```terminal
$ chiaki --version
Chiaki v2.2.0
Supported platforms: Linux (Wayland/X11), Windows, macOS, Android
Protocol version: 10 (PS4 10.0+, PS5)
```

O protocolo da Sony negocia automaticamente resolução e codec, mas o Chiaki expõe parâmetros que o app oficial esconde — como a escolha forçada de codec, o tamanho do buffer de áudio e a prioridade de threads de decodificação.

:::info
O protocolo Remote Play da Sony é diferente do PS Now (cloud gaming). O Remote Play exige que você tenha um console físico ligado na mesma rede; o PS Now (hoje parte da PS Plus Premium) transmite de servidores na nuvem e não passa pelo Chiaki — para esse cenário, a Sony oferece um app dedicado que também não tem versão nativa para Linux.
:::

## Chiaki vs Chiaki4Deck: qual escolher

O Chiaki original é multiplataforma e funciona bem no SteamOS, mas não foi pensado para um dispositivo portátil com tela de 7 polegadas e controles integrados. O **Chiaki4Deck** é um fork mantido pela comunidade que adiciona melhorias específicas para o Steam Deck:

| Característica | Chiaki | Chiaki4Deck |
|---|---|---|
| Interface | Genérica, otimizada para desktop | Adaptada para tela de 7" e gamepad |
| Mapeamento de touchpad | Manual via Steam Input | Mapeamento automático do touchpad do PS |
| Gyro | Não suportado | Suporte a gyro via Steam Input |
| Atalhos do Deck | Não integrados | Botão Steam + combos de atalho |
| Instalação | Flatpak oficial | Flatpak via Discover ou loja comunitária |

Para a maioria dos usuários de Steam Deck, o Chiaki4Deck é a melhor escolha — ele é essencialmente o Chiaki com camadas de usabilidade específicas para o hardware do Deck. A instalação e os comandos de configuração são idênticos.

## Pré-requisitos de rede

Antes de configurar qualquer cliente, o console precisa estar preparado. No PS4 ou PS5, o Remote Play precisa ser ativado manualmente:

```terminal
## No console PlayStation:
## Configurações > Sistema > Remote Play > Ativar Remote Play
```

A rede doméstica é o fator que mais impacta a qualidade do streaming. O ideal é que o console esteja conectado via cabo Ethernet ao roteador. O Steam Deck, por ser portátil, quase sempre estará no Wi-Fi — e isso já é suficiente para o streaming local se o roteador for razoável:

- **5 GHz obrigatório:** a banda de 2.4 GHz não tem largura de banda estável para streaming de jogo em tempo real. A latência oscila demais e o bitrate efetivo fica muito abaixo do necessário.
- **Distância do roteador:** quanto mais perto, melhor. Paredes grossas e interferência de outros dispositivos degradam o sinal rapidamente.
- **Roteador como gargalo:** se o roteador for o fornecido pela operadora, o streaming pode sofrer. Um roteador com Wi-Fi 5 (802.11ac) ou Wi-Fi 6 (802.11ax) faz diferença visível.

```terminal
$ iw dev wlan0 link
Connected to 00:11:22:33:44:55 (on wlan0)
        SSID: Casa-5GHz
        freq: 5180
        signal: -44 dBm
        tx bitrate: 866.6 MBit/s
```

O `tx bitrate` (taxa de transmissão) reportado pelo Wi-Fi é a velocidade de enlace, não a efetiva. Um enlace de 866 Mbps em 5 GHz normalmente entrega entre 200 e 400 Mbps reais, o que é mais que suficiente para streaming 1080p a 60 FPS com H.265.

:::atencao
Se o PlayStation estiver no Wi-Fi também (em vez de cabeado), a latência dobra porque cada frame de vídeo precisa dar dois saltos sem fio: do console ao roteador e do roteador ao Deck. Em jogos de ação, isso pode ser a diferença entre jogável e frustrante.
:::

## Resumo

- O Chiaki é um cliente de código aberto que implementa o protocolo Remote Play da Sony para PS4 e PS5 no Linux, sem depender de Wine ou emulação.
- O Chiaki4Deck é um fork otimizado para o Steam Deck, com interface adaptada, mapeamento automático de touchpad e suporte a gyro.
- O protocolo CTRL opera em três fases: registro via PSN Account ID, descoberta do console na rede e streaming de vídeo/áudio via UDP.
- O console deve estar cabeado no roteador sempre que possível; o Deck opera bem em Wi-Fi 5 GHz com enlace acima de 400 Mbps.
- O Remote Play exige console físico ligado; não substitui serviços de cloud gaming como PS Plus Premium.

## Exercícios

1. Verifique a banda e a qualidade do sinal Wi-Fi do seu Deck com `iw dev wlan0 link`. O enlace está em 5 GHz? Qual é o `tx bitrate` reportado?
2. Acesse as configurações do seu PS4 ou PS5, ative o Remote Play e anote o endereço IP do console (em Configurações > Rede > Ver status da conexão).
3. Execute `ping -c 10 <ip-do-console>` a partir do terminal do Deck e anote a latência média. Valores acima de 5 ms indicam interferência ou console no Wi-Fi.
4. Pesquise no Discover do SteamOS se o Chiaki4Deck está disponível como Flatpak. Qual é a versão mais recente listada?
5. **Desafio.** Investigue o protocolo CTRL: leia a documentação do repositório oficial do Chiaki e explique, em um parágrafo, por que a fase de registro exige o PSN Account ID em vez de apenas o PIN exibido pelo console.