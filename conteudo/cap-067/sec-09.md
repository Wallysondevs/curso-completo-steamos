O Steam Deck brilha no Gaming Mode: a interface de console, com navegação por controle e transições suaves. Mas os clientes de streaming que instalamos são aplicativos de desktop — por padrão, exigem alternar para o modo Desktop para abrir. O que fecha o ciclo de experiência é integrar o Chiaki, Greenlight e Moonlight ao Gaming Mode como se fossem jogos nativos, com atalhos, artes de capa e scripts que automatizam conexão e acordar o console. Esta seção cobre a configuração final que transforma o Deck em um hub de streaming unificado.

:::objetivos
- Criar atalhos no Gaming Mode para clientes de streaming
- Automatizar o wake-on-LAN e a conexão ao console
- Personalizar artes de capa, banners e ícones no Steam
- Usar scripts para alternar entre perfis de configuração
- Centralizar todos os consoles em uma coleção "Streaming"
:::

## Adicionando aplicativos Flatpak ao Gaming Mode

A forma mais direta de trazer o Chiaki, Moonlight ou Greenlight para o Gaming Mode é adicionar o executável Flatpak como um atalho na Steam. No modo Desktop:

1. Abra a Steam.
2. Vá em **Jogos > Adicionar um jogo não-Steam à minha biblioteca**.
3. Navegue até o diretório de aplicativos Flatpak e selecione o executável.

O caminho para cada cliente Flatpak:

```terminal
## Chiaki4Deck:
/var/lib/flatpak/exports/bin/io.github.streetpea.Chiaki4Deck

## Moonlight:
/var/lib/flatpak/exports/bin/com.moonlight_stream.Moonlight

## Greenlight:
/var/lib/flatpak/exports/bin/io.github.unknownskl.greenlight

## xbPlay:
/var/lib/flatpak/exports/bin/com.github.xbplay.xbplay
```

Depois de adicionado, o atalho aparece na biblioteca com o nome do executável e sem arte. O passo seguinte é renomeá-lo e personalizar a aparência:

```terminal
## No Gaming Mode, clique com o botão direito (ou [[Menu]]) no atalho:
## Propriedades > Nome: "Chiaki - PS5"
## Propriedades > Atalho (caso queira renomear o ícone)
```

:::dica
O Steam trata cada atalho como um jogo separado. Você pode adicionar o mesmo cliente múltiplas vezes com parâmetros diferentes — por exemplo, um atalho "Chiaki PS5 Qualidade" e outro "Chiaki PS5 Desempenho", cada um passando flags diferentes.
:::

## Scripts de lançamento com parâmetros

O verdadeiro poder da integração aparece quando você cria scripts que preparam o ambiente antes de abrir o cliente. Um script pode acordar o console (Wake-on-LAN), esperar ele ficar disponível e então iniciar o streaming com as configurações certas:

```bash
#!/bin/bash
# ~/scripts/stream-ps5.sh — Inicia streaming do PS5 com perfil de qualidade

CONSOLE_IP="192.168.1.151"
CONSOLE_MAC="AA:BB:CC:DD:EE:FF"
CHIAKI="/var/lib/flatpak/exports/bin/io.github.streetpea.Chiaki4Deck"

echo "Acordando PS5..."
wakeonlan "$CONSOLE_MAC"

echo "Aguardando console responder..."
for i in $(seq 1 30); do
    if ping -c 1 -W 1 "$CONSOLE_IP" > /dev/null 2>&1; then
        echo "Console acordou em ${i}s!"
        break
    fi
    sleep 1
done

echo "Iniciando Chiaki com perfil de qualidade..."
flatpak run io.github.streetpea.Chiaki4Deck --host "$CONSOLE_IP" \
    --resolution 1080p --codec h265 --bitrate 20000 --fullscreen
```

Salve o script em `~/scripts/stream-ps5.sh`, torne-o executável e adicione-o como atalho na Steam exatamente como faria com um aplicativo:

```terminal
$ chmod +x ~/scripts/stream-ps5.sh
$ echo ~/scripts/stream-ps5.sh >> /tmp/steam-shortcuts.txt
```

Scripts similares podem ser criados para cada console e perfil:

```bash
## stream-xbox.sh — Xbox com baixa latência para jogos competitivos
## stream-moonlight.sh — Moonlight com resolução nativa 1280x800
## stream-desktop.sh — Moonlight para acesso remoto ao desktop
```

:::info
O Wake-on-LAN do PS4/PS5 funciona apenas quando o console está em modo repouso (LED laranja), não quando está totalmente desligado. No Xbox, o recurso "Ligar console remotamente" precisa estar ativado nas configurações de energia.
:::

## Artes de capa e personalização visual

Um atalho sem arte no Gaming Mode destoa das demais entradas da biblioteca. O Steam permite personalizar quatro elementos visuais:

- **Capa (poster):** imagem vertical, proporção 2:3 (600x900 pixels).
- **Banner horizontal:** faixa larga usada na exibição em lista (920x430).
- **Logotipo:** texto estilizado do título (tamanho variável, fundo transparente).
- **Ícone:** imagem quadrada usada como avatar (mínimo 128x128).

