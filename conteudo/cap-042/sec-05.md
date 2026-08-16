Os problemas de Proton não se limitam a tela preta e crash. Alguns dos sintomas mais confusos são comportamentais: o jogo abre, mas o áudio some, um launcher trava, ou o título desenha artefatos gráficos bizarros. Estes casos pedem um tipo diferente de investigação — variáveis de ambiente do Proton que ajustam comportamento, e testes de isolamento que revelam qual subsistema (áudio, vídeo, entrada) está sabotando a sessão. É o assunto desta seção.

:::objetivos
- Ajustar comportamento do Proton com variáveis de ambiente documentadas
- Diagnosticar falhas de áudio e renderização com flags específicas
- Forçar o Proton a registrar qual componente falha
- Entender a diferença entre workaround e correção real
- Testar subsistemas de forma isolada
:::

## Variáveis que mudam o comportamento

Além de `PROTON_LOG` e `DXVK_ASYNC`, o Proton expõe uma família de variáveis de ambiente que você escreve nas opções de launch, sempre antes do `%command%`. Elas desligam ou forçam componentes específicos, servindo ora de correção, ora de ferramenta de diagnóstico.

```bash
PROTON_NO_ESYNC=1 PROTON_NO_FSYNC=1 %command%
```

As tecnologias `esync` e `fsync` aceleram a emulação de sincronização de threads do Windows. Raramente dão problema, mas quando um título exibe travamentos aleatórios ou falha logo ao abrir, desligá-las é um teste rápido e reversível.

:::info
`esync` emula primitivas de sincronização usando `eventfd`; `fsync` usa a extensão `futex_waitv` do kernel. Ambas evitam custos caros, mas dependem de recursos do kernel Linux e da configuração do SteamOS. Desabilitá-las tende a deixar o jogo mais lento, mas mais estável em títulos problemáticos.
:::

## Desligando a aceleração para isolar o culpado

O padrão "desligue a aceleração, observe, depois religue" é a ferramenta mais barata de isolamento. Três variáveis cobrem os subsistemas principais:

```bash
PROTON_USE_WINED3D=1 %command%
PROTON_NO_D3D10=1 PROTON_NO_D3D11=1 %command%
```

A primeira já foi usada para vídeo (força OpenGL). A segunda desliga o suporte a Direct3D 10/11, o que joga o jogo para um caminho mais antigo de renderização — útil quando artefatos visuais aparecem só na API nova. Se o problema some, você aprendeu em qual API ele vive.

:::atencao
Essas variáveis **não** corrigem o jogo — elas isolam a causa. Rodar o jogo permanentemente em modo de compatibilidade mais lento raramente é a solução ideal. Use-as para responder "onde está o bug?" e então procure a correção certa (versão GE, driver, patch).
:::

## Áudio que some ou estoura

Problemas de som no Proton quase sempre passam pelo XAudio/FAudio, a camada que traduz o áudio do XAudio2 (Windows) para o áudio nativo do Linux. Sintomas: sem som, som metálico, ou áudio que trava junto com o jogo. O log aponta o componente:

```terminal
$ PROTON_LOG=1
$ grep -iE 'xaudio|faudio|audio|pulse|pipewire' ~/steam-<appid>.log | head
fixme: xaudio2: IXAudio2Impl_Initialize
err:  FAudio: Unable to initialize audio engine
```

A mensagem `Unable to initialize audio engine` indica que o FAudio não conseguiu acessar o servidor de som do SteamOS. Para alguns títulos antigos, instalar o componente `xact` resolve; para outros, o problema está no servidor de áudio em si, e vale conferir o que o sistema reporta:

```terminal
$ pactl info | head -4
Server String: /run/user/1000/pulse/native
Server Name: PulseAudio (on PipeWire 0.3.100)
...
```

No SteamOS, o som roda sobre PipeWire (que emula a interface PulseAudio). Se o `pactl info` responde, o servidor está vivo e o problema está na camada do jogo — aí o `xact` ou a troca de Proton entram em campo.

## Exigindo um registro mais completo

Quando o log padrão não basta, você pode elevar a verbosidade do Wine para ver cada detalhe do que o processo faz. A combinação de variáveis `WINEDEBUG` controla isso:

```bash
PROTON_LOG=1 WINEDEBUG=+loaddll %command%
```

O `+loaddll` registra toda DLL carregada e descarregada, em ordem. É verboso demais para o dia a dia, mas inestimável quando você suspeita que uma DLL errada está sendo carregada (por exemplo, a versão do prefixo em vez da do Proton).

```terminal
$ WINEDEBUG=+loaddll PROTON_LOG=1 ls ~/steam-<appid>.log
steam-<appid>.log
$ grep -i 'trace:loaddll' ~/steam-<appid>.log | head
trace:loaddll:build_module Loaded L"C:\\windows\\system32\\msvcp140.dll" at 0x000000000
...
```

:::perigo
`WINEDEBUG=+all` registra absolutamente tudo e pode gerar um log de centenas de megabytes, além de deixar o jogo muito mais lento. Nunca use `+all` num teste comum — canalize para um canal específico como `+loaddll`, `+d3d` ou `+xaudio2`.
:::

## Workaround versus correção

Vale encerrar com uma distinção que evita manutenção interminável. Um **workaround** (como forçar OpenGL, desligar esync, ou rodar em modo antigo) contorna o sintoma deixando o problema vivo. Uma **correção** (trocar para a versão GE que contém o patch, atualizar a Mesa, esperar o fix no Proton) elimina a causa. Guie-se por esta regra:

- Se o workaround custa desempenho, trate-o como temporário.
- Anote o workaround num lugar que você vai reencontrar (a descrição das opções de launch serve).
- Revise a cada atualização do Proton se o problema original já tem correção oficial.

## Resumo

- Variáveis de ambiente do Proton vão antes do `%command%` nas opções de launch.
- `PROTON_NO_ESYNC=1`/`PROTON_NO_FSYNC=1` testam estabilidade de sincronização de threads.
- `PROTON_USE_WINED3D=1` e `PROTON_NO_D3D10/11` isolam a API gráfica responsável.
- Erros de áudio passam por XAudio/FAudio; `pactl info` confirma se o servidor PipeWire está vivo.
- `WINEDEBUG=+loaddll` registra o carregamento de cada DLL; `+all` deve ser evitado.
- Workarounds são temporários; correção elimina a causa e deve ser revisitada a cada atualização.

## Exercícios

1. Ative `PROTON_LOG=1` num jogo com áudio e grep` por `xaudio`/`faudio` no log para mapear o caminho do som.
2. Rode `pactl info | head -5` e confirme o servidor de som (PipeWire) ativo no seu Deck.
3. Teste `PROTON_NO_ESYNC=1 PROTON_NO_FSYNC=1 %command%` num título com travamento aleatório e compare a estabilidade ao longo de 10 minutos.
4. Use `WINEDEBUG=+loaddll` e liste, pelo log, as cinco primeiras DLLs carregadas — são do prefixo ou do Proton?
5. **Desafio.** Um jogo mostra artefatos visuais. Desligue D3D10/11 com as variáveis, confirme a mudança no log, e conclua em qual API o artefato vive. Depois proponha, justificando, se a troca para Proton GE é workaround ou correção para esse caso.
