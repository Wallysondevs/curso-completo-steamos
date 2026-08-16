O overlay só serve a quem sabe ligá-lo na hora certa — e, mais importante, a quem sabe desligá-lo depois. A ativação no Modo Jogo é feita inteiramente pela interface, sem terminais, mas o caminho exato tem suas pegadinhas: as opções ficam escondidas atrás de um menu que muda de posição conforme a versão do SteamOS, e há um limite de potência que, se ignorado, desliga o medidor sozinho.

:::objetivos
- Ativar o overlay de desempenho pelo botão `...`
- Alternar entre os quatro níveis pela barra deslizante
- Ligar e desligar o overlay em tempo real durante o jogo
- Entender onde as métricas aparecem na tela
:::

## O caminho até o painel de desempenho

O controle do overlay não fica nas configurações gerais do Steam (as que você encontra no menu da Steam com o botão de liga/desliga, no Modo Jogo), e sim num painel lateral que só aparece com o sistema já ligado num jogo. Esse é o erro mais comum de quem procura: vasculhar os menus de Configurações e não achar nada, porque o overlay é uma opção *de sessão*, ligada ao jogo que está aberto, não uma preferência global.

O caminho é este:

1. Entre num jogo e espere ele carregar (o overlay pode não responder direito na tela de menu do jogo em alguns títulos).
2. Aperte o botão `...` — o botão de três pontinhos, localizado abaixo do touchpad direito, à direita do botão Steam.
3. No painel vertical que se abre à direita, procure o ícone de **bateria**. Ele abre o submenu de **desempenho**.
4. Dentro do submenu, a primeira opção é o **nível do overlay de desempenho**, com uma barra deslizante.

A barra deslizante é o mecanismo de alternância entre os níveis: arraste para a esquerda para desligar (nível "desligado") ou para a direita até o nível 4.

```terminal
$ # O overlay não aparece em terminal; o "comando" aqui é a descrição do estado
$ # nivel 0 : desligado
$ # nivel 1 : ligado - somente FPS
$ # nivel 2 : ligado - FPS, frametime, CPU, GPU
$ # nivel 3 : ligado - + RAM, VRAM, temperatura
$ # nivel 4 : ligado - + bateria, potência e gráficos
```

Repare que não existe "nível 0" no jargão oficial; o SteamOS se refere ao estado desligado simplesmente como o botão no mínimo. A enumeração de 1 a 4 é a que aparece quando você conta as posições úteis da barra.

## Ligando e vendo na mesma tela

A grande vantagem do overlay do SteamOS é que a mudança é instantânea. Você não precisa sair do jogo, nem reiniciar, nem tocar em arquivo de configuração. Arraste a barra e, no mesmo segundo, os números pulam na tela — no canto superior esquerdo, por padrão.

```terminal
$ # Sequência típica de uma sessão de diagnóstico:
$ # 1. Jogo aberto, aperte "..."
$ # 2. Bateria -> Desempenho -> arrastar overlay para nivel 2
$ #    -> a tela passa a mostrar: FPS 58 | frametime 17.2ms | CPU 41% | GPU 99%
$ # 3. Arrastar para nivel 4
$ #    -> somam-se RAM, VRAM, temperaturas e o histórico em gráfico
$ # 4. Ao terminar, arrastar de volta para "desligado"
```

A posição do texto, o tamanho e a fonte mudam ligeiramente entre versões do SteamOS, mas o canto superior esquerdo é o padrão estável desde o lançamento do Deck. O nível 4, por usar gráficos de histórico, ocupa uma área maior e pode cobrir elementos da interface do próprio jogo — por isso o nível 4 é mais útil para diagnóstico do que para uso contínuo.

:::atencao
Se você ativar o overlay e ele **sumir sozinho** alguns segundos depois, o motivo mais comum é o **limite de potência TDP** baixo demais. Quando você limita o TDP do processador a um valor muito restrito (por exemplo, 3 W), o gamescope pode não ter folga para desenhar o overlay de forma estável, e ele pisca ou some. Aumente o TDP ou desative o limite temporariamente e o medidor volta. Esse comportamento varia conforme a versão do SteamOS.
:::

