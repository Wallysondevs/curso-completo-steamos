O Xbox Cloud Gaming pelo Edge funciona bem no Modo Desktop, mas o Deck foi feito para o Modo Jogo. A boa notícia é que o processo para criar o atalho é igual ao do GeForce NOW na [seção 2 deste capítulo](#/cap-066/sec-02). A diferença está nos detalhes: o Edge tem suas próprias flags de kiosk, o xCloud se beneficia de um user-agent específico e a arte do atalho segue outro padrão visual. Esta seção é a versão do procedimento de atalho adaptada ao ecossistema Xbox.

:::objetivos
- Criar um atalho Steam que abra o Edge em modo kiosk para o xCloud
- Aplicar as flags específicas do Edge para melhor desempenho
- Configurar o user-agent para compatibilidade máxima com o xCloud
- Adicionar arte personalizada com identidade visual Xbox
- Testar a experiência no Modo Jogo e ajustar o que for necessário
:::

## O comando kiosk do Edge para o xCloud

A estrutura é a mesma do Chrome, mas as flags do Edge têm nomes diferentes. O Edge oferece `--kiosk` padrão e um modo `--kiosk-edge` mais agressivo, que bloqueia qualquer pop-up de diálogo do navegador — útil porque o xCloud dispara notificações de "sessão expirada" que podem roubar o foco do jogo.

```terminal
$ flatpak run com.microsoft.Edge \
  --kiosk \
  --no-first-run \
  --window-size=1280,800 \
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0" \
  "https://www.xbox.com/play"
```

Note o user-agent: ele se identifica como Edge no Windows 10. Isso não é trapaça — é compatibilidade. O site do Xbox Cloud Gaming usa detecção de navegador para ajustar codecs e comportamento. Um user-agent Linux às vezes faz o site servir um perfil de compatibilidade reduzida. O user-agent Windows+Edge garante que você receba o codec proprietário da Microsoft e o caminho otimizado de gamepad.

O `--window-size=1280,800` cobre a tela nativa do Deck. Se você usa o Deck dockado em uma TV 1080p, mude para `--window-size=1920,1080`. A instância Xbox Series X no datacenter renderiza a 1080p nativamente, então você perde qualidade se a janela do navegador for menor.

:::dica
Crie um script `~/.local/bin/xcloud.sh` com essas flags. Teste-o no terminal primeiro: `bash ~/.local/bin/xcloud.sh`. Se o Edge abrir direto no xCloud e você conseguir navegar e iniciar um jogo, o atalho do Steam vai funcionar.
:::

## Registrando no Steam com identidade Xbox

O procedimento é idêntico ao do GeForce NOW: **Biblioteca > Adicionar um jogo > Adicionar um jogo não Steam**, procure por *Microsoft Edge* na lista ou navegue até `/var/lib/flatpak/exports/bin/com.microsoft.Edge`.

Nas propriedades do atalho:

| Campo | Valor |
|---|---|
| Nome | Xbox Cloud Gaming |
| Destino | `/var/lib/flatpak/exports/bin/com.microsoft.Edge` |
| Opções de inicialização | `--kiosk --no-first-run --window-size=1280,800 --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0" "https://www.xbox.com/play"` |
| Diretório de trabalho | `/home/deck` |

Para a arte, busque por "Xbox Cloud Gaming" no [SteamGridDB](https://www.steamgriddb.com). O ideal é usar as artes oficiais do Xbox Game Pass — fundo verde com o logotipo, consistentes com a identidade visual do ecossistema Xbox.

```terminal
$ ls -la ~/.steam/steam/config/grid/ | grep -i xbox
-rw-r--r-- 1 deck deck 156432 Aug 10 14:05 xbox_cloud_poster.png
-rw-r--r-- 1 deck deck  98432 Aug 10 14:05 xbox_cloud_hero.png
-rw-r--r-- 1 deck deck  34212 Aug 10 14:06 xbox_cloud_logo.png
```

## O layout de controle ideal para xCloud

Diferente do GeForce NOW, o xCloud é nativamente gamepad. O template **Gamepad** (sem trackpad de mouse) é o ponto de partida. Mas você vai querer duas modificações:

**Touchpad direito como mouse** — a interface do xCloud tem alguns elementos que só respondem a clique (fechar pop-ups, selecionar perfil, alternar entre jogos na barra lateral). Configure o touchpad direito como mouse com clique esquerdo no toque.

**Botão Steam como botão Xbox** — no editor de layout, configure o [[Steam]] para enviar `[[Win+G]]` (a Game Bar do Windows). No Xbox remoto, isso abre o menu do sistema Xbox, equivalente a apertar o botão Xbox no controle físico. Se `[[Win+G]]` não funcionar, tente `[[Win+Alt+G]]`.

:::atencao
O [[Steam]] é um botão de sistema no Modo Jogo — ele sempre abre o menu Steam, mesmo que você o tenha remapeado. Para enviar o atalho `[[Win+G]]` ao servidor remoto, use um botão diferente (ex.: `L5`) ou segure [[Steam]] e pressione outro botão configurado como chord.
:::

## Comparando a experiência: Modo Desktop vs Modo Jogo

O Modo Jogo do SteamOS roda sobre o compositor `gamescope`, que gerencia a tela de forma diferente do KDE Plasma. Duas diferenças afetam o xCloud diretamente:

1. **Gerenciamento de foco**: no Modo Jogo, o kiosk do Edge é a única janela visível e não há risco de outro aplicativo roubar o foco. No Modo Desktop, uma notificação do sistema pode sobrepor a janela do Edge e capturar eventos de teclado.

2. **Composição de tela**: o gamescope aplica FSR (FidelityFX Super Resolution) globalmente se você configurar. Isso significa que um stream 720p do xCloud pode ser upscaled para 800p com qualidade superior ao upscale bilinear do navegador.

```terminal
$ gamescope --help 2>&1 | grep -i fsr
  --fsr                         Enable AMD FidelityFX Super Resolution
  --fsr-sharpness               FSR sharpness (0-20, default: 10)
```

A flag `--fsr` está ativa por padrão no Modo Jogo do SteamOS 3.6. Se a qualidade do xCloud parecer borrada, desative o FSR nas configurações do jogo (Quick Access > Desempenho > Scaling Filter > Linear) e deixe o Edge gerenciar a escala.

## Resumo

- O atalho do xCloud no Steam usa Edge com flags `--kiosk`, `--no-first-run` e user-agent Windows+Edge.
- O template de controle é **Gamepad**, com touchpad direito configurado como mouse e botão `L5` como `[[Win+G]]`.
- O Modo Jogo oferece foco exclusivo e FSR integrado via gamescope, mas o FSR pode deixar o stream borrado.
- A arte personalizada segue a identidade Xbox (verde, logotipo oficial) e está disponível no SteamGridDB.
- Teste o atalho no Modo Desktop antes de migrar para o Modo Jogo.

## Exercícios

1. Crie o atalho do Xbox Cloud Gaming no Steam com as flags descritas. Teste-o no Modo Desktop e faça login.
2. Configure o layout **Gamepad** com touchpad direito como mouse. Inicie um jogo e verifique se todos os botões respondem.
3. Abra o Quick Access durante uma sessão de xCloud no Modo Jogo. Altere o Scaling Filter entre FSR, Linear e Integer. Qual deles produz a imagem mais nítida?
4. No Modo Jogo, pressione o botão Steam durante o streaming — o menu Steam sobrepõe o jogo. Isso interrompe o streaming? O áudio continua?
5. **Desafio.** Crie atalhos separados para dois jogos específicos do Game Pass. Use URLs diretas — `https://www.xbox.com/play/game/nome-do-jogo` — e configure layouts de controle específicos para cada gênero (corrida, FPS, RPG). O Steam Input permite associar layouts por atalho?