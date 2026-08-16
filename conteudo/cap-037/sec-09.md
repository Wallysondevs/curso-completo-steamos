Se você chegou até aqui, já conhece a cadeia completa do Proton: Wine, DXVK, VKD3D-Proton, FAudio, dxvk-nvapi, runtime e ferramentas de diagnóstico. O que falta é fechar a mão — transformar o conhecimento num roteiro prático que você executa quando um jogo não funciona. Esta seção fornece um método de diagnóstico reprodutível e uma tabela de referência rápida com todas as ferramentas vistas ao longo do capítulo.

:::objetivos
- Executar um roteiro de diagnóstico padronizado para qualquer jogo problemático
- Identificar padrões de falha e associá-los ao componente correto
- Saber quais informações coletar antes de reportar um bug ao Proton
- Consultar uma tabela de referência rápida com comandos e variáveis
- Integrar os diagnósticos do Proton com outras áreas do SteamOS
:::

## O protocolo de diagnóstico em 5 passos

Este protocolo assume que você está num Steam Deck (ou num PC com SteamOS/Steam Linux) e que o jogo está instalado via Steam. Siga os passos em ordem — cada um elimina uma classe de problemas.

**Passo 1: Identifique o componente que falha.** O jogo nem abre? Crash na tela de título? Som ausente? Vídeos em tela preta? Cada sintoma aponta para um componente diferente:

| Sintoma | Componente suspeito |
|---|---|
| Jogo nem abre (botão Jogar pisca e volta) | Runtime Steam, prefixo corrompido |
| Abre e fecha sem erro visível | Declaração de tela cheia, falta de `vcrun`/`dotnet` |
| Tela preta ou artefatos | DXVK ou VKD3D-Proton |
| Sem som | FAudio, servidor PulseAudio/PipeWire |
| Vídeos/cutscenes quebrados | Codecs mfplat, GStreamer |
| Performance baixa | Shader cache, FPS limit, config gráfica do jogo |

**Passo 2: Execute com `PROTON_LOG=1`.** Esse passo sozinho resolve metade dos casos. O log `~/steam-<appid>.log` mostra em qual fase o Proton parou:

```terminal
$ PROTON_LOG=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run \
  ~/.steam/steam/steamapps/common/GameName/game.exe
$ grep -E 'err:' ~/steam-<appid>.log | head -10
```

Procure por `err:` que apareçam próximos ao ponto da falha (últimas 20 linhas do log). Ignore `fixme:` a menos que estejam imediatamente antes de um `err:`.

**Passo 3: Teste com Proton diferente.** Troque entre Proton 9.0, Proton Experimental e Proton Hotfix nas propriedades do jogo no Steam. Se o jogo funciona em um e não em outro, você acabou de isolar o componente: a diferença entre as versões (consulte a tabela da seção 8) indica qual peça mudou.

**Passo 4: Isolamento de componente.** Com base na tabela do Passo 1, ative o log ou HUD do componente específico:

```terminal
## Para problema gráfico D3D11:
$ DXVK_HUD=full PROTON_LOG=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe

## Para problema gráfico D3D12:
$ VKD3D_DEBUG=warn PROTON_LOG=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe

## Para problema de áudio:
$ pactl list sink-inputs | grep -A5 'Proton FAudio'
```

**Passo 5: Prefixo limpo.** Se nada acima resolveu, recrie o prefixo: feche o Steam, renomeie a pasta do appid em `compatdata/` (ex.: `2194530` → `2194530.bak`), reabra o Steam e rode o jogo. Se funcionar, o prefixo estava corrompido; delete o `.bak`. Se não funcionar, restaure a pasta original (`2194530.bak` → `2194530`).

## O que coletar antes de reportar um bug