## Métricas que dependem de contexto

Nem toda métrica aparece em todo jogo. O overlay lê o que o sistema expõe e o que o jogo permite enxergar, então há variações legítimas de título para título:

- **FPS e frametime** dependem de o jogo rodar com a API Vulkan ou pelo menos de o gamescope conseguir medir a taxa de apresentação. Jogos muito antigos com OpenGL podem apresentar leitura instável.
- **Temperatura e potência** vêm de sensores da placa (a APU da AMD), expostos via `hwmon`. No SteamOS eles estão sempre disponíveis.
- **Uso de GPU e CPU** são percentuais agregados, não por núcleo, nos níveis 2 e 3.

```terminal
$ ls /sys/class/hwmon/
hwmon0
hwmon1
hwmon2
hwmon3
hwmon4
```

Cada pasta `hwmonN` corresponde a um conjunto de sensores. O overlay consome exatamente essas fontes — a mesma informação que os comandos de terminal leem nas seções seguintes. Saber disso ajuda a entender por que o número do overlay às vezes difere ligeiramente de uma leitura feita por outra ferramenta: são instantâneos tirados em milissegundos diferentes.

:::dica
Não deixe o overlay ligado o tempo todo. Além de cobrir parte da tela, o próprio desenho dos números e dos gráficos consome um pouco de CPU. Em jogos no limite do desempenho — rodando perto de 30 FPS no Deck — esse custo extra pode ser a diferença entre travar e não travar. Ligue para diagnosticar, desligue para jogar.
:::

## Alternativas de acesso

O botão `...` é o caminho oficial, mas não é o único. Há duas rotas que ajudam em situações específicas.

A primeira é o **modo de desempenho por jogo**. Você pode fixar um nível de overlay para um jogo específico: abra o jogo, entre no painel de desempenho e ative a opção de salvar aquele perfil para aquele título. Na próxima execução, o overlay já abre no nível escolhido, sem tocar em nada.

A segunda é entender que, fora do Modo Jogo, esse painel não existe — e é exatamente aí que o MangoHud entra, como veremos na última seção. Por ora, grave que overlay nativo = Modo Jogo; MangoHud = Modo Desktop.

```terminal
$ # Confirmando se há jogos abertos e em qual sessão você está
$ loginctl list-sessions
SESSION  UID USER  SEAT  TTY
  c1     1000 deck       seat0
  c2     1000 deck       seat0
```

A sessão `c1` costuma ser o Modo Jogo (gamescope) e `c2` o Desktop de uma sessão anterior. Não é regra universal, mas observar o `loginctl` ajuda a ter noção de qual ambiente está de pé.

## Resumo

- O overlay é ativado pelo botão `...`, no painel de bateria/desempenho, e é uma opção por sessão de jogo, não uma preferência global.
- A barra deslizante alterna entre desligado e os níveis 1 a 4, com efeito imediato na tela.
- O texto aparece no canto superior esquerdo por padrão; o nível 4 inclui gráficos de histórico.
- Um limite de TDP muito agressivo pode fazer o overlay sumir; aumente o TDP para recuperá-lo.
- O overlay nativo só existe no Modo Jogo; no Desktop usa-se o MangoHud.

## Exercícios

1. Entre num jogo, aperte `...` e localize o ícone de bateria. Ative o overlay no nível 1 e desligue de novo, em menos de 10 segundos.
2. Percorra a barra do nível 1 ao 4 lentamente, anotando em cada posição qual métrica nova aparece.
3. Fixe um perfil de overlay para um jogo, reinicie o jogo e confirme que o overlay abre sozinho no nível escolhido.
4. Reduza o TDP para 3 W e observe o comportamento do overlay no nível 4. Depois restaure o TDP e note a diferença.
5. **Desafio.** No Modo Desktop, rode `loginctl list-sessions` e tente identificar qual sessão corresponde ao Modo Jogo em execução, cruzando com o que viu no jogo aberto.