Para aplicar artes, no Gaming Mode:

```terminal
## 1. Selecione o atalho
## 2. [[Menu]] (botão de três pontos) > Gerenciar > Definir arte personalizada
## 3. Escolha o arquivo de imagem (previamente baixado)
```

Existem sites comunitários como SteamGridDB que oferecem artes prontas para Chiaki, Moonlight e consoles. Para um visual uniforme, baixe artes com o mesmo estilo para todos os atalhos da coleção.

```terminal
## Os arquivos de arte ficam em:
~/.steam/steam/userdata/<steam-id>/config/grid/
## Ali você encontra as imagens baixadas e pode fazer backup
```

## Organizando a coleção "Streaming"

Com todos os atalhos criados, é hora de organizá-los. No Gaming Mode, crie uma coleção que agrupa todos os clientes de streaming:

```terminal
## Steam > Biblioteca > Coleções > Criar nova coleção
## Nome: "Streaming"
## Adicione: Chiaki PS5, Chiaki PS4, Xbox Remote Play, Moonlight, etc.
```

O resultado é uma aba exclusiva na biblioteca onde todos os caminhos para jogos remotos ficam a um clique de distância, sem precisar alternar ao Desktop:

```text
📚 Streaming
├── 🎮 Chiaki - PS5 Qualidade
├── 🎮 Chiaki - PS5 Competitivo
├── 🎮 Chiaki - PS4
├── 🎮 Xbox - Remote Play
├── 🎮 Xbox - xCloud
├── 🎮 Moonlight - Desktop Gamer
└── 🎮 Moonlight - Desktop Remoto
```

## Automatizando a alternância de perfis

O último nível de integração é um launcher que pergunta qual perfil você quer antes de iniciar o stream. Isso pode ser feito com um script que usa o `zenity` (ferramenta de diálogo do GTK) para exibir um menu:

```bash
#!/bin/bash
# ~/scripts/chiaki-launcher.sh — Menu de perfis para Chiaki

CONSOLE_IP="192.168.1.151"

ESCOLHA=$(zenity --list --title="Chiaki - PS5" --column="Perfil" \
    "Qualidade (1080p, H.265, 20M)" \
    "Desempenho (720p, H.265, 10M)" \
    "Econômico (540p, H.264, 5M)")

case "$ESCOLHA" in
    "Qualidade"*)
        BITRATE=20000 RES="1080p" CODEC="h265"
        ;;
    "Desempenho"*)
        BITRATE=10000 RES="720p" CODEC="h265"
        ;;
    "Econômico"*)
        BITRATE=5000 RES="540p" CODEC="h264"
        ;;
    *)
        exit 0
        ;;
esac

flatpak run io.github.streetpea.Chiaki4Deck \
    --host "$CONSOLE_IP" \
    --resolution "$RES" \
    --codec "$CODEC" \
    --bitrate "$BITRATE" \
    --fullscreen
```

Esse script, adicionado como atalho na Steam, exibe um menu simples antes de iniciar o Chiaki — você escolhe o perfil e o streaming já abre com os parâmetros certos, sem precisar acessar menus de configuração.

:::dica
Para jogos específicos que exigem configurações muito diferentes, crie atalhos diretos em vez de usar o menu. Por exemplo: "Gran Turismo 7" pode ter um atalho próprio que já abre o Chiaki com gyro ativado e perfil de qualidade, enquanto "Street Fighter 6" pode abrir com baixa latência e modo competitivo.
:::

## Resumo

- Aplicativos Flatpak são adicionados ao Gaming Mode via Steam > Adicionar jogo não-Steam, usando o caminho em `/var/lib/flatpak/exports/bin/`.
- Scripts de lançamento automatizam Wake-on-LAN, espera pelo console e inicialização com parâmetros específicos.
- Artes de capa, banners e ícones são personalizados via Menu > Gerenciar > Definir arte personalizada; comunidades como SteamGridDB fornecem artes prontas.
- Coleções agrupam todos os atalhos de streaming em uma aba dedicada na biblioteca.
- Menus com `zenity` permitem escolher perfil de configuração antes de iniciar o streaming.

## Exercícios

1. Adicione o Chiaki, Moonlight e Greenlight ao Gaming Mode como atalhos separados. Renomeie-os com nomes descritivos.
2. Crie um script `stream-ps5.sh` que acorda o PS5 via Wake-on-LAN, espera ele responder ao ping e inicia o Chiaki. Adicione o script como atalho na Steam.
3. Baixe artes de capa do SteamGridDB para seus atalhos de streaming. Use um estilo visual consistente (mesmo template ou artista) para todos.
4. Crie uma coleção "Streaming" no Gaming Mode e organize todos os atalhos nela. A coleção aparece como uma aba na sua biblioteca?
5. **Desafio.** Escreva um launcher com `zenity` que exibe uma lista de todos os consoles configurados (PS4, PS5, Xbox, PC) e, ao escolher um, inicia o cliente correspondente com as configurações otimizadas. O script deve consultar um arquivo de configuração JSON que centraliza IPs, MACs e perfis.