Nenhum streaming é perfeito, e os sintomas de problemas — latência perceptível, áudio cortando, imagem borrada — têm causas específicas que podem ser isoladas com as ferramentas certas. Esta seção reúne um método de diagnóstico que vale para Chiaki, Greenlight, xbPlay e Moonlight. O objetivo é transformar um "stream está ruim" vago em uma causa identificada e uma correção precisa.

:::objetivos
- Usar ping, iperf3 e ferramentas do sistema para isolar problemas de rede
- Diagnosticar latência de input separada de latência de vídeo
- Identificar as causas de áudio robótico e dessincronizado
- Corrigir artefatos visuais e borrões por bitrate insuficiente
- Ler logs dos clientes de streaming para encontrar erros específicos
:::

## Método de isolamento: o teste dos três saltos

Todo streaming de console passa por três componentes: o **console** (envia o vídeo), a **rede** (transporta os dados) e o **cliente** (decodifica e exibe). A primeira etapa do diagnóstico é descobrir em qual desses três o problema mora.

```terminal
## Passo 1: medir a rede (faz o console + rede juntos)
$ ping -c 20 192.168.1.151
PING 192.168.1.151 (192.168.1.151) 56(84) bytes of data.
...
rtt min/avg/max/mdev = 1.20/2.85/15.40/3.12 ms

## Passo 2: medir a banda sustentável
$ iperf3 -c 192.168.1.151 -t 20 -R
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-20.00  sec   350 MBytes   147 Mbits/sec
```

A leitura do `ping` é reveladora. O `mdev` (desvio padrão da latência) alto — acima de 2 ms em rede cabeada — indica jitter, que causa engasgos periódicos. O `max` muito maior que o `avg` indica picos de latência, geralmente por interferência ou bufferbloat no roteador.

```terminal
## Passo 3: verificar a saúde do cliente durante o streaming
$ top -b -n 1 | head -15
top - 21:15:42 up 3 days,  5:12,  1 user,  load average: 2.31, 2.10, 1.98
Tasks: 190 total,   2 running, 188 sleeping,   0 stopped,   0 zombie
%Cpu(s):  8.4 us,  3.1 sy,  0.0 ni, 88.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  14641.6 total,   4217.2 free,   3122.8 used,   7301.6 buff/cache
```

Se a CPU do Deck está alta (acima de 60% de um núcleo) durante o streaming, o decoder pode estar em software em vez de hardware. Com o Chiaki4Deck e o Moonlight, o decoder de H.264/H.265 é sempre por hardware no Deck, então CPU alta indica outro processo roubando ciclos.

## Latência de input vs latência de vídeo

Nem toda latência percebida vem da rede. Distinguir a latência de **input** (tempo entre pressionar um botão e o jogo reagir) da latência de **vídeo** (tempo entre a ação acontecer e você vê-la) ajuda a direcionar a correção.

| Parâmetro | Fonte | Como medir | Correção |
|---|---|---|---|
| Latência de input | Rede (round-trip) + processamento do console | `ping` + overlay do cliente | Reduzir jitter, melhorar rota Wi-Fi |
| Latência de vídeo | Buffer do cliente + decode | Overlay de estatísticas | Reduzir buffer de áudio/vídeo |
| Latência de display | Painel + taxa de quadros | Difícil de medir no Deck | Ativar modo de baixa latência do jogo |

```terminal
## Overlay de estatísticas no Moonlight:
## [[Ctrl]]+[[Alt]]+[[Shift]]+[[S]] ativa o overlay em tempo real
## Mostra: latência de rede, tempo de decode, jitter do encoder

## No Chiaki, o log detalhado mostra a latência:
$ flatpak run io.github.streetpea.Chiaki4Deck --log-level debug 2>&1 | grep -i latency
[DEBUG] Session latency: 16 ms network, 4 ms decode, 20 ms total
```

:::info
Latência total aceitável para jogos de ação é abaixo de 40 ms (input + vídeo + display). Entre 40 e 80 ms, apenas jogos casuais ficam confortáveis. Acima de 80 ms, apenas jogos de estratégia por turnos permanecem agradáveis.
:::

## Áudio robótico, cortes e dessincronia

Problemas de áudio são os mais comuns e geralmente os mais fáceis de corrigir. O sintoma "áudio robótico" (metálico, como um rádio com interferência) quase sempre indica **perda de pacotes de áudio**, enquanto "cortes" (breves silêncios) indicam **buffer insuficiente**.

```terminal
## Verificar perda de pacotes UDP especificamente:
$ ping -c 50 -i 0.1 192.168.1.151
...
50 packets transmitted, 48 received, 4% packet loss, time 5005ms
```

