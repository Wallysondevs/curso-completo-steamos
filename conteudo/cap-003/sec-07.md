Em junho de 2019, a Valve anunciou o **Valve Index**, seu headset de realidade virtual de alta fidelidade, acompanhado dos controles "Knuckles" que rastreiam cada dedo individualmente. O Index nunca foi um produto de massa — custava US$ 999 no kit completo —, mas consolidou a Valve como uma empresa que também constrói tecnologia de ponta quando quer. Para o ecossistema Steam, o Index representou a entrada definitiva da Valve em mais uma camada de hardware, e o SteamVR se tornou o padrão de fato para realidade virtual em PC.

:::objetivos
- Entender o papel do Valve Index no portfólio de hardware da Valve
- Conhecer os componentes do kit Index e suas inovações
- Saber onde o SteamVR vive no sistema e como se relaciona com Proton
- Reconhecer o estado do VR no Linux e no SteamOS
:::

## Por que a Valve entrou no VR

A Valve vinha flertando com realidade virtual desde antes do Index. Em 2015, ela trabalhou com a HTC no lançamento do HTC Vive, cedendo a tecnologia de rastreamento Lighthouse (as estações-base que localizam o headset e os controles no espaço). Depois da parceria, a Valve decidiu que queria o próprio hardware, e o resultado foi o Index.

O Index foi desenhado para resolver as queixas dos entusiastas contra a primeira geração de headsets: taxa de atualização baixa, campo de visão limitado, áudio ruim e controles que não envolviam a mão. Em vez de segmentar o consumidor casual, a Valve mirou o topo — quem já estava disposto a gastar mais para ter o melhor.

## O hardware do Index, em números

O kit Index é composto por quatro elementos que se vendiam juntos (ou separados): o headset, os dois controles Knuckles e duas estações-base.

| Componente | Destaque técnico |
|---|---|
| Headset | Tela LCD dupla, 144 Hz, campo de visão ~130°, IPD ajustável |
| Áudio | Alto-falantes intra-aurais (off-ear), sem tocar a orelha |
| Controles Knuckles | Rastreamento de dedo individual por sensores de capacitância |
| Estações-base 2.0 | Rastreamento externo por lasers, precisa e sem câmera |

O recurso mais simbólico eram os **alto-falantes off-ear**: em vez de fones que pressionam a orelha, dois drivers flutuam perto dela, espalhando o som naturalmente. Isso reduz o calor, o cansaço e o isolamento, e virou uma assinatura do Index. Os controles Knuckles, por sua vez, permitiam que o jogo soubesse a posição de cada dedo — você "pegava" objetos virtuais abrindo e fechando a mão, sem precisar apertar um botão.

## SteamVR: a camada de software

Todo headset compatível com o Steam roda sobre o **SteamVR**, o runtime de realidade virtual da Valve. No seu SteamOS (e em qualquer Linux com Steam), o SteamVR fica dentro da estrutura do Steam e expõe arquivos de configuração, logs e ferramentas de diagnóstico.

```terminal
$ ls ~/.steam/steam/steamapps/common/
SteamVR
SteamLinuxRuntime_soldier
...
$ ls ~/.steam/steam/steamapps/common/SteamVR/
bin
drivers
resources
tools
```

O diretório `drivers` contém os drivers de headset e de rastreamento; `resources` guarda configurações e assets; `tools` traz utilitários como o rastreador de desempenho. O SteamVR comunica-se com o headset por um processo que você consegue ver rodando quando o VR está ativo.

```terminal
$ pgrep -af vr*
5892 /home/deck/.steam/steam/steamapps/common/SteamVR/bin/linux64/vrserver
5918 /home/deck/.steam/steam/steamapps/common/SteamVR/bin/linux64/vrmonitor
```

O `vrserver` é o processo central do SteamVR: ele gerencia o estado do headset e dos controladores, calcula o rastreamento e serve os clientes (os jogos). O `vrmonitor` cuida do painel de status e do desligamento/repouso do headset. Se um desses processos cair, o VR inteiro cai junto.

## VR no Linux: promessa e atrito

O SteamVR tem suporte oficial ao Linux desde 2017, anos antes do Proton. Isso fez do Linux uma plataforma viável para VR mais cedo do que para jogos planos. O problema é que o suporte ficou estagnado: a maioria dos jogos de VR existe só para Windows, e rodá-los no Linux exige Proton — que, no contexto de VR, é menos testado e menos confiável.

O Steam Deck, especificamente, não é um dispositivo de VR. Ele não tem potência bruta para os jogos de realidade virtual pesados, e a Valve nunca prometeu suporte a Index no Deck. É possível, tecnicamente, conectar um Index a um Deck e iniciar o SteamVR, mas a experiência fica muito aquém do mínimo confortável. Para VR sério, o caminho é um desktop forte.

:::atencao
Não espere rodar Valve Index bem no Steam Deck. A GPU integrada do Deck foi otimizada para 800p em tela plana, não para renderizar duas imagens em alta taxa de atualização. Tentar VR no Deck leva a taxas de quadros baixas e enjoo — trate isso como curiosidade técnica, não como uso real.
:::

## O que o Index diz sobre a Valve

O Index revela o padrão da Valve no hardware: a empresa não busca volume, busca demonstrar possibilidade. O Index não vendeu milhões, mas estabeleceu o padrão de referência em rastreamento e áudio que influenciou o mercado. O mesmo vale para o Steam Controller (que ensinou sobre trackpads) e para o Steam Deck (que dominou o nicho de PCs portáteis).

Para o ecossistema Steam, o Index é mais uma peça que estende o alcance da plataforma: um jogador que compra um Index fica preso ao SteamVR e, por consequência, ao Steam. É a mesma lógica do Deck e do Steam Link — cada hardware novo é uma âncora que puxa o usuário para dentro do ecossistema.

:::info
A Valve lançou ainda o **Steam Grid**? Não — a confusão comum é com o *Big Picture Mode* e com a interface de biblioteca do Steam, chamada informalmente de "grid view". "Steam Grid" não é um produto oficial; o termo que circula na comunidade às vezes se refere à reorganização visual da biblioteca. O correto, para a interface de sofá, é **Big Picture Mode**.
:::

## Resumo

- O Valve Index (2019) consolidou a entrada da Valve no hardware de realidade virtual.
- Áudio off-ear e controles Knuckles foram as inovações assinatura do Index.
- SteamVR é o runtime de VR; no sistema, seus binários ficam em `steamapps/common/SteamVR`.
- `vrserver` e `vrmonitor` são os processos centrais do SteamVR.
- VR no Linux existe, mas no Steam Deck é inviável na prática.

## Exercícios

1. Liste o conteúdo de `~/.steam/steam/steamapps/common/SteamVR/` e descreva a função de cada subdiretório.
2. Explique a diferença entre o rastreamento externo (Lighthouse) do Index e o rastreamento "de dentro para fora" de outros headsets.
3. Pesquise o preço de lançamento do kit Index e compare com o de outros headsets contemporâneos.
4. Identifique, usando `pgrep -af vr`, os processos do SteamVR e explique o papel de cada um.
5. **Desafio.** Instale o SteamVR no seu SteamOS (mesmo sem headset) e tente iniciá-lo. Registre o que acontece — incluindo a mensagem de erro quando não há headset conectado — e relacione com a limitação de VR no Deck.