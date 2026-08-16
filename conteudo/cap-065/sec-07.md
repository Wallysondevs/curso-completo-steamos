O Moonlight funciona bem no modo Desktop, mas o Steam Deck brilha no modo Gaming — a interface da Valve com navegação por controle, sobreposição de desempenho e suspensão/resume. Esta seção mostra como fazer a integração perfeita: Moonlight como se fosse um jogo nativo, com atalhos de controle sensatos, overlay de performance e scripts de lançamento automático.

:::objetivos
- Integrar o Moonlight ao modo Gaming com experiência de console
- Mapear atalhos do Moonlight para botões do Deck via Steam Input
- Usar o overlay de desempenho do Steam durante o streaming
- Criar atalhos por jogo com arte de capa personalizada
- Automatizar resolução e refresh rate ao iniciar/fechar stream
:::

## Adicionando ao modo Gaming (revisitado)

Na seção 3, adicionamos o Moonlight como non-Steam game. Agora vamos refinar: capa, nome, parâmetros e comportamento.

No modo Desktop, Steam aberto:

1. Clique com botão direito no atalho do Moonlight → **Properties**.
2. Em **Shortcut** → **Launch Options**, adicione parâmetros:

```bash
run --command=moonlight com.moonlight_stream.Moonlight stream 192.168.1.100 --desktop --resolution 1280x800 --fps 60 --bitrate 50000 --codec hevc --quit-after 60
```

O `--quit-after 60` fecha o Moonlight se ficar 60 segundos sem stream (útil para voltar ao Steam automaticamente).

3. Renomeie para "🖥️ PC Streaming" ou "🎮 Remote Play".
4. Em **Compatibility**, deixe desmarcado (o Moonlight Flatpak é nativo Linux).

### Capa personalizada

Para dar ao atalho uma arte bonita na biblioteca:

