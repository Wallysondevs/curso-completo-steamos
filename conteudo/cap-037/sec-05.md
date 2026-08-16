Além do Wine, DXVK e VKD3D, o Proton empacota uma série de componentes menores que resolvem problemas específicos: áudio, codecs de vídeo, integração com a API do Steam e suporte a tecnologias NVIDIA. São peças que, sozinhas, passam despercebidas, mas que juntas fazem a diferença entre um jogo que "abre mas não tem som" e um que "funciona perfeitamente". Esta seção mapeia esses componentes e mostra como identificá-los.

:::objetivos
- Conhecer o FAudio, responsável pelo áudio nos jogos Windows
- Entender o papel do dxvk-nvapi para recursos NVIDIA em GPU AMD
- Identificar os codecs de mídia empacotados no Proton
- Reconhecer outros patches e bibliotecas (Steamworks, VR, input)
- Localizar no sistema cada um desses componentes auxiliares
:::

## FAudio: a voz dos jogos

Jogos Windows usam APIs de áudio que não existem no Linux: XAudio2, X3DAudio, XACT. O **FAudio** é uma reimplementação dessas APIs sobre a infraestrutura de áudio do Linux (ALSA, PulseAudio, PipeWire). A Valve mantém o projeto e o empacota dentro do Proton como `xaudio2_9.dll` e variantes.

O som no Steam Deck passa por uma cadeia que começa no FAudio, vai para o PulseAudio (ou PipeWire, dependendo da versão do SteamOS) e termina no hardware. Se um jogo está mudo, a primeira suspeita — depois de confirmar que o volume não está zerado — é que o FAudio não está sendo carregado ou que o servidor de som não está disponível:

```terminal
$ pactl info | head -8
Server Name: PulseAudio (on PipeWire 1.0.5)
Server Version: 16.1
...
$ pactl list sink-inputs | head -5
Sink Input #45
        Driver: protocol-native.c
        Owner Module: 8
        Client: Proton FAudio
```

O cliente `Proton FAudio` na lista de sink-inputs confirma que o som está passando pelo FAudio e chegando ao servidor de áudio. Se ele não aparece enquanto o jogo está rodando, a falha está antes: o FAudio pode não ter sido carregado, ou o jogo está usando uma API de áudio diferente (DirectSound antigo, OpenAL).

No Proton, o FAudio aparece em cada prefixo como um conjunto de sobreposições DLL:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/lib64/wine/faudio/
x3daudio1_7.dll
xactengine3_7.dll
xapofx1_5.dll
xaudio2_9.dll
```

## dxvk-nvapi e a ilusão NVIDIA

Muitos jogos usam a NVAPI, a biblioteca proprietária da NVIDIA, para acessar recursos como DLSS, Reflex e estatísticas de GPU. No Steam Deck, que tem GPU AMD, esses recursos não existem nativamente. O **dxvk-nvapi** é um componente que emula a presença de uma GPU NVIDIA para o jogo, traduzindo as chamadas de NVAPI para equivalentes do Vulkan (quando possível) ou retornando informações falsas para que o jogo não se recuse a iniciar.

Há dois cenários para o dxvk-nvapi:

- **Em GPU AMD** (caso do Steam Deck): o dxvk-nvapi reporta uma GPU NVIDIA fictícia para o jogo, mas não consegue ativar DLSS. O jogo funciona, porém sem upscaling proprietário NVIDIA.
- **Em GPU NVIDIA real** (caso de um desktop com Linux e Proton): o dxvk-nvapi permite acesso a DLSS, Reflex e outros recursos NVIDIA de verdade, usando o driver proprietário.

No Steam Deck, o dxvk-nvapi está presente como `nvapi64.dll` e `nvapi32.dll`:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/lib64/wine/dxvk-nvapi/
nvapi64.dll
nvapi32.dll
```

Se um jogo exige DLSS para iniciar (raro, mas acontece), você pode desativar a emulação com `DXVK_ENABLE_NVAPI=0` nas opções de lançamento — o jogo vê uma GPU AMD "pura" e pode oferecer FSR em vez de DLSS.

:::dica
Muitos jogos modernos oferecem tanto DLSS quanto FSR 2/3. No Steam Deck, usar FSR é a escolha correta porque ele roda nativamente na GPU AMD. O dxvk-nvapi está ali para jogos que só suportam DLSS ou que travam sem detectar NVIDIA, mas sempre que possível, prefira o FSR integrado do jogo ou o FSR do Gamescope.
:::

## Codecs de mídia e o Steam Runtime

Jogos Windows frequentemente embutem vídeos em formatos como WMV (Windows Media Video), Cinepak ou Bink. Esses codecs são proprietários e não vêm instalados no Linux. O Proton resolve isso de duas formas: empacotando codecs livres dentro do Steam Runtime (que é o "sistema operacional mínimo" que o Proton monta) e traduzindo chamadas da Media Foundation para o GStreamer.

O Steam Runtime é um ambiente de bibliotecas Linux autocontido que isola o jogo do sistema base. Ele tem três versões principais:

