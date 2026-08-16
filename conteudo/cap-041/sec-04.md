O Feral GameMode é uma camada que ajusta o comportamento do sistema operacional durante o jogo: ele pede ao kernel um agendador mais agressivo, evita que a CPU baixe a frequência no meio da ação e gerencia a política de energia enquanto você joga. No Steam Deck ele já vem instalado, e no desktop é um pacote separado. A forma mais comum de usá-lo na Steam é prefixar o comando com `gamemoderun`.

:::objetivos
- Entender o que o Feral GameMode ajusta no sistema durante o jogo
- Distinguir o comando `gamemoderun` do daemon `gamemoded`
- Verificar se o GameMode está ativo e aplicando as otimizações
- Configurar o GameMode no Steam Deck
- Medir se o ganho de desempenho é perceptível
:::

## O que o GameMode faz quando está ativo

GameMode não é mágica: ele é um conjunto de ajustes bem específicos, empacotados pela Feral Interactive. Ao ser ativado, ele pede a troca do **governador de CPU** para `performance`, ajusta a prioridade de entrada/saída do jogo e informa o compositor gráfico para liberar o caminho. O objetivo é remover os pequenos atritos que estragam a consistência de quadros.

No desktop Linux com systemd, o GameMode roda como um daemon (`gamemoded`) e o `gamemoderun` é o invólucro que avisa a esse daemon "o jogo começou/terminou". A combinação dos dois:

```text
gamemoderun %command%
```

Na Steam, você cola isso no campo de Inicialização do jogo. O `gamemoderun` inicia o processo, pede ao `gamemoded` que ative as otimizações, executa o jogo e, ao final, restaura o estado.

:::nota
O nome "Feral" vem da Feral Interactive, estúdio que porta jogos para Linux e que liberou o GameMode como código aberto. Hoje ele é mantido como projeto independente e usado por várias distribuições, não só para jogos da Feral.
:::

## Verificando se está rodando

O primeiro teste é perguntar ao daemon qual é o estado atual:

```terminal
$ gamemoded -s
gamemode is active
```

Se o daemon não estiver rodando, a resposta é outra:

```terminal
$ gamemoded -s
gamemode request failed: The name com.feralinteractive.GameMode was not provided by any .service files
```

Essa mensagem significa que o serviço `gamemoded` não está ativo no systemd. No Steam Deck ele costuma vir habilitado, mas em desktops às vezes é preciso iniciá-lo. Para conferir o serviço e o cliente:

```terminal
$ systemctl --user status gamemoded | head -4
● gamemoded.service - GameMode Daemon
     Loaded: loaded (/usr/lib/systemd/user/gamemoded.service; enabled)
     Active: active (running)
```

Repare que é um serviço de **usuário** (`--user`), não de sistema. Ele acompanha a sessão do usuário logado, o que faz sentido: é um ajuste de sessão, não do hardware.

## O que o `gamemoderun` não faz

É comum esperar um ganho gigante de FPS ao usar GameMode, e a realidade é mais modesta. GameMode melhora a *consistência* (menos quedas de quadro, menos microtravadas), não necessariamente o pico de FPS. Em hardware parrudo, o efeito pode ser invisível; em hardware limitado como o Deck, os ajustes de governador de CPU e prioridade de I/O têm mais peso.

Ele também **não** faz overclock, não libera memória de forma mágica e não conserta jogos mal otimizados. É uma camada de polimento, não uma varinha.

```terminal
$ gamemodeclient -l
gamemode is active
```

O `gamemodeclient` é quem fala com o daemon; a opção `-l` lista o estado. Serve para você conferir de um terminal, enquanto o jogo está rodando em outra janela.

:::atencao
Não rode dois ajustadores de CPU ao mesmo tempo. Se você usa ferramentas como TLP, `cpupower` manual ou o próprio limitador de TDP do SteamOS, o GameMode pode brigar com elas pelo governador. Escolha uma camada de gerência de energia por vez.
:::

## Configurando quando ele entra em ação

O GameMode aceita um arquivo de configuração por usuário, onde dá para ajustar em quais condições ele ativa. O arquivo padrão fica em `/etc/gamemode.ini`, e uma cópia do usuário em `~/.config/gamemode.ini` tem precedência:

```ini
[general]
renice=10
desiredgov=performance
softrealtime=auto
```

Cada chave controla um comportamento. `renice` altera a prioridade de escalonamento do processo (valores negativos = mais prioridade), `desiredgov` força o governador de CPU desejado e `softrealtime` decide se o jogo ganha características de tempo real suave. Estes são exemplos ilustrativos da estrutura do arquivo; os valores exatos dependem do seu caso de uso.

:::dica
Se você só quer jogar e não mexer em nada, `gamemoderun %command%` já é suficiente na maioria dos casos. A configuração fina via `gamemode.ini` é para quando você quer reduzir a agressividade (por exemplo, em máquinas que esquentam muito com o governador `performance`).
:::

## Resumo

- `gamemoderun %command%` envolve o jogo e pede ao daemon `gamemoded` que ative as otimizações.
- O GameMode ajusta governador de CPU, prioridade de I/O e renice do processo do jogo.
- `gamemoded -s` e `gamemodeclient -l` mostram se o GameMode está ativo.
- É um serviço de usuário (`systemctl --user status gamemoded`), não de sistema.
- O ganho é de consistência de quadros, não necessariamente de FPS máximo.

## Exercícios

1. Verifique o estado do daemon com `gamemoded -s` e o serviço com `systemctl --user status gamemoded`.
2. Rode um jogo com `gamemoderun %command%` e, com ele aberto, confirme em outro terminal que `gamemodeclient -l` reporta ativo.
3. Compare o governador de CPU antes e durante o jogo (use algo como `cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor`).
4. Crie um `~/.config/gamemode.ini` com uma chave alterada e teste se o comportamento muda.
5. **Desafio.** Combine `gamemoderun` com um parâmetro de ambiente que você já viu (por exemplo, `DXVK_HUD`), escreva a linha completa de inicialização e explique por que `gamemoderun` vem antes do `%command%` mas depois das variáveis.
