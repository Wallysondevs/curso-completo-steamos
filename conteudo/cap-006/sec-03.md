O botão `...` (os três pontinhos, à direita, junto ao alto-falante) abre o **Quick Access Menu** — o menu rápido. É a peça mais subestimada do Deck e, ao mesmo tempo, a que você mais vai usar ao longo da vida do aparelho, porque ele responde às situações do momento: aumentar o brilho na janela, pausar uma captura, ver quem entrou online, checar a bateria. Tudo isso sem fechar o jogo. Conhecer cada aba dele é ganhar segundos em cada sessão.

:::objetivos
- Entender a função do menu rápido e por que ele sobrepõe o jogo
- Navegar pelas abas de desempenho, bateria e brilho
- Ajustar o overlay de desempenho (FPS, CPU, GPU)
- Controlar notificações e estado online rapidamente
- Identificar onde essas preferências são persistidas no disco
:::

## Por que o menu rápido existe

Num desktop, ajustar o brilho ou ver a temperatura exige sair do jogo e abrir um app. No Steam Deck, a Valve entendeu que o jogador em tela cheia precisa desses controles **sem perder o contexto**. Por isso o menu rápido é um *overlay*: ele é desenhado por cima da imagem do jogo pelo próprio Gamescope, que continua renderizando o jogo por baixo. Você aperta `...`, o painel desliza da direita, e o jogo segue rodando a 60 FPS atrás dele.

Essa coexistência não é trivial tecnicamente. O Gamescope mantém duas superfícies: a do jogo e a do painel do Steam. Quando o menu abre, o jogo não é "pausado" pelo sistema — ele só perde o foco de input. Isso significa que um jogo *online* ou *always-online* (como um MMO) **continua rodando** enquanto você mexe no menu rápido. É uma diferença de comportamento em relação ao menu `[[Steam]]`, que em muitos títulos pausa o jogo por padrão (porque dispara o suspend do processo via Steam).

:::atencao
Em jogos multiplayer, abrir o menu rápido **não** pausa a partida. Se você precisar se afastar, use o menu `[[Steam]]` e o **Suspend** (ou feche o jogo). O menu rápido é para ajustes de 5 segundos, não para uma pausa de 10 minutos.
:::

## As abas, da esquerda para a direita

O menu rápido é organizado em uma linha vertical fixa de abas, acessadas com o analógico. A ordem padrão é:

1. **Notificações** — sino no topo (em versões recentes aparece integrado à primeira aba).
2. **Amigos** — lista de amigos online, convites de grupo.
3. **Desempenho** — o *overlay* de FPS e o limitador de frame.
4. **Configurações rápidas** — Wi-Fi, Bluetooth, brilho, volume, modo avião.
5. **Bateria** — percentual, tempo restante estimado, perfil de consumo.

O layout exato varia levemente entre builds (a Valve reorganiza essas abas com frequência), mas esse conjunto cobre o essencial. A ordem reflete prioridade de acesso: notificações e amigos primeiro porque são "agora", desempenho e hardware depois porque são "durante o jogo".

## Desempenho: o overlay de FPS em detalhe

A aba **Desempenho** merece um mergulho, porque é onde mora o *framerate limiter* e o overlay de telemetria. Você pode:

- **Limitar FPS** a 30, 40 ou 60 (além de "ilimitado"). Isso é feito pelo Gamescope, não pelo jogo — por isso funciona em qualquer título.
- **Ativar o overlay de desempenho** em quatro níveis de detalhe (de "só FPS" até CPU/GPU/temperatura/RAM por núcleo).
- **Ligar FSR** (escalonamento por software) quando o jogo roda em resolução baixa e precisa esticar para a tela.

O overlay de telemetria, ativado no nível máximo, desenha dados em cima do canto da tela. Por baixo, quem alimenta esses números não é o Steam: são arquivos do kernel e sensores. O Gamescope lê estatísticas de GPU via `/sys/class/drm` e de CPU via `/proc`, e apresenta em tempo real. Você pode confirmar a fonte desses números fora do jogo:

```terminal
$ cat /sys/class/drm/card0/device/gpu_busy_percent
42
$ sensors | grep -E 'temp1|Tctl'
temp1:        +58.0°C  (crit = +100.0°C)
Tctl:         +58.8°C
```