4% de perda de pacotes já é suficiente para causar áudio robótico perceptível em streaming — mesmo quando o vídeo parece aceitável, porque o protocolo prioriza vídeo sobre áudio na reconstrução.

```terminal
## Aumentar o buffer de áudio no Chiaki:
## Configurações do console > Audio Buffer Size
## De 4000 → 8000 → 12000 até o áudio estabilizar

## No Moonlight, o buffer é ajustado em:
## Settings > Audio > "Audio buffer" (padrão 10-20 ms)
```

:::dica
O áudio no SteamOS passa pelo PulseAudio/PipeWire antes de chegar aos alto-falantes. Se houver conflito com outro aplicativo usando áudio, use `pactl list short sinks` para ver o dispositivo ativo e `pactl set-default-sink` para forçar o correto.
:::

## Artefatos visuais e borrões

Artefatos visuais têm padrões reconhecíveis que apontam para causas diferentes:

| Sintoma | Causa | Correção |
|---|---|---|
| Blocos quadrados em movimento | Bitrate insuficiente | Aumentar bitrate ou reduzir resolução |
| Borrão geral (sem blocos) | Upscaling de resolução baixa | Aumentar resolução |
| Linhas horizontais/tearing | Decode sem vsync | Ativar vsync no cliente |
| Congelamento momentâneo | Perda de pacotes em rajada | Melhorar estabilidade da rede |
| Cores erradas/dessaturadas | Range de cor (limited vs full) | Ajustar color range no cliente |

```terminal
## Testar range de cor (problema típico de "preto acinzentado"):
## Chiaki: Settings do console > Video > Color Range > Full RGB
## Moonlight: Settings > Video > "Full range color"
```

O sintoma de "preto acinzentado" ou "branco apagado" é um classicismo de streaming: o cliente aplica range limitado (16-235) quando deveria aplicar full (0-255), ou vice-versa. Alternar essa opção resolve na maioria dos casos.

## Lendo logs dos clientes

Todos os clientes Flatpak registram logs que podem ser acessados pelo terminal. Ao rodar com `--log-level debug`, cada cliente expõe códigos de erro que direcionam a correção:

```terminal
## Chiaki:
$ flatpak run io.github.streetpea.Chiaki4Deck --log-level debug

## Moonlight:
$ flatpak run com.moonlight_stream.Moonlight --log-level debug

## Greenlight:
$ flatpak run io.github.unknownskl.greenlight --log-level debug
```

Erros comuns nos logs e seus significados:

```terminal
## Chiaki:
[ERROR] CEControl: received packet with unknown type    → versão incompatível
[ERROR] OpusDecoderInit: failed                          → codec de áudio ausente
[ERROR] VideoDecoder: H265 not supported                 → decoder ausente no host

## Moonlight:
[ERROR] Unable to connect to host                       → host inacessível
[ERROR] RTSP handshake failed                          → pareamento expirado
```

:::atencao
Se um cliente funcionava e parou de funcionar após uma atualização do SteamOS, o primeiro passo é rodar `flatpak update` e verificar se o cliente tem uma versão compatível com a nova base do sistema. A Valve ocasionalmente muda bibliotecas base (como o Mesa, responsável pelo decode) e clientes desatualizados param de funcionar.
:::

## Resumo

- O diagnóstico de streaming segue o método dos três saltos: console, rede e cliente — isole cada um antes de corrigir.
- Latência de input, de vídeo e de display são fenômenos distintos, cada um com sua correção específica.
- Áudio robótico indica perda de pacotes; cortes indicam buffer insuficiente; ambos têm correções diretas.
- Artefatos visuais têm padrões reconhecíveis (blocos, borrão, tearing, cores erradas) que mapeiam para causas específicas.
- Logs dos clientes com `--log-level debug` revelam códigos de erro que aceleram o diagnóstico.

## Exercícios

1. Execute o teste dos três saltos em seu setup: `ping -c 20`, `iperf3 -t 20 -R` e `top` durante o streaming. Documente cada medição e classifique sua rede.
2. Ative o overlay de estatísticas do Moonlight (se usar Moonlight) e identifique os componentes da latência total (rede, decode, jitter). Qual é o maior contribuidor?
3. Reproduza áudio robótico reduzindo o buffer de áudio ao mínimo no Chiaki. Em seguida, aumente-o progressivamente até o áudio estabilizar. Qual valor se mostrou suficiente?
4. Teste a correção de "preto acinzentado": alterne entre Full RGB e Limited RGB no cliente e descreva a diferença visual em uma cena escura.
5. **Desafio.** Escreva um script de diagnóstico que execute automaticamente `ping`, `iperf3` e leia os logs do cliente, produzindo um relatório com a causa mais provável do problema de streaming e a correção sugerida. O script deve aceitar o IP do console como argumento.