1. Clique com botão direito no atalho → **Manage** → **Set custom artwork**.
2. Escolha um PNG 600×900 para capa vertical e 920×430 para horizontal.
3. Sites como [SteamGridDB](https://www.steamgriddb.com/) têm artes prontas para Moonlight, Sunshine e jogos individuais.

## Steam Input: mapeando os controles

O Moonlight envia os controles do Deck como gamepad (Xbox 360 virtual via ViGEmBus no host). Mas alguns atalhos do Moonlight precisam de teclado — `Ctrl+Alt+Shift+Q` para sair, `Ctrl+Alt+Shift+Z` para estatísticas.

No Steam Input, você pode mapear botões extras para esses atalhos:

1. No modo Gaming, selecione o atalho do Moonlight.
2. Clique no ícone de controle (Controller Settings).
3. Edite o layout:

**Mapeamentos sugeridos:**

| Botão do Deck | Ação Steam Input | Função |
|---------------|------------------|--------|
| `Steam + Start` | `Ctrl + Alt + Shift + Q` | Sair do stream |
| `Steam + Select` | `Ctrl + Alt + Shift + Z` | Mostrar estatísticas |
| `L4` (grip esquerdo) | `Alt + Tab` | Alternar janelas no host |
| `R4` (grip direito) | `Alt + F4` | Fechar janela ativa no host |
| `L5` | `Win + D` | Mostrar desktop |
| `R5` | `Ctrl + Alt + Shift + M` | Alternar captura do mouse |
| Touchpad esquerdo | Mouse + clique | Mouse remoto |
| Touchpad direito | Scroll wheel | Scroll remoto |

### Giroscópio como mouse

Ative o giroscópio como mouse no Steam Input para mirar fina em jogos que não suportam gyro nativamente:

1. Em **Gyro** → **Gyro Behavior** → **As Mouse**.
2. Ative `Gyro Enable Button`: `Left Trigger Soft Pull` (ou outro botão).
3. Ajuste sensibilidade para 30-50% (o gyro do Deck é sensível).

Isso funciona porque o Moonlight envia mouse do Deck → mouse no host. Jogos como Cyberpunk, The Witcher 3 ou qualquer FPS se beneficiam.

## Overlay de desempenho durante o stream

O overlay de desempenho do Steam (botão `...` → Performance) funciona sobre o Moonlight. Você pode monitorar:

- **FPS**: os frames que o Moonlight está renderizando no Deck. Deve casar com o FPS do stream (60 ou 90).
- **CPU/GPU**: a CPU deve ficar baixa (< 15%), a GPU usada para decode (VCN no Deck LCD, VCN 3 no OLED).
- **Battery**: streaming é muito mais econômico que renderizar nativamente. Com Wi-Fi, o Deck dura 5-7 horas streamando.

O overlay mostra FPS da renderização local (Moonlight pintando frames na tela), não do host. Para ver o FPS do host, ative o overlay do Sunshine (RTSS no Windows, MangoHud no Linux).

### Atenção: double overlay

Se o host estiver rodando RTSS/MangoHud com overlay, ele aparece no stream. Isso pode ser útil (para ver o FPS real do jogo) ou irritante (poluição visual). Configure o overlay do host para aparecer apenas em um canto, ou desabilite.

## Scripts de lançamento automático

Para uma experiência de console, crie scripts que:

1. Iniciam o stream com as configurações ideais.
2. Ajustam o brilho/refresh rate do Deck (via `gamescope` ou `steamos-session`).
3. Ao fechar o Moonlight, restauram as configurações.

**Exemplo: `stream-elden-ring.sh`**

```bash
#!/bin/bash
HOST="192.168.1.100"
APP="Elden Ring"
RES="1280x800"
FPS="60"
BITRATE="50000"
CODEC="hevc"

# Ajusta brilho máximo para HDR (se OLED)
# echo 100 > /sys/class/backlight/amdgpu_bl0/brightness

flatpak run --command=moonlight com.moonlight_stream.Moonlight \
  stream "$HOST" --app "$APP" \
  --resolution "$RES" --fps "$FPS" \
  --bitrate "$BITRATE" --codec "$CODEC" \
  --quit-after 30

# Restaura brilho anterior ao sair
# echo 70 > /sys/class/backlight/amdgpu_bl0/brightness
```

Adicione este script como non-Steam game, com nome "Elden Ring" e capa personalizada. Na biblioteca Steam, parece um jogo nativo.

## MoonDeck: plugin Decky Loader

Se você tem o Decky Loader (capítulo sobre plugins), o **MoonDeck** é o plugin mais maduro para Moonlight. Ele:

- Lista os jogos do host diretamente no menu QAM (`...`).
- Inicia streams com um clique, sem sair do jogo atual.
- Sincroniza a biblioteca do host automaticamente.
- Suporta wake-on-LAN para ligar o host.

Instalação:

1. Abra o Decky Loader (botão `...` → ícone de plug).
2. Vá na loja de plugins.
3. Busque "MoonDeck" e instale.
4. Configure o IP do host na interface do plugin.

Com MoonDeck, a experiência fica quase indistinguível de um jogo nativo: você está no modo Gaming, abre o menu, escolhe um jogo do PC e em segundos está jogando.

## Resolução de tela e refresh rate

O Deck OLED tem taxa de atualização variável (VRR) e 90 Hz. Ao streamar a 60 fps, o Deck pode operar a 60 Hz para economia de bateria:

```terminal
# Forçar 60 Hz durante streaming (OLED)
$ gamescope --framerate-limit 60
```

Mas se você streamar a 90 fps (e o host aguentar), o Deck OLED aproveita os 90 Hz nativos. Só vale a pena para jogos onde a fluidez extra é perceptível (FPS competitivo, jogos de ritmo).

No Moonlight, o FPS do stream é configurado no `--fps`. O Deck automaticamente ajusta o refresh rate da tela para casar (graças ao Gamescope).

## Resumo

- Adicione o Moonlight ao modo Gaming com Launch Options customizadas.
- Use Steam Input para mapear atalhos do Moonlight em botões do Deck.
- O giroscópio funciona como mouse no host via Moonlight.
- O overlay de desempenho do Steam mostra FPS local, CPU e bateria durante o stream.
- Scripts por jogo dão a experiência mais próxima de "jogo nativo".
- MoonDeck (Decky Loader) integra streaming ao menu QAM.
- O Deck ajusta refresh rate automaticamente para casar com FPS do stream.

## Exercícios

1. Crie um atalho Steam para o Moonlight com Launch Options que incluem `--resolution 1280x800 --fps 60 --bitrate 50000 --codec hevc`. Inicie do modo Gaming.
2. No Steam Input, mapeie `Steam + Q` (ou `Start`) para `Ctrl+Alt+Shift+Q` (sair do stream). Teste durante um stream ativo.
3. Ative o overlay de desempenho (Performance Overlay nível 2) durante um stream. Qual o uso de CPU e GPU? Compare com rodar o mesmo jogo nativamente no Deck.
4. Crie um script `stream-meu-jogo.sh` para seu jogo favorito do PC, com parâmetros otimizados. Adicione como non-Steam game e coloque uma capa do SteamGridDB.
5. **Desafio.** Instale o MoonDeck via Decky Loader, configure o IP do host e inicie um jogo pelo menu QAM. Descreva a diferença de experiência comparada a abrir o Moonlight separadamente.