| Runtime | Apelido | Usado por |
|---|---|---|
| `steam-runtime` | scout | Proton 5.13 e anteriores |
| `steam-runtime` | heavy | Versão de transição |
| `steam-runtime` | sniper | Proton 7.0+, Steam Deck |

O "sniper" é o runtime atual, baseado em Debian, e inclui bibliotecas para codecs, fontes, rede e entrada. O Proton monta esse runtime antes de iniciar o jogo, e o script `pressure-vessel` gerencia a criação do ambiente:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/files/lib64/pressure-vessel/
overrides/
runtime/
```

Se um vídeo do jogo aparece como tela preta (ou verde, ou roxa), o problema costuma estar nos codecs de mídia. O Proton usa o GStreamer para decodificar vídeos de jogos via plugin `mfplat` (Media Foundation Platform). Você pode conferir se o `mfplat` está ativo:

```terminal
$ WINEPREFIX=~/.steam/steam/steamapps/compatdata/1086940/pfx \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine reg query \
  "HKEY_CURRENT_USER\Software\Wine\AppDefaults\game.exe\DllOverrides" 2>/dev/null
```

## Steamworks, VR e outros patches

O Proton inclui dezenas de patches para o Wine que são específicos do ecossistema Steam. Eles cobrem:

- **Steam API**: integração com overlay, achievements, nuvem de saves.
- **Steam Input**: tradução de comandos do controle do Steam Deck para XInput, DirectInput.
- **Fullscreen virtual**: emulação de modo exclusivo de tela cheia (VDX) que o Gamescope gerencia.
- **Font smoothing**: renderização de fontes que muitos jogos esperam do ClearType.

Além disso, componentes como **OpenVR** e **OpenXR** permitem que jogos VR rodem via SteamVR no Linux — algo que está fora do escopo do Steam Deck (que não é um headset VR), mas que faz parte do Proton para desktop.

Uma visão consolidada do que cada versão do Proton contém está no arquivo `toolmanifest.vdf`, que o Steam usa para identificar a ferramenta de compatibilidade:

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/toolmanifest.vdf
"manifest"
{
  "version" "1"
  "commandline" "/proton %verb%"
  "use_sessions" "1"
  "FromAppID" "2344320"
}
```

O `FromAppID` `2344320` é o appid do próprio Proton 9.0 na loja do Steam — sim, o Proton é listado como um aplicativo interno, e você pode inspecioná-lo em `steam://nav/console` com o comando `app_status 2344320`.

## Componentes por versão

Nem toda versão do Proton tem os mesmos componentes. Versões mais novas podem incluir um VKD3D-Proton mais recente, um FAudio com correções ou um dxvk-nvapi expandido. A tabela abaixo dá uma referência aproximada:

| Componente | Proton 8.0 | Proton 9.0 | Proton Experimental |
|---|---|---|---|
| Wine | 8.0 | 9.0 | 9.x (nightly) |
| DXVK | 2.3 | 2.4 | 2.5+ |
| VKD3D-Proton | 2.10 | 2.11 | 2.12+ |
| FAudio | 23.10 | 24.06 | 24.10+ |
| dxvk-nvapi | 0.6.4 | 0.7.1 | 0.7.x |
| DXVK-NVAPI DLSS | Parcial | Sim (GPU NVIDIA) | Sim |

Esses números mudam a cada release; o que importa é o conceito: cada versão do Proton é um empacotamento com versões específicas de cada peça. Se um jogo quebra com uma versão e funciona com outra, a causa está na diferença entre esses componentes, e o log dirá qual.

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ Experimental/proton --version
Proton: experimental-9.0-20250815
Steam Runtime Version: sniper 0.20250801.120000
Wine version: wine-9.15
```

## Resumo

- FAudio reimplementa XAudio2 e APIs de áudio do Windows sobre PulseAudio/PipeWire.
- dxvk-nvapi emula a presença de GPU NVIDIA; em GPU AMD, reporta uma GPU falsa para compatibilidade.
- Codecs de mídia (WMV, Bink) são resolvidos via GStreamer + plugin mfplat no Steam Runtime.
- Steam Runtime "sniper" é o ambiente isolado que o Proton monta com bibliotecas, fontes e codecs.
- Patches de Steamworks, Steam Input e fullscreen virtual completam a experiência de compatibilidade.
- Cada versão do Proton empacota versões específicas de cada componente; a diferença explica regressões.

## Exercícios

1. Rode um jogo com som e verifique com `pactl list sink-inputs` se o cliente aparece como `Proton FAudio`.
2. Localize as DLLs do FAudio e do dxvk-nvapi no diretório `dist/lib64/wine/` de uma versão do Proton. Liste quais arquivos cada um oferece.
3. Inspecione o `toolmanifest.vdf` de duas versões do Proton (9.0 e Experimental) e compare os `FromAppID`.
4. Use `~/.steam/steam/steamapps/common/Proton\ 9.0/proton run` com uma variável desativando o dxvk-nvapi (`DXVK_ENABLE_NVAPI=0`) e descreva se algum jogo muda de comportamento.
5. **Desafio.** Um jogo com cenas de vídeo (cutscenes) mostra tela verde. Monte o diagnóstico: qual componente lida com codecs, como verificar se o mfplat está ativo e qual log inspecionar para confirmar a causa.