Se você for abrir uma issue no GitHub do Proton ([github.com/ValveSoftware/Proton](https://github.com/ValveSoftware/Proton)), inclua sempre:

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton --version
Proton: 9.0-4
Steam Runtime Version: sniper 0.20250303.110000
Wine version: wine-9.0

$ uname -a
Linux steamdeck 6.5.0-valve21-1-neptune-65 #1 SMP PREEMPT_DYNAMIC ... x86_64 GNU/Linux

$ cat /etc/os-release
NAME="SteamOS"
VERSION="3.6.20"
...
```

Adicione o `PROTON_LOG=1` completo (como anexo, não colado inline), a versão do Proton usada e uma descrição do que aconteceu (não "não funciona" — diga "o jogo abre tela preta após o logo do estúdio, com áudio ativo").

## Tabela de referência rápida

### Comandos de inspeção

| Comando | O que mostra |
|---|---|
| `proton --version` | Versão do Proton, Wine e Runtime |
| `proton getcompatpath <appid>` | Caminho do prefixo do jogo |
| `proton getnativepath <path>` | Converte caminho do prefixo para real |
| `ls ~/.steam/steam/steamapps/compatdata/` | Lista prefixos de todos os jogos |
| `ls ~/.steam/steam/compatibilitytools.d/` | Ferramentas de compatibilidade extras |

### Variáveis de ambiente para diagnóstico

| Variável | Efeito |
|---|---|
| `PROTON_LOG=1` | Grava `~/steam-<appid>.log` com log completo |
| `DXVK_HUD=1` ou `full` ou `fps` | Sobreposição DXVK com métricas |
| `VKD3D_DEBUG=info` ou `warn` | Log detalhado do VKD3D-Proton |
| `DXVK_ENABLE_NVAPI=0` | Desativa emulação NVAPI |
| `MANGOHUD=1` | Sobreposição genérica MangoHud |
| `DXVK_ASYNC=1` | Compilação assíncrona de pipelines |

### Arquivos e diretórios importantes

| Caminho | Conteúdo |
|---|---|
| `~/.steam/steam/steamapps/common/Proton*/` | Versões do Proton instaladas |
| `~/.steam/steam/steamapps/common/Proton*/dist/bin/wine` | Binário do Wine do Proton |
| `~/.steam/steam/steamapps/common/Proton*/dist/lib64/wine/dxvk/` | DLLs DXVK |
| `~/.steam/steam/steamapps/common/Proton*/dist/lib64/wine/vkd3d-proton/` | DLLs VKD3D-Proton |
| `~/.steam/steam/steamapps/compatdata/<appid>/pfx/` | Prefixo Wine do jogo |
| `~/.steam/steam/steamapps/shadercache/<appid>/` | Cache de shaders |
| `~/steam-<appid>.log` | Log do PROTON_LOG=1 |
| `~/.steam/steam/config/config.vdf` | Configuração global do Steam |
| `~/.steam/steam/userdata/<id>/config/localconfig.vdf` | Config por jogo |

## Diagnóstico além do Proton

Às vezes o problema não é o Proton. O jogo pode estar lento porque o Gamescope está limitando FPS, ou porque o TDP do Deck está capado, ou porque o driver Vulkan (`radv`) tem um bug. Antes de culpar o Proton, confirme que esses fatores externos estão sob controle:

```terminal
$ MANGOHUD=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
```

O MangoHud mostra, além de FPS, a temperatura da GPU e a frequência do clock. Se a GPU está a 400 MHz quando deveria estar a 1600 MHz, o problema é throttling térmico ou TDP, não Proton. Ajustes de TDP e GPU clock são feitos no menu de desempenho do Steam Deck (botão `...` → Desempenho) ou via `powercap` no terminal.

:::dica
Antes de abrir um bug no Proton, sempre confirme que o jogo funciona com as configurações gráficas mais baixas possíveis. Muitos "bugs do Proton" são, na verdade, o jogo excedendo a capacidade da GPU do Steam Deck — e o comportamento é o mesmo no Windows com hardware equivalente. Desative ray tracing, reduza texturas para "Médio" e tente novamente.
:::

## Onde continuar

O conhecimento deste capítulo se conecta a várias outras áreas do curso:

- [Gamescope e o compositor do Steam Deck](#/cap-031/sec-07) — como o compositor gerencia fullscreen virtual e limita FPS
- [Proton-GE e ferramentas de terceiros](#/cap-038/sec-01) — como instalar e usar forks do Proton
- [Diagnóstico de GPU e driver Mesa/radv](#/cap-025/sec-04) — quando o problema está no driver Vulkan, não no Proton
- [Solução de problemas de rede no Steam Deck](#/cap-033/sec-02) — quando o jogo online não conecta
- [Configuração de periféricos e controles](#/cap-040/sec-03) — mapeamento de volantes, HOTAS e controles alternativos

## Resumo

- O protocolo de diagnóstico do Proton segue 5 passos: identificar sintoma, `PROTON_LOG=1`, trocar versão, isolar componente, limpar prefixo.
- Cada sintoma (tela preta, sem som, crash, vídeo quebrado) aponta para um componente diferente.
- Antes de reportar um bug, colete `proton --version`, `uname -a`, `/etc/os-release` e o log completo.
- A tabela de referência rápida reúne comandos, variáveis e caminhos de arquivo essenciais.
- Nem todo problema é do Proton: throttling de GPU, configuração do Gamescope e TDP também afetam o jogo.

## Exercícios

1. Escolha um jogo problemático da sua biblioteca e execute o protocolo de 5 passos. Documente o resultado de cada passo.
2. Com `MANGOHUD=1`, monitore temperatura e clock da GPU durante 10 minutos de um jogo pesado. A GPU está na frequência esperada?
3. Gere um log `PROTON_LOG=1` para um jogo e extraia todas as linhas `err:` e `fixme:`. Para cada `err:`, classifique se ele parece relacionado ao problema ou é ruído.
4. Monte um checklist (em markdown) com os passos do protocolo de diagnóstico, adaptando-o para seu uso pessoal.
5. **Desafio.** Combine o protocolo desta seção com o diagnóstico de GPU da seção de driver Mesa/radv. Monte um roteiro unificado que cubra problemas de jogo do Proton até o driver Vulkan, com pontos de decisão ("se FPS < 15 e GPU clock máximo → vá para passo X").