O primeiro valor (`gpu_busy_percent`) é a ocupação da GPU em percentual — o mesmo número que o overlay mostra como "GPU". O `sensors` (do pacote `lm-sensors`) lê a temperatura do SoC; é o "temperatura" do overlay. Saber a origem desses dados evita a impressão de que o overlay "inventa" números: são leituras reais do hardware, apenas apresentadas com uma fonte bonita.

## Bateria e brilho: onde a preferência fica salva

Os sliders de **brilho** e **volume** e o seletor de **perfil de energia** parecem efêmeros, mas várias dessas escolhas são persistidas. O Steam guarda o volume e o brilho por sessão e, em parte, no `localconfig.vdf`. Já o **limite de FPS** e o **perfil de TDP** (o consumo de energia do processador) podem ser configurados por jogo e ficam vinculados ao `appid`.

Uma forma de ver o estado da bateria sem depender da interface é consultar o sysfs, o mesmo mecanismo que o menu rápido usa por baixo:

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
86
$ cat /sys/class/power_supply/BAT1/status
Charging
```

`capacity` é o percentual e `status` o estado (Charging/Discharging/Full). O valor `86` aqui bate com o que o menu rápido mostraria. Vale notar que o "tempo restante estimado" que o Deck exibe é uma estimativa do próprio SteamOS sobre essas leituras e o histórico de uso — ele oscila, então trate-o como aproximação.

:::dica
Para economizar bateria de forma agressiva durante uma viagem, desça o brilho ao mínimo confortável, limite o FPS a 40 e ative o perfil de TDP mais baixo na aba Desempenho. Isso reduz o calor e o consumo sem mexer em nada que danifique o aparelho.
:::

## Notificações e estado online sem sair do jogo

Da aba **Amigos** do menu rápido você altera seu estado online (Online, Ausente, Invisível) e vê a lista de amigos, sem nunca abandonar a partida. A aba **Notificações** mostra convites de grupo, mensagens e conquistas. É o mesmo backend de *chat* do desktop Steam, então o comportamento é idêntico ao que você conhece do PC, apenas redirecionado para a interface de gamepad.

Um detalhe técnico relevante: o chat e as notificações trafegam por conexões persistentes do cliente Steam (o processo `steamwebhelper` que você viu na primeira seção). Se as notificações param de chegar mas o jogo online funciona, geralmente é problema de sessão do *friendui* (a interface de amigos), e um `journalctl` aponta o sintoma:

```terminal
$ journalctl -u steam 2>/dev/null | grep -iE 'friend|chat|network' | tail -8
```

Nem sempre há saída (o `-u steam` depende de o serviço systemd estar nomeado assim), mas quando o friendui reconecta, linhas de reconexão de amigo/log aparecem ali. O tratamento aprofundado de diagnóstico fica para a última seção do capítulo.

## Resumo

- O menu rápido (`...`, QAM) é um overlay do Gamescope que sobrepõe o jogo sem pausá-lo.
- As abas são, em ordem: notificações, amigos, desempenho, configurações rápidas e bateria.
- O limitador de FPS e o FSR são aplicados pelo Gamescope, não pelo jogo — por isso valem para qualquer título.
- O overlay lê dados reais de GPU (`/sys/class/drm/.../gpu_busy_percent`) e temperatura (`sensors`).
- A bateria vem do sysfs `power_supply` (`capacity`, `status`); o tempo restante é estimativa.
- Em jogos multiplayer, o menu rápido não pausa a partida; use o menu `[[Steam]]` para suspender.

## Exercícios

1. Abra um jogo qualquer, aperte `...`, ative o overlay de desempenho no nível máximo e anote FPS, GPU e temperatura. Depois confira `gpu_busy_percent` e `sensors` no desktop para comparar os valores.
2. Limite o FPS a 40 no menu rápido e reinicie o jogo; verifique se o limite persiste antes e depois de um reboot.
3. Consulte `cat /sys/class/power_supply/BAT1/status` e compare com o que o Deck informa na aba Bateria no mesmo instante.
4. Mude seu estado online para "Invisível" pelo menu rápido e confirme no aplicativo Steam do celular que a mudança refletiu (teste de sincronia).
5. **Desafio.** Conecte a seção 1 a esta: identifique o PID do `gamescope` com `ps aux | grep gamescope` e explique, com base no conceito de overlay, por que o jogo continua renderizando mesmo com o menu rápido aberto. Use uma observação de FPS no overlay como evidência.
